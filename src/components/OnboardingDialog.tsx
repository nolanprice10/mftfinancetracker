import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, Check, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface OnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OnboardingDialog = ({ open, onOpenChange }: OnboardingDialogProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    monthlyIncome: "6000",
    monthlySpending: "4000",
    goalAmount: "25000",
    goalMonths: "24",
    goalName: "Down payment"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (submitting) return;
    setSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create initial checking account
      const { data: accountData, error: accountError } = await supabase
        .from("accounts")
        .insert({
          user_id: user.id,
          name: "Checking Account",
          type: "checking",
          balance: 0
        })
        .select()
        .single();

      if (accountError) throw accountError;

      // Create initial goal
      const monthlyIncome = parseFloat(formData.monthlyIncome) || 0;
      const monthlySpending = parseFloat(formData.monthlySpending) || 0;
      const monthlySavings = monthlyIncome - monthlySpending;
      const goalAmount = parseFloat(formData.goalAmount) || 0;
      const goalMonths = parseInt(formData.goalMonths) || 24;
      const goalName = formData.goalName || "Savings Goal";

      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + goalMonths);

      await supabase.from("goals").insert({
        user_id: user.id,
        name: goalName,
        target_amount: goalAmount,
        current_amount: 0,
        start_date: new Date().toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        account_id: accountData.id,
        notes: `Monthly income: $${monthlyIncome.toFixed(0)}, Monthly spending: $${monthlySpending.toFixed(0)}, Monthly savings: $${monthlySavings.toFixed(0)}`
      });

      // Mark onboarding complete
      await supabase.from("onboarding_progress").upsert({
        user_id: user.id,
        completed: true,
        steps_completed: ["quick-setup"],
      });

      toast.success("Setup complete! Let's see your odds.");
      onOpenChange(false);
      window.location.reload();
    } catch (error: any) {
      console.error("Failed to complete onboarding:", error);
      toast.error("Setup failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-2xl text-center">Will you hit your goal?</DialogTitle>
          <DialogDescription className="text-center">
            Get certainty in 30 seconds. No guessing, no advice—just numbers.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="goal">What's your goal?</Label>
            <Input
              id="goal"
              type="text"
              placeholder="e.g., Down payment, Emergency fund"
              value={formData.goalName}
              onChange={(e) => setFormData({...formData, goalName: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="income">Monthly take-home</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="income"
                type="number"
                placeholder="6000"
                className="pl-7"
                value={formData.monthlyIncome}
                onChange={(e) => setFormData({...formData, monthlyIncome: e.target.value})}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">After taxes</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="spending">Monthly spending</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="spending"
                type="number"
                placeholder="4000"
                className="pl-7"
                value={formData.monthlySpending}
                onChange={(e) => setFormData({...formData, monthlySpending: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-amount">Goal amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="goal-amount"
                type="number"
                placeholder="25000"
                className="pl-7"
                value={formData.goalAmount}
                onChange={(e) => setFormData({...formData, goalAmount: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-months">Timeline (months)</Label>
            <Input
              id="goal-months"
              type="number"
              placeholder="24"
              value={formData.goalMonths}
              onChange={(e) => setFormData({...formData, goalMonths: e.target.value})}
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={submitting}
          >
            {submitting ? (
              "Calculating..."
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Calculate My Probability
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Takes 30 seconds • See your number immediately
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};

