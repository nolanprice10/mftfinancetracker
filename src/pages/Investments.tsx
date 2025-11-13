import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Edit, Trash2, AlertTriangle, Shield, Target, Bitcoin, RefreshCw, BookOpen } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { PerformanceChart } from "@/components/PerformanceChart";
import { useFormInput } from "@/hooks/useFormInput";

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
  annual_apy?: number;
  source_account_id?: string;
}

interface Account {
  id: string;
  name: string;
  balance: number;
  type: string;
}

interface PriceData {
  price: number;
  change24h: number;
  history: Array<{ date: string; price: number }>;
}

const Investments = () => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [priceData, setPriceData] = useState<Record<string, PriceData>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [userAge, setUserAge] = useState<number | null>(null);
  
  // Use useFormInput for all text inputs to prevent keyboard dismissal
  const nameInput = useFormInput("");
  const tickerInput = useFormInput("");
  const sharesInput = useFormInput("");
  const pricePerShareInput = useFormInput("");
  const currentValueInput = useFormInput("");
  const monthlyContributionInput = useFormInput("");
  const annualReturnInput = useFormInput("7");
  const yearsRemainingInput = useFormInput("10");
  const apyInput = useFormInput("");
  
  const [formType, setFormType] = useState("index_fund");
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [fetchingPrice, setFetchingPrice] = useState(false);

  useEffect(() => {
    fetchInvestments();
    fetchUserAge();
    // Auto-refresh prices every 10 seconds for near real-time updates
    const interval = setInterval(() => {
      refreshPrices();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Auto-calculate current value when shares or price changes
  useEffect(() => {
    const shares = parseFloat(sharesInput.value);
    const price = parseFloat(pricePerShareInput.value);
    if (!isNaN(shares) && !isNaN(price) && shares > 0 && price > 0) {
      const total = (shares * price).toString();
      if (currentValueInput.value !== total) {
        currentValueInput.onChange({ target: { value: total } } as any);
      }
    }
  }, [sharesInput.value, pricePerShareInput.value]);

  useEffect(() => {
    // Fetch price data for all investments with tickers
    investments.forEach(inv => {
      if (inv.ticker_symbol && (inv.type === "individual_stock" || inv.type === "crypto")) {
        fetchPriceData(inv.ticker_symbol, inv.type);
      }
    });
  }, [investments]);

  const fetchUserAge = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("birthday")
        .eq("id", user.id)
        .single();

      if (profile?.birthday) {
        const birthDate = new Date(profile.birthday);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        setUserAge(age);
      }
    } catch (error) {
      console.error("Error fetching user age:", error);
    }
  };

  const fetchInvestments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [investmentsRes, accountsRes] = await Promise.all([
        supabase.from("investments").select("*").eq("user_id", user.id),
        supabase.from("accounts").select("*").eq("user_id", user.id),
      ]);

      if (investmentsRes.error) throw investmentsRes.error;
      setInvestments(investmentsRes.data || []);
      if (accountsRes.data) setAccounts(accountsRes.data);
    } catch (error) {
      toast.error("Failed to load investments");
    } finally {
      setLoading(false);
    }
  };

  const fetchPriceData = async (ticker: string, type: string) => {
    try {
      const response = await supabase.functions.invoke('fetch-stock-price', {
        body: { ticker, type }
      });

      if (response.data?.success) {
        setPriceData(prev => ({
          ...prev,
          [ticker]: {
            price: response.data.price,
            change24h: response.data.change24h,
            history: response.data.history || []
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching price data:', error);
    }
  };

  const refreshPrices = async () => {
    if (investments.length === 0) return;
    setRefreshing(true);
    const promises = investments
      .filter(inv => inv.ticker_symbol && (inv.type === "individual_stock" || inv.type === "crypto"))
      .map(inv => fetchPriceData(inv.ticker_symbol!, inv.type));
    await Promise.all(promises);
    setRefreshing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Validate source account
      if (!sourceAccountId) {
        toast.error("Please select a source account");
        return;
      }

      const sourceAccount = accounts.find(a => a.id === sourceAccountId);
      if (!sourceAccount) {
        toast.error("Invalid source account");
        return;
      }

      const investmentAmount = parseFloat(currentValueInput.value);
      if (isNaN(investmentAmount) || investmentAmount <= 0) {
        toast.error("Please enter a valid investment amount");
        return;
      }

      if (sourceAccount.balance < investmentAmount) {
        toast.error(`Insufficient funds. Account balance: $${sourceAccount.balance.toFixed(2)}`);
        return;
      }

      const isCryptoOrStock = formType === "individual_stock" || formType === "crypto";
      
      const { investmentSchema } = await import("@/lib/validation");
      const validationResult = investmentSchema.safeParse({
        name: nameInput.value,
        type: formType,
        current_value: investmentAmount,
        monthly_contribution: parseFloat(monthlyContributionInput.value || "0"),
        annual_return_pct: parseFloat(annualReturnInput.value),
        years_remaining: parseFloat(yearsRemainingInput.value),
        ticker_symbol: isCryptoOrStock ? tickerInput.value || null : null,
        shares_owned: isCryptoOrStock && sharesInput.value ? parseFloat(sharesInput.value) : null,
        purchase_price_per_share: isCryptoOrStock && pricePerShareInput.value ? parseFloat(pricePerShareInput.value) : null
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
        purchase_price_per_share: validated.purchase_price_per_share,
        source_account_id: sourceAccountId,
        annual_apy: formType === "savings" && apyInput.value ? parseFloat(apyInput.value) : 0
      };

      // If high-yield savings, create an account
      if (formType === "savings") {
        const { error: accountError } = await supabase.from("accounts").insert({
          user_id: user.id,
          name: nameInput.value,
          type: "savings",
          balance: investmentAmount,
          notes: `High-yield savings with ${apyInput.value || 0}% APY`
        });

        if (accountError) throw accountError;
        toast.success(`Created savings account: ${nameInput.value}`);
      }

      const { error } = await supabase.from("investments").insert(investmentData);
      if (error) throw error;

      // Deduct funds from source account
      const { error: updateError } = await supabase
        .from("accounts")
        .update({ balance: sourceAccount.balance - investmentAmount })
        .eq("id", sourceAccountId);

      if (updateError) throw updateError;

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
      const isCryptoOrStock = formType === "individual_stock" || formType === "crypto";
      
      const { investmentSchema } = await import("@/lib/validation");
      const validationResult = investmentSchema.safeParse({
        name: nameInput.value,
        type: formType,
        current_value: parseFloat(currentValueInput.value),
        monthly_contribution: parseFloat(monthlyContributionInput.value || "0"),
        annual_return_pct: parseFloat(annualReturnInput.value),
        years_remaining: parseFloat(yearsRemainingInput.value),
        ticker_symbol: isCryptoOrStock ? tickerInput.value || null : null,
        shares_owned: isCryptoOrStock && sharesInput.value ? parseFloat(sharesInput.value) : null,
        purchase_price_per_share: isCryptoOrStock && pricePerShareInput.value ? parseFloat(pricePerShareInput.value) : null
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
    nameInput.reset();
    tickerInput.reset();
    sharesInput.reset();
    pricePerShareInput.reset();
    currentValueInput.reset();
    monthlyContributionInput.reset();
    annualReturnInput.reset();
    yearsRemainingInput.reset();
    apyInput.reset();
    setFormType("index_fund");
    setSourceAccountId("");
  };

  // Memoized handlers to prevent keyboard dismissal
  const handleTickerChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = formType === "crypto" ? e.target.value.toLowerCase() : e.target.value.toUpperCase();
    tickerInput.onChange({ target: { value } } as any);
  }, [formType, tickerInput]);

  const fetchPrice = async (ticker: string, type: string) => {
    if (!ticker) return;
    
    setFetchingPrice(true);
    try {
      const response = await supabase.functions.invoke('fetch-stock-price', {
        body: { ticker, type }
      });

      if (response.data?.success && response.data?.price) {
        const price = response.data.price;
        const shares = parseFloat(sharesInput.value) || 0;
        
        // Update using the input's internal state setter
        const priceStr = price.toString();
        const valueStr = shares > 0 ? (price * shares).toString() : priceStr;
        
        // Manually trigger updates
        pricePerShareInput.onChange({ target: { value: priceStr } } as any);
        currentValueInput.onChange({ target: { value: valueStr } } as any);
        
        toast.success(`Current price for ${ticker}: $${price} ${response.data.change24h !== undefined ? `(${response.data.change24h > 0 ? '+' : ''}${response.data.change24h.toFixed(2)}%)` : ''}`);
      } else {
        toast.error(`Could not fetch price for ${ticker}`);
      }
    } catch (error: any) {
      console.error('Error fetching price:', error);
      toast.error('Failed to fetch price');
    } finally {
      setFetchingPrice(false);
    }
  };

  const openEditDialog = (investment: Investment) => {
    setSelectedInvestment(investment);
    nameInput.onChange({ target: { value: investment.name } } as any);
    setFormType(investment.type);
    currentValueInput.onChange({ target: { value: investment.current_value.toString() } } as any);
    monthlyContributionInput.onChange({ target: { value: investment.monthly_contribution.toString() } } as any);
    annualReturnInput.onChange({ target: { value: investment.annual_return_pct.toString() } } as any);
    yearsRemainingInput.onChange({ target: { value: investment.years_remaining.toString() } } as any);
    tickerInput.onChange({ target: { value: investment.ticker_symbol || "" } } as any);
    sharesInput.onChange({ target: { value: investment.shares_owned?.toString() || "" } } as any);
    pricePerShareInput.onChange({ target: { value: investment.purchase_price_per_share?.toString() || "" } } as any);
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
    crypto: "bg-warning text-warning-foreground",
    savings: "bg-muted text-muted-foreground",
    other: "bg-info text-info-foreground",
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

    const riskScores: Record<string, number> = {
      individual_stock: 85,
      crypto: 95,
      taxable_etf: 55,
      index_fund: 45,
      roth_ira: 40,
      savings: 10,
      other: 50,
    };

    const portfolioRiskScore = Object.entries(percentages).reduce((score, [type, pct]) => {
      return score + (riskScores[type] || 50) * (pct / 100);
    }, 0);

    const numTypes = Object.keys(allocations).length;
    const diversificationScore = Math.min(100, (numTypes / 5) * 100);

    const largestAllocation = Math.max(...Object.values(percentages));
    const concentrationRisk = largestAllocation > 50 ? "High" : largestAllocation > 30 ? "Medium" : "Low";

    let riskLevel: "Conservative" | "Moderate" | "Aggressive" | "Very Aggressive";
    let riskColor: string;
    let recommendations: string[];

    if (portfolioRiskScore < 30) {
      riskLevel = "Conservative";
      riskColor = "text-success";
      recommendations = [
        "Well-balanced for capital preservation",
        "Consider growth investments for long-term gains",
        "Stability-focused with lower returns",
      ];
    } else if (portfolioRiskScore < 50) {
      riskLevel = "Moderate";
      riskColor = "text-primary";
      recommendations = [
        "Balanced growth and security approach",
        "Good risk/reward balance",
        "Consider tax-advantaged accounts",
      ];
    } else if (portfolioRiskScore < 70) {
      riskLevel = "Aggressive";
      riskColor = "text-warning";
      recommendations = [
        "Higher growth with increased volatility",
        "Ensure emergency fund is separate",
        "Review concentration risk",
      ];
    } else {
      riskLevel = "Very Aggressive";
      riskColor = "text-destructive";
      recommendations = [
        "Very high risk - significant volatility",
        "Consider diversifying into stable assets",
        "Only suitable for 10+ year horizon",
        "Prepare for 30-50% portfolio swings",
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

  const InvestmentForm = ({ onSubmit, buttonText }: { onSubmit: (e: React.FormEvent) => void; buttonText: string }) => {
    const isCryptoOrStock = formType === "individual_stock" || formType === "crypto";
    
    return (
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Source Account (funds will be deducted)</Label>
          <Select value={sourceAccountId} onValueChange={setSourceAccountId} required>
            <SelectTrigger>
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map(account => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} (${account.balance.toFixed(2)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Investment Name</Label>
          <Input
            placeholder="e.g., Roth IRA, AAPL Stock, Bitcoin"
            value={nameInput.value}
            onChange={nameInput.onChange}
            autoComplete="off"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={formType} onValueChange={setFormType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="roth_ira">Roth IRA</SelectItem>
              <SelectItem value="taxable_etf">Taxable ETF</SelectItem>
              <SelectItem value="index_fund">Index Fund</SelectItem>
              <SelectItem value="individual_stock">Individual Stock</SelectItem>
              <SelectItem value="crypto">Cryptocurrency</SelectItem>
              <SelectItem value="savings">High-Yield Savings</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {formType === "savings" && (
          <div className="space-y-2">
            <Label>Annual APY (%)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="4.5"
              value={apyInput.value}
              onChange={apyInput.onChange}
              autoComplete="off"
              required
            />
          </div>
        )}

        {isCryptoOrStock ? (
          <>
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label>{formType === "crypto" ? "Crypto ID" : "Ticker Symbol"}</Label>
                  <Input
                    placeholder={formType === "crypto" ? "e.g., bitcoin, ethereum, cardano" : "e.g., AAPL, MSFT, GOOGL"}
                    value={tickerInput.value}
                    onChange={handleTickerChange}
                    autoComplete="off"
                    required
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={() => fetchPrice(tickerInput.value, formType)}
                    disabled={!tickerInput.value || fetchingPrice}
                    variant="outline"
                  >
                    {fetchingPrice ? "Fetching..." : "Get Price"}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {formType === "crypto" ? "Price from CoinGecko API" : "Price from Yahoo Finance"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{formType === "crypto" ? "Amount Owned" : "Shares Owned"}</Label>
                <Input
                  type="number"
                  step="0.001"
                  placeholder="10"
                  value={sharesInput.value}
                  onChange={sharesInput.onChange}
                  autoComplete="off"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Current Price per {formType === "crypto" ? "Unit" : "Share"}</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Auto-fetched"
                  value={pricePerShareInput.value}
                  onChange={pricePerShareInput.onChange}
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
                value={currentValueInput.value}
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
                  value={currentValueInput.value}
                  onChange={currentValueInput.onChange}
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
                  value={monthlyContributionInput.value}
                  onChange={monthlyContributionInput.onChange}
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
                  value={annualReturnInput.value}
                  onChange={annualReturnInput.onChange}
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
                  value={yearsRemainingInput.value}
                  onChange={yearsRemainingInput.onChange}
                  autoComplete="off"
                  required
                />
              </div>
            </div>
          </>
        )}

        {!isCryptoOrStock && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Expected Annual Return (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="7"
                  value={annualReturnInput.value}
                  onChange={annualReturnInput.onChange}
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
                  value={yearsRemainingInput.value}
                  onChange={yearsRemainingInput.onChange}
                  autoComplete="off"
                  required
                />
              </div>
            </div>
          </>
        )}

        <Button type="submit" className="w-full shadow-elegant hover:shadow-luxe">
          {buttonText}
        </Button>
      </form>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-8 animate-luxe-fade-in">
          <div className="text-center">Loading investments...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 space-y-6 animate-luxe-fade-in">
        {userAge !== null && userAge < 18 && (
          <Card className="shadow-elegant border-primary/30 bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <BookOpen className="w-5 h-5" />
                Getting Started with Investing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                As someone under 18, you'll need a parent or guardian to help you get started. Here's what you should know:
              </p>
              <div className="space-y-2">
                <div>
                  <strong className="text-foreground">Custodial Accounts (UGMA/UTMA):</strong>
                  <p className="text-muted-foreground">An adult manages the account until you're 18-21. Available at Fidelity, Schwab, and Vanguard.</p>
                </div>
                <div>
                  <strong className="text-foreground">Learn First:</strong>
                  <p className="text-muted-foreground">Study basics like compound interest, diversification, and index funds. Recommended: "The Simple Path to Wealth" by JL Collins.</p>
                </div>
                <div>
                  <strong className="text-foreground">Start Small:</strong>
                  <p className="text-muted-foreground">Paper trading apps like Webull Paper Trading or Investopedia Simulator let you practice without real money.</p>
                </div>
                <div>
                  <strong className="text-foreground">Age-Appropriate Options:</strong>
                  <p className="text-muted-foreground">Consider savings bonds (available at any age) or helping your parents choose investments you can learn from.</p>
                </div>
                <div>
                  <strong className="text-foreground">What to Avoid:</strong>
                  <p className="text-muted-foreground">Stay away from crypto, day trading, and high-risk individual stocks until you have more experience. Focus on learning and building good habits.</p>
                </div>
              </div>
              <p className="text-primary font-medium mt-4">
                Use this tracker to plan and learn—when you turn 18, you'll be ready to invest confidently!
              </p>
            </CardContent>
          </Card>
        )}
        
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-wealth bg-clip-text text-transparent">
            Investment Portfolio
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={refreshPrices} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="shadow-elegant hover:shadow-luxe">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Investment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Investment</DialogTitle>
                  <DialogDescription>Track stocks, crypto, ETFs, and more</DialogDescription>
                </DialogHeader>
                <InvestmentForm onSubmit={handleSubmit} buttonText="Add Investment" />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-children">
          <Card className="shadow-luxe hover:shadow-glow transition-all duration-300 bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-success" />
                Total Current Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${totalCurrentValue.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="shadow-luxe hover:shadow-glow transition-all duration-300 bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Projected Future Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${totalFutureValue.toFixed(2)}</div>
              <p className="text-sm text-muted-foreground mt-2">
                Potential gain: ${(totalFutureValue - totalCurrentValue).toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        {riskAnalysis && (
          <Card className="shadow-elegant border-border/50 bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Portfolio Risk Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Risk Level</div>
                  <div className={`text-xl font-bold ${riskAnalysis.riskColor}`}>
                    {riskAnalysis.riskLevel}
                  </div>
                  <div className="text-xs text-muted-foreground">Score: {riskAnalysis.riskScore.toFixed(0)}/100</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Diversification</div>
                  <div className="text-xl font-bold">{riskAnalysis.diversificationScore.toFixed(0)}%</div>
                  <Progress value={riskAnalysis.diversificationScore} className="mt-1" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Concentration Risk</div>
                  <div className="text-xl font-bold">{riskAnalysis.concentrationRisk}</div>
                  <div className="text-xs text-muted-foreground">Largest: {riskAnalysis.largestAllocation.toFixed(1)}%</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Recommendations:</div>
                <ul className="space-y-1">
                  {riskAnalysis.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {investments.map((investment) => {
            const futureValue = calculateFutureValue(investment);
            const gain = futureValue - Number(investment.current_value);
            const hasChart = investment.ticker_symbol && priceData[investment.ticker_symbol]?.history;

            return (
              <Card key={investment.id} className="shadow-elegant hover:shadow-luxe transition-all duration-300 border-border/50 bg-gradient-card">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{investment.name}</CardTitle>
                        {investment.type === "crypto" && <Bitcoin className="w-4 h-4 text-warning" />}
                      </div>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Badge className={investmentTypeColors[investment.type]}>
                          {investment.type.replace(/_/g, ' ')}
                        </Badge>
                        {investment.ticker_symbol && (
                          <span className="text-xs font-mono">{investment.ticker_symbol}</span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(investment)}
                        className="hover:bg-primary/10"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedInvestment(investment);
                          setDeleteDialogOpen(true);
                        }}
                        className="hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hasChart && (
                    <PerformanceChart 
                      data={priceData[investment.ticker_symbol!].history}
                      title="30-Day Performance"
                      ticker={investment.ticker_symbol!}
                    />
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Current Value</div>
                      <div className="text-xl font-bold">${Number(investment.current_value).toFixed(2)}</div>
                      {investment.shares_owned && (
                        <div className="text-xs text-muted-foreground">
                          {investment.shares_owned} {investment.type === "crypto" ? "units" : "shares"} × ${investment.purchase_price_per_share?.toFixed(2)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Projected ({investment.years_remaining}y)</div>
                      <div className="text-xl font-bold text-success">${futureValue.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">
                        +${gain.toFixed(2)} ({((gain / Number(investment.current_value)) * 100).toFixed(1)}%)
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Monthly Contribution</div>
                      <div className="font-medium">${Number(investment.monthly_contribution).toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Expected Return</div>
                      <div className="font-medium">{Number(investment.annual_return_pct).toFixed(1)}% annually</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {investments.length === 0 && (
          <Card className="shadow-elegant border-border/50 bg-gradient-card">
            <CardContent className="py-12 text-center">
              <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Investments Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking your stocks, crypto, ETFs, and retirement accounts
              </p>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Investment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Investment</DialogTitle>
                    <DialogDescription>Track stocks, crypto, ETFs, and more</DialogDescription>
                  </DialogHeader>
                  <InvestmentForm onSubmit={handleSubmit} buttonText="Add Investment" />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Investment</DialogTitle>
              <DialogDescription>Update your investment details</DialogDescription>
            </DialogHeader>
            <InvestmentForm onSubmit={handleEdit} buttonText="Update Investment" />
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Investment?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{selectedInvestment?.name}". This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
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
