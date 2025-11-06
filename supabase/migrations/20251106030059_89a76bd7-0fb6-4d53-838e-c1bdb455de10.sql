-- Add crypto to investment type enum
ALTER TYPE public.investment_type ADD VALUE IF NOT EXISTS 'crypto';
