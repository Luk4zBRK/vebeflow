import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useImageUpload } from '@/hooks/useImageUpload';
import { ArrowLeft, Plus, Edit, Trash2, Eye, EyeOff, ExternalLink, Calendar, User, Upload, X, Image as ImageIcon } from 'lucide-react';

interface Workflow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string;
  image_url: string | null;
  author_name: string | null;
  is_published: boolean;
  views_count: number;
  created_at: string;
}

const WorkflowManager = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, isUploading } = useImageUpload();

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate('/auth');
    }
  }, [user, isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchWorkflows();
    }
  }, [user, isAdmin]);

  const fetchWorkflows = async () => {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkflows(data || []);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os workflows',
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
    if (!editingWorkflow) {
      setSlug(generateSlug(value));
    }
  };

  const openCreateDialog = () => {
    setEditingWorkflow(null);
    setTitle('');
    setSlug('');
    setDescription('');
    setContent('');
    setImageUrl('');
    setIsPublished(false);
    setImageFile(null);
    setImagePreview(null);
    setDialogOpen(true);
  };

  const openEditDialog = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setTitle(workflow.title);
    setSlug(workflow.slug);
    setDescription(workflow.description || '');
    setContent(workflow.content);
    setImageUrl(workflow.image_url || '');
    setIsPublished(workflow.is_published);
    setImageFile(null);
    setImagePreview(workflow.image_url || null);
    setDialogOpen(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !slug.trim() || !content.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha título, slug e conteúdo',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      // Upload image if a new file was selected
      let finalImageUrl = imageUrl.trim() || null;
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile, 'workflows');
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        }
      }

      const workflowData = {
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        content: content.trim(),
        image_url: finalImageUrl,
        author_id: user?.id,
        author_name: user?.email || 'Admin',
        is_published: isPublished,
      };

      if (editingWorkflow) {
        const { error } = await supabase
          .from('workflows')
          .update(workflowData)
          .eq('id', editingWorkflow.id);

        if (error) throw error;

        toast({
          title: 'Workflow atualizado!',
          description: 'As alterações foram salvas com sucesso',
        });
      } else {
        const { error } = await supabase.from('workflows').insert([workflowData]);

        if (error) throw error;

        toast({
          title: 'Workflow criado!',
          description: 'O workflow foi criado com sucesso',
        });
      }

      setDialogOpen(false);
      fetchWorkflows();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar o workflow',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('workflows').delete().eq('id', id);

      if (error) throw error;

      toast({
        title: 'Workflow excluído',
        description: 'O workflow foi removido com sucesso',
      });

      fetchWorkflows();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o workflow',
        variant: 'destructive',
      });
    }
  };

  const togglePublish = async (workflow: Workflow) => {
    try {
      const { error } = await supabase
        .from('workflows')
        .update({ is_published: !workflow.is_published })
        .eq('id', workflow.id);

      if (error) throw error;

      toast({
        title: workflow.is_published ? 'Workflow despublicado' : 'Workflow publicado',
        description: workflow.is_published
          ? 'O workflow não está mais visível publicamente'
          : 'O workflow agora está visível publicamente',
      });

      fetchWorkflows();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (isLoading || !user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Button>
            <h1 className="text-3xl font-bold">Gerenciar Workflows</h1>
            <p className="text-muted-foreground">Crie e gerencie workflows e automações</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Workflow
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingWorkflow ? 'Editar Workflow' : 'Novo Workflow'}
                </DialogTitle>
                <DialogDescription>
                  Preencha as informações do workflow
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Nome do workflow"
                  />
                </div>

                <div>
                  <Label htmlFor="slug">Slug (URL) *</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="workflow-exemplo"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    URL: /workflows/{slug || 'workflow-exemplo'}
                  </p>
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Breve descrição do workflow"
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Imagem de Capa</Label>
                  <div className="space-y-4">
                    {/* Image Preview */}
                    {imagePreview && (
                      <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={handleRemoveImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {/* Upload Button */}
                    {!imagePreview && (
                      <div className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg hover:bg-muted/50 transition-colors">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className="flex flex-col items-center justify-center cursor-pointer w-full h-full"
                        >
                          <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground mb-1">
                            Clique para fazer upload
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PNG, JPG, GIF até 5MB
                          </p>
                        </label>
                      </div>
                    )}

                    {/* Or URL Input */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          Ou use uma URL
                        </span>
                      </div>
                    </div>

                    <Input
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        if (e.target.value) {
                          setImagePreview(e.target.value);
                          setImageFile(null);
                        }
                      }}
                      placeholder="https://exemplo.com/imagem.jpg"
                      disabled={!!imageFile}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="content">Conteúdo (HTML) *</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="<h2>Passo 1</h2><p>Descrição...</p>"
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Suporta HTML. Use tags como &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;code&gt;, etc.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="published"
                    checked={isPublished}
                    onCheckedChange={setIsPublished}
                  />
                  <Label htmlFor="published">Publicar workflow</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving || isUploading}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving || isUploading}>
                  {isUploading ? (
                    <>
                      <Upload className="mr-2 h-4 w-4 animate-spin" />
                      Enviando imagem...
                    </>
                  ) : saving ? (
                    'Salvando...'
                  ) : (
                    editingWorkflow ? 'Atualizar' : 'Criar'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total de Workflows</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workflows.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Publicados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {workflows.filter((w) => w.is_published).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total de Visualizações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {workflows.reduce((sum, w) => sum + w.views_count, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Workflows</CardTitle>
            <CardDescription>Gerencie todos os workflows do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : workflows.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhum workflow criado ainda</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Visualizações</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workflows.map((workflow) => (
                    <TableRow key={workflow.id}>
                      <TableCell className="font-medium">{workflow.title}</TableCell>
                      <TableCell>
                        {workflow.is_published ? (
                          <Badge className="bg-green-600">
                            <Eye className="h-3 w-3 mr-1" />
                            Publicado
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Rascunho
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <User className="h-3 w-3" />
                          {workflow.author_name || 'Admin'}
                        </div>
                      </TableCell>
                      <TableCell>{workflow.views_count}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(workflow.created_at)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => togglePublish(workflow)}
                            title={workflow.is_published ? 'Despublicar' : 'Publicar'}
                          >
                            {workflow.is_published ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          {workflow.is_published && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`/workflows/${workflow.slug}`, '_blank')}
                              title="Ver publicado"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(workflow)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir workflow?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. O workflow será permanentemente
                                  removido.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(workflow.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorkflowManager;
