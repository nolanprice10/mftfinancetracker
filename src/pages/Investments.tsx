import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Edit, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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

      const investmentData: any = {
        user_id: user.id,
        name: formData.name,
        type: formData.type as any,
        current_value: parseFloat(formData.current_value),
        monthly_contribution: parseFloat(formData.monthly_contribution || "0"),
        annual_return_pct: parseFloat(formData.annual_return_pct),
        years_remaining: parseFloat(formData.years_remaining),
      };

      if (formData.type === "individual_stock") {
        investmentData.ticker_symbol = formData.ticker_symbol || null;
        investmentData.shares_owned = formData.shares_owned ? parseFloat(formData.shares_owned) : null;
        investmentData.purchase_price_per_share = formData.purchase_price_per_share ? parseFloat(formData.purchase_price_per_share) : null;
      }

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
      const investmentData: any = {
        name: formData.name,
        type: formData.type as any,
        current_value: parseFloat(formData.current_value),
        monthly_contribution: parseFloat(formData.monthly_contribution || "0"),
        annual_return_pct: parseFloat(formData.annual_return_pct),
        years_remaining: parseFloat(formData.years_remaining),
      };

      if (formData.type === "individual_stock") {
        investmentData.ticker_symbol = formData.ticker_symbol || null;
        investmentData.shares_owned = formData.shares_owned ? parseFloat(formData.shares_owned) : null;
        investmentData.purchase_price_per_share = formData.purchase_price_per_share ? parseFloat(formData.purchase_price_per_share) : null;
      } else {
        investmentData.ticker_symbol = null;
        investmentData.shares_owned = null;
        investmentData.purchase_price_per_share = null;
      }

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
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Investments</h1>
            <p className="text-muted-foreground">Track your investment portfolio and projections</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gradient-card shadow-elegant border-border">
            <CardHeader>
              <CardTitle className="text-xl">Current Portfolio Value</CardTitle>
              <CardDescription>Total value of all investments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">
                ${totalCurrentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-success shadow-elegant border-none">
            <CardHeader>
              <CardTitle className="text-xl text-success-foreground">Projected Future Value</CardTitle>
              <CardDescription className="text-success-foreground/80">Based on contributions and returns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-success-foreground">
                ${totalFutureValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading ? (
            [1, 2].map((i) => (
              <Card key={i} className="animate-pulse">
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
            <Card className="col-span-full">
              <CardContent className="text-center py-12 text-muted-foreground">
                No investments yet. Add your first investment to start tracking!
              </CardContent>
            </Card>
          ) : (
            investments.map((investment) => {
              const futureValue = calculateFutureValue(investment);
              const totalGain = futureValue - Number(investment.current_value);
              const gainPercentage = (totalGain / Number(investment.current_value)) * 100;

              return (
                <Card key={investment.id} className="shadow-md hover:shadow-glow transition-shadow border-border">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">
                          {investment.name}
                          {investment.ticker_symbol && (
                            <span className="ml-2 text-sm text-muted-foreground">({investment.ticker_symbol})</span>
                          )}
                        </CardTitle>
                        <Badge className={investmentTypeColors[investment.type] || "bg-primary"}>
                          {investment.type.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openEditDialog(investment)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedInvestment(investment);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {investment.type === "individual_stock" && investment.shares_owned ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Shares Owned</p>
                          <p className="text-xl font-bold">{Number(investment.shares_owned).toFixed(3)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Price per Share</p>
                          <p className="text-xl font-bold">
                            ${(Number(investment.current_value) / Number(investment.shares_owned)).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Current Value</p>
                          <p className="text-2xl font-bold">
                            ${Number(investment.current_value).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Monthly +</p>
                          <p className="text-2xl font-bold text-success">
                            ${Number(investment.monthly_contribution).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-border">
                      <p className="text-lg font-semibold mb-1">Total Value</p>
                      <p className="text-3xl font-bold text-primary">
                        ${Number(investment.current_value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground mb-2">
                        Projected in {investment.years_remaining} years @ {investment.annual_return_pct}% annual return
                      </p>
                      <p className="text-3xl font-bold bg-gradient-success bg-clip-text text-transparent">
                        ${futureValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-sm text-success mt-2">
                        +${totalGain.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ({gainPercentage.toFixed(1)}% gain)
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <Card className="bg-muted/30 border-border">
          <CardHeader>
            <CardTitle className="text-sm">Disclaimer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              This information is educational and illustrative only and should not be considered financial or investment advice. 
              Past performance does not guarantee future results. Individual stock values shown are user-entered estimates and may not reflect real-time market prices.
              Consult a licensed financial advisor before making investment decisions.
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
