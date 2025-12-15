import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TrendingUp, DollarSign, Calendar, Percent } from "lucide-react";

const InvestmentCalculator = () => {
  const [currentAge, setCurrentAge] = useState<string>("22");
  const [targetAge, setTargetAge] = useState<string>("25");
  const [monthlyInvestment, setMonthlyInvestment] = useState<string>("500");
  const [annualReturn, setAnnualReturn] = useState<string>("8");
  const [initialInvestment, setInitialInvestment] = useState<string>("1000");
  const [result, setResult] = useState<number | null>(null);

  const calculateInvestment = () => {
    const current = parseFloat(currentAge);
    const target = parseFloat(targetAge);
    const monthly = parseFloat(monthlyInvestment);
    const rate = parseFloat(annualReturn) / 100;
    const initial = parseFloat(initialInvestment);

    if (isNaN(current) || isNaN(target) || isNaN(monthly) || isNaN(rate) || isNaN(initial)) {
      return;
    }

    if (target <= current) {
      return;
    }

    const years = target - current;
    const months = years * 12;
    const monthlyRate = rate / 12;

    // Future value of initial investment
    const futureValueInitial = initial * Math.pow(1 + monthlyRate, months);

    // Future value of monthly contributions (annuity formula)
    const futureValueMonthly = monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);

    const totalValue = futureValueInitial + futureValueMonthly;
    setResult(totalValue);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const totalContributed = (parseFloat(initialInvestment) || 0) + 
    ((parseFloat(monthlyInvestment) || 0) * 12 * ((parseFloat(targetAge) || 0) - (parseFloat(currentAge) || 0)));
  
  const profit = result ? result - totalContributed : 0;

  return (
    <Card className="bg-card/70 backdrop-blur-md border-border/50 shadow-elegant">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <TrendingUp className="h-6 w-6 text-primary" />
          Compound Interest Calculator
        </CardTitle>
        <CardDescription>
          Built using quantitative finance formulas. See your wealth growth by age {targetAge || "25"} with compounding returns.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="currentAge" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Your Current Age
            </Label>
            <Input
              id="currentAge"
              type="number"
              value={currentAge}
              onChange={(e) => setCurrentAge(e.target.value)}
              placeholder="22"
              min="18"
              max="100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetAge" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Target Age
            </Label>
            <Input
              id="targetAge"
              type="number"
              value={targetAge}
              onChange={(e) => setTargetAge(e.target.value)}
              placeholder="25"
              min="18"
              max="100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="initialInvestment" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Starting Amount
            </Label>
            <Input
              id="initialInvestment"
              type="number"
              value={initialInvestment}
              onChange={(e) => setInitialInvestment(e.target.value)}
              placeholder="1000"
              min="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthlyInvestment" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Monthly Investment
            </Label>
            <Input
              id="monthlyInvestment"
              type="number"
              value={monthlyInvestment}
              onChange={(e) => setMonthlyInvestment(e.target.value)}
              placeholder="500"
              min="0"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="annualReturn" className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Expected Annual Return (%)
            </Label>
            <Input
              id="annualReturn"
              type="number"
              value={annualReturn}
              onChange={(e) => setAnnualReturn(e.target.value)}
              placeholder="8"
              min="0"
              max="50"
              step="0.1"
            />
            <p className="text-xs text-muted-foreground">
              Historical S&P 500 average: ~10% | Conservative estimate: 6-8%
            </p>
          </div>
        </div>

        <Button 
          onClick={calculateInvestment} 
          className="w-full bg-gradient-wealth text-lg py-6"
          size="lg"
        >
          Calculate Future Value
        </Button>

        {result !== null && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="p-6 rounded-lg bg-gradient-primary/10 border-2 border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">By age {targetAge}, you could have:</p>
              <p className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                {formatCurrency(result)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-card border border-border">
                <p className="text-xs text-muted-foreground mb-1">Total Contributed</p>
                <p className="text-xl font-semibold">{formatCurrency(totalContributed)}</p>
              </div>
              <div className="p-4 rounded-lg bg-gradient-wealth/10 border border-primary/20">
                <p className="text-xs text-muted-foreground mb-1">Investment Growth</p>
                <p className="text-xl font-semibold text-primary">+{formatCurrency(profit)}</p>
              </div>
            </div>

            <div className="text-center pt-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                💡 Want to track this in real-time and get personalized recommendations?
              </p>
              <Button 
                onClick={() => window.location.href = "/auth"}
                variant="outline"
                className="border-primary/50 hover:bg-primary/10"
              >
                Start Tracking Free →
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvestmentCalculator;
