import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useImageUpload } from '@/hooks/useImageUpload';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Save,
  X,
  Upload,
  Link as LinkIcon,
  Loader2
} from 'lucide-react';

interface McpServer {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string;
  image_url: string | null;
  category: string | null;
  tags: string[];
  npm_package: string | null;
  github_url: string | null;
  install_command: string | null;
  is_published: boolean;
  views_count: number;
  created_at: string;
}

const McpManager = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { uploadImage, uploading: uploadingImage } = useImageUpload();

  const [servers, setServers] = useState<McpServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingServer, setEditingServer] = useState<McpServer | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [npmPackage, setNpmPackage] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [installCommand, setInstallCommand] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchServers();
  }, [user, navigate]);

  const fetchServers = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('mcp_servers')
        .select('*')
        .eq('author_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServers(data || []);
    } catch (error) {
      console.error('Erro ao carregar servidores:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os servidores.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!editingServer) {
      setSlug(generateSlug(value));
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: 'A imagem deve ter no máximo 5MB.',
          variant: 'destructive',
        });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl('');
  };

  const startCreating = () => {
    resetForm();
    setIsCreating(true);
  };

  const startEditing = (server: McpServer) => {
    setEditingServer(server);
    setTitle(server.title);
    setSlug(server.slug);
    setDescription(server.description || '');
    setContent(server.content);
    setImageUrl(server.image_url || '');
    setCategory(server.category || '');
    setTags(server.tags.join(', '));
    setNpmPackage(server.npm_package || '');
    setGithubUrl(server.github_url || '');
    setInstallCommand(server.install_command || '');
    setIsPublished(server.is_published);
    setImagePreview(server.image_url);
    setIsCreating(true);
  };

  const resetForm = () => {
    setEditingServer(null);
    setTitle('');
    setSlug('');
    setDescription('');
    setContent('');
    setImageUrl('');
    setCategory('');
    setTags('');
    setNpmPackage('');
    setGithubUrl('');
    setInstallCommand('');
    setIsPublished(false);
    setImageFile(null);
    setImagePreview(null);
  };

  const cancelEditing = () => {
    resetForm();
    setIsCreating(false);
  };

  const handleSave = async () => {
    if (!title.trim() || !slug.trim() || !content.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha título, slug e conteúdo.',
        variant: 'destructive',
      });
      return;
    }

    try {
      let finalImageUrl = imageUrl;

      // Upload da imagem se houver
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile, 'images/mcp-servers/');
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        }
      }

      const tagsArray = tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const serverData = {
        title,
        slug,
        description: description || null,
        content,
        image_url: finalImageUrl || null,
        category: category || null,
        tags: tagsArray,
        npm_package: npmPackage || null,
        github_url: githubUrl || null,
        install_command: installCommand || null,
        is_published: isPublished,
        author_id: user?.id,
        author_name: user?.email?.split('@')[0] || 'Admin',
      };

      if (editingServer) {
        const { error } = await (supabase as any)
          .from('mcp_servers')
          .update(serverData)
          .eq('id', editingServer.id);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Servidor MCP atualizado com sucesso!',
        });
      } else {
        const { error } = await (supabase as any)
          .from('mcp_servers')
          .insert([serverData]);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Servidor MCP criado com sucesso!',
        });
      }

      await fetchServers();
      cancelEditing();
    } catch (error: any) {
      console.error('Erro ao salvar servidor:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar o servidor.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este servidor MCP?')) return;

    try {
      const { error } = await (supabase as any)
        .from('mcp_servers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Servidor MCP excluído com sucesso!',
      });

      await fetchServers();
    } catch (error: any) {
      console.error('Erro ao excluir servidor:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o servidor.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-24">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Gerenciar Servidores MCP</h1>
              <p className="text-muted-foreground">
                Crie e gerencie servidores Model Context Protocol
              </p>
            </div>
            {!isCreating && (
              <Button onClick={startCreating}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Servidor
              </Button>
            )}
          </div>

          {/* Formulário de Criação/Edição */}
          {isCreating && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>
                  {editingServer ? 'Editar Servidor MCP' : 'Novo Servidor MCP'}
                </CardTitle>
                <CardDescription>
                  Preencha as informações do servidor MCP
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Ex: GitHub MCP Server"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="github-mcp-server"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Breve descrição do servidor MCP"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Conteúdo (HTML) *</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="<h2>Sobre</h2><p>Descrição detalhada...</p>"
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Input
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="development, data, ai, productivity"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                    <Input
                      id="tags"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="github, git, api"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="npmPackage">Pacote npm</Label>
                    <Input
                      id="npmPackage"
                      value={npmPackage}
                      onChange={(e) => setNpmPackage(e.target.value)}
                      placeholder="@modelcontextprotocol/server-github"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="githubUrl">URL do GitHub</Label>
                    <Input
                      id="githubUrl"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="installCommand">Comando de Instalação</Label>
                  <Input
                    id="installCommand"
                    value={installCommand}
                    onChange={(e) => setInstallCommand(e.target.value)}
                    placeholder="npx -y @modelcontextprotocol/server-github"
                  />
                </div>

                {/* Upload de Imagem */}
                <div className="space-y-2">
                  <Label>Imagem</Label>
                  <div className="flex flex-col gap-3">
                    {imagePreview && (
                      <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2"
                          onClick={handleRemoveImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          disabled={uploadingImage}
                          className="cursor-pointer"
                        />
                      </div>
                      <span className="text-muted-foreground">ou</span>
                      <div className="flex-1">
                        <Input
                          value={imageUrl}
                          onChange={(e) => {
                            setImageUrl(e.target.value);
                            setImagePreview(e.target.value);
                          }}
                          placeholder="URL da imagem"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="published"
                    checked={isPublished}
                    onCheckedChange={setIsPublished}
                  />
                  <Label htmlFor="published">Publicar servidor</Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSave} disabled={uploadingImage}>
                    {uploadingImage ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {editingServer ? 'Atualizar' : 'Criar'}
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={cancelEditing}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de Servidores */}
          <div className="space-y-4">
            {servers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">
                    Nenhum servidor MCP criado ainda.
                  </p>
                  <Button onClick={startCreating}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Servidor
                  </Button>
                </CardContent>
              </Card>
            ) : (
              servers.map((server) => (
                <Card key={server.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold">{server.title}</h3>
                          {server.is_published ? (
                            <Badge variant="default">Publicado</Badge>
                          ) : (
                            <Badge variant="secondary">Rascunho</Badge>
                          )}
                          {server.category && (
                            <Badge variant="outline">{server.category}</Badge>
                          )}
                        </div>
                        {server.description && (
                          <p className="text-muted-foreground mb-3">{server.description}</p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {server.views_count} visualizações
                          </span>
                          {server.npm_package && (
                            <span className="flex items-center gap-1">
                              <LinkIcon className="h-4 w-4" />
                              {server.npm_package}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/mcp-servers/${server.slug}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditing(server)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(server.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default McpManager;
