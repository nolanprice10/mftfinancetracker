import { supabase } from './supabaseClient';

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
 */
export async function calculateProbabilityChanges(userId: string) {
  try {
    // Get all user's goals with their current probabilities
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('id, name, current_amount, target_amount, end_date')
      .eq('user_id', userId);

    if (goalsError) throw goalsError;
    if (!goals || goals.length === 0) return [];

    const changes: ProbabilityChange[] = [];
    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    for (const goal of goals) {
      // Calculate current probability
      const currentProb = calculateGoalProbability(goal.current_amount, goal.target_amount);

      // Get previous month's probability from history
      const { data: history } = await supabase
        .from('probability_history')
        .select('probability_value')
        .eq('goal_id', goal.id)
        .eq('year_month', previousMonthStart.toISOString().split('T')[0])
        .single();

      const previousProb = history?.probability_value || null;
      const change = previousProb !== null ? currentProb - previousProb : 0;

      changes.push({
        goalName: goal.name,
        currentProbability: currentProb,
        previousProbability: previousProb,
        change,
        trend: change > 2 ? 'up' : change < -2 ? 'down' : 'stable',
        changePercentage: previousProb !== null ? `${change > 0 ? '+' : ''}${change.toFixed(1)}%` : 'N/A'
      });
    }

    return changes;
  } catch (error) {
    console.error('Error calculating probability changes:', error);
    return [];
  }
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
 */
export async function storeProbabilityHistory(userId: string, goalId: string, probability: number) {
  const today = new Date();
  const yearMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];

  try {
    const { error } = await supabase
      .from('probability_history')
      .upsert(
        {
          user_id: userId,
          goal_id: goalId,
          probability_value: probability,
          year_month: yearMonth,
          calculated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id,goal_id,year_month'
        }
      );

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error storing probability history:', error);
    return false;
  }
}

/**
 * Log email event for tracking
 */
export async function logEmailEvent(
  userId: string,
  emailType: 'monthly_digest' | 'probability_change' | 'actionable_improvement' | 'reengagement',
  goalId?: string,
  metadata?: Record<string, any>
) {
  try {
    const { error } = await supabase
      .from('email_events')
      .insert({
        user_id: userId,
        email_type: emailType,
        goal_id: goalId,
        status: 'sent',
        metadata,
        sent_at: new Date().toISOString()
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error logging email event:', error);
    return false;
  }
}

/**
 * Update user's last email sent date
 */
export async function updateLastEmailSentDate(userId: string) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ last_email_sent_date: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating last email sent date:', error);
    return false;
  }
}

/**
 * Get users who should receive emails today
 */
export async function getUsersForMonthlyDigest() {
  try {
    const today = new Date().getDate();

    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('receive_email_updates', true)
      .eq('email_verified', true)
      .eq('monthly_digest_day', today);

    if (error) throw error;
    return users || [];
  } catch (error) {
    console.error('Error fetching users for monthly digest:', error);
    return [];
  }
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
