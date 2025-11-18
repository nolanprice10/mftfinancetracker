import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Wallet, Landmark, Target, TrendingUp, Check } from "lucide-react";

const onboardingSteps = [
  {
    id: "welcome",
    title: "Welcome to MyFinanceTracker",
    description: "Your personal finance management companion for achieving financial wellness",
    icon: Wallet,
    content: "Track your accounts, transactions, goals, and investments all in one elegant platform designed with the sophistication you deserve.",
  },
  {
    id: "accounts",
    title: "Manage Your Accounts",
    description: "Add and track all your financial accounts",
    icon: Landmark,
    content: "Start by adding your checking, savings, and investment accounts. Your account balances automatically update as you record transactions.",
  },
  {
    id: "goals",
    title: "Set Financial Goals",
    description: "Define and track your savings objectives",
    icon: Target,
    content: "Create goals linked to specific accounts. Watch your progress automatically update as your account balances grow toward your targets.",
  },
  {
    id: "investments",
    title: "Track Investments",
    description: "Monitor your investment portfolio growth",
    icon: TrendingUp,
    content: "Add your investment accounts, from index funds to individual stocks. Project future values based on contributions and expected returns.",
  },
];

interface OnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OnboardingDialog = ({ open, onOpenChange }: OnboardingDialogProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;
  const step = onboardingSteps[currentStep];
  const StepIcon = step.icon;

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        onOpenChange(false);
        return;
      }

      // Use upsert with onConflict to handle existing records
      await supabase.from("onboarding_progress").upsert(
        {
          user_id: user.id,
          completed: true,
          steps_completed: onboardingSteps.map(s => s.id),
          updated_at: new Date().toISOString(),
        },
        { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        }
      );
    } catch (error) {
      console.error("Failed to save onboarding progress:", error);
    } finally {
      // Always close the dialog regardless of save success
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        forceMount
        disableFocusTrap
        disableOutsidePointerEvents={false}
        className="sm:max-w-md"
      >
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 rounded-full bg-gradient-primary">
              <StepIcon className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <DialogTitle className="text-2xl text-center">{step.title}</DialogTitle>
          <DialogDescription className="text-center">
            {step.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Progress value={progress} className="h-2" />
          
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-sm leading-relaxed">{step.content}</p>
          </div>

          <div className="flex items-center justify-center gap-2">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === currentStep
                    ? "bg-primary w-6"
                    : index < currentStep
                    ? "bg-primary/50"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleSkip} className="flex-1">
              Skip Tour
            </Button>
            <Button onClick={handleNext} className="flex-1">
              {currentStep === onboardingSteps.length - 1 ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Get Started
                </>
              ) : (
                "Next"
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Step {currentStep + 1} of {onboardingSteps.length}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
