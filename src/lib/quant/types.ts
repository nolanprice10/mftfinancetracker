export interface DatasetVersion {
  version: string;
  lastUpdated: string;
  source: string;
  preprocessingSteps: string[];
  missingValuesHandled: string;
  schema: string[];
  rowCount: number;
  apiPath: string;
  downloads: {
    csv: string;
    json: string;
  };
}

export interface DatasetCatalogItem {
  id: string;
  name: string;
  assetClass: "Equities" | "Crypto" | "ETF" | "Economic";
  frequency: "Daily" | "Weekly" | "Monthly";
  description: string;
  tags: string[];
  versions: DatasetVersion[];
}

export interface DatasetCatalog {
  generatedAt: string;
  datasets: DatasetCatalogItem[];
}

export interface PriceBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface BacktestConfig {
  datasetId: string;
  datasetVersion: string;
  startingCapital: number;
  lookbackDays: number;
  entryThresholdPct: number;
  exitThresholdPct: number;
  positionSizePct: number;
  stopLossPct: number;
  takeProfitPct: number;
}

export interface BacktestPoint {
  date: string;
  equity: number;
  cash: number;
  positionValue: number;
  drawdownPct: number;
}

export interface Trade {
  date: string;
  action: "BUY" | "SELL";
  price: number;
  shares: number;
  reason: string;
  equityAfterTrade: number;
}

export interface BacktestMetrics {
  cumulativeReturnPct: number;
  maxDrawdownPct: number;
  volatilityPct: number;
  sharpeRatio: number;
  trades: number;
}

export interface BacktestResult {
  runId: string;
  config: BacktestConfig;
  metrics: BacktestMetrics;
  curve: BacktestPoint[];
  trades: Trade[];
}
