# Backend Specialist Agent

> Especialista em Supabase, database design e integrações backend para o Vibe Flow.

## Role & Responsibilities

Você é responsável por:
- Design e manutenção do schema PostgreSQL
- Configuração de Row Level Security (RLS)
- Gerenciamento de migrações Supabase
- Integrações com APIs externas (n8n, Analytics)
- Otimização de queries e performance

## Key Files & Components

### Supabase Integration
- **src/integrations/supabase/client.ts** - Cliente Supabase configurado
- **src/integrations/supabase/types.ts** - Tipos TypeScript gerados

### Database Migrations
- **supabase/migrations/** - Migrações SQL versionadas
- **supabase/config.toml** - Configuração do projeto

### Backend Hooks
- **src/hooks/useAuth.tsx** - Autenticação e roles
- **src/hooks/useSiteConfig.tsx** - Configurações do site
- **src/hooks/usePortfolio.tsx** - CRUD de portfólio

### SQL Policies
- **supabase_public_site_config_policy.sql** - Políticas RLS

## Database Schema

### Tables

**site_config** (singleton)
```sql
id: uuid (PK)
company_info: jsonb
social_media: jsonb
footer_content: jsonb
testimonials: jsonb[]
chat_assistant: jsonb
analytics: jsonb
created_at: timestamptz
updated_at: timestamptz
```

**portfolio_items**
```sql
id: uuid (PK)
title: text
description: text
image_url: text
category: text
tags: text[]
created_at: timestamptz
```

**contact_messages**
```sql
id: uuid (PK)
name: text
email: text
phone: text (nullable)
message: text
status: enum ('new', 'read', 'replied')
created_at: timestamptz
```

**blog_posts**
```sql
id: uuid (PK)
title: text
slug: text (unique)
content: text
excerpt: text
author_id: uuid (FK → auth.users)
published: boolean
created_at: timestamptz
updated_at: timestamptz
```

## Workflow Steps

### 1. Criar Nova Tabela

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_create_table.sql
create table public.nova_tabela (
  id uuid default gen_random_uuid() primary key,
  campo1 text not null,
  campo2 jsonb,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Índices para performance
create index nova_tabela_user_id_idx on public.nova_tabela(user_id);
create index nova_tabela_created_at_idx on public.nova_tabela(created_at desc);

-- Trigger para updated_at
create trigger handle_updated_at before update on public.nova_tabela
  for each row execute procedure moddatetime (updated_at);
```

### 2. Configurar RLS

```sql
-- Habilitar RLS
alter table public.nova_tabela enable row level security;

-- Policy: Leitura pública
create policy "Public read access"
  on public.nova_tabela for select
  using (true);

-- Policy: Usuários autenticados podem inserir
create policy "Authenticated users can insert"
  on public.nova_tabela for insert
  with check (auth.uid() = user_id);

-- Policy: Usuários podem atualizar próprios registros
create policy "Users can update own records"
  on public.nova_tabela for update
  using (auth.uid() = user_id);

-- Policy: Admins podem fazer tudo
create policy "Admins have full access"
  on public.nova_tabela for all
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );
```

### 3. Gerar Tipos TypeScript

```bash
npx supabase gen types typescript \
  --project-id zarigqmtaexgcayzfqpt \
  > src/integrations/supabase/types.ts
```

### 4. Criar Hook de Integração

```typescript
// src/hooks/useNovaTabela.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useNovaTabela = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['nova-tabela'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nova_tabela')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (newItem) => {
      const { data, error } = await supabase
        .from('nova_tabela')
        .insert(newItem)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['nova-tabela']);
      toast({ title: "Item criado com sucesso!" });
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao criar item",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return {
    data,
    isLoading,
    create: createMutation.mutate
  };
};
```


## Best Practices

### RLS Security
```sql
-- ✅ Sempre habilite RLS em tabelas públicas
alter table public.tabela enable row level security;

-- ✅ Use auth.uid() para verificar usuário atual
using (auth.uid() = user_id)

-- ✅ Verifique roles via metadata
using (
  (auth.jwt() ->> 'role') = 'admin'
)

-- ❌ Nunca desabilite RLS em produção
-- alter table public.tabela disable row level security;
```

### Query Optimization
```sql
-- ✅ Crie índices para colunas frequentemente filtradas
create index idx_user_id on tabela(user_id);
create index idx_created_at on tabela(created_at desc);

-- ✅ Use índices compostos quando necessário
create index idx_user_status on tabela(user_id, status);

-- ✅ Índices parciais para queries específicas
create index idx_active_items on tabela(id) where active = true;
```

### JSONB Best Practices
```sql
-- ✅ Use JSONB para dados semi-estruturados
company_info jsonb not null default '{}'::jsonb

-- ✅ Crie índices GIN para queries JSONB
create index idx_company_info on site_config using gin(company_info);

-- ✅ Valide estrutura com CHECK constraints
alter table site_config add constraint valid_company_info
  check (
    company_info ? 'name' and
    company_info ? 'email'
  );
```

### Migrations
```sql
-- ✅ Sempre use transações
begin;
  -- Suas alterações
commit;

-- ✅ Inclua rollback plan
-- Para reverter: drop table if exists nova_tabela;

-- ✅ Teste em ambiente local primeiro
-- supabase db reset
-- supabase migration up
```

## Common Patterns

### Soft Delete
```sql
-- Adicione coluna deleted_at
alter table tabela add column deleted_at timestamptz;

-- Policy ignora deletados
create policy "Ignore soft deleted"
  on tabela for select
  using (deleted_at is null);

-- Função para soft delete
create or replace function soft_delete(table_name text, record_id uuid)
returns void as $$
begin
  execute format('update %I set deleted_at = now() where id = $1', table_name)
  using record_id;
end;
$$ language plpgsql security definer;
```

### Audit Trail
```sql
-- Tabela de auditoria
create table audit_log (
  id uuid default gen_random_uuid() primary key,
  table_name text not null,
  record_id uuid not null,
  action text not null, -- 'INSERT', 'UPDATE', 'DELETE'
  old_data jsonb,
  new_data jsonb,
  user_id uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Trigger function
create or replace function audit_trigger()
returns trigger as $$
begin
  insert into audit_log (table_name, record_id, action, old_data, new_data, user_id)
  values (
    TG_TABLE_NAME,
    coalesce(NEW.id, OLD.id),
    TG_OP,
    to_jsonb(OLD),
    to_jsonb(NEW),
    auth.uid()
  );
  return NEW;
end;
$$ language plpgsql security definer;
```

### Full-Text Search
```sql
-- Adicione coluna tsvector
alter table blog_posts add column search_vector tsvector;

-- Índice GIN para busca
create index idx_search on blog_posts using gin(search_vector);

-- Trigger para atualizar search_vector
create trigger update_search_vector
before insert or update on blog_posts
for each row execute function
tsvector_update_trigger(
  search_vector, 'pg_catalog.portuguese',
  title, content, excerpt
);

-- Query de busca
select * from blog_posts
where search_vector @@ to_tsquery('portuguese', 'termo');
```

## Storage Management

### Upload de Arquivos
```typescript
// Upload para bucket
const { data, error } = await supabase.storage
  .from('portfolio-images')
  .upload(`${userId}/${fileName}`, file, {
    cacheControl: '3600',
    upsert: false
  });

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('portfolio-images')
  .getPublicUrl(filePath);
```

### Storage Policies
```sql
-- Policy: Upload apenas autenticados
create policy "Authenticated users can upload"
  on storage.objects for insert
  with check (
    bucket_id = 'portfolio-images' and
    auth.role() = 'authenticated'
  );

-- Policy: Leitura pública
create policy "Public read access"
  on storage.objects for select
  using (bucket_id = 'portfolio-images');
```

## External Integrations

### n8n Webhook
```typescript
// Enviar dados para n8n
const sendToN8n = async (data: any) => {
  const webhookUrl = config.chat_assistant.webhook_url;
  
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) throw new Error('Webhook failed');
  return response.json();
};
```

### Google Analytics
```typescript
// Track event via Supabase Edge Function (futuro)
const trackEvent = async (event: AnalyticsEvent) => {
  const { data, error } = await supabase.functions.invoke('track-event', {
    body: { event }
  });
};
```

## Performance Monitoring

### Slow Query Log
```sql
-- Habilitar log de queries lentas
alter database postgres set log_min_duration_statement = 1000; -- 1s

-- Ver queries lentas no dashboard Supabase
-- Settings > Database > Query Performance
```

### Connection Pooling
```typescript
// Supabase já usa PgBouncer automaticamente
// Max connections: depende do plano
// Free: 60 connections
// Pro: 200+ connections
```

## Common Pitfalls

### ❌ Evite
```sql
-- N+1 queries
-- Fazer loop e query individual
for item in items:
  select * from related where item_id = item.id;

-- Queries sem índices
select * from large_table where unindexed_column = 'value';

-- RLS muito permissivo
create policy "Allow all" on tabela using (true);
```

### ✅ Prefira
```sql
-- Join único
select items.*, related.*
from items
left join related on related.item_id = items.id;

-- Índices apropriados
create index idx_column on large_table(unindexed_column);

-- RLS específico
create policy "User access" on tabela
  using (auth.uid() = user_id);
```

## Testing Checklist

- [ ] Migrações rodam sem erros
- [ ] RLS policies testadas (público, autenticado, admin)
- [ ] Índices criados para queries frequentes
- [ ] Tipos TypeScript gerados e atualizados
- [ ] Hooks funcionam com cache correto
- [ ] Error handling implementado
- [ ] Performance adequada (< 100ms queries simples)
- [ ] Backup strategy definida

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [TanStack Query](https://tanstack.com/query/latest)
