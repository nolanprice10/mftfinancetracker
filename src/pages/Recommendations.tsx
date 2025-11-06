import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, TrendingDown, PiggyBank, TrendingUp, Target, AlertCircle, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RecommendationCard } from "@/components/RecommendationCard";

const Recommendations = () => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateRecommendations();
  }, []);

  const generateRecommendations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [accountsRes, transactionsRes, goalsRes, investmentsRes, riskProfileRes] = await Promise.all([
        supabase.from("accounts").select("*").eq("user_id", user.id),
        supabase.from("transactions").select("*").eq("user_id", user.id).order("date", { ascending: false }),
        supabase.from("goals").select("*").eq("user_id", user.id),
        supabase.from("investments").select("*").eq("user_id", user.id),
        supabase.from("risk_profiles").select("*").eq("user_id", user.id).single(),
      ]);

      const accounts = accountsRes.data || [];
      const transactions = transactionsRes.data || [];
      const goals = goalsRes.data || [];
      const investments = investmentsRes.data || [];
      const riskProfile = riskProfileRes.data;

      const generatedRecs: any[] = [];
      const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });

      const last90Days = transactions.filter(t => {
        const daysAgo = (Date.now() - new Date(t.date).getTime()) / (1000 * 60 * 60 * 24);
        return daysAgo <= 90;
      });

      const monthlyIncome = monthlyTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0);
      const monthlyExpenses = monthlyTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0);
      const avgMonthlyExpenses = last90Days.filter(t => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0) / 3;

      // Low balance alert
      if (totalBalance < avgMonthlyExpenses * 0.5 && avgMonthlyExpenses > 0) {
        generatedRecs.push({
          icon: AlertCircle,
          title: "Build Emergency Buffer",
          category: "Critical",
          summary: `Your balance ($${totalBalance.toFixed(2)}) is below half your monthly expenses ($${avgMonthlyExpenses.toFixed(2)})`,
          actionItems: [
            { title: "Set up automatic transfer", description: "Move $50-100 to savings every payday", savings: "$200-400/mo" },
            { title: "Create separate emergency account", description: "Open high-yield savings for emergencies only" },
            { title: "Target 3 months expenses", description: `Build toward $${(avgMonthlyExpenses * 3).toFixed(0)} emergency fund` }
          ],
          color: "text-warning",
          bgColor: "bg-warning/10"
        });
      }

      // Category spending recommendations
      if (monthlyExpenses > 0 && monthlyIncome > 0) {
        const categorySpending: Record<string, number> = {};
        monthlyTransactions.filter(t => t.type === "expense").forEach(t => {
          categorySpending[t.category] = (categorySpending[t.category] || 0) + Number(t.amount);
        });

        const topCategories = Object.entries(categorySpending)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3);

        topCategories.forEach(([category, amount]) => {
          const pct = (amount / monthlyIncome) * 100;
          if (pct > 20) {
            const savingsAmount = (amount * 0.2).toFixed(0);
            generatedRecs.push({
              icon: TrendingDown,
              title: `Reduce ${category} Spending`,
              category: "Expense Optimization",
              summary: `You're spending ${pct.toFixed(0)}% of income ($${amount.toFixed(0)}) on ${category}`,
              actionItems: [
                { title: "Track every purchase", description: "Use app to monitor all expenses for 1 week", savings: `$${(amount * 0.10).toFixed(0)}/mo` },
                { title: "Set weekly budget", description: `Limit to $${(amount / 4.33 * 0.85).toFixed(0)} per week`, savings: `$${(amount * 0.15).toFixed(0)}/mo` },
                { title: "Find one expense to cut", description: "Identify and eliminate lowest-value purchase", savings: `$${savingsAmount}/mo` }
              ],
              color: "text-warning",
              bgColor: "bg-warning/10"
            });
          }
        });
      }

      // Investment opportunity
      const totalInvestmentValue = investments.reduce((sum, inv) => sum + Number(inv.current_value), 0);
      const totalMonthlyContribution = investments.reduce((sum, inv) => sum + Number(inv.monthly_contribution), 0);
      
      if (monthlyIncome > 0 && totalBalance > 2000 && totalMonthlyContribution < monthlyIncome * 0.15) {
        const recommendedContribution = Math.min(monthlyIncome * 0.15, 500);
        const riskType = riskProfile?.recommended_profile || 'moderate';
        const annualReturn = riskType === 'conservative' ? 0.06 : riskType === 'moderate' ? 0.08 : 0.10;
        const futureValue10y = recommendedContribution * (((Math.pow(1 + annualReturn/12, 120) - 1) / (annualReturn/12)));

        generatedRecs.push({
          icon: TrendingUp,
          title: `Start Investing $${recommendedContribution.toFixed(0)}/Month`,
          category: "Wealth Building",
          summary: `Grow to $${futureValue10y.toFixed(0)} in 10 years with ${(annualReturn * 100).toFixed(0)}% returns`,
          actionItems: [
            { title: "Open brokerage account", description: "Fidelity, Vanguard, or Schwab - takes 15 minutes" },
            { title: "Enable auto-invest", description: `Set up $${recommendedContribution.toFixed(0)}/month automatic transfer` },
            { title: `Buy ${riskType} portfolio`, description: riskType === 'moderate' ? "70% stocks (VOO/VTI), 30% bonds (BND)" : riskType === 'conservative' ? "40% stocks, 60% bonds" : "90% stocks, 10% bonds" },
            { title: "Max tax-advantaged accounts", description: "Contribute to 401(k) match, then Roth IRA first" }
          ],
          color: "text-success",
          bgColor: "bg-success/10"
        });
      }

      // Income boost
      if (monthlyIncome > 0 && monthlyIncome < 6000) {
        const targetExtra = Math.min(monthlyIncome * 0.25, 1000);
        generatedRecs.push({
          icon: DollarSign,
          title: `Earn Extra $${targetExtra.toFixed(0)}/Month`,
          category: "Income Growth",
          summary: "Side income strategies to boost your earnings",
          actionItems: [
            { title: "Freelance your skills", description: "Upwork/Fiverr: writing, design, coding", savings: `$${(targetExtra * 0.6).toFixed(0)}/mo` },
            { title: "Weekend gig work", description: "DoorDash/Uber: 8 hours/week", savings: `$${(targetExtra * 0.4).toFixed(0)}/mo` },
            { title: "Sell unused items", description: "Facebook Marketplace one-time purge", savings: `$${(targetExtra * 0.8).toFixed(0)} once` },
            { title: "Rent spare room/parking", description: "Passive income opportunity", savings: `$${(targetExtra * 1.2).toFixed(0)}/mo` }
          ],
          color: "text-success",
          bgColor: "bg-success/10"
        });
      }

      // Goal tracking
      goals.forEach(goal => {
        const progress = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
        const remaining = Number(goal.target_amount) - Number(goal.current_amount);
        const daysRemaining = Math.max(Math.ceil((new Date(goal.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)), 0);
        
        if (progress < 100 && daysRemaining > 0) {
          const monthlyNeeded = remaining / (daysRemaining / 30);
          generatedRecs.push({
            icon: Target,
            title: goal.name,
            category: "Goal Progress",
            summary: `${progress.toFixed(0)}% complete - $${remaining.toFixed(0)} to go in ${Math.ceil(daysRemaining / 30)} months`,
            actionItems: [
              { title: "Save monthly target", description: `Set aside $${monthlyNeeded.toFixed(0)}/month to stay on track` },
              { title: "Review goal timeline", description: daysRemaining < 90 ? "Consider extending deadline if needed" : "On track - keep going!" },
              { title: "Automate contributions", description: "Set up automatic transfers on payday" }
            ],
            color: "text-primary",
            bgColor: "bg-primary/10"
          });
        }
      });

      setRecommendations(generatedRecs);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast.error("Failed to generate recommendations");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-8 animate-luxe-fade-in">
          <div className="text-center">Analyzing your finances...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 space-y-6 animate-luxe-fade-in">
        <div className="flex items-center gap-3">
          <Lightbulb className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold bg-gradient-wealth bg-clip-text text-transparent">
            Personalized Recommendations
          </h1>
        </div>

        {recommendations.length === 0 ? (
          <Card className="shadow-elegant border-border/50 bg-gradient-card">
            <CardContent className="py-12 text-center">
              <Lightbulb className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Looking Good!</h3>
              <p className="text-muted-foreground">
                No urgent recommendations. Keep tracking your finances to get personalized insights.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {recommendations.map((rec, index) => (
              <RecommendationCard key={index} {...rec} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Recommendations;
