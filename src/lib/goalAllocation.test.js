import test from 'node:test';
import assert from 'node:assert/strict';
import { getGoalAllocationRecommendation } from './goalAllocation.ts';

test('recommends directing incoming money to the most urgent goal', () => {
  const goals = [
    {
      id: 'goal-1',
      name: 'Emergency Fund',
      current_amount: 1500,
      target_amount: 5000,
      end_date: '2026-12-31',
    },
  ];

  const result = getGoalAllocationRecommendation({ incomingAmount: 200, goals });

  assert.ok(result);
  assert.equal(result.goalName, 'Emergency Fund');
  assert.equal(result.recommendedAmount, 200);
  assert.match(result.message, /Emergency Fund/);
});

test('returns null when there is no active goal to prioritize', () => {
  const goals = [
    {
      id: 'goal-2',
      name: 'Vacation',
      current_amount: 8000,
      target_amount: 5000,
      end_date: '2026-12-31',
    },
  ];

  const result = getGoalAllocationRecommendation({ incomingAmount: 200, goals });

  assert.equal(result, null);
});
