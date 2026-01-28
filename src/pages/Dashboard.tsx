import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Home, 
  Mail, 
  MessageSquare,
  Calendar, 
  Settings, 
  BarChart3, 
  FileText, 
  Briefcase, 
  Server,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Wrench,
  FolderOpen,
  TrendingUp,
  Bell,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  BookOpen,
  Newspaper,
  MessageSquarePlus,
  MessagesSquare,
  Send,
  Circle,
  Copy,
  Workflow,
  Plug,
  Star
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: string;
  created_at: string;
}

type ActiveSection = 'overview' | 'messages' | 'forms' | 'portfolio' | 'vps-analytics' | 'analytics' | 'settings' | 'blog' | 'feedbacks' | 'chats' | 'newsletter';

interface ChatConversation {
  id: string;
  session_id: string;
  user_email: string | null;
  user_name: string | null;
  status: 'active' | 'closed' | 'waiting_human';
  started_at: string;
  last_message_at: string;
  message_count: number;
  unread_count: number;
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'human_agent';
  content: string;
  created_at: string;
}

interface VpsAnalytics {
  usuariosUnicos: number;
  totalInteracoes: number;
  primeiroAcesso: string | null;
  ultimoAcesso: string | null;
  acoesPopulares: { elemento: string; cliques: number }[];
}

interface Feedback {
  id: string;
  tool_name: string;
  feedback_type: 'sugestao' | 'bug' | 'elogio' | 'duvida';
  message: string;
  rating: number | null;
  user_email: string | null;
  created_at: string;
}

interface NewsletterSubscriber {
  id: string;
  email: string;
  name: string | null;
  subscribed_at: string;
  is_active: boolean;
}

interface MenuItem {
  id: ActiveSection;
  label: string;
  icon: React.ElementType;
  description: string;
  external?: boolean;
  route?: string;
}

interface MenuCategory {
  title: string;
  items: MenuItem[];
}

const Dashboard = () => {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [activeSection, setActiveSection] = useState<ActiveSection>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [vpsAnalytics, setVpsAnalytics] = useState<VpsAnalytics | null>(null);
  const [loadingVpsAnalytics, setLoadingVpsAnalytics] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);

  const unreadChatsCount = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);

  const menuCategories: MenuCategory[] = [
    {
      title: 'Principal',
      items: [
        { id: 'overview', label: 'Visão Geral', icon: Home, description: 'Estatísticas e resumo' },
        { id: 'messages', label: 'Mensagens', icon: Mail, description: 'Caixa de entrada' },
        { id: 'chats', label: 'Chat ao Vivo', icon: MessagesSquare, description: 'Conversas em tempo real' },
        { id: 'feedbacks', label: 'Feedbacks', icon: MessageSquarePlus, description: 'Opiniões dos usuários' },
      ]
    },
    {
      title: 'Ferramentas',
      items: [
        { id: 'vps-analytics', label: 'Gerador VPS', icon: Server, description: 'Analytics da ferramenta' },
        { id: 'forms', label: 'Formulários', icon: FileText, description: 'Gerenciar forms', external: true, route: '/contact-forms' },
      ]
    },
    {
      title: 'Conteúdo',
      items: [
        { id: 'portfolio', label: 'Portfólio', icon: Briefcase, description: 'Projetos', external: true, route: '/portfolio-manager' },
        { id: 'blog', label: 'Blog', icon: Newspaper, description: 'Gerenciar artigos', external: true, route: '/blog-manager' },
        { id: 'workflows' as ActiveSection, label: 'Workflows', icon: Workflow, description: 'Automações e processos', external: true, route: '/workflow-manager' },
        { id: 'mcp-servers' as ActiveSection, label: 'MCP Servers', icon: Plug, description: 'Servidores MCP', external: true, route: '/mcp-manager' },
        { id: 'sites' as ActiveSection, label: 'Sites Úteis', icon: Star, description: 'Sites recomendados', external: true, route: '/sites-manager' },
        { id: 'newsletter', label: 'Newsletter', icon: Send, description: 'Lista de emails' },
      ]
    },
    {
      title: 'Análise',
      items: [
        { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Métricas', external: true, route: '/analytics' },
      ]
    },
    {
      title: 'Sistema',
      items: [
        { id: 'settings', label: 'Configurações', icon: Settings, description: 'Preferências', external: true, route: '/settings' },
      ]
    }
  ];

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate('/auth');
    }
  }, [user, isAdmin, isLoading]); // Removido navigate das dependências para evitar loop

  useEffect(() => {
    if (user && isAdmin) {
      fetchMessages();
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (activeSection === 'vps-analytics' && !vpsAnalytics) {
      fetchVpsAnalytics();
    }
    if (activeSection === 'feedbacks' && feedbacks.length === 0) {
      fetchFeedbacks();
    }
    if (activeSection === 'chats') {
      fetchConversations();
    }
    if (activeSection === 'newsletter' && subscribers.length === 0) {
      fetchSubscribers();
    }
  }, [activeSection]);

  // Realtime para novas conversas e mensagens
  useEffect(() => {
    if (activeSection !== 'chats') return;

    const conversationsChannel = (supabase as any)
      .channel('dashboard_conversations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_conversations' },
        () => fetchConversations()
      )
      .subscribe();

    return () => {
      (supabase as any).removeChannel(conversationsChannel);
    };
  }, [activeSection]);

  // Realtime para mensagens da conversa selecionada
  useEffect(() => {
    if (!selectedConversation) return;

    const messagesChannel = (supabase as any)
      .channel(`messages_${selectedConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${selectedConversation.id}`
        },
        (payload: any) => {
          setChatMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      (supabase as any).removeChannel(messagesChannel);
    };
  }, [selectedConversation]);

  const fetchConversations = async () => {
    setLoadingChats(true);
    try {
      const { data, error } = await (supabase as any)
        .from('chat_conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar as conversas",
        variant: "destructive"
      });
    } finally {
      setLoadingChats(false);
    }
  };

  const fetchChatMessages = async (conversationId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setChatMessages(data || []);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  const handleSelectConversation = (conversation: ChatConversation) => {
    setSelectedConversation(conversation);
    fetchChatMessages(conversation.id);
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedConversation || sendingReply) return;

    setSendingReply(true);
    try {
      const { error } = await (supabase as any)
        .from('chat_messages')
        .insert({
          conversation_id: selectedConversation.id,
          role: 'human_agent',
          content: replyMessage.trim()
        });

      if (error) throw error;
      setReplyMessage('');
      toast({ title: "Mensagem enviada!" });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem",
        variant: "destructive"
      });
    } finally {
      setSendingReply(false);
    }
  };

  const fetchFeedbacks = async () => {
    setLoadingFeedbacks(true);
    try {
      const { data, error } = await (supabase as any)
        .from('feedbacks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeedbacks(data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os feedbacks",
        variant: "destructive"
      });
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  const fetchSubscribers = async () => {
    setLoadingSubscribers(true);
    try {
      const { data, error } = await (supabase as any)
        .from('newsletter_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false });

      if (error) throw error;
      setSubscribers(data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os inscritos",
        variant: "destructive"
      });
    } finally {
      setLoadingSubscribers(false);
    }
  };

  const fetchVpsAnalytics = async () => {
    setLoadingVpsAnalytics(true);
    try {
      // Buscar estatísticas gerais usando RPC ou query direta
      const { data: statsData, error: statsError } = await (supabase as any)
        .from('analytics_events')
        .select('session_id, created_at')
        .ilike('page_url', '%vps%');

      if (statsError) throw statsError;

      const sessionsSet = new Set((statsData || []).map((e: any) => e.session_id));
      const dates = (statsData || []).map((e: any) => new Date(e.created_at));

      // Buscar ações populares
      const { data: actionsData, error: actionsError } = await (supabase as any)
        .from('analytics_events')
        .select('event_data')
        .ilike('page_url', '%vps%')
        .eq('event_name', 'element_click');

      if (actionsError) throw actionsError;

      // Processar ações
      const actionCounts: Record<string, number> = {};
      (actionsData || []).forEach((event: any) => {
        const elementText = event.event_data?.element_text;
        if (elementText && elementText.length < 50) {
          actionCounts[elementText] = (actionCounts[elementText] || 0) + 1;
        }
      });

      const acoesPopulares = Object.entries(actionCounts)
        .map(([elemento, cliques]) => ({ elemento, cliques }))
        .sort((a, b) => b.cliques - a.cliques)
        .slice(0, 10);

      setVpsAnalytics({
        usuariosUnicos: sessionsSet.size,
        totalInteracoes: statsData?.length || 0,
        primeiroAcesso: dates.length > 0 ? new Date(Math.min(...dates.map((d: Date) => d.getTime()))).toISOString() : null,
        ultimoAcesso: dates.length > 0 ? new Date(Math.max(...dates.map((d: Date) => d.getTime()))).toISOString() : null,
        acoesPopulares
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar analytics do VPS Generator",
        variant: "destructive"
      });
    } finally {
      setLoadingVpsAnalytics(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar as mensagens",
        variant: "destructive"
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  const updateMessageStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      setMessages(messages.map(msg => 
        msg.id === id ? { ...msg, status } : msg
      ));

      toast({
        title: "Status atualizado",
        description: `Mensagem marcada como ${status}`
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      'new': { variant: 'secondary' as const, label: 'Nova', icon: AlertCircle, color: 'text-orange-500' },
      'read': { variant: 'outline' as const, label: 'Lida', icon: Clock, color: 'text-blue-500' },
      'responded': { variant: 'default' as const, label: 'Respondida', icon: CheckCircle2, color: 'text-green-500' }
    };

    const { variant, label, icon: Icon, color } = config[status as keyof typeof config] || config.new;

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className={cn("h-3 w-3", color)} />
        {label}
      </Badge>
    );
  };

  const handleMenuClick = (item: MenuItem) => {
    if (item.external && item.route) {
      navigate(item.route);
    } else {
      setActiveSection(item.id);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const newMessagesCount = messages.filter(m => m.status === 'new').length;
  const respondedCount = messages.filter(m => m.status === 'responded').length;
  const responseRate = messages.length > 0 
    ? Math.round((respondedCount / messages.length) * 100) 
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-card border-r transition-all duration-300 flex flex-col",
        sidebarCollapsed ? "w-16" : "w-64"
      )}>
        {/* Logo */}
        <div className="p-4 border-b flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden">
                <img 
                  src="/Transformando ideias em soluções digitais.png" 
                  alt="VF" 
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-bold text-lg">Vibe Flow</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="h-8 w-8"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-4">
          {menuCategories.map((category) => (
            <div key={category.title}>
              {!sidebarCollapsed && (
                <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {category.title}
                </p>
              )}
              <div className="space-y-1">
                {category.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id && !item.external;
                  
                  return (
                    <Button
                      key={item.id}
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3 h-10",
                        sidebarCollapsed && "justify-center px-2",
                        isActive && "bg-primary/10 text-primary"
                      )}
                      onClick={() => handleMenuClick(item)}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {!sidebarCollapsed && (
                        <>
                          <span className="flex-1 text-left">{item.label}</span>
                          {item.external && <ExternalLink className="h-3 w-3 opacity-50" />}
                          {item.id === 'messages' && newMessagesCount > 0 && (
                            <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                              {newMessagesCount}
                            </Badge>
                          )}
                          {item.id === 'chats' && unreadChatsCount > 0 && (
                            <Badge className="h-5 px-1.5 text-xs bg-green-600 hover:bg-green-700">
                              {unreadChatsCount}
                            </Badge>
                          )}
                        </>
                      )}
                      {sidebarCollapsed && item.id === 'messages' && newMessagesCount > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
                      )}
                      {sidebarCollapsed && item.id === 'chats' && unreadChatsCount > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-green-600 rounded-full" />
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Info */}
        <div className="p-2 border-t">
          <div className={cn(
            "flex items-center gap-3 p-2 rounded-lg bg-muted/50",
            sidebarCollapsed && "justify-center"
          )}>
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-border">
              <img 
                src="/Transformando ideias em soluções digitais.png" 
                alt="User" 
                className="w-full h-full object-cover"
              />
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.email}</p>
                <p className="text-xs text-muted-foreground">Administrador</p>
              </div>
            )}
          </div>
          <div className="flex gap-1 mt-2">
            {!sidebarCollapsed && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => navigate('/')}
                title="Voltar ao site"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="ml-2">Ver site</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "text-destructive hover:text-destructive", 
                sidebarCollapsed ? "w-full px-0 justify-center" : "px-2"
              )}
              onClick={handleSignOut}
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
              {!sidebarCollapsed && <span className="ml-2">Sair</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300",
        sidebarCollapsed ? "ml-16" : "ml-64"
      )}>
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {activeSection === 'overview' && 'Visão Geral'}
                {activeSection === 'messages' && 'Mensagens'}
                {activeSection === 'vps-analytics' && 'Gerador VPS'}
                {activeSection === 'feedbacks' && 'Feedbacks'}
                {activeSection === 'chats' && 'Chat ao Vivo'}
                {activeSection === 'newsletter' && 'Newsletter'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {activeSection === 'overview' && 'Acompanhe as métricas do seu sistema'}
                {activeSection === 'messages' && 'Gerencie as mensagens recebidas'}
                {activeSection === 'chats' && 'Monitore e responda conversas em tempo real'}
                {activeSection === 'vps-analytics' && 'Métricas e análises de uso da ferramenta'}
                {activeSection === 'feedbacks' && 'Veja as opiniões e sugestões dos usuários'}
                {activeSection === 'newsletter' && 'Gerencie sua lista de inscritos'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchMessages}>
                <Bell className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {/* Overview Section */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Mensagens</CardTitle>
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{messages.length}</div>
                    <p className="text-xs text-muted-foreground">mensagens recebidas</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow border-orange-200 dark:border-orange-800">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Novas</CardTitle>
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-500">{newMessagesCount}</div>
                    <p className="text-xs text-muted-foreground">aguardando resposta</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow border-green-200 dark:border-green-800">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Respondidas</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-500">{respondedCount}</div>
                    <p className="text-xs text-muted-foreground">mensagens atendidas</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Taxa de Resposta</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{responseRate}%</div>
                    <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${responseRate}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ações Rápidas</CardTitle>
                  <CardDescription>Acesse as principais ferramentas do sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Button
                      variant="outline"
                      className="h-auto py-4 flex flex-col items-center gap-2"
                      onClick={() => setActiveSection('messages')}
                    >
                      <Mail className="h-6 w-6" />
                      <span>Ver Mensagens</span>
                      {newMessagesCount > 0 && (
                        <Badge variant="destructive">{newMessagesCount} novas</Badge>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      className="h-auto py-4 flex flex-col items-center gap-2"
                      onClick={() => navigate('/vps-generator')}
                    >
                      <Server className="h-6 w-6" />
                      <span>Gerador VPS</span>
                    </Button>

                    <Button
                      variant="outline"
                      className="h-auto py-4 flex flex-col items-center gap-2"
                      onClick={() => navigate('/portfolio-manager')}
                    >
                      <Briefcase className="h-6 w-6" />
                      <span>Portfólio</span>
                    </Button>

                    <Button
                      variant="outline"
                      className="h-auto py-4 flex flex-col items-center gap-2"
                      onClick={() => navigate('/settings')}
                    >
                      <Settings className="h-6 w-6" />
                      <span>Configurações</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Messages */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Mensagens Recentes</CardTitle>
                    <CardDescription>Últimas mensagens recebidas</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setActiveSection('messages')}>
                    Ver todas
                  </Button>
                </CardHeader>
                <CardContent>
                  {loadingMessages ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-muted-foreground">Carregando...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8">
                      <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">Nenhuma mensagem</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.slice(0, 5).map((message) => (
                        <div
                          key={message.id}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedMessage(message);
                            setActiveSection('messages');
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary">
                                {message.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{message.name}</p>
                              <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {message.subject || message.message.substring(0, 50)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(message.status)}
                            <span className="text-xs text-muted-foreground">
                              {new Date(message.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Messages Section */}
          {activeSection === 'messages' && (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Messages List */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Caixa de Entrada</CardTitle>
                  <CardDescription>
                    {messages.length} mensagens • {newMessagesCount} não lidas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingMessages ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-muted-foreground">Carregando mensagens...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8">
                      <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">Nenhuma mensagem encontrada</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            "p-4 rounded-lg border cursor-pointer transition-all",
                            selectedMessage?.id === message.id 
                              ? "bg-primary/10 border-primary" 
                              : "hover:bg-muted/50",
                            message.status === 'new' && "border-l-4 border-l-orange-500"
                          )}
                          onClick={() => setSelectedMessage(message)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-semibold text-primary">
                                  {message.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold truncate">{message.name}</p>
                                  {getStatusBadge(message.status)}
                                </div>
                                <p className="text-sm text-muted-foreground truncate">{message.email}</p>
                                <p className="text-sm font-medium mt-1">{message.subject || 'Sem assunto'}</p>
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(message.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Message Detail */}
              <Card>
                <CardHeader>
                  <CardTitle>Detalhes</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedMessage ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-lg font-semibold text-primary">
                            {selectedMessage.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold">{selectedMessage.name}</p>
                          <p className="text-sm text-muted-foreground">{selectedMessage.email}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Status</span>
                          {getStatusBadge(selectedMessage.status)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Data</span>
                          <span className="text-sm">
                            {new Date(selectedMessage.created_at).toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Assunto</p>
                        <p className="font-medium">{selectedMessage.subject || 'Sem assunto'}</p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Mensagem</p>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm whitespace-pre-wrap">{selectedMessage.message}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4 border-t">
                        {selectedMessage.status === 'new' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => updateMessageStatus(selectedMessage.id, 'read')}
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            Marcar como lida
                          </Button>
                        )}
                        {selectedMessage.status !== 'responded' && (
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => updateMessageStatus(selectedMessage.id, 'responded')}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Respondida
                          </Button>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open(`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject || 'Contato Vibe Flow'}`, '_blank')}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Responder por e-mail
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">Selecione uma mensagem para ver os detalhes</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* VPS Analytics Section */}
          {activeSection === 'vps-analytics' && (
            <div className="space-y-6">
              {/* Header com ação */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Analytics do Gerador VPS</h2>
                  <p className="text-sm text-muted-foreground">Métricas de uso da ferramenta</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={fetchVpsAnalytics}>
                    <Bell className="h-4 w-4 mr-2" />
                    Atualizar
                  </Button>
                  <Button size="sm" onClick={() => navigate('/vps-generator')}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir Ferramenta
                  </Button>
                </div>
              </div>

              {loadingVpsAnalytics ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Carregando analytics...</p>
                </div>
              ) : vpsAnalytics ? (
                <>
                  {/* Stats Cards */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="hover:shadow-md transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Usuários Únicos</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{vpsAnalytics.usuariosUnicos}</div>
                        <p className="text-xs text-muted-foreground">sessões diferentes</p>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Interações</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{vpsAnalytics.totalInteracoes}</div>
                        <p className="text-xs text-muted-foreground">cliques e ações</p>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Primeiro Acesso</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-lg font-bold">
                          {vpsAnalytics.primeiroAcesso 
                            ? new Date(vpsAnalytics.primeiroAcesso).toLocaleDateString('pt-BR')
                            : '-'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {vpsAnalytics.primeiroAcesso 
                            ? new Date(vpsAnalytics.primeiroAcesso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                            : 'Sem dados'}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Último Acesso</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-lg font-bold">
                          {vpsAnalytics.ultimoAcesso 
                            ? new Date(vpsAnalytics.ultimoAcesso).toLocaleDateString('pt-BR')
                            : '-'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {vpsAnalytics.ultimoAcesso 
                            ? new Date(vpsAnalytics.ultimoAcesso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                            : 'Sem dados'}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Ações Populares */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Ações Mais Usadas</CardTitle>
                      <CardDescription>Elementos mais clicados na ferramenta</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {vpsAnalytics.acoesPopulares.length > 0 ? (
                        <div className="space-y-3">
                          {vpsAnalytics.acoesPopulares.map((acao, index) => (
                            <div key={index} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                                  index === 0 ? "bg-yellow-100 text-yellow-700" :
                                  index === 1 ? "bg-gray-100 text-gray-700" :
                                  index === 2 ? "bg-orange-100 text-orange-700" :
                                  "bg-muted text-muted-foreground"
                                )}>
                                  {index + 1}
                                </div>
                                <span className="font-medium">{acao.elemento}</span>
                              </div>
                              <Badge variant="secondary">{acao.cliques} cliques</Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">Nenhuma ação registrada ainda</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Métricas de Engajamento */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Resumo de Engajamento</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                          <p className="text-2xl font-bold text-primary">
                            {vpsAnalytics.totalInteracoes > 0 && vpsAnalytics.usuariosUnicos > 0
                              ? (vpsAnalytics.totalInteracoes / vpsAnalytics.usuariosUnicos).toFixed(1)
                              : '0'}
                          </p>
                          <p className="text-sm text-muted-foreground">Interações por usuário</p>
                        </div>
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">
                            {vpsAnalytics.acoesPopulares.filter(a => 
                              a.elemento.toLowerCase().includes('gerar') || 
                              a.elemento.toLowerCase().includes('copiar')
                            ).reduce((sum, a) => sum + a.cliques, 0)}
                          </p>
                          <p className="text-sm text-muted-foreground">Schemas gerados/copiados</p>
                        </div>
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">
                            {vpsAnalytics.acoesPopulares.filter(a => 
                              a.elemento.toLowerCase().includes('configurações') ||
                              a.elemento.toLowerCase().includes('avançad')
                            ).reduce((sum, a) => sum + a.cliques, 0)}
                          </p>
                          <p className="text-sm text-muted-foreground">Acessos avançados</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="text-center py-12">
                  <Server className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Nenhum dado de analytics disponível</p>
                  <Button variant="outline" className="mt-4" onClick={fetchVpsAnalytics}>
                    Carregar dados
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Feedbacks Section */}
          {activeSection === 'feedbacks' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Feedbacks Recebidos</h2>
                  <p className="text-sm text-muted-foreground">Opiniões e sugestões dos usuários</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchFeedbacks}>
                  <Bell className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              </div>

              {loadingFeedbacks ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Carregando feedbacks...</p>
                </div>
              ) : feedbacks.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquarePlus className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Nenhum feedback recebido ainda</p>
                </div>
              ) : (
                <>
                  {/* Stats */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{feedbacks.length}</div>
                      </CardContent>
                    </Card>
                    <Card className="border-yellow-200 dark:border-yellow-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-yellow-600">Sugestões</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">
                          {feedbacks.filter(f => f.feedback_type === 'sugestao').length}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-red-200 dark:border-red-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-red-600">Bugs</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                          {feedbacks.filter(f => f.feedback_type === 'bug').length}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-green-200 dark:border-green-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-600">Elogios</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                          {feedbacks.filter(f => f.feedback_type === 'elogio').length}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Lista de Feedbacks */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Todos os Feedbacks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {feedbacks.map((feedback) => (
                          <div
                            key={feedback.id}
                            className={cn(
                              "p-4 rounded-lg border",
                              feedback.feedback_type === 'sugestao' && "border-l-4 border-l-yellow-500",
                              feedback.feedback_type === 'bug' && "border-l-4 border-l-red-500",
                              feedback.feedback_type === 'elogio' && "border-l-4 border-l-green-500",
                              feedback.feedback_type === 'duvida' && "border-l-4 border-l-blue-500"
                            )}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant={
                                    feedback.feedback_type === 'sugestao' ? 'secondary' :
                                    feedback.feedback_type === 'bug' ? 'destructive' :
                                    feedback.feedback_type === 'elogio' ? 'default' : 'outline'
                                  }>
                                    {feedback.feedback_type === 'sugestao' && '💡 Sugestão'}
                                    {feedback.feedback_type === 'bug' && '🐛 Bug'}
                                    {feedback.feedback_type === 'elogio' && '👍 Elogio'}
                                    {feedback.feedback_type === 'duvida' && '❓ Dúvida'}
                                  </Badge>
                                  <Badge variant="outline">{feedback.tool_name}</Badge>
                                  {feedback.rating && (
                                    <span className="flex items-center gap-1 text-yellow-500">
                                      {'★'.repeat(feedback.rating)}
                                      {'☆'.repeat(5 - feedback.rating)}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm">{feedback.message}</p>
                                {feedback.user_email && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    📧 {feedback.user_email}
                                  </p>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {new Date(feedback.created_at).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* Chats Section */}
          {activeSection === 'chats' && (
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Lista de Conversas */}
                <Card className="lg:col-span-1">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Conversas</CardTitle>
                      <Badge variant="secondary">{conversations.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {loadingChats ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                      </div>
                    ) : conversations.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        <MessagesSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        Nenhuma conversa ainda
                      </div>
                    ) : (
                      <div className="max-h-[500px] overflow-y-auto">
                        {conversations.map((conv) => (
                          <button
                            key={conv.id}
                            onClick={() => handleSelectConversation(conv)}
                            className={cn(
                              "w-full p-4 text-left border-b hover:bg-muted/50 transition-colors relative",
                              selectedConversation?.id === conv.id && "bg-muted"
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Circle className={cn(
                                    "h-2 w-2",
                                    conv.status === 'active' && "fill-green-500 text-green-500",
                                    conv.status === 'waiting_human' && "fill-yellow-500 text-yellow-500",
                                    conv.status === 'closed' && "fill-gray-400 text-gray-400"
                                  )} />
                                  <span className="text-sm font-medium truncate">
                                    {conv.user_name || `Sessão ${conv.session_id.slice(-8)}`}
                                  </span>
                                  {conv.unread_count > 0 && (
                                    <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">
                                      {conv.unread_count}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {conv.message_count} mensagens
                                </p>
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {new Date(conv.last_message_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Área de Chat */}
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-3 border-b">
                    {selectedConversation ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">
                            {selectedConversation.user_name || `Sessão ${selectedConversation.session_id.slice(-8)}`}
                          </CardTitle>
                          <CardDescription>
                            {selectedConversation.user_email || 'Email não informado'}
                          </CardDescription>
                        </div>
                        <Badge variant={
                          selectedConversation.status === 'active' ? 'default' :
                          selectedConversation.status === 'waiting_human' ? 'secondary' : 'outline'
                        }>
                          {selectedConversation.status === 'active' && 'Ativo'}
                          {selectedConversation.status === 'waiting_human' && 'Aguardando'}
                          {selectedConversation.status === 'closed' && 'Fechado'}
                        </Badge>
                      </div>
                    ) : (
                      <CardTitle className="text-base text-muted-foreground">
                        Selecione uma conversa
                      </CardTitle>
                    )}
                  </CardHeader>
                  <CardContent className="p-0">
                    {selectedConversation ? (
                      <>
                        {/* Mensagens */}
                        <div className="h-[400px] overflow-y-auto p-4 space-y-4">
                          {chatMessages.map((msg) => (
                            <div
                              key={msg.id}
                              className={cn(
                                "flex",
                                msg.role === 'user' ? 'justify-end' : 'justify-start'
                              )}
                            >
                              <div className={cn(
                                "max-w-[80%] rounded-2xl px-4 py-2",
                                msg.role === 'user' && "bg-primary text-primary-foreground",
                                msg.role === 'assistant' && "bg-muted",
                                msg.role === 'human_agent' && "bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800"
                              )}>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[10px] font-medium uppercase opacity-70">
                                    {msg.role === 'user' && 'Visitante'}
                                    {msg.role === 'assistant' && 'IA'}
                                    {msg.role === 'human_agent' && '👤 Você'}
                                  </span>
                                  <span className="text-[10px] opacity-50">
                                    {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Input de Resposta */}
                        <div className="border-t p-4">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Digite sua resposta..."
                              value={replyMessage}
                              onChange={(e) => setReplyMessage(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendReply()}
                              disabled={sendingReply}
                            />
                            <Button onClick={handleSendReply} disabled={sendingReply || !replyMessage.trim()}>
                              {sendingReply ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Pressione Enter para enviar. Sua mensagem será entregue em tempo real.
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <MessagesSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Selecione uma conversa para visualizar</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Newsletter Section */}
          {activeSection === 'newsletter' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {subscribers.filter(s => s.is_active).length} inscritos ativos
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchSubscribers}>
                  Atualizar Lista
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Lista de Inscritos
                  </CardTitle>
                  <CardDescription>
                    Emails cadastrados para receber novidades do blog
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingSubscribers ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                  ) : subscribers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum inscrito ainda</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>Data de Inscrição</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subscribers.map((sub) => (
                          <TableRow key={sub.id}>
                            <TableCell className="font-medium">{sub.email}</TableCell>
                            <TableCell>{sub.name || '-'}</TableCell>
                            <TableCell>
                              {new Date(sub.subscribed_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </TableCell>
                            <TableCell>
                              <Badge variant={sub.is_active ? 'default' : 'secondary'}>
                                {sub.is_active ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Exportar Emails */}
              {subscribers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Exportar Lista</CardTitle>
                    <CardDescription>
                      Copie os emails para usar em plataformas de envio
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted p-4 rounded-lg">
                      <code className="text-sm break-all">
                        {subscribers.filter(s => s.is_active).map(s => s.email).join(', ')}
                      </code>
                    </div>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          subscribers.filter(s => s.is_active).map(s => s.email).join(', ')
                        );
                        toast({ title: "Emails copiados!" });
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar Emails
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;