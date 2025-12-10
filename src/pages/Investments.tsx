import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Edit, Trash2, Shield, Target, Bitcoin, RefreshCw, BookOpen } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface InvestmentFormProps {
  formData: any;
  formType: string;
  setFormType: (v: string) => void;
  sourceAccountId: string;
  setSourceAccountId: (v: string) => void;
  accounts: Account[];
  handleInputChange: (field: keyof any, value: string) => void;
  fetchPrice: (ticker: string, type: string) => void;
  fetchingPrice: boolean;
  onSubmit: (e: React.FormEvent) => void;
  buttonText: string;
}

const InvestmentFormComponent: React.FC<InvestmentFormProps> = ({
  formData,
  formType,
  setFormType,
  sourceAccountId,
  setSourceAccountId,
  accounts,
  handleInputChange,
  fetchPrice,
  fetchingPrice,
  onSubmit,
  buttonText,
}) => {
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
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
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
            
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {/* No savings investment type — APY handled via Accounts, not Investments */}

      {isCryptoOrStock ? (
        <>
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label>{formType === "crypto" ? "Crypto ID" : "Ticker Symbol"}</Label>
                <Input
                  placeholder={formType === "crypto" ? "e.g., bitcoin, ethereum, cardano" : "e.g., AAPL, MSFT, GOOGL"}
                  value={formData.ticker}
                  onChange={(e) => {
                    const value = formType === "crypto" ? e.target.value.toLowerCase() : e.target.value.toUpperCase();
                    handleInputChange('ticker', value);
                  }}
                  autoComplete="off"
                  required
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={() => fetchPrice(formData.ticker, formType)}
                  disabled={!formData.ticker || fetchingPrice}
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
                value={formData.shares}
                onChange={(e) => handleInputChange('shares', e.target.value)}
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
                value={formData.pricePerShare}
                onChange={(e) => handleInputChange('pricePerShare', e.target.value)}
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
              value={formData.currentValue}
              disabled
            />
          </div>
          {/* Years to project not shown for individual stocks or crypto */}
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Current Value</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="1000"
                value={formData.currentValue}
                onChange={(e) => handleInputChange('currentValue', e.target.value)}
                autoComplete="off"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Monthly Contribution</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="100"
                value={formData.monthlyContribution}
                onChange={(e) => handleInputChange('monthlyContribution', e.target.value)}
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
                value={formData.annualReturn}
                onChange={(e) => handleInputChange('annualReturn', e.target.value)}
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
                value={formData.yearsRemaining}
                onChange={(e) => handleInputChange('yearsRemaining', e.target.value)}
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

const InvestmentForm = React.memo(InvestmentFormComponent);

const Investments = () => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  // priceData structure: { [TICKER_UPPER]: { latest: PriceData, [periodKey]: PriceData } }
  const [priceData, setPriceData] = useState<Record<string, Record<string, PriceData>>>({});
  // loading flags per ticker (keyed by uppercased ticker)
  const [priceLoading, setPriceLoading] = useState<Record<string, boolean>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [userAge, setUserAge] = useState<number | null>(null);
  // Use single, consistent chart period for all tickers to ensure reliable data
  const FIXED_PERIOD = "1M";
  
  // Form state using controlled inputs to prevent keyboard dismissal
  const [formData, setFormData] = useState({
    name: "",
    ticker: "",
    shares: "",
    pricePerShare: "",
    currentValue: "",
    monthlyContribution: "",
    annualReturn: "7",
    yearsRemaining: "10",
  });
  
  const [formType, setFormType] = useState("index_fund");
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [fetchingPrice, setFetchingPrice] = useState(false);

  useEffect(() => {
    fetchInvestments();
    fetchUserAge();
    // Auto-refresh prices every 60 seconds for real-time updates (reduced from 5s for API rate limits)
    const interval = setInterval(() => {
      refreshPrices();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto-calculate current value when shares or price changes with high precision
  useEffect(() => {
    const shares = parseFloat(formData.shares);
    const price = parseFloat(formData.pricePerShare);
    if (!isNaN(shares) && !isNaN(price) && shares > 0 && price > 0) {
      // Use high precision calculation
      const total = (shares * price).toFixed(6);
      const roundedTotal = parseFloat(total).toFixed(2);
      if (formData.currentValue !== roundedTotal) {
        setFormData(prev => ({ ...prev, currentValue: roundedTotal }));
      }
    }
  }, [formData.shares, formData.pricePerShare]);

  useEffect(() => {
    // Fetch price data for all investments with tickers using a fixed 1M daily period
    investments.forEach(inv => {
      if (inv.ticker_symbol && (inv.type === "individual_stock" || inv.type === "crypto")) {
        fetchPriceData(inv.ticker_symbol, inv.type, FIXED_PERIOD);
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

  const fetchPriceData = async (ticker: string, type: string, period: string = "1M") => {
    const tickerKey = ticker.toUpperCase();
    setPriceLoading(prev => ({ ...(prev), [tickerKey]: true }));
    try {
      // Map period key to Yahoo range/interval values
      const mapping: Record<string, { range: string; interval: string }> = {
        "1D": { range: "1d", interval: "5m" },
        "1W": { range: "5d", interval: "15m" },
        "1M": { range: "1mo", interval: "1d" },
        "3M": { range: "3mo", interval: "1d" },
        "1Y": { range: "1y", interval: "1d" },
      };

      const { range, interval } = mapping[period] || mapping["1M"];

      const response = await supabase.functions.invoke('fetch-stock-price', {
        body: { ticker: tickerKey, type, range, interval }
      });

      if (response.data?.success) {
        const entry: PriceData = {
          price: response.data.price,
          change24h: response.data.change24h,
          history: response.data.history || []
        };

        setPriceData(prev => ({
          ...prev,
          [tickerKey]: {
            ...(prev[tickerKey] || {}),
            latest: entry,
            [period]: entry,
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching price data:', error);
    } finally {
      setPriceLoading(prev => ({ ...(prev), [tickerKey]: false }));
    }
  };

  const refreshPrices = async () => {
    if (investments.length === 0) return;
    setRefreshing(true);
    const promises = investments
      .filter(inv => inv.ticker_symbol && (inv.type === "individual_stock" || inv.type === "crypto"))
      .map(inv => {
        return fetchPriceData(inv.ticker_symbol!, inv.type, FIXED_PERIOD);
      });
    await Promise.all(promises);
    setRefreshing(false);
  };

  // Handle input changes without losing focus
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const fetchPrice = async (ticker: string, type: string, period: string = "1M") => {
    if (!ticker) return;
    const tickerKey = ticker.toUpperCase();
    setPriceLoading(prev => ({ ...(prev), [tickerKey]: true }));
    setFetchingPrice(true);
    try {
      const mapping: Record<string, { range: string; interval: string }> = {
        "1D": { range: "1d", interval: "5m" },
        "1W": { range: "5d", interval: "15m" },
        "1M": { range: "1mo", interval: "1d" },
        "3M": { range: "3mo", interval: "1d" },
        "1Y": { range: "1y", interval: "1d" },
      };
      const { range, interval } = mapping[period] || mapping["1M"];

      const response = await supabase.functions.invoke('fetch-stock-price', {
        body: { ticker, type, range, interval }
      });

      if (response.data?.success && response.data?.price) {
        handleInputChange('pricePerShare', response.data.price.toString());
        // store price under latest and period
        const entry: PriceData = {
          price: response.data.price,
          change24h: response.data.change24h,
          history: response.data.history || []
        };
        setPriceData(prev => ({ ...(prev), [tickerKey]: { ...(prev[tickerKey] || {}), latest: entry, [period]: entry } }));
        toast.success(`Fetched price: $${response.data.price.toFixed(2)}`);
      } else {
        toast.error('Failed to fetch price - check ticker symbol');
      }
    } catch (error: any) {
      console.error('Error fetching price:', error);
      toast.error('Failed to fetch price');
    } finally {
      setFetchingPrice(false);
      setPriceLoading(prev => ({ ...(prev), [tickerKey]: false }));
    }
  };
      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const sourceAccount = accounts.find(a => a.id === sourceAccountId);
      if (!sourceAccount) {
        toast.error("Invalid source account");
        return;
      }

      const investmentAmount = parseFloat(formData.currentValue);
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
        name: formData.name,
        type: formType,
        current_value: investmentAmount,
        monthly_contribution: parseFloat(formData.monthlyContribution || "0"),
        annual_return_pct: parseFloat(formData.annualReturn),
        years_remaining: parseFloat(formData.yearsRemaining),
        ticker_symbol: isCryptoOrStock ? formData.ticker || null : null,
        shares_owned: isCryptoOrStock && formData.shares ? parseFloat(formData.shares) : null,
        purchase_price_per_share: isCryptoOrStock && formData.pricePerShare ? parseFloat(formData.pricePerShare) : null
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
        // no annual_apy stored from investments — savings are managed as Accounts
      };

      // Savings are not handled as investments here — accounts manage savings separately.

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
        name: formData.name,
        type: formType,
        current_value: parseFloat(formData.currentValue),
        monthly_contribution: parseFloat(formData.monthlyContribution || "0"),
        annual_return_pct: parseFloat(formData.annualReturn),
        years_remaining: parseFloat(formData.yearsRemaining),
        ticker_symbol: isCryptoOrStock ? formData.ticker || null : null,
        shares_owned: isCryptoOrStock && formData.shares ? parseFloat(formData.shares) : null,
        purchase_price_per_share: isCryptoOrStock && formData.pricePerShare ? parseFloat(formData.pricePerShare) : null
      });

      if (!validationResult.success) {
        toast.error(validationResult.error.errors[0].message);
        return;
      }

      const validated = validationResult.data;
      const { error } = await supabase.from("investments").update({
        name: validated.name,
        type: validated.type,
        current_value: validated.current_value,
        monthly_contribution: validated.monthly_contribution || 0,
        annual_return_pct: validated.annual_return_pct,
        years_remaining: validated.years_remaining,
        ticker_symbol: validated.ticker_symbol,
        shares_owned: validated.shares_owned,
        purchase_price_per_share: validated.purchase_price_per_share,
      }).eq("id", selectedInvestment.id);

      if (error) throw error;
      toast.success("Investment updated successfully");
      setEditDialogOpen(false);
      resetForm();
      fetchInvestments();
    } catch (error: any) {
      toast.error(error.message || "Failed to update investment");
    }
  };

  const handleDelete = async () => {
    if (!selectedInvestment) return;

    try {
      const { error } = await supabase.from("investments").delete().eq("id", selectedInvestment.id);
      if (error) throw error;
      toast.success("Investment deleted successfully");
      setDeleteDialogOpen(false);
      fetchInvestments();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete investment");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      ticker: "",
      shares: "",
      pricePerShare: "",
      currentValue: "",
      monthlyContribution: "",
      annualReturn: "7",
      yearsRemaining: "10",
    });
    setFormType("index_fund");
    setSourceAccountId("");
  };

  const openEditDialog = (investment: Investment) => {
    setSelectedInvestment(investment);
    setFormData({
      name: investment.name,
      ticker: investment.ticker_symbol || "",
      shares: investment.shares_owned?.toString() || "",
      pricePerShare: investment.purchase_price_per_share?.toString() || "",
      currentValue: investment.current_value.toString(),
      monthlyContribution: investment.monthly_contribution.toString(),
      annualReturn: investment.annual_return_pct.toString(),
      yearsRemaining: investment.years_remaining.toString(),
    });
    setFormType(investment.type === 'savings' ? 'other' : investment.type);
    setEditDialogOpen(true);
  };

  // Calculate future value using LIVE market data and historical performance
  const calculateFutureValue = (investment: Investment) => {
    const liveValue = getLiveValue(investment);
    const PV = liveValue; // Use live market value, not stale stored value
    const pmt = Number(investment.monthly_contribution);
    const years = Number(investment.years_remaining);

    // Validate inputs
    if (isNaN(PV) || isNaN(pmt) || isNaN(years) || years <= 0) {
      return PV || 0;
    }

    // Calculate market-based expected return using historical data where available
    let annualReturnPct = Number(investment.annual_return_pct);
    
    // For stocks/crypto with ticker symbols, use actual historical performance
    if ((investment.type === 'individual_stock' || investment.type === 'crypto') && investment.ticker_symbol) {
      const tickerKey = investment.ticker_symbol.toUpperCase();
      const history = priceData[tickerKey]?.[FIXED_PERIOD]?.history;
      
      if (history && history.length >= 20) {
        // Calculate annualized return from 30-day price history
        const startPrice = history[0].price;
        const endPrice = history[history.length - 1].price;
        const days = history.length;
        
        if (startPrice > 0 && endPrice > 0 && days > 0) {
          // Annualize the period return: ((endPrice/startPrice)^(365/days) - 1) * 100
          const periodReturn = endPrice / startPrice;
          const annualizedReturn = (Math.pow(periodReturn, 365 / days) - 1) * 100;
          
          // Use historical return if reasonable (between -50% and +200%)
          if (annualizedReturn > -50 && annualizedReturn < 200) {
            annualReturnPct = annualizedReturn;
          }
        }
      }
    }
    
    // Enhanced expected returns based on asset type (used as fallback)
    const marketBasedReturns: Record<string, number> = {
      individual_stock: 11, // S&P 500 historical avg
      crypto: 15, // High volatility, high return
      index_fund: 10, // Broad market
      taxable_etf: 9, // Sector-dependent
      roth_ira: 10, // Depends on holdings
      savings: 4.5, // Current high-yield savings
      other: 8
    };
    
    // Use market-based return if user didn't specify or specified 0
    if (isNaN(annualReturnPct) || annualReturnPct === 0) {
      annualReturnPct = marketBasedReturns[investment.type] || 8;
    }

    const r = (annualReturnPct / 100) / 12; // Monthly rate
    const n = Math.round(years * 12); // Total months

    // Handle zero return rate (no growth)
    if (r === 0) {
      return PV + pmt * n;
    }

    // Future Value formula: FV = PV(1+r)^n + PMT * [((1+r)^n - 1) / r]
    const factor = Math.pow(1 + r, n);
    const futureValue = PV * factor + pmt * ((factor - 1) / r);
    
    // Round to 2 decimal places for currency
    return Math.round(futureValue * 100) / 100;
  };
  
  // Get the effective annual return being used for an investment
  const getEffectiveReturn = (investment: Investment): number => {
    let annualReturnPct = Number(investment.annual_return_pct);
    
    if ((investment.type === 'individual_stock' || investment.type === 'crypto') && investment.ticker_symbol) {
      const tickerKey = investment.ticker_symbol.toUpperCase();
      const history = priceData[tickerKey]?.[FIXED_PERIOD]?.history;
      
      if (history && history.length >= 20) {
        const startPrice = history[0].price;
        const endPrice = history[history.length - 1].price;
        const days = history.length;
        
        if (startPrice > 0 && endPrice > 0 && days > 0) {
          const periodReturn = endPrice / startPrice;
          const annualizedReturn = (Math.pow(periodReturn, 365 / days) - 1) * 100;
          
          if (annualizedReturn > -50 && annualizedReturn < 200) {
            return annualizedReturn;
          }
        }
      }
    }
    
    const marketBasedReturns: Record<string, number> = {
      individual_stock: 11,
      crypto: 15,
      index_fund: 10,
      taxable_etf: 9,
      roth_ira: 10,
      savings: 4.5,
      other: 8
    };
    
    if (isNaN(annualReturnPct) || annualReturnPct === 0) {
      return marketBasedReturns[investment.type] || 8;
    }
    
    return annualReturnPct;
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

  // Calculate live current value for stocks/crypto with high precision
  const getLiveValue = (inv: Investment): number => {
    if ((inv.type === "individual_stock" || inv.type === "crypto") && inv.ticker_symbol && inv.shares_owned) {
      const tickerKey = inv.ticker_symbol.toUpperCase();
      const tickerEntry = priceData[tickerKey];
      const currentPrice = tickerEntry?.latest?.price || tickerEntry?.["1M"]?.price;
      if (currentPrice && !isNaN(currentPrice) && currentPrice > 0) {
        // Use high precision multiplication then round to 2 decimals
        const liveValue = inv.shares_owned * currentPrice;
        return Math.round(liveValue * 100) / 100;
      }
    }
    // Fallback to stored current_value, ensuring it's a valid number
    const storedValue = Number(inv.current_value);
    return isNaN(storedValue) ? 0 : storedValue;
  };

  const totalCurrentValue = investments.reduce((sum, inv) => {
    const value = getLiveValue(inv);
    return Math.round((sum + value) * 100) / 100;
  }, 0);
  
  const totalFutureValue = investments.reduce((sum, inv) => {
    const liveValue = getLiveValue(inv);
    const invWithLiveValue = { ...inv, current_value: liveValue };
    const futureValue = calculateFutureValue(invWithLiveValue);
    return Math.round((sum + futureValue) * 100) / 100;
  }, 0);

  // Advanced Portfolio Risk Analysis - constantly updated with live values
  const analyzePortfolioRisk = () => {
    if (investments.length === 0) return null;

    const totalValue = totalCurrentValue;
    if (totalValue === 0) return null;

    // Calculate allocations with live values
    const allocations = investments.reduce((acc, inv) => {
      const type = inv.type;
      const value = getLiveValue(inv);
      acc[type] = (acc[type] || 0) + value;
      return acc;
    }, {} as Record<string, number>);

    const percentages = Object.entries(allocations).reduce((acc, [type, value]) => {
      acc[type] = Math.round((value / totalValue) * 10000) / 100; // High precision
      return acc;
    }, {} as Record<string, number>);

    // Enhanced volatility scores based on historical data and asset class characteristics
    // These reflect annual volatility (standard deviation) percentages
    const volatilityScores: Record<string, { volatility: number; description: string }> = {
      crypto: { volatility: 80, description: "Extreme volatility (60-100% annual swings)" },
      individual_stock: { volatility: 35, description: "High volatility (20-50% annual swings)" },
      taxable_etf: { volatility: 18, description: "Moderate volatility (sector-dependent)" },
      index_fund: { volatility: 15, description: "Moderate volatility (15-20% annual swings)" },
      roth_ira: { volatility: 15, description: "Moderate (depends on holdings)" },
      other: { volatility: 20, description: "Variable volatility" },
      savings: { volatility: 0, description: "No volatility (stable value)" },
    };

    // Calculate portfolio-weighted volatility (standard deviation)
    const portfolioVolatility = Object.entries(percentages).reduce((vol, [type, pct]) => {
      const assetVol = volatilityScores[type]?.volatility || 20;
      return vol + (assetVol * (pct / 100));
    }, 0);

    // Correlation adjustments for diversification benefit
    // Uncorrelated assets reduce overall portfolio risk
    const correlationMatrix: Record<string, Record<string, number>> = {
      crypto: { crypto: 1.0, individual_stock: 0.3, index_fund: 0.2, taxable_etf: 0.25, roth_ira: 0.2, savings: 0, other: 0.3 },
      individual_stock: { crypto: 0.3, individual_stock: 1.0, index_fund: 0.85, taxable_etf: 0.8, roth_ira: 0.85, savings: 0, other: 0.5 },
      index_fund: { crypto: 0.2, individual_stock: 0.85, index_fund: 1.0, taxable_etf: 0.9, roth_ira: 0.95, savings: 0, other: 0.6 },
      taxable_etf: { crypto: 0.25, individual_stock: 0.8, index_fund: 0.9, taxable_etf: 1.0, roth_ira: 0.9, savings: 0, other: 0.6 },
      roth_ira: { crypto: 0.2, individual_stock: 0.85, index_fund: 0.95, taxable_etf: 0.9, roth_ira: 1.0, savings: 0, other: 0.6 },
      savings: { crypto: 0, individual_stock: 0, index_fund: 0, taxable_etf: 0, roth_ira: 0, savings: 1.0, other: 0 },
      other: { crypto: 0.3, individual_stock: 0.5, index_fund: 0.6, taxable_etf: 0.6, roth_ira: 0.6, savings: 0, other: 1.0 }
    };

    // Calculate diversification benefit using correlation
    let totalDiversificationBenefit = 0;
    let pairCount = 0;
    const types = Object.keys(percentages);
    
    for (let i = 0; i < types.length; i++) {
      for (let j = i + 1; j < types.length; j++) {
        const type1 = types[i];
        const type2 = types[j];
        const weight1 = percentages[type1] / 100;
        const weight2 = percentages[type2] / 100;
        const correlation = correlationMatrix[type1]?.[type2] || 0.5;
        
        // Lower correlation = better diversification
        totalDiversificationBenefit += (1 - correlation) * weight1 * weight2;
        pairCount++;
      }
    }

    // Diversification score: considers both number of holdings and correlation
    const numTypes = Object.keys(allocations).length;
    const typesDiversification = Math.min(100, (numTypes / 6) * 100); // Max at 6 different types
    const correlationBenefit = pairCount > 0 ? (totalDiversificationBenefit / pairCount) * 100 : 0;
    const diversificationScore = Math.round((typesDiversification * 0.6 + correlationBenefit * 0.4) * 100) / 100;

    // Concentration risk analysis
    const sortedAllocations = Object.entries(percentages).sort(([,a], [,b]) => b - a);
    const largestAllocation = sortedAllocations[0]?.[1] || 0;
    const top3Allocation = sortedAllocations.slice(0, 3).reduce((sum, [,pct]) => sum + pct, 0);
    
    let concentrationRisk: string;
    let concentrationColor: string;
    if (largestAllocation > 60 || top3Allocation > 85) {
      concentrationRisk = "Critical";
      concentrationColor = "text-destructive";
    } else if (largestAllocation > 40 || top3Allocation > 70) {
      concentrationRisk = "High";
      concentrationColor = "text-warning";
    } else if (largestAllocation > 25 || top3Allocation > 50) {
      concentrationRisk = "Medium";
      concentrationColor = "text-primary";
    } else {
      concentrationRisk = "Low";
      concentrationColor = "text-success";
    }

    // Calculate Sharpe Ratio approximation (risk-adjusted return)
    const riskFreeRate = 4.5; // Current T-bill rate
    const expectedReturns: Record<string, number> = {
      crypto: 15, // High return, high risk
      individual_stock: 11,
      index_fund: 10,
      taxable_etf: 9,
      roth_ira: 10,
      savings: 4.5,
      other: 8
    };
    
    const portfolioExpectedReturn = Object.entries(percentages).reduce((ret, [type, pct]) => {
      return ret + (expectedReturns[type] || 8) * (pct / 100);
    }, 0);
    
    const sharpeRatio = portfolioVolatility > 0 ? (portfolioExpectedReturn - riskFreeRate) / portfolioVolatility : 0;

    // Risk level determination based on actual volatility
    let riskLevel: string;
    let riskColor: string;
    let recommendations: string[];
    let expectedDrawdown: string;

    if (portfolioVolatility < 8) {
      riskLevel = "Very Conservative";
      riskColor = "text-success";
      expectedDrawdown = "5-10% max decline";
      recommendations = [
        `Portfolio volatility: ${portfolioVolatility.toFixed(1)}% - Very stable`,
        `Sharpe Ratio: ${sharpeRatio.toFixed(2)} - ${sharpeRatio > 1 ? 'Excellent' : sharpeRatio > 0.5 ? 'Good' : 'Room for improvement'} risk-adjusted returns`,
        "Consider adding growth assets for higher returns if time horizon permits",
        "Excellent for near-term goals (1-3 years)",
        diversificationScore < 50 ? "Improve diversification to reduce remaining risk" : "Well diversified within conservative range"
      ];
    } else if (portfolioVolatility < 15) {
      riskLevel = "Conservative";
      riskColor = "text-success";
      expectedDrawdown = "10-20% max decline";
      recommendations = [
        `Portfolio volatility: ${portfolioVolatility.toFixed(1)}% - Stable with modest growth`,
        `Sharpe Ratio: ${sharpeRatio.toFixed(2)} - ${sharpeRatio > 1 ? 'Excellent' : 'Good'} risk-adjusted returns`,
        "Suitable for 3-5 year investment horizon",
        "Good balance for pre-retirees or conservative investors",
        concentrationRisk !== "Low" ? `Reduce concentration risk (currently ${concentrationRisk})` : "Concentration risk well managed"
      ];
    } else if (portfolioVolatility < 20) {
      riskLevel = "Moderate";
      riskColor = "text-primary";
      expectedDrawdown = "20-30% max decline";
      recommendations = [
        `Portfolio volatility: ${portfolioVolatility.toFixed(1)}% - Balanced risk/return profile`,
        `Sharpe Ratio: ${sharpeRatio.toFixed(2)} - ${sharpeRatio > 0.8 ? 'Strong' : 'Adequate'} risk-adjusted performance`,
        "Appropriate for 5-10 year investment horizon",
        "Expect 1-2 significant corrections in 10 years",
        diversificationScore < 60 ? "Increase diversification to smooth volatility" : "Good diversification level",
        "Ensure 6-month emergency fund is separate"
      ];
    } else if (portfolioVolatility < 30) {
      riskLevel = "Aggressive";
      riskColor = "text-warning";
      expectedDrawdown = "30-40% max decline";
      recommendations = [
        `Portfolio volatility: ${portfolioVolatility.toFixed(1)}% - High volatility, growth-focused`,
        `Sharpe Ratio: ${sharpeRatio.toFixed(2)} - ${sharpeRatio > 0.6 ? 'Acceptable' : 'Below optimal'} for risk taken`,
        "Requires 10+ year investment horizon",
        "Expect 2-3 major corrections (20%+) over 10 years",
        concentrationRisk === "High" || concentrationRisk === "Critical" ? "URGENT: Reduce concentration - single position risk is high" : "Monitor concentration risk",
        diversificationScore < 70 ? "Diversification critical at this volatility level" : "Diversification helps manage volatility",
        "NOT suitable if you need funds in next 5 years"
      ];
    } else {
      riskLevel = "Very Aggressive";
      riskColor = "text-destructive";
      expectedDrawdown = "40-70%+ max decline";
      recommendations = [
        `Portfolio volatility: ${portfolioVolatility.toFixed(1)}% - EXTREME risk level`,
        `Sharpe Ratio: ${sharpeRatio.toFixed(2)} - ${sharpeRatio > 0.5 ? 'Risk somewhat justified by returns' : 'WARNING: High risk for returns achieved'}`,
        "ONLY for 15+ year horizon and strong risk tolerance",
        "Expect multiple 30-50% drawdowns",
        "Potential for total loss in individual positions",
        concentrationRisk === "Critical" ? "CRITICAL: Over-concentrated position - immediate rebalancing needed" : "High concentration amplifies volatility",
        diversificationScore < 50 ? "Poor diversification at extreme risk level - URGENT priority" : "Improve diversification to reduce downside",
        percentages.crypto > 20 ? `Crypto allocation (${percentages.crypto?.toFixed(1)}%) is very high - consider 5-10% max` : "",
        "Have 12-month emergency fund separate from this portfolio"
      ].filter(Boolean);
    }

    // Historical context
    const historicalContext = {
      worstYearLoss: `-${(portfolioVolatility * 2).toFixed(0)}%`,
      bestYearGain: `+${(portfolioExpectedReturn + portfolioVolatility).toFixed(0)}%`,
      avgAnnualReturn: `${portfolioExpectedReturn.toFixed(1)}%`
    };

    return {
      riskLevel,
      riskScore: Math.round(portfolioVolatility * 10) / 10, // Volatility as risk score
      riskColor,
      diversificationScore,
      concentrationRisk,
      concentrationColor,
      largestAllocation,
      top3Allocation,
      allocations: percentages,
      recommendations,
      portfolioVolatility,
      sharpeRatio,
      expectedReturn: portfolioExpectedReturn,
      expectedDrawdown,
      historicalContext,
      numHoldings: investments.length,
      numAssetClasses: numTypes
    };
  };

  const riskAnalysis = analyzePortfolioRisk();

  

  // NOTE: InvestmentForm previously lived inside the Investments component and
  // captured outer state, which caused frequent parent re-renders to re-create
  // the form and — on some mobile browsers — dismiss the on-screen keyboard.
  // To reduce re-renders and preserve input focus, we keep the inline form
  // implementation but will memoize it below when used in JSX.

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
              <DialogContent 
                disableFocusTrap
                disableOutsidePointerEvents={false}
                className="max-h-[90vh] overflow-y-auto"
              >
                <DialogHeader>
                  <DialogTitle>Add New Investment</DialogTitle>
                  <DialogDescription>Track stocks, crypto, ETFs, and more</DialogDescription>
                </DialogHeader>
                <InvestmentForm
                  formData={formData}
                  formType={formType}
                  setFormType={setFormType}
                  sourceAccountId={sourceAccountId}
                  setSourceAccountId={setSourceAccountId}
                  accounts={accounts}
                  handleInputChange={handleInputChange}
                  fetchPrice={fetchPrice}
                  fetchingPrice={fetchingPrice}
                  onSubmit={handleSubmit}
                  buttonText="Add Investment"
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-children">
          <Card className="shadow-luxe hover:shadow-glow transition-all duration-300 bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-success" />
                  Current Value (LIVE)
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={refreshPrices}
                  disabled={refreshing}
                  className="hover:bg-primary/10"
                  title="Refresh all prices now"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${totalCurrentValue.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />
                Auto-updates every 60 seconds
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-luxe hover:shadow-glow transition-all duration-300 bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Future Value Projection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${totalFutureValue.toFixed(2)}</div>
              <p className="text-sm text-muted-foreground mt-2">
                +${(totalFutureValue - totalCurrentValue).toFixed(2)} projected gain ({((totalFutureValue - totalCurrentValue) / totalCurrentValue * 100).toFixed(1)}%)
              </p>
              <div className="text-xs text-primary mt-2 flex items-center gap-1">
                <span className="font-semibold">
                  {investments.length > 0 && investments[0].years_remaining ? 
                    `${Math.max(...investments.map(i => i.years_remaining || 0))} YEAR HORIZON` : 
                    'MULTI-YEAR HORIZON'}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                ℹ Based on market data & live values
              </div>
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
              {/* Primary Risk Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Risk Level</div>
                  <div className={`text-xl font-bold ${riskAnalysis.riskColor}`}>
                    {riskAnalysis.riskLevel}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Volatility: {riskAnalysis.portfolioVolatility.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Diversification</div>
                  <div className="text-xl font-bold">{riskAnalysis.diversificationScore.toFixed(0)}%</div>
                  <Progress value={riskAnalysis.diversificationScore} className="mt-1" />
                  <div className="text-xs text-muted-foreground mt-1">{riskAnalysis.numAssetClasses} asset types</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Concentration Risk</div>
                  <div className={`text-xl font-bold ${riskAnalysis.concentrationColor}`}>{riskAnalysis.concentrationRisk}</div>
                  <div className="text-xs text-muted-foreground mt-1">Top position: {riskAnalysis.largestAllocation.toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground">Top 3: {riskAnalysis.top3Allocation.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
                  <div className={`text-xl font-bold ${riskAnalysis.sharpeRatio > 1 ? 'text-success' : riskAnalysis.sharpeRatio > 0.5 ? 'text-primary' : 'text-warning'}`}>
                    {riskAnalysis.sharpeRatio.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {riskAnalysis.sharpeRatio > 1 ? 'Excellent' : riskAnalysis.sharpeRatio > 0.5 ? 'Good' : 'Below target'}
                  </div>
                </div>
              </div>

              {/* Expected Performance Metrics */}
              <div className="border-t pt-3">
                <div className="text-sm font-medium mb-2">Expected Performance:</div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground">Avg Annual Return</div>
                    <div className="text-lg font-semibold text-success">{riskAnalysis.historicalContext.avgAnnualReturn}</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground">Best Year (95%)</div>
                    <div className="text-lg font-semibold text-success">{riskAnalysis.historicalContext.bestYearGain}</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground">Worst Year (5%)</div>
                    <div className="text-lg font-semibold text-destructive">{riskAnalysis.historicalContext.worstYearLoss}</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground">Max Drawdown</div>
                    <div className="text-lg font-semibold text-warning">{riskAnalysis.expectedDrawdown}</div>
                  </div>
                </div>
              </div>

              {/* Asset Allocation Breakdown */}
              <div className="border-t pt-3">
                <div className="text-sm font-medium mb-2">Asset Allocation ({riskAnalysis.numHoldings} holdings):</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(riskAnalysis.allocations)
                    .sort(([,a], [,b]) => b - a)
                    .map(([type, pct]) => (
                      <div key={type} className="bg-muted/20 rounded p-2">
                        <div className="text-xs text-muted-foreground capitalize">{type.replace(/_/g, ' ')}</div>
                        <div className="text-sm font-semibold">{pct.toFixed(1)}%</div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="border-t pt-3">
                <div className="text-sm font-medium mb-2">Risk Analysis & Recommendations:</div>
                <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
                  {riskAnalysis.recommendations.map((rec, idx) => (
                    <li key={idx} className={rec.includes('URGENT') || rec.includes('CRITICAL') || rec.includes('WARNING') ? 'text-destructive font-semibold' : ''}>{rec}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your Investments</h2>
          {investments.map((investment) => {
            const futureValue = calculateFutureValue(investment);
            const liveValue = getLiveValue(investment);
            const gain = futureValue - liveValue;
            const currentPeriod = FIXED_PERIOD;
            const tickerKey = investment.ticker_symbol?.toUpperCase();
            const hasChart = !!(investment.ticker_symbol && priceData[tickerKey]?.[currentPeriod]?.history?.length > 0);

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
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" />
                        Updates every 60 sec
                      </div>
                      <div className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">Live 30-Day Chart</div>
                    </div>
                    <PerformanceChart 
                      data={priceData[tickerKey!]?.[FIXED_PERIOD]?.history || []}
                      title={`${FIXED_PERIOD} Performance (Live)`}
                      ticker={investment.ticker_symbol!}
                      isLoading={!!priceLoading[tickerKey!]}
                    />
                  </div>
                  
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          Current Value
                          <span className="text-xs">(Live)</span>
                        </div>
                        <div className="text-xl font-bold">${liveValue.toFixed(2)}</div>
                        {investment.shares_owned && (
                          <div className="text-xs text-muted-foreground">
                            {investment.shares_owned} {investment.type === "crypto" ? "units" : "shares"} × ${priceData[tickerKey!]?.latest?.price?.toFixed(2) || investment.purchase_price_per_share?.toFixed(2)}
                          </div>
                        )}
                        {priceData[tickerKey!]?.latest?.change24h !== undefined && (
                          <div className={`text-xs font-medium ${
                            priceData[tickerKey!].latest.change24h >= 0 ? 'text-success' : 'text-destructive'
                          }`}>
                            {priceData[tickerKey!].latest.change24h >= 0 ? '↑' : '↓'} {Math.abs(priceData[tickerKey!].latest.change24h).toFixed(2)}% today
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          Future Value
                          <span className="text-xs font-semibold text-primary">({investment.years_remaining} {investment.years_remaining === 1 ? 'year' : 'years'})</span>
                        </div>
                        <div className="text-xl font-bold text-success">${futureValue.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">
                          +${gain.toFixed(2)} ({((gain / liveValue) * 100).toFixed(1)}% total gain)
                        </div>
                        <div className="text-xs text-primary font-medium mt-0.5">
                          @ {getEffectiveReturn(investment).toFixed(1)}% annually
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Only show monthly contribution for types that support ongoing contributions */}
                      {(investment.type !== 'individual_stock' && investment.type !== 'crypto') && (
                        <div>
                          <div className="text-muted-foreground">Monthly Contribution</div>
                          <div className="font-medium">${Number(investment.monthly_contribution).toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            ${(Number(investment.monthly_contribution) * 12).toFixed(0)}/year for {investment.years_remaining} years
                          </div>
                        </div>
                      )}

                      {/* Show effective return rate being used */}
                      <div>
                        <div className="text-muted-foreground">
                          {(investment.type === 'individual_stock' || investment.type === 'crypto') ? 'Return Rate (Live)' : 'Expected Return'}
                        </div>
                        <div className="font-medium">{getEffectiveReturn(investment).toFixed(1)}% annually</div>
                        {(investment.type === 'individual_stock' || investment.type === 'crypto') && priceData[tickerKey!]?.[FIXED_PERIOD]?.history?.length >= 20 && (
                          <div className="text-xs text-success mt-0.5">
                            ✓ Based on 30-day market data
                          </div>
                        )}
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
                <DialogContent 
                  disableFocusTrap
                  disableOutsidePointerEvents={false}
                  className="max-h-[90vh] overflow-y-auto"
                >
                  <DialogHeader>
                    <DialogTitle>Add New Investment</DialogTitle>
                    <DialogDescription>Track stocks, crypto, ETFs, and more</DialogDescription>
                  </DialogHeader>
                  <InvestmentForm
                    formData={formData}
                    formType={formType}
                    setFormType={setFormType}
                    sourceAccountId={sourceAccountId}
                    setSourceAccountId={setSourceAccountId}
                    accounts={accounts}
                    handleInputChange={handleInputChange}
                    fetchPrice={fetchPrice}
                    fetchingPrice={fetchingPrice}
                    onSubmit={handleSubmit}
                    buttonText="Add Investment"
                  />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent 
            disableFocusTrap
            disableOutsidePointerEvents={false}
            className="max-h-[90vh] overflow-y-auto"
          >
            <DialogHeader>
              <DialogTitle>Edit Investment</DialogTitle>
              <DialogDescription>Update your investment details</DialogDescription>
            </DialogHeader>
            <InvestmentForm
              formData={formData}
              formType={formType}
              setFormType={setFormType}
              sourceAccountId={sourceAccountId}
              setSourceAccountId={setSourceAccountId}
              accounts={accounts}
              handleInputChange={handleInputChange}
              fetchPrice={fetchPrice}
              fetchingPrice={fetchingPrice}
              onSubmit={handleEdit}
              buttonText="Update Investment"
            />
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
