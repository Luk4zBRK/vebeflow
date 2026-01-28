# Testing Strategy

> Estratégia de testes e quality assurance para o Vibe Flow.

## Current State

O projeto atualmente **não possui testes automatizados**. Todos os testes são manuais.

## Manual Testing

### Testing Checklist

#### Landing Page (Público)
- [ ] Hero section carrega e anima corretamente
- [ ] Navegação scroll spy funciona
- [ ] Todos os links funcionam
- [ ] Formulário de contato valida e envia
- [ ] Chat assistant abre e responde
- [ ] Imagens carregam com lazy loading
- [ ] Responsivo em mobile/tablet/desktop
- [ ] Performance adequada (< 3s load)

#### Admin Panel
- [ ] Login/logout funciona
- [ ] Apenas admins acessam rotas protegidas
- [ ] Configurações salvam corretamente
- [ ] Upload de imagens funciona
- [ ] Mensagens de contato aparecem
- [ ] Dashboard mostra dados corretos
- [ ] Toast notifications aparecem

#### Cross-Browser
- [ ] Chrome (principal)
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers

### Manual Test Scenarios

**Scenario 1: Visitante envia contato**
1. Acesse landing page
2. Scroll até formulário de contato
3. Preencha campos (nome, email, mensagem)
4. Clique em enviar
5. Verifique toast de sucesso
6. Verifique mensagem no admin panel

**Scenario 2: Admin atualiza configurações**
1. Login como admin
2. Navegue para Settings
3. Atualize company_info
4. Salve mudanças
5. Verifique toast de sucesso
6. Recarregue página
7. Verifique mudanças persistiram

**Scenario 3: Upload de portfólio**
1. Login como admin
2. Navegue para Portfolio Manager
3. Clique em adicionar item
4. Upload imagem (< 5MB)
5. Preencha título e descrição
6. Salve
7. Verifique item aparece na landing page

## Future Testing Strategy

### Unit Tests (Futuro)

**Framework**: Vitest + React Testing Library

```typescript
// Exemplo: src/lib/utils.test.ts
import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility', () => {
  it('merges classes correctly', () => {
    expect(cn('base', 'extra')).toBe('base extra');
  });
  
  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden')).toBe('base');
  });
});
```

**Coverage Target**: 70%+ para utils e hooks

### Component Tests (Futuro)

```typescript
// Exemplo: src/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './ui/button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

### Integration Tests (Futuro)

```typescript
// Exemplo: src/hooks/useSiteConfig.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSiteConfig } from './useSiteConfig';

describe('useSiteConfig', () => {
  it('fetches config successfully', async () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
    
    const { result } = renderHook(() => useSiteConfig(), { wrapper });
    
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.config).toBeDefined();
  });
});
```

### E2E Tests (Futuro)

**Framework**: Playwright ou Cypress

```typescript
// Exemplo: e2e/contact-form.spec.ts
import { test, expect } from '@playwright/test';

test('user can submit contact form', async ({ page }) => {
  await page.goto('/');
  
  await page.fill('[name="name"]', 'John Doe');
  await page.fill('[name="email"]', 'john@example.com');
  await page.fill('[name="message"]', 'Test message');
  
  await page.click('button[type="submit"]');
  
  await expect(page.locator('.toast')).toContainText('Mensagem enviada');
});
```

## Test Setup (Futuro)

### Installation
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D @playwright/test
```

### Configuration

**vitest.config.ts**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'src/test/']
    }
  }
});
```

**src/test/setup.ts**
```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

## Testing Best Practices

### What to Test
✅ **DO Test**:
- Utility functions (cn, formatters)
- Custom hooks (useAuth, useSiteConfig)
- Component behavior (clicks, inputs)
- Form validation
- Error handling
- Critical user flows

❌ **DON'T Test**:
- Third-party libraries (React, Supabase)
- Styling/CSS
- Implementation details
- Trivial code

### Test Structure
```typescript
describe('Feature', () => {
  // Setup
  beforeEach(() => {
    // Arrange
  });
  
  it('should do something', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = doSomething(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### Mocking

**Supabase Client**
```typescript
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: mockData, error: null }))
      }))
    }))
  }
}));
```

**React Router**
```typescript
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/' })
}));
```

## CI/CD Integration (Futuro)

### GitHub Actions
```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

## Quality Gates

### Pre-commit
- Lint passa
- Tipos TypeScript corretos
- Testes unitários passam (futuro)

### Pre-merge
- Todos os testes passam
- Coverage > 70% (futuro)
- Build de produção sucede
- Code review aprovado

### Pre-deploy
- E2E tests passam (futuro)
- Performance audit (Lighthouse)
- Security scan (npm audit)

## Performance Testing

### Lighthouse CI (Futuro)
```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:5173"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "categories:accessibility": ["error", {"minScore": 0.9}]
      }
    }
  }
}
```

### Load Testing (Futuro)
- k6 ou Artillery para load tests
- Testar endpoints Supabase
- Simular tráfego alto

## Accessibility Testing

### Manual Checks
- [ ] Keyboard navigation funciona
- [ ] Screen reader friendly
- [ ] Color contrast adequado
- [ ] Alt text em imagens
- [ ] ARIA labels onde necessário

### Automated Tools
- Lighthouse accessibility audit
- axe DevTools extension
- WAVE browser extension

## Security Testing

### Manual Checks
- [ ] RLS policies testadas
- [ ] Auth protege rotas corretas
- [ ] Input validation funciona
- [ ] File upload seguro
- [ ] XSS prevention

### Automated Tools
```bash
npm audit              # Vulnerabilidades em deps
npm audit fix          # Auto-fix quando possível
```

## Monitoring in Production

### Error Tracking (Futuro)
- Sentry para error tracking
- LogRocket para session replay
- Custom error boundaries

### Analytics
- Google Analytics para usage
- Supabase logs para backend
- Performance monitoring

## Testing Roadmap

**Phase 1** (Current)
- Manual testing checklist
- Browser compatibility testing
- Basic performance checks

**Phase 2** (Next)
- Setup Vitest + RTL
- Unit tests para utils e hooks
- Component tests para UI crítico

**Phase 3** (Future)
- E2E tests com Playwright
- CI/CD integration
- Coverage reports

**Phase 4** (Advanced)
- Visual regression testing
- Load testing
- Security scanning automation
