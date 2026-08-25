import test from 'node:test';
import assert from 'node:assert/strict';
import { getBestTransferRecommendation } from './transferRecommendation.ts';

test('suppresses transfers when every account is within the allocation tolerance', () => {
  const result = getBestTransferRecommendation({
    accounts: [
      { id: 'savings', name: 'Savings', balance: 399.39, type: 'savings' },
      { id: 'growth', name: 'Growth', balance: 161.43, type: 'savings' },
      { id: 'checking', name: 'Checking', balance: 86.28, type: 'checking' },
    ],
    goals: [{ id: 'goal', name: 'Emergency Fund', target_amount: 5000, current_amount: 1000, end_date: '2027-12-31' }],
    monthlyIncome: 1000,
    monthlyExpenses: 500,
    allocationPlan: [
      { accountId: 'savings', accountName: 'Savings', gapToTarget: 1.15, excessBalance: 0, isOnTarget: true },
      { accountId: 'growth', accountName: 'Growth', gapToTarget: 0, excessBalance: 1.15, isOnTarget: true },
      { accountId: 'checking', accountName: 'Checking', gapToTarget: 0, excessBalance: 0, isOnTarget: true },
    ],
  });

  assert.equal(result, null);
});

test('uses the shared allocation gap when a transfer is actionable', () => {
  const result = getBestTransferRecommendation({
    accounts: [
      { id: 'savings', name: 'Savings', balance: 390, type: 'savings' },
      { id: 'checking', name: 'Checking', balance: 210, type: 'checking' },
    ],
    goals: [{ id: 'goal', name: 'Emergency Fund', target_amount: 5000, current_amount: 1000, end_date: '2027-12-31' }],
    monthlyIncome: 1000,
    monthlyExpenses: 500,
    allocationPlan: [
      { accountId: 'savings', accountName: 'Savings', gapToTarget: 10, excessBalance: 0, isOnTarget: false },
      { accountId: 'checking', accountName: 'Checking', gapToTarget: 0, excessBalance: 12, isOnTarget: false },
    ],
  });

  assert.ok(result);
  assert.equal(result.amount, 10);
  assert.equal(result.fromAccountId, 'checking');
  assert.equal(result.toAccountId, 'savings');
});

test('suppresses generic goal transfers below the execution floor', () => {
  const result = getBestTransferRecommendation({
    accounts: [
      { id: 'checking', name: 'Checking', balance: 500, type: 'checking' },
      { id: 'savings', name: 'Savings', balance: 0, type: 'savings' },
    ],
    goals: [{ id: 'goal', name: 'Emergency Fund', target_amount: 1002, current_amount: 1000, end_date: '2027-12-31' }],
    monthlyIncome: 1000,
    monthlyExpenses: 500,
  });

  assert.equal(result, null);
});
