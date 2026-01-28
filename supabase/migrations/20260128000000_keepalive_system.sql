-- ============================================
-- SUPABASE KEEPALIVE SYSTEM
-- ============================================
-- Mantém o projeto ativo com pings automáticos diários
-- Criado: 2026-01-28
-- Projeto: lp-vibeflow (zarigqmtaexgcayzfqpt)
-- 
-- Este sistema evita que o projeto Supabase pause por inatividade
-- no plano gratuito, executando uma query simples diariamente.

-- Tabela para armazenar pings de keepalive
CREATE TABLE IF NOT EXISTS public.keepalive_pings (
  id SERIAL PRIMARY KEY,
  ping_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários para documentação
COMMENT ON TABLE public.keepalive_pings IS 'Registra pings automáticos para manter projeto ativo';
COMMENT ON COLUMN public.keepalive_pings.ping_number IS 'Número sequencial do ping';
COMMENT ON COLUMN public.keepalive_pings.created_at IS 'Timestamp do ping';

-- Habilitar RLS
ALTER TABLE public.keepalive_pings ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública (para verificação via dashboard)
CREATE POLICY "Anyone can view keepalive pings" 
  ON public.keepalive_pings
  FOR SELECT 
  USING (true);

-- Função para inserir ping incremental
CREATE OR REPLACE FUNCTION public.keepalive_ping()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  -- Calcula próximo número sequencial
  SELECT COALESCE(MAX(ping_number), 0) + 1 
  INTO next_number 
  FROM public.keepalive_pings;
  
  -- Insere novo ping
  INSERT INTO public.keepalive_pings (ping_number) 
  VALUES (next_number);
  
  -- Mantém apenas últimos 30 registros para não acumular dados
  DELETE FROM public.keepalive_pings 
  WHERE id NOT IN (
    SELECT id 
    FROM public.keepalive_pings 
    ORDER BY created_at DESC 
    LIMIT 30
  );
  
  -- Log para debugging (opcional)
  RAISE NOTICE 'Keepalive ping #% executado com sucesso', next_number;
END;
$$;

COMMENT ON FUNCTION public.keepalive_ping() IS 'Executa ping de keepalive e limpa registros antigos';

-- Habilitar extensão pg_cron (já vem com Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendar cron job para rodar todo dia às 06:00 UTC (03:00 BRT)
-- Se já existir, remove e recria
SELECT cron.unschedule('keepalive-daily-ping') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'keepalive-daily-ping'
);

SELECT cron.schedule(
  'keepalive-daily-ping',           -- Nome do job
  '0 6 * * *',                       -- Schedule: diário às 06:00 UTC
  'SELECT public.keepalive_ping();'  -- Comando a executar
);

-- Inserir primeiro ping para testar
SELECT public.keepalive_ping();

-- Verificação: mostrar job criado
DO $$
DECLARE
  job_info RECORD;
BEGIN
  SELECT jobid, jobname, schedule, command 
  INTO job_info
  FROM cron.job 
  WHERE jobname = 'keepalive-daily-ping';
  
  IF FOUND THEN
    RAISE NOTICE '✅ Keepalive system instalado com sucesso!';
    RAISE NOTICE 'Job ID: %, Schedule: %', job_info.jobid, job_info.schedule;
  ELSE
    RAISE WARNING '⚠️ Falha ao criar cron job';
  END IF;
END $$;
