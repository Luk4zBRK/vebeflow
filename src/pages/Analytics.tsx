import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, BarChart3, Users, Eye, Clock, MousePointer, Scroll } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

interface AnalyticsData {
  totalPageViews: number;
  uniqueVisitors: number;
  avgTimeOnPage: number;
  topPages: Array<{ page: string; views: number }>;
  eventsByType: Array<{ event_name: string; count: number }>;
  scrollDepth: Array<{ depth: string; count: number }>;
  hourlyViews: Array<{ hour: string; views: number }>;
}

const Analytics = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7days');

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate('/auth');
    }
  }, [user, isAdmin, isLoading, navigate]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Calcular data de início baseado no range selecionado
      const now = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '24hours':
          startDate.setDate(now.getDate() - 1);
          break;
        case '7days':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90days':
          startDate.setDate(now.getDate() - 90);
          break;
      }

      // Buscar dados de analytics
      const { data: events, error } = await supabase
        .from('analytics_events' as any)
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Processar dados
      const processedData: AnalyticsData = {
        totalPageViews: events.filter(e => e.event_name === 'page_view').length,
        uniqueVisitors: new Set(events.map(e => e.session_id)).size,
        avgTimeOnPage: 0,
        topPages: [],
        eventsByType: [],
        scrollDepth: [],
        hourlyViews: []
      };

      // Top páginas
      const pageViews = events.filter(e => e.event_name === 'page_view');
      const pageViewsCount = pageViews.reduce((acc: Record<string, number>, event) => {
        const page = event.event_data?.page_path || event.page_url;
        acc[page] = (acc[page] || 0) + 1;
        return acc;
      }, {});
      
      processedData.topPages = Object.entries(pageViewsCount)
        .map(([page, views]) => ({ page, views: views as number }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      // Eventos por tipo
      const eventsByType = events.reduce((acc: Record<string, number>, event) => {
        acc[event.event_name] = (acc[event.event_name] || 0) + 1;
        return acc;
      }, {});
      
      processedData.eventsByType = Object.entries(eventsByType)
        .map(([event_name, count]) => ({ event_name, count: count as number }))
        .sort((a, b) => b.count - a.count);

      // Profundidade de scroll
      const scrollEvents = events.filter(e => e.event_name === 'scroll_depth');
      const scrollDepthCount = scrollEvents.reduce((acc: Record<string, number>, event) => {
        const depth = `${event.event_data?.scroll_percentage}%`;
        acc[depth] = (acc[depth] || 0) + 1;
        return acc;
      }, {});
      
      processedData.scrollDepth = Object.entries(scrollDepthCount)
        .map(([depth, count]) => ({ depth, count: count as number }))
        .sort((a, b) => parseInt(a.depth) - parseInt(b.depth));

      // Views por hora (últimas 24h)
      const last24h = events.filter(e => {
        const eventTime = new Date(e.created_at);
        return eventTime > new Date(Date.now() - 24 * 60 * 60 * 1000) && e.event_name === 'page_view';
      });
      
      const hourlyViewsCount = last24h.reduce((acc: Record<string, number>, event) => {
        const hour = new Date(event.created_at).getHours();
        const hourLabel = `${hour.toString().padStart(2, '0')}:00`;
        acc[hourLabel] = (acc[hourLabel] || 0) + 1;
        return acc;
      }, {});
      
      processedData.hourlyViews = Array.from({ length: 24 }, (_, i) => {
        const hour = `${i.toString().padStart(2, '0')}:00`;
        return { hour, views: hourlyViewsCount[hour] || 0 };
      });

      // Tempo médio na página
      const timeOnPageEvents = events.filter(e => e.event_name === 'time_on_page');
      if (timeOnPageEvents.length > 0) {
        const totalTime = timeOnPageEvents.reduce((sum, event) => {
          return sum + (event.event_data?.time_seconds || 0);
        }, 0);
        processedData.avgTimeOnPage = Math.round(totalTime / timeOnPageEvents.length);
      }

      setAnalyticsData(processedData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && isAdmin) {
      fetchAnalyticsData();
    }
  }, [user, isAdmin, timeRange]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando analytics...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin || !analyticsData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">Acompanhe o comportamento dos usuários</p>
          </div>
          
          <div className="flex gap-2">
            {[
              { value: '24hours', label: '24h' },
              { value: '7days', label: '7 dias' },
              { value: '30days', label: '30 dias' },
              { value: '90days', label: '90 dias' }
            ].map((option) => (
              <Button
                key={option.value}
                variant={timeRange === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Cards de métricas principais */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Page Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.totalPageViews}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visitantes únicos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.uniqueVisitors}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo médio</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatTime(analyticsData.avgTimeOnPage)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData.eventsByType.reduce((sum, event) => sum + event.count, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="behavior" className="flex items-center gap-2">
              <Scroll className="h-4 w-4" />
              Comportamento
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Views por Hora (24h)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData.hourlyViews}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="views" stroke="#8884d8" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Páginas Mais Visitadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.topPages}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="page" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="views" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="behavior">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Eventos por Tipo</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analyticsData.eventsByType}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ event_name, percent }) => `${event_name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {analyticsData.eventsByType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Profundidade de Scroll</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.scrollDepth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="depth" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Analytics;
