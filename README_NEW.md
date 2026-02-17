# MyFinanceTracker

**Answer one question in 10 seconds: "Am I on track financially?"**

A personal finance app that shows you the probability of hitting your financial goals using Monte Carlo simulations. No confusion, no complexity - just clear decisions.

**🌐 [Live Demo](https://nolanprice10.github.io/mftfinancetracker/) —** Experience the app right now with instant access.

---

## 🎯 What Makes This Different

**Most finance apps show data. This shows decisions.**

- **ONE clear outcome**: "You have a 42% chance of hitting your goal"
- **ONE actionable lever**: "Increase monthly savings by $180 to reach 75%"
- **10-second setup**: Income, spending, one goal. Done.

## 📸 Quick Demo

Experience the 10-second setup in action:

### Dashboard Overview
![MyFinanceTracker Dashboard](https://via.placeholder.com/1200x600?text=Dashboard+Screenshot+-+Probability+Engine)

*Main dashboard showing probability engine, goal tracking, and smart recommendations*

### Quick Setup Flow
![10-Second Setup](https://via.placeholder.com/1200x600?text=Setup+Flow+-+Enter+Income,+Spending,+Goal)

*Set up your financial profile in seconds: income, expenses, and goals*

### Demo Video: 30-Second Setup Walkthrough
[![Watch Demo Video](https://via.placeholder.com/1200x600?text=Play+Demo+Video+-+30+Seconds)](https://via.placeholder.com/video)

*See how simple it is to get started and understand your financial trajectory*

---

## ✨ Key Features

**🎲 Probability Engine** — Monte Carlo simulation (1,000 iterations) with income/expense variance modeling. Shows realistic success probability, not false hope.

**📊 Goal Tracking** — Set financial goals and see exact monthly savings needed to hit target probability.

**💰 Account Management** — Track checking, savings, investment accounts. Automatic balance sync.

**📈 Smart Recommendations** — Clear, actionable steps to improve your financial trajectory.

**🔐 Secure** — Built on Supabase with row-level security and user authentication.

## 🧮 The Math

### Probability Calculation
- **1,000 Monte Carlo simulations** per goal
- **10% variance** on income and spending (realistic fluctuation)
- **15% safety margin** in recommendations
- Color-coded results:
  - 🔴 Red (< 50%): High risk
  - 🟡 Yellow (50-70%): On track with caution
  - 🟢 Green (> 70%): Strong trajectory

### Why This Matters
Simple projections assume perfect consistency. Real life has variance:
- Some months you spend more
- Some months you earn less
- Emergencies happen

Our simulation models this reality and shows your true probability.

## 🚀 Quick Start

```bash
npm install
# Add Supabase credentials to .env
npm run dev
```

**First-time setup takes 10 seconds:**
1. Monthly income: `$5,000`
2. Monthly spending: `$3,500`
3. Goal: `$10,000 in 12 months`

Instantly see your probability and what to change.

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: TanStack React Query
- **Deployment**: GitHub Pages

## 📋 Strategy

See [EXECUTION_STRATEGY.md](EXECUTION_STRATEGY.md) for complete product, distribution, and growth plan.

---

Built with ❤️ using institutional-grade financial modeling techniques.
