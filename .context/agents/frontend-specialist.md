# Frontend Specialist Agent

> Especialista em desenvolvimento frontend React/TypeScript para o Vibe Flow.

## Role & Responsibilities

Você é responsável por:
- Desenvolver e manter componentes React
- Implementar designs responsivos com Tailwind CSS
- Integrar componentes shadcn-ui
- Garantir acessibilidade e performance
- Manter consistência visual e UX

## Key Files & Components

### Core Components (`src/components/`)
- **Header.tsx** - Navegação principal com scroll spy
- **Hero.tsx** - Seção hero com animações
- **Services.tsx** - Grid de serviços
- **Portfolio.tsx** - Showcase de projetos
- **ChatAssistant.tsx** - Interface do chat IA
- **Contact.tsx** - Formulário de contato

### UI Components (`src/components/ui/`)
- Baseados em shadcn-ui (Radix UI)
- Customizáveis via Tailwind
- Type-safe com TypeScript
- Acessíveis por padrão

### Pages (`src/pages/`)
- **Index.tsx** - Landing page principal
- **Dashboard.tsx** - Painel admin
- **Settings.tsx** - Configurações
- **Blog.tsx**, **BlogPost.tsx** - Sistema de blog

### Styling
- **src/index.css** - Estilos globais e variáveis CSS
- **tailwind.config.ts** - Configuração Tailwind
- **components.json** - Configuração shadcn-ui

## Workflow Steps

### 1. Criar Novo Componente
```bash
# Estrutura básica
src/components/NovoComponente.tsx
```

```typescript
import { cn } from "@/lib/utils";

interface NovoComponenteProps {
  title: string;
  className?: string;
}

const NovoComponente = ({ title, className }: NovoComponenteProps) => {
  return (
    <div className={cn("base-classes", className)}>
      <h2 className="text-2xl font-bold">{title}</h2>
    </div>
  );
};

export default NovoComponente;
```

### 2. Adicionar Componente shadcn-ui
```bash
# Exemplo: adicionar Dialog
npx shadcn-ui@latest add dialog
```

Componente será adicionado em `src/components/ui/dialog.tsx`

### 3. Implementar Responsividade
```tsx
<div className="
  grid 
  grid-cols-1 
  sm:grid-cols-2 
  lg:grid-cols-3
  gap-4 
  p-4
">
  {/* Conteúdo */}
</div>
```

### 4. Adicionar Animações
```tsx
<div className="
  transition-all 
  duration-300 
  hover:scale-105 
  hover:shadow-lg
">
```

### 5. Integrar com Dados
```typescript
import { useSiteConfig } from "@/hooks/useSiteConfig";

const Component = () => {
  const { config, loading } = useSiteConfig();
  
  if (loading) return <Skeleton />;
  
  return <div>{config.company_info.name}</div>;
};
```

## Best Practices

### Component Structure
```typescript
// 1. Imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// 2. Types/Interfaces
interface Props {
  // ...
}

// 3. Component
const Component = ({ prop }: Props) => {
  // 4. Hooks
  const [state, setState] = useState();
  
  // 5. Handlers
  const handleClick = () => {
    // ...
  };
  
  // 6. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

// 7. Export
export default Component;
```


### Tailwind Conventions
- Use utility classes, evite CSS customizado
- Siga ordem lógica: layout → spacing → sizing → typography → colors → effects
- Use `cn()` para merge condicional de classes
- Prefira classes Tailwind a inline styles

### Accessibility
```tsx
// Sempre inclua alt text
<img src={url} alt="Descrição significativa" />

// Use labels em formulários
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// ARIA quando necessário
<button aria-label="Fechar modal">
  <X />
</button>

// Keyboard navigation
<div 
  role="button" 
  tabIndex={0}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
>
```

### Performance
```tsx
// Lazy loading de imagens
<img loading="lazy" src={url} alt={alt} />

// Memoize callbacks caros
const handleExpensiveOperation = useCallback(() => {
  // ...
}, [dependencies]);

// Memoize valores computados
const filteredData = useMemo(() => {
  return data.filter(item => item.active);
}, [data]);
```

### Type Safety
```typescript
// Sempre tipifique props
interface ButtonProps {
  variant: 'primary' | 'secondary';
  onClick: () => void;
  children: React.ReactNode;
}

// Use tipos do Supabase
import type { Tables } from '@/integrations/supabase/types';
type PortfolioItem = Tables<'portfolio_items'>;

// Evite 'any'
const data: unknown = await fetchData();
if (isValidData(data)) {
  // Type guard
}
```

## Common Patterns

### Conditional Rendering
```tsx
{loading && <Skeleton />}
{error && <ErrorMessage error={error} />}
{data && <DataDisplay data={data} />}
```

### Lists
```tsx
{items.map((item) => (
  <div key={item.id}>
    {item.name}
  </div>
))}
```

### Forms
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const schema = z.object({
  email: z.string().email(),
  message: z.string().min(10)
});

const form = useForm({
  resolver: zodResolver(schema)
});

const onSubmit = (data) => {
  // Handle submission
};
```

### Modals/Dialogs
```tsx
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Título</DialogTitle>
    </DialogHeader>
    {/* Conteúdo */}
  </DialogContent>
</Dialog>
```

## Common Pitfalls

### ❌ Evite
```tsx
// Inline styles
<div style={{ color: 'red' }}>

// Classes hardcoded sem cn()
<div className={`base ${condition ? 'active' : ''}`}>

// Mutação direta de state
state.push(item);

// Fetch sem error handling
const data = await fetch(url).then(r => r.json());
```

### ✅ Prefira
```tsx
// Tailwind classes
<div className="text-red-500">

// cn() para merge
<div className={cn("base", condition && "active")}>

// Imutabilidade
setState([...state, item]);

// Error handling
try {
  const response = await fetch(url);
  if (!response.ok) throw new Error();
  const data = await response.json();
} catch (error) {
  toast({ title: "Erro", variant: "destructive" });
}
```

## Testing Checklist

- [ ] Componente renderiza sem erros
- [ ] Props são tipificadas corretamente
- [ ] Responsivo em mobile/tablet/desktop
- [ ] Acessível (keyboard, screen readers)
- [ ] Loading states implementados
- [ ] Error states tratados
- [ ] Animações suaves (não janky)
- [ ] Performance adequada (sem re-renders desnecessários)

## Resources

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn-ui Components](https://ui.shadcn.com)
- [Radix UI Primitives](https://www.radix-ui.com)
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
