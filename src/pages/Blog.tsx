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
  RefreshCw
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

      {/* Categorias */}
      {categories.length > 0 && (
        <section className="py-6 border-b">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                Todos
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category as string)}
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Novidades das IDEs */}
      <section className="py-10 border-b bg-muted/40">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10 text-primary">
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
              <RefreshCw className="h-4 w-4 mr-2" />
              {carregandoNoticias ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </div>

          <div className="mt-6">
            {carregandoNoticias ? (
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Carregando novidades...</span>
              </div>
            ) : erroNoticias ? (
              <div className="p-4 border rounded-lg bg-destructive/10 text-destructive">
                {erroNoticias}
              </div>
            ) : noticias.length === 0 ? (
              <div className="p-4 border rounded-lg text-muted-foreground">
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
        </div>
      </section>

      {/* Lista de Posts */}
      <section className="py-12">
        <div className="container mx-auto px-4">
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
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Blog;
