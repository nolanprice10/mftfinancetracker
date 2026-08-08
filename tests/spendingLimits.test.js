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
    availableBalance: 1000,
  });

  assert.equal(result.canAutoAdjust, true);
  assert.ok(result.adjustedMonthlySpendingLimit > result.combinedSpendingLimit);
  assert.ok(result.borrowedFromNextMonthAmount > 0);
  assert.ok(result.nextMonthAdjustedLimit < result.combinedSpendingLimit);
});

test('borrows from next month when over budget and funds are available', () => {
  const result = computeSpendingLimits({
    monthlyIncome: 100,
    monthlyExpenses: 60,
    allGoalsMonthlyRequirement: 50,
    overallGoalProgress: 0.5,
    goalPressureRatio: 0.5,
    balanceCoverageRatio: 0.8,
    availableBalance: 1000,
  });

  assert.equal(result.canAutoAdjust, true);
  assert.equal(result.autoAdjustmentBlocked, false);
  assert.ok(result.adjustedMonthlySpendingLimit > result.combinedSpendingLimit);
  assert.equal(
    Number((result.adjustedMonthlySpendingLimit - result.combinedSpendingLimit).toFixed(2)),
    result.borrowedFromNextMonthAmount,
  );
  assert.equal(
    Number((result.combinedSpendingLimit - result.borrowedFromNextMonthAmount).toFixed(2)),
    result.nextMonthAdjustedLimit,
  );
});

test('blocks auto-adjustment when account balance cannot support expanded limit', () => {
  const result = computeSpendingLimits({
    monthlyIncome: 100,
    monthlyExpenses: 60,
    allGoalsMonthlyRequirement: 50,
    overallGoalProgress: 0.5,
    goalPressureRatio: 0.5,
    balanceCoverageRatio: 0.8,
    availableBalance: 55,
  });

  assert.equal(result.autoAdjustmentBlocked, true);
  assert.equal(result.canAutoAdjust, false);
  assert.ok(result.requestedAdjustedMonthlyLimit > result.availableBalance);
  assert.equal(result.adjustedMonthlySpendingLimit, result.combinedSpendingLimit);
  assert.equal(result.borrowedFromNextMonthAmount, 0);
});

test('guarantees at least a $1 limit even with zero balance and overage', () => {
  const result = computeSpendingLimits({
    monthlyIncome: 0,
    monthlyExpenses: 40,
    allGoalsMonthlyRequirement: 100,
    overallGoalProgress: 0.2,
    goalPressureRatio: 2.5,
    balanceCoverageRatio: 0,
    availableBalance: 0,
  });

  assert.equal(result.adjustedMonthlySpendingLimit, 1);
  assert.equal(result.adjustedWeeklySpendingLimit, 1);
  assert.equal(result.adjustedDailySpendingLimit, 1);
  assert.equal(result.guaranteedFloorActive, true);
});
