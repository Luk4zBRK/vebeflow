-- Migration: IDE News Caching System
-- Description: Sistema de cache automático para novidades de IDEs
-- Author: Vibe Flow Team
-- Date: 2026-01-28

-- Habilitar extensão pg_cron se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Tabela para armazenar novidades das IDEs
CREATE TABLE IF NOT EXISTS public.ide_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  resumo TEXT,
  link TEXT NOT NULL,
  fonte TEXT NOT NULL,
  cor TEXT,
  logo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_ide_news_fonte ON public.ide_news(fonte);
CREATE INDEX IF NOT EXISTS idx_ide_news_created_at ON public.ide_news(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.ide_news ENABLE ROW LEVEL SECURITY;

-- Policy: Qualquer pessoa pode ler as novidades (público)
CREATE POLICY "Permitir leitura pública de novidades"
  ON public.ide_news
  FOR SELECT
  USING (true);

-- Policy: Apenas service_role pode inserir/atualizar (via Edge Function)
CREATE POLICY "Permitir inserção via service_role"
  ON public.ide_news
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role' OR auth.uid() IS NOT NULL);

CREATE POLICY "Permitir atualização via service_role"
  ON public.ide_news
  FOR UPDATE
  USING (auth.role() = 'service_role' OR auth.uid() IS NOT NULL);

CREATE POLICY "Permitir exclusão via service_role"
  ON public.ide_news
  FOR DELETE
  USING (auth.role() = 'service_role' OR auth.uid() IS NOT NULL);

-- Função para limpar novidades antigas (manter apenas últimas 100)
CREATE OR REPLACE FUNCTION public.cleanup_old_ide_news()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.ide_news
  WHERE id NOT IN (
    SELECT id
    FROM public.ide_news
    ORDER BY created_at DESC
    LIMIT 100
  );
END;
$$;

-- Tabela para log de atualizações
CREATE TABLE IF NOT EXISTS public.ide_news_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_started_at TIMESTAMPTZ DEFAULT NOW(),
  sync_completed_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('running', 'success', 'error')),
  items_fetched INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para log
CREATE INDEX IF NOT EXISTS idx_ide_news_sync_log_created_at 
  ON public.ide_news_sync_log(created_at DESC);

-- Habilitar RLS no log
ALTER TABLE public.ide_news_sync_log ENABLE ROW LEVEL SECURITY;

-- Policy: Leitura pública do log (para debug)
CREATE POLICY "Permitir leitura pública do log"
  ON public.ide_news_sync_log
  FOR SELECT
  USING (true);

-- Policy: Apenas service_role pode inserir no log
CREATE POLICY "Permitir inserção no log via service_role"
  ON public.ide_news_sync_log
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role' OR auth.uid() IS NOT NULL);

CREATE POLICY "Permitir atualização no log via service_role"
  ON public.ide_news_sync_log
  FOR UPDATE
  USING (auth.role() = 'service_role' OR auth.uid() IS NOT NULL);

-- Função para limpar logs antigos (manter apenas últimos 30 dias)
CREATE OR REPLACE FUNCTION public.cleanup_old_sync_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.ide_news_sync_log
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Agendar job diário às 00:00 UTC para sincronizar novidades
-- NOTA: O job chama uma Edge Function que faz o fetch das novidades
SELECT cron.schedule(
  'sync-ide-news-daily',
  '0 0 * * *', -- Todo dia às 00:00 UTC
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/sync-ide-news',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- Comentários para documentação
COMMENT ON TABLE public.ide_news IS 'Cache de novidades das IDEs, atualizado diariamente às 00:00 UTC';
COMMENT ON TABLE public.ide_news_sync_log IS 'Log de sincronizações das novidades das IDEs';
COMMENT ON FUNCTION public.cleanup_old_ide_news() IS 'Remove novidades antigas, mantendo apenas as últimas 100';
COMMENT ON FUNCTION public.cleanup_old_sync_logs() IS 'Remove logs de sincronização com mais de 30 dias';
