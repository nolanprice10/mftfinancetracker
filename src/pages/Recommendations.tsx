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

      const [accountsRes, transactionsRes, goalsRes, investmentsRes, riskProfileRes, profileRes] = await Promise.all([
        supabase.from("accounts").select("*").eq("user_id", user.id),
        supabase.from("transactions").select("*").eq("user_id", user.id).order("date", { ascending: false }),
        supabase.from("goals").select("*").eq("user_id", user.id),
        supabase.from("investments").select("*").eq("user_id", user.id),
        supabase.from("risk_profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("profiles").select("birthday").eq("id", user.id).single(),
      ]);

      const accounts = accountsRes.data || [];
      const transactions = transactionsRes.data || [];
      const goals = goalsRes.data || [];
      const investments = investmentsRes.data || [];
      const riskProfile = riskProfileRes.data;
      const profile = profileRes.data;

      // Calculate age from birthday
      let age = null;
      let yearsToRetirement = null;
      if (profile?.birthday) {
        const today = new Date();
        const birthDate = new Date(profile.birthday);
        age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        yearsToRetirement = Math.max(0, 65 - age);
      }

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

      // Low balance alert with age-specific advice
      if (totalBalance < avgMonthlyExpenses * 0.5 && avgMonthlyExpenses > 0) {
        const targetBuffer = avgMonthlyExpenses * 3;
        let ageSpecificAdvice = [];
        
        if (age && age < 25) {
          ageSpecificAdvice = [
            { title: "Start small, build habits", description: "Even $25/week builds to $1,300/year - consistency matters more than amount at your age", savings: "$100/mo" },
            { title: "Use your age advantage", description: "You have time to recover from setbacks - focus on building the saving habit now" },
            { title: "Automate everything", description: "Set up auto-transfer on payday - save before you can spend it" }
          ];
        } else if (age && age >= 25 && age < 40) {
          ageSpecificAdvice = [
            { title: "Build 3-6 month emergency fund", description: `Target $${targetBuffer.toFixed(0)} to cover job loss or emergency`, savings: `$${(targetBuffer / 12).toFixed(0)}/mo` },
            { title: "Use high-yield savings (4-5% APY)", description: "Marcus, Ally, or Wealthfront - your emergency fund should earn interest", savings: "$40-60/year per $1k" },
            { title: "Separate needs vs wants", description: "At this life stage, prioritize financial stability for major life decisions ahead" }
          ];
        } else if (age && age >= 40 && age < 55) {
          ageSpecificAdvice = [
            { title: "URGENT: Build 6-9 month fund", description: `Mid-career job loss takes longer to recover - need $${(targetBuffer * 2).toFixed(0)}`, savings: "Critical protection" },
            { title: "Protect against health costs", description: "HSA contributions if eligible - triple tax advantage for emergencies" },
            { title: "Review insurance coverage", description: "Adequate life/disability insurance is emergency fund backup" }
          ];
        } else if (age && age >= 55) {
          ageSpecificAdvice = [
            { title: "Near-retirement safety", description: `Need 12 months expenses ($${(avgMonthlyExpenses * 12).toFixed(0)}) - less time to recover from setbacks`, savings: "Essential" },
            { title: "Medicare gap planning", description: "Budget extra for healthcare between retirement and Medicare at 65" },
            { title: "Consider CD ladder", description: "Lock in rates for predictable emergency access" }
          ];
        }

        generatedRecs.push({
          icon: AlertCircle,
          title: age ? `Build Emergency Buffer (Age ${age})` : "Build Emergency Buffer",
          category: "Critical",
          summary: `Your balance ($${totalBalance.toFixed(2)}) is dangerously low. ${age && age >= 40 ? 'At your age, this is high priority!' : 'Build this safety net first!'}`,
          actionItems: ageSpecificAdvice.length > 0 ? ageSpecificAdvice : [
            { title: "Set up automatic transfer", description: "Move $50-100 to savings every payday", savings: "$200-400/mo" },
            { title: "Create separate emergency account", description: "Open high-yield savings for emergencies only" }
          ],
          color: "text-warning",
          bgColor: "bg-warning/10"
        });
      }

      // Category spending recommendations with income-specific advice
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
            
            let incomeBasedTips = [];
            if (monthlyIncome < 3000) {
              incomeBasedTips = [
                { title: "Every dollar counts", description: `At $${monthlyIncome.toFixed(0)}/mo income, cutting $${savingsAmount} = ${((parseFloat(savingsAmount) / monthlyIncome) * 100).toFixed(0)}% income boost`, savings: `$${savingsAmount}/mo` },
                { title: "Generic alternatives", description: `Switch to store brands - saves 30-40% on ${category}`, savings: `$${(amount * 0.35).toFixed(0)}/mo` },
                { title: "Track with cash envelopes", description: "Physical cash helps stick to budget when margin is tight" }
              ];
            } else if (monthlyIncome >= 3000 && monthlyIncome < 7000) {
              incomeBasedTips = [
                { title: "Optimize middle-income traps", description: `You can afford ${category}, but ${pct.toFixed(0)}% is lifestyle creep`, savings: `$${savingsAmount}/mo` },
                { title: "50/30/20 rule violation", description: `This category alone exceeds 20% - should be under $${(monthlyIncome * 0.20).toFixed(0)}`, savings: `$${(amount - monthlyIncome * 0.20).toFixed(0)}/mo` },
                { title: "Redirect to investments", description: "You're past survival mode - cut here, invest difference" }
              ];
            } else {
              incomeBasedTips = [
                { title: "High income opportunity", description: `At $${monthlyIncome.toFixed(0)}/mo, you have flexibility - redirect $${savingsAmount} to wealth building`, savings: `$${savingsAmount}/mo` },
                { title: "Lifestyle inflation check", description: `Spending ${pct.toFixed(0)}% on ${category} suggests purchases matching income, not needs` },
                { title: "Increase investment rate", description: "Should be saving 20%+ of income - this category is preventing that" }
              ];
            }
            
            generatedRecs.push({
              icon: TrendingDown,
              title: `Reduce ${category} (${pct.toFixed(0)}% of Income)`,
              category: "Expense Optimization",
              summary: `$${amount.toFixed(0)}/mo on ${category} relative to $${monthlyIncome.toFixed(0)} income`,
              actionItems: incomeBasedTips,
              color: "text-warning",
              bgColor: "bg-warning/10"
            });
          }
        });
      }

      // Investment opportunity with highly specific age and income recommendations
      const totalInvestmentValue = investments.reduce((sum, inv) => sum + Number(inv.current_value), 0);
      const totalMonthlyContribution = investments.reduce((sum, inv) => sum + Number(inv.monthly_contribution), 0);
      
      if (monthlyIncome > 0 && totalBalance > 2000 && totalMonthlyContribution < monthlyIncome * 0.15) {
        const recommendedContribution = Math.min(monthlyIncome * 0.15, Math.max(monthlyIncome * 0.10, 200));
        
        // Detailed age and income-based recommendations
        let investmentStrategy = {
          accountTypes: [] as string[],
          allocations: "",
          specificFunds: [] as string[],
          actionItems: [] as any[]
        };
        
        // Age-based strategy
        if (age !== null) {
          if (age < 25) {
            investmentStrategy.accountTypes = ["Roth IRA (tax-free growth forever!)"];
            investmentStrategy.allocations = "95% stocks / 5% bonds (aggressive growth)";
            investmentStrategy.specificFunds = ["VTI or VOO (total market)", "Small amount in VXUS (international)"];
            investmentStrategy.actionItems = [
              { title: "START NOW - time is your superpower", description: `$${recommendedContribution.toFixed(0)}/mo at age ${age} becomes $${(recommendedContribution * ((Math.pow(1 + 0.10/12, (65-age) * 12) - 1) / (0.10/12))).toFixed(0)} by 65`, savings: "Millionaire potential" },
              { title: "Roth IRA at Fidelity/Vanguard", description: `Max $7,000/year ($583/mo) - you can withdraw contributions anytime`, savings: "Tax-free forever" },
              { title: "100% index funds", description: "VOO (S&P 500) or VTI (Total Market) - boring wins at your age", savings: "10% avg return" },
              { title: "Ignore the noise", description: `Don't day trade or buy crypto - you have ${65-age} years of compound growth ahead` }
            ];
          } else if (age >= 25 && age < 35) {
            investmentStrategy.accountTypes = ["Roth IRA", "401(k) to company match", "HSA if available"];
            investmentStrategy.allocations = "85-90% stocks / 10-15% bonds";
            investmentStrategy.specificFunds = ["VTI (60%)", "VXUS (25%)", "BND (15%)"];
            investmentStrategy.actionItems = [
              { title: `Prime earning years = Prime saving years`, description: `$${recommendedContribution.toFixed(0)}/mo × ${65-age} years = $${(recommendedContribution * ((Math.pow(1 + 0.09/12, (65-age) * 12) - 1) / (0.09/12))).toFixed(0)} at retirement`, savings: "$${(recommendedContribution * ((Math.pow(1 + 0.09/12, (65-age) * 12) - 1) / (0.09/12)) * 0.04).toFixed(0)}/yr in retirement" },
              { title: monthlyIncome < 5000 ? "Roth IRA priority" : "Max 401(k) match + Roth IRA", description: monthlyIncome < 5000 ? "Roth beats 401(k) when income is lower - tax-free growth" : "Get full company match (free money), then max Roth" },
              { title: "Aggressive but diversified", description: "90% stocks (VTI/VXUS) - you can handle volatility for 30+ years", savings: "9% avg return" },
              { title: "Increase 1% per year", description: "Raise contribution rate with each raise - won't notice the difference" }
            ];
          } else if (age >= 35 && age < 45) {
            investmentStrategy.accountTypes = ["401(k) max if possible", "Backdoor Roth if high income", "529 if kids"];
            investmentStrategy.allocations = "75-80% stocks / 20-25% bonds";
            investmentStrategy.specificFunds = ["VTI (50%)", "VXUS (25%)", "BND (20%)", "VGIT (5%)"];
            investmentStrategy.actionItems = [
              { title: `${65-age} years left - URGENT catch-up time`, description: `Need $${recommendedContribution.toFixed(0)}/mo minimum. Behind? Go to $${(recommendedContribution * 1.5).toFixed(0)}/mo`, savings: `$${(recommendedContribution * 1.5 * ((Math.pow(1 + 0.08/12, (65-age) * 12) - 1) / (0.08/12))).toFixed(0)} by 65` },
              { title: monthlyIncome > 8000 ? "Max 401(k) - $23,500/year" : "At least 15% to 401(k)", description: monthlyIncome > 8000 ? "High income = high tax savings now, lower bracket in retirement" : `Aim for $${(monthlyIncome * 0.15).toFixed(0)}/mo minimum - this is baseline` },
              { title: "Balanced growth + stability", description: "75/25 stock/bond - you need growth but can't lose a decade recovering", savings: "7-8% avg return" },
              { title: "Don't panic sell", description: `You've seen 2008, 2020 crashes - staying invested wins over ${65-age} years` }
            ];
          } else if (age >= 45 && age < 55) {
            investmentStrategy.accountTypes = ["401(k) aggressive catch-up", "Consider annuities", "Pay off mortgage?"];
            investmentStrategy.allocations = "60-70% stocks / 30-40% bonds";
            investmentStrategy.specificFunds = ["VTI (40%)", "VXUS (20%)", "BND (30%)", "VGIT (10%)"];
            investmentStrategy.actionItems = [
              { title: `ONLY ${65-age} years to retirement - GO ALL IN`, description: `$${recommendedContribution.toFixed(0)}/mo gets you $${(recommendedContribution * ((Math.pow(1 + 0.07/12, (65-age) * 12) - 1) / (0.07/12))).toFixed(0)} by 65 - is that enough?`, savings: "Run retirement calculator NOW" },
              { title: "Catch-up contributions at 50+", description: age >= 50 ? "You can do $31,000/year in 401(k) - max this if possible" : "Plan to max catch-up when you hit 50 ($31k vs $23.5k limit)" },
              { title: "Capital preservation mode", description: "60/40 portfolio - protect what you've built while still growing", savings: "6-7% avg return" },
              { title: monthlyIncome > 10000 ? "Consider financial advisor" : "DIY with target-date fund", description: monthlyIncome > 10000 ? "Complex needs at this income/age - professional help pays for itself" : `Use target-date 2040-2045 fund - auto-balances for you` }
            ];
          } else if (age >= 55) {
            investmentStrategy.accountTypes = ["401(k) preservation", "Roth conversions", "Bond ladder"];
            investmentStrategy.allocations = "40-50% stocks / 50-60% bonds/cash";
            investmentStrategy.specificFunds = ["VTI (30%)", "VXUS (10%)", "BND (40%)", "VGIT (15%)", "Cash (5%)"];
            investmentStrategy.actionItems = [
              { title: `${Math.max(65-age, 0)} years until 65 - shift to preservation`, description: age >= 65 ? "You're at/past retirement - focus on income generation" : `Final sprint - max savings but reduce risk`, savings: age >= 65 ? "4% withdrawal rule" : "5-6% growth" },
              { title: "MAX catch-up contributions", description: "$31,000 to 401(k) + $8,000 to Roth IRA if you can - last chance for tax deferral" },
              { title: "Create withdrawal strategy", description: age >= 60 ? "4% rule: $1M portfolio = $40k/year income. Do you have enough?" : "Plan Required Minimum Distributions (RMDs) at 73" },
              { title: "Conservative allocation", description: "50/50 or 40/60 stocks/bonds - can't afford big losses now", savings: "4-5% growth + stability" },
              { title: "Consider income annuity", description: age >= 60 ? "Guaranteed lifetime income reduces stress - consider 25% of portfolio" : "Research annuities for post-retirement" }
            ];
          }
        }

        // Income-based adjustments
        if (monthlyIncome < 3000) {
          investmentStrategy.actionItems.unshift({
            title: `At $${monthlyIncome.toFixed(0)}/mo income: Focus on Roth`,
            description: "Low income now = low tax now = Roth is THE move (tax-free forever)",
            savings: "No taxes in retirement"
          });
        } else if (monthlyIncome >= 8000) {
          investmentStrategy.actionItems.unshift({
            title: `High income ($${monthlyIncome.toFixed(0)}/mo): Maximize tax advantages`,
            description: "401(k) max ($23.5k), HSA max ($4.3k), Backdoor Roth ($7k) = $34.8k/year tax-advantaged",
            savings: `$${(34800 * 0.22).toFixed(0)}/year in tax savings (22% bracket)`
          });
        }

        const yearsToProject = yearsToRetirement || (age ? Math.max(65 - age, 10) : 30);
        const futureValue = recommendedContribution * (((Math.pow(1 + 0.08/12, yearsToProject * 12) - 1) / (0.08/12)));

        generatedRecs.push({
          icon: TrendingUp,
          title: `Invest $${recommendedContribution.toFixed(0)}/Mo (Age ${age || 'N/A'}, $${(monthlyIncome).toFixed(0)}/mo income)`,
          category: "Wealth Building",
          summary: `Becomes $${futureValue.toFixed(0)} in ${yearsToProject} years - ${age && age >= 45 ? 'URGENT at your age!' : age && age < 30 ? 'Time is your biggest advantage!' : 'Prime accumulation years!'}`,
          actionItems: investmentStrategy.actionItems,
          color: "text-success",
          bgColor: "bg-success/10"
        });
      }
      
      // Age-specific recommendations
      if (age !== null && !profile?.birthday) {
        generatedRecs.push({
          icon: AlertCircle,
          title: "Set Your Birthday",
          category: "Profile Setup",
          summary: "Get personalized age-based investment recommendations",
          actionItems: [
            { title: "Add birthday in Settings", description: "We'll tailor recommendations for your retirement timeline" }
          ],
          color: "text-primary",
          bgColor: "bg-primary/10"
        });
      }

      // Income boost with age and current income-specific strategies
      if (monthlyIncome > 0 && monthlyIncome < 10000) {
        const targetExtra = monthlyIncome < 3000 ? Math.min(monthlyIncome * 0.50, 1000) : Math.min(monthlyIncome * 0.25, 2000);
        
        let incomeStrategies = [];
        
        if (age && age < 25) {
          incomeStrategies = [
            { title: "Skills that scale with age", description: "Learn coding, design, writing now - these multiply your value for decades", savings: `$${(targetExtra * 2).toFixed(0)}/mo potential` },
            { title: "College/Entry-level hustle", description: "Tutoring ($25-50/hr), campus jobs, RA/TA positions", savings: `$${(targetExtra * 0.6).toFixed(0)}/mo` },
            { title: "Build online presence", description: "Start YouTube, blog, or social media - compounds like investments", savings: "Long-term passive income" },
            { title: "Avoid gig work traps", description: "DoorDash is OK short-term, but invest time in skills that appreciate" }
          ];
        } else if (age && age >= 25 && age < 40) {
          if (monthlyIncome < 5000) {
            incomeStrategies = [
              { title: "Career switch urgency", description: `At age ${age}, $${(monthlyIncome * 12).toFixed(0)}/year is below potential - consider career change`, savings: "2x-3x income possible" },
              { title: "High-demand skills fast", description: "Google Career Certificates (6mo): IT Support, Data Analytics, Project Management - $50k+ jobs", savings: `$${((50000/12) - monthlyIncome).toFixed(0)}/mo increase` },
              { title: "Freelance transition", description: "Build side income while employed - safety net for career pivot", savings: `$${(targetExtra * 0.7).toFixed(0)}/mo` },
              { title: "Negotiate raise now", description: "Research market rate - you're likely underpaid by 10-20%", savings: `$${(monthlyIncome * 0.15).toFixed(0)}/mo from raise` }
            ];
          } else {
            incomeStrategies = [
              { title: "Leverage current expertise", description: `At $${(monthlyIncome * 12).toFixed(0)}/year, consult in your field - your knowledge has market value`, savings: `$${(targetExtra * 0.8).toFixed(0)}/mo consulting` },
              { title: "Management/leadership track", description: `Age ${age} is prime for management move - could add $20k-40k/year`, savings: "$1,500-3,000/mo" },
              { title: "Passive income streams", description: "Rental property, dividend stocks, online course - use capital you've built", savings: `$${(targetExtra * 0.5).toFixed(0)}/mo passive` },
              { title: "Geographic arbitrage", description: "Remote work at high-COL salary, live in low-COL area" }
            ];
          }
        } else if (age && age >= 40 && age < 55) {
          if (monthlyIncome < 6000) {
            incomeStrategies = [
              { title: `URGENT: At age ${age}, income should be peak`, description: `$${(monthlyIncome * 12).toFixed(0)}/year is concerning - immediate action needed`, savings: "Career stability risk" },
              { title: "Maximize current role", description: "Ask for promotion/raise - emphasize experience and tenure", savings: `$${(monthlyIncome * 0.20).toFixed(0)}/mo possible` },
              { title: "Industry change while possible", description: "Tech, healthcare, finance still hiring experienced workers", savings: "50% income increase possible" },
              { title: "Side business launch", description: "Turn 40+ years of expertise into consulting/coaching business", savings: `$${targetExtra.toFixed(0)}/mo` }
            ];
          } else {
            incomeStrategies = [
              { title: "Peak earning potential", description: `At age ${age} and $${(monthlyIncome * 12).toFixed(0)}/year, focus on maximizing and protecting this income`, savings: "Maintain through retirement" },
              { title: "Executive/senior moves", description: "Target VP/Director roles - could add $50k+/year", savings: "$4,000+/mo" },
              { title: "Multiple income streams", description: "Diversify: salary + consulting + investments - reduce single-income risk", savings: `$${targetExtra.toFixed(0)}/mo from side work` },
              { title: "Protect earnings", description: "Disability insurance critical at this age/income - 60% of income if unable to work" }
            ];
          }
        } else if (age && age >= 55) {
          incomeStrategies = [
            { title: `Age ${age}: Work until 70 for 24% higher Social Security`, description: monthlyIncome > 8000 ? "Delaying to 70 adds $800-1,200/mo for life" : "Small income boost now = larger SS benefit", savings: "Lifetime benefit increase" },
            { title: "Phased retirement option", description: "Reduce hours 20-30% while maintaining benefits - bridge to full retirement", savings: "Quality of life + income" },
            { title: "Consulting/advisory roles", description: `Leverage ${age - 25}+ years experience - companies pay for wisdom`, savings: `$${(targetExtra * 1.2).toFixed(0)}/mo part-time` },
            { title: "Reverse mortgage consideration", description: age >= 62 ? "If house-rich, cash-poor - converts home equity to income" : "Available at 62 - research now if needed" },
            { title: "Social Security optimization", description: age >= 62 ? "Claiming strategy: spouse benefits, timing can add $50k+ lifetime" : "Plan claiming strategy before 62" }
          ];
        }

        generatedRecs.push({
          icon: DollarSign,
          title: `Boost Income by $${targetExtra.toFixed(0)}/Mo (Age ${age || 'N/A'}, Current: $${monthlyIncome.toFixed(0)})`,
          category: "Income Growth",
          summary: age && age >= 45 ? `At age ${age}, income growth is more urgent - less time to save for retirement!` : age && age < 30 ? `Starting income growth early multiplies benefits over your career!` : `Prime years to maximize earnings!`,
          actionItems: incomeStrategies,
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
