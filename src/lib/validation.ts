import { z } from 'zod';

// Goal validation schema
export const goalSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  target_amount: z.number()
    .positive("Target amount must be positive")
    .max(999999999, "Target amount is too large")
    .refine(val => !isNaN(val), "Invalid target amount"),
  start_date: z.string().refine(val => !isNaN(Date.parse(val)), "Invalid start date"),
  end_date: z.string().refine(val => !isNaN(Date.parse(val)), "Invalid end date"),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional().nullable(),
  account_id: z.string().nullable()
}).refine(data => {
  const start = new Date(data.start_date);
  const end = new Date(data.end_date);
  return end > start;
}, { message: "End date must be after start date", path: ["end_date"] });

// Transaction validation schema
export const transactionSchema = z.object({
  amount: z.number()
    .positive("Amount must be positive")
    .max(999999999, "Amount is too large")
    .refine(val => !isNaN(val), "Invalid amount"),
  type: z.enum(['income', 'expense'], { errorMap: () => ({ message: "Type must be income or expense" }) }),
  category: z.string().trim().min(1, "Category is required").max(100, "Category must be less than 100 characters"),
  date: z.string().refine(val => !isNaN(Date.parse(val)), "Invalid date"),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional().nullable(),
  account_id: z.string().uuid("Invalid account selected")
});

// Investment validation schema
export const investmentSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  type: z.enum(['roth_ira', 'taxable_etf', 'index_fund', 'individual_stock', 'crypto', 'other']),
  current_value: z.number()
    .nonnegative("Current value cannot be negative")
    .max(999999999, "Current value is too large")
    .refine(val => !isNaN(val), "Invalid current value"),
  monthly_contribution: z.number()
    .nonnegative("Monthly contribution cannot be negative")
    .max(999999, "Monthly contribution is too large")
    .optional(),
  annual_return_pct: z.number()
    .min(-100, "Annual return cannot be less than -100%")
    .max(1000, "Annual return is too high")
    .refine(val => !isNaN(val), "Invalid annual return"),
  years_remaining: z.number()
    .positive("Years remaining must be positive")
    .max(100, "Years remaining is too high")
    .refine(val => !isNaN(val), "Invalid years remaining"),
  ticker_symbol: z.string().trim().max(50, "Ticker symbol too long").optional().nullable(),
  shares_owned: z.number().nonnegative("Shares cannot be negative").max(999999999, "Shares too large").optional().nullable(),
  purchase_price_per_share: z.number().nonnegative("Price cannot be negative").max(999999999, "Price too large").optional().nullable()
});

// Account validation schema
export const accountSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  balance: z.number()
    .max(999999999, "Balance is too large")
    .refine(val => !isNaN(val), "Invalid balance"),
  type: z.enum(['checking', 'savings', 'brokerage', 'retirement', 'cash', 'high_yield_savings']),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional().nullable()
});

// Risk profile validation
export const riskProfileSchema = z.object({
  risk_tolerance: z.enum(['conservative', 'moderate', 'aggressive']),
  risk_capacity: z.enum(['low', 'medium', 'high']),
  recommended_profile: z.enum(['conservative', 'moderate', 'aggressive']),
  quiz_responses: z.record(z.number())
});
