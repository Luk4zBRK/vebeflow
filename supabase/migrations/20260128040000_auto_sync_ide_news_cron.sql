-- Habilitar extensão pg_net se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Criar função que será chamada pelo cron
CREATE OR REPLACE FUNCTION trigger_auto_sync_ide_news()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_role_key text;
BEGIN
  -- Buscar service role key das configurações do Supabase
  -- Nota: Em produção, isso deve ser configurado via Supabase Dashboard
  service_role_key := current_setting('app.settings.service_role_key', true);
  
  -- Se não encontrar a key, usar a variável de ambiente
  IF service_role_key IS NULL THEN
    service_role_key := current_setting('supabase.service_role_key', true);
  END IF;

  -- Fazer requisição HTTP para a Edge Function
  PERFORM net.http_post(
    url := 'https://zarigqmtaexgcayzfqpt.supabase.co/functions/v1/auto-sync-ide-news',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(service_role_key, '')
    ),
    body := '{}'::jsonb
  );
  
  RAISE NOTICE 'Auto-sync IDE news triggered successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error triggering auto-sync: %', SQLERRM;
END;
$$;

-- Criar cron job para sincronização automática diária de IDE news
-- Roda todos os dias às 08:00 UTC (05:00 BRT)
SELECT cron.schedule(
  'auto-sync-ide-news-daily',
  '0 8 * * *', -- Todos os dias às 08:00 UTC
  'SELECT trigger_auto_sync_ide_news();'
);

-- Comentário explicativo
COMMENT ON FUNCTION trigger_auto_sync_ide_news() IS 'Função que dispara a sincronização automática de IDE news via Edge Function';
COMMENT ON EXTENSION pg_cron IS 'Cron job para sincronização automática de IDE news às 08:00 UTC diariamente';
