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

const roundToFive = (value: number) => {
  if (value <= 0) return 0;
  return Math.round(value / 5) * 5;
};

export function getBestTransferRecommendation(input: TransferRecommendationInput): TransferRecommendation | null {
  const { accounts, goals, monthlyIncome, monthlyExpenses } = input;
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

  const linkedDestination = topGoal.goal.account_id
    ? normalizedAccounts.find((account) => account.id === topGoal.goal.account_id)
    : null;

  const fallbackSavings = normalizedAccounts
    .filter((account) => account.normalizedType === "savings")
    .sort((a, b) => b.normalizedBalance - a.normalizedBalance)[0];

  const destination = linkedDestination || fallbackSavings;
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

  if (!candidateSources.length) return null;

  const source = candidateSources[0];

  const monthlySurplus = Math.max(0, monthlyIncome - monthlyExpenses);
  const monthlyGap = Math.max(0, monthlyNeededForGoal - monthlySurplus);

  const desiredMove = Math.max(
    25,
    Math.min(monthlyNeededForGoal, topGoal.remaining, source.availableToMove, monthlyGap > 0 ? monthlyGap : monthlyNeededForGoal * 0.5)
  );

  const roundedMove = roundToFive(desiredMove);
  const amount = Math.min(source.availableToMove, topGoal.remaining, roundedMove);

  if (amount < 5) return null;

  const reason = monthlyGap > 0
    ? `This goal needs about $${monthlyNeededForGoal.toFixed(0)}/month, and you're currently short by about $${monthlyGap.toFixed(0)}/month.`
    : `Moving this now ring-fences progress toward a monthly target of about $${monthlyNeededForGoal.toFixed(0)}.`;

  return {
    fromAccountId: source.account.id,
    fromAccountName: source.account.name,
    toAccountId: destination.id,
    toAccountName: destination.name,
    goalId: topGoal.goal.id,
    goalName: topGoal.goal.name,
    amount,
    monthlyNeededForGoal,
    reason,
  };
}
