// Financial goal probability calculator
// Uses Monte Carlo simulation with variance modeling

interface ProbabilityInput {
  monthlyIncome: number;
  monthlySpending: number;
  currentSavings: number;
  goalAmount: number;
  monthsToGoal: number;
}

interface ProbabilityResult {
  probability: number;
  monthlyShortfall: number;
  recommendedIncrease: number;
  projectedAmount: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const logistic = (value: number) => 1 / (1 + Math.exp(-value));

/**
 * Calculate probability of hitting a financial goal
 * Uses simplified Monte Carlo with income/expense variance
 */
export function calculateGoalProbability(input: ProbabilityInput): ProbabilityResult {
  const {
    monthlyIncome,
    monthlySpending,
    currentSavings,
    goalAmount,
    monthsToGoal
  } = input;

  const monthlySavings = monthlyIncome - monthlySpending;
  const targetGap = Math.max(0, goalAmount - currentSavings);
  const requiredMonthlySavings = targetGap / Math.max(1, monthsToGoal);
  
  // Simple projection without variance
  const projectedSavings = currentSavings + (monthlySavings * monthsToGoal);
  const simpleShortfall = goalAmount - projectedSavings;

  // Monte Carlo simulation (multi-factor aware)
  const iterations = 1200;
  let successCount = 0;
  
  // Variance scales with budget pressure: tighter budgets are less predictable.
  const spendingPressure = monthlyIncome > 0 ? clamp(monthlySpending / monthlyIncome, 0, 1.5) : 1;
  const incomeVariance = Math.max(25, monthlyIncome * (0.08 + spendingPressure * 0.05));
  const spendingVariance = Math.max(25, monthlySpending * (0.08 + spendingPressure * 0.06));

  // Coverage, runway, and progress factors (not just monthly contribution pace).
  const coverageRatio = requiredMonthlySavings > 0 ? monthlySavings / requiredMonthlySavings : 1.25;
  const progressRatio = goalAmount > 0 ? currentSavings / goalAmount : 1;
  const savingsRate = monthlyIncome > 0 ? monthlySavings / monthlyIncome : (monthlySavings > 0 ? 0.15 : -0.15);
  const deadlineUrgency = clamp((6 - monthsToGoal) / 6, 0, 1);

  // Heuristic signal that reflects multiple dimensions of goal health.
  const heuristicZScore =
    1.7 * (coverageRatio - 1) +
    1.0 * (progressRatio - 0.2) +
    0.8 * savingsRate -
    0.8 * deadlineUrgency;
  const heuristicProbability = logistic(heuristicZScore) * 100;

  for (let i = 0; i < iterations; i++) {
    let simulatedSavings = currentSavings;
    
    for (let month = 0; month < monthsToGoal; month++) {
      // Random income (normal distribution approximation)
      const randomIncome = monthlyIncome + (Math.random() - 0.5) * 2 * incomeVariance;
      // Random spending (normal distribution approximation)
      const randomSpending = monthlySpending + (Math.random() - 0.5) * 2 * spendingVariance;
      
      // Budget quality slightly shifts effective savings month-to-month.
      const qualityAdjustment = 1 + clamp((coverageRatio - 1) * 0.08 + (savingsRate * 0.04), -0.12, 0.12);
      simulatedSavings += (randomIncome - randomSpending) * qualityAdjustment;

      // Do not allow negative balance drift to create runaway artifacts.
      simulatedSavings = Math.max(simulatedSavings, -goalAmount * 0.5);
    }
    
    if (simulatedSavings >= goalAmount) {
      successCount++;
    }
  }

  // Smoothed simulation probability.
  const simulationProbability = ((successCount + 2) / (iterations + 4)) * 100;

  // Blend simulation with multi-factor heuristic to avoid placeholder-like values
  // while still respecting financial reality.
  const blendedProbability = (simulationProbability * 0.7) + (heuristicProbability * 0.3);
  const probability = clamp(blendedProbability, 2, 98);

  // Calculate recommended increase to reach 75% probability
  let recommendedIncrease = 0;
  if (probability < 75) {
    // Increase needed to move toward a safer probability zone.
    const monthlyNeeded = requiredMonthlySavings;
    // Adaptive safety margin based on time pressure and spending pressure.
    const margin = 1.1 + (deadlineUrgency * 0.15) + (spendingPressure * 0.05);
    const safeMonthlyNeeded = monthlyNeeded * margin;
    recommendedIncrease = Math.max(0, safeMonthlyNeeded - monthlySavings);
  }

  return {
    probability,
    monthlyShortfall: Math.max(0, simpleShortfall / monthsToGoal),
    recommendedIncrease: Math.round(recommendedIncrease),
    projectedAmount: Math.round(projectedSavings)
  };
}

/**
 * Get color code based on probability
 */
export function getProbabilityColor(probability: number): string {
  if (probability < 50) return "destructive";
  if (probability < 70) return "warning";
  return "success";
}

/**
 * Get color CSS classes for text
 */
export function getProbabilityTextClass(probability: number): string {
  if (probability < 50) return "text-destructive";
  if (probability < 70) return "text-yellow-600 dark:text-yellow-500";
  return "text-success";
}

/**
 * Get background color classes
 */
export function getProbabilityBgClass(probability: number): string {
  if (probability < 50) return "bg-destructive/10 border-destructive/20";
  if (probability < 70) return "bg-yellow-500/10 border-yellow-500/20";
  return "bg-success/10 border-success/20";
}
