import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { CandlestickChart } from "./CandlestickChart";

interface ChartDataPoint {
  date: string;
  price: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
}

interface PerformanceChartProps {
  data: ChartDataPoint[];
  title: string;
  ticker: string;
  period?: string;
  chartType?: "line" | "area" | "candlestick";
}

export const PerformanceChart = ({ data, title, ticker, period = "1M", chartType = "line" }: PerformanceChartProps) => {
  if (!data || data.length === 0) {
    return null;
  }

  // Filter data based on period
  const now = new Date();
  const filteredData = data.filter(point => {
    const date = new Date(point.date);
    const daysDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    
    switch (period) {
      case "1D": return daysDiff <= 1;
      case "1W": return daysDiff <= 7;
      case "1M": return daysDiff <= 30;
      case "3M": return daysDiff <= 90;
      case "1Y": return daysDiff <= 365;
      default: return true;
    }
  });

  const displayData = filteredData.length > 0 ? filteredData : data;

  // For candlestick, generate OHLC data
  if (chartType === "candlestick") {
    const candlestickData = displayData.map((d, i) => {
      const prevPrice = i > 0 ? displayData[i - 1].price : d.price;
      const nextPrice = i < displayData.length - 1 ? displayData[i + 1].price : d.price;
      const volatility = d.price * 0.015; // 1.5% volatility
      
      return {
        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        open: prevPrice,
        high: Math.max(prevPrice, d.price, nextPrice) + volatility,
        low: Math.min(prevPrice, d.price, nextPrice) - volatility,
        close: d.price
      };
    });

    const priceChange = displayData.length > 1 ? ((displayData[displayData.length - 1].price - displayData[0].price) / displayData[0].price) * 100 : 0;
    const isPositive = priceChange >= 0;

    return (
      <Card className="shadow-elegant border-border/50 bg-gradient-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span>{title}</span>
            <span className={`text-sm ${isPositive ? 'text-success' : 'text-destructive'}`}>
              {isPositive ? '↑' : '↓'} {Math.abs(priceChange).toFixed(2)}%
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <CandlestickChart data={candlestickData} ticker={ticker} />
        </CardContent>
      </Card>
    );
  }

  // Format data for line/area charts
  const formattedData = displayData.map(point => ({
    date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    price: point.price
  }));

  const minPrice = Math.min(...displayData.map(d => d.price));
  const maxPrice = Math.max(...displayData.map(d => d.price));
  const priceChange = displayData.length > 1 ? ((displayData[displayData.length - 1].price - displayData[0].price) / displayData[0].price) * 100 : 0;
  const isPositive = priceChange >= 0;

  const renderChart = () => {
    const commonProps = {
      data: formattedData,
      margin: { top: 5, right: 5, left: -20, bottom: 5 }
    };

    const commonAxisProps = {
      xAxis: (
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 11 }}
          stroke="hsl(var(--muted-foreground))"
          tickLine={false}
          axisLine={false}
        />
      ),
      yAxis: (
        <YAxis 
          domain={[minPrice * 0.98, maxPrice * 1.02]}
          tick={{ fontSize: 11 }}
          stroke="hsl(var(--muted-foreground))"
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value.toFixed(0)}`}
        />
      ),
      tooltip: (
        <Tooltip 
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px'
          }}
          formatter={(value: any) => [`$${typeof value === 'number' ? value.toFixed(2) : '0.00'}`, ticker]}
          labelStyle={{ color: 'hsl(var(--foreground))' }}
        />
      )
    };

    if (chartType === "area") {
      return (
        <AreaChart {...commonProps}>
          <defs>
            <linearGradient id={`gradient-${ticker}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
          {commonAxisProps.xAxis}
          {commonAxisProps.yAxis}
          {commonAxisProps.tooltip}
          <Area 
            type="monotone" 
            dataKey="price" 
            stroke={isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} 
            fill={`url(#gradient-${ticker})`}
            strokeWidth={2}
            animationDuration={1000}
          />
        </AreaChart>
      );
    }

    // Default: line chart
    return (
      <LineChart {...commonProps}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
        {commonAxisProps.xAxis}
        {commonAxisProps.yAxis}
        {commonAxisProps.tooltip}
        <Line 
          type="monotone" 
          dataKey="price" 
          stroke={isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} 
          strokeWidth={2}
          dot={false}
          animationDuration={1000}
        />
      </LineChart>
    );
  };

  return (
    <Card className="shadow-elegant border-border/50 bg-gradient-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>{title}</span>
          <span className={`text-sm ${isPositive ? 'text-success' : 'text-destructive'}`}>
            {isPositive ? '↑' : '↓'} {Math.abs(priceChange).toFixed(2)}%
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
