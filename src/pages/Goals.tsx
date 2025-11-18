import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Target, Edit, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  start_date: string;
  end_date: string;
  notes: string | null;
  account_id?: string;
}

interface Account {
  id: string;
  name: string;
}

const Goals = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    target_amount: "",
    current_amount: "0",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
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

      const [goalsRes, accountsRes] = await Promise.all([
        supabase.from("goals").select("*").eq("user_id", user.id).order("end_date", { ascending: true }),
        supabase.from("accounts").select("id, name").eq("user_id", user.id),
      ]);

      setGoals(goalsRes.data || []);
      setAccounts(accountsRes.data || []);
    } catch (error) {
      toast.error("Failed to load goals");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (!formData.account_id) {
        toast.error("Please select an account for this goal");
        return;
      }

      // Validate input data
      const { goalSchema } = await import("@/lib/validation");
      const validationResult = goalSchema.safeParse({
        name: formData.name,
        target_amount: parseFloat(formData.target_amount),
        start_date: formData.start_date,
        end_date: formData.end_date,
        notes: formData.notes || null,
        account_id: formData.account_id === "overall" ? null : formData.account_id
      });

      if (!validationResult.success) {
        toast.error(validationResult.error.errors[0].message);
        return;
      }

      let currentAmount = 0;

      if (formData.account_id === "overall") {
        // Calculate total balance across all accounts
        const { data: accountsData } = await supabase
          .from("accounts")
          .select("balance")
          .eq("user_id", user.id);
        
        currentAmount = (accountsData || []).reduce((sum, acc) => sum + Number(acc.balance), 0);
      } else {
        // Get the selected account's balance
        const { data: accountData } = await supabase
          .from("accounts")
          .select("balance")
          .eq("id", formData.account_id)
          .single();
        
        currentAmount = accountData?.balance || 0;
      }

      const validated = validationResult.data;
      const { error } = await supabase.from("goals").insert({
        user_id: user.id,
        name: validated.name,
        target_amount: validated.target_amount,
        current_amount: currentAmount,
        start_date: validated.start_date,
        end_date: validated.end_date,
        notes: validated.notes,
        account_id: validated.account_id,
      } as any);

      if (error) throw error;

      toast.success("Goal created successfully");
      setDialogOpen(false);
      setFormData({
        name: "",
        target_amount: "",
        current_amount: "0",
        start_date: new Date().toISOString().split("T")[0],
        end_date: "",
        notes: "",
        account_id: "",
      });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to create goal");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (!formData.account_id) {
        toast.error("Please select an account for this goal");
        return;
      }

      // Validate input data
      const { goalSchema } = await import("@/lib/validation");
      const validationResult = goalSchema.safeParse({
        name: formData.name,
        target_amount: parseFloat(formData.target_amount),
        start_date: formData.start_date,
        end_date: formData.end_date,
        notes: formData.notes || null,
        account_id: formData.account_id === "overall" ? null : formData.account_id
      });

      if (!validationResult.success) {
        toast.error(validationResult.error.errors[0].message);
        return;
      }

      let currentAmount = 0;

      if (formData.account_id === "overall") {
        // Calculate total balance across all accounts
        const { data: accountsData } = await supabase
          .from("accounts")
          .select("balance")
          .eq("user_id", user.id);
        
        currentAmount = (accountsData || []).reduce((sum, acc) => sum + Number(acc.balance), 0);
      } else {
        // Get the selected account's balance
        const { data: accountData } = await supabase
          .from("accounts")
          .select("balance")
          .eq("id", formData.account_id)
          .single();
        
        currentAmount = accountData?.balance || 0;
      }

      const validated = validationResult.data;
      const { error } = await supabase
        .from("goals")
        .update({
          name: validated.name,
          target_amount: validated.target_amount,
          current_amount: currentAmount,
          start_date: validated.start_date,
          end_date: validated.end_date,
          notes: validated.notes,
          account_id: validated.account_id,
        } as any)
        .eq("id", selectedGoal.id);

      if (error) throw error;

      toast.success("Goal updated successfully");
      setEditDialogOpen(false);
      setSelectedGoal(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to update goal");
    }
  };

  const handleDelete = async () => {
    if (!selectedGoal) return;

    try {
      const { error } = await supabase
        .from("goals")
        .delete()
        .eq("id", selectedGoal.id);

      if (error) throw error;

      toast.success("Goal deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedGoal(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete goal");
    }
  };

  const calculateProgress = (goal: Goal) => {
    return (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
  };

  const calculateMonthsRemaining = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const monthsRemaining = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30));
    return Math.max(0, monthsRemaining);
  };

  const calculateMonthlyTarget = (goal: Goal) => {
    const remaining = Number(goal.target_amount) - Number(goal.current_amount);
    const monthsRemaining = calculateMonthsRemaining(goal.end_date);
    return monthsRemaining > 0 ? remaining / monthsRemaining : remaining;
  };

  const calculateDailyTarget = (goal: Goal) => {
    const remaining = Number(goal.target_amount) - Number(goal.current_amount);
    const today = new Date();
    const end = new Date(goal.end_date);
    const daysRemaining = Math.max(Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)), 0);
    return daysRemaining > 0 ? remaining / daysRemaining : remaining;
  };

  const calculateWeeklyTarget = (goal: Goal) => {
    const remaining = Number(goal.target_amount) - Number(goal.current_amount);
    const today = new Date();
    const end = new Date(goal.end_date);
    const daysRemaining = Math.max(Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)), 0);
    const weeksRemaining = Math.max(Math.ceil(daysRemaining / 7), 0);
    return weeksRemaining > 0 ? remaining / weeksRemaining : remaining;
  };

  const openEditDialog = (goal: Goal) => {
    setSelectedGoal(goal);
    setFormData({
      name: goal.name,
      target_amount: goal.target_amount.toString(),
      current_amount: goal.current_amount.toString(),
      start_date: goal.start_date,
      end_date: goal.end_date,
      notes: goal.notes || "",
      account_id: goal.account_id || "overall",
    });
    setEditDialogOpen(true);
  };

  const GoalForm = ({ onSubmit, buttonText }: { onSubmit: (e: React.FormEvent) => void; buttonText: string }) => {
    // Local state to prevent keyboard dismissal on mobile
    const [localName, setLocalName] = useState(formData.name);
    const [localTargetAmount, setLocalTargetAmount] = useState(formData.target_amount);
    const [localNotes, setLocalNotes] = useState(formData.notes);

    useEffect(() => {
      setLocalName(formData.name);
      setLocalTargetAmount(formData.target_amount);
      setLocalNotes(formData.notes);
    }, [formData.name, formData.target_amount, formData.notes]);

    const handleLocalSubmit = (e: React.FormEvent) => {
      setFormData({ ...formData, name: localName, target_amount: localTargetAmount, notes: localNotes });
      onSubmit(e);
    };

    return (
      <form onSubmit={handleLocalSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Goal Name</Label>
          <Input
            placeholder="e.g., Emergency Fund"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            onBlur={(e) => setFormData({ ...formData, name: e.target.value })}
            autoComplete="off"
            required
          />
        </div>
      <div className="space-y-2">
        <Label>Select Account *</Label>
        <Select value={formData.account_id} onValueChange={(value) => setFormData({ ...formData, account_id: value })} required>
          <SelectTrigger>
            <SelectValue placeholder="Choose which account this goal tracks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="overall">Overall (All Accounts)</SelectItem>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {formData.account_id === "overall" 
            ? "Goal progress will track your total balance across all accounts"
            : "Goal progress will automatically match this account's balance"}
        </p>
      </div>
        <div className="space-y-2">
          <Label>Target Amount</Label>
          <Input
            type="number"
            step="0.01"
            placeholder="10000"
            value={localTargetAmount}
            onChange={(e) => setLocalTargetAmount(e.target.value)}
            onBlur={(e) => setFormData({ ...formData, target_amount: e.target.value })}
            autoComplete="off"
            required
          />
          <p className="text-xs text-muted-foreground">
            💡 Tip: Round numbers are easier to track mentally. Instead of $9,847, aim for $10,000.
          </p>
        </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Input
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Target Date</Label>
          <Input
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            required
          />
        </div>
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
            <h1 className="text-4xl font-bold mb-2 bg-gradient-wealth bg-clip-text text-transparent">Financial Goals</h1>
            <p className="text-muted-foreground">Milestone tracking and progress</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-elegant hover:shadow-luxe transition-all">
                <Plus className="h-4 w-4 mr-2" />
                Create Goal
              </Button>
            </DialogTrigger>
            <DialogContent
              disableFocusTrap
              disableOutsidePointerEvents={false}
            >
              <DialogHeader>
                <DialogTitle>Create Goal</DialogTitle>
                <DialogDescription>Set a new financial goal</DialogDescription>
              </DialogHeader>
              <GoalForm onSubmit={handleSubmit} buttonText="Create Goal" />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 stagger-children">
          {loading ? (
            [1, 2].map((i) => (
              <Card key={i} className="animate-pulse shadow-elegant">
                <CardHeader className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-full mb-4"></div>
                  <div className="h-2 bg-muted rounded w-full"></div>
                </CardContent>
              </Card>
            ))
          ) : goals.length === 0 ? (
            <Card className="col-span-full shadow-luxe border-border/50">
              <CardContent className="text-center py-16">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <p className="text-muted-foreground text-lg">No goals yet</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Create your first milestone</p>
              </CardContent>
            </Card>
          ) : (
            goals.map((goal) => {
              const progress = calculateProgress(goal);
              const monthsRemaining = calculateMonthsRemaining(goal.end_date);
              const monthlyTarget = calculateMonthlyTarget(goal);
              const weeklyTarget = calculateWeeklyTarget(goal);
              const dailyTarget = calculateDailyTarget(goal);
              const linkedAccount = accounts.find(a => a.id === goal.account_id);
              const isGoalComplete = progress >= 100;

              return (
                <Card key={goal.id} className={`shadow-elegant hover:shadow-luxe transition-all duration-500 border-border/50 ${isGoalComplete ? 'bg-gradient-to-br from-success/20 to-primary/20 border-success' : 'bg-gradient-card'} overflow-hidden group`}>
                  <CardHeader className="relative">
                    {isGoalComplete && (
                      <div className="absolute top-2 right-2 animate-bounce">
                        <div className="text-4xl">🎉</div>
                      </div>
                    )}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className={`text-xl mb-2 ${isGoalComplete ? 'text-success' : ''}`}>
                          {goal.name} {isGoalComplete && '✓'}
                        </CardTitle>
                        <CardDescription>
                          {isGoalComplete 
                            ? `🎊 Goal Completed! Reached $${Number(goal.current_amount).toLocaleString()}`
                            : `Target: $${Number(goal.target_amount).toLocaleString()} by ${new Date(goal.end_date).toLocaleDateString()}`
                          }
                        </CardDescription>
                        {goal.account_id ? (
                          linkedAccount && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Linked to: {linkedAccount.name}
                            </p>
                          )
                        ) : (
                          <p className="text-xs text-muted-foreground mt-1">
                            Tracking: Overall Balance
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openEditDialog(goal)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedGoal(goal);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isGoalComplete ? (
                      <div className="space-y-4 text-center py-4">
                        <div className="text-6xl animate-bounce">🎉</div>
                        <div>
                          <h3 className="text-2xl font-bold text-success mb-2">Congratulations!</h3>
                          <p className="text-muted-foreground">You've achieved this goal!</p>
                          <p className="text-lg font-semibold mt-2">${Number(goal.current_amount).toLocaleString()} / ${Number(goal.target_amount).toLocaleString()}</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-muted-foreground">Progress</span>
                            <span className="text-sm font-medium">{progress.toFixed(1)}%</span>
                          </div>
                          <Progress value={progress} className="h-3" />
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-lg font-bold text-success">
                              ${Number(goal.current_amount).toLocaleString()}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              of ${Number(goal.target_amount).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Daily</p>
                            <p className="text-lg font-bold">${dailyTarget.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Weekly</p>
                            <p className="text-lg font-bold">${weeklyTarget.toFixed(0)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Monthly</p>
                            <p className="text-lg font-bold">${monthlyTarget.toFixed(0)}</p>
                          </div>
                        </div>
                      </>
                    )}

                    {!isGoalComplete && monthsRemaining > 0 && progress < 100 && (
                      <div className="bg-primary/10 rounded-lg p-3 text-sm">
                        <p className="font-semibold text-primary mb-1">💡 Reach your goal faster:</p>
                        <ul className="text-muted-foreground space-y-1 text-xs">
                          <li>• Invest savings with potential 7% returns</li>
                          <li>• Cut unnecessary subscriptions or expenses</li>
                          <li>• Start a side hustle to boost income</li>
                          <li>• Sell unused items for quick cash</li>
                        </ul>
                      </div>
                    )}

                    {goal.notes && (
                      <p className="text-sm text-muted-foreground pt-4 border-t border-border">
                        {goal.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent
            disableFocusTrap
            disableOutsidePointerEvents={false}
          >
            <DialogHeader>
              <DialogTitle>Edit Goal</DialogTitle>
              <DialogDescription>Update goal details</DialogDescription>
            </DialogHeader>
            <GoalForm onSubmit={handleEdit} buttonText="Update Goal" />
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Goal</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this goal? This action cannot be undone.
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

export default Goals;
