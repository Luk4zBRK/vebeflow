# Supabase Keepalive System

> Sistema automático para manter o projeto Supabase ativo e evitar pausas por inatividade no plano gratuito.

## Problema

Projetos Supabase no plano gratuito pausam automaticamente após 7 dias de inatividade, causando:
- Indisponibilidade do banco de dados
- Falha na autenticação
- Frontend sem acesso ao backend
- Necessidade de reativação manual

## Solução

Sistema de keepalive usando `pg_cron` que executa queries automáticas diariamente para manter o projeto ativo.

## Informações do Projeto

- **Nome**: lp-vibeflow
- **Project ID**: zarigqmtaexgcayzfqpt
- **Região**: us-east-2
- **PostgreSQL**: 17.6.1.005
- **URL**: https://zarigqmtaexgcayzfqpt.supabase.co

## Implementação

### Passo 1: Verificar Status do Projeto

```bash
# Via MCP Supabase
mcp_supabase_mcp_server_get_project
project_id: zarigqmtaexgcayzfqpt
```

### Passo 2: Aplicar Migração Keepalive

Crie a migração com o seguinte SQL:

```sql
-- ============================================
-- SUPABASE KEEPALIVE SYSTEM
-- ============================================
-- Mantém o projeto ativo com pings automáticos diários
-- Criado: 2026-01-28
-- Projeto: lp-vibeflow (zarigqmtaexgcayzfqpt)

-- Tabela para armazenar pings de keepalive
CREATE TABLE IF NOT EXISTS public.keepalive_pings (
  id SERIAL PRIMARY KEY,
  ping_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.keepalive_pings ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública (para verificação)
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
  -- Calcula próximo número
  SELECT COALESCE(MAX(ping_number), 0) + 1 
  INTO next_number 
  FROM public.keepalive_pings;
  
  -- Insere novo ping
  INSERT INTO public.keepalive_pings (ping_number) 
  VALUES (next_number);
  
  -- Mantém apenas últimos 30 registros
  DELETE FROM public.keepalive_pings 
  WHERE id NOT IN (
    SELECT id 
    FROM public.keepalive_pings 
    ORDER BY created_at DESC 
    LIMIT 30
  );
END;
$$;

-- Habilitar extensão pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendar cron job para rodar todo dia às 06:00 UTC (03:00 BRT)
SELECT cron.schedule(
  'keepalive-daily-ping',
  '0 6 * * *',
  'SELECT public.keepalive_ping();'
);
```

### Passo 3: Aplicar via MCP

```typescript
// Via MCP Supabase
mcp_supabase_mcp_server_apply_migration({
  project_id: "zarigqmtaexgcayzfqpt",
  name: "create_keepalive_system",
  query: [SQL_ACIMA]
});
```

### Passo 4: Verificar Instalação

```sql
-- Verificar cron job criado
SELECT jobid, jobname, schedule, command 
FROM cron.job;

-- Resultado esperado:
-- jobid: 1
-- jobname: keepalive-daily-ping
-- schedule: 0 6 * * *
-- command: SELECT public.keepalive_ping();
```

### Passo 5: Testar Manualmente

```sql
-- Executar ping de teste
SELECT public.keepalive_ping();

-- Verificar registro criado
SELECT * FROM public.keepalive_pings 
ORDER BY created_at DESC 
LIMIT 5;
```

## Monitoramento

### Verificar Última Execução

```sql
-- Ver histórico de execuções do cron
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details 
WHERE jobid = 1 
ORDER BY start_time DESC 
LIMIT 10;
```

### Verificar Pings Recentes

```sql
-- Ver últimos pings registrados
SELECT 
  id,
  ping_number,
  created_at,
  NOW() - created_at as time_ago
FROM public.keepalive_pings 
ORDER BY created_at DESC 
LIMIT 10;
```

### Dashboard Supabase

Acesse: https://app.supabase.com/project/zarigqmtaexgcayzfqpt

- **Database > Cron Jobs**: Ver jobs agendados
- **Database > Tables**: Ver tabela keepalive_pings
- **Logs**: Monitorar execuções

## Manutenção

### Alterar Horário do Cron

```sql
-- Remover job atual
SELECT cron.unschedule('keepalive-daily-ping');

-- Criar com novo horário (exemplo: 12:00 UTC)
SELECT cron.schedule(
  'keepalive-daily-ping',
  '0 12 * * *',
  'SELECT public.keepalive_ping();'
);
```

### Executar Ping Manual

```sql
-- Útil para testar ou forçar atividade
SELECT public.keepalive_ping();
```

### Limpar Histórico Antigo

```sql
-- Manter apenas últimos 10 registros
DELETE FROM public.keepalive_pings 
WHERE id NOT IN (
  SELECT id 
  FROM public.keepalive_pings 
  ORDER BY created_at DESC 
  LIMIT 10
);
```

### Desabilitar Temporariamente

```sql
-- Pausar cron job
SELECT cron.unschedule('keepalive-daily-ping');

-- Reativar depois
SELECT cron.schedule(
  'keepalive-daily-ping',
  '0 6 * * *',
  'SELECT public.keepalive_ping();'
);
```

### Remover Sistema Completamente

```sql
-- Remover cron job
SELECT cron.unschedule('keepalive-daily-ping');

-- Remover função
DROP FUNCTION IF EXISTS public.keepalive_ping();

-- Remover tabela
DROP TABLE IF EXISTS public.keepalive_pings;
```

## Configuração do Cron

### Formato do Schedule

```
┌───────────── minuto (0 - 59)
│ ┌───────────── hora (0 - 23)
│ │ ┌───────────── dia do mês (1 - 31)
│ │ │ ┌───────────── mês (1 - 12)
│ │ │ │ ┌───────────── dia da semana (0 - 6) (0 = domingo)
│ │ │ │ │
│ │ │ │ │
* * * * *
```

### Exemplos de Schedules

```sql
-- Todo dia às 06:00 UTC (padrão)
'0 6 * * *'

-- Todo dia às 12:00 UTC
'0 12 * * *'

-- A cada 12 horas
'0 */12 * * *'

-- A cada 6 horas
'0 */6 * * *'

-- Segunda a sexta às 09:00 UTC
'0 9 * * 1-5'

-- Primeiro dia do mês às 00:00 UTC
'0 0 1 * *'
```

## Troubleshooting

### Cron não está executando

1. Verificar se extensão está habilitada:
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

2. Verificar se job existe:
```sql
SELECT * FROM cron.job;
```

3. Verificar logs de erro:
```sql
SELECT * FROM cron.job_run_details 
WHERE status = 'failed' 
ORDER BY start_time DESC;
```

### Projeto ainda pausou

- Verifique se o cron está executando (job_run_details)
- Confirme que pings estão sendo registrados
- Considere aumentar frequência (a cada 12h ou 6h)
- Verifique se não há erros na função keepalive_ping

### Tabela crescendo muito

- Sistema já limita a 30 registros automaticamente
- Se necessário, ajuste o LIMIT na função keepalive_ping
- Execute limpeza manual se necessário

## Notas Importantes

- ⏰ **Horário**: Cron roda às 06:00 UTC (03:00 horário de Brasília)
- 📊 **Retenção**: Mantém apenas últimos 30 registros
- 🔒 **Segurança**: RLS habilitado, apenas leitura pública
- 🔄 **Automático**: Não requer intervenção manual
- 💰 **Custo**: Zero - usa recursos incluídos no plano gratuito
- 📈 **Impacto**: Mínimo - uma query simples por dia

## Alternativas

Se o keepalive não for suficiente:

1. **Upgrade para plano pago** - Projetos não pausam automaticamente
2. **Cron externo** - GitHub Actions ou serviço externo fazendo requests
3. **Webhook periódico** - n8n ou Zapier chamando API
4. **Frontend ping** - App fazendo request ao carregar (menos confiável)

## Referências

- [Supabase pg_cron Extension](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [PostgreSQL Cron Syntax](https://crontab.guru/)
- [Supabase Pricing](https://supabase.com/pricing)
- [Project Pausing Policy](https://supabase.com/docs/guides/platform/going-into-prod#pausing-projects)

## Histórico

- **2026-01-28**: Sistema criado para projeto lp-vibeflow
- **Schedule**: Diário às 06:00 UTC
- **Retenção**: 30 registros
