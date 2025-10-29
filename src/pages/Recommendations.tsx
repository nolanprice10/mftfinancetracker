import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, TrendingDown, PiggyBank, TrendingUp, Target, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Recommendation {
  id: string;
  type: string;
  title: string;
  message: string;
  icon: any;
  color: string;
  bgColor: string;
}

const Recommendations = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateRecommendations();
  }, []);

  const generateRecommendations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user financial data
      const [accountsRes, transactionsRes, goalsRes, investmentsRes] = await Promise.all([
        supabase.from("accounts").select("*").eq("user_id", user.id),
        supabase.from("transactions").select("*").eq("user_id", user.id).order("date", { ascending: false }),
        supabase.from("goals").select("*").eq("user_id", user.id),
        supabase.from("investments").select("*").eq("user_id", user.id),
      ]);

      const accounts = accountsRes.data || [];
      const transactions = transactionsRes.data || [];
      const goals = goalsRes.data || [];
      const investments = investmentsRes.data || [];

      const generatedRecs: Recommendation[] = [];

      // Calculate totals
      const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });

      const last90Days = transactions.filter(t => {
        const date = new Date(t.date);
        const daysAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
        return daysAgo <= 90;
      });

      const monthlyIncome = monthlyTransactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);
        
      const monthlyExpenses = monthlyTransactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const avgMonthlyExpenses = last90Days
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0) / 3;

      // Rule 1: Low balance alert
      if (totalBalance < avgMonthlyExpenses * 0.5 && avgMonthlyExpenses > 0) {
        generatedRecs.push({
          id: "low-balance",
          type: "warning",
          title: "Low Balance Alert",
          message: `Your total balance ($${totalBalance.toFixed(2)}) is below half your average monthly expenses ($${avgMonthlyExpenses.toFixed(2)}). Consider building an emergency fund.`,
          icon: AlertCircle,
          color: "text-warning",
          bgColor: "bg-warning/10",
        });
      }

      // Rule 2: High spending in categories
      if (monthlyExpenses > 0 && monthlyIncome > 0) {
        const categorySpending: Record<string, number> = {};
        monthlyTransactions
          .filter(t => t.type === "expense")
          .forEach(t => {
            categorySpending[t.category] = (categorySpending[t.category] || 0) + Number(t.amount);
          });

        Object.entries(categorySpending).forEach(([category, amount]) => {
          const pct = (amount / monthlyIncome) * 100;
          if (pct > 25) {
            generatedRecs.push({
              id: `high-${category}`,
              type: "spending",
              title: `Reduce ${category} Expenses`,
              message: `You spent ${pct.toFixed(0)}% of your monthly income on ${category} ($${amount.toFixed(2)}). Consider reducing by 10% to save $${(amount * 0.1).toFixed(2)}/month.`,
              icon: TrendingDown,
              color: "text-warning",
              bgColor: "bg-warning/10",
            });
          }
        });
      }

      // Rule 3: Emergency fund recommendation
      if (totalBalance < avgMonthlyExpenses * 3 && avgMonthlyExpenses > 0) {
        const needed = avgMonthlyExpenses * 3 - totalBalance;
        generatedRecs.push({
          id: "emergency-fund",
          type: "saving",
          title: "Build Emergency Fund",
          message: `Financial experts recommend 3-6 months of expenses in savings. You need $${needed.toFixed(2)} more to reach 3 months ($${(avgMonthlyExpenses * 3).toFixed(2)}).`,
          icon: PiggyBank,
          color: "text-primary",
          bgColor: "bg-primary/10",
        });
      }

      // Rule 4: Investment opportunities
      const totalInvestmentValue = investments.reduce((sum, inv) => sum + Number(inv.current_value), 0);
      const totalMonthlyContribution = investments.reduce((sum, inv) => sum + Number(inv.monthly_contribution), 0);
      
      if (monthlyIncome > 0 && totalBalance > 2000 && totalMonthlyContribution < monthlyIncome * 0.1) {
        const recommendedContribution = Math.min(monthlyIncome * 0.1, totalBalance * 0.05);
        generatedRecs.push({
          id: "investment-opportunity",
          type: "investment",
          title: "Increase Investment Contributions",
          message: `With $${totalBalance.toFixed(2)} available, consider investing $${recommendedContribution.toFixed(2)}/month. This is general information, not personalized financial advice.`,
          icon: TrendingUp,
          color: "text-success",
          bgColor: "bg-success/10",
        });
      }

      // Rule 5: Goal progress tracking
      goals.forEach(goal => {
        const progress = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
        const endDate = new Date(goal.end_date);
        const today = new Date();
        const monthsRemaining = Math.max(
          Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)),
          0
        );
        const monthlyTarget = monthsRemaining > 0 
          ? (Number(goal.target_amount) - Number(goal.current_amount)) / monthsRemaining 
          : 0;

        if (progress < 50 && monthsRemaining > 0 && monthsRemaining < 6) {
          generatedRecs.push({
            id: `goal-${goal.id}`,
            type: "goal",
            title: `${goal.name} Behind Schedule`,
            message: `You're ${progress.toFixed(0)}% toward your goal. To reach $${Number(goal.target_amount).toFixed(0)} by ${endDate.toLocaleDateString()}, save $${monthlyTarget.toFixed(2)}/month.`,
            icon: Target,
            color: "text-accent",
            bgColor: "bg-accent/10",
          });
        } else if (progress >= 80) {
          generatedRecs.push({
            id: `goal-success-${goal.id}`,
            type: "goal",
            title: `${goal.name} Almost Complete!`,
            message: `Great progress! You're ${progress.toFixed(0)}% toward your goal. Only $${(Number(goal.target_amount) - Number(goal.current_amount)).toFixed(2)} left!`,
            icon: Target,
            color: "text-success",
            bgColor: "bg-success/10",
          });
        }
      });

      // If no data, show getting started message
      if (transactions.length === 0) {
        generatedRecs.push({
          id: "getting-started",
          type: "info",
          title: "Get Started",
          message: "Add your first transactions to receive personalized financial recommendations based on your spending patterns.",
          icon: Lightbulb,
          color: "text-primary",
          bgColor: "bg-primary/10",
        });
      }

      setRecommendations(generatedRecs);
    } catch (error) {
      console.error("Error generating recommendations:", error);
      toast.error("Failed to generate recommendations");
    } finally {
      setLoading(false);
    }
  };

  const typeColors: Record<string, string> = {
    spending: "bg-warning",
    saving: "bg-primary",
    investment: "bg-success",
    goal: "bg-accent",
    warning: "bg-destructive",
    info: "bg-muted",
  };

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-muted rounded-xl"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 bg-muted rounded-xl"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold mb-2">Recommendations</h1>
          <p className="text-muted-foreground">Personalized insights based on your financial activity</p>
        </div>

        <Card className="bg-gradient-primary shadow-lg border-none text-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-6 w-6" />
              <CardTitle>Smart Financial Insights</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-white/90">
              These recommendations are generated by analyzing your spending patterns, savings goals, and investment portfolio. 
              They update automatically as your financial situation changes.
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {recommendations.map((recommendation) => {
            const Icon = recommendation.icon;
            return (
              <Card key={recommendation.id} className="shadow-md hover:shadow-glow transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={typeColors[recommendation.type]}>
                          {recommendation.type}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl">{recommendation.title}</CardTitle>
                    </div>
                    <div className={`p-3 rounded-xl ${recommendation.bgColor}`}>
                      <Icon className={`h-6 w-6 ${recommendation.color}`} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{recommendation.message}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={generateRecommendations}>
                      Refresh
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-sm">About Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Recommendations are generated based on your transaction history, account balances, and financial goals. 
              They are provided for informational purposes only and should not be considered as personalized financial advice. 
              Always consult with a licensed financial advisor before making significant financial decisions.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Recommendations;
