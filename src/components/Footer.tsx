import { ExternalLink, Settings } from "lucide-react";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

const Footer = () => {
  const { getCompanyInfo, getSocialMedia, getFooterContent } = useSiteConfig();
  const { user, isAdmin, signOut } = useAuth();
  
  const companyInfoData = getCompanyInfo();
  const companyInfo = companyInfoData || {
    name: "Vibe Flow",
    tagline: "Tecnologia que acompanha o seu ritmo",
    email: "contato@vibeflow.site",
    phone: "(11) 99999‑0000"
  };
  
  // Buscar dados diretamente, com fallback garantido
  const socialMediaData = getSocialMedia();
  const socialMedia = socialMediaData || {
    linkedin: "https://www.linkedin.com/in/lucas-silva-frança/",
    github: "https://github.com/Luk4zBRK", 
    instagram: "https://www.instagram.com/vibeflowoficial?igsh=MTNieTdxYWplcDU0dw=="
  };
  
  const footerContent = getFooterContent() || {
    title: "Soluções digitais sob medida para cada estágio do seu negócio.",
    copyright: "© 2025 Vibe Flow — Todos os direitos reservados"
  };


  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="p-6 sm:p-8 bg-card border border-border rounded-3xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <h3 className="text-4xl font-semibold tracking-tight">
            {footerContent.title}
          </h3>
          
          <div className="mt-6 flex items-center gap-3">
            <img 
              src="/Transformando ideias em soluções digitais.png" 
              alt="Vibe Flow Logo" 
              className="h-10 w-10 rounded-full object-cover"
            />
            <div>
              <p className="text-sm font-semibold tracking-tight">{companyInfo.name}</p>
              <p className="text-xs text-muted-foreground">{companyInfo.tagline}</p>
            </div>
          </div>

          <div className="mt-8 h-px w-full bg-border" />
        </div>

        <div>
          <h4 className="text-2xl sm:text-3xl font-semibold tracking-tight">Links</h4>
          
          <div className="grid grid-cols-2 gap-8 mt-6">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Mapa</p>
              <ul className="mt-3 space-y-2">
                {[
                  { label: "Sobre", id: "about" },
                  { label: "Serviços", id: "services" },
                  { label: "Benefícios", id: "benefits" },
                  { label: "Contato", id: "contact" }
                ].map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => scrollToSection(item.id)}
                      className="text-lg font-semibold tracking-tight hover:opacity-80 transition-opacity text-left"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <p className="text-xs text-muted-foreground font-medium">Redes</p>
              <ul className="mt-3 space-y-2">
                {socialMedia.linkedin && (
                  <li>
                    <a 
                      href={socialMedia.linkedin} 
                      className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight hover:opacity-80 transition-opacity"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      LinkedIn
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </li>
                )}
                {socialMedia.github && (
                  <li>
                    <a 
                      href={socialMedia.github} 
                      className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight hover:opacity-80 transition-opacity"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      GitHub
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </li>
                )}
                {socialMedia.instagram && (
                  <li>
                    <a 
                      href={socialMedia.instagram} 
                      className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight hover:opacity-80 transition-opacity"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Instagram
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </li>
                )}
              </ul>
              
              <p className="text-xs text-muted-foreground font-medium mt-6">Legal</p>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link 
                    to="/termos-de-uso"
                    className="text-lg font-semibold tracking-tight hover:opacity-80 transition-opacity"
                  >
                    Termos de Uso
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/politica-de-privacidade"
                    className="text-lg font-semibold tracking-tight hover:opacity-80 transition-opacity"
                  >
                    Política de Privacidade
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between text-xs text-muted-foreground">
            <span>{footerContent.copyright}</span>
            
            {user && isAdmin && (
              <div className="flex items-center gap-1 opacity-30 hover:opacity-100 transition-opacity">
                <Link to="/dashboard">
                  <button 
                    className="p-1 rounded hover:bg-muted/50 transition-colors"
                    title="Dashboard"
                  >
                    <Settings className="h-3 w-3" />
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;