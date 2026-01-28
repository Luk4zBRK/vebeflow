# Architecture

> Visão geral da arquitetura técnica do Vibe Flow, incluindo componentes, padrões e decisões de design.

## High-Level Architecture

O Vibe Flow segue uma arquitetura **SPA (Single Page Application)** com backend-as-a-service (Supabase), organizada em camadas:

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                      │
├─────────────────────────────────────────────────────────┤
│  React Components (UI Layer)                             │
│  ├─ Pages (Index, Dashboard, Settings)                   │
│  ├─ Components (Header, Hero, Services, etc)             │
│  └─ UI Components (shadcn-ui/Radix)                      │
├─────────────────────────────────────────────────────────┤
│  State Management & Data Layer                           │
│  ├─ Custom Hooks (useAuth, useSiteConfig, usePortfolio) │
│  ├─ TanStack Query (cache, sync, mutations)             │
│  └─ React Context (AuthProvider)                         │
├─────────────────────────────────────────────────────────┤
│  Integration Layer                                       │
│  ├─ Supabase Client (auth, database, storage)           │
│  ├─ n8n Webhook (chat assistant)                         │
│  └─ Google Analytics (tracking)                          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Supabase (Backend Services)                 │
│  ├─ PostgreSQL Database (site_config, contacts, etc)    │
│  ├─ Authentication (JWT, RLS policies)                   │
│  ├─ Storage (imagens, assets)                            │
│  └─ Realtime (subscriptions)                             │
└─────────────────────────────────────────────────────────┘
```

## Key Components and Responsibilities

### 1. Presentation Layer (Components)

#### Pages (`src/pages/`)
- **Index.tsx** - Landing page principal, orquestra todos os componentes públicos
- **Dashboard.tsx** - Painel administrativo com visão geral
- **Settings.tsx** - Configurações do site (empresa, integrações, depoimentos)
- **Auth.tsx** - Página de login/registro
- **Blog.tsx**, **BlogPost.tsx**, **BlogManager.tsx** - Sistema de blog
- **PortfolioManager.tsx** - Gestão de itens do portfólio
- **ContactForms.tsx** - Visualização de mensagens de contato
- **Analytics.tsx** - Dashboard de métricas

#### Core Components (`src/components/`)
- **Header.tsx** - Navegação principal com scroll spy
- **Hero.tsx** - Seção hero com animações e CTAs
- **About.tsx** - Seção sobre a empresa
- **Services.tsx** - Vitrine de serviços oferecidos
- **Portfolio.tsx** - Showcase de projetos/cases
- **Benefits.tsx** - Benefícios e diferenciais
- **Partners.tsx** - Carrossel de logos de parceiros
- **ChatAssistant.tsx** - Interface do chat com IA
- **Contact.tsx** - Formulário de contato
- **Footer.tsx** - Rodapé com links e informações

#### UI Components (`src/components/ui/`)
Componentes shadcn-ui baseados em Radix UI:
- Formulários: Button, Input, Textarea, Select, Checkbox, etc
- Overlays: Dialog, Sheet, Popover, Tooltip, AlertDialog
- Navegação: Tabs, Accordion, NavigationMenu
- Feedback: Toast, Sonner, Alert, Progress
- Layout: Card, Separator, ScrollArea, Sidebar

### 2. State Management Layer

#### Custom Hooks (`src/hooks/`)

**useAuth.tsx**
- Gerencia autenticação via Supabase
- Provê contexto global de usuário (AuthProvider)
- Controla roles (user/admin) e permissões
- Funções: signIn, signUp, signOut, checkRole

**useSiteConfig.tsx**
- Busca e atualiza configurações do site (tabela `site_config`)
- Atualização otimista com TanStack Query
- Estrutura: company_info, social_media, footer_content, testimonials, chat_assistant, analytics

**usePortfolio.tsx**
- CRUD de itens do portfólio
- Upload de imagens via Supabase Storage
- Integração com TanStack Query para cache

**useAnalytics.tsx**
- Inicializa Google Analytics 4
- Tracking de pageviews e eventos customizados
- Configuração dinâmica via site_config

**useComments.ts**, **useNewsletter.ts**, **useChangelogNews.ts**
- Hooks específicos para funcionalidades do blog

**useToast.ts**
- Sistema de notificações toast
- Reducer pattern para gerenciar fila de toasts

#### React Context
- **AuthProvider** - Contexto global de autenticação
- Outros estados são locais ou gerenciados via TanStack Query

### 3. Data Flow

#### Supabase Integration (`src/integrations/supabase/`)

**client.ts**
```typescript
export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);
```

**types.ts**
- Tipos TypeScript gerados automaticamente do schema Supabase
- Interfaces: Database, Tables, TablesInsert, TablesUpdate, Enums

#### Data Fetching Pattern
```typescript
// Exemplo: useSiteConfig
const { data: config } = useQuery({
  queryKey: ['site-config'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('site_config')
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }
});
```

#### Mutation Pattern
```typescript
// Exemplo: atualização otimista
const mutation = useMutation({
  mutationFn: async (newConfig) => {
    const { error } = await supabase
      .from('site_config')
      .update(newConfig)
      .eq('id', configId);
    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries(['site-config']);
    toast({ title: "Configurações atualizadas!" });
  }
});
```

## Design Patterns

### 1. Component Composition
Componentes pequenos e reutilizáveis compostos em páginas maiores:
```tsx
<Index>
  <Header />
  <Hero />
  <About />
  <Services />
  <Portfolio />
  <Benefits />
  <ChatAssistant />
  <Partners />
  <Contact />
  <Footer />
</Index>
```

### 2. Custom Hooks Pattern
Lógica de negócio encapsulada em hooks reutilizáveis:
- Separação de concerns (UI vs lógica)
- Testabilidade
- Reutilização entre componentes

### 3. Compound Components
Componentes UI complexos com subcomponentes:
```tsx
<Dialog>
  <DialogTrigger />
  <DialogContent>
    <DialogHeader>
      <DialogTitle />
    </DialogHeader>
  </DialogContent>
</Dialog>
```

### 4. Protected Routes
Controle de acesso via HOC/wrapper:
```tsx
// Em App.tsx
<Route path="/dashboard" element={
  <ProtectedRoute requiredRole="admin">
    <Dashboard />
  </ProtectedRoute>
} />
```

### 5. Optimistic Updates
Atualizações otimistas para melhor UX:
- UI atualiza imediatamente
- Rollback em caso de erro
- Sincronização com servidor via TanStack Query

## Technology Stack Decisions

### Por que React + TypeScript?
- **React**: Ecossistema maduro, componentes reutilizáveis, performance
- **TypeScript**: Type safety, melhor DX, menos bugs em produção
- **Vite**: Build ultra-rápido, HMR instantâneo, melhor que CRA

### Por que Supabase?
- **Backend completo** sem gerenciar servidores
- **PostgreSQL** robusto com RLS nativo
- **Auth integrado** com JWT e roles
- **Realtime** para features futuras
- **Storage** para uploads de imagens
- **Custo-benefício** para MVP e escala inicial

### Por que shadcn-ui?
- **Componentes copiáveis** (não biblioteca npm)
- **Customização total** via Tailwind
- **Acessibilidade** (Radix UI)
- **Type-safe** com TypeScript
- **Sem vendor lock-in**

### Por que TanStack Query?
- **Cache inteligente** reduz requests
- **Sincronização automática** entre tabs
- **Optimistic updates** nativos
- **DevTools** para debugging
- **Padrão da indústria** para data fetching

### Por que n8n para Chat?
- **Flexibilidade** para mudar LLM providers
- **Workflows visuais** sem código
- **Integrações** com múltiplos serviços
- **Self-hosted** ou cloud
- **Controle total** sobre lógica de negócio

## Security Architecture

### Row Level Security (RLS)
Políticas Supabase garantem acesso seguro:
```sql
-- Exemplo: site_config
CREATE POLICY "Public read access"
  ON site_config FOR SELECT
  USING (true);

CREATE POLICY "Admin write access"
  ON site_config FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin');
```

### Authentication Flow
1. Usuário faz login via Supabase Auth
2. JWT armazenado em localStorage
3. Token incluído automaticamente em requests
4. RLS valida permissões no banco
5. Frontend valida role para UI condicional

### Environment Variables
- Chaves públicas hardcoded (seguro para Supabase anon key)
- Chaves privadas apenas no servidor (n8n webhook)
- Nunca commitar secrets no git

## Performance Considerations

### Code Splitting
- React Router lazy loading (futuro)
- Componentes carregados sob demanda

### Image Optimization
- `loading="lazy"` em imagens
- Supabase Storage com CDN
- Formatos modernos (WebP)

### Bundle Size
- Tree-shaking automático (Vite)
- Componentes shadcn-ui apenas os usados
- Análise via `npm run build`

### Caching Strategy
- TanStack Query cache em memória
- Stale-while-revalidate pattern
- Invalidação seletiva de queries

## Scalability

### Frontend
- SPA estático servido via CDN
- Sem servidor Node.js necessário
- Escala horizontalmente sem esforço

### Backend (Supabase)
- PostgreSQL gerenciado com auto-scaling
- Connection pooling nativo
- Read replicas para leitura pesada

### Future Considerations
- Server-side rendering (Next.js migration)
- Edge functions para lógica customizada
- Realtime subscriptions para features colaborativas

## Deployment Architecture

```
┌─────────────────┐
│   Lovable CDN   │ ← Build estático (Vite)
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Supabase Cloud │ ← Database, Auth, Storage
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   n8n Webhook   │ ← Chat assistant processing
└─────────────────┘
```

### Build Process
1. `npm run build` → Vite compila para `dist/`
2. Lovable faz deploy automático do `dist/`
3. CDN serve assets estáticos globalmente
4. DNS aponta para CDN

### CI/CD
- Commits no repo → Lovable auto-deploy
- Sem pipeline manual necessário
- Preview deployments para branches

## Monitoring & Observability

### Client-side
- Google Analytics 4 para métricas de uso
- Console logs para debugging (remover em prod)
- Error boundaries para captura de erros React

### Server-side (Supabase)
- Dashboard Supabase para queries lentas
- Auth logs para tentativas de login
- Storage metrics para uso de banda

### Future Improvements
- Sentry para error tracking
- LogRocket para session replay
- Lighthouse CI para performance monitoring
