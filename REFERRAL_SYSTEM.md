# Referral System - How It Works

## Overview
The referral system allows users to invite friends and unlock features based on successful referrals.

## User Flow

### 1. Getting Your Referral Link
- Go to Settings page
- Your unique referral code is automatically generated on first visit
- Copy your referral link: `https://yoursite.com/auth?ref=YOUR_CODE`

### 2. Sharing the Link
- Share via social media, email, messaging apps
- When someone clicks your link, the referral code is captured

### 3. Friend Signs Up
- Friend sees "You've been invited!" message
- When they complete signup, the referral is tracked
- Referral code is stored in localStorage to persist across page refreshes

### 4. Automatic Reward Granting
- Database trigger automatically detects completed referrals
- Rewards are granted instantly based on milestones:
  - **1 referral** → Custom Themes Unlocked
  - **3 referrals** → Advanced Analytics + Data Export
  - **5+ referrals** → All Advanced Features Forever!

## Technical Implementation

### Database Tables

**referrals**
- Tracks each referral relationship
- Stores unique referral codes
- Links referrer to referred user
- Status: pending → completed

**user_rewards**
- Stores unlocked features per user
- Permanent feature unlocks (no expiration)
- Tied to user account

### Automatic Processing

1. **Trigger: `trigger_check_referral_on_signup`**
   - Runs when new user signs up
   - Matches email to pending referrals
   - Marks referral as completed

2. **Trigger: `trigger_completed_referral`**
   - Runs when referral status changes to completed
   - Counts total referrals for referrer
   - Grants appropriate rewards based on count

### Using Rewards in Code

```typescript
import { useRewards } from '@/hooks/useRewards';

const MyComponent = () => {
  const { hasCustomThemes, hasAdvancedAnalytics, hasAllFeatures } = useRewards();

  return (
    <div>
      {hasCustomThemes() && <ThemeSelector />}
      {hasAdvancedAnalytics() && <AdvancedCharts />}
      {hasAllFeatures() && <PremiumFeatures />}
    </div>
  );
};
```

## Security

- Row Level Security (RLS) enabled on all tables
- Users can only view their own referrals and rewards
- Referral codes are unique and randomly generated
- Database functions run with SECURITY DEFINER for controlled access

## Testing the System

1. Create an account and go to Settings
2. Copy your referral link
3. Sign up with a new account using the referral link
4. Check the referrer's Settings page - referral count should increase
5. Verify rewards appear in "Your Active Rewards" section

## Reward Display

In Settings, users see:
- **Referral Stats**: Successful referrals count and active rewards count
- **Active Rewards**: List of unlocked features with descriptions
- **Referral Link**: Copy-to-clipboard functionality
- **Reward Tiers**: Progress tracker showing which tiers are unlocked
