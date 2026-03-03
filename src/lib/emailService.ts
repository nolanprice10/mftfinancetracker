// NOTE: This service requires database migrations to be run first
// See: supabase/migrations/20251220000000_add_email_retention_system.sql

export interface ProbabilityChange {
  goalName: string;
  currentProbability: number;
  previousProbability: number | null;
  change: number;
  trend: 'up' | 'down' | 'stable';
  changePercentage: string;
}

/**
 * Calculate probability changes from previous month to current
 * NOTE: Requires probability_history table from migration
 */
export async function calculateProbabilityChanges(userId: string): Promise<ProbabilityChange[]> {
  // TODO: Enable when migration is applied
  return [];
}

/**
 * Calculate goal probability using simplified Monte Carlo approach
 */
export function calculateGoalProbability(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min((current / target) * 100, 100);
}

/**
 * Generate actionable improvement recommendation
 */
export function getActionableImprovement(
  goalName: string,
  currentAmount: number,
  targetAmount: number,
  daysRemaining: number
): string {
  const shortfall = targetAmount - currentAmount;
  if (shortfall <= 0) {
    return `🎉 You've exceeded your "${goalName}" target! Consider setting a new goal.`;
  }

  const monthsRemaining = Math.max(1, Math.ceil(daysRemaining / 30));
  const requiredMonthly = shortfall / monthsRemaining;

  return `📈 To reach your goal by the deadline, save $${requiredMonthly.toFixed(0)} per month. You're ${((currentAmount / targetAmount) * 100).toFixed(0)}% there!`;
}

/**
 * Store probability history for the month
 * NOTE: Requires probability_history table from migration
 */
export async function storeProbabilityHistory(userId: string, goalId: string, probability: number): Promise<boolean> {
  // TODO: Enable when migration is applied
  return false;
}

/**
 * Log email event for tracking
 * NOTE: Requires email_events table from migration
 */
export async function logEmailEvent(
  userId: string,
  emailType: 'monthly_digest' | 'probability_change' | 'actionable_improvement' | 'reengagement',
  goalId?: string,
  metadata?: Record<string, any>
): Promise<boolean> {
  // TODO: Enable when migration is applied
  return false;
}

/**
 * Update user's last email sent date
 * NOTE: Requires last_email_sent_date column in profiles table
 */
export async function updateLastEmailSentDate(userId: string): Promise<boolean> {
  // TODO: Enable when migration is applied
  return false;
}

/**
 * Get users who should receive emails today
 * NOTE: Requires email preference columns in profiles table
 */
export async function getUsersForMonthlyDigest(): Promise<any[]> {
  // TODO: Enable when migration is applied
  return [];
}

/**
 * Generate HTML email template for monthly digest
 */
export function generateMonthlyDigestHTML(
  userName: string,
  changes: ProbabilityChange[],
  recommendations: string[]
): string {
  const changesHTML = changes
    .map(
      (change) =>
        `
    <div style="margin: 20px 0; padding: 15px; border-left: 4px solid ${change.trend === 'up' ? '#10b981' : change.trend === 'down' ? '#ef4444' : '#f59e0b'};">
      <h3 style="margin: 0 0 8px 0; color: #1f2937;">${change.goalName}</h3>
      <p style="margin: 0; color: #6b7280;">Current probability: <strong>${change.currentProbability.toFixed(1)}%</strong></p>
      <p style="margin: 8px 0 0 0; color: ${change.trend === 'up' ? '#10b981' : change.trend === 'down' ? '#ef4444' : '#f59e0b'}; font-weight: bold;">
        ${change.trend === 'up' ? '📈' : change.trend === 'down' ? '📉' : '→'} ${change.changePercentage} ${
        change.previousProbability !== null ? 'this month' : 'tracked'
      }
      </p>
    </div>
  `
    )
    .join('');

  const recommendationsHTML = recommendations
    .map(
      (rec) => `
    <div style="margin: 12px 0; padding: 12px; background-color: #f3f4f6; border-radius: 6px;">
      ${rec}
    </div>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
    a { color: #059669; text-decoration: none; }
    .cta-button { display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Your Monthly Finance Update</h1>
      <p style="margin: 0; opacity: 0.9;">See how you're progressing toward your goals</p>
    </div>
    <div class="content">
      <h2>Hi ${userName || 'Friend'},</h2>
      <p>Here's your monthly summary of goal progress:</p>
      
      <h3 style="color: #1f2937; margin-top: 30px;">Your Goal Updates</h3>
      ${changesHTML || '<p style="color: #6b7280;">No goals tracked yet. <a href="https://mftfinancetracker.com">Add a goal</a> to get started!</p>'}
      
      ${
        recommendations.length > 0
          ? `
      <h3 style="color: #1f2937; margin-top: 30px;">💡 Ways to Improve</h3>
      ${recommendationsHTML}
      `
          : ''
      }
      
      <a href="https://mftfinancetracker.com/dashboard" class="cta-button">View Your Dashboard</a>
    </div>
    <div class="footer">
      <p style="margin: 0;">MFT Finance Tracker • <a href="https://mftfinancetracker.com">Learn more</a></p>
      <p style="margin: 10px 0 0 0;"><a href="https://mftfinancetracker.com/preferences">Update email preferences</a></p>
    </div>
  </div>
</body>
</html>
  `;
}
