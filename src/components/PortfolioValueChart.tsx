import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { supabase } from "@/integrations/supabase/client";

interface PortfolioValueChartProps {
  currentTotalValue: number;
}

export const PortfolioValueChart = ({ currentTotalValue }: PortfolioValueChartProps) => {
  const [historicalData, setHistoricalData] = useState<Array<{ date: string; value: number }>>([]);

  useEffect(() => {
    // Generate historical data based on current value
    // In a real app, you'd store and retrieve actual historical values
    const generateHistoricalData = () => {
      const data = [];
      const today = new Date();
      const daysToShow = 30;

      for (let i = daysToShow; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Simulate historical values with slight variations
        // Current value with some random walk backwards in time
        const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
        const dayFactor = i / daysToShow; // Gradually decrease going back in time
        const historicalValue = currentTotalValue * (0.85 + (0.15 * (1 - dayFactor))) * (1 + variation);
        
        data.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: Math.round(historicalValue * 100) / 100
        });
      }

      return data;
    };

    setHistoricalData(generateHistoricalData());
  }, [currentTotalValue]);

  if (historicalData.length === 0) return null;

  const firstValue = historicalData[0]?.value || 0;
  const lastValue = historicalData[historicalData.length - 1]?.value || 0;
  const change = lastValue - firstValue;
  const changePercent = firstValue > 0 ? (change / firstValue) * 100 : 0;
  const isPositive = change >= 0;

  return (
    <Card className="shadow-elegant border-border/50 bg-gradient-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>Total Portfolio Value (30 Days)</span>
          <div className="flex flex-col items-end">
            <span className="text-lg font-bold">
              ${lastValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`text-sm ${isPositive ? 'text-success' : 'text-destructive'}`}>
              {isPositive ? '↑' : '↓'} ${Math.abs(change).toFixed(2)} ({Math.abs(changePercent).toFixed(1)}%)
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historicalData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPositive ? 'hsl(var(--success))' : 'hsl(var(--primary))'} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={isPositive ? 'hsl(var(--success))' : 'hsl(var(--primary))'} stopOpacity={0}/>
                </linearGradient>
              </defs>
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
                tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value: any) => [`$${value.toLocaleString()}`, 'Portfolio Value']}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={isPositive ? 'hsl(var(--success))' : 'hsl(var(--primary))'} 
                fill="url(#portfolioGradient)"
                strokeWidth={2}
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
