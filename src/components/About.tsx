import { Info, Puzzle, GitMerge, Lock } from "lucide-react";

const About = () => {
  const stats = [
    { value: "+120", label: "projetos entregues" },
    { value: "98%", label: "satisfação de clientes" },
    { value: "<24h", label: "SLA crítico" },
    { value: "10+", label: "anos de experiência" }
  ];

  const highlights = [
    {
      icon: Puzzle,
      title: "Sob medida",
      description: "Soluções alinhadas aos seus fluxos",
      gradient: "from-brand-fuchsia to-brand-violet"
    },
    {
      icon: GitMerge,
      title: "Integrações",
      description: "Conecte sistemas com segurança",
      gradient: "from-brand-sky to-brand-violet"
    },
    {
      icon: Lock,
      title: "Confiabilidade",
      description: "Operação robusta e escalável",
      gradient: "from-brand-rose to-brand-orange"
    }
  ];

  return (
    <section id="about" className="p-6 sm:p-8 bg-card border border-border rounded-3xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            <span className="font-medium">Sobre nós</span>
          </div>
          
          <h2 className="mt-2 text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[0.95]">
            Missão orientada a resultados.
          </h2>
          
          <p className="mt-4 text-sm sm:text-base text-muted-foreground">
            Unimos engenharia, design e automação para desbloquear eficiência e acelerar a inovação dos nossos clientes. Projetamos soluções sob medida com processos claros, comunicação transparente e foco no que importa: impacto real no negócio.
          </p>
        </div>

        <div className="relative rounded-2xl border border-border overflow-hidden lg:h-[420px]">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(1400px_500px_at_20%_-10%,rgba(236,72,153,0.25),transparent),radial-gradient(1000px_600px_at_90%_110%,rgba(59,130,246,0.25),transparent)]"></div>
          <div className="absolute inset-0 bg-background/90 glass-effect"></div>
          
          <div className="relative w-full p-6 flex flex-col gap-6 lg:h-full lg:justify-between">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {highlights.map((highlight, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 card-hover"
                >
                  <div className={`pointer-events-none absolute -top-8 -right-8 h-20 w-20 rounded-full bg-gradient-to-tr ${highlight.gradient} opacity-20 blur-2xl transition-opacity duration-300 group-hover:opacity-30`} />
                  <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr ${highlight.gradient} text-white shadow-primary/40`}>
                    <highlight.icon className="h-4 w-4" />
                  </div>
                  <p className="mt-3 text-sm font-semibold tracking-tight">{highlight.title}</p>
                  <p className="text-xs text-muted-foreground">{highlight.description}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map((stat, index) => (
                <div key={index} className="rounded-2xl border border-border bg-card/90 p-5 card-hover">
                  <p className="text-3xl font-semibold tracking-tight text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;