import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface ValueProjectionChartProps {
  currentValue: number;
  monthlyContribution: number;
  annualReturn: number;
  years: number;
}

export const ValueProjectionChart = ({ 
  currentValue, 
  monthlyContribution, 
  annualReturn, 
  years 
}: ValueProjectionChartProps) => {
  // Calculate projected value over time
  const generateProjection = () => {
    const data = [];
    const monthlyRate = annualReturn / 100 / 12;
    let value = currentValue;

    // Generate monthly projections
    const totalMonths = years * 12;
    for (let month = 0; month <= totalMonths; month++) {
      if (month > 0) {
        // Add monthly contribution
        value += monthlyContribution;
        // Apply monthly return
        value *= (1 + monthlyRate);
      }

      // Only add data points every 3 months to avoid cluttering
      if (month % 3 === 0) {
        const date = new Date();
        date.setMonth(date.getMonth() + month);
        
        data.push({
          date: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          value: Math.round(value * 100) / 100,
          contributions: currentValue + (monthlyContribution * month)
        });
      }
    }

    return data;
  };

  const projectionData = generateProjection();
  const finalValue = projectionData[projectionData.length - 1]?.value || 0;
  const totalContributions = projectionData[projectionData.length - 1]?.contributions || 0;
  const totalGain = finalValue - totalContributions;
  const gainPercent = totalContributions > 0 ? (totalGain / totalContributions) * 100 : 0;

  return (
    <Card className="shadow-elegant border-border/50 bg-gradient-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>Projected Value ({years} Years)</span>
          <span className="text-sm text-success">
            ${finalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </CardTitle>
        <div className="flex gap-4 text-xs text-muted-foreground mt-1">
          <span>Contributions: ${totalContributions.toLocaleString()}</span>
          <span className="text-success">Gain: ${totalGain.toLocaleString()} ({gainPercent.toFixed(1)}%)</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projectionData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
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
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value: any) => [`$${value.toLocaleString()}`, 'Value']}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--primary))" 
                fill="url(#valueGradient)"
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
