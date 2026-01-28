# Configuração do Supabase Storage

## Visão Geral

O sistema usa Supabase Storage para armazenar imagens de workflows, portfólio e outras mídias. É necessário criar um bucket chamado `images` no Supabase.

## Criar Bucket via Dashboard

1. Acesse: https://supabase.com/dashboard/project/zarigqmtaexgcayzfqpt/storage/buckets
2. Clique em **New Bucket**
3. Configure:
   - **Name**: `images`
   - **Public bucket**: ✅ Marcar (para URLs públicas)
   - **File size limit**: 5 MB (para imagens) ou 50 MB (se incluir vídeos)
   - **Allowed MIME types**: `image/*` (ou deixar vazio para todos)
4. Clique em **Create bucket**

## Criar Bucket via SQL

Execute no SQL Editor do Supabase:

```sql
-- Criar bucket público para imagens
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true);

-- Política para permitir upload (apenas admins)
CREATE POLICY "Admins can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Política para leitura pública
CREATE POLICY "Anyone can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

-- Política para admins deletarem
CREATE POLICY "Admins can delete images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'images' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
```

## Estrutura de Pastas

O bucket `images` organiza arquivos em subpastas:

```
images/
├── workflows/       # Imagens de workflows
├── portfolio/       # Imagens de projetos do portfólio
├── blog/           # Imagens de posts do blog
└── general/        # Outras imagens
```

## Upload de Imagens

### No WorkflowManager

O componente `WorkflowManager` agora suporta:

1. **Upload de arquivo**: Arraste ou clique para selecionar
2. **URL externa**: Cole uma URL de imagem
3. **Preview**: Visualize antes de salvar
4. **Remover**: Limpe a seleção

**Validações**:
- Apenas arquivos de imagem (PNG, JPG, GIF, etc.)
- Tamanho máximo: 5 MB
- Nome único gerado automaticamente

### Hook useImageUpload

O hook `useImageUpload` fornece:

```typescript
const { uploadImage, isUploading } = useImageUpload();

// Upload de imagem
const url = await uploadImage(file, 'workflows');

// Upload de vídeo
const url = await uploadVideo(file, 'videos');

// Deletar imagem
await deleteImage(imageUrl);
```

## Formato das URLs

URLs públicas seguem o padrão:

```
https://[PROJECT_REF].supabase.co/storage/v1/object/public/images/[FOLDER]/[FILENAME]
```

Exemplo:
```
https://zarigqmtaexgcayzfqpt.supabase.co/storage/v1/object/public/images/workflows/1738099200000-abc123.jpg
```

## Segurança

### Políticas RLS

- **Upload**: Apenas admins autenticados
- **Leitura**: Público (bucket público)
- **Exclusão**: Apenas admins autenticados

### Validações no Frontend

- Tipo de arquivo (MIME type)
- Tamanho máximo
- Nome único (timestamp + random)

## Uso em Workflows

Ao criar/editar um workflow:

1. **Opção 1 - Upload**:
   - Clique na área de upload
   - Selecione uma imagem do computador
   - Preview aparece automaticamente
   - Ao salvar, imagem é enviada para `images/workflows/`

2. **Opção 2 - URL**:
   - Cole uma URL externa
   - Preview aparece automaticamente
   - URL é salva diretamente no banco

## Troubleshooting

### Erro: "Bucket not found"

**Causa**: Bucket `images` não existe

**Solução**: Crie o bucket seguindo as instruções acima

### Erro: "Permission denied"

**Causa**: Políticas RLS não configuradas ou usuário não é admin

**Solução**:
1. Verifique se as políticas foram criadas
2. Confirme que o usuário tem role `admin` na tabela `user_roles`

### Imagem não carrega

**Causa**: Bucket não é público ou URL incorreta

**Solução**:
1. Verifique se o bucket está marcado como público
2. Teste a URL diretamente no navegador
3. Verifique o console para erros CORS

### Upload muito lento

**Causa**: Arquivo muito grande ou conexão lenta

**Solução**:
1. Reduza o tamanho da imagem (use ferramentas de compressão)
2. Verifique a conexão de internet
3. Considere aumentar o limite de tamanho se necessário

## Limites

### Plano Gratuito do Supabase

- **Storage**: 1 GB
- **Bandwidth**: 2 GB/mês
- **Uploads**: Ilimitados

### Recomendações

- Comprima imagens antes do upload
- Use formatos modernos (WebP, AVIF)
- Considere CDN para alta demanda
- Monitore uso no dashboard

## Migração de Imagens

Se você já tem imagens em outro lugar:

### Via Dashboard

1. Acesse Storage > images
2. Clique em **Upload file**
3. Selecione múltiplos arquivos
4. Organize em pastas

### Via Script

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(URL, KEY);

async function migrateImages() {
  const images = [
    { file: 'image1.jpg', folder: 'workflows' },
    { file: 'image2.jpg', folder: 'portfolio' },
  ];

  for (const img of images) {
    const file = await fetch(img.file).then(r => r.blob());
    const { data, error } = await supabase.storage
      .from('images')
      .upload(`${img.folder}/${img.file}`, file);
    
    if (error) console.error(error);
    else console.log('Uploaded:', data.path);
  }
}
```

## Backup

### Exportar Imagens

```bash
# Via Supabase CLI
supabase storage download --bucket images --path workflows/ --output ./backup/
```

### Importar Imagens

```bash
# Via Supabase CLI
supabase storage upload --bucket images --path workflows/ --input ./backup/
```

## Monitoramento

Verifique uso no dashboard:
- https://supabase.com/dashboard/project/zarigqmtaexgcayzfqpt/storage/usage

Métricas disponíveis:
- Total de arquivos
- Espaço usado
- Bandwidth consumido
- Uploads por dia

## Próximas Melhorias

- [ ] Compressão automática de imagens
- [ ] Suporte a múltiplos uploads
- [ ] Galeria de imagens reutilizáveis
- [ ] Crop/resize no frontend
- [ ] Lazy loading de imagens
- [ ] CDN integration
- [ ] Backup automático

## Referências

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Creating Buckets](https://supabase.com/docs/guides/storage/buckets/creating-buckets)
- [Upload Files](https://supabase.com/docs/guides/storage/uploads)
- Hook: `src/hooks/useImageUpload.tsx`
