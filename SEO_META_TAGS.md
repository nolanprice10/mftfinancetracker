# SEO Meta Tags - MyFinanceTracker

This document lists all SEO meta tags configured for each page on the website.

## Installation Required

To enable SEO functionality, install the react-helmet-async package:

```bash
npm install react-helmet-async
```

## Page-by-Page SEO Configuration

### 1. Home Page (/)
- **Title:** Free Investment Calculator & Portfolio Tracker | MyFinanceTracker
- **Description:** Track your wealth with institutional-grade analytics. Free investment calculator, compound interest projections, and portfolio tracking. Quant-backed personal finance made simple.
- **Canonical URL:** https://myfinancetracker.app/

### 2. Authentication (/auth)
- **Title:** Sign In / Sign Up | MyFinanceTracker
- **Description:** Create your free account or sign in to access your MyFinanceTracker dashboard. Start tracking your wealth with institutional-grade analytics today.
- **Canonical URL:** https://myfinancetracker.app/auth

### 3. Dashboard (/dashboard)
- **Title:** Dashboard | MyFinanceTracker
- **Description:** View your financial dashboard with real-time portfolio tracking, goal progress, and institutional-grade analytics. Monitor your wealth at a glance.
- **Canonical URL:** https://myfinancetracker.app/dashboard

### 4. Transactions (/transactions)
- **Title:** Transactions | MyFinanceTracker
- **Description:** Track all your income and expenses with detailed transaction history. Monitor spending patterns and categorize transactions for better financial insights.
- **Canonical URL:** https://myfinancetracker.app/transactions

### 5. Accounts (/accounts)
- **Title:** Accounts | MyFinanceTracker
- **Description:** Manage your financial accounts and track balances across checking, savings, investment, and retirement accounts. Visualize your wealth distribution.
- **Canonical URL:** https://myfinancetracker.app/accounts

### 6. Financial Goals (/goals)
- **Title:** Financial Goals | MyFinanceTracker
- **Description:** Set and track your financial goals with probability-based projections. Monitor progress toward retirement, savings targets, and major purchases.
- **Canonical URL:** https://myfinancetracker.app/goals

### 7. Investments (/investments)
- **Title:** Investment Portfolio | MyFinanceTracker
- **Description:** Track your investment portfolio with institutional-grade analytics. Monitor stocks, bonds, ETFs, and retirement accounts with real-time performance metrics and projections.
- **Canonical URL:** https://myfinancetracker.app/investments

### 8. Recommendations (/recommendations)
- **Title:** Personalized Recommendations | MyFinanceTracker
- **Description:** Get AI-powered financial recommendations based on your portfolio, spending patterns, and goals. Quant-backed insights to optimize your wealth strategy.
- **Canonical URL:** https://myfinancetracker.app/recommendations

### 9. Settings (/settings)
- **Title:** Account Settings | MyFinanceTracker
- **Description:** Manage your MyFinanceTracker account settings, preferences, and security options. Customize your financial tracking experience.
- **Canonical URL:** https://myfinancetracker.app/settings

### 10. Risk Assessment (/risk)
- **Title:** Risk Assessment | MyFinanceTracker
- **Description:** Complete your investment risk profile assessment. Get personalized portfolio recommendations based on your risk tolerance and capacity.
- **Canonical URL:** https://myfinancetracker.app/risk

### 11. 404 Not Found
- **Title:** Page Not Found | MyFinanceTracker
- **Description:** The page you are looking for could not be found. Return to MyFinanceTracker to continue managing your wealth with institutional-grade analytics.
- **Canonical URL:** https://myfinancetracker.app/404

## Default Meta Tags (Applied to All Pages)

All pages include the following default meta tags unless overridden:

- **Keywords:** investment calculator, compound interest calculator, portfolio tracker, personal finance, wealth management, retirement planning, financial goals, quant finance
- **OG Image:** https://storage.googleapis.com/gpt-engineer-file-uploads/d5ueX6bSSFP88pUlY4aTBJeKlXo1/social-images/social-1762136875706-IMG_1359.jpeg
- **OG Site Name:** MyFinanceTracker
- **Twitter Card:** summary_large_image

## Implementation Details

### SEO Component
Created at: `src/components/SEO.tsx`

This component uses react-helmet-async to dynamically set meta tags for each page, including:
- Primary meta tags (title, description)
- Open Graph tags (Facebook)
- Twitter Card tags
- Canonical URLs

### App Wrapper
The App component (`src/App.tsx`) is wrapped with `HelmetProvider` to enable SEO functionality across all pages.

### Usage in Pages
Each page component imports and uses the SEO component:

```tsx
import { SEO } from "@/components/SEO";

// In the component return
<SEO 
  title="Page Title"
  description="Page description"
  canonicalUrl="/page-path"
/>
```

## Benefits

1. **Search Engine Optimization:** Proper meta tags help search engines understand and index your pages
2. **Social Media Sharing:** Open Graph and Twitter Card tags ensure rich previews when shared
3. **Dynamic Updates:** Meta tags update automatically when navigating between pages
4. **Canonical URLs:** Prevents duplicate content issues
5. **Accessibility:** Proper page titles improve navigation for screen readers
