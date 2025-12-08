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
    apy: "",
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
      // Persist APY in notes for high-yield accounts (no DB migration)
      const notesWithApy = formData.type === 'high_yield_savings' && formData.apy
        ? `${formData.notes ? formData.notes + ' ' : ''}APY:${parseFloat(formData.apy)}`
        : (formData.notes || null);

      const { error } = await supabase.from("accounts").insert({
        user_id: user.id,
        name: validated.name,
        balance: validated.balance,
        type: validated.type as any,
        notes: notesWithApy,
      } as any);

      if (error) throw error;

      toast.success("Account created successfully");
      setDialogOpen(false);
      setFormData({ name: "", balance: "", type: "checking", notes: "", apy: "" });
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
      const notesWithApy = formData.type === 'high_yield_savings' && formData.apy
        ? `${formData.notes ? formData.notes + ' ' : ''}APY:${parseFloat(formData.apy)}`
        : (formData.notes || null);

      const { error } = await supabase
        .from("accounts")
        .update({
          name: validated.name,
          balance: validated.balance,
          type: validated.type as any,
          notes: notesWithApy,
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
    // Extract APY marker from notes if present
    const apyMatch = account.notes ? account.notes.match(/APY:\s*:?\s*([0-9.]+)/i) : null;
    const apy = apyMatch ? apyMatch[1] : "";
    const notesStripped = account.notes ? (apyMatch ? account.notes.replace(apyMatch[0], '').trim() : account.notes) : "";

    setSelectedAccount(account);
    setFormData({
      name: account.name,
      balance: account.balance.toString(),
      type: account.type,
      notes: notesStripped || "",
      apy,
    });
    setEditDialogOpen(true);
  };

  const accountTypeColors: Record<string, string> = {
    checking: "bg-primary",
    savings: "bg-success",
    high_yield_savings: "bg-emerald",
    brokerage: "bg-accent",
    retirement: "bg-secondary",
    cash: "bg-warning",
  };
  const accountTypeLabels: Record<string, string> = {
    checking: 'Checking',
    savings: 'Savings',
    high_yield_savings: 'High-Yield Savings',
    brokerage: 'Brokerage',
    retirement: 'Retirement',
    cash: 'Cash'
  }

  const extractApyFromNotes = (notes: string | null) => {
    if (!notes) return null;
    const m = notes.match(/APY:\s*:?\s*([0-9.]+)/i);
    return m ? m[1] : null;
  }

  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

  const AccountForm = ({ onSubmit, buttonText }: { onSubmit: (e: React.FormEvent) => void; buttonText: string }) => {
    // Local state to prevent keyboard dismissal on mobile
    const [localName, setLocalName] = useState(formData.name);
    const [localBalance, setLocalBalance] = useState(formData.balance);
    const [localNotes, setLocalNotes] = useState(formData.notes);
    const [localApy, setLocalApy] = useState(formData.apy);

    useEffect(() => {
      setLocalName(formData.name);
      setLocalBalance(formData.balance);
      setLocalNotes(formData.notes);
      setLocalApy(formData.apy || "");
    }, [formData.name, formData.balance, formData.notes, formData.apy]);

    const handleLocalSubmit = (e: React.FormEvent) => {
      setFormData({ ...formData, name: localName, balance: localBalance, notes: localNotes, apy: localApy });
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
              <SelectItem value="high_yield_savings">High-Yield Savings</SelectItem>
              <SelectItem value="brokerage">Brokerage</SelectItem>
              <SelectItem value="retirement">Retirement</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {formData.type === 'high_yield_savings' && (
          <div className="space-y-2">
            <Label>APY (annual %)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="e.g., 3.5"
              value={localApy}
              onChange={(e) => setLocalApy(e.target.value)}
              onBlur={(e) => setFormData({ ...formData, apy: e.target.value })}
              autoComplete="off"
            />
          </div>
        )}
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
      <div className="space-y-8 animate-luxe-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-wealth bg-clip-text text-transparent">Accounts</h1>
            <p className="text-muted-foreground">Wealth account management</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-elegant hover:shadow-luxe transition-all">
                <Plus className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent
              disableFocusTrap
              disableOutsidePointerEvents={false}
            >
              <DialogHeader>
                <DialogTitle>Add Account</DialogTitle>
                <DialogDescription>Create a new financial account</DialogDescription>
              </DialogHeader>
              <AccountForm onSubmit={handleSubmit} buttonText="Create Account" />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-children">
          <Card className="bg-gradient-card shadow-luxe border-none overflow-hidden group hover:shadow-glow transition-all duration-500">
            <CardHeader className="relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-700"></div>
              <CardTitle className="text-xl relative z-10">Total Balance</CardTitle>
              <CardDescription className="relative z-10">Across all accounts</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-5xl font-bold text-primary transition-all duration-300 group-hover:scale-105">
                ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          {accounts.length > 0 && (
            <Card className="bg-gradient-card shadow-luxe border-none overflow-hidden group hover:shadow-glow transition-all duration-500">
              <CardHeader className="relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-success/5 rounded-full blur-2xl group-hover:bg-success/10 transition-all duration-700"></div>
                <CardTitle className="text-xl relative z-10">Account Distribution</CardTitle>
                <CardDescription className="relative z-10">Breakdown by account</CardDescription>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {loading ? (
            [1, 2, 3].map((i) => (
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
          ) : accounts.length === 0 ? (
            <Card className="col-span-full shadow-luxe border-border/50">
              <CardContent className="text-center py-16">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Wallet className="h-8 w-8 text-primary" />
                </div>
                <p className="text-muted-foreground text-lg">No accounts yet</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Create your first account to begin tracking</p>
              </CardContent>
            </Card>
          ) : (
            accounts.map((account) => (
              <Card key={account.id} className="shadow-elegant hover:shadow-luxe transition-all duration-500 border-border/50 bg-gradient-card overflow-hidden group">
                <CardHeader className="relative">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-700"></div>
                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2 transition-colors duration-300 group-hover:text-primary">{account.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={accountTypeColors[account.type] || "bg-primary"}>
                          {accountTypeLabels[account.type] || account.type}
                        </Badge>
                        {extractApyFromNotes(account.notes) && (
                          <Badge className="bg-emerald/10 text-emerald-700">APY {extractApyFromNotes(account.notes)}%</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEditDialog(account)} className="hover:bg-primary/10 transition-all">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedAccount(account);
                          setDeleteDialogOpen(true);
                        }}
                        className="hover:bg-destructive/10 transition-all"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent transition-all duration-300 group-hover:scale-105">
                    ${Number(account.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  {account.notes && (
                    <p className="text-sm text-muted-foreground mt-3 italic">{account.notes}</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent
            disableFocusTrap
            disableOutsidePointerEvents={false}
          >
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
