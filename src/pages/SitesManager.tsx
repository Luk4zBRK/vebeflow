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
  ExternalLink,
  Loader2,
  MousePointerClick
} from 'lucide-react';

interface RecommendedSite {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  url: string;
  image_url: string | null;
  favicon_url: string | null;
  category: string | null;
  tags: string[];
  is_published: boolean;
  views_count: number;
  clicks_count: number;
  created_at: string;
}

const SitesManager = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { uploadImage, uploading: uploadingImage } = useImageUpload();

  const [sites, setSites] = useState<RecommendedSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSite, setEditingSite] = useState<RecommendedSite | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchSites();
  }, [user, navigate]);

  const fetchSites = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('recommended_sites')
        .select('*')
        .eq('author_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSites(data || []);
    } catch (error) {
      console.error('Erro ao carregar sites:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os sites.',
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
    if (!editingSite) {
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

  const startEditing = (site: RecommendedSite) => {
    setEditingSite(site);
    setTitle(site.title);
    setSlug(site.slug);
    setDescription(site.description || '');
    setUrl(site.url);
    setImageUrl(site.image_url || '');
    setFaviconUrl(site.favicon_url || '');
    setCategory(site.category || '');
    setTags(site.tags.join(', '));
    setIsPublished(site.is_published);
    setImagePreview(site.image_url);
    setIsCreating(true);
  };

  const resetForm = () => {
    setEditingSite(null);
    setTitle('');
    setSlug('');
    setDescription('');
    setUrl('');
    setImageUrl('');
    setFaviconUrl('');
    setCategory('');
    setTags('');
    setIsPublished(false);
    setImageFile(null);
    setImagePreview(null);
  };

  const cancelEditing = () => {
    resetForm();
    setIsCreating(false);
  };

  const handleSave = async () => {
    if (!title.trim() || !slug.trim() || !url.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha título, slug e URL.',
        variant: 'destructive',
      });
      return;
    }

    try {
      let finalImageUrl = imageUrl;

      // Upload da imagem se houver
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile, 'images/recommended-sites/');
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        }
      }

      const tagsArray = tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const siteData = {
        title,
        slug,
        description: description || null,
        url,
        image_url: finalImageUrl || null,
        favicon_url: faviconUrl || null,
        category: category || null,
        tags: tagsArray,
        is_published: isPublished,
        author_id: user?.id,
        author_name: user?.email?.split('@')[0] || 'Admin',
      };

      if (editingSite) {
        const { error } = await (supabase as any)
          .from('recommended_sites')
          .update(siteData)
          .eq('id', editingSite.id);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Site atualizado com sucesso!',
        });
      } else {
        const { error } = await (supabase as any)
          .from('recommended_sites')
          .insert([siteData]);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Site criado com sucesso!',
        });
      }

      await fetchSites();
      cancelEditing();
    } catch (error: any) {
      console.error('Erro ao salvar site:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar o site.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este site?')) return;

    try {
      const { error } = await (supabase as any)
        .from('recommended_sites')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Site excluído com sucesso!',
      });

      await fetchSites();
    } catch (error: any) {
      console.error('Erro ao excluir site:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o site.',
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
              <h1 className="text-3xl font-bold mb-2">Gerenciar Sites Recomendados</h1>
              <p className="text-muted-foreground">
                Adicione e gerencie sites úteis para compartilhar
              </p>
            </div>
            {!isCreating && (
              <Button onClick={startCreating}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Site
              </Button>
            )}
          </div>

          {/* Formulário de Criação/Edição */}
          {isCreating && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>
                  {editingSite ? 'Editar Site' : 'Novo Site'}
                </CardTitle>
                <CardDescription>
                  Preencha as informações do site recomendado
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
                      placeholder="Ex: Google Gemini"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="google-gemini"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="url">URL *</Label>
                  <Input
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://gemini.google.com"
                    type="url"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Breve descrição do site"
                    rows={2}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Input
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="development, design, ai, learning, tools"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                    <Input
                      id="tags"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="ai, google, gemini"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="faviconUrl">URL do Favicon</Label>
                  <Input
                    id="faviconUrl"
                    value={faviconUrl}
                    onChange={(e) => setFaviconUrl(e.target.value)}
                    placeholder="https://example.com/favicon.ico"
                  />
                </div>

                {/* Upload de Imagem */}
                <div className="space-y-2">
                  <Label>Imagem de Capa</Label>
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
                  <Label htmlFor="published">Publicar site</Label>
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
                        {editingSite ? 'Atualizar' : 'Criar'}
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

          {/* Lista de Sites */}
          <div className="space-y-4">
            {sites.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">
                    Nenhum site criado ainda.
                  </p>
                  <Button onClick={startCreating}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Site
                  </Button>
                </CardContent>
              </Card>
            ) : (
              sites.map((site) => (
                <Card key={site.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold">{site.title}</h3>
                          {site.is_published ? (
                            <Badge variant="default">Publicado</Badge>
                          ) : (
                            <Badge variant="secondary">Rascunho</Badge>
                          )}
                          {site.category && (
                            <Badge variant="outline">{site.category}</Badge>
                          )}
                        </div>
                        {site.description && (
                          <p className="text-muted-foreground mb-3">{site.description}</p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <ExternalLink className="h-4 w-4" />
                            {new URL(site.url).hostname}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {site.views_count} visualizações
                          </span>
                          <span className="flex items-center gap-1">
                            <MousePointerClick className="h-4 w-4" />
                            {site.clicks_count} cliques
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(site.url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditing(site)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(site.id)}
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

export default SitesManager;
