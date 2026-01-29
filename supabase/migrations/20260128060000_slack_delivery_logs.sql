-- Create slack_delivery_logs table
CREATE TABLE IF NOT EXISTS public.slack_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.slack_webhooks(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('workflow', 'mcp_server', 'blog_post', 'ide_news')),
  content_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'skipped')),
  response_code INTEGER,
  error_message TEXT,
  attempt_number INTEGER NOT NULL DEFAULT 1 CHECK (attempt_number >= 1 AND attempt_number <= 3),
  payload_size INTEGER NOT NULL CHECK (payload_size >= 0),
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_slack_delivery_logs_webhook_id 
  ON public.slack_delivery_logs(webhook_id);

CREATE INDEX IF NOT EXISTS idx_slack_delivery_logs_delivered_at 
  ON public.slack_delivery_logs(delivered_at DESC);

CREATE INDEX IF NOT EXISTS idx_slack_delivery_logs_status 
  ON public.slack_delivery_logs(status);

CREATE INDEX IF NOT EXISTS idx_slack_delivery_logs_content 
  ON public.slack_delivery_logs(content_type, content_id);

-- Add comment to table
COMMENT ON TABLE public.slack_delivery_logs IS 'Records all Slack webhook delivery attempts for monitoring and debugging';

-- Add comments to columns
COMMENT ON COLUMN public.slack_delivery_logs.webhook_id IS 'Foreign key to slack_webhooks table (CASCADE delete)';
COMMENT ON COLUMN public.slack_delivery_logs.content_type IS 'Type of content being notified: workflow, mcp_server, blog_post, or ide_news';
COMMENT ON COLUMN public.slack_delivery_logs.content_id IS 'UUID of the content item (workflow, MCP server, etc.)';
COMMENT ON COLUMN public.slack_delivery_logs.status IS 'Delivery status: success, failed, or skipped';
COMMENT ON COLUMN public.slack_delivery_logs.response_code IS 'HTTP response code from Slack webhook (null if not sent)';
COMMENT ON COLUMN public.slack_delivery_logs.error_message IS 'Error details if delivery failed (null on success)';
COMMENT ON COLUMN public.slack_delivery_logs.attempt_number IS 'Retry attempt number (1-3)';
COMMENT ON COLUMN public.slack_delivery_logs.payload_size IS 'Size of JSON payload in bytes';
COMMENT ON COLUMN public.slack_delivery_logs.delivered_at IS 'Timestamp of delivery attempt';
