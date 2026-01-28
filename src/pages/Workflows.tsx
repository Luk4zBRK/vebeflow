import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, User, Eye, Search, ArrowRight, Workflow as WorkflowIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Workflow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  author_name: string | null;
  views_count: number;
  created_at: string;
}

const Workflows = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [filteredWorkflows, setFilteredWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchWorkflows();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredWorkflows(workflows);
    } else {
      const filtered = workflows.filter(
        (workflow) =>
          workflow.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          workflow.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredWorkflows(filtered);
    }
  }, [searchTerm, workflows]);

  const fetchWorkflows = async () => {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkflows(data || []);
      setFilteredWorkflows(data || []);
    } catch (error) {
      console.error('Erro ao carregar workflows:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os workflows',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleWorkflowClick = (slug: string) => {
    navigate(`/workflows/${slug}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-background py-20 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
            <WorkflowIcon className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Workflows</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Workflows e Automações
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Descubra processos, automações e fluxos de trabalho para otimizar seu desenvolvimento
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar workflows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 text-lg"
            />
          </div>
        </div>
      </section>

      {/* Workflows Grid */}
      <section className="py-16 px-4 flex-1">
        <div className="container mx-auto max-w-6xl">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredWorkflows.length === 0 ? (
            <div className="text-center py-16">
              <WorkflowIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {searchTerm ? 'Nenhum workflow encontrado' : 'Nenhum workflow publicado'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm
                  ? 'Tente buscar com outros termos'
                  : 'Novos workflows serão publicados em breve'}
              </p>
              {searchTerm && (
                <Button variant="outline" onClick={() => setSearchTerm('')}>
                  Limpar busca
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold">
                    {searchTerm ? 'Resultados da busca' : 'Todos os Workflows'}
                  </h2>
                  <p className="text-muted-foreground">
                    {filteredWorkflows.length} workflow{filteredWorkflows.length !== 1 ? 's' : ''}{' '}
                    {searchTerm ? 'encontrado' : 'disponível'}
                    {filteredWorkflows.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredWorkflows.map((workflow) => (
                  <Card
                    key={workflow.id}
                    className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => handleWorkflowClick(workflow.slug)}
                  >
                    {/* Image */}
                    <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
                      {workflow.image_url ? (
                        <img
                          src={workflow.image_url}
                          alt={workflow.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <WorkflowIcon className="h-16 w-16 text-primary/40" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <Badge className="absolute top-4 right-4 bg-background/90 backdrop-blur">
                        Workflow
                      </Badge>
                    </div>

                    {/* Content */}
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
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {workflow.author_name && (
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>{workflow.author_name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(workflow.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>{workflow.views_count}</span>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      >
                        Ver workflow
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Workflows;
