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
  Eye, 
  ArrowRight, 
  Search,
  Tag,
  Plug,
  Github,
  Package,
  Terminal
} from 'lucide-react';

interface McpServer {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string;
  image_url: string | null;
  author_name: string | null;
  category: string | null;
  tags: string[];
  npm_package: string | null;
  github_url: string | null;
  install_command: string | null;
  views_count: number;
  created_at: string;
}

const McpServers = () => {
  const navigate = useNavigate();
  const [servers, setServers] = useState<McpServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('mcp_servers')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServers(data || []);
    } catch (error) {
      console.error('Erro ao carregar servidores MCP:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [...new Set(servers.map(s => s.category).filter(Boolean))];

  const filteredServers = servers.filter(server => {
    const matchesSearch = server.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (server.description && server.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || server.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getCategoryColor = (category: string | null) => {
    const colors: Record<string, string> = {
      'development': 'bg-blue-500/10 text-blue-700 border-blue-200',
      'data': 'bg-purple-500/10 text-purple-700 border-purple-200',
      'ai': 'bg-orange-500/10 text-orange-700 border-orange-200',
      'productivity': 'bg-green-500/10 text-green-700 border-green-200',
    };
    return colors[category || ''] || 'bg-gray-500/10 text-gray-700 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-24 pb-12 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-primary mb-4">
              <Plug className="h-6 w-6" />
              <span className="text-sm font-medium uppercase tracking-wider">MCP Servers</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Servidores <span className="text-primary">MCP</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Descubra e compartilhe servidores Model Context Protocol para potencializar suas IDEs com IA.
            </p>
            
            {/* Barra de Busca */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar servidores MCP..."
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
                  <Tag className="h-3 w-3 mr-1" />
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Lista de Servidores */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando servidores MCP...</p>
            </div>
          ) : filteredServers.length === 0 ? (
            <div className="text-center py-12">
              <Plug className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum servidor encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? 'Tente buscar por outros termos.'
                  : 'Novos servidores MCP serão publicados em breve!'}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredServers.map((server) => (
                <Card
                  key={server.id}
                  className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => navigate(`/mcp-servers/${server.slug}`)}
                >
                  <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
                    {server.image_url ? (
                      <img
                        src={server.image_url}
                        alt={server.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Plug className="h-16 w-16 text-primary/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    {server.category && (
                      <Badge className={`absolute top-4 right-4 ${getCategoryColor(server.category)}`}>
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

                  <CardContent className="space-y-4">
                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(server.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{server.views_count}</span>
                      </div>
                    </div>

                    {/* Links Rápidos */}
                    <div className="flex flex-wrap gap-2">
                      {server.npm_package && (
                        <Badge variant="outline" className="text-xs">
                          <Package className="h-3 w-3 mr-1" />
                          npm
                        </Badge>
                      )}
                      {server.github_url && (
                        <Badge variant="outline" className="text-xs">
                          <Github className="h-3 w-3 mr-1" />
                          GitHub
                        </Badge>
                      )}
                      {server.install_command && (
                        <Badge variant="outline" className="text-xs">
                          <Terminal className="h-3 w-3 mr-1" />
                          CLI
                        </Badge>
                      )}
                    </div>

                    {/* Tags */}
                    {server.tags && server.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {server.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <Button variant="ghost" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      Ver detalhes
                      <ArrowRight className="ml-2 h-4 w-4" />
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

export default McpServers;
