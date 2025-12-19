# Referral System - How It Works

## Overview
The referral system allows users to invite friends and unlock features based on successful referrals. Each user gets a unique referral link that creates new referral entries when friends sign up.

## User Flow

### 1. Getting Your Referral Link
- Go to Settings page
- Your unique referral code is automatically generated on first visit
- Each user has ONE unique code stored in `user_referral_codes` table
- Copy your referral link: `https://yoursite.com/auth?ref=YOUR_CODE`

### 2. Sharing the Link
- Share via social media, email, messaging apps
- When someone clicks your link, the referral code is captured in the URL parameter `ref`

### 3. Friend Signs Up
- Friend sees "🎉 You've been invited!" message at the top of the auth page
- Referral code is stored in localStorage to persist across page refreshes
- When they complete signup, a NEW referral entry is created in the `referrals` table
- The entry links the referrer (by code) to the new user

### 4. Automatic Reward Granting
- Database trigger automatically detects completed referrals
- Rewards are granted instantly based on milestones:
  - **1 referral** → Custom Themes Unlocked (3 premium themes)
  - **3 referrals** → Advanced Analytics + Data Export
  - **5+ referrals** → All Advanced Features Forever!

## Technical Implementation

### Database Tables

**user_referral_codes** (NEW!)
- Stores each user's unique referral code
- One code per user (UNIQUE constraint on user_id)
- Used to generate referral links

**referrals**
- Tracks each individual referral relationship
- Each successful referral creates a NEW row
- Links referrer to referred user via referral_code
- Status: pending → completed
- Multiple rows can have the same referral_code (one per referred user)

**user_rewards**
- Stores unlocked features per user
- Permanent feature unlocks (no expiration)
- Tied to user account

### How It Works Step-by-Step

1. **User A visits Settings**
   - System checks `user_referral_codes` for their code
   - If doesn't exist, generates unique 8-character code (e.g., "ABC12345")
   - Stores in `user_referral_codes` table

2. **User A shares link**: `https://app.com/auth?ref=ABC12345`

3. **User B clicks link**
   - Code is extracted from URL: `ABC12345`
   - Stored in localStorage as `referralCode`
   - Badge appears: "🎉 You've been invited!"

4. **User B signs up**
   - System looks up `ABC12345` in `user_referral_codes` to find User A's ID
   - Creates NEW row in `referrals`:
     ```
     referrer_id: User A's ID
     referred_user_id: User B's ID
     referral_code: ABC12345
     referred_email: User B's email
     status: completed
     completed_at: now()
     ```

5. **Trigger fires** (`trigger_completed_referral`)
   - Counts total completed referrals for User A
   - If count hits milestone (1, 3, or 5), inserts reward in `user_rewards`
   - Marks `reward_granted = true` on the referral

### Automatic Processing

1. **Trigger: `trigger_completed_referral`**
   - Runs when referral status changes to completed
   - Counts total referrals for referrer
   - Grants appropriate rewards based on count
   - Prevents duplicate rewards with unique index

2. **Function: `handle_completed_referral()`**
   - Checks if referral just completed (status: pending → completed)
   - Counts completed referrals for the referrer
   - Inserts reward into user_rewards if milestone reached
   - Uses ON CONFLICT DO NOTHING to prevent duplicates

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
- Referral codes are unique per user
- Database functions run with SECURITY DEFINER for controlled access
- Unique index prevents duplicate rewards

## Testing the System

### Manual Testing

1. **Create Account A**
   - Sign up normally
   - Go to Settings
   - Copy referral link (e.g., `http://localhost:5173/auth?ref=XYZ789`)

2. **Use Referral Link**
   - Open referral link in incognito/private window
   - Verify "🎉 You've been invited!" appears
   - Sign up as new user (Account B)

3. **Verify Referral Tracked**
   - Log back in as Account A
   - Go to Settings
   - Check "Successful Referrals" should be 1
   - Check "Active Rewards" should show "Custom Themes Unlocked"

4. **Test Milestones**
   - Repeat with 2 more friends → Should unlock Analytics at 3 referrals
   - Repeat with 2 more friends → Should unlock All Features at 5 referrals

### Database Debugging

Query to check a user's referral status:
```sql
SELECT 
  urc.referral_code,
  COUNT(r.id) FILTER (WHERE r.status = 'completed') as completed,
  array_agg(r.referred_email) FILTER (WHERE r.referred_email IS NOT NULL) as emails
FROM user_referral_codes urc
LEFT JOIN referrals r ON r.referral_code = urc.referral_code
WHERE urc.user_id = 'YOUR_USER_ID'
GROUP BY urc.referral_code;
```

Check rewards granted:
```sql
SELECT * FROM user_rewards 
WHERE user_id = 'YOUR_USER_ID' 
AND is_active = true;
```

## Reward Display

In Settings, users see:
- **Referral Stats**: Successful referrals count and active rewards count
- **Active Rewards**: List of unlocked features with descriptions
- **Referral Link**: Copy-to-clipboard functionality with their unique code
- **Reward Tiers**: Progress tracker showing which tiers are unlocked

## Common Issues & Solutions

### Issue: Referral not tracking
- Check localStorage has `referralCode` before signup
- Verify referral code exists in `user_referral_codes` table
- Check console logs for errors

### Issue: Rewards not granted
- Verify `trigger_completed_referral` exists and is enabled
- Check `user_rewards` table directly
- Run the debug view: `SELECT * FROM referral_debug_view WHERE referrer_id = 'YOUR_ID'`

### Issue: Duplicate rewards
- Unique index prevents this: `idx_user_rewards_unique`
- If duplicates exist, run cleanup migration

## Files Modified/Created

### Database Migrations
- `20251215000000_add_referral_system.sql` - Initial setup
- `20251219000000_improve_referral_rewards.sql` - Better duplicate handling
- `20251219000001_user_referral_codes.sql` - Separate code storage
- `20251219000002_referral_debug_view.sql` - Debug view

### Frontend Files
- `src/pages/Auth.tsx` - Handles referral code capture and signup
- `src/pages/Settings.tsx` - Displays referral link and stats
- `src/hooks/useRewards.ts` - React hook for checking rewards
- `src/integrations/supabase/types/referrals.ts` - TypeScript types

## Architecture Diagram

```
User A (Referrer)
    └─> user_referral_codes: { user_id: A, code: "ABC123" }
    └─> Shares: https://app.com/auth?ref=ABC123
         └─> User B clicks
              └─> localStorage.setItem('referralCode', 'ABC123')
              └─> User B signs up
                   └─> referrals: { 
                        referrer_id: A, 
                        referred_user_id: B,
                        referral_code: "ABC123",
                        status: "completed"
                      }
                   └─> Trigger fires
                        └─> Counts A's completed referrals
                        └─> If milestone reached → Insert user_rewards
```
