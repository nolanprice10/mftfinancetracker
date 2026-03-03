-- Add email preferences to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS receive_email_updates BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_frequency TEXT DEFAULT 'monthly' CHECK (email_frequency IN ('weekly', 'monthly', 'none'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS monthly_digest_day INTEGER DEFAULT 1 CHECK (monthly_digest_day BETWEEN 1 AND 28);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_email_sent_date TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_unsubscribed_at TIMESTAMPTZ;

-- Create probability_history table to track monthly changes
CREATE TABLE IF NOT EXISTS public.probability_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  probability_value NUMERIC(5,2) NOT NULL CHECK (probability_value BETWEEN 0 AND 100),
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  year_month DATE NOT NULL, -- First day of the month (2024-01-01, 2024-02-01, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, goal_id, year_month)
);

-- Create email_events table for tracking opens, clicks, and sends
CREATE TABLE IF NOT EXISTS public.email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL CHECK (email_type IN ('monthly_digest', 'probability_change', 'actionable_improvement', 'reengagement')),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'opened', 'clicked', 'bounced', 'failed')),
  goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  metadata JSONB, -- Store probability change, recommendation, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.probability_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for probability_history
CREATE POLICY "Users can view own probability history" ON public.probability_history 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert probability history" ON public.probability_history 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS Policies for email_events
CREATE POLICY "Users can view own email events" ON public.email_events 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert email events" ON public.email_events 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_probability_history_user_date ON probability_history(user_id, year_month DESC);
CREATE INDEX IF NOT EXISTS idx_probability_history_goal_date ON probability_history(goal_id, year_month DESC);
CREATE INDEX IF NOT EXISTS idx_email_events_user_sent ON email_events(user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_events_type_status ON email_events(email_type, status);
