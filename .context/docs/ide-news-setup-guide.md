# Guia de Setup: Sistema de Cache de Novidades das IDEs

## Passo a Passo para Ativar o Sistema

### 1. Aplicar Migração no Banco de Dados

**Opção A: Via Supabase CLI (Recomendado)**
```bash
# Certifique-se de estar logado
supabase login

# Aplicar migração
supabase db push
```

**Opção B: Via Dashboard do Supabase**
1. Acesse: https://supabase.com/dashboard/project/[PROJECT_ID]/sql
2. Clique em "New Query"
3. Copie todo o conteúdo de `supabase/migrations/20260128010000_ide_news_system.sql`
4. Cole no editor
5. Clique em "Run"

### 2. Deploy da Edge Function

```bash
# Deploy da função
supabase functions deploy sync-ide-news

# Verificar se foi deployada
supabase functions list
```

### 3. Primeira Sincronização (Manual)

**Opção A: Via Dashboard**
1. Acesse: https://supabase.com/dashboard/project/[PROJECT_ID]/functions
2. Encontre `sync-ide-news`
3. Clique em "Invoke"
4. Deixe o body vazio: `{}`
5. Clique em "Send Request"
6. Aguarde resposta (pode levar 30-60 segundos)

**Opção B: Via curl**
```bash
curl -X POST \
  'https://zarigqmtaexgcayzfqpt.supabase.co/functions/v1/sync-ide-news' \
  -H 'Authorization: Bearer [ANON_KEY]' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

**Opção C: Via código React (no Dashboard admin)**
```typescript
const { data, error } = await supabase.functions.invoke('sync-ide-news', {
  body: {},
});

if (error) {
  console.error('Erro:', error);
} else {
  console.log('Sucesso:', data);
}
```

### 4. Verificar se Funcionou

**Verificar dados na tabela:**
```sql
SELECT 
  fonte,
  COUNT(*) as total,
  MAX(created_at) as ultima_atualizacao
FROM ide_news
GROUP BY fonte
ORDER BY fonte;
```

**Resultado esperado:**
```
fonte            | total | ultima_atualizacao
-----------------+-------+-------------------
Antgravit        |     2 | 2026-01-28 14:30:00
Bind AI          |     2 | 2026-01-28 14:30:00
Bolt             |     2 | 2026-01-28 14:30:00
Cursor           |     2 | 2026-01-28 14:30:00
Firebase Studio  |     2 | 2026-01-28 14:30:00
JetBrains        |     2 | 2026-01-28 14:30:00
Replit           |     2 | 2026-01-28 14:30:00
VS Code          |     2 | 2026-01-28 14:30:00
Windsurf         |     2 | 2026-01-28 14:30:00
```

**Verificar log de sincronização:**
```sql
SELECT 
  sync_started_at,
  sync_completed_at,
  status,
  items_fetched,
  error_message
FROM ide_news_sync_log
ORDER BY created_at DESC
LIMIT 1;
```

**Resultado esperado:**
```
status: success
items_fetched: 18
error_message: null
```

### 5. Testar na Aplicação

1. Acesse: http://localhost:5173/blog (ou URL de produção)
2. Clique na aba "Novidades IDEs"
3. Deve carregar instantaneamente (< 1 segundo)
4. Deve mostrar "Atualizado em [data/hora]"
5. Botão "Atualizar" deve recarregar do banco

### 6. Verificar Cron Job

```sql
-- Ver todos os jobs agendados
SELECT * FROM cron.job;

-- Ver especificamente o job de sync
SELECT 
  jobname,
  schedule,
  active,
  jobid
FROM cron.job 
WHERE jobname = 'sync-ide-news-daily';
```

**Resultado esperado:**
```
jobname: sync-ide-news-daily
schedule: 0 0 * * *
active: true
```

## Configurações Opcionais

### Alterar Horário do Cron Job

Por padrão, roda às 00:00 UTC. Para alterar:

```sql
-- Desagendar job atual
SELECT cron.unschedule('sync-ide-news-daily');

-- Reagendar com novo horário (exemplo: 06:00 UTC)
SELECT cron.schedule(
  'sync-ide-news-daily',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/sync-ide-news',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
```

### Adicionar Botão de Sincronização Manual no Dashboard

No componente Dashboard admin, adicione:

```typescript
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);

  const handleSyncNews = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-ide-news', {
        body: {},
      });

      if (error) throw error;

      toast({
        title: 'Sincronização concluída',
        description: `${data.items_synced} novidades atualizadas`,
      });
    } catch (error) {
      toast({
        title: 'Erro na sincronização',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Button onClick={handleSyncNews} disabled={syncing}>
      <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
      {syncing ? 'Sincronizando...' : 'Sincronizar Novidades'}
    </Button>
  );
};
```

## Troubleshooting

### Erro: "relation ide_news does not exist"
**Causa:** Migração não foi aplicada
**Solução:** Execute `supabase db push` ou aplique via Dashboard

### Erro: "function sync-ide-news not found"
**Causa:** Edge Function não foi deployada
**Solução:** Execute `supabase functions deploy sync-ide-news`

### Erro: "permission denied for table ide_news"
**Causa:** RLS policies não foram criadas corretamente
**Solução:** Reaplique a migração ou verifique policies no Dashboard

### Novidades não aparecem na UI
**Causa:** Primeira sincronização não foi executada
**Solução:** Execute sincronização manual (passo 3)

### Cron job não executa automaticamente
**Causa:** pg_cron não está habilitado ou job não foi agendado
**Solução:** 
1. Verifique se pg_cron está habilitado: `SELECT * FROM pg_extension WHERE extname = 'pg_cron';`
2. Se não estiver, habilite: `CREATE EXTENSION pg_cron;`
3. Reagende o job (ver seção "Alterar Horário do Cron Job")

## Checklist de Verificação

- [ ] Migração aplicada com sucesso
- [ ] Edge Function deployada
- [ ] Primeira sincronização executada
- [ ] Dados aparecem na tabela `ide_news`
- [ ] Log de sincronização registrado em `ide_news_sync_log`
- [ ] Cron job agendado e ativo
- [ ] UI carrega novidades instantaneamente
- [ ] Botão "Atualizar" funciona
- [ ] Data de atualização é exibida corretamente

## Próximos Passos

Após setup completo:
1. Aguarde até 00:00 UTC para verificar se o cron job executa automaticamente
2. Monitore logs de sincronização diariamente
3. Configure alertas para falhas (opcional)
4. Adicione botão de sync manual no Dashboard admin (opcional)

## Suporte

Para mais informações, consulte:
- Documentação completa: `.context/docs/ide-news-cache-system.md`
- Código da Edge Function: `supabase/functions/sync-ide-news/index.ts`
- Hook React: `src/hooks/useChangelogNews.ts`
