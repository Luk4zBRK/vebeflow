import { Stars, Gauge, Beaker, Wallet, Rocket } from "lucide-react";

const Benefits = () => {
  const benefits = [
    {
      icon: Gauge,
      title: "Eficiência",
      description: "Reduza tarefas manuais e foque no estratégico.",
      gradient: "from-brand-emerald to-brand-teal"
    },
    {
      icon: Beaker,
      title: "Inovação",
      description: "Tecnologia atualizada, pronta para escalar.",
      gradient: "from-brand-fuchsia to-brand-violet"
    },
    {
      icon: Wallet,
      title: "Redução de custos",
      description: "Automação e otimização de recursos.",
      gradient: "from-brand-rose to-brand-orange"
    },
    {
      icon: Rocket,
      title: "Agilidade",
      description: "Time-to-market acelerado e processos fluídos.",
      gradient: "from-brand-sky to-brand-violet"
    }
  ];

  return (
    <section id="benefits" className="p-6 sm:p-8 bg-card border border-border rounded-3xl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Stars className="h-4 w-4" />
        <span className="font-medium">Benefícios</span>
      </div>
      
      <div className="mt-2">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[0.95]">
          Ganhos claros para o seu time.
        </h2>
        <p className="mt-1 text-sm sm:text-base text-muted-foreground font-medium">
          Resultados tangíveis através de tecnologia e automação.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {benefits.map((benefit, index) => (
          <div
            key={index}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 card-hover transition-all duration-300 hover:shadow-card"
          >
            <div className={`pointer-events-none absolute -top-10 -right-10 h-24 w-24 rounded-full bg-gradient-to-tr ${benefit.gradient} opacity-20 blur-2xl transition-opacity duration-300 group-hover:opacity-30`} />
            <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr ${benefit.gradient} text-white shadow-primary/40`}>
              <benefit.icon className="h-4 w-4" />
            </div>

            <h3 className="mt-4 text-lg font-semibold tracking-tight">
              {benefit.title}
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              {benefit.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Benefits;