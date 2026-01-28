# Sistema de Sincronização Automática de Conteúdo

## Visão Geral

Sistema com 3 Edge Functions para alimentar automaticamente o blog com conteúdo útil:
- **Workflows**: Tutoriais e guias práticos
- **MCP Servers**: Servidores MCP populares e úteis
- **Sites Úteis**: Ferramentas e recursos para desenvolvedores

## Edge Functions Criadas

### 1. auto-sync-workflows

**Localização**: `supabase/functions/auto-sync-workflows/index.ts`

**Conteúdo Incluído**:
- Configurar Tailwind CSS em Projeto React
- Implementar Dark Mode em React
- Configurar React Query (TanStack Query)

**Como Invocar**:
```bash
# Via Supabase Dashboard
Edge Functions > auto-sync-workflows > Invoke

# Via HTTP
curl -X POST https://zarigqmtaexgcayzfqpt.supabase.co/functions/v1/auto-sync-workflows
```

### 2. auto-sync-mcp-servers

**Localização**: `supabase/functions/auto-sync-mcp-servers/index.ts`

**Conteúdo Incluído**:
- Time MCP Server (data/hora/timezone)
- Fetch MCP Server (requisições HTTP)
- Everything MCP Server (busca de arquivos Windows)

**Como Invocar**:
```bash
# Via Supabase Dashboard
Edge Functions > auto-sync-mcp-servers > Invoke

# Via HTTP
curl -X POST https://zarigqmtaexgcayzfqpt.supabase.co/functions/v1/auto-sync-mcp-servers
```

### 3. auto-sync-sites

**Localização**: `supabase/functions/auto-sync-sites/index.ts`

**Conteúdo Incluído** (15 sites):
- Can I Use (compatibilidade de browsers)
- MDN Web Docs (documentação web)
- DevDocs (documentação centralizada)
- Regex101 (testador de regex)
- JSON Formatter
- Excalidraw (diagramas)
- Ray.so (screenshots de código)
- Hoppscotch (cliente API)
- Bundlephobia (tamanho de pacotes npm)
- Transform Tools (conversores)
- Responsively (teste responsivo)
- Coolors (paletas de cores)
- Roadmap.sh (roadmaps de carreira)
- DevHints (cheatsheets)
- Shields.io (badges GitHub)

**Como Invocar**:
```bash
# Via Supabase Dashboard
Edge Functions > auto-sync-sites > Invoke

# Via HTTP
curl -X POST https://zarigqmtaexgcayzfqpt.supabase.co/functions/v1/auto-sync-sites
```

## Deploy das Funções

### Via Supabase CLI

```bash
# Deploy todas de uma vez
supabase functions deploy auto-sync-workflows
supabase functions deploy auto-sync-mcp-servers
supabase functions deploy auto-sync-sites
```

### Via MCP Supabase (Kiro)

Use o tool `mcp_supabase_mcp_server_deploy_edge_function` para cada função.

## Prevenção de Duplicatas

Todas as funções verificam se o conteúdo já existe antes de inserir:
- **Workflows**: Verifica por `slug`
- **MCP Servers**: Verifica por `slug`
- **Sites**: Verifica por `slug`

## Características

### Workflows
- Conteúdo em HTML formatado
- Tutoriais passo a passo
- Exemplos de código
- Publicados automaticamente

### MCP Servers
- Informações completas (npm, GitHub, docs)
- Categorias e tags
- Exemplos de uso
- Casos de uso práticos

### Sites Úteis
- URLs verificadas
- Categorias organizadas
- Tags para busca
- Indicação se é gratuito

## Adicionar Mais Conteúdo

### Para Workflows

Edite `supabase/functions/auto-sync-workflows/index.ts` e adicione no array `workflowsDatabase`:

```typescript
{
  title: 'Novo Workflow',
  slug: 'novo-workflow',
  description: 'Descrição breve',
  content: `<h2>Conteúdo HTML</h2>...`,
  image_url: 'https://...' // opcional
}
```

### Para MCP Servers

Edite `supabase/functions/auto-sync-mcp-servers/index.ts` e adicione no array `mcpServersDatabase`:

```typescript
{
  name: 'Novo MCP Server',
  slug: 'novo-mcp-server',
  description: 'Descrição',
  content: `<h2>Documentação</h2>...`,
  category: 'utility', // utility, web, filesystem, ai, database
  npm_package: '@org/package',
  github_url: 'https://github.com/...',
  documentation_url: 'https://...',
  author: 'Nome do Autor',
  tags: ['tag1', 'tag2']
}
```

### Para Sites

Edite `supabase/functions/auto-sync-sites/index.ts` e adicione no array `sitesDatabase`:

```typescript
{
  name: 'Novo Site',
  slug: 'novo-site',
  description: 'Descrição do site',
  url: 'https://...',
  category: 'development', // development, tools, design, learning, ai
  tags: ['tag1', 'tag2'],
  is_free: true
}
```

## Execução Manual

### Via Dashboard Admin

Você pode adicionar botões no Dashboard para invocar as funções:

```typescript
const handleSyncWorkflows = async () => {
  const { data, error } = await supabase.functions.invoke('auto-sync-workflows');
  if (!error) {
    toast({ title: `${data.inserted} workflows adicionados!` });
  }
};

const handleSyncMcpServers = async () => {
  const { data, error } = await supabase.functions.invoke('auto-sync-mcp-servers');
  if (!error) {
    toast({ title: `${data.inserted} MCP servers adicionados!` });
  }
};

const handleSyncSites = async () => {
  const { data, error } = await supabase.functions.invoke('auto-sync-sites');
  if (!error) {
    toast({ title: `${data.inserted} sites adicionados!` });
  }
};
```

## Agendamento Automático (Opcional)

Se quiser que rode automaticamente, crie cron jobs similares ao de IDE news:

```sql
-- Workflows (semanal, domingos às 10:00)
SELECT cron.schedule(
  'auto-sync-workflows-weekly',
  '0 10 * * 0',
  'SELECT trigger_auto_sync_workflows();'
);

-- MCP Servers (quinzenal, 1º e 15º às 10:00)
SELECT cron.schedule(
  'auto-sync-mcp-servers-biweekly',
  '0 10 1,15 * *',
  'SELECT trigger_auto_sync_mcp_servers();'
);

-- Sites (mensal, dia 1 às 10:00)
SELECT cron.schedule(
  'auto-sync-sites-monthly',
  '0 10 1 * *',
  'SELECT trigger_auto_sync_sites();'
);
```

## Monitoramento

### Verificar Conteúdo Inserido

```sql
-- Workflows adicionados hoje
SELECT title, created_at FROM workflows 
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;

-- MCP Servers adicionados hoje
SELECT name, created_at FROM mcp_servers 
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;

-- Sites adicionados hoje
SELECT name, created_at FROM recommended_sites 
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;
```

### Estatísticas

```sql
-- Total por categoria
SELECT 
  'Workflows' as tipo,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_published) as publicados
FROM workflows
UNION ALL
SELECT 
  'MCP Servers',
  COUNT(*),
  COUNT(*) FILTER (WHERE is_published)
FROM mcp_servers
UNION ALL
SELECT 
  'Sites Úteis',
  COUNT(*),
  COUNT(*) FILTER (WHERE is_published)
FROM recommended_sites;
```

## Boas Práticas

1. **Teste Localmente**: Invoque manualmente antes de agendar
2. **Revise Conteúdo**: Verifique qualidade antes de publicar
3. **Evite Duplicatas**: As funções já verificam, mas confirme
4. **Atualize Regularmente**: Adicione novo conteúdo periodicamente
5. **Monitore Logs**: Verifique se inserções foram bem-sucedidas

## Troubleshooting

### Função não insere nada

**Causa**: Conteúdo já existe (duplicatas)

**Solução**: Normal, significa que o sistema está funcionando

### Erro ao inserir

**Verificar**:
1. Campos obrigatórios preenchidos
2. Slugs únicos
3. Formato do conteúdo HTML válido
4. Permissões do service role key

### Como limpar e reinserir

```sql
-- CUIDADO: Isso apaga todo o conteúdo!
DELETE FROM workflows WHERE author_name = 'Vibe Flow';
DELETE FROM mcp_servers WHERE author = 'Anthropic';
DELETE FROM recommended_sites WHERE is_free = true;

-- Depois invoque as funções novamente
```

## Próximas Melhorias

- [ ] Buscar conteúdo de APIs externas (GitHub, npm, etc)
- [ ] Validação de URLs antes de inserir
- [ ] Geração automática de imagens de capa
- [ ] Tradução automática de conteúdo
- [ ] Sistema de votação para conteúdo popular
- [ ] Sugestões de conteúdo baseadas em analytics

## Referências

- Edge Functions: `supabase/functions/auto-sync-*/`
- Tabelas: `workflows`, `mcp_servers`, `recommended_sites`
- Documentação Supabase: https://supabase.com/docs/guides/functions
