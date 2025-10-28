import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Wallet } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Account {
  id: string;
  name: string;
  balance: number;
  type: string;
  notes: string | null;
}

const Accounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    balance: "",
    type: "checking",
    notes: "",
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("accounts").insert({
        user_id: user.id,
        name: formData.name,
        balance: parseFloat(formData.balance),
        type: formData.type as any,
        notes: formData.notes || null,
      } as any);

      if (error) throw error;

      toast.success("Account created successfully");
      setDialogOpen(false);
      setFormData({ name: "", balance: "", type: "checking", notes: "" });
      fetchAccounts();
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    }
  };

  const accountTypeColors: Record<string, string> = {
    checking: "bg-primary",
    savings: "bg-success",
    brokerage: "bg-accent",
    retirement: "bg-secondary",
    cash: "bg-warning",
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Accounts</h1>
            <p className="text-muted-foreground">Manage your financial accounts</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Account</DialogTitle>
                <DialogDescription>Create a new financial account</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Account Name</Label>
                  <Input
                    placeholder="e.g., Main Checking"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                      <SelectItem value="checking">Checking</SelectItem>
                      <SelectItem value="savings">Savings</SelectItem>
                      <SelectItem value="brokerage">Brokerage</SelectItem>
                      <SelectItem value="retirement">Retirement</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Initial Balance</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Input
                    placeholder="Add details..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">Create Account</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-gradient-card shadow-lg border-none">
          <CardHeader>
            <CardTitle className="text-2xl">Total Balance</CardTitle>
            <CardDescription>Combined balance across all accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            [1, 2, 3].map((i) => (
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
          ) : accounts.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="text-center py-12 text-muted-foreground">
                No accounts yet. Create your first account to get started!
              </CardContent>
            </Card>
          ) : (
            accounts.map((account) => (
              <Card key={account.id} className="shadow-md hover:shadow-glow transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{account.name}</CardTitle>
                      <Badge className={accountTypeColors[account.type] || "bg-primary"}>
                        {account.type}
                      </Badge>
                    </div>
                    <div className={`p-3 rounded-xl ${accountTypeColors[account.type] || "bg-primary"}`}>
                      <Wallet className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    ${Number(account.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  {account.notes && (
                    <p className="text-sm text-muted-foreground mt-2">{account.notes}</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Accounts;
