import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { UserReward } from '@/integrations/supabase/types/referrals';

export const useRewards = () => {
  const [rewards, setRewards] = useState<UserReward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_rewards')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .or('expires_at.is.null,expires_at.gt.now()');

      if (error) throw error;
      setRewards((data || []) as UserReward[]);
    } catch (error) {
      console.error('Failed to fetch rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasFeature = (featureName: string): boolean => {
    return rewards.some(reward => 
      reward.reward_type === 'feature_unlock' && 
      reward.reward_description.toLowerCase().includes(featureName.toLowerCase())
    );
  };

  const hasCustomThemes = (): boolean => hasFeature('themes');
  const hasAdvancedAnalytics = (): boolean => hasFeature('analytics');
  const hasDataExport = (): boolean => hasFeature('export');
  const hasAllFeatures = (): boolean => hasFeature('all advanced features');

  return {
    rewards,
    loading,
    hasFeature,
    hasCustomThemes,
    hasAdvancedAnalytics,
    hasDataExport,
    hasAllFeatures,
    refetch: fetchRewards
  };
};
