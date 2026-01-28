import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Calendar, 
  Eye, 
  User,
  Github,
  Package,
  Terminal,
  Copy,
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

const McpServerPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [server, setServer] = useState<McpServer | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchServer();
    }
  }, [slug]);

  const fetchServer = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('mcp_servers')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) throw error;

      if (data) {
        setServer(data);
        // Incrementar contador de visualizações
        await (supabase as any).rpc('increment_mcp_server_views', { server_slug: slug });
      }
    } catch (error) {
      console.error('Erro ao carregar servidor MCP:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o servidor MCP.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: 'Copiado!',
      description: 'Comando copiado para a área de transferência.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando servidor MCP...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!server) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-24">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Servidor MCP não encontrado</h2>
            <Button onClick={() => navigate('/mcp-servers')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para servidores MCP
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <article className="container mx-auto px-4 py-24">
        {/* Botão Voltar */}
        <Button
          variant="ghost"
          onClick={() => navigate('/mcp-servers')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para servidores MCP
        </Button>

        {/* Cabeçalho */}
        <div className="max-w-4xl mx-auto mb-8">
          {server.category && (
            <Badge className="mb-4">{server.category}</Badge>
          )}
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{server.title}</h1>
          {server.description && (
            <p className="text-xl text-muted-foreground mb-6">{server.description}</p>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground mb-6">
            {server.author_name && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{server.author_name}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(server.created_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>{server.views_count} visualizações</span>
            </div>
          </div>

          {/* Links Rápidos */}
          <div className="flex flex-wrap gap-3 mb-8">
            {server.github_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={server.github_url} target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4 mr-2" />
                  GitHub
                </a>
              </Button>
            )}
            {server.npm_package && (
              <Button variant="outline" size="sm" asChild>
                <a href={`https://www.npmjs.com/package/${server.npm_package}`} target="_blank" rel="noopener noreferrer">
                  <Package className="h-4 w-4 mr-2" />
                  npm
                </a>
              </Button>
            )}
          </div>

          {/* Comando de Instalação */}
          {server.install_command && (
            <Card className="mb-8">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <Terminal className="h-5 w-5 text-primary" />
                    <code className="text-sm bg-muted px-3 py-1 rounded flex-1 overflow-x-auto">
                      {server.install_command}
                    </code>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(server.install_command!)}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {server.tags && server.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {server.tags.map((tag, index) => (
                <Badge key={index} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Imagem de Capa */}
        {server.image_url && (
          <div className="max-w-4xl mx-auto mb-12">
            <img
              src={server.image_url}
              alt={server.title}
              className="w-full rounded-lg shadow-lg"
            />
          </div>
        )}

        {/* Conteúdo */}
        <div 
          className="max-w-4xl mx-auto prose prose-lg dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: server.content }}
        />
      </article>

      <Footer />
    </div>
  );
};

export default McpServerPost;
