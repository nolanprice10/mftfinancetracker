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
  
  // Simple projection without variance
  const projectedSavings = currentSavings + (monthlySavings * monthsToGoal);
  const simpleShortfall = goalAmount - projectedSavings;

  // Monte Carlo simulation (1000 iterations)
  const iterations = 1000;
  let successCount = 0;
  
  // Assume 10% variance in income/spending
  const incomeVariance = monthlyIncome * 0.10;
  const spendingVariance = monthlySpending * 0.10;

  for (let i = 0; i < iterations; i++) {
    let simulatedSavings = currentSavings;
    
    for (let month = 0; month < monthsToGoal; month++) {
      // Random income (normal distribution approximation)
      const randomIncome = monthlyIncome + (Math.random() - 0.5) * 2 * incomeVariance;
      // Random spending (normal distribution approximation)
      const randomSpending = monthlySpending + (Math.random() - 0.5) * 2 * spendingVariance;
      
      simulatedSavings += randomIncome - randomSpending;
    }
    
    if (simulatedSavings >= goalAmount) {
      successCount++;
    }
  }

  const probability = (successCount / iterations) * 100;

  // Calculate recommended increase to reach 75% probability
  let recommendedIncrease = 0;
  if (probability < 75) {
    // Estimate needed monthly savings increase
    // Target: reach goal with 75% probability considering variance
    const targetSavings = goalAmount - currentSavings;
    const monthlyNeeded = targetSavings / monthsToGoal;
    // Add buffer for variance (15% safety margin)
    const safeMonthlyNeeded = monthlyNeeded * 1.15;
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
