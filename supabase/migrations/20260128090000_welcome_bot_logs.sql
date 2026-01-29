-- Create welcome_bot_logs table for tracking welcome message deliveries
-- This is separate from slack_delivery_logs because welcome bot uses bot token
-- instead of webhooks, so it doesn't have a webhook_id

CREATE TABLE IF NOT EXISTS public.welcome_bot_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  error_message TEXT,
  payload_size INTEGER NOT NULL DEFAULT 0 CHECK (payload_size >= 0),
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_welcome_bot_logs_user_id 
  ON public.welcome_bot_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_welcome_bot_logs_delivered_at 
  ON public.welcome_bot_logs(delivered_at DESC);

CREATE INDEX IF NOT EXISTS idx_welcome_bot_logs_status 
  ON public.welcome_bot_logs(status);

-- Add comment to table
COMMENT ON TABLE public.welcome_bot_logs IS 'Records all welcome message delivery attempts for new Slack workspace members';

-- Add comments to columns
COMMENT ON COLUMN public.welcome_bot_logs.user_id IS 'Slack user ID of the new member';
COMMENT ON COLUMN public.welcome_bot_logs.user_name IS 'Display name of the new member';
COMMENT ON COLUMN public.welcome_bot_logs.status IS 'Delivery status: success or failed';
COMMENT ON COLUMN public.welcome_bot_logs.error_message IS 'Error details if delivery failed (null on success)';
COMMENT ON COLUMN public.welcome_bot_logs.payload_size IS 'Size of JSON payload in bytes';
COMMENT ON COLUMN public.welcome_bot_logs.delivered_at IS 'Timestamp of delivery attempt';
