import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

interface CandlestickDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface CandlestickChartProps {
  data: CandlestickDataPoint[];
  ticker: string;
}

export const CandlestickChart = ({ data, ticker }: CandlestickChartProps) => {
  if (!data || data.length === 0) return null;

  // Transform data for candlestick rendering
  const chartData = data.map(d => ({
    date: d.date,
    // Wick (high to low line)
    wickRange: [d.low, d.high],
    // Body (open to close bar)
    bodyLow: Math.min(d.open, d.close),
    bodyHigh: Math.max(d.open, d.close),
    bodyRange: [Math.min(d.open, d.close), Math.max(d.open, d.close)],
    // Color based on bullish/bearish
    bullish: d.close >= d.open,
    open: d.open,
    high: d.high,
    low: d.low,
    close: d.close
  }));

  const CustomBar = (props: any) => {
    const { x, y, width, height, fill } = props;
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        stroke={fill}
        strokeWidth={1}
      />
    );
  };

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 11 }}
            stroke="hsl(var(--muted-foreground))"
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
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
            content={({ payload }) => {
              if (!payload || !payload.length) return null;
              const data = payload[0].payload;
              return (
                <div className="bg-card border border-border rounded-lg p-2">
                  <div className="font-semibold mb-1">{ticker}</div>
                  <div className="space-y-0.5 text-xs">
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Open:</span>
                      <span className="font-medium">${data.open.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">High:</span>
                      <span className="font-medium text-success">${data.high.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Low:</span>
                      <span className="font-medium text-destructive">${data.low.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Close:</span>
                      <span className="font-medium">${data.close.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between gap-4 pt-1 border-t border-border mt-1">
                      <span className="text-muted-foreground">Change:</span>
                      <span className={data.bullish ? "font-medium text-success" : "font-medium text-destructive"}>
                        {data.bullish ? "↑" : "↓"} ${Math.abs(data.close - data.open).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }}
          />
          
          {/* Wicks (High-Low lines) */}
          <Line 
            type="monotone" 
            dataKey="high"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={1}
            dot={false}
            isAnimationActive={false}
          />
          <Line 
            type="monotone" 
            dataKey="low"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={1}
            dot={false}
            isAnimationActive={false}
          />
          
          {/* Candle bodies */}
          <Bar dataKey="bodyRange" shape={<CustomBar />} barSize={8}>
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.bullish ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
              />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
