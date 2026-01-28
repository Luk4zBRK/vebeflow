# Sistema de Workflows

## Visão Geral

O sistema de Workflows permite criar, gerenciar e compartilhar processos, automações e fluxos de trabalho. É uma seção pública do site onde visitantes podem aprender sobre diferentes workflows e processos.

## Estrutura do Sistema

### Banco de Dados

**Tabela**: `workflows`

Campos:
- `id` (UUID) - Identificador único
- `title` (VARCHAR) - Título do workflow
- `slug` (VARCHAR) - URL amigável (único)
- `description` (TEXT) - Descrição breve
- `content` (TEXT) - Conteúdo HTML do workflow
- `image_url` (TEXT) - URL da imagem de capa
- `author_id` (UUID) - ID do autor (referência a auth.users)
- `author_name` (VARCHAR) - Nome do autor
- `is_published` (BOOLEAN) - Status de publicação
- `views_count` (INTEGER) - Contador de visualizações
- `created_at` (TIMESTAMPTZ) - Data de criação
- `updated_at` (TIMESTAMPTZ) - Data de atualização

### Segurança (RLS)

**Políticas de Leitura**:
- Público: Pode ver workflows publicados (`is_published = true`)
- Admins: Podem ver todos os workflows

**Políticas de Escrita**:
- Apenas admins podem criar, editar e excluir workflows

### Funções do Banco

**`increment_workflow_views(workflow_id UUID)`**
- Incrementa o contador de visualizações
- Executada automaticamente ao visualizar um workflow

**`update_workflows_updated_at()`**
- Atualiza `updated_at` automaticamente via trigger

## Páginas

### 1. Página Pública de Workflows (`/workflows`)

**Arquivo**: `src/pages/Workflows.tsx`

**Funcionalidades**:
- Lista todos os workflows publicados
- Busca por título e descrição
- Cards com preview de imagem
- Informações: autor, data, visualizações
- Design responsivo com grid

**Componentes**:
- Hero section com busca
- Grid de cards de workflows
- Skeleton loading states
- Empty states

### 2. Página de Workflow Individual (`/workflows/:slug`)

**Arquivo**: `src/pages/WorkflowPost.tsx`

**Funcionalidades**:
- Exibe workflow completo
- Incrementa visualizações automaticamente
- Botões de compartilhamento
- Copiar link
- Navegação entre workflows
- Meta informações (autor, data, views)

**Recursos**:
- Suporte a HTML no conteúdo
- Imagem de capa opcional
- Compartilhamento nativo (Web Share API)
- Fallback para copiar link

### 3. Gerenciador de Workflows (`/workflow-manager`)

**Arquivo**: `src/pages/WorkflowManager.tsx`

**Funcionalidades**:
- CRUD completo de workflows
- Editor de conteúdo HTML
- Geração automática de slug
- Toggle de publicação
- Estatísticas (total, publicados, visualizações)
- Preview de workflows publicados

**Interface**:
- Tabela com todos os workflows
- Dialog para criar/editar
- Confirmação de exclusão
- Badges de status (publicado/rascunho)
- Ações rápidas (editar, excluir, publicar, preview)

## Fluxo de Uso

### Para Administradores

1. **Criar Workflow**:
   - Acessar `/workflow-manager`
   - Clicar em "Novo Workflow"
   - Preencher título (slug gerado automaticamente)
   - Adicionar descrição e imagem (opcional)
   - Escrever conteúdo em HTML
   - Marcar como publicado (ou deixar como rascunho)
   - Salvar

2. **Editar Workflow**:
   - Clicar no ícone de edição
   - Modificar campos desejados
   - Salvar alterações

3. **Publicar/Despublicar**:
   - Clicar no ícone de olho/olho riscado
   - Status muda instantaneamente

4. **Excluir Workflow**:
   - Clicar no ícone de lixeira
   - Confirmar exclusão

### Para Visitantes

1. **Navegar Workflows**:
   - Acessar `/workflows`
   - Ver lista de workflows publicados
   - Usar busca para filtrar

2. **Ler Workflow**:
   - Clicar em um card
   - Ler conteúdo completo
   - Compartilhar ou copiar link

## Integração com o Site

### Header

O link "Workflows" foi adicionado ao menu principal:
- Desktop: Botão verde no menu superior
- Mobile: Item no menu hambúrguer

### Dashboard

Menu "Workflows" adicionado na seção "Conteúdo":
- Ícone: Workflow
- Descrição: "Automações e processos"
- Rota: `/workflow-manager`

## Formato do Conteúdo

O conteúdo dos workflows suporta HTML completo. Exemplos:

```html
<h2>Passo 1: Configuração Inicial</h2>
<p>Descrição do primeiro passo...</p>

<h3>Requisitos</h3>
<ul>
  <li>Node.js 18+</li>
  <li>npm ou yarn</li>
</ul>

<h2>Passo 2: Instalação</h2>
<pre><code>npm install @supabase/supabase-js</code></pre>

<h2>Passo 3: Configuração</h2>
<p>Configure as variáveis de ambiente:</p>
<code>SUPABASE_URL=your-url</code>
```

### Tags Recomendadas

- `<h2>` - Títulos de seções
- `<h3>` - Subtítulos
- `<p>` - Parágrafos
- `<ul>`, `<ol>`, `<li>` - Listas
- `<code>` - Código inline
- `<pre><code>` - Blocos de código
- `<strong>`, `<em>` - Ênfase
- `<a>` - Links externos

## Rotas

| Rota | Página | Acesso |
|------|--------|--------|
| `/workflows` | Lista de workflows | Público |
| `/workflows/:slug` | Workflow individual | Público |
| `/workflow-manager` | Gerenciador | Admin |

## Estatísticas

O sistema rastreia:
- Total de workflows criados
- Workflows publicados vs rascunhos
- Visualizações por workflow
- Visualizações totais

## Boas Práticas

### Para Criar Workflows

1. **Título Claro**: Use títulos descritivos e objetivos
2. **Slug Único**: Verifique se o slug não existe
3. **Descrição Concisa**: Máximo 2-3 linhas
4. **Imagem de Qualidade**: Use imagens relevantes e de boa resolução
5. **Conteúdo Estruturado**: Use headings para organizar
6. **Código Formatado**: Use `<pre><code>` para blocos de código
7. **Links Externos**: Sempre use `target="_blank"` e `rel="noopener"`

### Para Gerenciar

1. **Rascunhos Primeiro**: Crie como rascunho, revise, depois publique
2. **Preview Antes**: Use o botão de preview para ver como ficará
3. **Atualizações**: Workflows podem ser editados após publicação
4. **Backup**: Copie o conteúdo antes de grandes edições

## Exemplos de Workflows

### Workflow de Configuração

```html
<h2>Objetivo</h2>
<p>Configurar ambiente de desenvolvimento para projetos React + Supabase</p>

<h2>Pré-requisitos</h2>
<ul>
  <li>Node.js 18 ou superior</li>
  <li>Conta no Supabase</li>
  <li>Editor de código (VS Code recomendado)</li>
</ul>

<h2>Passo 1: Criar Projeto</h2>
<pre><code>npx create-react-app meu-projeto
cd meu-projeto</code></pre>

<h2>Passo 2: Instalar Supabase</h2>
<pre><code>npm install @supabase/supabase-js</code></pre>

<h2>Passo 3: Configurar Cliente</h2>
<p>Crie o arquivo <code>src/lib/supabase.js</code>:</p>
<pre><code>import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)</code></pre>
```

## Troubleshooting

### Workflow não aparece na lista pública
- Verifique se `is_published` está como `true`
- Confirme que não há erros no console
- Limpe o cache do navegador

### Erro ao salvar workflow
- Verifique se título, slug e conteúdo estão preenchidos
- Confirme que o slug é único
- Verifique permissões de admin

### Imagem não carrega
- Confirme que a URL é válida e acessível
- Use URLs HTTPS
- Teste a URL em uma nova aba

## Migração

Arquivo: `supabase/migrations/create_workflows_table.sql`

Para aplicar manualmente:
```sql
-- Execute o conteúdo da migração no SQL Editor do Supabase
```

## Próximas Melhorias

- [ ] Categorias de workflows
- [ ] Tags para filtrar
- [ ] Comentários nos workflows
- [ ] Curtidas/reações
- [ ] Workflows relacionados
- [ ] Editor WYSIWYG
- [ ] Upload de imagens direto
- [ ] Versionamento de workflows
- [ ] Exportar workflow como PDF
- [ ] Workflow templates

## Referências

- Tabela: `public.workflows`
- Função: `increment_workflow_views()`
- Políticas RLS: Ver migração
- Tipos TypeScript: `src/integrations/supabase/types.ts`
