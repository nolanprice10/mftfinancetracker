/**
 * Calculate user's percentile rank based on their probability
 * This simulates a distribution of user probabilities
 * In production, this would query actual user data
 */

export function calculatePercentile(userProbability: number): number {
  // Simulate a beta distribution of financial probabilities
  // Most people cluster around 40-60%, with some high performers and strugglers
  
  // Percentile formula: what percentage of users have this probability or lower?
  // Using a logistic transformation to create realistic distribution
  const percentile = Math.round(
    100 / (1 + Math.exp(-0.15 * (userProbability - 50)))
  );
  
  return Math.min(Math.max(percentile, 1), 99); // Clamp between 1-99
}

/**
 * Get percentile text description
 */
export function getPercentileDescription(percentile: number): string {
  if (percentile >= 90) return "You're in an elite group";
  if (percentile >= 75) return "You're ahead of most people";
  if (percentile >= 50) return "You're doing better than average";
  if (percentile >= 25) return "You have room to improve";
  return "You've found your challenge";
}

/**
 * Get sharing message based on percentile
 */
export function getSharingMessage(probability: number, percentile: number): string {
  const percentileText = getPercentileDescription(percentile);
  
  return `${percentileText} — I have a ${probability}% chance of hitting my financial goal using ${probability >= 75 ? "smart" : ""} planning.`;
}
