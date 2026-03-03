# MyFinanceTracker: Strategic Refocus Guide

## Executive Summary

MyFinanceTracker has been completely refocused to drive exponential viral growth through **clarity + sharing**. The app now serves a specific target audience, emphasizes ONE clear outcome, and makes sharing effortless.

**Target User**: Young professionals (22-32), earning $60k+, wanting financial goal certainty.

**Core Promise**: "One clear number in 30 seconds: your probability of hitting your goal."

---

## Part 1: Lock Your Exact Target User

### Who We're Serving (And Who We're NOT)
✅ **We serve:**
- Young professionals 22-32 years old
- Earning $60k+ annually (after-tax ~$4-5k/month)
- Serious about ONE financial goal (down payment, emergency fund, savings target)
- Want certainty, not advice
- Willing to share results with friends

❌ **We don't serve:**
- Advanced investors (use Bloomberg Terminal)
- Quants/data scientists (use quantitative libraries)
- People wanting comprehensive expense tracking
- Wealthy individuals managing complex portfolios
- Anyone seeking life advice

### How This Shapes Product Decisions
- **Onboarding**: Clear, specific questions about near-term goals
- **Messaging**: "Certainty," "clarity," "what's your number?"
- **Features**: Only features that answer ONE question
- **Language**: Direct, young professional, no jargon
- **Testimonials**: Real people (32-year-old product manager, 28-year-old engineer)

### Where to Enforce This
1. **Landing page**: Speaks directly to this audience
2. **Onboarding**: Default values reflect $6k income
3. **Error messages**: Use their language
4. **Feature descriptions**: Why it matters to THEM
5. **Email campaigns**: "For young professionals focused on goals"

---

## Part 2: Perfect Your Core Outcome

### The ONE Thing Dashboard Shows
```
┌─ YOUR FINANCIAL PROBABILITY ─┐
│                               │
│         62%                    │
│                               │
│ Chance of hitting: Down payment│
│ Target: $25,000 by Dec 2026   │
│                               │
│ ┌─────────────────────────────┐│
│ │ WHAT TO DO                   ││
│ │ Increase monthly savings by   ││
│ │ $180/month                    ││
│ │ This brings you to 75%        ││
│ └─────────────────────────────┘│
└───────────────────────────────┘
```

### Why This Works
1. **Time to answer**: <30 seconds from landing to "62%"
2. **Color-coded status**: Red (bad), Yellow (mediocre), Green (good)
3. **One action item**: Not "here are 10 ways to save money" but "increase by $180"
4. **No decision paralysis**: Can't debate whether to click something

### Technical Implementation
- Dashboard calculates probability in `Dashboard.tsx`
- Color coding via `getProbabilityBgClass()` in `lib/probability.ts`
- Large typography: `text-7xl md:text-8xl`
- Recommendation auto-calculated: `recommendedIncrease` value

### Advanced Features Are Hidden
```
┌─ BASIC VIEW ─────────────────┐
│ [Main probability + action]    │
│ [Share Card]                   │
│ [See detailed breakdown] ↓     │
└───────────────────────────────┘

Clicked? Shows:
├─ Detailed cash flow breakdown
├─ Goals progress chart
├─ Recommendations
└─ Add accounts/transactions
```

**Key**: Advanced features expand only if user clicks. Default view = ONE number.

---

## Part 3: Build Sharing Loops (The Growth Driver)

### Psychology: Why Sharing Drives Growth
1. **Percentile triggers ego**: "I'm in the top 68%" 
2. **Comparison drives action**: "My friend has 72%, I have 58%"
3. **Effortless**: 1-click share (native share) or copy link
4. **No friction**: No rewards, no "invite 5 friends" popups
5. **Authentic**: Real financial insight, not gamified points

### Sharing Flow

```
FLOW: User sees probability → Sees share card → Shares link → Friend signs up

Step 1: Calculate Probability
User answers: Income, spending, goal, timeline
↓
System calculates: 62% probability
↓

Step 2: See Percentile Rank
"You're in the top 68% of users"
↓

Step 3: Share Card Appears Below
[Share Results] [Copy Link] [Compare with Friend]
↓

Step 4a: Click "Share Results"
Native share dialog (OS-specific)
─ Mobile: iMessage/Whatsapp share
─ Desktop: Copy to clipboard
─ Text: "I have a 62% chance of hitting my goal using MyFinanceTracker"
↓

Step 4b: Click "Copy Link"
Copies: /auth?ref=USER_CODE&probability=62&goal=down+payment
↓

Step 4c: Click "Compare with Friend"
Modal appears: Enter friend's probability
Shows percentile comparison
↓

Step 5: Friend Receives Link
/compare?probability=62
- Shows their probability
- Shows comparison
- "Calculate your own probability" CTA
- Leads to sign up with referral code

Step 6: Viral Loop
Friend signs up → Sees probability → Shares with 2 more friends
Exponential growth (1 → 2 → 4 → 8...)
```

### Components Involved

**ProbabilityShareCard** (`src/components/ProbabilityShareCard.tsx`)
- Displays probability box
- Percentile rank with description
- Three share buttons
- Comparison modal

```tsx
<ProbabilityShareCard 
  probability={62}
  goalName="Down payment"
  percentile={68}  // Top 68%
  referralCode="abc123xyz"
/>
```

**Percentile System** (`src/lib/percentile.ts`)
- `calculatePercentile(probability)` → 1-99
- `getPercentileDescription(percentile)` → "You're ahead of most people"
- `getSharingMessage(probability, percentile)` → Shareable text

**Compare Page** (`src/pages/Compare.tsx`)
- Shows user's probability vs. friend's
- Displays percentile for both
- Shows difference
- Suggests action to close gap
- CTA: "Calculate your probability"

### Metrics to Track

**Sharing behavior**:
```
dashboard_views → probabilityResult_displayed 
                → shareCard_viewed (100% of users)
                → share_button_clicked (X%)
                → copyLink_clicked (Y%)
                → compareWithFriend_clicked (Z%)
                → comparison_submitted (W%)
                → shared_link_visited (??)
                → signup_via_referral_code (growth)
```

**Viral coefficient** (how many sign up per sharer):
- Goal: >1.5 (each user brings 1.5+ new users via sharing)
- Current baseline: 0 (no sharing yet)
- Target: 0.3-0.5 within 3 months

---

## Implementation Checklist

### ✅ Already Done
- [ ] `ProbabilityShareCard` component created
- [ ] `calculatePercentile()` utility function
- [ ] Dashboard integrates share card
- [ ] Onboarding messaging updated for target audience
- [ ] Landing page refocused on target user
- [ ] Comparison page created (`/compare` route)
- [ ] App routing updated to include Compare
- [ ] Color-coded probability display (already existed)
- [ ] Exact action recommendation (already existed)

### 🔄 In Progress
- [ ] Build/test verification (no errors found)

### ⏳ Next Steps
- [ ] Test sharing flow end-to-end
- [ ] Set up referral tracking in Supabase
- [ ] Create referral_code field in profiles table (if missing)
- [ ] Track share button clicks in analytics
- [ ] A/B test share button copy
- [ ] Monitor viral coefficient
- [ ] Create sharing email template
- [ ] Add share-to-social OG tags for rich preview

### 📊 Advanced (Backlog)
- [ ] Leaderboard: "Top performers by percentile"
- [ ] Milestone celebrations: "You hit 75%!"
- [ ] Friend comparison tracking: "You've compared with X friends"
- [ ] Monthly digest: "Your percentile improved from 42% to 58%"
- [ ] Badges: "Top 10% user" displayed on profile
- [ ] Invite campaign: "3/5 friends have joined"

---

## Measurement: Success Indicators

### Week 1-2: Baseline
- [ ] Landing page CTR to signup
- [ ] Onboarding completion rate
- [ ] Dashboard load time (<3sec)
- [ ] Probability result generation time (<1sec)

### Week 3-4: Sharing Activation
- [ ] % of users reaching share card
- [ ] % clicking share button
- [ ] % copying link
- [ ] % using compare feature
- [ ] Referred signup count

### Month 2: Viral Coefficient
- [ ] Shared link click-through rate
- [ ] Signup rate from referred links
- [ ] Viral coefficient: (new_users_from_sharing / total_users)
- [ ] Repeat share rate: % of users who share multiple times

### Target KPIs
```
Onboarding → Probability result: 95%+ completion
Share card views: 100% (appears for all users with goal)
Share button CTR: 15-25% (1 in 4-6 users share)
Referred conversion: 20-30% (1 in 3-5 link clicks sign up)
Viral coefficient: 0.3+ (sustainable growth)
```

---

## Usage Guide: How to Use These Inputs

### For Product Decision-Making
1. **Feature request comes in**: "Add expense categories"
   - Ask: "Does this help a 28-year-old hit their down payment goal faster?"
   - No → Don't build
   - Yes, but adds complexity → Make optional/hidden

2. **Copy debate**: "Should we say 'probability' or 'likelihood'?"
   - Ask: "Which does our target user use?"
   - Research: Speak to 5 target users
   - Choose based on their language

3. **Design choice**: "Should probability be pie chart or percentage?"
   - Rule: Can user understand in 3 seconds?
   - Pie chart: Harder
   - Large percentage: Better
   - **Choose percentage**

### For Marketing Copy
- **Land on**: "One number in 30 seconds"
- **Avoid**: "Sophisticated portfolio analysis"
- **Target language**: "Certainty," "clarity," "what's my number?"
- **Avoid**: "Quant-backed," "institutional," "advanced"

### For Feature Development
**Green light** 🟢:
- Increases share-ability
- Reduces time to probability
- Makes recommendation clearer
- Helps user hit their specific goal

**Red light** 🔴:
- Adds complexity (hides ONE number)
- Requires more data entry
- Targets different audience
- Requires advanced knowledge

---

## Expected Growth Curve

```
Month 1: Baseline
Users: 100
Probability result generators: 90
Share button clicks: 10 (10%)
Referred signups: 2-3

Month 2: Sharing Loop Activates
Users: 300 (+200%)
Share button clicks: 45-75 (15-25%)
Referred signups: 30-45 (viral coeff: 0.3-0.45)

Month 3: Viral Inflection
Users: 900-1200 (3-4x)
Share button clicks: 135-300 (15-25% of growth)
Network effects kick in
```

**Critical assumption**: Viral coefficient stays >0.2. If <0.2, optimize sharing UX.

---

## Final Reminders

1. **Stay narrowly focused**: Don't add features for anyone outside 22-32 / $60k+ / goal-focused
2. **Measure sharing**: It's your growth engine
3. **Keep the dashboard simple**: One number, one action
4. **Listen to target users**: Not features, but language they use
5. **Optimize for friction**: Each click = 50% drop-off
6. **Ship fast, listen faster**: Test, measure, adjust weekly

---

**Last Updated**: February 26, 2026
**Version**: 1.0
**Status**: Implementation started ✅
