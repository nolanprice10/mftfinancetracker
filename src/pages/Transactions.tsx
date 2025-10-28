import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  category: string;
  date: string;
  notes: string | null;
  account_id: string;
  accounts: { name: string };
}

interface Account {
  id: string;
  name: string;
}

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    type: "expense",
    category: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
    account_id: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [transactionsRes, accountsRes] = await Promise.all([
        supabase.from("transactions").select("*, accounts(name)").eq("user_id", user.id).order("date", { ascending: false }),
        supabase.from("accounts").select("id, name").eq("user_id", user.id),
      ]);

      if (transactionsRes.data) setTransactions(transactionsRes.data);
      if (accountsRes.data) setAccounts(accountsRes.data);
    } catch (error) {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const amount = parseFloat(formData.amount);
      
      // Insert transaction
      const { error: txError } = await supabase.from("transactions").insert({
        user_id: user.id,
        account_id: formData.account_id,
        type: formData.type as any,
        category: formData.category,
        amount,
        date: formData.date,
        notes: formData.notes || null,
      } as any);

      if (txError) throw txError;

      // Update account balance
      const { data: account } = await supabase.from("accounts").select("balance").eq("id", formData.account_id).single();
      
      if (account) {
        const newBalance = formData.type === "income" 
          ? Number(account.balance) + amount 
          : Number(account.balance) - amount;
        
        await supabase.from("accounts").update({ balance: newBalance }).eq("id", formData.account_id);
      }

      toast.success("Transaction added successfully");
      setDialogOpen(false);
      setFormData({
        amount: "",
        type: "expense",
        category: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
        account_id: "",
      });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to add transaction");
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Transactions</h1>
            <p className="text-muted-foreground">Track your income and expenses</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Transaction</DialogTitle>
                <DialogDescription>Record a new income or expense</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Account</Label>
                  <Select value={formData.account_id} onValueChange={(value) => setFormData({ ...formData, account_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input type="number" step="0.01" placeholder="0.00" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input placeholder="e.g., Food, Rent, Salary" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Input placeholder="Add details..." value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                </div>
                <Button type="submit" className="w-full">Add Transaction</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>All your financial transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg"></div>
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No transactions yet. Add your first transaction to get started!
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={transaction.type === "income" ? "default" : "secondary"}>
                          {transaction.type}
                        </Badge>
                        <span className="font-medium">{transaction.category}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {transaction.accounts.name} • {new Date(transaction.date).toLocaleDateString()}
                      </p>
                      {transaction.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{transaction.notes}</p>
                      )}
                    </div>
                    <div className={`text-xl font-bold ${transaction.type === "income" ? "text-success" : "text-foreground"}`}>
                      {transaction.type === "income" ? "+" : "-"}${Number(transaction.amount).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Transactions;
