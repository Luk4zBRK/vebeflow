import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Settings as SettingsIcon, Building, Share2, FileText, MessageSquare, Plus, Trash2, BarChart3, Bot, Bug } from 'lucide-react';

const DEFAULT_CHAT_WEBHOOK = import.meta.env.VITE_N8N_CHAT_WEBHOOK || 'https://n8n.verticalon.com.br/webhook/95a9e0be-09ad-403f-9cb0-3c60494576ec';

const Settings = () => {
  const [showDebug, setShowDebug] = useState(false);
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const { 
    configs,
    getCompanyInfo, 
    getSocialMedia, 
    getFooterContent,
    getTestimonials,
    getAnalyticsConfig, 
    getChatAssistantConfig,
    updateConfig, 
    isLoading: configLoading 
  } = useSiteConfig();

  // Form states
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    tagline: '',
    email: '',
    phone: ''
  });

  const [socialMedia, setSocialMedia] = useState({
    linkedin: '',
    github: '',
    instagram: ''
  });

  const [footerContent, setFooterContent] = useState({
    title: '',
    copyright: ''
  });

  const [testimonials, setTestimonials] = useState([
    { id: 1, name: '', role: '', avatar: '', content: '', rating: 5 }
  ]);

  const [analyticsConfig, setAnalyticsConfig] = useState({
    google_analytics_id: '',
    enable_tracking: true,
    enable_scroll_tracking: true,
    enable_click_tracking: true,
    enable_time_tracking: true,
    track_custom_events: true
  });

  const [chatAssistantConfig, setChatAssistantConfig] = useState({
    webhook_url: DEFAULT_CHAT_WEBHOOK,
    welcome_message: ''
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate('/auth');
    }
  }, [user, isAdmin, isLoading, navigate]);

  useEffect(() => {
    // Load current configurations when configs are loaded
    if (!configLoading) {
      console.log('Loading configs:', configs);
      
      const companyData = getCompanyInfo();
      console.log('Company data:', companyData);
      if (companyData) {
        setCompanyInfo(companyData);
      }

      const socialData = getSocialMedia();
      console.log('Social data:', socialData);
      if (socialData) {
        setSocialMedia(socialData);
      }

      const footerData = getFooterContent();
      console.log('Footer data:', footerData);
      if (footerData) {
        setFooterContent(footerData);
      }

      const testimonialsData = getTestimonials();
      console.log('Testimonials data:', testimonialsData);
      if (testimonialsData && Array.isArray(testimonialsData)) {
        setTestimonials(testimonialsData);
      }

      const analyticsData = getAnalyticsConfig();
      console.log('Analytics data:', analyticsData);
      if (analyticsData) {
        setAnalyticsConfig(analyticsData);
      }

      const chatAssistantData = getChatAssistantConfig();
      console.log('Chat assistant data:', chatAssistantData);
      if (chatAssistantData) {
        setChatAssistantConfig({
          webhook_url: chatAssistantData.webhook_url || DEFAULT_CHAT_WEBHOOK,
          welcome_message: chatAssistantData.welcome_message || ''
        });
      } else {
        setChatAssistantConfig({
          webhook_url: DEFAULT_CHAT_WEBHOOK,
          welcome_message: ''
        });
      }
    }
  }, [configLoading, configs]);

  const handleSaveCompanyInfo = async () => {
    setIsSaving(true);
    await updateConfig('company_info', companyInfo);
    setIsSaving(false);
  };

  const handleSaveSocialMedia = async () => {
    setIsSaving(true);
    await updateConfig('social_media', socialMedia);
    setIsSaving(false);
  };

  const handleSaveFooterContent = async () => {
    setIsSaving(true);
    await updateConfig('footer_content', footerContent);
    setIsSaving(false);
  };

  const handleSaveTestimonials = async () => {
    setIsSaving(true);
    await updateConfig('testimonials', testimonials);
    setIsSaving(false);
  };

  const addTestimonial = () => {
    const newId = Math.max(...testimonials.map(t => t.id), 0) + 1;
    setTestimonials([...testimonials, { 
      id: newId, 
      name: '', 
      role: '', 
      avatar: '', 
      content: '', 
      rating: 5 
    }]);
  };

  const removeTestimonial = (id: number) => {
    if (testimonials.length > 1) {
      setTestimonials(testimonials.filter(t => t.id !== id));
    }
  };

  const updateTestimonial = (id: number, field: string, value: string | number) => {
    setTestimonials(testimonials.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  const handleSaveAnalytics = async () => {
    setIsSaving(true);
    await updateConfig('analytics', analyticsConfig);
    setIsSaving(false);
  };

  const handleSaveChatAssistant = async () => {
    setIsSaving(true);
    await updateConfig('chat_assistant', {
      webhook_url: chatAssistantConfig.webhook_url.trim(),
      welcome_message: chatAssistantConfig.welcome_message
    });
    setIsSaving(false);
  };

  if (isLoading || configLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando configurações...</p>
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
            <h1 className="text-3xl font-bold tracking-tight">Configurações do Site</h1>
            <p className="text-muted-foreground">Gerencie as informações exibidas no site</p>
          </div>
          <Button
            variant="outline" 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2"
          >
            🔄 Recarregar Dados
          </Button>
        </div>

        {/* Debug info */}
        {showDebug && (
          <div className="mb-4 p-4 bg-muted rounded-lg text-xs">
            <p>Debug: configLoading: {configLoading.toString()}</p>
            <p>Debug: configs length: {configs.length}</p>
            <p>Debug: companyInfo: {JSON.stringify(companyInfo)}</p>
            <p>Debug: chatAssistantConfig: {JSON.stringify(chatAssistantConfig)}</p>
          </div>
        )}

        <Tabs defaultValue="company" className="space-y-6">
          <TabsList>
            <TabsTrigger value="company" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Empresa
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Redes Sociais
            </TabsTrigger>
            <TabsTrigger value="footer" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Footer
            </TabsTrigger>
            <TabsTrigger value="testimonials" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Depoimentos
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Assistente IA
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Empresa</CardTitle>
                <CardDescription>
                  Configure as informações básicas da empresa exibidas no site
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company-name">Nome da Empresa</Label>
                    <Input
                      id="company-name"
                      value={companyInfo.name}
                      onChange={(e) => setCompanyInfo(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Vibe Flow"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company-tagline">Slogan</Label>
                    <Input
                      id="company-tagline"
                      value={companyInfo.tagline}
                      onChange={(e) => setCompanyInfo(prev => ({ ...prev, tagline: e.target.value }))}
                      placeholder="Tecnologia que acompanha o seu ritmo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company-email">Email de Contato</Label>
                    <Input
                      id="company-email"
                      type="email"
                      value={companyInfo.email}
                      onChange={(e) => setCompanyInfo(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="contato@vibeflow.co"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company-phone">Telefone</Label>
                    <Input
                      id="company-phone"
                      value={companyInfo.phone}
                      onChange={(e) => setCompanyInfo(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(11) 99999‑0000"
                    />
                  </div>
                </div>
                <Button onClick={handleSaveCompanyInfo} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="social">
            <Card>
              <CardHeader>
                <CardTitle>Redes Sociais</CardTitle>
                <CardDescription>
                  Configure os links das redes sociais exibidos no footer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      value={socialMedia.linkedin}
                      onChange={(e) => setSocialMedia(prev => ({ ...prev, linkedin: e.target.value }))}
                      placeholder="https://linkedin.com/company/vibeflow"
                    />
                  </div>
                  <div>
                    <Label htmlFor="github">GitHub</Label>
                    <Input
                      id="github"
                      value={socialMedia.github}
                      onChange={(e) => setSocialMedia(prev => ({ ...prev, github: e.target.value }))}
                      placeholder="https://github.com/vibeflow"
                    />
                  </div>
                  <div>
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={socialMedia.instagram}
                      onChange={(e) => setSocialMedia(prev => ({ ...prev, instagram: e.target.value }))}
                      placeholder="https://instagram.com/vibeflow"
                    />
                  </div>
                </div>
                <Button onClick={handleSaveSocialMedia} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="footer">
            <Card>
              <CardHeader>
                <CardTitle>Conteúdo do Footer</CardTitle>
                <CardDescription>
                  Configure o texto exibido no footer do site
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="footer-title">Título Principal</Label>
                  <Textarea
                    id="footer-title"
                    value={footerContent.title}
                    onChange={(e) => setFooterContent(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Soluções digitais sob medida para cada estágio do seu negócio."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="footer-copyright">Copyright</Label>
                  <Input
                    id="footer-copyright"
                    value={footerContent.copyright}
                    onChange={(e) => setFooterContent(prev => ({ ...prev, copyright: e.target.value }))}
                    placeholder="© 2025 Vibe Flow — Todos os direitos reservados"
                  />
                </div>
                <Button onClick={handleSaveFooterContent} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testimonials">
            <Card>
              <CardHeader>
                <CardTitle>Depoimentos de Clientes</CardTitle>
                <CardDescription>
                  Gerencie os depoimentos exibidos no carrossel do site
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {testimonials.map((testimonial, index) => (
                  <div key={testimonial.id} className="p-4 border border-border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Depoimento #{index + 1}</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeTestimonial(testimonial.id)}
                        disabled={testimonials.length === 1}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`name-${testimonial.id}`}>Nome do Cliente</Label>
                        <Input
                          id={`name-${testimonial.id}`}
                          value={testimonial.name}
                          onChange={(e) => updateTestimonial(testimonial.id, 'name', e.target.value)}
                          placeholder="Marina Costa"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`role-${testimonial.id}`}>Cargo e Empresa</Label>
                        <Input
                          id={`role-${testimonial.id}`}
                          value={testimonial.role}
                          onChange={(e) => updateTestimonial(testimonial.id, 'role', e.target.value)}
                          placeholder="Operações, RetailPro"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor={`avatar-${testimonial.id}`}>URL da Foto (Avatar)</Label>
                      <Input
                        id={`avatar-${testimonial.id}`}
                        value={testimonial.avatar}
                        onChange={(e) => updateTestimonial(testimonial.id, 'avatar', e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..."
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`content-${testimonial.id}`}>Depoimento</Label>
                      <Textarea
                        id={`content-${testimonial.id}`}
                        value={testimonial.content}
                        onChange={(e) => updateTestimonial(testimonial.id, 'content', e.target.value)}
                        placeholder="Integrações impecáveis e respostas rápidas..."
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`rating-${testimonial.id}`}>Avaliação (1-5 estrelas)</Label>
                      <Input
                        id={`rating-${testimonial.id}`}
                        type="number"
                        min="1"
                        max="5"
                        value={testimonial.rating}
                        onChange={(e) => updateTestimonial(testimonial.id, 'rating', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={addTestimonial}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar Depoimento
                  </Button>
                  
                  <Button onClick={handleSaveTestimonials} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Salvando...' : 'Salvar Depoimentos'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat">
            <Card>
              <CardHeader>
                <CardTitle>Assistente de IA</CardTitle>
                <CardDescription>
                  Configure o webhook do n8n e mensagem inicial exibida no chat da landing page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="chat-webhook">Webhook do n8n</Label>
                  <Input
                    id="chat-webhook"
                    value={chatAssistantConfig.webhook_url}
                    onChange={(e) => setChatAssistantConfig(prev => ({ ...prev, webhook_url: e.target.value }))}
                    placeholder={DEFAULT_CHAT_WEBHOOK}
                  />
                  <p className="text-xs text-muted-foreground">
                    URL do fluxo n8n que irá receber as mensagens do chat da landing page.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chat-welcome">Mensagem inicial (opcional)</Label>
                  <Textarea
                    id="chat-welcome"
                    value={chatAssistantConfig.welcome_message}
                    onChange={(e) => setChatAssistantConfig(prev => ({ ...prev, welcome_message: e.target.value }))}
                    placeholder="Use uma frase curta para orientar o visitante (ex.: Conte qual desafio quer resolver)."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Esta mensagem aparece como placeholder no campo do chat para incentivar o visitante a iniciar a conversa.
                  </p>
                </div>

                <Button onClick={handleSaveChatAssistant} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Analytics</CardTitle>
                <CardDescription>
                  Configure o tracking e analytics do site
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="ga-id">Google Analytics ID</Label>
                  <Input
                    id="ga-id"
                    value={analyticsConfig.google_analytics_id}
                    onChange={(e) => setAnalyticsConfig(prev => ({ ...prev, google_analytics_id: e.target.value }))}
                    placeholder="G-XXXXXXXXXX"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    ID do Google Analytics 4 (formato: G-XXXXXXXXXX)
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Opções de Tracking</h4>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="enable-tracking"
                      checked={analyticsConfig.enable_tracking}
                      onChange={(e) => setAnalyticsConfig(prev => ({ ...prev, enable_tracking: e.target.checked }))}
                      className="rounded border-border"
                    />
                    <Label htmlFor="enable-tracking" className="text-sm">
                      Habilitar tracking geral
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="scroll-tracking"
                      checked={analyticsConfig.enable_scroll_tracking}
                      onChange={(e) => setAnalyticsConfig(prev => ({ ...prev, enable_scroll_tracking: e.target.checked }))}
                      className="rounded border-border"
                    />
                    <Label htmlFor="scroll-tracking" className="text-sm">
                      Tracking de profundidade de scroll
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="click-tracking"
                      checked={analyticsConfig.enable_click_tracking}
                      onChange={(e) => setAnalyticsConfig(prev => ({ ...prev, enable_click_tracking: e.target.checked }))}
                      className="rounded border-border"
                    />
                    <Label htmlFor="click-tracking" className="text-sm">
                      Tracking de cliques
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="time-tracking"
                      checked={analyticsConfig.enable_time_tracking}
                      onChange={(e) => setAnalyticsConfig(prev => ({ ...prev, enable_time_tracking: e.target.checked }))}
                      className="rounded border-border"
                    />
                    <Label htmlFor="time-tracking" className="text-sm">
                      Tracking de tempo na página
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="custom-events"
                      checked={analyticsConfig.track_custom_events}
                      onChange={(e) => setAnalyticsConfig(prev => ({ ...prev, track_custom_events: e.target.checked }))}
                      className="rounded border-border"
                    />
                    <Label htmlFor="custom-events" className="text-sm">
                      Salvar eventos no banco de dados
                    </Label>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    onClick={() => navigate('/analytics')}
                    variant="outline"
                    className="mr-4"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Ver Analytics
                  </Button>
                  <Button onClick={handleSaveAnalytics} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="mt-8 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setShowDebug(!showDebug)}
          >
            <Bug className="h-4 w-4 mr-2" />
            {showDebug ? 'Ocultar Debug' : 'Debug'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
