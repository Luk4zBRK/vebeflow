import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Mail, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Calendar,
  User,
  MessageSquare,
  Download,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ContactStats {
  total: number;
  new: number;
  replied: number;
  resolved: number;
}

const ContactForms = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [stats, setStats] = useState<ContactStats>({ total: 0, new: 0, replied: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    dateRange: '30days'
  });

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate('/auth');
    }
  }, [user, isAdmin, isLoading, navigate]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      
      // Build filter conditions
      let query = supabase
        .from('contact_messages' as any)
        .select('*')
        .order('created_at', { ascending: false });

      // Apply status filter
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // Apply search filter
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,subject.ilike.%${filters.search}%`);
      }

      // Apply date range filter
      if (filters.dateRange !== 'all') {
        const now = new Date();
        const daysAgo = filters.dateRange === '7days' ? 7 : 
                       filters.dateRange === '30days' ? 30 : 
                       filters.dateRange === '90days' ? 90 : 0;
        
        if (daysAgo > 0) {
          const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
          query = query.gte('created_at', cutoffDate.toISOString());
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      setMessages((data as unknown as ContactMessage[]) || []);

      // Calculate stats
      const allMessages = (data as unknown as ContactMessage[]) || [];
      const newCount = allMessages.filter(m => m.status === 'new').length;
      const repliedCount = allMessages.filter(m => m.status === 'replied').length;
      const resolvedCount = allMessages.filter(m => m.status === 'resolved').length;

      setStats({
        total: allMessages.length,
        new: newCount,
        replied: repliedCount,
        resolved: resolvedCount
      });

    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os formulários",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && isAdmin) {
      fetchMessages();
    }
  }, [user, isAdmin, filters]);

  const updateMessageStatus = async (messageId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('contact_messages' as any)
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) throw error;

      // Update local state
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, status: newStatus, updated_at: new Date().toISOString() }
            : msg
        )
      );

      toast({
        title: "Status atualizado",
        description: `Formulário marcado como ${newStatus === 'new' ? 'novo' : newStatus === 'replied' ? 'respondido' : 'resolvido'}`
      });

      fetchMessages(); // Refresh stats
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive"
      });
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!confirm('Tem certeza que deseja excluir este formulário?')) return;

    try {
      const { error } = await supabase
        .from('contact_messages' as any)
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      setSelectedMessage(null);

      toast({
        title: "Formulário excluído",
        description: "O formulário foi removido com sucesso"
      });

      fetchMessages(); // Refresh stats
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o formulário",
        variant: "destructive"
      });
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Nome', 'Email', 'Assunto', 'Mensagem', 'Status', 'Data de Criação'],
      ...messages.map(msg => [
        msg.name,
        msg.email,
        msg.subject || '',
        msg.message,
        msg.status,
        new Date(msg.created_at).toLocaleString('pt-BR')
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `formularios-contato-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      new: { label: 'Novo', variant: 'destructive' as const, icon: AlertCircle },
      replied: { label: 'Respondido', variant: 'secondary' as const, icon: CheckCircle },
      resolved: { label: 'Resolvido', variant: 'default' as const, icon: CheckCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.new;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando formulários...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
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
            <h1 className="text-3xl font-bold tracking-tight">Formulários de Contato</h1>
            <p className="text-muted-foreground">Gerencie mensagens enviadas pelos visitantes</p>
          </div>
          
          <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Novos</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.new}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Respondidos</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-500">{stats.replied}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolvidos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.resolved}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Nome, email ou assunto..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-8"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="new">Novos</SelectItem>
                    <SelectItem value="replied">Respondidos</SelectItem>
                    <SelectItem value="resolved">Resolvidos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dateRange">Período</Label>
                <Select value={filters.dateRange} onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">Últimos 7 dias</SelectItem>
                    <SelectItem value="30days">Últimos 30 dias</SelectItem>
                    <SelectItem value="90days">Últimos 90 dias</SelectItem>
                    <SelectItem value="all">Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Messages Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Formulários</CardTitle>
            <CardDescription>
              {messages.length} formulário(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Nome
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Assunto
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Data
                      </div>
                    </TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell className="font-medium">{message.name}</TableCell>
                      <TableCell>{message.email}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {message.subject || 'Sem assunto'}
                      </TableCell>
                      <TableCell>{getStatusBadge(message.status)}</TableCell>
                      <TableCell>{formatDate(message.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedMessage(message)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Detalhes do Formulário</DialogTitle>
                                <DialogDescription>
                                  Enviado em {formatDate(message.created_at)}
                                </DialogDescription>
                              </DialogHeader>
                              
                              {selectedMessage && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Nome</Label>
                                      <Input value={selectedMessage.name} readOnly />
                                    </div>
                                    <div>
                                      <Label>Email</Label>
                                      <Input value={selectedMessage.email} readOnly />
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <Label>Assunto</Label>
                                    <Input value={selectedMessage.subject || 'Sem assunto'} readOnly />
                                  </div>
                                  
                                  <div>
                                    <Label>Mensagem</Label>
                                    <Textarea 
                                      value={selectedMessage.message} 
                                      readOnly 
                                      rows={6}
                                      className="resize-none"
                                    />
                                  </div>
                                  
                                  <div className="flex items-center justify-between pt-4 border-t">
                                    <div className="flex items-center gap-2">
                                      <Label>Status:</Label>
                                      <Select 
                                        value={selectedMessage.status}
                                        onValueChange={(value) => {
                                          updateMessageStatus(selectedMessage.id, value);
                                          setSelectedMessage(prev => prev ? { ...prev, status: value } : null);
                                        }}
                                      >
                                        <SelectTrigger className="w-[140px]">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="new">Novo</SelectItem>
                                          <SelectItem value="replied">Respondido</SelectItem>
                                          <SelectItem value="resolved">Resolvido</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => deleteMessage(selectedMessage.id)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Excluir
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {messages.length === 0 && (
                <div className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum formulário encontrado</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContactForms;
