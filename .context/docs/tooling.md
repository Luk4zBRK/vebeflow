# Tooling & Productivity Guide

> Ferramentas, configurações e dicas para desenvolvimento eficiente no Vibe Flow.

## Development Environment

### Required Tools
- **Node.js** >= 18 (recomendado: 20 LTS)
- **npm** ou **bun** (package manager)
- **Git** para controle de versão
- **VS Code** (recomendado) ou IDE de preferência

### Recommended VS Code Extensions
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "supabase.supabase-vscode",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

## Package Scripts

### Development
```bash
npm run dev          # Inicia dev server (localhost:5173)
npm run build        # Build de produção (dist/)
npm run preview      # Preview do build local
npm run lint         # Executa ESLint
```

### Build Modes
```bash
npm run build        # Produção (otimizado)
npm run build:dev    # Development (com source maps)
```

## Build Configuration

### Vite (vite.config.ts)
```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    host: true
  }
});
```

### TypeScript (tsconfig.json)
- **strict**: true (type checking rigoroso)
- **target**: ES2020
- **module**: ESNext
- **jsx**: react-jsx

### Tailwind (tailwind.config.ts)
- **content**: Scan de src/**/*.{ts,tsx}
- **theme**: Customizações de cores, fonts, etc
- **plugins**: tailwindcss-animate, typography

## Linting & Formatting

### ESLint (eslint.config.js)
```bash
npm run lint         # Check de erros
npm run lint -- --fix # Auto-fix quando possível
```

Regras principais:
- React hooks rules
- TypeScript recommended
- React refresh plugin

### Code Style
- **Indentação**: 2 espaços
- **Quotes**: Single quotes para strings
- **Semicolons**: Opcional (ESLint decide)
- **Trailing commas**: ES5 style

## Browser DevTools

### React DevTools
- Inspecionar component tree
- Ver props e state
- Profile performance
- Highlight re-renders

### Network Tab
- Monitorar requests Supabase
- Verificar payloads e responses
- Checar timing e cache

### Console
```typescript
// Debugging útil
console.log('Data:', data);
console.table(arrayData);
console.time('operation');
// ... código ...
console.timeEnd('operation');
```

## Supabase CLI

### Installation
```bash
npm install -g supabase
```

### Common Commands
```bash
supabase init                    # Inicializa projeto local
supabase start                   # Inicia containers Docker
supabase db reset                # Reset database local
supabase migration new <name>    # Cria nova migration
supabase db push                 # Aplica migrations
supabase gen types typescript    # Gera tipos TS
```

### Local Development
```bash
# Inicia Supabase local (Docker)
supabase start

# Conecta ao local
# Atualiza SUPABASE_URL em client.ts para http://localhost:54321
```

## Git Workflow

### Useful Commands
```bash
git status                       # Ver mudanças
git add .                        # Stage all
git commit -m "feat: message"    # Commit
git push origin branch-name      # Push
git pull origin develop          # Pull latest
git checkout -b feature/name     # Nova branch
git log --oneline --graph        # Ver histórico
```

### Conventional Commits Helper
```bash
# Use commitizen para commits padronizados
npm install -g commitizen
git cz  # Interactive commit
```

## Performance Tools

### Lighthouse
```bash
# Audit de performance, acessibilidade, SEO
# Chrome DevTools > Lighthouse > Generate report
```

### Bundle Analysis
```bash
npm run build
# Veja tamanho dos chunks em dist/
```

### React Profiler
```tsx
import { Profiler } from 'react';

<Profiler id="Component" onRender={callback}>
  <Component />
</Profiler>
```

## Debugging

### VS Code Debugger
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

### React Error Boundaries
```tsx
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('Error:', error, errorInfo);
  }
  
  render() {
    return this.props.children;
  }
}
```

## Productivity Tips

### VS Code Shortcuts
- `Ctrl+P`: Quick file open
- `Ctrl+Shift+P`: Command palette
- `Ctrl+D`: Select next occurrence
- `Alt+Up/Down`: Move line
- `Ctrl+/`: Toggle comment
- `F2`: Rename symbol

### Code Snippets
```json
// .vscode/snippets.json
{
  "React Component": {
    "prefix": "rfc",
    "body": [
      "const ${1:Component} = () => {",
      "  return (",
      "    <div>",
      "      $0",
      "    </div>",
      "  );",
      "};",
      "",
      "export default ${1:Component};"
    ]
  }
}
```

### Aliases
```bash
# .bashrc ou .zshrc
alias dev="npm run dev"
alias build="npm run build"
alias lint="npm run lint"
```

## Documentation Tools

### JSDoc Comments
```typescript
/**
 * Busca configurações do site
 * @returns {SiteConfig} Configurações do site
 * @throws {Error} Se falhar ao buscar
 */
export const fetchSiteConfig = async () => {
  // ...
};
```

### Type Documentation
```typescript
/**
 * Configurações da empresa
 */
interface CompanyInfo {
  /** Nome da empresa */
  name: string;
  /** Email de contato */
  email: string;
}
```

## Monitoring & Analytics

### Google Analytics DevTools
- Chrome extension: Google Analytics Debugger
- Verifica eventos sendo enviados
- Debug tracking issues

### Supabase Dashboard
- **Database**: Query editor, table viewer
- **Auth**: User management, logs
- **Storage**: File browser
- **Logs**: Real-time logs

## Useful Resources

### Documentation
- [Vite Docs](https://vitejs.dev)
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [TanStack Query](https://tanstack.com/query/latest)

### Community
- [React Discord](https://discord.gg/react)
- [Supabase Discord](https://discord.supabase.com)
- [Stack Overflow](https://stackoverflow.com)

### Learning
- [React.dev Learn](https://react.dev/learn)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript)
- [Tailwind Play](https://play.tailwindcss.com)
