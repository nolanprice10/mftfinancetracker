# MyFinanceTracker

A comprehensive personal finance platform with professional-grade analytics and projections. Originally built with [Lovable](https://lovable.dev).

## ✨ Key Features

**💰 Account Management** - Track checking, savings, brokerage, retirement accounts, and cash. Transfer funds between accounts seamlessly.

**📊 Investment Tracking** - Real-time stock/crypto prices with live 30-day charts. Add funds to investments directly from your accounts.

**💵 Transactions & Goals** - Log income/expenses and track progress towards financial goals.

**📈 Portfolio Analytics** - Comprehensive risk analysis including diversification scores, concentration risk, Sharpe ratios, and expected performance metrics.

**🔐 Secure** - Built on Supabase with row-level security and user authentication.

## 🧮 Advanced Mathematics & Statistics

### Monte Carlo Simulation
- **10,000 simulations** per investment using **Geometric Brownian Motion** (GBM)
- Returns median (50th percentile) for realistic projections
- Formula: `S(t+dt) = S(t) × exp((μ - σ²/2)×dt + σ×√dt×z)`

### Statistical Methods
- **Log Returns**: `ln(P(t) / P(t-1))` for accurate compounding
- **Continuous Compounding**: `μ = ln(1 + return)` with variance drag adjustment
- **Volatility Scaling**: Annualized using `√252` (trading days)
- **Unbiased Estimators**: Bessel's correction (n-1) for sample variance

### Asset-Specific Parameters
Each investment uses its own historical data:
- **Stocks**: 10.26% return, 18.42% volatility (S&P 500 1926-2023)
- **Crypto**: 47.5% return, 73.2% volatility (Bitcoin 2015-2023)
- **Index Funds**: 10.15% return, 15.8% volatility
- **Savings**: 4.25% APY, 0.3% volatility

## 🛠️ Tech Stack

React • TypeScript • Vite • Tailwind CSS • Supabase • Recharts

Live data from Yahoo Finance & CoinGecko APIs

## 🚀 Quick Start

```bash
npm install
# Add Supabase credentials to .env
npm run dev
```

---

Built with ❤️ using institutional-grade financial modeling techniques.
