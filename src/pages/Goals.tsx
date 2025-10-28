import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Target } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  start_date: string;
  end_date: string;
  notes: string | null;
}

const Goals = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    target_amount: "",
    current_amount: "0",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    notes: "",
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id)
        .order("end_date", { ascending: true });

      if (error) throw error;
      setGoals(data || []);
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

      const { error } = await supabase.from("goals").insert({
        user_id: user.id,
        name: formData.name,
        target_amount: parseFloat(formData.target_amount),
        current_amount: parseFloat(formData.current_amount),
        start_date: formData.start_date,
        end_date: formData.end_date,
        notes: formData.notes || null,
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
      });
      fetchGoals();
    } catch (error: any) {
      toast.error(error.message || "Failed to create goal");
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

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Financial Goals</h1>
            <p className="text-muted-foreground">Track your savings and investment goals</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Goal</DialogTitle>
                <DialogDescription>Set a new financial goal</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Goal Name</Label>
                  <Input
                    placeholder="e.g., Emergency Fund"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Target Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="10000"
                      value={formData.target_amount}
                      onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Current Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      value={formData.current_amount}
                      onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                      required
                    />
                  </div>
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
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">Create Goal</Button>
              </form>
            </DialogContent>
          </Dialog>
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
                  <div className="h-8 bg-muted rounded w-full mb-4"></div>
                  <div className="h-2 bg-muted rounded w-full"></div>
                </CardContent>
              </Card>
            ))
          ) : goals.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="text-center py-12 text-muted-foreground">
                No goals yet. Create your first goal to start tracking your progress!
              </CardContent>
            </Card>
          ) : (
            goals.map((goal) => {
              const progress = calculateProgress(goal);
              const monthsRemaining = calculateMonthsRemaining(goal.end_date);
              const monthlyTarget = calculateMonthlyTarget(goal);

              return (
                <Card key={goal.id} className="shadow-md hover:shadow-glow transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{goal.name}</CardTitle>
                        <CardDescription>
                          Target: ${Number(goal.target_amount).toLocaleString()} by {new Date(goal.end_date).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="p-3 bg-gradient-primary rounded-xl">
                        <Target className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
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

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Months Remaining</p>
                        <p className="text-2xl font-bold">{monthsRemaining}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Monthly Target</p>
                        <p className="text-2xl font-bold">${monthlyTarget.toFixed(0)}</p>
                      </div>
                    </div>

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
      </div>
    </Layout>
  );
};

export default Goals;
