import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { EditTransactionDialog } from "@/components/EditTransactionDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

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
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteTransaction, setDeleteTransaction] = useState<Transaction | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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

  const handleDelete = async () => {
    if (!deleteTransaction) return;

    try {
      const { data: account } = await supabase
        .from("accounts")
        .select("balance")
        .eq("id", deleteTransaction.account_id)
        .single();

      if (account) {
        const newBalance = deleteTransaction.type === "income"
          ? Number(account.balance) - Number(deleteTransaction.amount)
          : Number(account.balance) + Number(deleteTransaction.amount);

        await supabase
          .from("accounts")
          .update({ balance: newBalance })
          .eq("id", deleteTransaction.account_id);
      }

      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", deleteTransaction.id);

      if (error) throw error;

      toast.success("Transaction deleted successfully");
      setDeleteDialogOpen(false);
      setDeleteTransaction(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete transaction");
    }
  };

  const categoryData = useMemo(() => {
    const incomeByCategory = transactions
      .filter(t => t.type === "income")
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
        return acc;
      }, {} as Record<string, number>);

    const expenseByCategory = transactions
      .filter(t => t.type === "expense")
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
        return acc;
      }, {} as Record<string, number>);

    return {
      income: Object.entries(incomeByCategory).map(([name, value]) => ({ name, value })),
      expense: Object.entries(expenseByCategory).map(([name, value]) => ({ name, value })),
    };
  }, [transactions]);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

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
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.type === "income" ? (
                        <>
                          <SelectItem value="Salary">Salary</SelectItem>
                          <SelectItem value="Freelance">Freelance</SelectItem>
                          <SelectItem value="Investment Returns">Investment Returns</SelectItem>
                          <SelectItem value="Business Income">Business Income</SelectItem>
                          <SelectItem value="Gifts">Gifts</SelectItem>
                          <SelectItem value="Other Income">Other Income</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="Housing">Housing</SelectItem>
                          <SelectItem value="Transportation">Transportation</SelectItem>
                          <SelectItem value="Food & Dining">Food & Dining</SelectItem>
                          <SelectItem value="Utilities">Utilities</SelectItem>
                          <SelectItem value="Healthcare">Healthcare</SelectItem>
                          <SelectItem value="Entertainment">Entertainment</SelectItem>
                          <SelectItem value="Shopping">Shopping</SelectItem>
                          <SelectItem value="Personal Care">Personal Care</SelectItem>
                          <SelectItem value="Education">Education</SelectItem>
                          <SelectItem value="Insurance">Insurance</SelectItem>
                          <SelectItem value="Debt Payment">Debt Payment</SelectItem>
                          <SelectItem value="Savings">Savings</SelectItem>
                          <SelectItem value="Other Expense">Other Expense</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
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

        {transactions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Income by Category</CardTitle>
                <CardDescription>Breakdown of income sources</CardDescription>
              </CardHeader>
              <CardContent>
                {categoryData.income.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData.income}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(entry) => `${entry.name}: $${entry.value.toFixed(0)}`}
                      >
                        {categoryData.income.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">No income transactions yet</div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Expenses by Category</CardTitle>
                <CardDescription>Breakdown of spending</CardDescription>
              </CardHeader>
              <CardContent>
                {categoryData.expense.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData.expense}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(entry) => `${entry.name}: $${entry.value.toFixed(0)}`}
                      >
                        {categoryData.expense.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">No expense transactions yet</div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

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
                    <div className="flex items-center gap-4">
                      <div className={`text-xl font-bold ${transaction.type === "income" ? "text-success" : "text-foreground"}`}>
                        {transaction.type === "income" ? "+" : "-"}${Number(transaction.amount).toFixed(2)}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditTransaction(transaction);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setDeleteTransaction(transaction);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <EditTransactionDialog
          transaction={editTransaction}
          accounts={accounts}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={fetchData}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this transaction? This will also reverse the balance change on the account.
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

export default Transactions;
