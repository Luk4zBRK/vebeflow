import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bot, Menu, X, BookOpen } from "lucide-react";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToSection = (sectionId: string) => {
    // Se não estiver na página inicial, navega para ela primeiro
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: sectionId } });
      setMobileMenuOpen(false);
      return;
    }

    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 96; // altura aproximada do header fixo
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - headerOffset;

      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/70 glass-effect">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <button 
            onClick={() => scrollToSection('hero')}
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <img 
              src="/Transformando ideias em soluções digitais.png" 
              alt="Vibe Flow Logo" 
              className="h-8 w-8 rounded-full object-cover"
            />
            <span className="text-xl font-semibold tracking-tight">Vibe Flow</span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm">
            {[
              { label: "Sobre", id: "about" },
              { label: "Serviços", id: "services" },
              { label: "Benefícios", id: "benefits" },
              { label: "Contato", id: "contact" }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => navigate('/blog')}
              className="font-medium text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1"
            >
              <BookOpen className="h-4 w-4" />
              Blog
            </button>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => scrollToSection('chat')}
              className="group"
            >
              <Bot className="h-4 w-4 group-hover:scale-110 transition-transform" />
              Falar com a IA
            </Button>
          </div>

          {/* Mobile menu button */}
          <Button
            variant="outline"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border">
            <div className="py-3 flex flex-col gap-2 text-sm">
              {[
                { label: "Sobre", id: "about" },
                { label: "Serviços", id: "services" },
                { label: "Benefícios", id: "benefits" },
                { label: "Contato", id: "contact" }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="px-1 py-2 rounded-md hover:bg-accent font-medium text-left"
                >
                  {item.label}
                </button>
              ))}
              <button
                onClick={() => { setMobileMenuOpen(false); navigate('/blog'); }}
                className="px-1 py-2 rounded-md hover:bg-accent font-medium text-left text-blue-600 flex items-center gap-2"
              >
                <BookOpen className="h-4 w-4" />
                Blog
              </button>
              
              <div className="mt-4 space-y-2">
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => scrollToSection('chat')}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Bot className="h-4 w-4" />
                  Falar com a IA
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;