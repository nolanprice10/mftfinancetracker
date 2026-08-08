const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const toCents = (value) => Number(Math.max(0, value).toFixed(2));

export function computeSpendingLimits({
  monthlyIncome,
  monthlyExpenses,
  allGoalsMonthlyRequirement,
  overallGoalProgress,
  goalPressureRatio,
  balanceCoverageRatio,
  availableBalance,
  minSpendingLimit = 1,
}) {
  const progressMultiplierMonthly = clamp(0.8 + overallGoalProgress * 0.35, 0.7, 1.1);
  const pressureMultiplierMonthly = clamp(1.15 - goalPressureRatio * 0.3, 0.65, 1.05);
  const balanceMultiplierMonthly = clamp(0.85 + Math.min(1, balanceCoverageRatio) * 0.3, 0.75, 1.15);

  const strictCombinedSpendingLimit = monthlyIncome - allGoalsMonthlyRequirement;
  const practicalMonthlySpendFloor = monthlyIncome > 0
    ? Math.max(minSpendingLimit, monthlyIncome * 0.08)
    : minSpendingLimit;

  const adaptiveMonthlyCandidate = strictCombinedSpendingLimit
    * progressMultiplierMonthly
    * pressureMultiplierMonthly
    * balanceMultiplierMonthly;

  const combinedSpendingLimit = toCents(Math.max(
    minSpendingLimit,
    practicalMonthlySpendFloor,
    Number.isFinite(adaptiveMonthlyCandidate) ? adaptiveMonthlyCandidate : 0,
  ));

  const combinedFloorApplied = combinedSpendingLimit <= practicalMonthlySpendFloor;
  const combinedOverspend = toCents(Math.max(0, monthlyExpenses - combinedSpendingLimit));

  const weeklyIncomeProxy = monthlyIncome * 12 / 52;
  const weeklyGoalRequirement = allGoalsMonthlyRequirement * 12 / 52;
  const strictWeeklySpendingLimit = weeklyIncomeProxy - weeklyGoalRequirement;
  const progressMultiplierWeekly = clamp(0.78 + overallGoalProgress * 0.28, 0.68, 1.08);
  const pressureMultiplierWeekly = clamp(1.12 - goalPressureRatio * 0.26, 0.66, 1.04);
  const balanceMultiplierWeekly = clamp(0.82 + Math.min(1, balanceCoverageRatio) * 0.26, 0.72, 1.12);
  const weeklyFloor = Math.max(minSpendingLimit, weeklyIncomeProxy * 0.09);
  const adaptiveWeeklyCandidate = strictWeeklySpendingLimit
    * progressMultiplierWeekly
    * pressureMultiplierWeekly
    * balanceMultiplierWeekly;
  const combinedWeeklySpendingLimit = toCents(Math.max(
    minSpendingLimit,
    weeklyFloor,
    Number.isFinite(adaptiveWeeklyCandidate) ? adaptiveWeeklyCandidate : 0,
  ));

  const dailyIncomeProxy = monthlyIncome * 12 / 365;
  const dailyGoalRequirement = allGoalsMonthlyRequirement * 12 / 365;
  const strictDailySpendingLimit = dailyIncomeProxy - dailyGoalRequirement;
  const progressMultiplierDaily = clamp(0.76 + overallGoalProgress * 0.22, 0.66, 1.05);
  const pressureMultiplierDaily = clamp(1.08 - goalPressureRatio * 0.22, 0.66, 1.03);
  const balanceMultiplierDaily = clamp(0.8 + Math.min(1, balanceCoverageRatio) * 0.2, 0.7, 1.08);
  const dailyFloor = Math.max(minSpendingLimit, dailyIncomeProxy * 0.1);
  const adaptiveDailyCandidate = strictDailySpendingLimit
    * progressMultiplierDaily
    * pressureMultiplierDaily
    * balanceMultiplierDaily;
  const combinedDailySpendingLimit = toCents(Math.max(
    minSpendingLimit,
    dailyFloor,
    Number.isFinite(adaptiveDailyCandidate) ? adaptiveDailyCandidate : 0,
  ));

  const safeAvailableBalance = toCents(Math.max(0, Number(availableBalance) || 0));
  const overageBuffer = combinedOverspend > 0
    ? Math.max(5, combinedSpendingLimit * 0.1)
    : 0;

  const requestedAdjustedMonthlyLimit = combinedOverspend > 0
    ? toCents(monthlyExpenses + overageBuffer)
    : combinedSpendingLimit;

  const requestedBorrowAmount = combinedOverspend > 0
    ? toCents(Math.max(0, requestedAdjustedMonthlyLimit - combinedSpendingLimit))
    : 0;

  const autoAdjustmentBlocked = combinedOverspend > 0 && requestedAdjustedMonthlyLimit > safeAvailableBalance;
  const canAutoAdjust = combinedOverspend > 0 && !autoAdjustmentBlocked;

  const affordabilityCappedBaseMonthlyLimit = toCents(
    Math.max(minSpendingLimit, Math.min(combinedSpendingLimit, safeAvailableBalance || minSpendingLimit))
  );

  const adjustedMonthlySpendingLimit = canAutoAdjust
    ? requestedAdjustedMonthlyLimit
    : affordabilityCappedBaseMonthlyLimit;

  const borrowedFromNextMonthAmount = canAutoAdjust ? requestedBorrowAmount : 0;
  const nextMonthAdjustedLimit = borrowedFromNextMonthAmount > 0
    ? toCents(Math.max(minSpendingLimit, combinedSpendingLimit - borrowedFromNextMonthAmount))
    : combinedSpendingLimit;

  const weeklyRatio = combinedSpendingLimit > 0 ? combinedWeeklySpendingLimit / combinedSpendingLimit : 12 / 52;
  const dailyRatio = combinedSpendingLimit > 0 ? combinedDailySpendingLimit / combinedSpendingLimit : 12 / 365;

  const adjustedWeeklySpendingLimit = toCents(Math.max(minSpendingLimit, adjustedMonthlySpendingLimit * weeklyRatio));
  const adjustedDailySpendingLimit = toCents(Math.max(minSpendingLimit, adjustedMonthlySpendingLimit * dailyRatio));

  const nextMonthAdjustedWeeklyLimit = toCents(Math.max(minSpendingLimit, nextMonthAdjustedLimit * weeklyRatio));
  const nextMonthAdjustedDailyLimit = toCents(Math.max(minSpendingLimit, nextMonthAdjustedLimit * dailyRatio));

  const guaranteedFloorActive = (
    adjustedMonthlySpendingLimit === minSpendingLimit
    || adjustedWeeklySpendingLimit === minSpendingLimit
    || adjustedDailySpendingLimit === minSpendingLimit
    || nextMonthAdjustedLimit === minSpendingLimit
  );

  return {
    combinedSpendingLimit,
    adjustedMonthlySpendingLimit,
    adjustedWeeklySpendingLimit,
    adjustedDailySpendingLimit,
    nextMonthAdjustedLimit,
    nextMonthAdjustedWeeklyLimit,
    nextMonthAdjustedDailyLimit,
    borrowedFromNextMonthAmount,
    requestedAdjustedMonthlyLimit,
    autoAdjustmentBlocked,
    canAutoAdjust,
    availableBalance: safeAvailableBalance,
    guaranteedFloorActive,
    combinedOverspend,
    combinedFloorApplied,
    strictCombinedSpendingLimit,
  };
}
