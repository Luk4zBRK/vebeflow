# Sistema de Sincronização Automática de IDE News

## Visão Geral

Sistema automatizado que busca e sincroniza diariamente novidades das principais IDEs (VS Code, Cursor, Windsurf, JetBrains) sem duplicar conteúdo.

## Arquitetura

### Edge Function: `auto-sync-ide-news`

**Localização**: `supabase/functions/auto-sync-ide-news/index.ts`

**Funcionalidades**:
- Busca novidades de múltiplas fontes RSS/APIs
- Verifica duplicatas antes de inserir
- Registra logs de sincronização
- Tratamento robusto de erros

### Fontes de Dados

#### 1. VS Code
- **Fonte**: RSS Feed oficial (`https://code.visualstudio.com/feed.xml`)
- **Frequência**: 3 itens mais recentes
- **Dados**: Título, descrição, URL, data de publicação

#### 2. Cursor
- **Fonte**: GitHub Releases API (`https://api.github.com/repos/getcursor/cursor/releases`)
- **Frequência**: 3 releases mais recentes
- **Dados**: Nome da versão, changelog, URL, data de publicação

#### 3. Windsurf
- **Fonte**: Codeium Blog RSS (`https://codeium.com/blog/feed.xml`)
- **Frequência**: 2 posts relacionados ao Windsurf
- **Dados**: Título, descrição, URL, data de publicação
- **Filtro**: Apenas posts que mencionam "windsurf" ou "codeium"

#### 4. JetBrains
- **Fonte**: Blog oficial RSS (`https://blog.jetbrains.com/feed/`)
- **Frequência**: 2 posts mais recentes
- **Dados**: Título, descrição, URL, data de publicação

## Prevenção de Duplicatas

### Estratégia de Verificação

Antes de inserir cada notícia, o sistema verifica:

```sql
SELECT id FROM ide_news 
WHERE url = ? 
   OR (title = ? AND ide_name = ?)
LIMIT 1
```

**Critérios**:
1. **URL única**: Se a URL já existe, pula
2. **Título + IDE**: Se o mesmo título existe para a mesma IDE, pula

### Contadores

- `insertedCount`: Novidades inseridas com sucesso
- `skippedCount`: Duplicatas puladas
- `total`: Total de novidades encontradas

## Agendamento Automático

### Cron Job

**Arquivo**: `supabase/migrations/20260128040000_auto_sync_ide_news_cron.sql`

**Configuração**:
- **Nome**: `auto-sync-ide-news-daily`
- **Horário**: `0 8 * * *` (08:00 UTC / 05:00 BRT)
- **Frequência**: Diariamente
- **Método**: HTTP POST para Edge Function

### Formato Cron

```
┌───────────── minuto (0 - 59)
│ ┌───────────── hora (0 - 23)
│ │ ┌───────────── dia do mês (1 - 31)
│ │ │ ┌───────────── mês (1 - 12)
│ │ │ │ ┌───────────── dia da semana (0 - 6) (Domingo = 0)
│ │ │ │ │
0 8 * * *
```

## Logs de Sincronização

### Tabela: `ide_news_sync_log`

Cada execução registra:
- `status`: 'success' ou 'error'
- `items_synced`: Quantidade de itens inseridos
- `error_message`: Mensagem de erro (se houver)
- `synced_at`: Timestamp da execução

### Consultar Logs

```sql
-- Últimas 10 sincronizações
SELECT * FROM ide_news_sync_log 
ORDER BY synced_at DESC 
LIMIT 10;

-- Sincronizações com erro
SELECT * FROM ide_news_sync_log 
WHERE status = 'error' 
ORDER BY synced_at DESC;

-- Estatísticas do último mês
SELECT 
  DATE(synced_at) as data,
  COUNT(*) as execucoes,
  SUM(items_synced) as total_inseridos,
  COUNT(*) FILTER (WHERE status = 'error') as erros
FROM ide_news_sync_log
WHERE synced_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(synced_at)
ORDER BY data DESC;
```

## Deploy da Edge Function

### Via Supabase CLI

```bash
# Deploy da função
supabase functions deploy auto-sync-ide-news

# Testar localmente
supabase functions serve auto-sync-ide-news

# Invocar manualmente
supabase functions invoke auto-sync-ide-news
```

### Via MCP Supabase

```typescript
// Deploy via MCP
await mcp_supabase_mcp_server_deploy_edge_function({
  project_id: 'zarigqmtaexgcayzfqpt',
  name: 'auto-sync-ide-news',
  entrypoint_path: 'index.ts',
  verify_jwt: false, // Função pública para cron
  files: [
    {
      name: 'index.ts',
      content: '...' // Conteúdo do arquivo
    }
  ]
});
```

## Aplicar Migração do Cron

### Via Supabase Dashboard

1. Acesse SQL Editor
2. Cole o conteúdo de `20260128040000_auto_sync_ide_news_cron.sql`
3. Execute

### Via MCP Supabase

```typescript
await mcp_supabase_mcp_server_apply_migration({
  project_id: 'zarigqmtaexgcayzfqpt',
  name: 'auto_sync_ide_news_cron',
  query: '...' // Conteúdo da migração
});
```

## Execução Manual

### Via Dashboard Supabase

1. Acesse Edge Functions
2. Selecione `auto-sync-ide-news`
3. Clique em "Invoke"

### Via HTTP Request

```bash
curl -X POST \
  https://zarigqmtaexgcayzfqpt.supabase.co/functions/v1/auto-sync-ide-news \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Via Frontend (Admin)

Adicionar botão no Dashboard:

```typescript
const handleManualSync = async () => {
  const { data, error } = await supabase.functions.invoke('auto-sync-ide-news');
  
  if (error) {
    toast({ title: 'Erro', description: error.message, variant: 'destructive' });
  } else {
    toast({ 
      title: 'Sincronização concluída!', 
      description: `${data.inserted} novidades inseridas, ${data.skipped} duplicatas puladas` 
    });
  }
};
```

## Monitoramento

### Verificar Status do Cron

```sql
-- Ver cron jobs ativos
SELECT * FROM cron.job WHERE jobname = 'auto-sync-ide-news-daily';

-- Ver histórico de execuções
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'auto-sync-ide-news-daily')
ORDER BY start_time DESC 
LIMIT 10;
```

### Métricas Importantes

```sql
-- Taxa de sucesso (últimos 30 dias)
SELECT 
  COUNT(*) FILTER (WHERE status = 'success') * 100.0 / COUNT(*) as taxa_sucesso,
  AVG(items_synced) as media_itens_por_sync,
  MAX(items_synced) as max_itens_sync
FROM ide_news_sync_log
WHERE synced_at >= NOW() - INTERVAL '30 days';

-- Novidades por IDE (últimos 7 dias)
SELECT 
  ide_name,
  COUNT(*) as total_novidades,
  MAX(published_at) as ultima_novidade
FROM ide_news
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY ide_name
ORDER BY total_novidades DESC;
```

## Troubleshooting

### Função não executa automaticamente

**Verificar**:
1. Cron job está ativo: `SELECT * FROM cron.job`
2. Extensão pg_cron está habilitada
3. Configurações de API URL e Service Role Key estão corretas

**Solução**:
```sql
-- Recriar cron job
SELECT cron.unschedule('auto-sync-ide-news-daily');
-- Depois executar a migração novamente
```

### Muitas duplicatas sendo puladas

**Causa**: Fontes RSS não têm novidades

**Solução**: Normal, significa que o sistema está funcionando corretamente

### Erros de timeout

**Causa**: Fontes RSS lentas ou indisponíveis

**Solução**: 
- Aumentar timeout das requisições
- Adicionar retry logic
- Verificar logs: `SELECT * FROM ide_news_sync_log WHERE status = 'error'`

### Nenhuma novidade inserida

**Verificar**:
1. Fontes RSS estão acessíveis
2. Formato do XML/JSON não mudou
3. Logs de erro: `SELECT * FROM ide_news_sync_log ORDER BY synced_at DESC LIMIT 1`

## Customização

### Adicionar Nova IDE

1. Criar função `fetchNovaIDENews()`:

```typescript
async function fetchNovaIDENews(): Promise<NewsItem[]> {
  try {
    const response = await fetch('URL_DA_FONTE');
    const data = await response.json(); // ou .text() para XML
    
    // Parse e retornar NewsItem[]
    return items;
  } catch (error) {
    console.error('Erro ao buscar Nova IDE:', error);
    return [];
  }
}
```

2. Adicionar no `Promise.all`:

```typescript
const [vsCodeNews, cursorNews, ..., novaIDENews] = await Promise.all([
  fetchVSCodeNews(),
  fetchCursorNews(),
  ...,
  fetchNovaIDENews(),
]);

const allNews = [...vsCodeNews, ..., ...novaIDENews];
```

### Alterar Horário do Cron

```sql
-- Desagendar atual
SELECT cron.unschedule('auto-sync-ide-news-daily');

-- Agendar novo horário (exemplo: 14:00 UTC)
SELECT cron.schedule(
  'auto-sync-ide-news-daily',
  '0 14 * * *',
  $$ ... $$
);
```

### Alterar Frequência

```sql
-- A cada 6 horas
'0 */6 * * *'

-- A cada 12 horas
'0 */12 * * *'

-- Duas vezes por dia (08:00 e 20:00)
'0 8,20 * * *'

-- Apenas dias úteis às 08:00
'0 8 * * 1-5'
```

## Boas Práticas

1. **Monitorar logs regularmente**: Verificar taxa de sucesso
2. **Limpar logs antigos**: Manter apenas últimos 90 dias
3. **Testar manualmente**: Antes de confiar no cron
4. **Backup de dados**: Antes de grandes mudanças
5. **Rate limiting**: Respeitar limites das APIs externas

## Limpeza de Logs Antigos

```sql
-- Criar função para limpar logs antigos
CREATE OR REPLACE FUNCTION cleanup_old_sync_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM ide_news_sync_log 
  WHERE synced_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Agendar limpeza mensal
SELECT cron.schedule(
  'cleanup-sync-logs-monthly',
  '0 0 1 * *', -- Primeiro dia de cada mês à meia-noite
  $$ SELECT cleanup_old_sync_logs(); $$
);
```

## Segurança

- Edge Function usa Service Role Key (não exposta ao frontend)
- Cron job roda com permissões do sistema
- Logs não contêm dados sensíveis
- URLs externas são validadas antes de inserir

## Performance

- Requisições em paralelo (`Promise.all`)
- Verificação de duplicatas eficiente (índices em `url` e `title`)
- Limite de itens por fonte (evita sobrecarga)
- Timeout configurável

## Próximas Melhorias

- [ ] Adicionar mais fontes (Zed, Fleet, etc)
- [ ] Notificações quando há novas novidades
- [ ] Dashboard de analytics de sincronização
- [ ] Retry automático em caso de falha
- [ ] Cache de requisições RSS
- [ ] Webhook para notificar admins
- [ ] Filtros de relevância (ML/AI)

## Referências

- Edge Function: `supabase/functions/auto-sync-ide-news/index.ts`
- Migração Cron: `supabase/migrations/20260128040000_auto_sync_ide_news_cron.sql`
- Tabela: `ide_news`
- Logs: `ide_news_sync_log`
- Documentação pg_cron: https://github.com/citusdata/pg_cron
