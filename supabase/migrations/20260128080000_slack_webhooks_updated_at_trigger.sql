-- Create trigger to automatically update updated_at column on slack_webhooks
-- This trigger uses the existing update_updated_at_column() function

CREATE TRIGGER update_slack_webhooks_updated_at
  BEFORE UPDATE ON public.slack_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment to trigger
COMMENT ON TRIGGER update_slack_webhooks_updated_at ON public.slack_webhooks 
  IS 'Automatically updates the updated_at timestamp when a webhook configuration is modified';
