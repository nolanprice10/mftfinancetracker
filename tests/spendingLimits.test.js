import test from 'node:test';
import assert from 'node:assert/strict';
import { computeSpendingLimits } from '../src/lib/spendingLimits.js';

test('keeps a tiny positive spending allowance when the adaptive limit would otherwise collapse', () => {
  const result = computeSpendingLimits({
    monthlyIncome: 100,
    monthlyExpenses: 120,
    allGoalsMonthlyRequirement: 200,
    overallGoalProgress: 0.55,
    goalPressureRatio: 2.2,
    balanceCoverageRatio: 0.1,
  });

  assert.equal(result.adjustedMonthlySpendingLimit, 0.01);
  assert.equal(result.adjustedWeeklySpendingLimit, 0.01);
  assert.equal(result.adjustedDailySpendingLimit, 0.01);
});
