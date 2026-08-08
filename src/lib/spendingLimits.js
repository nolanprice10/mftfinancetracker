const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const toCents = (value) => Number(Math.max(0, value).toFixed(2));

export function computeSpendingLimits({
  monthlyIncome,
  monthlyExpenses,
  allGoalsMonthlyRequirement,
  overallGoalProgress,
  goalPressureRatio,
  balanceCoverageRatio,
  minSpendingLimit = 0.01,
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

  const recoveryMonths = combinedOverspend > 0
    ? Math.min(6, Math.max(1, Math.ceil(combinedOverspend / Math.max(minSpendingLimit, combinedSpendingLimit * 0.3))))
    : 0;

  const recoveryMonthlyReduction = recoveryMonths > 0 ? combinedOverspend / recoveryMonths : 0;
  const recoveryWeeklyReduction = recoveryMonths > 0 ? (combinedOverspend / recoveryMonths) * 12 / 52 : 0;
  const recoveryDailyReduction = recoveryMonths > 0 ? (combinedOverspend / recoveryMonths) * 12 / 365 : 0;

  const adjustedMonthlySpendingLimit = recoveryMonths > 0
    ? toCents(Math.max(minSpendingLimit, combinedSpendingLimit - recoveryMonthlyReduction))
    : combinedSpendingLimit;

  const adjustedWeeklySpendingLimit = recoveryMonths > 0
    ? toCents(Math.max(minSpendingLimit, combinedWeeklySpendingLimit - recoveryWeeklyReduction))
    : combinedWeeklySpendingLimit;

  const adjustedDailySpendingLimit = recoveryMonths > 0
    ? toCents(Math.max(minSpendingLimit, combinedDailySpendingLimit - recoveryDailyReduction))
    : combinedDailySpendingLimit;

  return {
    combinedSpendingLimit,
    adjustedMonthlySpendingLimit,
    adjustedWeeklySpendingLimit,
    adjustedDailySpendingLimit,
    combinedOverspend,
    recoveryMonths,
    combinedFloorApplied,
    strictCombinedSpendingLimit,
  };
}
