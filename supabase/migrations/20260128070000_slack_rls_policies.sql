-- Enable Row Level Security on slack_webhooks table
ALTER TABLE public.slack_webhooks ENABLE ROW LEVEL SECURITY;

-- Enable Row Level Security on slack_delivery_logs table
ALTER TABLE public.slack_delivery_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can manage slack_webhooks (all operations)
CREATE POLICY "Admins can manage slack webhooks"
  ON public.slack_webhooks
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policy: Only admins can view slack_delivery_logs (SELECT only)
CREATE POLICY "Admins can view delivery logs"
  ON public.slack_delivery_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Add comments to policies
COMMENT ON POLICY "Admins can manage slack webhooks" ON public.slack_webhooks IS 
  'Restricts all operations on slack_webhooks to users with admin role';

COMMENT ON POLICY "Admins can view delivery logs" ON public.slack_delivery_logs IS 
  'Restricts SELECT operations on slack_delivery_logs to users with admin role';
