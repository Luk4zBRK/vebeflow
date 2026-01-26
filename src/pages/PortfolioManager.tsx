import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePortfolio, PortfolioItem } from "@/hooks/usePortfolio";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Plus, Edit, Trash2, Eye, EyeOff, ExternalLink, Briefcase, Upload, X } from "lucide-react";

const portfolioSchema = z.object({
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres").max(100, "Título deve ter no máximo 100 caracteres"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres").max(1000, "Descrição deve ter no máximo 1000 caracteres"),
  type: z.enum(['site', 'automation'], { required_error: "Selecione um tipo" }),
  technologies: z.string().min(1, "Adicione pelo menos uma tecnologia"),
  url: z.string().url("URL inválida").optional().or(z.literal("")),
  image_url: z.string().url("URL da imagem inválida").optional().or(z.literal("")),
  status: z.enum(['active', 'inactive', 'draft']).default('active'),
  featured: z.boolean().default(false),
  order_index: z.number().min(0).default(0),
});

type PortfolioFormData = z.infer<typeof portfolioSchema>;

const PortfolioManager = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { items, isLoading, fetchItems, createItem, updateItem, deleteItem, toggleStatus } = usePortfolio();
  const { uploadImage, deleteImage, isUploading } = useImageUpload();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<PortfolioFormData>({
    resolver: zodResolver(portfolioSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "site",
      technologies: "",
      url: "",
      image_url: "",
      status: "active",
      featured: false,
      order_index: 0,
    },
  });

  useEffect(() => {
    if (!user || !isAdmin) {
      navigate('/auth');
      return;
    }
  }, [user, isAdmin, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchItems();
    }
  }, [user, isAdmin]);

  const openCreateDialog = () => {
    setFormMode('create');
    setEditingItem(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: PortfolioItem) => {
    setFormMode('edit');
    setEditingItem(item);
    setSelectedImage(null);
    setImagePreview(null);
    form.reset({
      title: item.title,
      description: item.description,
      type: item.type,
      technologies: item.technologies.join(', '),
      url: item.url || "",
      image_url: item.image_url || "",
      status: item.status,
      featured: item.featured,
      order_index: item.order_index,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setSelectedImage(null);
    setImagePreview(null);
    form.reset();
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    form.setValue("image_url", "");
  };

  const onSubmit = async (data: PortfolioFormData) => {
    try {
      let imageUrl = data.image_url || null;

      // Upload image if selected
      if (selectedImage) {
        const uploadedUrl = await uploadImage(selectedImage, 'portfolio');
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          // Upload failed, don't proceed
          return;
        }
      }

      const formattedData = {
        title: data.title,
        description: data.description,
        type: data.type,
        technologies: data.technologies.split(',').map(tech => tech.trim()).filter(tech => tech.length > 0),
        url: data.url || null,
        image_url: imageUrl,
        status: data.status,
        featured: data.featured,
        order_index: data.order_index,
      };

      if (formMode === 'create') {
        await createItem(formattedData);
      } else if (editingItem) {
        // If updating and there's a new image, delete the old one
        if (selectedImage && editingItem.image_url) {
          await deleteImage(editingItem.image_url);
        }
        await updateItem(editingItem.id, formattedData);
      }

      closeDialog();
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirmId === id) {
      try {
        await deleteItem(id);
        setDeleteConfirmId(null);
      } catch (error) {
        console.error("Error deleting item:", error);
      }
    } else {
      setDeleteConfirmId(id);
      setTimeout(() => setDeleteConfirmId(null), 3000); // Reset after 3 seconds
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'draft': return 'outline';
      default: return 'secondary';
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    return type === 'site' ? 'default' : 'secondary';
  };

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerenciar Portfólio</h1>
            <p className="text-muted-foreground">Adicione e edite seus projetos</p>
          </div>
        </div>
        <Button onClick={openCreateDialog} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Projeto
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Projetos</CardTitle>
          <CardDescription>Todos os sites e automações cadastrados</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum projeto cadastrado</p>
              <Button onClick={openCreateDialog} className="mt-4">
                Criar primeiro projeto
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Imagem</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Tecnologias</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-16 h-12 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-16 h-12 bg-muted rounded-lg flex items-center justify-center">
                            <Briefcase className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {item.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTypeBadgeVariant(item.type)}>
                          {item.type === 'site' ? 'Site' : 'Automação'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.technologies.slice(0, 3).map((tech, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tech}
                            </Badge>
                          ))}
                          {item.technologies.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{item.technologies.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(item.status)}>
                          {item.status === 'active' ? 'Ativo' : 
                           item.status === 'inactive' ? 'Inativo' : 'Rascunho'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleStatus(item.id)}
                          >
                            {item.status === 'active' ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          {item.url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                            >
                              <a href={item.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            className={deleteConfirmId === item.id ? "text-red-600" : ""}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {formMode === 'create' ? 'Criar Projeto' : 'Editar Projeto'}
            </DialogTitle>
            <DialogDescription>
              {formMode === 'create' 
                ? 'Adicione um novo projeto ao seu portfólio'
                : 'Edite as informações do projeto'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  {...form.register("title")}
                  placeholder="Nome do projeto"
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select
                  value={form.watch("type")}
                  onValueChange={(value) => form.setValue("type", value as "site" | "automation")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="site">Site</SelectItem>
                    <SelectItem value="automation">Automação</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.type && (
                  <p className="text-sm text-red-600">{form.formState.errors.type.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="Descreva o projeto detalhadamente"
                rows={3}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-red-600">{form.formState.errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="technologies">Tecnologias *</Label>
              <Input
                id="technologies"
                {...form.register("technologies")}
                placeholder="React, Node.js, PostgreSQL (separadas por vírgula)"
              />
              {form.formState.errors.technologies && (
                <p className="text-sm text-red-600">{form.formState.errors.technologies.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="url">URL do Projeto</Label>
                <Input
                  id="url"
                  {...form.register("url")}
                  placeholder="https://exemplo.com"
                />
                {form.formState.errors.url && (
                  <p className="text-sm text-red-600">{form.formState.errors.url.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Imagem do Projeto</Label>
                
                {/* Image Preview */}
                {(imagePreview || form.watch("image_url")) && (
                  <div className="relative w-full h-32 border-2 border-dashed border-border rounded-lg overflow-hidden">
                    <img
                      src={imagePreview || form.watch("image_url")}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={removeSelectedImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                {/* Upload Button */}
                {!imagePreview && !form.watch("image_url") && (
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Faça upload de uma imagem ou cole uma URL
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('image-upload')?.click()}
                        disabled={isUploading}
                      >
                        {isUploading ? 'Enviando...' : 'Escolher Arquivo'}
                      </Button>
                    </div>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                  </div>
                )}
                
                {/* URL Input as alternative */}
                <div className="space-y-2">
                  <Label htmlFor="image_url" className="text-sm text-muted-foreground">
                    Ou cole uma URL da imagem
                  </Label>
                  <Input
                    id="image_url"
                    {...form.register("image_url")}
                    placeholder="https://exemplo.com/imagem.jpg"
                    disabled={!!selectedImage}
                  />
                  {form.formState.errors.image_url && (
                    <p className="text-sm text-red-600">{form.formState.errors.image_url.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(value) => form.setValue("status", value as "active" | "inactive" | "draft")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="draft">Rascunho</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="order_index">Ordem</Label>
                <Input
                  id="order_index"
                  type="number"
                  {...form.register("order_index", { valueAsNumber: true })}
                  placeholder="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Destacado</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="featured"
                    checked={form.watch("featured")}
                    onCheckedChange={(checked) => form.setValue("featured", !!checked)}
                  />
                  <Label htmlFor="featured" className="text-sm">
                    Projeto em destaque
                  </Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button type="submit">
                {formMode === 'create' ? 'Criar Projeto' : 'Atualizar Projeto'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PortfolioManager;
