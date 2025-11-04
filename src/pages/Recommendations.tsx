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

      // Rule 2: Specific spending cut recommendations by category
      if (monthlyExpenses > 0 && monthlyIncome > 0) {
        const categorySpending: Record<string, number> = {};
        monthlyTransactions
          .filter(t => t.type === "expense")
          .forEach(t => {
            categorySpending[t.category] = (categorySpending[t.category] || 0) + Number(t.amount);
          });

        // Category-specific actionable recommendations
        const categoryAdvice: Record<string, (amount: number) => string> = {
          "Food": (amt) => `You spent $${amt.toFixed(2)} on food this month. Try: (1) Meal prep Sundays - save $${(amt * 0.25).toFixed(0)}/month, (2) Pack lunch 3x/week - save $${(amt * 0.15).toFixed(0)}/month, (3) Use generic brands - save $${(amt * 0.10).toFixed(0)}/month, (4) Cut one restaurant visit/week - save $${Math.min(amt * 0.15, 160).toFixed(0)}/month.`,
          "Shopping": (amt) => `You spent $${amt.toFixed(2)} on shopping. Cut back with: (1) 30-day rule: wait 30 days before non-essential purchases, (2) Unsubscribe from promotional emails, (3) Use cashback apps (Rakuten, Honey) - earn $${(amt * 0.03).toFixed(0)}/month back, (4) Try a "no-spend" challenge for 1 week/month - save $${(amt * 0.25).toFixed(0)}.`,
          "Entertainment": (amt) => `Entertainment costs: $${amt.toFixed(2)}/month. Reduce by: (1) Share streaming services with family - save $${Math.min(amt * 0.40, 50).toFixed(0)}/month, (2) Use library for books/movies - save $${Math.min(amt * 0.15, 30).toFixed(0)}/month, (3) Find free local events, (4) Rotate subscriptions (Netflix one month, Hulu next) - save $${Math.min(amt * 0.33, 40).toFixed(0)}/month.`,
          "Transportation": (amt) => `Transportation: $${amt.toFixed(2)}/month. Save by: (1) Carpool 2x/week - save $${(amt * 0.20).toFixed(0)}/month on gas, (2) Use public transit when possible - save $${(amt * 0.30).toFixed(0)}/month, (3) Bike for trips under 3 miles, (4) Compare gas prices with GasBuddy app - save $${(amt * 0.05).toFixed(0)}/month.`,
          "Utilities": (amt) => `Utilities: $${amt.toFixed(2)}/month. Lower by: (1) LED bulbs in 10 fixtures - save $${Math.min(amt * 0.12, 15).toFixed(0)}/month, (2) Smart thermostat (adjust 3°) - save $${Math.min(amt * 0.10, 20).toFixed(0)}/month, (3) Unplug "vampire" devices - save $${Math.min(amt * 0.08, 12).toFixed(0)}/month, (4) Cold water for laundry - save $${Math.min(amt * 0.05, 8).toFixed(0)}/month.`,
          "Healthcare": (amt) => `Healthcare: $${amt.toFixed(2)}/month. Optimize by: (1) Use generic medications - save $${(amt * 0.20).toFixed(0)}/month, (2) Check if eligible for HSA/FSA tax savings, (3) Use GoodRx for prescription discounts - potential $${(amt * 0.15).toFixed(0)}/month savings, (4) Preventive care to avoid bigger bills later.`,
        };

        Object.entries(categorySpending).forEach(([category, amount]) => {
          const pct = (amount / monthlyIncome) * 100;
          if (pct > 25) {
            const advice = categoryAdvice[category] 
              ? categoryAdvice[category](amount)
              : `You spent ${pct.toFixed(0)}% of income ($${amount.toFixed(2)}) on ${category}. Try: (1) Track every purchase for 1 week to identify waste, (2) Set a weekly budget of $${(amount / 4.33 * 0.85).toFixed(0)}, (3) Find one expense to eliminate - save $${(amount * 0.15).toFixed(0)}/month.`;
            
            generatedRecs.push({
              id: `high-${category}`,
              type: "spending",
              title: `Cut ${category} Spending by $${(amount * 0.2).toFixed(0)}/Month`,
              message: advice,
              icon: TrendingDown,
              color: "text-warning",
              bgColor: "bg-warning/10",
            });
          }
        });

        // Add general savings strategies if spending is high but no category dominates
        if (monthlyExpenses > monthlyIncome * 0.8 && Object.keys(categorySpending).length > 0) {
          const topCategories = Object.entries(categorySpending)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3);
          
          generatedRecs.push({
            id: "general-savings",
            type: "saving",
            title: "Universal Money-Saving Strategies",
            message: `Your top expenses: ${topCategories.map(([cat, amt]) => `${cat} ($${amt.toFixed(0)})`).join(", ")}. Quick wins: (1) Negotiate bills (internet, phone, insurance) - save $50-100/month, (2) Cancel unused subscriptions - average person wastes $80/month, (3) Use cashback credit card for all purchases - earn 1.5-2% back ($${(monthlyExpenses * 0.015).toFixed(0)}/month), (4) Automate savings: transfer $${Math.min(monthlyIncome * 0.10, 500).toFixed(0)} to savings on payday.`,
            icon: PiggyBank,
            color: "text-primary",
            bgColor: "bg-primary/10",
          });
        }
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

      // Rule 4: Detailed investment opportunities with compound growth projections
      const totalInvestmentValue = investments.reduce((sum, inv) => sum + Number(inv.current_value), 0);
      const totalMonthlyContribution = investments.reduce((sum, inv) => sum + Number(inv.monthly_contribution), 0);
      
      if (monthlyIncome > 0 && totalBalance > 2000 && totalMonthlyContribution < monthlyIncome * 0.15) {
        const recommendedContribution = Math.min(monthlyIncome * 0.15, totalBalance * 0.05);
        const riskType = riskProfile?.recommended_profile || 'moderate';
        
        // Calculate 10-year compound growth projection
        const yearsToProject = 10;
        const annualReturn = riskType === 'conservative' ? 0.06 : riskType === 'moderate' ? 0.08 : 0.10;
        const monthlyReturn = annualReturn / 12;
        const futureValue = recommendedContribution * (((Math.pow(1 + monthlyReturn, yearsToProject * 12) - 1) / monthlyReturn));
        const totalContributed = recommendedContribution * yearsToProject * 12;
        const earnings = futureValue - totalContributed;
        
        let investmentDetails = '';
        if (riskType === 'conservative') {
          investmentDetails = `Start with: (1) Vanguard Total Bond (BND) - 50% allocation for stability, (2) Dividend Aristocrats ETF (NOBL) - 30% for steady income, (3) High-yield savings (Ally, Marcus) - 15% for liquidity, (4) Treasury I-Bonds - 5% for inflation protection. Expected: 6% annual return = $${futureValue.toFixed(0)} in ${yearsToProject} years ($${earnings.toFixed(0)} in gains).`;
        } else if (riskType === 'moderate') {
          investmentDetails = `Balanced portfolio: (1) S&P 500 Index (VOO or SPY) - 35% for market returns, (2) Total Stock Market (VTI) - 25% for diversification, (3) Total Bond Market (BND) - 20% for stability, (4) Tech Growth (QQQ) - 12% for upside, (5) International (VXUS) - 8% for global exposure. Expected: 8% annual return = $${futureValue.toFixed(0)} in ${yearsToProject} years ($${earnings.toFixed(0)} in gains).`;
        } else {
          investmentDetails = `Growth-focused: (1) Nasdaq 100 (QQQ) - 35% for tech exposure, (2) Growth ETF (ARKK or VUG) - 25% for innovation, (3) S&P 500 (VOO) - 20% for stability, (4) Emerging Markets (VWO or IEMG) - 12% for high growth, (5) Small Cap (VB) - 8% for aggressive gains. Expected: 10% annual return = $${futureValue.toFixed(0)} in ${yearsToProject} years ($${earnings.toFixed(0)} in gains).`;
        }
        
        generatedRecs.push({
          id: "investment-opportunity",
          type: "investment",
          title: `Invest $${recommendedContribution.toFixed(0)}/Month → Earn $${earnings.toFixed(0)} in ${yearsToProject} Years`,
          message: `Investing just $${recommendedContribution.toFixed(2)}/month (${((recommendedContribution/monthlyIncome)*100).toFixed(0)}% of income) could grow to $${futureValue.toFixed(0)} by year ${yearsToProject}. ${investmentDetails} Open account with: Fidelity, Vanguard, or Charles Schwab (no minimum, commission-free). This is educational information, not financial advice.`,
          icon: TrendingUp,
          color: "text-success",
          bgColor: "bg-success/10",
        });
      }

      // Rule 4b: Income generation opportunities
      if (monthlyIncome > 0 && monthlyIncome < 6000) {
        const targetExtra = Math.min(monthlyIncome * 0.25, 1000);
        
        generatedRecs.push({
          id: "income-opportunities",
          type: "investment",
          title: `Boost Income by $${targetExtra.toFixed(0)}/Month`,
          message: `Ways to earn an extra $${targetExtra.toFixed(0)}/month: (1) Freelance your skills on Upwork/Fiverr (writing, design, coding) - $25-100/hr, start with 5 hrs/week, (2) Gig economy (DoorDash, Uber) - $15-25/hr on weekends, 8 hrs/week = $${Math.min(targetExtra * 0.5, 500).toFixed(0)}/month, (3) Sell unused items on Facebook Marketplace/eBay - one-time $${Math.min(targetExtra * 0.8, 400).toFixed(0)}, then $${Math.min(targetExtra * 0.3, 150).toFixed(0)}/month ongoing, (4) Online tutoring (Wyzant, Chegg) - $20-40/hr, (5) Rent spare room/parking space - $${Math.min(targetExtra * 1.5, 800).toFixed(0)}/month passive, (6) Create digital products (templates, courses) on Etsy/Gumroad - start small, scale to $${Math.min(targetExtra * 0.6, 300).toFixed(0)}/month. Pick ONE to start this week.`,
          icon: TrendingUp,
          color: "text-success",
          bgColor: "bg-success/10",
        });
      }

      // Rule 5: Enhanced goal progress tracking with specific action items
      goals.forEach(goal => {
        const progress = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
        const endDate = new Date(goal.end_date);
        const today = new Date();
        const daysRemaining = Math.max(Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)), 0);
        const weeksRemaining = Math.max(Math.ceil(daysRemaining / 7), 0);
        const monthsRemaining = Math.max(Math.ceil(daysRemaining / 30), 0);
        
        const remaining = Number(goal.target_amount) - Number(goal.current_amount);
        const dailyTarget = daysRemaining > 0 ? remaining / daysRemaining : 0;
        const weeklyTarget = weeksRemaining > 0 ? remaining / weeksRemaining : 0;
        const monthlyTarget = monthsRemaining > 0 ? remaining / monthsRemaining : 0;

        if (progress >= 100) {
          // Goal achieved!
          const excess = Number(goal.current_amount) - Number(goal.target_amount);
          generatedRecs.push({
            id: `goal-achieved-${goal.id}`,
            type: "goal",
            title: `🎉 ${goal.name} Achieved!`,
            message: `Congratulations! You've reached your goal of $${Number(goal.target_amount).toLocaleString()} (currently at $${Number(goal.current_amount).toLocaleString()}). Consider setting a new financial goal or investing the surplus ($${excess.toFixed(2)}) for long-term growth.`,
            icon: Target,
            color: "text-success",
            bgColor: "bg-success/10",
          });
        } else if (progress < 50 && monthsRemaining > 0 && monthsRemaining < 6) {
          // Calculate how investment could help
          const assumedReturn = 0.07; // 7% annual return
          const monthsToInvest = monthsRemaining;
          const investmentBoost = monthlyTarget * ((Math.pow(1 + assumedReturn/12, monthsToInvest) - 1) / (assumedReturn/12)) - (monthlyTarget * monthsToInvest);
          
          generatedRecs.push({
            id: `goal-${goal.id}`,
            type: "goal",
            title: `Accelerate ${goal.name}`,
            message: `You're ${progress.toFixed(0)}% complete. Save $${dailyTarget.toFixed(2)}/day, $${weeklyTarget.toFixed(2)}/week, or $${monthlyTarget.toFixed(2)}/month to reach your goal by ${endDate.toLocaleDateString()}. 💡 To get there faster: (1) Invest savings with potential 7% returns (could gain ~$${investmentBoost.toFixed(0)}), (2) Find $${(monthlyTarget * 0.2).toFixed(0)}/month in expense reductions, (3) Pick up a side hustle earning $${(monthlyTarget * 0.5).toFixed(0)}/month.`,
            icon: Target,
            color: "text-accent",
            bgColor: "bg-accent/10",
          });
        } else if (progress >= 80 && progress < 100) {
          generatedRecs.push({
            id: `goal-success-${goal.id}`,
            type: "goal",
            title: `${goal.name} Almost Complete!`,
            message: `Great progress! You're ${progress.toFixed(0)}% there. Just $${dailyTarget.toFixed(2)}/day or $${weeklyTarget.toFixed(2)}/week needed. Final push: Cut one subscription ($10-15/month) or sell unused items to finish faster!`,
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
