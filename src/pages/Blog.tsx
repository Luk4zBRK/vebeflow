import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Calendar, 
  Clock, 
  Eye, 
  ArrowRight, 
  Search,
  Tag,
  BookOpen,
  Newspaper,
  RefreshCw,
  Workflow,
  Server,
  Sparkles,
  Plug,
  Star,
  ExternalLink
} from 'lucide-react';
import { useChangelogNews } from '@/hooks/useChangelogNews';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  author_name: string | null;
  category: string | null;
  tags: string[];
  views_count: number;
  published_at: string;
  created_at: string;
}

const Blog = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'blog' | 'news' | 'workflows' | 'vps' | 'mcp' | 'sites'>('blog');
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loadingWorkflows, setLoadingWorkflows] = useState(false);
  const [mcpServers, setMcpServers] = useState<any[]>([]);
  const [loadingMcp, setLoadingMcp] = useState(false);
  const [recommendedSites, setRecommendedSites] = useState<any[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const {
    noticias,
    carregando: carregandoNoticias,
    erro: erroNoticias,
    atualizadoEm,
    atualizar,
  } = useChangelogNews();

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (selectedView === 'workflows') {
      fetchWorkflows();
    } else if (selectedView === 'mcp') {
      fetchMcpServers();
    } else if (selectedView === 'sites') {
      fetchRecommendedSites();
    }
  }, [selectedView]);

  const fetchWorkflows = async () => {
    setLoadingWorkflows(true);
    try {
      const { data, error } = await (supabase as any)
        .from('workflows')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkflows(data || []);
    } catch (error) {
      console.error('Erro ao carregar workflows:', error);
    } finally {
      setLoadingWorkflows(false);
    }
  };

  const fetchMcpServers = async () => {
    setLoadingMcp(true);
    try {
      const { data, error } = await (supabase as any)
        .from('mcp_servers')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMcpServers(data || []);
    } catch (error) {
      console.error('Erro ao carregar servidores MCP:', error);
    } finally {
      setLoadingMcp(false);
    }
  };

  const fetchRecommendedSites = async () => {
    setLoadingSites(true);
    try {
      const { data, error } = await (supabase as any)
        .from('recommended_sites')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) throw error;
      setRecommendedSites(data || []);
    } catch (error) {
      console.error('Erro ao carregar sites recomendados:', error);
    } finally {
      setLoadingSites(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Erro ao carregar posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [...new Set(posts.map(p => p.category).filter(Boolean))];

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.excerpt && post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const estimateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min de leitura`;
  };

  const normalizeTags = (tags: any) => {
    if (Array.isArray(tags)) return tags.filter(Boolean);
    if (typeof tags === 'string') {
      return tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    }
    return [];
  };

  const resolveCoverUrl = (coverImage?: string | null) => {
    if (!coverImage) return null;
    if (coverImage.startsWith('http')) return coverImage;
    const { data } = supabase.storage.from('images').getPublicUrl(coverImage);
    return data?.publicUrl || null;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-24 pb-12 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-primary mb-4">
              <BookOpen className="h-6 w-6" />
              <span className="text-sm font-medium uppercase tracking-wider">Blog</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Artigos e <span className="text-primary">Novidades</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Fique por dentro das últimas tendências em automação, desenvolvimento e tecnologia.
            </p>
            
            {/* Barra de Busca */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar artigos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Filtros/Abas */}
      {posts.length > 0 && (
        <section className="py-6 border-b">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {/* Todos */}
              <Button
                variant={selectedView === 'blog' && selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedView('blog');
                  setSelectedCategory(null);
                }}
              >
                Todos
              </Button>
              
              {/* Tecnologia (categoria) */}
              {categories.includes('Tecnologia') && (
                <Button
                  variant={selectedView === 'blog' && selectedCategory === 'Tecnologia' ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedView('blog');
                    setSelectedCategory('Tecnologia');
                  }}
                >
                  <Tag className="h-3 w-3 mr-1" />
                  Tecnologia
                </Button>
              )}
              
              {/* Novidades IDEs */}
              <Button
                variant={selectedView === 'news' ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedView('news')}
                className={selectedView === 'news' ? '' : 'border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950'}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Novidades IDEs
              </Button>
              
              {/* Workflows */}
              <Button
                variant={selectedView === 'workflows' ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedView('workflows')}
                className={selectedView === 'workflows' ? '' : 'border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950'}
              >
                <Workflow className="h-3 w-3 mr-1" />
                Workflows
              </Button>
              
              {/* MCP Servers */}
              <Button
                variant={selectedView === 'mcp' ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedView('mcp')}
                className={selectedView === 'mcp' ? '' : 'border-cyan-200 text-cyan-700 hover:bg-cyan-50 dark:border-cyan-800 dark:text-cyan-400 dark:hover:bg-cyan-950'}
              >
                <Plug className="h-3 w-3 mr-1" />
                MCP Servers
              </Button>
              
              {/* Sites Recomendados */}
              <Button
                variant={selectedView === 'sites' ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedView('sites')}
                className={selectedView === 'sites' ? '' : 'border-yellow-200 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-800 dark:text-yellow-400 dark:hover:bg-yellow-950'}
              >
                <Star className="h-3 w-3 mr-1" />
                Sites Úteis
              </Button>
              
              {/* Gerador VPS */}
              <Button
                variant={selectedView === 'vps' ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedView('vps')}
                className={selectedView === 'vps' ? '' : 'border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-950'}
              >
                <Server className="h-3 w-3 mr-1" />
                Gerador VPS
              </Button>
              
              {/* Outras categorias do blog */}
              {selectedView === 'blog' && categories.filter(c => c !== 'Tecnologia').map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedView('blog');
                    setSelectedCategory(category as string);
                  }}
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Conteúdo Dinâmico baseado em selectedView */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* View: Blog Posts */}
          {selectedView === 'blog' && (
            <>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Carregando artigos...</p>
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Nenhum artigo encontrado</h3>
                  <p className="text-muted-foreground">
                    {searchTerm 
                      ? 'Tente buscar por outros termos.'
                      : 'Em breve publicaremos novos conteúdos!'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {filteredPosts.map((post) => (
                    <Card 
                      key={post.id} 
                      className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                      onClick={() => navigate(`/blog/${post.slug}`)}
                    >
                      {/* Imagem de Capa */}
                      {resolveCoverUrl(post.cover_image_url) ? (
                        <div className="aspect-video overflow-hidden">
                          <img
                            src={resolveCoverUrl(post.cover_image_url) || ''}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <BookOpen className="h-12 w-12 text-primary/50" />
                        </div>
                      )}

                      <CardHeader className="pb-2">
                        {post.category && (
                          <Badge variant="secondary" className="w-fit mb-2">
                            {post.category}
                          </Badge>
                        )}
                        <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                          {post.title}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {post.excerpt && (
                          <CardDescription className="line-clamp-3">
                            {post.excerpt}
                          </CardDescription>
                        )}

                        {/* Meta Info */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(post.published_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {estimateReadTime(post.content)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {post.views_count}
                          </span>
                        </div>

                        {/* Tags */}
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {post.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <Button variant="ghost" className="w-full group-hover:bg-primary/10">
                          Ler mais
                          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {/* View: Novidades IDEs */}
          {selectedView === 'news' && (
            <div className="max-w-6xl mx-auto">
              {/* Alerta de dados desatualizados */}
              {atualizadoEm && (
                (() => {
                  const horasDesdeAtualizacao = (Date.now() - atualizadoEm.getTime()) / (1000 * 60 * 60);
                  const estaDesatualizado = horasDesdeAtualizacao > 24;
                  
                  if (estaDesatualizado) {
                    return (
                      <div className="mb-6 p-4 border border-orange-200 rounded-lg bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
                        <div className="flex items-start gap-3">
                          <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                              Dados desatualizados
                            </h3>
                            <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                              As novidades foram atualizadas há mais de 24 horas. 
                              Clique em "Atualizar" para buscar as informações mais recentes.
                            </p>
                            <Button 
                              size="sm" 
                              onClick={atualizar} 
                              disabled={carregandoNoticias}
                              className="bg-orange-600 hover:bg-orange-700 text-white"
                            >
                              <RefreshCw className={`h-4 w-4 mr-2 ${carregandoNoticias ? 'animate-spin' : ''}`} />
                              {carregandoNoticias ? 'Atualizando...' : 'Atualizar Agora'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()
              )}

              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-orange-500/10 text-orange-600">
                    <Newspaper className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-widest">News</p>
                    <h2 className="text-2xl font-bold">Novidades das IDEs</h2>
                    {atualizadoEm && (
                      <p className="text-xs text-muted-foreground">
                        Atualizado em {atualizadoEm.toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={atualizar} disabled={carregandoNoticias}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${carregandoNoticias ? 'animate-spin' : ''}`} />
                  {carregandoNoticias ? 'Atualizando...' : 'Atualizar'}
                </Button>
              </div>

              {carregandoNoticias ? (
                <div className="flex items-center gap-3 text-muted-foreground justify-center py-12">
                  <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Carregando novidades...</span>
                </div>
              ) : erroNoticias ? (
                <div className="p-4 border rounded-lg bg-destructive/10 text-destructive">
                  {erroNoticias}
                </div>
              ) : noticias.length === 0 ? (
                <div className="p-4 border rounded-lg text-muted-foreground text-center">
                  Nenhuma novidade encontrada no momento.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {noticias.map((item, index) => (
                    <Card key={index} className="h-full flex flex-col">
                      <CardHeader>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <CardTitle className="text-lg line-clamp-2">{item.titulo}</CardTitle>
                          {item.fonte && (
                            <span
                              className="text-[11px] px-2 py-1 rounded-full font-medium"
                              style={{
                                backgroundColor: `${item.cor || '#e5e7eb'}20`,
                                color: item.cor || '#111827',
                                border: `1px solid ${item.cor || '#e5e7eb'}`,
                              }}
                            >
                              {item.logo ? `${item.logo} ` : ''}{item.fonte}
                            </span>
                          )}
                        </div>
                        <CardDescription className="line-clamp-3">
                          {item.resumo || 'Atualização recente da IDE.'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="mt-auto">
                        <Button variant="ghost" className="w-full" asChild>
                          <a href={item.link} target="_blank" rel="noreferrer">
                            Ver detalhes
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* View: Workflows */}
          {selectedView === 'workflows' && (
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 rounded-full bg-green-500/10 text-green-600">
                  <Workflow className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Workflows e Automações</h2>
                  <p className="text-sm text-muted-foreground">
                    Processos e fluxos de trabalho para otimizar seu desenvolvimento
                  </p>
                </div>
              </div>

              {loadingWorkflows ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Carregando workflows...</p>
                </div>
              ) : workflows.length === 0 ? (
                <div className="text-center py-12">
                  <Workflow className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Nenhum workflow publicado</h3>
                  <p className="text-muted-foreground mb-6">
                    Novos workflows serão publicados em breve
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {workflows.map((workflow) => (
                    <Card
                      key={workflow.id}
                      className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                      onClick={() => navigate(`/workflows/${workflow.slug}`)}
                    >
                      <div className="relative h-48 bg-gradient-to-br from-green-500/20 to-green-500/5 overflow-hidden">
                        {workflow.image_url ? (
                          <img
                            src={workflow.image_url}
                            alt={workflow.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Workflow className="h-16 w-16 text-green-500/40" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <Badge className="absolute top-4 right-4 bg-background/90 backdrop-blur">
                          Workflow
                        </Badge>
                      </div>

                      <CardHeader>
                        <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                          {workflow.title}
                        </CardTitle>
                        {workflow.description && (
                          <CardDescription className="line-clamp-2">
                            {workflow.description}
                          </CardDescription>
                        )}
                      </CardHeader>

                      <CardContent>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(workflow.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            <span>{workflow.views_count}</span>
                          </div>
                        </div>

                        <Button variant="ghost" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          Ver workflow
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* View: MCP Servers */}
          {selectedView === 'mcp' && (
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 rounded-full bg-cyan-500/10 text-cyan-600">
                  <Plug className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Servidores MCP</h2>
                  <p className="text-sm text-muted-foreground">
                    Model Context Protocol servers para potencializar suas IDEs com IA
                  </p>
                </div>
              </div>

              {loadingMcp ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Carregando servidores MCP...</p>
                </div>
              ) : mcpServers.length === 0 ? (
                <div className="text-center py-12">
                  <Plug className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Nenhum servidor MCP publicado</h3>
                  <p className="text-muted-foreground mb-6">
                    Novos servidores MCP serão publicados em breve
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {mcpServers.map((server) => (
                    <Card
                      key={server.id}
                      className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                      onClick={() => navigate(`/mcp-servers/${server.slug}`)}
                    >
                      <div className="relative h-48 bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 overflow-hidden">
                        {server.image_url ? (
                          <img
                            src={server.image_url}
                            alt={server.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Plug className="h-16 w-16 text-cyan-500/40" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        {server.category && (
                          <Badge className="absolute top-4 right-4 bg-background/90 backdrop-blur">
                            {server.category}
                          </Badge>
                        )}
                      </div>

                      <CardHeader>
                        <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                          {server.title}
                        </CardTitle>
                        {server.description && (
                          <CardDescription className="line-clamp-2">
                            {server.description}
                          </CardDescription>
                        )}
                      </CardHeader>

                      <CardContent>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(server.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            <span>{server.views_count}</span>
                          </div>
                        </div>

                        <Button variant="ghost" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          Ver servidor
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* View: Gerador VPS */}
          {selectedView === 'vps' && (
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 rounded-full bg-purple-500/10 text-purple-600">
                  <Server className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Gerador de Schema VPS</h2>
                  <p className="text-sm text-muted-foreground">
                    Ferramenta para gerar schemas de configuração de VPS
                  </p>
                </div>
              </div>

              <Card className="overflow-hidden hover:shadow-lg transition-all">
                <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center">
                  <Server className="h-24 w-24 text-purple-500/40" />
                </div>

                <CardHeader>
                  <CardTitle>Gerador de Schema VPS</CardTitle>
                  <CardDescription>
                    Crie e configure schemas de VPS de forma rápida e eficiente. 
                    Ideal para desenvolvedores que precisam provisionar servidores com configurações padronizadas.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Recursos:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Geração automática de schemas</li>
                      <li>Templates pré-configurados</li>
                      <li>Suporte a múltiplos provedores</li>
                      <li>Exportação em diversos formatos</li>
                    </ul>
                  </div>

                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => navigate('/vps-generator')}
                  >
                    Acessar Gerador
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* View: Sites Recomendados */}
          {selectedView === 'sites' && (
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-yellow-500/10 text-yellow-600">
                    <Star className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Sites Recomendados</h2>
                    <p className="text-sm text-muted-foreground">
                      Ferramentas e recursos úteis para desenvolvimento e design
                    </p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => navigate('/recommended-sites')}>
                  Ver Todos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              {loadingSites ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Carregando sites...</p>
                </div>
              ) : recommendedSites.length === 0 ? (
                <div className="text-center py-12">
                  <Star className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Nenhum site recomendado</h3>
                  <p className="text-muted-foreground mb-6">
                    Novos sites serão adicionados em breve
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {recommendedSites.map((site) => (
                    <Card
                      key={site.id}
                      className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                      onClick={() => window.open(site.url, '_blank')}
                    >
                      <div className="relative h-48 bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 overflow-hidden">
                        {site.image_url ? (
                          <img
                            src={site.image_url}
                            alt={site.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Star className="h-16 w-16 text-yellow-500/40" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        {site.category && (
                          <Badge className="absolute top-4 right-4 bg-background/90 backdrop-blur">
                            {site.category}
                          </Badge>
                        )}
                      </div>

                      <CardHeader>
                        <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                          {site.title}
                        </CardTitle>
                        {site.description && (
                          <CardDescription className="line-clamp-2">
                            {site.description}
                          </CardDescription>
                        )}
                      </CardHeader>

                      <CardContent>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                          <ExternalLink className="h-4 w-4" />
                          <span className="truncate">{new URL(site.url).hostname}</span>
                        </div>

                        <Button variant="ghost" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          Visitar site
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Blog;
