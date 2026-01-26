import { Button } from "@/components/ui/button";
import { Activity, Send, LayoutDashboard, Shield, Zap, Headphones } from "lucide-react";
import heroImage from "@/assets/hero-tech-flow.jpg";

const Hero = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="hero" className="relative overflow-hidden rounded-3xl border border-border">
      {/* Background Effects */}
      <div className="absolute inset-0 hero-gradient"></div>
      
      {/* Decorative blobs */}
      <div className="absolute -top-12 -left-14 h-72 w-72 bg-gradient-to-tr from-brand-fuchsia via-brand-rose to-brand-orange opacity-40 blur-3xl rounded-full animate-float"></div>
      <div className="absolute -bottom-16 -right-10 h-80 w-80 bg-gradient-to-tr from-brand-sky via-brand-violet to-brand-fuchsia opacity-40 blur-3xl rounded-full animate-float-delayed"></div>
      
      {/* Glass overlay */}
      <div className="absolute inset-0 bg-background/60 glass-effect"></div>

      <div className="relative px-6 py-12 sm:py-16 lg:py-20">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Activity className="h-3.5 w-3.5" />
            Tecnologia que flui com o seu negócio
          </span>
          
          <h1 className="mt-3 text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[0.95]">
            <span className="gradient-text">Vibe Flow</span>
          </h1>
          
          <p className="mt-4 text-xl sm:text-2xl tracking-tight text-foreground">
            Transformando ideias em soluções digitais.
          </p>
          
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl">
            Desenvolvimento de sistemas sob medida, automações inteligentes e suporte técnico especializado para impulsionar eficiência, inovação e escala.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button 
              variant="gradient" 
              size="lg"
              onClick={() => scrollToSection('contact')}
              className="group"
            >
              <Send className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              Solicitar Orçamento
            </Button>
            
            <Button 
              variant="outline_gradient" 
              size="lg"
              onClick={() => scrollToSection('services')}
            >
              <LayoutDashboard className="h-4 w-4" />
              Ver Serviços
            </Button>
          </div>

          <div className="mt-8 flex items-center gap-4 text-xs text-muted-foreground">
            <div className="inline-flex items-center gap-2">
              <Shield className="h-4 w-4" />
              SLA e monitoramento
            </div>
            <div className="inline-flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Automação ponta a ponta
            </div>
            <div className="inline-flex items-center gap-2">
              <Headphones className="h-4 w-4" />
              Suporte próximo
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;