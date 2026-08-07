import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { Plus, TrendingUp, TrendingDown, DollarSign, Target as TargetIcon, Gift, Copy, Check, ChevronDown, AlertCircle, Edit, Trash2 } from "lucide-react";
import { InfoButton } from "@/components/InfoButton";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { OnboardingDialog } from "@/components/OnboardingDialog";
import { ProbabilityShareCard } from "@/components/ProbabilityShareCard";
import { useRewards } from "@/hooks/useRewards";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculateGoalProbability, getProbabilityTextClass, getProbabilityBgClass } from "@/lib/probability";
import { calculatePercentile } from "@/lib/percentile";
import { getBestTransferRecommendation } from "@/lib/transferRecommendation";
import { formatDateOnlyForDisplay, formatDateTimeForDisplay, parseDateOnlyString } from "@/lib/date";

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
  account_id?: string | null;
}

interface Transaction {
  amount: number;
  type: string;
  date: string;
  category?: string;
}

interface TransactionWithParsedDate {
  transaction: Transaction;
  parsedDate: Date;
}

interface AccountAllocationPlan {
  accountId: string;
  accountName: string;
  accountType: string;
  currentBalance: number;
  targetBalance: number;
  gapToTarget: number;
  excessBalance: number;
  isOnTarget: boolean;
  allocationSharePercent: number;
}

const Dashboard = () => {
  const MIN_SPENDING_LIMIT = 50;
  const ACCOUNT_BASELINE_EQUAL_SHARE_FACTOR = 0.4;
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [goalView, setGoalView] = useState<string>("all");
  
  const recommendationRef = useRef<HTMLDivElement>(null);
  
  const { hasAllFeatures } = useRewards();
  const hasAllThemesUnlocked = hasAllFeatures();

  useEffect(() => {
    fetchData();
    checkOnboarding();
    loadReferralCode();
  }, []);

  useEffect(() => {
    const handlePwaRefresh = () => {
      fetchData();
      checkOnboarding();
      loadReferralCode();
    };

    window.addEventListener("mft:pwa-refresh", handlePwaRefresh);

    return () => {
      window.removeEventListener("mft:pwa-refresh", handlePwaRefresh);
    };
  }, []);

  useEffect(() => {
    if (goals.length === 0) {
      if (goalView !== "all") setGoalView("all");
      return;
    }

    if (goalView !== "all" && !goals.some((goal) => goal.id === goalView)) {
      setGoalView(goals[0].id);
    }
  }, [goals, goalView]);

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
        .from("user_referral_codes")
        .select("referral_code")
        .eq("user_id", user.id)
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
        supabase.from("goals").select("*").eq("user_id", user.id),
        supabase
          .from("transactions")
          .select("amount,type,date,category")
          .eq("user_id", user.id)
          .order("date", { ascending: false }),
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

  const parseTransactionDate = (rawDate: string): Date | null => {
    if (!rawDate) return null;

    const parsed = parseDateOnlyString(rawDate) ?? new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) return null;
    parsed.setHours(0, 0, 0, 0);
    return parsed;
  };

  const transactionsWithParsedDate: TransactionWithParsedDate[] = transactions
    .map((transaction) => {
      const parsedDate = parseTransactionDate(String(transaction.date || ""));
      if (!parsedDate) return null;
      return {
        transaction,
        parsedDate,
      };
    })
    .filter((entry): entry is TransactionWithParsedDate => entry !== null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const currentMonthTransactions = transactionsWithParsedDate.filter(({ parsedDate }) => {
    return parsedDate.getFullYear() === currentYear && parsedDate.getMonth() === currentMonth;
  });

  const latestTransactionDate = transactionsWithParsedDate.reduce<Date | null>((latest, entry) => {
    if (!latest || entry.parsedDate.getTime() > latest.getTime()) {
      return entry.parsedDate;
    }
    return latest;
  }, null);

  const fallbackMonthTransactions = latestTransactionDate
    ? transactionsWithParsedDate.filter(({ parsedDate }) => {
        return (
          parsedDate.getFullYear() === latestTransactionDate.getFullYear() &&
          parsedDate.getMonth() === latestTransactionDate.getMonth()
        );
      })
    : [];

  const transactionsForSnapshot = currentMonthTransactions.length > 0
    ? currentMonthTransactions
    : fallbackMonthTransactions;

  const usingFallbackMonth = currentMonthTransactions.length === 0 && fallbackMonthTransactions.length > 0;
  const snapshotMonthDate = transactionsForSnapshot[0]?.parsedDate ?? today;
  const snapshotMonthLabel = snapshotMonthDate.toLocaleString(undefined, { month: "long", year: "numeric" });

  // Convert mixed transaction labels to cash flow direction.
  // Ambiguous transfers default to income so imported cash-in rows are not dropped.
  const getCashFlowType = (tx: Transaction): "income" | "expense" | null => {
    const normalizedType = String(tx.type || "").toLowerCase().trim();
    const categoryText = String(tx.category || "").toLowerCase().trim();
    const numericAmount = Number(tx.amount) || 0;

    if (normalizedType === "income") return "income";
    if (normalizedType === "expense") return "expense";

    if (normalizedType === "transfer") {
      const looksOutgoingTransfer = /(transfer out|outgoing|withdraw|withdrawal|payment to|debit|sent to|transfer to)/.test(categoryText);
      const looksIncomingTransfer = /(transfer in|incoming|deposit|credit|received from|transfer from)/.test(categoryText);

      if (looksIncomingTransfer && !looksOutgoingTransfer) return "income";
      if (looksOutgoingTransfer && !looksIncomingTransfer) return "expense";

      if (looksIncomingTransfer && looksOutgoingTransfer) {
        // Phrases like "transfer from A to B" are typically incoming for the destination account view.
        return "income";
      }

      return "income";
    }

    if (numericAmount > 0) return "income";
    if (numericAmount < 0) return "expense";

    return null;
  };

  const monthlyIncome = transactionsForSnapshot
    .filter(({ transaction }) => getCashFlowType(transaction) === "income")
    .reduce((sum, { transaction }) => sum + Math.abs(Number(transaction.amount) || 0), 0);

  const monthlyExpenses = transactionsForSnapshot
    .filter(({ transaction }) => getCashFlowType(transaction) === "expense")
    .reduce((sum, { transaction }) => sum + Math.abs(Number(transaction.amount) || 0), 0);

  const monthlyNet = monthlyIncome - monthlyExpenses;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const goalAnalyses = goals.map((goal) => {
    const endDate = new Date(goal.end_date);
    endDate.setHours(0, 0, 0, 0);
    const monthsToGoal = Math.max(
      1,
      Math.ceil((new Date(goal.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30))
    );
    const targetAmount = Number(goal.target_amount) || 0;
    const currentAmount = Number(goal.current_amount) || 0;
    const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
    const isExpired = endDate < now && progress < 100;
    const remainingAmount = Math.max(0, targetAmount - currentAmount);

    return {
      goal,
      monthsToGoal,
      targetAmount,
      currentAmount,
      progress,
      isExpired,
      remainingAmount,
      probabilityResult: isExpired
        ? null
        : calculateGoalProbability({
            monthlyIncome: monthlyIncome || 0,
            monthlySpending: monthlyExpenses || 0,
            currentSavings: currentAmount,
            goalAmount: targetAmount,
            monthsToGoal,
          }),
    };
  });

  const hasMultipleGoals = goals.length > 1;
  const selectedAnalyses = goalView === "all"
    ? goalAnalyses
    : goalAnalyses.filter((analysis) => analysis.goal.id === goalView);

  const isAllGoalsView = goalView === "all" && hasMultipleGoals;
  const selectedGoalName = isAllGoalsView
    ? "All Goals Combined"
    : selectedAnalyses[0]?.goal.name || "Selected Goal";
  const selectedTargetAmount = selectedAnalyses.reduce((sum, analysis) => sum + analysis.targetAmount, 0);
  const selectedCurrentAmount = selectedAnalyses.reduce((sum, analysis) => sum + analysis.currentAmount, 0);
  const selectedHasExpiredGoal = selectedAnalyses.some((analysis) => analysis.isExpired);
  const selectedExpiredCount = selectedAnalyses.filter((analysis) => analysis.isExpired).length;

  const selectedActiveAnalyses = selectedAnalyses.filter((analysis) => !analysis.isExpired);
  let selectedProbability: number | null = null;
  if (selectedActiveAnalyses.length > 0) {
    if (isAllGoalsView) {
      selectedProbability = selectedActiveAnalyses.reduce((combined, analysis) => {
        const p = analysis.probabilityResult?.probability ?? 0;
        return combined * (p / 100);
      }, 1) * 100;
    } else {
      selectedProbability = selectedActiveAnalyses[0].probabilityResult?.probability ?? null;
    }
  }

  if (selectedProbability !== null) {
    selectedProbability = Math.min(98, Math.max(2, selectedProbability));
  }

  let monthsToGoalForPrimary = 1;
  let requiredMonthlyAllocation = 0;
  let additionalMonthlyAllocationNeeded = 0;
  let allocationCoveragePercent = 100;
  let cashAvailableForGoal = 0;

  if (selectedActiveAnalyses.length > 0) {
    monthsToGoalForPrimary = selectedActiveAnalyses.length === 1
      ? selectedActiveAnalyses[0].monthsToGoal
      : Math.max(...selectedActiveAnalyses.map((analysis) => analysis.monthsToGoal));

    requiredMonthlyAllocation = selectedActiveAnalyses.reduce((sum, analysis) => {
      return sum + (analysis.remainingAmount / analysis.monthsToGoal);
    }, 0);

    cashAvailableForGoal = Math.max(0, monthlyNet);
    additionalMonthlyAllocationNeeded = Math.max(0, requiredMonthlyAllocation - cashAvailableForGoal);
    allocationCoveragePercent = requiredMonthlyAllocation > 0
      ? Math.min(100, (cashAvailableForGoal / requiredMonthlyAllocation) * 100)
      : 100;
  }

  const allActiveAnalyses = goalAnalyses.filter((analysis) => !analysis.isExpired);
  const transferRecommendation = allActiveAnalyses.length > 0
    ? getBestTransferRecommendation({
        accounts,
        goals: allActiveAnalyses.map((analysis) => analysis.goal),
        monthlyIncome,
        monthlyExpenses,
      })
    : null;

  const allGoalsMonthlyRequirement = allActiveAnalyses.reduce((sum, analysis) => {
    return sum + (analysis.remainingAmount / analysis.monthsToGoal);
  }, 0);

  const goalsForAllocation = allActiveAnalyses.filter((analysis) => analysis.remainingAmount > 0);
  const totalTrackedBalance = accounts.reduce((sum, account) => sum + Math.max(0, Number(account.balance) || 0), 0);

  const totalGoalTarget = allActiveAnalyses.reduce((sum, analysis) => sum + analysis.targetAmount, 0);
  const totalGoalCurrent = allActiveAnalyses.reduce((sum, analysis) => sum + analysis.currentAmount, 0);
  const totalGoalRemaining = allActiveAnalyses.reduce((sum, analysis) => sum + analysis.remainingAmount, 0);

  const overallGoalProgress = totalGoalTarget > 0
    ? Math.min(1, Math.max(0, totalGoalCurrent / totalGoalTarget))
    : 1;

  const goalPressureRatio = monthlyIncome > 0
    ? allGoalsMonthlyRequirement / Math.max(1, monthlyIncome)
    : (allGoalsMonthlyRequirement > 0 ? 1 : 0);

  const balanceCoverageRatio = totalGoalRemaining > 0
    ? totalTrackedBalance / totalGoalRemaining
    : 1;

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const progressMultiplierMonthly = clamp(0.8 + overallGoalProgress * 0.35, 0.7, 1.1);
  const pressureMultiplierMonthly = clamp(1.15 - goalPressureRatio * 0.3, 0.65, 1.05);
  const balanceMultiplierMonthly = clamp(0.85 + Math.min(1, balanceCoverageRatio) * 0.3, 0.75, 1.15);

  const strictCombinedSpendingLimit = monthlyIncome - allGoalsMonthlyRequirement;
  const practicalMonthlySpendFloor = monthlyIncome > 0
    ? Math.max(MIN_SPENDING_LIMIT, monthlyIncome * 0.08)
    : MIN_SPENDING_LIMIT;

  const adaptiveMonthlyCandidate = strictCombinedSpendingLimit
    * progressMultiplierMonthly
    * pressureMultiplierMonthly
    * balanceMultiplierMonthly;

  const combinedSpendingLimit = Math.max(
    practicalMonthlySpendFloor,
    Number.isFinite(adaptiveMonthlyCandidate) ? adaptiveMonthlyCandidate : 0,
    MIN_SPENDING_LIMIT
  );

  const combinedFloorApplied = combinedSpendingLimit <= practicalMonthlySpendFloor;
  const combinedOverspend = Math.max(0, monthlyExpenses - combinedSpendingLimit);

  const weeklyIncomeProxy = monthlyIncome * 12 / 52;
  const weeklyGoalRequirement = allGoalsMonthlyRequirement * 12 / 52;
  const strictWeeklySpendingLimit = weeklyIncomeProxy - weeklyGoalRequirement;
  const progressMultiplierWeekly = clamp(0.78 + overallGoalProgress * 0.28, 0.68, 1.08);
  const pressureMultiplierWeekly = clamp(1.12 - goalPressureRatio * 0.26, 0.66, 1.04);
  const balanceMultiplierWeekly = clamp(0.82 + Math.min(1, balanceCoverageRatio) * 0.26, 0.72, 1.12);
  const weeklyFloor = Math.max(20, weeklyIncomeProxy * 0.09);
  const adaptiveWeeklyCandidate = strictWeeklySpendingLimit
    * progressMultiplierWeekly
    * pressureMultiplierWeekly
    * balanceMultiplierWeekly;
  const combinedWeeklySpendingLimit = Math.max(
    weeklyFloor,
    Number.isFinite(adaptiveWeeklyCandidate) ? adaptiveWeeklyCandidate : 0,
    20
  );

  const dailyIncomeProxy = monthlyIncome * 12 / 365;
  const dailyGoalRequirement = allGoalsMonthlyRequirement * 12 / 365;
  const strictDailySpendingLimit = dailyIncomeProxy - dailyGoalRequirement;
  const progressMultiplierDaily = clamp(0.76 + overallGoalProgress * 0.22, 0.66, 1.05);
  const pressureMultiplierDaily = clamp(1.08 - goalPressureRatio * 0.22, 0.66, 1.03);
  const balanceMultiplierDaily = clamp(0.8 + Math.min(1, balanceCoverageRatio) * 0.2, 0.7, 1.08);
  const dailyFloor = Math.max(5, dailyIncomeProxy * 0.1);
  const adaptiveDailyCandidate = strictDailySpendingLimit
    * progressMultiplierDaily
    * pressureMultiplierDaily
    * balanceMultiplierDaily;
  const combinedDailySpendingLimit = Math.max(
    dailyFloor,
    Number.isFinite(adaptiveDailyCandidate) ? adaptiveDailyCandidate : 0,
    5
  );

  const recoveryMonths = combinedOverspend > 0
    ? Math.min(6, Math.max(1, Math.ceil(combinedOverspend / Math.max(50, combinedSpendingLimit * 0.3))))
    : 0;

  const recoveryMonthlyReduction = recoveryMonths > 0 ? combinedOverspend / recoveryMonths : 0;
  const recoveryWeeklyReduction = recoveryMonths > 0 ? (combinedOverspend / recoveryMonths) * 12 / 52 : 0;
  const recoveryDailyReduction = recoveryMonths > 0 ? (combinedOverspend / recoveryMonths) * 12 / 365 : 0;

  const adjustedMonthlySpendingLimit = recoveryMonths > 0
    ? Math.max(MIN_SPENDING_LIMIT, combinedSpendingLimit - recoveryMonthlyReduction)
    : combinedSpendingLimit;

  const adjustedWeeklySpendingLimit = recoveryMonths > 0
    ? Math.max(20, combinedWeeklySpendingLimit - recoveryWeeklyReduction)
    : combinedWeeklySpendingLimit;

  const adjustedDailySpendingLimit = recoveryMonths > 0
    ? Math.max(5, combinedDailySpendingLimit - recoveryDailyReduction)
    : combinedDailySpendingLimit;

  const accountAllocationPlan: AccountAllocationPlan[] = (() => {
    if (goalsForAllocation.length === 0 || accounts.length === 0 || totalTrackedBalance <= 0) {
      return [];
    }

    const totalTrackedCents = Math.round(totalTrackedBalance * 100);
    const accountsById = new Map(accounts.map((account) => [account.id, account]));
    const defaultReceivers = accounts;

    const weightedGoals = goalsForAllocation.map((analysis) => ({
      analysis,
      urgencyWeight: Math.max(0.01, analysis.remainingAmount / Math.max(1, analysis.monthsToGoal)),
    }));
    const totalUrgencyWeight = weightedGoals.reduce((sum, entry) => sum + entry.urgencyWeight, 0);

    if (totalUrgencyWeight <= 0) {
      return [];
    }

    // Keep money in every account: reserve a meaningful baseline slice for each account,
    // then distribute the remaining balance by goal urgency.
    const equalShareCents = Math.floor(totalTrackedCents / accounts.length);
    const baselineCentsPerAccount = Math.max(
      1,
      Math.floor(equalShareCents * ACCOUNT_BASELINE_EQUAL_SHARE_FACTOR)
    );
    const baselineTotalCents = Math.min(totalTrackedCents, baselineCentsPerAccount * accounts.length);
    const distributableCents = Math.max(0, totalTrackedCents - baselineTotalCents);

    const targetByAccountCents = new Map<string, number>();
    accounts.forEach((account) => {
      targetByAccountCents.set(account.id, baselineCentsPerAccount);
    });

    weightedGoals.forEach(({ analysis, urgencyWeight }) => {
      const goalShareCents = Math.round((urgencyWeight / totalUrgencyWeight) * distributableCents);
      const linkedAccountId = analysis.goal.account_id || null;

      if (linkedAccountId && accountsById.has(linkedAccountId)) {
        targetByAccountCents.set(linkedAccountId, (targetByAccountCents.get(linkedAccountId) || 0) + goalShareCents);
        return;
      }

      let remainingGoalCents = goalShareCents;
      defaultReceivers.forEach((account, index) => {
        let receiverCents = 0;
        if (index === defaultReceivers.length - 1) {
          receiverCents = remainingGoalCents;
        } else {
          const receiverShare = 1 / defaultReceivers.length;
          receiverCents = Math.min(remainingGoalCents, Math.round(goalShareCents * receiverShare));
          remainingGoalCents -= receiverCents;
        }
        targetByAccountCents.set(account.id, (targetByAccountCents.get(account.id) || 0) + receiverCents);
      });
    });

    const rawPlan = accounts
      .map((account) => {
        const currentBalance = Math.max(0, Number(account.balance) || 0);
        const targetBalance = (targetByAccountCents.get(account.id) || 0) / 100;

        return {
          accountId: account.id,
          accountName: account.name,
          accountType: account.type,
          currentBalance,
          targetBalance,
          gapToTarget: Math.max(0, targetBalance - currentBalance),
          excessBalance: Math.max(0, currentBalance - targetBalance),
          isOnTarget: currentBalance + 0.01 >= targetBalance,
          allocationSharePercent: totalTrackedBalance > 0
            ? (targetBalance / totalTrackedBalance) * 100
            : 0,
        };
      });

    const totalTargetCents = rawPlan.reduce((sum, entry) => sum + Math.round(entry.targetBalance * 100), 0);
    const driftCents = totalTrackedCents - totalTargetCents;

    if (rawPlan.length > 0 && driftCents !== 0) {
      const firstEntry = rawPlan[0];
      firstEntry.targetBalance = (Math.round(firstEntry.targetBalance * 100) + driftCents) / 100;
      firstEntry.gapToTarget = Math.max(0, firstEntry.targetBalance - firstEntry.currentBalance);
      firstEntry.excessBalance = Math.max(0, firstEntry.currentBalance - firstEntry.targetBalance);
      firstEntry.isOnTarget = firstEntry.currentBalance + 0.01 >= firstEntry.targetBalance;
      firstEntry.allocationSharePercent = totalTrackedBalance > 0
        ? (firstEntry.targetBalance / totalTrackedBalance) * 100
        : 0;
    }

    return rawPlan.sort((left, right) => right.targetBalance - left.targetBalance);
  })();

  const recommendedAllocationTotal = accountAllocationPlan.reduce((sum, entry) => sum + entry.targetBalance, 0);
  const accountsOnTargetCount = accountAllocationPlan.filter((entry) => entry.isOnTarget).length;

  const displayProbability = selectedProbability !== null
    ? Number(selectedProbability.toFixed(1))
    : null;

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
      <SEO 
        title="Dashboard"
        description="View your financial dashboard with real-time portfolio tracking, goal progress, and institutional-grade analytics. Monitor your wealth at a glance."
        canonicalUrl="/dashboard"
      />
      <OnboardingDialog open={showOnboarding} onOpenChange={setShowOnboarding} />
      <div className="space-y-6 animate-fade-in">

        {hasMultipleGoals && (
          <Card className="shadow-elegant border-border/50 bg-gradient-card">
            <CardContent className="pt-6">
              <div className="md:hidden">
                <Select value={goalView} onValueChange={setGoalView}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose probability view" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Goals</SelectItem>
                    {goals.map((goal) => (
                      <SelectItem key={goal.id} value={goal.id}>
                        {goal.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="hidden md:flex md:flex-wrap items-center gap-2">
                <Button
                  variant={goalView === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setGoalView("all")}
                >
                  All Goals
                </Button>
                {goals.map((goal) => (
                  <Button
                    key={goal.id}
                    variant={goalView === goal.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setGoalView(goal.id)}
                  >
                    {goal.name}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Switch between each goal or view your probability of achieving every goal together.
              </p>
            </CardContent>
          </Card>
        )}
        
        {/* HERO OUTCOME - THE BIG ANSWER */}
        {selectedHasExpiredGoal && selectedAnalyses.length > 0 ? (
          <div className="border-2 border-destructive rounded-2xl p-8 shadow-xl bg-gradient-to-br from-destructive/10 to-destructive/5">
            <div className="text-center space-y-4">
              <div className="text-6xl">⏰</div>
              <p className="text-sm font-medium text-muted-foreground">
                Deadline passed
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-destructive">
                {selectedGoalName}
              </h2>
              <p className="text-muted-foreground">
                {isAllGoalsView
                  ? `${selectedExpiredCount} goal${selectedExpiredCount === 1 ? " has" : "s have"} passed the deadline without full completion.`
                    : `Deadline was ${formatDateOnlyForDisplay(selectedAnalyses[0].goal.end_date)}`}
              </p>
              <div className="text-2xl font-semibold">
                ${selectedCurrentAmount.toLocaleString()} / ${selectedTargetAmount.toLocaleString()}
                <span className="text-sm text-muted-foreground ml-2">
                  ({selectedTargetAmount > 0 ? ((selectedCurrentAmount / selectedTargetAmount) * 100).toFixed(1) : "0.0"}% reached)
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
        ) : selectedProbability !== null && selectedAnalyses.length > 0 ? (
          <>
            <div className={`border-2 rounded-2xl p-8 shadow-xl ${getProbabilityBgClass(selectedProbability)}`}>
              <div className="text-center space-y-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Your goal probability
                </p>
                <div className={`text-7xl md:text-8xl font-bold ${getProbabilityTextClass(selectedProbability)}`}>
                  {displayProbability}%
                </div>
                <p className="text-xl md:text-2xl font-semibold">
                  {isAllGoalsView ? "Chance of hitting all goals" : `Chance of hitting your goal: ${selectedGoalName}`}
                </p>
                <p className="text-muted-foreground">
                  Target: ${selectedTargetAmount.toLocaleString()}
                  {isAllGoalsView
                    ? " across all active goals"
                    : ` by ${formatDateOnlyForDisplay(selectedAnalyses[0].goal.end_date)}`}
                </p>
              </div>

              {/* THE ONE LEVER */}
              {selectedProbability < 75 && (
                <div className="mt-8 pt-6 border-t border-current/20">
                  <div className="bg-background/60 backdrop-blur rounded-xl p-6 text-center space-y-3">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <AlertCircle className="h-5 w-5" />
                      <p className="font-semibold text-lg">Best next step</p>
                    </div>
                    {transferRecommendation ? (
                      <>
                        <p className="text-2xl md:text-3xl font-bold">
                          Move ${transferRecommendation.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} from {transferRecommendation.fromAccountName} to {transferRecommendation.toAccountName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          This move is optimized across all your active goals.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-2xl md:text-3xl font-bold">
                          Close a monthly gap of ${Math.round(additionalMonthlyAllocationNeeded).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Simple plan: cut spending by ${Math.round(additionalMonthlyAllocationNeeded / 2).toLocaleString()} and add ${Math.round(additionalMonthlyAllocationNeeded / 2).toLocaleString()} in extra income.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {selectedProbability >= 75 && (
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

            {/* SHARING CARD intentionally hidden to keep dashboard focused for beginners */}
          </>
        ) : (
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/20 rounded-2xl p-8 shadow-glow">
            <div className="text-center space-y-4">
              <p className="text-lg text-muted-foreground">
                Welcome back{userName && `, ${userName}`}! 👋
              </p>
              <h1 className="text-3xl font-bold">
                Financial Dashboard - Set Your First Goal
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
              <CardDescription>
                {usingFallbackMonth
                  ? `No transactions found yet for this month. Showing totals for ${snapshotMonthLabel}.`
                  : `Current status across all accounts (${snapshotMonthLabel} cash flow).`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-background to-muted/40 border border-border/50 rounded-xl p-4 shadow-sm">
                  <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
                  <p className="text-2xl font-bold">
                    ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-success/10 to-success/5 border border-success/20 rounded-xl p-4 shadow-sm">
                  <p className="text-sm text-muted-foreground mb-1">Monthly Income</p>
                  <p className="text-2xl font-bold text-success">
                    ${monthlyIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-destructive/10 to-destructive/5 border border-destructive/20 rounded-xl p-4 shadow-sm">
                  <p className="text-sm text-muted-foreground mb-1">Monthly Expenses</p>
                  <p className="text-2xl font-bold text-destructive">
                    ${monthlyExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {allActiveAnalyses.length > 0 && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-3">
                  <div>
                    <p className="text-sm font-medium">Unified spending limit for all goals</p>
                    <p className="text-xs text-muted-foreground">One adaptive limit across all active goals, adjusted by monthly income, goal progress, total balance, and goal deadlines.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="rounded-lg border border-border/60 bg-background/70 p-3">
                      <p className="text-xs text-muted-foreground">Daily limit</p>
                      <p className="text-sm font-semibold">
                        ${adjustedDailySpendingLimit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-background/70 p-3">
                      <p className="text-xs text-muted-foreground">Weekly limit</p>
                      <p className="text-sm font-semibold">
                        ${adjustedWeeklySpendingLimit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-background/70 p-3">
                      <p className="text-xs text-muted-foreground">Monthly limit</p>
                      <p className="text-sm font-semibold">
                        ${adjustedMonthlySpendingLimit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/60 bg-background/70 p-3">
                    <p className={`text-xs mt-1 ${combinedOverspend > 0 ? "text-destructive" : "text-success"}`}>
                      {combinedOverspend > 0 && recoveryMonths > 0
                        ? `This month is already locked in. Recovery plan: use the adjusted limits above for the next ${recoveryMonths} month${recoveryMonths === 1 ? "" : "s"} to get back on track.`
                        : "You are within the combined limit for all active goals."}
                    </p>
                    {combinedOverspend > 0 && recoveryMonths > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Your current overage is $${combinedOverspend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. We spread that over future months instead of expecting past spending to be undone.
                      </p>
                    )}
                    {combinedOverspend <= 0 && combinedFloorApplied && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Practical floor applied: strict all-goals target would be ${Math.max(0, strictCombinedSpendingLimit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/month, so we enforce at least ${MIN_SPENDING_LIMIT.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/month.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {accountAllocationPlan.length > 0 && (
                <div className="rounded-xl border border-success/20 bg-success/5 p-5 space-y-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-medium">Best overall balance allocation</p>
                      <p className="text-xs text-muted-foreground">
                        This shows how your current total balance is best distributed across accounts to support all active goals overall.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Every account receives a meaningful baseline target, even without a linked goal.
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-success">
                      {accountsOnTargetCount}/{accountAllocationPlan.length} accounts on target
                    </p>
                  </div>

                  <div className="rounded-lg border border-border/60 bg-background/70 p-3 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <p className="text-sm font-medium">
                      Total balance allocated: ${recommendedAllocationTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Based on goal urgency and your current balance of ${totalTrackedBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {accountAllocationPlan.map((entry) => (
                      <div key={entry.accountId} className="rounded-lg border border-border/60 bg-background/70 p-3">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{entry.accountName}</p>
                              {entry.isOnTarget && <Check className="h-4 w-4 text-success" />}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {entry.accountType} account • target {entry.allocationSharePercent.toFixed(1)}% of total balance
                            </p>
                          </div>
                          <div className="text-sm md:text-right">
                            <p className="font-semibold">
                              Hold ${entry.targetBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Current: ${entry.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>

                        <p className={`text-xs mt-2 ${entry.isOnTarget ? "text-success" : "text-muted-foreground"}`}>
                          {entry.isOnTarget
                            ? `On target: this account is $${entry.excessBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} above its recommended allocation.`
                            : `Needs $${entry.gapToTarget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} more to reach its recommended allocation.`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {accountAllocationPlan.length === 0 && goals.length > 0 && (
                <div className="rounded-xl border border-success/20 bg-success/5 p-5 space-y-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-medium">Best overall balance allocation</p>
                      <p className="text-xs text-muted-foreground">
                        This shows how your current total balance is best distributed across accounts to support all active goals overall.
                      </p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background/70 p-3">
                    <p className="text-sm text-muted-foreground">
                      We need at least one account with a positive balance and one goal with remaining amount to generate an allocation plan.
                    </p>
                  </div>
                </div>
              )}

              {transferRecommendation && (
                <div className="rounded-xl border border-success/25 bg-gradient-to-br from-success/10 via-success/5 to-transparent p-5 space-y-2 shadow-sm">
                  <p className="text-sm font-medium">Best money move this month</p>
                  <p className="text-lg font-semibold text-success">
                    Move ${transferRecommendation.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} from {transferRecommendation.fromAccountName} to {transferRecommendation.toAccountName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This move is optimized across all your active goals. {transferRecommendation.reason}
                  </p>
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
              See more details
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
