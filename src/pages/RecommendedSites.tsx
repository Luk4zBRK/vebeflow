import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search,
  Tag,
  ExternalLink,
  Eye,
  MousePointerClick,
  Star
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
  views_count: number;
  clicks_count: number;
  created_at: string;
}

const RecommendedSites = () => {
  const [sites, setSites] = useState<RecommendedSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('recommended_sites')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSites(data || []);
    } catch (error) {
      console.error('Erro ao carregar sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSiteClick = async (site: RecommendedSite) => {
    // Incrementar contador de cliques
    await (supabase as any).rpc('increment_site_clicks', { site_slug: site.slug });
    // Abrir site em nova aba
    window.open(site.url, '_blank', 'noopener,noreferrer');
  };

  const categories = [...new Set(sites.map(s => s.category).filter(Boolean))];

  const filteredSites = sites.filter(site => {
    const matchesSearch = site.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (site.description && site.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || site.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string | null) => {
    const colors: Record<string, string> = {
      'development': 'bg-blue-500/10 text-blue-700 border-blue-200',
      'design': 'bg-purple-500/10 text-purple-700 border-purple-200',
      'ai': 'bg-orange-500/10 text-orange-700 border-orange-200',
      'learning': 'bg-green-500/10 text-green-700 border-green-200',
      'tools': 'bg-cyan-500/10 text-cyan-700 border-cyan-200',
    };
    return colors[category || ''] || 'bg-gray-500/10 text-gray-700 border-gray-200';
  };

  const getCategoryIcon = (category: string | null) => {
    switch (category) {
      case 'development': return '💻';
      case 'design': return '🎨';
      case 'ai': return '🤖';
      case 'learning': return '📚';
      case 'tools': return '🛠️';
      default: return '🌐';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-24 pb-12 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-primary mb-4">
              <Star className="h-6 w-6" />
              <span className="text-sm font-medium uppercase tracking-wider">Sites Recomendados</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Ferramentas e <span className="text-primary">Recursos</span> Úteis
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Descubra sites incríveis para desenvolvimento, design, IA e aprendizado.
            </p>
            
            {/* Barra de Busca */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar sites..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Filtros de Categoria */}
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
                  <span className="mr-1">{getCategoryIcon(category as string)}</span>
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Lista de Sites */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando sites...</p>
            </div>
          ) : filteredSites.length === 0 ? (
            <div className="text-center py-12">
              <Star className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum site encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? 'Tente buscar por outros termos.'
                  : 'Novos sites serão adicionados em breve!'}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredSites.map((site) => (
                <Card
                  key={site.id}
                  className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => handleSiteClick(site)}
                >
                  <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
                    {site.image_url ? (
                      <img
                        src={site.image_url}
                        alt={site.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-6xl">{getCategoryIcon(site.category)}</div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    {site.category && (
                      <Badge className={`absolute top-4 right-4 ${getCategoryColor(site.category)}`}>
                        {site.category}
                      </Badge>
                    )}
                  </div>

                  <CardHeader>
                    <div className="flex items-start gap-3">
                      {site.favicon_url && (
                        <img src={site.favicon_url} alt="" className="w-6 h-6 rounded" />
                      )}
                      <div className="flex-1">
                        <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                          {site.title}
                        </CardTitle>
                        {site.description && (
                          <CardDescription className="line-clamp-2 mt-2">
                            {site.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* URL */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ExternalLink className="h-4 w-4" />
                      <span className="truncate">{new URL(site.url).hostname}</span>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{site.views_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MousePointerClick className="h-4 w-4" />
                        <span>{site.clicks_count}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    {site.tags && site.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {site.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

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
      </section>

      <Footer />
    </div>
  );
};

export default RecommendedSites;
