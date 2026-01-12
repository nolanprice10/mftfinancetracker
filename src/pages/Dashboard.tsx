import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, TrendingDown, DollarSign, Target as TargetIcon, Gift, Copy, Check, ChevronDown, AlertCircle, Edit, Trash2 } from "lucide-react";
import { InfoButton } from "@/components/InfoButton";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { OnboardingDialog } from "@/components/OnboardingDialog";
import { useRewards } from "@/hooks/useRewards";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { calculateGoalProbability, getProbabilityTextClass, getProbabilityBgClass } from "@/lib/probability";

interface Account {
  id: string;
  name: string;
  balance: number;
  type: string;
}

interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  end_date: string;
}

interface Transaction {
  amount: number;
  type: string;
  date: string;
}

const Dashboard = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const recommendationRef = useRef<HTMLDivElement>(null);
  
  const { hasAllThemesUnlocked } = useRewards();

  useEffect(() => {
    fetchData();
    checkOnboarding();
    loadReferralCode();
  }, []);

  const scrollToRecommendation = () => {
    recommendationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const checkOnboarding = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("onboarding_progress")
        .select("completed")
        .eq("user_id", user.id)
        .maybeSingle();

      // Only show onboarding if no record exists or completed is false
      if (error || !data || data.completed !== true) {
        setShowOnboarding(true);
      }
    } catch (error) {
      // If any error occurs, show onboarding for new users
      console.error("Error checking onboarding status:", error);
      setShowOnboarding(true);
    }
  };

  const loadReferralCode = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("id", user.id)
        .single();

      if (data?.referral_code) {
        setReferralCode(data.referral_code);
      }
    } catch (error) {
      console.error("Failed to load referral code:", error);
    }
  };

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;
    navigator.clipboard.writeText(referralLink);
    setLinkCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setLinkCopied(false), 2000);
    
    // Track referral link copy
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'share', {
        method: 'copy_link',
        content_type: 'referral',
        source: 'dashboard_banner'
      });
    }
  };

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [accountsRes, goalsRes, transactionsRes, profileRes] = await Promise.all([
        supabase.from("accounts").select("*").eq("user_id", user.id),
        supabase.from("goals").select("*").eq("user_id", user.id).limit(3),
        supabase.from("transactions").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(30),
        supabase.from("profiles").select("name").eq("id", user.id).single(),
      ]);

      if (accountsRes.data) setAccounts(accountsRes.data);
      if (goalsRes.data) setGoals(goalsRes.data);
      if (transactionsRes.data) setTransactions(transactionsRes.data);
      if (profileRes.data?.name) setUserName(profileRes.data.name);
    } catch (error: any) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const monthlyIncome = monthlyTransactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);
    
  const monthlyExpenses = monthlyTransactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const monthlyNet = monthlyIncome - monthlyExpenses;

  // Calculate goal probability for primary goal
  const primaryGoal = goals[0];
  let probabilityResult = null;
  let isPrimaryGoalExpired = false;
  
  if (primaryGoal) {
    const endDate = new Date(primaryGoal.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    const progress = (Number(primaryGoal.current_amount) / Number(primaryGoal.target_amount)) * 100;
    isPrimaryGoalExpired = endDate < today && progress < 100;
    
    const monthsToGoal = Math.ceil(
      (new Date(primaryGoal.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    
    if (!isPrimaryGoalExpired) {
      probabilityResult = calculateGoalProbability({
        monthlyIncome: monthlyIncome || 0,
        monthlySpending: monthlyExpenses || 0,
        currentSavings: Number(primaryGoal.current_amount) || 0,
        goalAmount: Number(primaryGoal.target_amount) || 0,
        monthsToGoal: Math.max(1, monthsToGoal)
      });
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-muted rounded-xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-muted rounded-xl"></div>
            <div className="h-32 bg-muted rounded-xl"></div>
            <div className="h-32 bg-muted rounded-xl"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <OnboardingDialog open={showOnboarding} onOpenChange={setShowOnboarding} />
      <div className="space-y-6 animate-fade-in">
        
        {/* HERO OUTCOME - THE BIG ANSWER */}
        {isPrimaryGoalExpired && primaryGoal ? (
          <div className="border-2 border-destructive rounded-2xl p-8 shadow-xl bg-gradient-to-br from-destructive/10 to-destructive/5">
            <div className="text-center space-y-4">
              <div className="text-6xl">⏰</div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Goal Deadline Passed
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-destructive">
                {primaryGoal.name}
              </h2>
              <p className="text-muted-foreground">
                Deadline was {new Date(primaryGoal.end_date).toLocaleDateString()}
              </p>
              <div className="text-2xl font-semibold">
                ${Number(primaryGoal.current_amount).toLocaleString()} / ${Number(primaryGoal.target_amount).toLocaleString()}
                <span className="text-sm text-muted-foreground ml-2">
                  ({((Number(primaryGoal.current_amount) / Number(primaryGoal.target_amount)) * 100).toFixed(1)}% reached)
                </span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-destructive/20">
              <div className="bg-background/50 backdrop-blur rounded-xl p-6 text-center">
                <p className="font-semibold text-lg mb-4">What would you like to do?</p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <Link to="/goals">
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Extend This Goal
                    </Button>
                  </Link>
                  <Link to="/goals">
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete & Create New Goal
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : probabilityResult && primaryGoal ? (
          <div className={`border-2 rounded-2xl p-8 shadow-xl ${getProbabilityBgClass(probabilityResult.probability)}`}>
            <div className="text-center space-y-4">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Your Financial Probability
              </p>
              <div className={`text-7xl md:text-8xl font-bold ${getProbabilityTextClass(probabilityResult.probability)}`}>
                {Math.round(probabilityResult.probability)}%
              </div>
              <p className="text-xl md:text-2xl font-semibold">
                Chance of hitting your goal: {primaryGoal.name}
              </p>
              <p className="text-muted-foreground">
                Target: ${Number(primaryGoal.target_amount).toLocaleString()} by{" "}
                {new Date(primaryGoal.end_date).toLocaleDateString()}
              </p>
            </div>

            {/* THE ONE LEVER */}
            {probabilityResult.probability < 75 && (
              <div className="mt-8 pt-6 border-t border-current/20">
                <div className="bg-background/50 backdrop-blur rounded-xl p-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <AlertCircle className="h-5 w-5" />
                    <p className="font-semibold text-lg">What to do</p>
                  </div>
                  <p className="text-2xl md:text-3xl font-bold">
                    Increase monthly savings by ${probabilityResult.recommendedIncrease.toLocaleString()}
                  </p>
                  <p className="text-muted-foreground mt-2">
                    This brings you to 75% probability
                  </p>
                </div>
              </div>
            )}

            {probabilityResult.probability >= 75 && (
              <div className="mt-8 pt-6 border-t border-current/20">
                <div className="bg-background/50 backdrop-blur rounded-xl p-6 text-center">
                  <p className="text-xl font-semibold text-success">
                    ✓ You're on track! Keep your current savings rate.
                  </p>
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="mt-6 text-center">
              <Button
                onClick={scrollToRecommendation}
                variant="outline"
                size="lg"
                className="font-semibold"
              >
                What should I change?
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/20 rounded-2xl p-8 shadow-glow">
            <div className="text-center space-y-4">
              <p className="text-lg text-muted-foreground">
                Welcome back{userName && `, ${userName}`}! 👋
              </p>
              <h1 className="text-3xl font-bold">
                Set a goal to see your probability
              </h1>
              <p className="text-muted-foreground">
                Add your first financial goal to get started
              </p>
              <Link to="/goals">
                <Button size="lg" className="mt-4">
                  <TargetIcon className="h-4 w-4 mr-2" />
                  Create Your First Goal
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* RECOMMENDATION SECTION - scroll target */}
        <div ref={recommendationRef}>
          <Card className="shadow-elegant border-border/50 bg-gradient-card">
            <CardHeader>
              <CardTitle>Your Financial Snapshot</CardTitle>
              <CardDescription>Current status across all accounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
                  <p className="text-2xl font-bold">
                    ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Monthly Income</p>
                  <p className="text-2xl font-bold text-success">
                    ${monthlyIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Monthly Expenses</p>
                  <p className="text-2xl font-bold text-destructive">
                    ${monthlyExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {probabilityResult && (
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm font-medium mb-3">Ways to improve your probability:</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Reduce monthly spending by ${Math.round(probabilityResult.recommendedIncrease / 2).toLocaleString()} (easier than increasing income)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Find a side income of ${Math.round(probabilityResult.recommendedIncrease / 2).toLocaleString()}/month</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Extend your goal timeline to reduce monthly pressure</span>
                    </li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Advanced Section - Hidden by Default */}
        {!showAdvanced && (
          <div className="text-center">
            <Button
              onClick={() => setShowAdvanced(true)}
              variant="outline"
              size="lg"
            >
              See detailed breakdown
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {showAdvanced && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-card border-none shadow-lg hover:shadow-glow transition-shadow col-span-1 md:col-span-2">
                <CardHeader>
                  <div className="flex items-center gap-1">
                    <CardTitle className="text-sm font-medium">This Month's Cash Flow</CardTitle>
                    <InfoButton
                      title="Monthly Cash Flow"
                      content="Income minus expenses for this month. Green = you're saving money! Red = spending more than earning. Aim for 20%+ surplus."
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <div className="flex-1">
                      <div className={`text-3xl font-bold ${monthlyNet >= 0 ? 'text-success' : 'text-destructive'}`}>
                        ${Math.abs(monthlyNet).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Net {monthlyNet >= 0 ? 'Surplus' : 'Deficit'}
                      </p>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-success"></div>
                          <span className="text-sm">Income: ${monthlyIncome.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-destructive"></div>
                          <span className="text-sm">Expenses: ${monthlyExpenses.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    {(monthlyIncome > 0 || monthlyExpenses > 0) && (
                      <ResponsiveContainer width={180} height={180}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Income', value: monthlyIncome, color: 'hsl(var(--success))' },
                              { name: 'Expenses', value: monthlyExpenses, color: 'hsl(var(--destructive))' }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {[
                              { name: 'Income', value: monthlyIncome, color: 'hsl(var(--success))' },
                              { name: 'Expenses', value: monthlyExpenses, color: 'hsl(var(--destructive))' }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-none shadow-luxe hover:shadow-glow transition-all duration-500 overflow-hidden group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-700"></div>
                  <div className="flex items-center gap-1 relative z-10">
                    <CardTitle className="text-sm font-medium">Goals Progress</CardTitle>
                    <InfoButton
                      title="Active Goals"
                      content="Your financial goals like saving for a vacation, emergency fund, or down payment."
                    />
                  </div>
                  <TargetIcon className="h-5 w-5 text-primary relative z-10" />
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold transition-all duration-300 group-hover:scale-105">{goals.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Active goal{goals.length !== 1 ? 's' : ''}</p>
                </CardContent>
              </Card>
            </div>

            {/* Referral CTA Banner */}
            {!hasAllThemesUnlocked && referralCode && (
              <Alert className="bg-gradient-wealth border-primary/20 shadow-glow">
                <Gift className="h-5 w-5" />
                <AlertDescription>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold text-base mb-1">🎁 Unlock Premium Themes!</p>
                      <p className="text-sm text-muted-foreground">
                        Share your referral link and unlock exclusive elegant themes. 
                        <span className="font-medium text-foreground"> 1 friend = 3 themes, 5 friends = all 8 themes!</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={copyReferralLink}
                        size="sm"
                        className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30"
                      >
                        {linkCopied ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Link
                          </>
                        )}
                      </Button>
                      <Link to="/settings">
                        <Button size="sm" variant="outline">
                          View Themes →
                        </Button>
                      </Link>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Goals Preview */}
            {goals.length > 0 && (
              <Card className="shadow-elegant hover:shadow-luxe transition-all duration-500 border-border/50 bg-gradient-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Your Goals</CardTitle>
                    <CardDescription>Track your progress towards financial milestones</CardDescription>
                  </div>
                  <Link to="/goals">
                    <Button variant="outline" size="sm" className="hover:shadow-md transition-all">View All</Button>
                  </Link>
                </CardHeader>
                <CardContent className="space-y-4">
                  {goals.map((goal) => {
                    const progress = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
                    return (
                      <div key={goal.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{goal.name}</span>
                          <span className="text-sm text-muted-foreground">
                            ${Number(goal.current_amount).toFixed(0)} / ${Number(goal.target_amount).toFixed(0)}
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="shadow-elegant hover:shadow-luxe transition-all duration-500 border-border/50 bg-gradient-card">
              <CardHeader>
                <CardTitle>Keep Your Data Updated</CardTitle>
                <CardDescription>Add accounts and transactions for accurate probability</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Link to="/accounts" className="block">
                    <Button className="w-full bg-gradient-wealth hover:opacity-90">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Account
                    </Button>
                  </Link>
                  <Link to="/transactions" className="block">
                    <Button className="w-full" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Log Transaction
                    </Button>
                  </Link>
                  <Link to="/investments" className="block">
                    <Button className="w-full" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Track Investment
                    </Button>
                  </Link>
                  <Link to="/goals" className="block">
                    <Button className="w-full" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Set Goal
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
