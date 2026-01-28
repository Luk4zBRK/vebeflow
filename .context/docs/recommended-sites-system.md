# Sistema de Sites Recomendados

## Visão Geral

Sistema completo para compartilhar e descobrir sites úteis para desenvolvimento, design, IA, aprendizado e ferramentas. Permite que usuários publiquem recomendações de sites com descrições, categorias e tags.

## Motivação

Centralizar uma curadoria de sites úteis para a comunidade de desenvolvedores e designers, facilitando a descoberta de ferramentas, recursos educacionais e plataformas relevantes.

## Arquitetura

### 1. Tabela do Banco de Dados

#### `recommended_sites`
Armazena informações sobre sites recomendados.

```sql
CREATE TABLE public.recommended_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  image_url TEXT,
  favicon_url TEXT,
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT,
  category TEXT,
  tags TEXT[],
  is_published BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  clicks_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Campos principais:**
- `title`: Nome do site
- `slug`: URL-friendly identifier
- `description`: Descrição breve do site
- `url`: URL completa do site
- `image_url`: Imagem de capa (opcional)
- `favicon_url`: Ícone do site (opcional)
- `category`: Categoria (development, design, ai, learning, tools)
- `tags`: Array de tags para busca
- `views_count`: Contador de visualizações
- `clicks_count`: Contador de cliques no link

**Políticas RLS:**
- Leitura pública para sites publicados
- Usuários autenticados podem criar/editar/deletar seus próprios sites

### 2. Páginas

#### `/recommended-sites` - Listagem Pública
- Grid de cards com sites recomendados
- Busca por título/descrição
- Filtros por categoria
- Contador de visualizações e cliques
- Click abre site em nova aba

#### `/sites-manager` - Gerenciamento Admin
- CRUD completo de sites
- Upload de imagem de capa
- Campo para favicon URL
- Editor de categorias e tags
- Toggle de publicação
- Estatísticas de views e clicks

### 3. Integração no Blog

Nova aba "Sites Úteis" no sistema de abas do Blog:
- Acesso via `/blog` → aba "Sites Úteis"
- Grid de cards (limitado a 12 sites)
- Botão "Ver Todos" leva para `/recommended-sites`
- Click no card abre site em nova aba

## Categorias Implementadas

### 📚 Development (8 sites)
- Coss.co - Navbar Components
- HTML Mailto - Guia Rápido
- Lightswind UI - 100+ Animated Components
- Mocha - Testing Framework
- React Bits - Animated UI Components
- ReUI - React UI Library
- Sails.js - Framework MVC para Node.js
- VS Code Extension - Code with AI

### 📖 Learning (5 sites)
- Altura - Cursos de Tecnologia
- DesignCourse - YouTube
- Dev Samurai - Cursos e Tutoriais
- HTTP Cats
- Prompt Vibe Coding v2.0

### 🛠️ Tools (5 sites)
- Adobe Speech Enhancer
- Apify Console
- Brevo (ex-Sendinblue)
- Google Cloud APIs Console
- PSIE - Consulta de Instrumentos

### 🤖 AI (4 sites)
- Generative Session - Runway
- Google Gemini
- LMArena - Benchmark & Compare AI Models
- Lovart - Design Agent

### 🎨 Design (3 sites)
- Aceternity UI - Components
- Artisanal Sweets Ordering UI
- Lordicon - 37,200+ Animated Icons

**Total: 25 sites recomendados**

## Fluxo de Dados

### Criação de Site Recomendado
```
Admin acessa /sites-manager
  ↓
Clica em "Novo Site"
  ↓
Preenche formulário:
  - Título, slug, URL
  - Descrição
  - Categoria, tags
  - Imagem de capa (opcional)
  - Favicon URL (opcional)
  ↓
Toggle "Publicar site"
  ↓
Salva no banco de dados
  ↓
Site aparece em /recommended-sites
```

### Visualização por Usuário
```
Usuário acessa /blog
  ↓
Clica na aba "Sites Úteis"
  ↓
Vê grid de sites (12 primeiros)
  ↓
Clica em um site
  ↓
Contador de cliques incrementado
  ↓
Site abre em nova aba
```

## Recursos Implementados

### 1. Sistema de Busca e Filtros
- Busca por título e descrição
- Filtros por categoria
- Tags para organização

### 2. Upload de Imagens
- Drag & drop ou seleção de arquivo
- URL externa de imagem
- Preview antes de salvar
- Validação de tipo e tamanho (máx 5MB)
- Armazenamento em `images/recommended-sites/`

### 3. Favicon Support
- Campo para URL do favicon
- Exibido ao lado do título nos cards

### 4. Estatísticas
- Contador de visualizações (views_count)
- Contador de cliques (clicks_count)
- Funções `increment_site_views()` e `increment_site_clicks()`

### 5. Categorias com Ícones
- development: 💻
- design: 🎨
- ai: 🤖
- learning: 📚
- tools: 🛠️

## Configuração Necessária

### 1. Aplicar Migração
```bash
# Via MCP Supabase (já aplicado)
# Ou via Supabase CLI
supabase db push
```

### 2. Criar Bucket de Imagens
Se ainda não existir:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true);
```

### 3. Configurar RLS no Storage
```sql
CREATE POLICY "Imagens públicas são visíveis para todos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images');

CREATE POLICY "Usuários autenticados podem fazer upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');
```

## Rotas Implementadas

```typescript
// Públicas
<Route path="/recommended-sites" element={<RecommendedSites />} />

// Admin (requer autenticação)
<Route path="/sites-manager" element={<SitesManager />} />
```

## Integração no Dashboard

Adicionar link no Dashboard admin:

```typescript
<Button onClick={() => navigate('/sites-manager')}>
  <Star className="h-4 w-4 mr-2" />
  Gerenciar Sites Recomendados
</Button>
```

## Navegação Atualizada

**Blog (7 abas):**
1. Todos - Posts do blog
2. Tecnologia - Categoria de posts
3. Novidades IDEs - News de IDEs
4. Workflows - Workflows e automações
5. MCP Servers - Servidores MCP
6. Sites Úteis - Sites recomendados ⭐ NOVO
7. Gerador VPS - Ferramenta VPS

## Melhorias Futuras

- [ ] Sistema de votação/favoritos
- [ ] Comentários nos sites
- [ ] Verificação de links quebrados
- [ ] Screenshot automático dos sites
- [ ] Busca de favicon automática via API
- [ ] Categorias customizáveis
- [ ] Subcategorias
- [ ] Ranking por popularidade
- [ ] Integração com Open Graph para metadados
- [ ] Sistema de badges (Verificado, Popular, Novo)

## Arquivos Relacionados

- `supabase/migrations/20260128030000_recommended_sites_system.sql` - Migração do BD
- `src/pages/RecommendedSites.tsx` - Listagem pública
- `src/pages/SitesManager.tsx` - Gerenciamento admin
- `src/pages/Blog.tsx` - Integração na aba
- `src/App.tsx` - Rotas
- `src/integrations/supabase/types.ts` - Tipos TypeScript
- `.context/docs/recommended-sites-system.md` - Esta documentação

## Exemplos de Uso

### Adicionar Novo Site via Admin

1. Acesse `/sites-manager`
2. Clique em "Novo Site"
3. Preencha:
   - Título: "Tailwind CSS"
   - Slug: "tailwindcss"
   - URL: "https://tailwindcss.com"
   - Descrição: "Framework CSS utility-first"
   - Categoria: "development"
   - Tags: "css, tailwind, framework"
4. Upload de imagem (opcional)
5. Ative "Publicar site"
6. Clique em "Criar"

### Buscar Sites

1. Acesse `/recommended-sites`
2. Use a barra de busca para filtrar
3. Clique em categorias para filtrar
4. Click em um card para visitar o site

## Estatísticas

- **Total de sites:** 25
- **Categorias:** 5
- **Sites por categoria:**
  - Development: 8
  - Learning: 5
  - Tools: 5
  - AI: 4
  - Design: 3

## Referências

- Sites da lista fornecida pelo usuário
- Inspiração em Product Hunt e Hacker News
- Design baseado no sistema de Workflows e MCP Servers
