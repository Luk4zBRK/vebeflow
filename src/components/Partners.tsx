import { useMemo } from "react";

const partners = [
  {
    name: "OpenAI",
    logo: "https://horizons-cdn.hostinger.com/bb2c084b-64f0-4d8c-95a6-314c5903de42/fda17bab53e589460d810c8193ce5755.png"
  },
  {
    name: "Gemini",
    logo: "https://horizons-cdn.hostinger.com/bb2c084b-64f0-4d8c-95a6-314c5903de42/8aa750445692277f020da47ce20ad691.png"
  },
  {
    name: "Anthropic",
    logo: "https://horizons-cdn.hostinger.com/bb2c084b-64f0-4d8c-95a6-314c5903de42/d50b0eb48a655c07682bdaa098b244f5.png"
  },
  {
    name: "Replicate",
    logo: "https://horizons-cdn.hostinger.com/bb2c084b-64f0-4d8c-95a6-314c5903de42/cf48c3d59bea37272a1a168e62f2d3c7.png"
  },
  {
    name: "Groq",
    logo: "https://horizons-cdn.hostinger.com/bb2c084b-64f0-4d8c-95a6-314c5903de42/84ec68e07c609918c275d854169e6d86.png"
  },
  {
    name: "Hugging Face",
    logo: "https://horizons-cdn.hostinger.com/bb2c084b-64f0-4d8c-95a6-314c5903de42/8f2bb975a65e1945da7a5eaea8a19632.png"
  }
];

const Partners = () => {
  const marqueePartners = useMemo(() => [...partners, ...partners], []);

  return (
    <section
      id="parceiros"
      className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-background via-card to-background px-6 py-16 sm:px-10"
    >
      <div className="absolute inset-0 bg-gradient-primary opacity-10" />
      <div className="absolute inset-0 bg-[radial-gradient(600px_400px_at_20%_0%,hsl(var(--brand-violet)/0.15),transparent),radial-gradient(600px_400px_at_80%_100%,hsl(var(--brand-sky)/0.12),transparent)]" />
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-background/20 to-transparent" />

      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-10">
        <div className="space-y-4 text-center text-foreground">
          <h2 className="text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl text-foreground">
            Tecnologia de <span className="gradient-text drop-shadow-sm">ponta</span> para escalar seu negócio
          </h2>
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground bg-gradient-primary bg-clip-text text-transparent">
            ⚡ Powered by
          </p>
        </div>

        <div className="relative overflow-hidden" aria-live="off">
          <div className="pointer-events-none absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-transparent via-transparent to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-transparent via-transparent to-transparent" />

          <div className="flex animate-marquee items-center gap-16" role="list">
            {marqueePartners.map((partner, index) => (
              <div
                role="listitem"
                key={`${partner.name}-${index}`}
                className="flex h-20 min-w-[160px] items-center justify-center opacity-70 transition-all duration-300 hover:opacity-100 hover:scale-110 card-hover"
              >
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="h-14 w-auto object-contain saturate-0 brightness-[0.55] contrast-150 transition-all duration-300 drop-shadow-[0_0_10px_hsl(var(--brand-rose)/0.35)] hover:drop-shadow-[0_0_18px_hsl(var(--brand-rose)/0.7)] md:h-20"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Partners;
