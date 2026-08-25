interface AccountInput {
  id: string;
  name: string;
  balance: number | string | null;
  type: string;
}

interface GoalInput {
  id: string;
  name: string;
  target_amount: number | string | null;
  current_amount: number | string | null;
  end_date: string;
  account_id?: string | null;
}

interface TransferRecommendationInput {
  accounts: AccountInput[];
  goals: GoalInput[];
  monthlyIncome: number;
  monthlyExpenses: number;
  allocationPlan?: AllocationPlanEntry[];
}

export interface AllocationPlanEntry {
  accountId: string;
  accountName: string;
  gapToTarget: number;
  excessBalance: number;
  isOnTarget: boolean;
}

export interface TransferRecommendation {
  fromAccountId: string;
  fromAccountName: string;
  toAccountId: string;
  toAccountName: string;
  goalId: string;
  goalName: string;
  amount: number;
  monthlyNeededForGoal: number;
  reason: string;
}

export const MINIMUM_TRANSFER_THRESHOLD = 5;
export const MINIMUM_ALLOCATION_TOLERANCE = 5;

export const getAllocationTolerance = (totalAllocatedBalance: number) => Math.max(
  MINIMUM_ALLOCATION_TOLERANCE,
  totalAllocatedBalance * 0.01
);

const asNumber = (value: number | string | null | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const typePriority = (type: string) => {
  switch (String(type || "").toLowerCase()) {
    case "checking":
      return 0;
    case "cash":
      return 1;
    case "savings":
      return 2;
    case "brokerage":
      return 3;
    case "retirement":
      return 4;
    default:
      return 5;
  }
};

export function getBestTransferRecommendation(input: TransferRecommendationInput): TransferRecommendation | null {
  const { accounts, goals, monthlyIncome, monthlyExpenses, allocationPlan } = input;
  if (!accounts.length || !goals.length) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const normalizedAccounts = accounts.map((account) => ({
    ...account,
    normalizedBalance: asNumber(account.balance),
    normalizedType: String(account.type || "").toLowerCase(),
  }));

  const activeGoals = goals
    .map((goal) => {
      const target = asNumber(goal.target_amount);
      const current = asNumber(goal.current_amount);
      const remaining = Math.max(0, target - current);
      const endDate = new Date(goal.end_date);
      endDate.setHours(0, 0, 0, 0);
      const expired = endDate < today && remaining > 0;
      const monthsToGoal = Math.max(
        1,
        Math.ceil((new Date(goal.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))
      );

      const urgencyScore = remaining / monthsToGoal;
      return {
        goal,
        target,
        current,
        remaining,
        expired,
        monthsToGoal,
        urgencyScore,
      };
    })
    .filter((item) => !item.expired && item.remaining > 0)
    .sort((a, b) => b.urgencyScore - a.urgencyScore);

  if (!activeGoals.length) return null;

  const topGoal = activeGoals[0];
  const monthlyNeededForGoal = topGoal.remaining / topGoal.monthsToGoal;

  const allocationDestination = allocationPlan
    ?.filter((entry) => !entry.isOnTarget && entry.gapToTarget >= MINIMUM_ALLOCATION_TOLERANCE)
    .sort((a, b) => b.gapToTarget - a.gapToTarget)[0];
  const allocationSource = allocationPlan
    ?.filter((entry) => !entry.isOnTarget && entry.excessBalance >= MINIMUM_ALLOCATION_TOLERANCE)
    .sort((a, b) => b.excessBalance - a.excessBalance)[0];

  if (allocationPlan && (!allocationDestination || !allocationSource)) return null;

  const linkedDestination = topGoal.goal.account_id
    ? normalizedAccounts.find((account) => account.id === topGoal.goal.account_id)
    : null;

  const fallbackSavings = normalizedAccounts
    .filter((account) => account.normalizedType === "savings")
    .sort((a, b) => b.normalizedBalance - a.normalizedBalance)[0];

  const destination = allocationDestination
    ? normalizedAccounts.find((account) => account.id === allocationDestination.accountId)
    : linkedDestination || fallbackSavings;
  if (!destination) return null;

  const baseCheckingReserve = Math.max(monthlyExpenses * 0.5, 250);
  const baseSavingsReserve = Math.max(monthlyExpenses * 0.25, 100);

  const candidateSources = normalizedAccounts
    .filter((account) => account.id !== destination.id)
    .filter((account) => account.normalizedType !== "retirement")
    .map((account) => {
      const reserve = account.normalizedType === "checking"
        ? baseCheckingReserve
        : account.normalizedType === "savings"
          ? baseSavingsReserve
          : 0;

      return {
        account,
        availableToMove: Math.max(0, account.normalizedBalance - reserve),
      };
    })
    .filter((item) => item.availableToMove > 0)
    .sort((a, b) => {
      const priorityDiff = typePriority(a.account.normalizedType) - typePriority(b.account.normalizedType);
      if (priorityDiff !== 0) return priorityDiff;
      return b.availableToMove - a.availableToMove;
    });

  if (!candidateSources.length && !allocationSource) return null;

  const source = allocationSource
    ? normalizedAccounts.find((account) => account.id === allocationSource.accountId)
    : candidateSources[0];
  if (!source) return null;

  const monthlySurplus = Math.max(0, monthlyIncome - monthlyExpenses);
  const monthlyGap = Math.max(0, monthlyNeededForGoal - monthlySurplus);

  const desiredMove = allocationDestination && allocationSource
    ? Math.min(allocationDestination.gapToTarget, allocationSource.excessBalance)
    : Math.min(
        monthlyNeededForGoal,
        topGoal.remaining,
        source.availableToMove,
        monthlyGap > 0 ? monthlyGap : monthlyNeededForGoal
      );

  // Keep exact cents (no rounding to 5/10/25 buckets).
  const amount = Math.max(0, Number(desiredMove.toFixed(2)));

  if (amount < MINIMUM_TRANSFER_THRESHOLD) return null;

  const reason = allocationDestination && allocationSource
    ? `This move brings ${destination.name} toward its shared allocation target without moving more than ${source.name} has above its target.`
    : monthlyGap > 0
    ? `This goal needs about $${monthlyNeededForGoal.toFixed(0)}/month, and you're currently short by about $${monthlyGap.toFixed(0)}/month.`
    : `Moving this now ring-fences progress toward a monthly target of about $${monthlyNeededForGoal.toFixed(0)}.`;

  return {
    fromAccountId: source.account?.id || source.id,
    fromAccountName: source.account?.name || source.name,
    toAccountId: destination.id,
    toAccountName: destination.name,
    goalId: topGoal.goal.id,
    goalName: topGoal.goal.name,
    amount,
    monthlyNeededForGoal,
    reason,
  };
}
