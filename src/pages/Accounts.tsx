import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Wallet, Edit, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
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

      // Validate input data
      const { accountSchema } = await import("@/lib/validation");
      const validationResult = accountSchema.safeParse({
        name: formData.name,
        balance: parseFloat(formData.balance),
        type: formData.type,
        notes: formData.notes || null
      });

      if (!validationResult.success) {
        toast.error(validationResult.error.errors[0].message);
        return;
      }

      const validated = validationResult.data;
      const { error } = await supabase.from("accounts").insert({
        user_id: user.id,
        name: validated.name,
        balance: validated.balance,
        type: validated.type as any,
        notes: validated.notes,
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

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;

    try {
      // Validate input data
      const { accountSchema } = await import("@/lib/validation");
      const validationResult = accountSchema.safeParse({
        name: formData.name,
        balance: parseFloat(formData.balance),
        type: formData.type,
        notes: formData.notes || null
      });

      if (!validationResult.success) {
        toast.error(validationResult.error.errors[0].message);
        return;
      }

      const validated = validationResult.data;
      const { error } = await supabase
        .from("accounts")
        .update({
          name: validated.name,
          balance: validated.balance,
          type: validated.type as any,
          notes: validated.notes,
        } as any)
        .eq("id", selectedAccount.id);

      if (error) throw error;

      toast.success("Account updated successfully");
      setEditDialogOpen(false);
      setSelectedAccount(null);
      fetchAccounts();
    } catch (error: any) {
      toast.error(error.message || "Failed to update account");
    }
  };

  const handleDelete = async () => {
    if (!selectedAccount) return;

    try {
      const { error } = await supabase
        .from("accounts")
        .delete()
        .eq("id", selectedAccount.id);

      if (error) throw error;

      toast.success("Account deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedAccount(null);
      fetchAccounts();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete account");
    }
  };

  const openEditDialog = (account: Account) => {
    setSelectedAccount(account);
    setFormData({
      name: account.name,
      balance: account.balance.toString(),
      type: account.type,
      notes: account.notes || "",
    });
    setEditDialogOpen(true);
  };

  const accountTypeColors: Record<string, string> = {
    checking: "bg-primary",
    savings: "bg-success",
    brokerage: "bg-accent",
    retirement: "bg-secondary",
    cash: "bg-warning",
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

  const AccountForm = ({ onSubmit, buttonText }: { onSubmit: (e: React.FormEvent) => void; buttonText: string }) => {
    // Local state to prevent keyboard dismissal on mobile
    const [localName, setLocalName] = useState(formData.name);
    const [localBalance, setLocalBalance] = useState(formData.balance);
    const [localNotes, setLocalNotes] = useState(formData.notes);

    useEffect(() => {
      setLocalName(formData.name);
      setLocalBalance(formData.balance);
      setLocalNotes(formData.notes);
    }, [formData.name, formData.balance, formData.notes]);

    const handleLocalSubmit = (e: React.FormEvent) => {
      setFormData({ ...formData, name: localName, balance: localBalance, notes: localNotes });
      onSubmit(e);
    };

    return (
      <form onSubmit={handleLocalSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Account Name</Label>
          <Input
            placeholder="e.g., Main Checking"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            onBlur={(e) => setFormData({ ...formData, name: e.target.value })}
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
              <SelectItem value="checking">Checking</SelectItem>
              <SelectItem value="savings">Savings</SelectItem>
              <SelectItem value="brokerage">Brokerage</SelectItem>
              <SelectItem value="retirement">Retirement</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Balance</Label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={localBalance}
            onChange={(e) => setLocalBalance(e.target.value)}
            onBlur={(e) => setFormData({ ...formData, balance: e.target.value })}
            autoComplete="off"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Notes (optional)</Label>
          <Input
            placeholder="Add details..."
            value={localNotes}
            onChange={(e) => setLocalNotes(e.target.value)}
            onBlur={(e) => setFormData({ ...formData, notes: e.target.value })}
            autoComplete="off"
          />
        </div>
        <Button type="submit" className="w-full">{buttonText}</Button>
      </form>
    );
  };

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
              <AccountForm onSubmit={handleSubmit} buttonText="Create Account" />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gradient-card shadow-elegant border-border">
            <CardHeader>
              <CardTitle className="text-xl">Total Balance</CardTitle>
              <CardDescription>Across all accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">
                ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          {accounts.length > 0 && (
            <Card className="bg-gradient-card shadow-elegant border-border">
              <CardHeader>
                <CardTitle className="text-xl">Account Distribution</CardTitle>
                <CardDescription>Breakdown by account</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={accounts.map((account, index) => ({
                        name: account.name,
                        value: Number(account.balance),
                        fill: `hsl(${150 + index * 40}, 40%, ${35 + index * 10}%)`
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {accounts.map((_, index) => (
                        <Cell key={`cell-${index}`} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

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
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => openEditDialog(account)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedAccount(account);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Account</DialogTitle>
              <DialogDescription>Update account details</DialogDescription>
            </DialogHeader>
            <AccountForm onSubmit={handleEdit} buttonText="Update Account" />
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Account</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this account? This action cannot be undone and will also delete all transactions associated with this account.
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

export default Accounts;
