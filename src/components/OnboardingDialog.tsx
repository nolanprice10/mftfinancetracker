import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, Check } from "lucide-react";
import { toast } from "sonner";

interface OnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OnboardingDialog = ({ open, onOpenChange }: OnboardingDialogProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    monthlyIncome: "5000",
    monthlySpending: "3500",
    goalAmount: "10000",
    goalMonths: "12"
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
      const goalMonths = parseInt(formData.goalMonths) || 12;

      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + goalMonths);

      await supabase.from("goals").insert({
        user_id: user.id,
        name: "Savings Goal",
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

      toast.success("Setup complete!");
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
            <div className="p-4 rounded-full bg-gradient-primary">
              <Target className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <DialogTitle className="text-2xl text-center">Let's get started</DialogTitle>
          <DialogDescription className="text-center">
            Answer 3 quick questions to see if you're on track
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="income">Income per month</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="income"
                type="number"
                placeholder="5000"
                className="pl-7"
                value={formData.monthlyIncome}
                onChange={(e) => setFormData({...formData, monthlyIncome: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="spending">Monthly spending</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="spending"
                type="number"
                placeholder="3500"
                className="pl-7"
                value={formData.monthlySpending}
                onChange={(e) => setFormData({...formData, monthlySpending: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal">One goal you have</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="goal"
                  type="number"
                  placeholder="10000"
                  className="pl-7"
                  value={formData.goalAmount}
                  onChange={(e) => setFormData({...formData, goalAmount: e.target.value})}
                  required
                />
              </div>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="12"
                  value={formData.goalMonths}
                  onChange={(e) => setFormData({...formData, goalMonths: e.target.value})}
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">months</span>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={submitting}
          >
            {submitting ? (
              "Setting up..."
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Show me my probability
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Takes 10 seconds • See results immediately
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};
