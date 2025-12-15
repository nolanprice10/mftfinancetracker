/**
 * Example Usage of useRewards Hook
 * 
 * This hook allows you to check if a user has unlocked specific features
 * through the referral program.
 * 
 * Example in a component:
 * 
 * import { useRewards } from '@/hooks/useRewards';
 * 
 * const MyComponent = () => {
 *   const { hasCustomThemes, hasAdvancedAnalytics, hasDataExport, hasAllFeatures, loading } = useRewards();
 * 
 *   if (loading) return <div>Loading...</div>;
 * 
 *   return (
 *     <div>
 *       {hasCustomThemes() && (
 *         <ThemeSelector />
 *       )}
 *       
 *       {(hasAdvancedAnalytics() || hasAllFeatures()) && (
 *         <AdvancedAnalyticsPanel />
 *       )}
 *       
 *       {(hasDataExport() || hasAllFeatures()) && (
 *         <ExportButton />
 *       )}
 *     </div>
 *   );
 * };
 * 
 * Feature Checks Available:
 * - hasCustomThemes() - Returns true if user has unlocked custom themes (1 referral)
 * - hasAdvancedAnalytics() - Returns true if user has advanced analytics (3+ referrals)
 * - hasDataExport() - Returns true if user has data export (3+ referrals)
 * - hasAllFeatures() - Returns true if user has all features (5+ referrals)
 * - hasFeature(name: string) - Generic check for any feature by name
 * 
 * The rewards array contains all active rewards with their details:
 * - reward_type: 'feature_unlock' | 'bonus_credits'
 * - reward_description: Human-readable description
 * - expires_at: Null for permanent rewards, date for temporary ones
 * - is_active: Boolean indicating if reward is currently active
 */

export {};
