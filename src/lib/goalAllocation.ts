export interface GoalAllocationInput {
  incomingAmount: number;
  goals: Array<{
    id?: string;
    name: string;
    current_amount?: number | string | null;
    target_amount?: number | string | null;
    end_date?: string | null;
  }>;
}

export interface GoalAllocationRecommendation {
  goalName: string;
  recommendedAmount: number;
  message: string;
  progressPercent: number;
}

export function getGoalAllocationRecommendation({ incomingAmount, goals }: GoalAllocationInput): GoalAllocationRecommendation | null {
  const amount = Number(incomingAmount) || 0;
  if (amount <= 0 || !Array.isArray(goals) || goals.length === 0) {
    return null;
  }

  const activeGoals = goals
    .map((goal) => {
      const targetAmount = Number(goal.target_amount) || 0;
      const currentAmount = Number(goal.current_amount) || 0;
      const remaining = Math.max(targetAmount - currentAmount, 0);
      const progressPercent = targetAmount > 0 ? Math.min(100, (currentAmount / targetAmount) * 100) : 0;
      const endDate = goal.end_date ? new Date(goal.end_date) : null;
      const hasDeadline = endDate instanceof Date && !Number.isNaN(endDate.getTime());
      const daysRemaining = hasDeadline ? Math.max(Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)), 0) : 999999;
      return { ...goal, remaining, progressPercent, daysRemaining };
    })
    .filter((goal) => goal.remaining > 0);

  if (activeGoals.length === 0) {
    return null;
  }

  const prioritizedGoal = activeGoals.reduce((best, current) => {
    const currentUrgency = current.progressPercent < 50 ? 1.5 : 1;
    const currentScore = current.remaining / Math.max(current.daysRemaining, 1) * currentUrgency;
    const bestScore = best.remaining / Math.max(best.daysRemaining, 1) * (best.progressPercent < 50 ? 1.5 : 1);
    return currentScore < bestScore ? current : best;
  });

  const progressPercent = Math.round(prioritizedGoal.progressPercent);
  const recommendedAmount = Math.min(amount, prioritizedGoal.remaining);
  const message = `Direct ${amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} toward ${prioritizedGoal.name} first. That gets you closest to your goal fastest because you still need $${prioritizedGoal.remaining.toLocaleString()} and you're ${progressPercent}% of the way there.`;

  return {
    goalName: prioritizedGoal.name,
    recommendedAmount,
    message,
    progressPercent,
  };
}
