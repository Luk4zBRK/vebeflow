import { Grid, Code2, Bot, Headset, Check } from "lucide-react";

const Services = () => {
  const services = [
    {
      icon: Code2,
      title: "Desenvolvimento de Sistemas",
      description: "Aplicações web e APIs escaláveis, arquitetura moderna e qualidade de ponta a ponta.",
      features: [
        "Arquitetura escalável",
        "Integrações com ERPs/CRMs",
        "Qualidade, testes e observabilidade"
      ],
      gradient: "from-brand-fuchsia to-brand-violet"
    },
    {
      icon: Bot,
      title: "Automações Inteligentes", 
      description: "Workflows, RPA e integrações que reduzem custos e aumentam a agilidade.",
      features: [
        "Orquestração de processos",
        "Conectores prontos e sob medida",
        "Insight e alertas em tempo real"
      ],
      gradient: "from-brand-sky to-brand-violet"
    },
    {
      icon: Headset,
      title: "Suporte Especializado",
      description: "Atendimento próximo, SLAs claros e operação resiliente.",
      features: [
        "Monitoramento e observabilidade",
        "Resposta ágil e preventiva", 
        "Playbooks e documentação"
      ],
      gradient: "from-brand-rose to-brand-orange"
    }
  ];

  return (
    <section id="services" className="p-6 sm:p-8 bg-card border border-border rounded-3xl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Grid className="h-4 w-4" />
        <span className="font-medium">Serviços</span>
      </div>
      
      <div className="mt-2">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[0.95]">
          Soluções que destravam crescimento.
        </h2>
        <p className="mt-1 text-sm sm:text-base text-muted-foreground font-medium">
          Da estratégia ao suporte contínuo, com foco em resultados.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {services.map((service, index) => (
          <article 
            key={index}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:shadow-card card-hover"
          >
            {/* Decorative gradient blob */}
            <div className={`absolute -top-10 -right-10 h-28 w-28 rounded-full bg-gradient-to-tr ${service.gradient} opacity-20 blur-2xl`}></div>
            
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr ${service.gradient} text-white`}>
              <service.icon className="h-5 w-5" />
            </div>
            
            <h3 className="mt-4 text-xl font-semibold tracking-tight">
              {service.title}
            </h3>
            
            <p className="mt-2 text-sm text-muted-foreground">
              {service.description}
            </p>
            
            <ul className="mt-4 space-y-2 text-sm text-foreground">
              {service.features.map((feature, featureIndex) => (
                <li key={featureIndex} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-brand-emerald" />
                  {feature}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
};

export default Services;