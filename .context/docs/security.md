# Security

> Práticas de segurança, autenticação e proteção de dados no Vibe Flow.

## Authentication & Authorization

### Supabase Auth
- **Provider**: Supabase Auth (JWT-based)
- **Storage**: localStorage (persistSession: true)
- **Auto-refresh**: Habilitado
- **Super admin**: contato@vibeflow.site

### User Roles
```typescript
// Roles armazenados em auth.users.raw_user_meta_data
type UserRole = 'user' | 'admin';

// Verificação no frontend
const { user } = useAuth();
const isAdmin = user?.user_metadata?.role === 'admin';

// Verificação no backend (RLS)
auth.jwt() ->> 'role' = 'admin'
```

### Protected Routes
```typescript
// Pattern usado em App.tsx
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/auth" />;
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" />;
  }
  
  return children;
};
```

## Row Level Security (RLS)

### Policies Pattern

**Public Read, Admin Write**
```sql
-- site_config, portfolio_items
create policy "Public read" on table for select using (true);
create policy "Admin write" on table for all 
  using (auth.jwt() ->> 'role' = 'admin');
```

**User-Owned Resources**
```sql
-- blog_posts, user_data
create policy "Users manage own" on table for all
  using (auth.uid() = user_id);
```

**Admin Full Access**
```sql
create policy "Admin full access" on table for all
  using (
    exists (
      select 1 from auth.users
      where id = auth.uid()
      and raw_user_meta_data->>'role' = 'admin'
    )
  );
```

## Data Protection

### Sensitive Data
- **Passwords**: Nunca armazenados (Supabase Auth)
- **JWT tokens**: localStorage (auto-refresh)
- **API keys**: Apenas anon key exposta (seguro)
- **Webhook URLs**: Configuráveis via admin

### Input Validation
```typescript
// Zod schemas para validação
const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().min(10).max(1000)
});

// Sanitização automática via Supabase
// SQL injection: Protegido por prepared statements
// XSS: React escapa automaticamente
```

### File Upload Security
```typescript
// Validação de tipo e tamanho
const validateFile = (file: File) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Tipo de arquivo não permitido');
  }
  
  if (file.size > maxSize) {
    throw new Error('Arquivo muito grande');
  }
};
```

## API Security

### Rate Limiting
- Supabase: Rate limiting nativo por IP
- n8n webhook: Implementar rate limiting no workflow
- Contact form: Debounce + validação

### CORS
```typescript
// Supabase configura CORS automaticamente
// Apenas origins permitidas podem fazer requests
```

### Environment Variables
```typescript
// ✅ Seguro: Anon key pode ser exposta
const SUPABASE_ANON_KEY = "eyJhbGc...";

// ❌ Nunca exponha: Service role key
// Apenas no servidor/Edge Functions
```

## Common Vulnerabilities

### XSS Prevention
```tsx
// ✅ React escapa automaticamente
<div>{userInput}</div>

// ⚠️ Cuidado com dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />

// Use biblioteca de sanitização
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(dirty);
```

### SQL Injection Prevention
```typescript
// ✅ Supabase usa prepared statements
await supabase
  .from('table')
  .select()
  .eq('column', userInput); // Seguro

// ❌ Nunca construa SQL manualmente
// const query = `SELECT * FROM table WHERE id = ${userInput}`;
```

### CSRF Protection
- Supabase JWT em header (não cookie)
- SameSite cookies quando necessário
- CORS configurado corretamente

## Monitoring & Auditing

### Auth Logs
```sql
-- Supabase mantém logs de auth
-- Dashboard > Authentication > Logs
-- Monitore: failed logins, suspicious activity
```

### Audit Trail (Futuro)
```sql
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  action text not null,
  table_name text not null,
  record_id uuid,
  changes jsonb,
  ip_address inet,
  created_at timestamptz default now()
);
```

## Incident Response

### Compromised Account
1. Revoke user sessions via Supabase Dashboard
2. Force password reset
3. Review audit logs
4. Notify usuário

### Data Breach
1. Identificar escopo
2. Revocar acessos comprometidos
3. Notificar usuários afetados
4. Revisar e fortalecer políticas RLS

## Security Checklist

- [x] RLS habilitado em todas as tabelas
- [x] Policies testadas para cada role
- [x] Input validation com Zod
- [x] File upload com validação
- [x] JWT auto-refresh configurado
- [x] HTTPS em produção (via Lovable)
- [ ] Rate limiting em endpoints críticos
- [ ] Audit logging implementado
- [ ] Security headers configurados
- [ ] Penetration testing realizado

## Best Practices

1. **Nunca confie no cliente**: Sempre valide no servidor (RLS)
2. **Princípio do menor privilégio**: Roles com mínimas permissões necessárias
3. **Defense in depth**: Múltiplas camadas de segurança
4. **Keep dependencies updated**: `npm audit` regularmente
5. **Monitor logs**: Revise logs de auth e erros frequentemente
