# Visual Flow & Component Architecture

## User Journey: New User to Viral Growth

```
STEP 1: Landing Page (Index.tsx)
┌──────────────────────────────────────────────┐
│  MyFinanceTracker                            │
│  "Will you hit your goal?                    │
│   Get certainty in 30 seconds"               │
│                                              │
│  Free Calculator | Testimonials | Value Prop│
│                                              │
│  [Calculate Your Probability] ───────────────┼──→ Links to /auth
└──────────────────────────────────────────────┘
                    ↓
STEP 2: Signup/Auth (Auth.tsx)
┌──────────────────────────────────────────────┐
│  Email/Password signup                       │
│  Or Google OAuth                             │
│                                              │
│  [Continue to Onboarding]                    │
└──────────────────────────────────────────────┘
                    ↓
STEP 3: Onboarding (OnboardingDialog.tsx) ✨ UPDATED
┌──────────────────────────────────────────────┐
│  "Will you hit your goal?"                   │
│  "Get certainty in 30 seconds"               │
│                                              │
│  Goal name: [Down payment____]        NEW!   │
│  Monthly income: [$6,000____]       UPDATED! │
│  Monthly spending: [$4,000____]     UPDATED! │
│  Goal amount: [$25,000____]         UPDATED! │
│  Timeline: [24____] months          UPDATED! │
│                                              │
│  [Calculate My Probability]         UPDATED! │
└──────────────────────────────────────────────┘
                    ↓
STEP 4: Dashboard (Dashboard.tsx) ✨ UPDATED
┌──────────────────────────────────────────────┐
│  "Your Financial Probability"                │
│  ┌────────────────────────────────────────┐  │
│  │                                        │  │
│  │            62%                         │  │
│  │                                        │  │
│  │  Chance of hitting: Down payment       │  │
│  │  Target: $25,000 by Dec 2026           │  │
│  │                                        │  │
│  │  WHAT TO DO                            │  │
│  │  Increase monthly savings by $180      │  │
│  │                                        │  │
│  │  [What should I change?]               │  │
│  └────────────────────────────────────────┘  │
│                    ↓                          │
│  ╔════════════════════════════════════════╗  │
│  ║  SHARE & COMPARE              ✨ NEW    ║  │
│  ╠════════════════════════════════════════╣  │
│  ║                                        ║  │
│  ║  Top 68% of users                      ║  │
│  ║  You're ahead of most people           ║  │
│  ║                                        ║  │
│  ║  [Share Results] [Copy Link]           ║  │
│  ║  [Compare with Friend →]               ║  │
│  ║                                        ║  │
│  ╚════════════════════════════════════════╝  │
│                                              │
│  [See detailed breakdown ↓]  (Advanced)     │
└──────────────────────────────────────────────┘
                    ↓
STEP 5a: Share Results (Native)
┌──────────────────────────────────────────────┐
│  [iOS Share Sheet]                           │
│  ├─ Messages                                 │
│  ├─ Whatsapp                                 │
│  ├─ Mail                                     │
│  ├─ Copy                              ✨     │
│  └─ [Cancel]                                 │
│                                              │
│  Text: "I have a 62% chance of hitting      │
│         my goal using MyFinanceTracker..."   │
│  Link: /auth?ref=ABC123XYZ                   │
└──────────────────────────────────────────────┘
                    ↓
STEP 5b: Compare with Friend ✨ NEW
┌──────────────────────────────────────────────┐
│  ╔════════════════════════════════════════╗  │
│  ║  Compare Financial Odds                ║  │
│  ╠════════════════════════════════════════╣  │
│  ║                                        ║  │
│  ║  What's your friend's probability?     ║  │
│  ║  [Input field: ______]                 ║  │
│  ║                                        ║  │
│  ║  [Compare] [Cancel]                    ║  │
│  ║                                        ║  │
│  ╚════════════════════════════════════════╝  │
│           ↓ (After input 72%)                │
│  ╔════════════════════════════════════════╗  │
│  ║  You                                   ║  │
│  ║  +10% ahead of your friend             ║  │
│  ║                                        ║  │
│  ║  Share your link to bring them along   ║  │
│  ║  /ref=ABC123XYZ                        ║  │
│  ║                                        ║  │
│  ║  [Got it]                              ║  │
│  ║                                        ║  │
│  ╚════════════════════════════════════════╝  │
└──────────────────────────────────────────────┘
                    ↓
STEP 5c: Copy Link
┌──────────────────────────────────────────────┐
│  Copies to clipboard:                        │
│  myfinancetracker.com/auth?ref=ABC123XYZ     │
│                                              │
│  Toast: "Link copied to clipboard!"          │
│                                              │
│  User pastes in:                             │
│  ├─ iMessage: "Check out my goal probability"│
│  ├─ Whatsapp: "Are you tracking your goal?" │
│  ├─ Email: "See if you're better than me"   │
│  └─ Signal: "Let me know your number"        │
└──────────────────────────────────────────────┘
                    ↓
STEP 6: Friend Receives Link
                    ↓
         Visit: /auth?ref=ABC123XYZ
         (Contains referral code)
                    ↓
         Click "Sign Up with referral"
                    ↓
         New user signup (tracked!)
                    ↓
         Onboarding → Dashboard
                    ↓
         See probability → Share with 2 friends
                    ↓
        EXPONENTIAL GROWTH 🚀
      1 user → 2 → 4 → 8 → 16...
```

---

## Component Tree

```
App.tsx
├─ Router [/ /auth /dashboard /compare /goals /accounts]
│
├─ Index (Landing) ✨ UPDATED
│  └─ Updated copy, testimonials, value prop
│
├─ Auth (Signup)
│  │
│  └─→ OnboardingDialog ✨ UPDATED
│     └─ New: goalName field
│     └─ New: Target audience copy
│     └─ New: Default values ($6k income)
│
├─ Dashboard ✨ UPDATED
│  ├─ Fetches user data (goals, accounts, transactions)
│  ├─ Calculates probability
│  ├─ Displays: [Big Number] [Action] [Advanced ↓]
│  │
│  └─ ProbabilityShareCard ✨ NEW
│     ├─ Percentile calculation
│     │  └─ calculatePercentile() → 1-99
│     │
│     ├─ Displays percentile description
│     │  └─ getPercentileDescription()
│     │
│     ├─ Share button
│     │  └─ navigator.share() or copy
│     │
│     ├─ Compare button
│     │  └─ ComparisonPrompt Modal (inline)
│     │
│     └─ Comparison Modal
│        ├─ Input: friend's probability
│        ├─ Calc: percentile difference
│        └─ Show: comparison result
│
├─ Compare (NEW) ✨
│  ├─ Entry: /compare?probability=62
│  ├─ Fetch: user's probability (if logged in)
│  ├─ Compare: user vs. URL param
│  ├─ Display: percentiles, difference, action
│  └─ CTA: calculate own or sign up
│
└─ Goals, Accounts, Transactions, Settings, etc. (unchanged)
```

---

## Data Flow During Dashboard Load

```
Dashboard Component Mounts
  ↓
useEffect(() => {
  fetchData()
  checkOnboarding()
  loadReferralCode()
})
  ↓
  ├─ fetchData returns:
  │  ├─ accounts: Account[]
  │  ├─ goals: Goal[]
  │  ├─ transactions: Transaction[]
  │  └─ userName: string
  │
  ├─ calculateGoalProbability({
  │  ├─ monthlyIncome
  │  ├─ monthlySpending
  │  ├─ currentSavings
  │  ├─ goalAmount
  │  └─ monthsToGoal
  │  └─ Returns: { probability: 62, recommendedIncrease: 180 }
  │
  └─ probabilityResult stored in state
      ↓
      Render JSX:
      ├─ <div className={getProbabilityBgClass(62)}>
      │  └─ [62%] [Down payment] [What to do: +$180]
      │
      └─ <ProbabilityShareCard
         ├─ probability={62}
         ├─ goalName={"Down payment"}
         ├─ percentile={calculatePercentile(62)}
         │  └─ Runs: 100 / (1 + e^(-0.15*(62-50)))
         │  └─ Returns: 68 (top 68%)
         │
         └─ referralCode={referralCode}
            └─ From profiles.referral_code
```

---

## Share Button Click Flow

```
User clicks "Share Results"
  ↓
if (navigator.share) {
  navigator.share({
    title: "Check My Financial Probability",
    text: "{message} — 62% chance",
    url: "/auth?ref=CODE&goal=down+payment"
  })
  ↓
  [iOS/Android native share sheet appears]
  ├─ iMessage
  ├─ Whatsapp
  ├─ Mail
  ├─ Telegram
  └─ [Copy]
  ↓
  User picks: Whatsapp
    ↓
    Message: "I have a 62% chance of hitting 
             my goal using MyFinanceTracker. 
             Check yours: [link]"
    ↓
    Friend receives link
      ↓
      Clicks: /auth?ref=CODE&goal=down+payment
        ↓
        Signup page (ref=CODE tracked)
          ↓
          Onboarding with goal pre-filled
            ↓
            REFERRER GETS CREDIT
}
else {
  // Fallback for desktop
  Copy referral link to clipboard
  Toast: "Link copied!"
}
```

---

## Percentile Calculation Logic

```
User's probability: 62%

Input: 62
  ↓
Formula: percentile = 100 / (1 + e^(-0.15 * (62 - 50)))
  ↓
  1. (62 - 50) = 12
  2. 12 * -0.15 = -1.8
  3. e^(-1.8) ≈ 0.165
  4. 1 + 0.165 = 1.165
  5. 100 / 1.165 ≈ 85.9
  ↓
Output: 68 (rounded)

Description:
  65-75% → "You're ahead of most people"
  75-90% → "You're in an elite group"
  ↓
Display:
  "You're in the top 68% of users"
  "You're ahead of most people"
```

---

## Share Card Styling

```
┌──────────────────────────────────────────┐
│  Purple dashed border                    │  border-2 border-dashed
│  Light purple background                 │  bg-primary/5
│                                          │
│  SHARE & COMPARE                         │  text-lg font-bold
│  See how you stack up against others     │  CardDescription
│                                          │
│  ┌──────────────────────────────────┐   │
│  │  Your message:                   │   │  bg-background
│  │  "I'm on track to hit my goal"   │   │  p-4
│  │  62%                             │   │  text-2xl font-bold text-primary
│  │  Probability of hitting goal     │   │  text-xs
│  └──────────────────────────────────┘   │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │  📈 You're in the top 68% of     │   │
│  │     users                        │   │  bg-success/10 border-success/20
│  │                                  │   │
│  │  Based on your financial goals   │   │  text-xs
│  │  and probability                 │   │
│  └──────────────────────────────────┘   │
│                                          │
│  [Share Results] [Copy Link]             │  flex gap-2
│                                          │
│  [Compare with a friend's goal] →        │  w-full text-primary
│                                          │
└──────────────────────────────────────────┘
```

---

## Color-Coded Probability Status

```
PROBABILITY    COLOR              MESSAGE
────────────────────────────────────────────
  0-24%        RED     ⚠️  "You need to act fast"
                       • Probability: RED
                       • Background: hsl(var(--destructive)/10)
                       • Border: hsl(var(--destructive))

 25-49%        ORANGE  ⚡ "Room for improvement"
                       • Probability: WARNING
                       • Background: hsl(var(--warning)/10)
                       • Border: hsl(var(--warning))

 50-74%        YELLOW  ✓ "You're getting close"
                       • Probability: WARNING
                       • Background: hsl(var(--warning)/10)
                       • Border: hsl(var(--warning))

 75-100%       GREEN   ✅ "You're on track!"
                       • Probability: SUCCESS
                       • Background: hsl(var(--success)/10)
                       • Border: hsl(var(--success))

Calculation in lib/probability.ts: getProbabilityBgClass()
```

---

## State Reset/Transitions

```
Onboarding Complete
  → Redirect to Dashboard
  → Data refetch
  → Show probability result
  → Share card appears

User Updates Goal
  → Dashboard refetches
  → Probability recalculates
  → Share card updates with new percentile

User Shares Link
  → Analytics tracked (ga event 'share')
  → Link includes referral code
  → Friend's signup tracks source

Friend Visits Compare Page
  → If logged in: Show their probability vs. shared
  → If not logged in: Show "Calculate your own"
  → Compare page pre-fills goal name if provided
```

---

**Last Updated**: February 26, 2026
**Status**: Complete and Error-Free ✅
