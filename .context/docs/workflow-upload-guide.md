# Guia: Upload de Imagens em Workflows

## Como Fazer Upload

### Passo 1: Acessar o Gerenciador

1. Faça login como admin
2. Acesse `/workflow-manager`
3. Clique em "Novo Workflow" ou edite um existente

### Passo 2: Adicionar Imagem

Você tem duas opções:

#### Opção A: Upload de Arquivo (Recomendado)

1. Na seção "Imagem de Capa", clique na área de upload
2. Selecione uma imagem do seu computador
3. Aguarde o preview aparecer
4. Preencha os outros campos
5. Clique em "Criar" ou "Atualizar"
6. A imagem será enviada automaticamente

**Vantagens**:
- Imagem fica hospedada no Supabase
- Não depende de serviços externos
- Controle total sobre o arquivo

#### Opção B: URL Externa

1. Na seção "Imagem de Capa", role até "Ou use uma URL"
2. Cole a URL completa da imagem
3. O preview aparece automaticamente
4. Preencha os outros campos
5. Clique em "Criar" ou "Atualizar"

**Vantagens**:
- Mais rápido (não faz upload)
- Útil para imagens já hospedadas
- Economiza espaço no Supabase

### Passo 3: Verificar

Após salvar:
1. A imagem aparece na lista de workflows
2. Clique no ícone de preview (olho) para ver publicado
3. Acesse `/workflows/:slug` para ver a página pública

## Requisitos da Imagem

### Formato
- PNG, JPG, JPEG, GIF, WebP
- Recomendado: JPG ou WebP para melhor compressão

### Tamanho
- Máximo: 5 MB
- Recomendado: 500 KB - 1 MB
- Dimensões sugeridas: 1200x630px (proporção 1.91:1)

### Qualidade
- Resolução mínima: 800x400px
- Evite imagens muito pequenas (ficam pixeladas)
- Evite imagens muito grandes (carregamento lento)

## Otimização de Imagens

### Antes do Upload

Use ferramentas online para otimizar:

1. **TinyPNG** (https://tinypng.com)
   - Comprime PNG e JPG sem perda visível
   - Reduz até 70% do tamanho

2. **Squoosh** (https://squoosh.app)
   - Converte para WebP
   - Ajusta qualidade e dimensões

3. **ImageOptim** (Mac) ou **FileOptimizer** (Windows)
   - Apps desktop para compressão em lote

### Dimensões Ideais

Para workflows:
- **Desktop**: 1200x630px
- **Mobile**: 800x400px
- **Thumbnail**: 400x200px

Use proporção 2:1 ou 1.91:1 (padrão Open Graph)

## Remover Imagem

Para remover uma imagem:

1. Abra o workflow para edição
2. Clique no X no canto da imagem
3. A imagem é removida do preview
4. Salve as alterações

**Nota**: A imagem não é deletada do storage, apenas desvinculada do workflow.

## Trocar Imagem

Para trocar a imagem:

1. Abra o workflow para edição
2. Clique no X para remover a atual
3. Faça upload de uma nova ou cole nova URL
4. Salve as alterações

## Problemas Comuns

### "Bucket not found"

**Problema**: Bucket `images` não existe no Supabase

**Solução**:
1. Acesse o dashboard do Supabase
2. Vá em Storage > Buckets
3. Crie um bucket chamado `images`
4. Marque como público
5. Tente novamente

Ou execute o SQL:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true);
```

### "File too large"

**Problema**: Imagem maior que 5 MB

**Solução**:
1. Comprima a imagem usando TinyPNG
2. Reduza as dimensões se necessário
3. Converta para WebP (menor tamanho)
4. Tente novamente

### "Permission denied"

**Problema**: Usuário não tem permissão para upload

**Solução**:
1. Verifique se você está logado como admin
2. Confirme que tem role `admin` na tabela `user_roles`
3. Verifique as políticas RLS do storage

### Imagem não aparece

**Problema**: URL incorreta ou bucket não público

**Solução**:
1. Verifique se o bucket `images` está marcado como público
2. Teste a URL diretamente no navegador
3. Verifique o console do navegador para erros
4. Limpe o cache do navegador

### Upload muito lento

**Problema**: Arquivo grande ou conexão lenta

**Solução**:
1. Comprima a imagem antes do upload
2. Verifique sua conexão de internet
3. Use uma imagem menor temporariamente
4. Tente em outro horário

## Boas Práticas

### Nomenclatura

Embora o sistema gere nomes únicos automaticamente, use nomes descritivos nos arquivos originais:
- ✅ `workflow-docker-setup.jpg`
- ✅ `react-deployment-guide.png`
- ❌ `IMG_1234.jpg`
- ❌ `screenshot.png`

### Organização

- Use imagens relevantes ao conteúdo
- Mantenha consistência visual entre workflows
- Prefira imagens originais a stock photos genéricas
- Adicione texto/overlay se necessário

### Acessibilidade

- Use imagens com bom contraste
- Evite texto muito pequeno na imagem
- Considere modo escuro (imagens muito claras podem incomodar)

### Performance

- Sempre comprima antes do upload
- Use WebP quando possível
- Evite GIFs animados pesados
- Considere lazy loading para muitas imagens

## Exemplos de Boas Imagens

### Workflow Técnico
- Screenshot de código com syntax highlighting
- Diagrama de arquitetura
- Fluxograma do processo
- Terminal com comandos

### Workflow de Processo
- Diagrama de fluxo
- Checklist visual
- Timeline ilustrada
- Infográfico

### Workflow de Tutorial
- Interface do produto
- Passo a passo visual
- Antes e depois
- Resultado final

## Ferramentas Recomendadas

### Criação
- **Figma** - Design de interfaces
- **Canva** - Templates prontos
- **Excalidraw** - Diagramas simples
- **Draw.io** - Fluxogramas

### Edição
- **Photopea** - Editor online (tipo Photoshop)
- **GIMP** - Editor gratuito desktop
- **Pixlr** - Editor online simples

### Screenshots
- **ShareX** (Windows) - Captura + edição
- **Flameshot** (Linux) - Captura + anotações
- **CleanShot X** (Mac) - Captura profissional

### Compressão
- **TinyPNG** - Online, simples
- **Squoosh** - Online, avançado
- **ImageOptim** - Desktop, em lote

## Checklist Antes de Publicar

- [ ] Imagem tem boa qualidade
- [ ] Tamanho menor que 1 MB
- [ ] Dimensões adequadas (mín. 800x400px)
- [ ] Formato otimizado (JPG ou WebP)
- [ ] Preview carrega corretamente
- [ ] Imagem relevante ao conteúdo
- [ ] Sem informações sensíveis na imagem
- [ ] Contraste adequado para leitura

## Suporte

Se encontrar problemas:

1. Verifique a documentação: `.context/docs/storage-setup.md`
2. Consulte os logs do navegador (F12 > Console)
3. Teste com uma imagem pequena (< 100 KB)
4. Verifique permissões no Supabase Dashboard

## Próximas Funcionalidades

Em desenvolvimento:
- [ ] Crop/resize no frontend
- [ ] Galeria de imagens reutilizáveis
- [ ] Upload múltiplo
- [ ] Drag & drop de múltiplos arquivos
- [ ] Integração com Unsplash
- [ ] Geração de thumbnails automática
