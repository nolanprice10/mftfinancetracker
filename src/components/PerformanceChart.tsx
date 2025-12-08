import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface ChartDataPoint {
  date: string;
  price: number;
}

interface PerformanceChartProps {
  data: ChartDataPoint[];
  title: string;
  ticker: string;
  isLoading?: boolean;
}

export const PerformanceChart = ({ data, title, ticker, isLoading = false }: PerformanceChartProps) => {
  if (isLoading) {
    return (
      <Card className="shadow-elegant border-border/50 bg-gradient-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span>{title}</span>
            <span className="text-sm text-muted-foreground">Loading…</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-[200px] w-full flex items-center justify-center">
            <div className="animate-spin text-muted-foreground">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="3" strokeOpacity="0.2"/><path d="M22 12a10 10 0 0 0-10-10" strokeWidth="3" strokeLinecap="round"/></svg>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="shadow-elegant border-border/50 bg-gradient-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-[200px] w-full flex items-center justify-center text-sm text-muted-foreground">
            No data for the selected period
          </div>
        </CardContent>
      </Card>
    );
  }

  // Ensure incoming data is sorted and unique by date, then format for display
  const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const deduped: ChartDataPoint[] = [];
  for (const d of sorted) {
    if (!deduped.length || new Date(d.date).getTime() !== new Date(deduped[deduped.length - 1].date).getTime()) {
      deduped.push(d);
    }
  }

  const formattedData = deduped.map(point => ({
    date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    price: point.price
  }));

  const minPrice = Math.min(...data.map(d => d.price));
  const maxPrice = Math.max(...data.map(d => d.price));
  const priceChange = data.length > 1 ? ((data[data.length - 1].price - data[0].price) / data[0].price) * 100 : 0;
  const isPositive = priceChange >= 0;

  const strokeColor = isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))';
  const gradientId = `grad-${ticker}`;

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
            <LineChart data={formattedData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={strokeColor} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={strokeColor} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.06} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
                tickLine={false}
                axisLine={false}
                minTickGap={10}
              />
              <YAxis 
                domain={[minPrice * 0.98, maxPrice * 1.02]}
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value: any) => [`$${value.toFixed(2)}`, ticker]}
                labelFormatter={(label) => label}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Area type="monotone" dataKey="price" stroke={strokeColor} fill={`url(#${gradientId})`} fillOpacity={1} strokeWidth={2} dot={false} />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke={strokeColor} 
                strokeWidth={2}
                dot={false}
                animationDuration={700}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
