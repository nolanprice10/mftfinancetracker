import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Edit, Trash2, AlertTriangle, Shield, Target } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";

interface Investment {
  id: string;
  name: string;
  type: string;
  current_value: number;
  monthly_contribution: number;
  annual_return_pct: number;
  years_remaining: number;
  ticker_symbol?: string;
  shares_owned?: number;
  purchase_price_per_share?: number;
}

const Investments = () => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "index_fund",
    current_value: "",
    monthly_contribution: "",
    annual_return_pct: "7",
    years_remaining: "10",
    ticker_symbol: "",
    shares_owned: "",
    purchase_price_per_share: "",
  });
  const [fetchingPrice, setFetchingPrice] = useState(false);

  useEffect(() => {
    fetchInvestments();
  }, []);

  const fetchInvestments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("investments")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      setInvestments(data || []);
    } catch (error) {
      toast.error("Failed to load investments");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Validate input data
      const { investmentSchema } = await import("@/lib/validation");
      const validationResult = investmentSchema.safeParse({
        name: formData.name,
        type: formData.type,
        current_value: parseFloat(formData.current_value),
        monthly_contribution: parseFloat(formData.monthly_contribution || "0"),
        annual_return_pct: parseFloat(formData.annual_return_pct),
        years_remaining: parseFloat(formData.years_remaining),
        ticker_symbol: formData.type === "individual_stock" ? formData.ticker_symbol || null : null,
        shares_owned: formData.type === "individual_stock" && formData.shares_owned ? parseFloat(formData.shares_owned) : null,
        purchase_price_per_share: formData.type === "individual_stock" && formData.purchase_price_per_share ? parseFloat(formData.purchase_price_per_share) : null
      });

      if (!validationResult.success) {
        toast.error(validationResult.error.errors[0].message);
        return;
      }

      const validated = validationResult.data;
      const investmentData: any = {
        user_id: user.id,
        name: validated.name,
        type: validated.type as any,
        current_value: validated.current_value,
        monthly_contribution: validated.monthly_contribution || 0,
        annual_return_pct: validated.annual_return_pct,
        years_remaining: validated.years_remaining,
        ticker_symbol: validated.ticker_symbol,
        shares_owned: validated.shares_owned,
        purchase_price_per_share: validated.purchase_price_per_share
      };

      const { error } = await supabase.from("investments").insert(investmentData);

      if (error) throw error;

      toast.success("Investment added successfully");
      setDialogOpen(false);
      resetForm();
      fetchInvestments();
    } catch (error: any) {
      toast.error(error.message || "Failed to add investment");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestment) return;

    try {
      // Validate input data
      const { investmentSchema } = await import("@/lib/validation");
      const validationResult = investmentSchema.safeParse({
        name: formData.name,
        type: formData.type,
        current_value: parseFloat(formData.current_value),
        monthly_contribution: parseFloat(formData.monthly_contribution || "0"),
        annual_return_pct: parseFloat(formData.annual_return_pct),
        years_remaining: parseFloat(formData.years_remaining),
        ticker_symbol: formData.type === "individual_stock" ? formData.ticker_symbol || null : null,
        shares_owned: formData.type === "individual_stock" && formData.shares_owned ? parseFloat(formData.shares_owned) : null,
        purchase_price_per_share: formData.type === "individual_stock" && formData.purchase_price_per_share ? parseFloat(formData.purchase_price_per_share) : null
      });

      if (!validationResult.success) {
        toast.error(validationResult.error.errors[0].message);
        return;
      }

      const validated = validationResult.data;
      const investmentData: any = {
        name: validated.name,
        type: validated.type as any,
        current_value: validated.current_value,
        monthly_contribution: validated.monthly_contribution || 0,
        annual_return_pct: validated.annual_return_pct,
        years_remaining: validated.years_remaining,
        ticker_symbol: validated.ticker_symbol,
        shares_owned: validated.shares_owned,
        purchase_price_per_share: validated.purchase_price_per_share
      };

      const { error } = await supabase
        .from("investments")
        .update(investmentData)
        .eq("id", selectedInvestment.id);

      if (error) throw error;

      toast.success("Investment updated successfully");
      setEditDialogOpen(false);
      setSelectedInvestment(null);
      fetchInvestments();
    } catch (error: any) {
      toast.error(error.message || "Failed to update investment");
    }
  };

  const handleDelete = async () => {
    if (!selectedInvestment) return;

    try {
      const { error } = await supabase
        .from("investments")
        .delete()
        .eq("id", selectedInvestment.id);

      if (error) throw error;

      toast.success("Investment deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedInvestment(null);
      fetchInvestments();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete investment");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "index_fund",
      current_value: "",
      monthly_contribution: "",
      annual_return_pct: "7",
      years_remaining: "10",
      ticker_symbol: "",
      shares_owned: "",
      purchase_price_per_share: "",
    });
  };

  const fetchStockPrice = async (ticker: string) => {
    if (!ticker) return;
    
    setFetchingPrice(true);
    try {
      const response = await supabase.functions.invoke('fetch-stock-price', {
        body: { ticker }
      });

      if (response.data?.success && response.data?.price) {
        const price = response.data.price;
        const shares = parseFloat(formData.shares_owned) || 0;
        
        setFormData(prev => ({
          ...prev,
          purchase_price_per_share: price.toString(),
          current_value: shares > 0 ? (price * shares).toString() : price.toString()
        }));
        
        toast.success(`Current price for ${ticker}: $${price}`);
      } else {
        toast.error(`Could not fetch price for ${ticker}`);
      }
    } catch (error: any) {
      console.error('Error fetching stock price:', error);
      toast.error('Failed to fetch stock price');
    } finally {
      setFetchingPrice(false);
    }
  };

  const openEditDialog = (investment: Investment) => {
    setSelectedInvestment(investment);
    setFormData({
      name: investment.name,
      type: investment.type,
      current_value: investment.current_value.toString(),
      monthly_contribution: investment.monthly_contribution.toString(),
      annual_return_pct: investment.annual_return_pct.toString(),
      years_remaining: investment.years_remaining.toString(),
      ticker_symbol: investment.ticker_symbol || "",
      shares_owned: investment.shares_owned?.toString() || "",
      purchase_price_per_share: investment.purchase_price_per_share?.toString() || "",
    });
    setEditDialogOpen(true);
  };

  const calculateFutureValue = (investment: Investment) => {
    const PV = Number(investment.current_value);
    const pmt = Number(investment.monthly_contribution);
    const annualReturnPct = Number(investment.annual_return_pct);
    const years = Number(investment.years_remaining);

    const r = (annualReturnPct / 100) / 12;
    const n = Math.round(years * 12);

    if (r === 0) {
      return PV + pmt * n;
    }

    const factor = Math.pow(1 + r, n);
    return PV * factor + pmt * ((factor - 1) / r);
  };

  const investmentTypeColors: Record<string, string> = {
    roth_ira: "bg-primary text-primary-foreground",
    taxable_etf: "bg-secondary text-secondary-foreground",
    index_fund: "bg-success text-success-foreground",
    individual_stock: "bg-accent text-accent-foreground",
    savings: "bg-muted text-muted-foreground",
    other: "bg-warning text-warning-foreground",
  };

  const totalCurrentValue = investments.reduce((sum, inv) => sum + Number(inv.current_value), 0);
  const totalFutureValue = investments.reduce((sum, inv) => sum + calculateFutureValue(inv), 0);

  // Portfolio Risk Analysis
  const analyzePortfolioRisk = () => {
    if (investments.length === 0) return null;

    const totalValue = totalCurrentValue;
    const allocations = investments.reduce((acc, inv) => {
      const type = inv.type;
      const value = Number(inv.current_value);
      acc[type] = (acc[type] || 0) + value;
      return acc;
    }, {} as Record<string, number>);

    const percentages = Object.entries(allocations).reduce((acc, [type, value]) => {
      acc[type] = (value / totalValue) * 100;
      return acc;
    }, {} as Record<string, number>);

    // Risk scoring: higher risk = higher score
    const riskScores: Record<string, number> = {
      individual_stock: 85,
      taxable_etf: 55,
      index_fund: 45,
      roth_ira: 40,
      savings: 10,
      other: 50,
    };

    const portfolioRiskScore = Object.entries(percentages).reduce((score, [type, pct]) => {
      return score + (riskScores[type] || 50) * (pct / 100);
    }, 0);

    // Diversification score (more types = better diversification)
    const numTypes = Object.keys(allocations).length;
    const diversificationScore = Math.min(100, (numTypes / 4) * 100);

    // Single investment concentration risk
    const largestAllocation = Math.max(...Object.values(percentages));
    const concentrationRisk = largestAllocation > 50 ? "High" : largestAllocation > 30 ? "Medium" : "Low";

    let riskLevel: "Conservative" | "Moderate" | "Aggressive" | "Very Aggressive";
    let riskColor: string;
    let recommendations: string[];

    if (portfolioRiskScore < 30) {
      riskLevel = "Conservative";
      riskColor = "text-success";
      recommendations = [
        "Your portfolio is well-balanced for capital preservation",
        "Consider adding growth investments for long-term gains",
        "High-yield savings provide stability but lower returns",
      ];
    } else if (portfolioRiskScore < 50) {
      riskLevel = "Moderate";
      riskColor = "text-primary";
      recommendations = [
        "Balanced approach between growth and security",
        "Good mix of risk and stability",
        "Consider tax-advantaged accounts like Roth IRA",
      ];
    } else if (portfolioRiskScore < 70) {
      riskLevel = "Aggressive";
      riskColor = "text-warning";
      recommendations = [
        "Higher growth potential with increased volatility",
        "Ensure emergency fund is separate from investments",
        "Review individual stock positions for over-concentration",
      ];
    } else {
      riskLevel = "Very Aggressive";
      riskColor = "text-destructive";
      recommendations = [
        "Very high risk - significant volatility expected",
        "Consider diversifying into index funds and bonds",
        "Only suitable if you have long time horizon (10+ years)",
        "Ensure you can withstand 30-50% portfolio declines",
      ];
    }

    return {
      riskLevel,
      riskScore: portfolioRiskScore,
      riskColor,
      diversificationScore,
      concentrationRisk,
      largestAllocation,
      allocations: percentages,
      recommendations,
    };
  };

  const riskAnalysis = analyzePortfolioRisk();

  const InvestmentForm = ({ onSubmit, buttonText }: { onSubmit: (e: React.FormEvent) => void; buttonText: string }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Investment Name</Label>
        <Input
          placeholder="e.g., Roth IRA, AAPL Stock"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          autoComplete="off"
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Type</Label>
        <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="roth_ira">Roth IRA</SelectItem>
            <SelectItem value="taxable_etf">Taxable ETF</SelectItem>
            <SelectItem value="index_fund">Index Fund</SelectItem>
            <SelectItem value="individual_stock">Individual Stock</SelectItem>
            <SelectItem value="savings">High-Yield Savings</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.type === "individual_stock" ? (
        <>
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label>Ticker Symbol</Label>
                <Input
                  placeholder="e.g., AAPL, MSFT, GOOGL"
                  value={formData.ticker_symbol}
                  onChange={(e) => {
                    const ticker = e.target.value.toUpperCase();
                    setFormData({ ...formData, ticker_symbol: ticker });
                  }}
                  onBlur={() => {
                    if (formData.ticker_symbol && formData.ticker_symbol.length > 0) {
                      fetchStockPrice(formData.ticker_symbol);
                    }
                  }}
                  autoComplete="off"
                  required
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={() => fetchStockPrice(formData.ticker_symbol)}
                  disabled={!formData.ticker_symbol || fetchingPrice}
                  variant="outline"
                >
                  {fetchingPrice ? "Fetching..." : "Get Price"}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Price fetched from Yahoo Finance
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Shares Owned</Label>
              <Input
                type="number"
                step="0.001"
                placeholder="10"
                value={formData.shares_owned}
                onChange={(e) => {
                  const shares = e.target.value;
                  const price = parseFloat(formData.purchase_price_per_share) || 0;
                  setFormData({ 
                    ...formData, 
                    shares_owned: shares,
                    current_value: shares && price > 0 ? (parseFloat(shares) * price).toString() : formData.current_value
                  });
                }}
                autoComplete="off"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Current Price/Share</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Auto-fetched"
                value={formData.purchase_price_per_share}
                onChange={(e) => {
                  const price = e.target.value;
                  const shares = parseFloat(formData.shares_owned) || 0;
                  setFormData({ 
                    ...formData, 
                    purchase_price_per_share: price,
                    current_value: price && shares > 0 ? (parseFloat(price) * shares).toString() : price
                  });
                }}
                autoComplete="off"
                required
                disabled={fetchingPrice}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Total Value</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="Calculated automatically"
              value={formData.current_value}
              disabled
            />
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Current Value</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="10000"
                value={formData.current_value}
                onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                autoComplete="off"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Monthly Contribution</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="500"
                value={formData.monthly_contribution}
                onChange={(e) => setFormData({ ...formData, monthly_contribution: e.target.value })}
                autoComplete="off"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Expected Annual Return (%)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="7"
                value={formData.annual_return_pct}
                onChange={(e) => setFormData({ ...formData, annual_return_pct: e.target.value })}
                autoComplete="off"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Years to Project</Label>
              <Input
                type="number"
                step="0.5"
                placeholder="10"
                value={formData.years_remaining}
                onChange={(e) => setFormData({ ...formData, years_remaining: e.target.value })}
                autoComplete="off"
                required
              />
            </div>
          </div>
        </>
      )}
      <Button type="submit" className="w-full">{buttonText}</Button>
    </form>
  );

  return (
    <Layout>
      <div className="space-y-8 animate-luxe-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-wealth bg-clip-text text-transparent">Investments</h1>
            <p className="text-muted-foreground">Portfolio analysis and wealth projections</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-elegant hover:shadow-luxe transition-all">
                <Plus className="h-4 w-4 mr-2" />
                Add Investment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Investment</DialogTitle>
                <DialogDescription>Track a new investment account</DialogDescription>
              </DialogHeader>
              <InvestmentForm onSubmit={handleSubmit} buttonText="Add Investment" />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-children">
          <Card className="bg-gradient-card shadow-luxe border-none overflow-hidden group hover:shadow-glow transition-all duration-500">
            <CardHeader className="relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-700"></div>
              <CardTitle className="text-xl relative z-10">Current Portfolio Value</CardTitle>
              <CardDescription className="relative z-10">Total wealth under management</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-5xl font-bold text-primary transition-all duration-300 group-hover:scale-105">
                ${totalCurrentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-success shadow-luxe border-none overflow-hidden group hover:shadow-glow transition-all duration-500">
            <CardHeader className="relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
              <CardTitle className="text-xl text-success-foreground relative z-10 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Projected Future Value
              </CardTitle>
              <CardDescription className="text-success-foreground/80 relative z-10">Compound growth trajectory</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-5xl font-bold text-success-foreground transition-all duration-300 group-hover:scale-105">
                ${totalFutureValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </div>

        {riskAnalysis && (
          <Card className="bg-gradient-card shadow-luxe border-none animate-luxe-fade-in overflow-hidden">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                Portfolio Risk Analysis
              </CardTitle>
              <CardDescription>Diversification and allocation assessment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Risk Profile</span>
                    <AlertTriangle className={`h-5 w-5 ${riskAnalysis.riskColor}`} />
                  </div>
                  <div className={`text-2xl font-bold ${riskAnalysis.riskColor}`}>
                    {riskAnalysis.riskLevel}
                  </div>
                  <Progress value={riskAnalysis.riskScore} className="h-2" />
                  <p className="text-xs text-muted-foreground">Risk Score: {riskAnalysis.riskScore.toFixed(0)}/100</p>
                </div>

                <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Diversification</span>
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div className={`text-2xl font-bold ${riskAnalysis.diversificationScore > 75 ? 'text-success' : riskAnalysis.diversificationScore > 50 ? 'text-primary' : 'text-warning'}`}>
                    {riskAnalysis.diversificationScore > 75 ? 'Excellent' : riskAnalysis.diversificationScore > 50 ? 'Good' : 'Limited'}
                  </div>
                  <Progress value={riskAnalysis.diversificationScore} className="h-2" />
                  <p className="text-xs text-muted-foreground">{Object.keys(riskAnalysis.allocations).length} asset types</p>
                </div>

                <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Concentration</span>
                    <Shield className={`h-5 w-5 ${riskAnalysis.concentrationRisk === 'Low' ? 'text-success' : riskAnalysis.concentrationRisk === 'Medium' ? 'text-warning' : 'text-destructive'}`} />
                  </div>
                  <div className={`text-2xl font-bold ${riskAnalysis.concentrationRisk === 'Low' ? 'text-success' : riskAnalysis.concentrationRisk === 'Medium' ? 'text-warning' : 'text-destructive'}`}>
                    {riskAnalysis.concentrationRisk}
                  </div>
                  <Progress value={riskAnalysis.largestAllocation} className="h-2" />
                  <p className="text-xs text-muted-foreground">Largest: {riskAnalysis.largestAllocation.toFixed(1)}%</p>
                </div>
              </div>

              <div className="space-y-3 p-5 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="font-semibold text-sm text-primary flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Allocation Breakdown
                </h4>
                <div className="space-y-2">
                  {Object.entries(riskAnalysis.allocations).map(([type, percentage]) => (
                    <div key={type} className="flex items-center justify-between gap-3">
                      <span className="text-sm capitalize">{type.replace(/_/g, ' ')}</span>
                      <div className="flex items-center gap-2 flex-1 max-w-xs">
                        <Progress value={percentage} className="h-2" />
                        <span className="text-sm font-medium min-w-[3rem] text-right">{percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 p-5 rounded-lg bg-muted/20 border border-border/50">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Recommendations
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {riskAnalysis.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 stagger-children">
          {loading ? (
            [1, 2].map((i) => (
              <Card key={i} className="animate-pulse shadow-elegant">
                <CardHeader className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-full"></div>
                </CardContent>
              </Card>
            ))
          ) : investments.length === 0 ? (
            <Card className="col-span-full shadow-luxe border-border/50">
              <CardContent className="text-center py-16">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <p className="text-muted-foreground text-lg">No investments yet</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Begin building your wealth portfolio</p>
              </CardContent>
            </Card>
          ) : (
            investments.map((investment) => {
              const futureValue = calculateFutureValue(investment);
              const totalGain = futureValue - Number(investment.current_value);
              const gainPercentage = (totalGain / Number(investment.current_value)) * 100;

              return (
                <Card key={investment.id} className="shadow-elegant hover:shadow-luxe transition-all duration-500 border-border/50 bg-gradient-card overflow-hidden group">
                  <CardHeader className="relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-700"></div>
                    <div className="flex items-start justify-between relative z-10">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2 transition-colors duration-300 group-hover:text-primary">
                          {investment.name}
                          {investment.ticker_symbol && (
                            <span className="ml-2 text-sm text-muted-foreground font-normal">({investment.ticker_symbol})</span>
                          )}
                        </CardTitle>
                        <Badge className={investmentTypeColors[investment.type] || "bg-primary"}>
                          {investment.type.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => openEditDialog(investment)}
                          className="hover:bg-primary/10 transition-all"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedInvestment(investment);
                            setDeleteDialogOpen(true);
                          }}
                          className="hover:bg-destructive/10 transition-all"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5 relative z-10">
                    {investment.type === "individual_stock" && investment.shares_owned ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                          <p className="text-xs text-muted-foreground mb-1.5">Shares Owned</p>
                          <p className="text-xl font-bold">{Number(investment.shares_owned).toFixed(3)}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                          <p className="text-xs text-muted-foreground mb-1.5">Price per Share</p>
                          <p className="text-xl font-bold">
                            ${(Number(investment.current_value) / Number(investment.shares_owned)).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                          <p className="text-xs text-muted-foreground mb-1.5">Current Value</p>
                          <p className="text-2xl font-bold">
                            ${Number(investment.current_value).toLocaleString()}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                          <p className="text-xs text-muted-foreground mb-1.5">Monthly +</p>
                          <p className="text-2xl font-bold text-success">
                            ${Number(investment.monthly_contribution).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-border/50">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Total Value</p>
                      <p className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent transition-all duration-300 group-hover:scale-105">
                        ${Number(investment.current_value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-border/50 p-4 rounded-lg bg-gradient-success/10">
                      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Projected in {investment.years_remaining} years @ {investment.annual_return_pct}% annual return
                      </p>
                      <p className="text-3xl font-bold bg-gradient-success bg-clip-text text-transparent">
                        ${futureValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-sm text-success mt-2 font-medium">
                        +${totalGain.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ({gainPercentage.toFixed(1)}% gain)
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <Card className="bg-muted/20 border-border/30 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Important Disclaimer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              This information is educational and illustrative only and should not be considered financial or investment advice. 
              Past performance does not guarantee future results. Individual stock values shown are user-entered estimates and may not reflect real-time market prices.
              Risk analysis is algorithmic and may not capture all portfolio risks. Consult a licensed financial advisor before making investment decisions.
            </p>
          </CardContent>
        </Card>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Investment</DialogTitle>
              <DialogDescription>Update investment details</DialogDescription>
            </DialogHeader>
            <InvestmentForm onSubmit={handleEdit} buttonText="Update Investment" />
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Investment</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this investment? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Investments;
