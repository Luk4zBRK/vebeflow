import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Handshake, Mail, Phone, SendHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSiteConfig } from "@/hooks/useSiteConfig";

const Contact = () => {
  const { toast } = useToast();
  const { getCompanyInfo } = useSiteConfig();
  
  // Garantir que os dados sempre apareçam, mesmo deslogado
  const companyData = getCompanyInfo();
  const companyInfo = companyData || {
    name: "Vibe Flow",
    tagline: "Tecnologia que acompanha o seu ritmo",
    email: "contato@vibeflow.site",
    phone: "(11) 99999‑0000"
  };
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha nome, email e mensagem.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert({
          name: formData.name,
          email: formData.email,
          subject: formData.subject || null,
          message: formData.message
        });

      if (error) throw error;

      toast({
        title: "Mensagem enviada!",
        description: "Recebemos sua mensagem e retornaremos em breve."
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: ""
      });
    } catch (error) {
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar a mensagem. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <section id="contact" className="relative overflow-hidden p-6 sm:p-8 rounded-3xl border border-border">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(1200px_500px_at_-10%_20%,rgba(236,72,153,0.18),transparent),radial-gradient(1000px_600px_at_110%_80%,rgba(59,130,246,0.18),transparent)]"></div>
      <div className="absolute inset-0 bg-background/60 glass-effect"></div>

      <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Handshake className="h-4 w-4" />
            <span className="font-medium">Vamos conversar</span>
          </div>
          
          <h2 className="mt-2 text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[0.95]">
            Pronto para acelerar seu fluxo digital?
          </h2>
          
          <p className="mt-3 text-sm sm:text-base text-muted-foreground">
            Envie uma mensagem e retornamos com um diagnóstico inicial e estimativa de investimento.
          </p>

          <div className="mt-6 flex flex-col gap-4 text-sm text-foreground sm:flex-row sm:items-center sm:gap-6">
            <div className="inline-flex items-center gap-2 order-1 sm:order-none">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Mail className="h-3.5 w-3.5" />
              </span>
              {companyInfo.email}
            </div>
            <div className="inline-flex items-center gap-2 order-2 sm:order-none">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Phone className="h-3.5 w-3.5" />
              </span>
              {companyInfo.phone}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-5 sm:p-6 grid grid-cols-1 gap-5">
          <div>
            <Input
              type="text"
              placeholder="Nome *"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="border-0 border-b border-border rounded-none bg-transparent focus:border-foreground"
              required
            />
          </div>
          
          <div>
            <Input
              type="email"
              placeholder="Email *"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="border-0 border-b border-border rounded-none bg-transparent focus:border-foreground"
              required
            />
          </div>
          
          <div>
            <Input
              type="text"
              placeholder="Assunto (ex.: Automação de processos)"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              className="border-0 border-b border-border rounded-none bg-transparent focus:border-foreground"
            />
          </div>
          
          <div>
            <Textarea
              placeholder="Conte brevemente sobre sua necessidade..."
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              rows={4}
              className="border-0 border-b border-border rounded-none bg-transparent focus:border-foreground resize-none"
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Button type="submit" variant="gradient" size="lg" className="group" disabled={isSubmitting}>
              <SendHorizontal className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              {isSubmitting ? 'Enviando...' : 'Enviar mensagem'}
            </Button>
            <p className="text-xs text-muted-foreground">
              Respondemos em até 1 dia útil. Seus dados não serão compartilhados.
            </p>
          </div>
        </form>
      </div>
    </section>
  );
};

export default Contact;