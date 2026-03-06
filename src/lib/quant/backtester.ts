import {
  BacktestConfig,
  BacktestMetrics,
  BacktestPoint,
  BacktestResult,
  PriceBar,
  Trade,
} from "@/lib/quant/types";

const clampPercent = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

export const sanitizeConfig = (config: BacktestConfig): BacktestConfig => {
  return {
    ...config,
    startingCapital: Math.max(100, config.startingCapital),
    lookbackDays: Math.max(1, Math.floor(config.lookbackDays)),
    entryThresholdPct: clampPercent(config.entryThresholdPct, -100, 100),
    exitThresholdPct: clampPercent(config.exitThresholdPct, -100, 100),
    positionSizePct: clampPercent(config.positionSizePct, 1, 100),
    stopLossPct: clampPercent(config.stopLossPct, 0.1, 50),
    takeProfitPct: clampPercent(config.takeProfitPct, 0.1, 200),
  };
};

const hashString = (value: string) => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `run_${(hash >>> 0).toString(16)}`;
};

const toDailyReturns = (curve: BacktestPoint[]) => {
  const returns: number[] = [];
  for (let i = 1; i < curve.length; i += 1) {
    const prev = curve[i - 1].equity;
    const current = curve[i].equity;
    if (prev > 0) {
      returns.push(current / prev - 1);
    }
  }
  return returns;
};

const mean = (values: number[]) => {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const stdDev = (values: number[]) => {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
};

const calculateMetrics = (curve: BacktestPoint[], trades: Trade[]): BacktestMetrics => {
  if (curve.length < 2) {
    return {
      cumulativeReturnPct: 0,
      maxDrawdownPct: 0,
      volatilityPct: 0,
      sharpeRatio: 0,
      trades: 0,
    };
  }

  const first = curve[0].equity;
  const last = curve[curve.length - 1].equity;
  const dailyReturns = toDailyReturns(curve);
  const vol = stdDev(dailyReturns) * Math.sqrt(252);
  const sharpe = vol === 0 ? 0 : (mean(dailyReturns) * Math.sqrt(252)) / vol;

  return {
    cumulativeReturnPct: ((last - first) / first) * 100,
    maxDrawdownPct: Math.min(...curve.map((point) => point.drawdownPct)),
    volatilityPct: vol * 100,
    sharpeRatio: sharpe,
    trades: trades.length,
  };
};

export const runBacktest = (bars: PriceBar[], rawConfig: BacktestConfig): BacktestResult => {
  const config = sanitizeConfig(rawConfig);
  const sortedBars = [...bars].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let cash = config.startingCapital;
  let shares = 0;
  let entryPrice = 0;
  let peakEquity = config.startingCapital;
  const curve: BacktestPoint[] = [];
  const trades: Trade[] = [];

  for (let i = 0; i < sortedBars.length; i += 1) {
    const currentBar = sortedBars[i];
    const currentPrice = currentBar.close;
    const positionValue = shares * currentPrice;
    const equity = cash + positionValue;

    const lookbackIndex = i - config.lookbackDays;
    const signalReturnPct =
      lookbackIndex >= 0 ? ((currentPrice - sortedBars[lookbackIndex].close) / sortedBars[lookbackIndex].close) * 100 : 0;

    const shouldEnter = shares === 0 && lookbackIndex >= 0 && signalReturnPct >= config.entryThresholdPct;
    const stopPrice = entryPrice * (1 - config.stopLossPct / 100);
    const takeProfitPrice = entryPrice * (1 + config.takeProfitPct / 100);
    const shouldExitBySignal = shares > 0 && signalReturnPct <= config.exitThresholdPct;
    const shouldExitByStop = shares > 0 && currentPrice <= stopPrice;
    const shouldExitByTakeProfit = shares > 0 && currentPrice >= takeProfitPrice;

    if (shouldEnter) {
      const allocation = equity * (config.positionSizePct / 100);
      const affordableShares = Math.floor(allocation / currentPrice);
      if (affordableShares > 0) {
        shares = affordableShares;
        entryPrice = currentPrice;
        cash -= shares * currentPrice;
        trades.push({
          date: currentBar.date,
          action: "BUY",
          price: currentPrice,
          shares,
          reason: `Momentum >= ${config.entryThresholdPct.toFixed(2)}%`,
          equityAfterTrade: cash + shares * currentPrice,
        });
      }
    } else if (shouldExitByStop || shouldExitByTakeProfit || shouldExitBySignal) {
      const proceeds = shares * currentPrice;
      cash += proceeds;
      const soldShares = shares;
      shares = 0;
      entryPrice = 0;

      let reason = `Momentum <= ${config.exitThresholdPct.toFixed(2)}%`;
      if (shouldExitByStop) reason = "Stop-loss";
      if (shouldExitByTakeProfit) reason = "Take-profit";

      trades.push({
        date: currentBar.date,
        action: "SELL",
        price: currentPrice,
        shares: soldShares,
        reason,
        equityAfterTrade: cash,
      });
    }

    const markedToMarketEquity = cash + shares * currentPrice;
    peakEquity = Math.max(peakEquity, markedToMarketEquity);
    const drawdownPct = peakEquity > 0 ? ((markedToMarketEquity - peakEquity) / peakEquity) * 100 : 0;

    curve.push({
      date: currentBar.date,
      equity: markedToMarketEquity,
      cash,
      positionValue: shares * currentPrice,
      drawdownPct,
    });
  }

  if (shares > 0 && sortedBars.length > 0) {
    const last = sortedBars[sortedBars.length - 1];
    cash += shares * last.close;
    trades.push({
      date: last.date,
      action: "SELL",
      price: last.close,
      shares,
      reason: "End-of-test close",
      equityAfterTrade: cash,
    });
    shares = 0;

    const finalPoint = curve[curve.length - 1];
    if (finalPoint) {
      finalPoint.cash = cash;
      finalPoint.positionValue = 0;
      finalPoint.equity = cash;
    }
  }

  const runId = hashString(JSON.stringify({
    config,
    firstDate: sortedBars[0]?.date,
    lastDate: sortedBars[sortedBars.length - 1]?.date,
    totalBars: sortedBars.length,
  }));

  return {
    runId,
    config,
    metrics: calculateMetrics(curve, trades),
    curve,
    trades,
  };
};
