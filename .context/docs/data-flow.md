# Data Flow

> Fluxo de dados, modelos, APIs e gerenciamento de estado no Vibe Flow.

## Data Models & Schemas

### Supabase Database Schema

#### site_config
Configurações globais do site (singleton):
```typescript
interface SiteConfig {
  id: string;
  company_info: CompanyInfo;
  social_media: SocialMedia;
  footer_content: FooterContent;
  testimonials: Testimonial[];
  chat_assistant: ChatAssistantConfig;
  analytics: AnalyticsConfig;
  created_at: string;
  updated_at: string;
}
```

#### portfolio_items
Itens do portfólio:
```typescript
interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
  category: string;
  tags: string[];
  created_at: string;
}
```

#### contact_messages
Mensagens do formulário de contato:
```typescript
interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  created_at: string;
}
```

#### blog_posts
Posts do blog:
```typescript
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author_id: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}
```

## API Endpoints & Purposes

### Supabase REST API

Todas as operações usam o cliente Supabase que gera requests REST automaticamente:


**GET /rest/v1/site_config**
- Busca configurações do site
- Público (RLS permite leitura)
- Cache via TanStack Query

**PATCH /rest/v1/site_config**
- Atualiza configurações
- Requer role admin
- Invalidação de cache automática

**GET /rest/v1/portfolio_items**
- Lista itens do portfólio
- Público com filtros opcionais
- Ordenação por created_at desc

**POST /rest/v1/portfolio_items**
- Cria novo item
- Requer autenticação admin
- Upload de imagem via Storage API

**GET /rest/v1/contact_messages**
- Lista mensagens de contato
- Apenas admins
- Filtros por status

**POST /rest/v1/contact_messages**
- Cria nova mensagem
- Público (rate limited)
- Validação via Zod

### External APIs

**n8n Webhook (Chat Assistant)**
```
POST https://[n8n-instance]/webhook/[webhook-id]
Body: { message: string, sessionId: string }
Response: { reply: string, suggestions?: string[] }
```

**Google Analytics 4**
```javascript
gtag('event', 'page_view', {
  page_title: document.title,
  page_location: window.location.href
});
```

## Data Transformation Pipelines

### Site Config Pipeline
```
Supabase DB (JSONB)
  ↓
useSiteConfig hook
  ↓
TanStack Query cache
  ↓
React components (typed)
```

### Portfolio Upload Pipeline
```
User selects image
  ↓
File validation (size, type)
  ↓
Supabase Storage upload
  ↓
Get public URL
  ↓
Create portfolio_items record
  ↓
Invalidate query cache
  ↓
UI updates optimistically
```

### Contact Form Pipeline
```
User submits form
  ↓
React Hook Form validation
  ↓
Zod schema validation
  ↓
POST to contact_messages
  ↓
Toast notification
  ↓
Form reset
  ↓
(Optional) Email notification via n8n
```

## State Management Approach

### Local State (useState)
Usado para:
- UI state (modals, dropdowns)
- Form inputs temporários
- Loading states locais

### Server State (TanStack Query)
Usado para:
- Dados do Supabase
- Cache e sincronização
- Optimistic updates
- Background refetch


### Global State (React Context)
Usado para:
- Autenticação (AuthProvider)
- User session
- Role-based access control

### Query Keys Strategy
```typescript
// Padrão de chaves hierárquicas
['site-config']                    // Config geral
['portfolio']                      // Todos os itens
['portfolio', { category }]        // Filtrado
['contact-messages']               // Todas as mensagens
['contact-messages', { status }]   // Por status
['blog-posts']                     // Todos os posts
['blog-post', slug]                // Post específico
```

## External Data Sources

### Supabase Storage
- **Bucket**: `portfolio-images`
- **Public access**: true
- **Max size**: 5MB por arquivo
- **Formatos**: jpg, png, webp, gif
- **CDN**: Automático via Supabase

### n8n Workflows
- **Chat processing**: LLM integration
- **Email notifications**: Contact form alerts
- **Analytics**: Custom event tracking
- **Webhooks**: Third-party integrations

### Google Analytics
- **Property ID**: Configurável via Settings
- **Events tracked**:
  - page_view
  - form_submit
  - chat_message
  - cta_click
  - portfolio_view

## Data Sinks

### Supabase Database
Destino principal para:
- User-generated content
- Configuration changes
- Analytics events (futuro)

### Browser Storage
- **localStorage**: Supabase auth tokens
- **sessionStorage**: Temporary UI state
- **IndexedDB**: TanStack Query cache (futuro)

### External Services
- **n8n**: Event forwarding
- **Google Analytics**: Tracking data
- **Email providers**: Via n8n (SendGrid, etc)

## Error Handling

### Network Errors
```typescript
try {
  const { data, error } = await supabase
    .from('table')
    .select();
  
  if (error) throw error;
  return data;
} catch (error) {
  toast({
    title: "Erro ao carregar dados",
    description: error.message,
    variant: "destructive"
  });
}
```

### Validation Errors
```typescript
const schema = z.object({
  email: z.string().email("Email inválido"),
  message: z.string().min(10, "Mensagem muito curta")
});

// React Hook Form + Zod
const form = useForm({
  resolver: zodResolver(schema)
});
```

### Auth Errors
```typescript
const { error } = await supabase.auth.signIn({ email, password });

if (error?.message === 'Invalid login credentials') {
  toast({ title: "Credenciais inválidas" });
}
```

## Performance Optimizations

### Query Caching
- Stale time: 5 minutos (site_config)
- Cache time: 30 minutos
- Refetch on window focus: true

### Optimistic Updates
```typescript
const mutation = useMutation({
  mutationFn: updateConfig,
  onMutate: async (newConfig) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['site-config']);
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(['site-config']);
    
    // Optimistically update
    queryClient.setQueryData(['site-config'], newConfig);
    
    return { previous };
  },
  onError: (err, newConfig, context) => {
    // Rollback on error
    queryClient.setQueryData(['site-config'], context.previous);
  }
});
```

### Debouncing
- Search inputs: 300ms
- Auto-save: 1000ms
- Scroll events: 100ms
