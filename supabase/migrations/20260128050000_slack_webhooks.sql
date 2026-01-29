-- Enable pgcrypto extension for encryption (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create slack_webhooks table
CREATE TABLE IF NOT EXISTS public.slack_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('workflow', 'mcp_server', 'blog_post', 'ide_news')),
  webhook_url TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_content_type_channel UNIQUE (content_type, channel_name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_slack_webhooks_content_type 
  ON public.slack_webhooks(content_type) 
  WHERE is_enabled = true;

CREATE INDEX IF NOT EXISTS idx_slack_webhooks_is_enabled 
  ON public.slack_webhooks(is_enabled);

-- Add comment to table
COMMENT ON TABLE public.slack_webhooks IS 'Stores Slack webhook configurations for different content types';

-- Add comments to columns
COMMENT ON COLUMN public.slack_webhooks.content_type IS 'Type of content: workflow, mcp_server, blog_post, or ide_news';
COMMENT ON COLUMN public.slack_webhooks.webhook_url IS 'Slack webhook URL (will be encrypted)';
COMMENT ON COLUMN public.slack_webhooks.channel_name IS 'Target Slack channel name (e.g., #anuncios)';
COMMENT ON COLUMN public.slack_webhooks.is_enabled IS 'Whether this webhook is active (used for soft delete)';
