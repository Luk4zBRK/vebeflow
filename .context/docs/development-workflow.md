# Development Workflow

> Processo de desenvolvimento, convenções e práticas recomendadas para o Vibe Flow.

## Daily Development Flow

### 1. Setup Inicial
```bash
# Clone e instale dependências
git clone <repo-url>
cd stream-solutions-hub-main
npm install

# Inicie o dev server
npm run dev
```

### 2. Desenvolvimento Local
- Servidor roda em `http://localhost:5173`
- Hot Module Replacement (HMR) automático
- Erros aparecem no browser e console

### 3. Estrutura de Branches
```
main (produção)
  ↓
develop (staging)
  ↓
feature/nome-da-feature
fix/nome-do-bug
```

### 4. Workflow de Feature
```bash
# Crie branch da develop
git checkout develop
git pull origin develop
git checkout -b feature/nova-funcionalidade

# Desenvolva e teste
npm run dev
# ... faça suas alterações ...

# Lint antes de commitar
npm run lint

# Commit seguindo Conventional Commits
git add .
git commit -m "feat(components): adiciona novo componente X"

# Push e abra PR
git push origin feature/nova-funcionalidade
```

## Conventional Commits

Formato: `<type>(<scope>): <description>`

### Types
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação (não afeta código)
- `refactor`: Refatoração
- `perf`: Melhoria de performance
- `test`: Testes
- `chore`: Tarefas de manutenção

### Scopes Comuns
- `components`: Componentes React
- `pages`: Páginas/rotas
- `hooks`: Custom hooks
- `api`: Integrações API
- `ui`: Componentes UI
- `auth`: Autenticação
- `config`: Configurações

### Exemplos
```bash
feat(components): adiciona componente ChatAssistant
fix(auth): corrige logout não limpando session
docs(readme): atualiza instruções de setup
refactor(hooks): simplifica lógica do useSiteConfig
perf(images): adiciona lazy loading em Portfolio
```

## Code Organization

### Criando Novo Componente
```bash
# Estrutura recomendada
src/components/
  NomeComponente.tsx    # Componente principal
  
# Se complexo, criar pasta
src/components/NomeComponente/
  index.tsx             # Export principal
  NomeComponente.tsx    # Componente
  types.ts              # Tipos específicos
  utils.ts              # Utilitários
```

### Criando Nova Page
```typescript
// src/pages/NovaPage.tsx
import { useAuth } from "@/hooks/useAuth";

const NovaPage = () => {
  const { user } = useAuth();
  
  return (
    <div className="container mx-auto p-4">
      <h1>Nova Página</h1>
    </div>
  );
};

export default NovaPage;
```


```typescript
// Adicione rota em App.tsx
import NovaPage from "./pages/NovaPage";

<Routes>
  {/* ... outras rotas ... */}
  <Route path="/nova-page" element={<NovaPage />} />
</Routes>
```

### Criando Custom Hook
```typescript
// src/hooks/useMinhaFuncionalidade.tsx
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useMinhaFuncionalidade = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('tabela')
        .select('*');
      
      if (!error) setData(data);
      setLoading(false);
    };

    fetchData();
  }, []);

  return { data, loading };
};
```

## Testing Strategy

### Manual Testing Checklist
- [ ] Funcionalidade funciona no desktop
- [ ] Funcionalidade funciona no mobile
- [ ] Formulários validam corretamente
- [ ] Erros são tratados gracefully
- [ ] Loading states aparecem
- [ ] Toast notifications funcionam
- [ ] Navegação funciona
- [ ] Auth protege rotas corretas

### Browser Testing
- Chrome (principal)
- Firefox
- Safari (se possível)
- Mobile browsers (Chrome/Safari)

### Responsiveness Breakpoints
```css
/* Tailwind breakpoints */
sm: 640px   /* Tablet portrait */
md: 768px   /* Tablet landscape */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

## Supabase Workflow

### Criando Nova Tabela
```sql
-- supabase/migrations/YYYYMMDDHHMMSS_nome_tabela.sql
create table public.nova_tabela (
  id uuid default gen_random_uuid() primary key,
  campo1 text not null,
  campo2 jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS policies
alter table public.nova_tabela enable row level security;

create policy "Public read access"
  on public.nova_tabela for select
  using (true);

create policy "Admin write access"
  on public.nova_tabela for all
  using (auth.jwt() ->> 'role' = 'admin');
```

### Gerando Tipos TypeScript
```bash
# Após criar/modificar tabelas
npx supabase gen types typescript --project-id zarigqmtaexgcayzfqpt > src/integrations/supabase/types.ts
```

## Styling Guidelines

### Tailwind Classes Order
```tsx
<div className="
  /* Layout */
  flex items-center justify-between
  /* Spacing */
  p-4 gap-2
  /* Sizing */
  w-full h-auto
  /* Typography */
  text-lg font-semibold
  /* Colors */
  bg-white text-gray-900
  /* Borders */
  border border-gray-200 rounded-lg
  /* Effects */
  shadow-md hover:shadow-lg
  /* Transitions */
  transition-all duration-200
">
```

### Component Styling Pattern
```tsx
// Use cn() para merge condicional
import { cn } from "@/lib/utils";

<Button 
  className={cn(
    "base-classes",
    variant === "primary" && "primary-classes",
    disabled && "disabled-classes"
  )}
/>
```

### Responsive Design
```tsx
<div className="
  grid 
  grid-cols-1 
  md:grid-cols-2 
  lg:grid-cols-3
  gap-4
">
```

## Performance Best Practices

### Image Optimization
```tsx
<img 
  src={imageUrl}
  alt="Description"
  loading="lazy"
  className="w-full h-auto"
/>
```

### Code Splitting (Futuro)
```tsx
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>
```

### Memoization
```tsx
import { useMemo, useCallback } from 'react';

// Valores computados caros
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Callbacks estáveis
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

## Debugging Tips

### React DevTools
- Instale extensão React DevTools
- Inspecione component tree
- Verifique props e state
- Profile performance

### Supabase Debugging
```typescript
// Habilite logs detalhados
const { data, error } = await supabase
  .from('table')
  .select('*');

console.log('Supabase response:', { data, error });
```

### Network Debugging
- Abra DevTools > Network
- Filtre por XHR/Fetch
- Verifique requests Supabase
- Cheque status codes e payloads

## Common Issues & Solutions

### Build Errors
```bash
# Limpe cache e reinstale
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Type Errors
```bash
# Regenere tipos Supabase
npx supabase gen types typescript --project-id zarigqmtaexgcayzfqpt > src/integrations/supabase/types.ts
```

### Auth Issues
```typescript
// Verifique session
const { data: { session } } = await supabase.auth.getSession();
console.log('Current session:', session);

// Force refresh
await supabase.auth.refreshSession();
```

## Deployment

### Via Lovable (Automático)
1. Commit e push para main
2. Lovable detecta mudanças
3. Build automático
4. Deploy para CDN
5. URL atualizada

### Manual Build
```bash
npm run build
# Arquivos em dist/ prontos para deploy
```

## Code Review Checklist

- [ ] Código segue convenções do projeto
- [ ] Commits seguem Conventional Commits
- [ ] Sem console.logs desnecessários
- [ ] Tipos TypeScript corretos
- [ ] Componentes responsivos
- [ ] Erros tratados adequadamente
- [ ] Loading states implementados
- [ ] Acessibilidade básica (alt text, labels)
- [ ] Performance considerada
- [ ] Documentação atualizada se necessário
