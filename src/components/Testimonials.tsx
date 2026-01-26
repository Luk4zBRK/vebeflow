import { Quote, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import useEmblaCarousel from 'embla-carousel-react';

const Testimonials = () => {
  const { getTestimonials } = useSiteConfig();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const testimonials = getTestimonials() || [
    {
      id: 1,
      name: "Marina Costa",
      role: "Operações, RetailPro",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=160&auto=format&fit=crop",
      content: "Integrações impecáveis e respostas rápidas. Reduzimos 35% do tempo operacional em 3 meses.",
      rating: 5
    },
    {
      id: 2,
      name: "Rodrigo Silva", 
      role: "CTO, FinData",
      avatar: "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?q=80&w=160&auto=format&fit=crop",
      content: "Melhor investimento do ano. O time é técnico, organizado e muito colaborativo.",
      rating: 5
    },
    {
      id: 3,
      name: "Aline Pires",
      role: "Head de Produto, HealthX", 
      avatar: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=160&auto=format&fit=crop",
      content: "Do discovery ao rollout, tudo foi muito fluido. Aumento de 2.4x em produtividade do time.",
      rating: 5
    }
  ];

  const scrollPrev = () => emblaApi && emblaApi.scrollPrev();
  const scrollNext = () => emblaApi && emblaApi.scrollNext();

  // Auto-scroll functionality
  useEffect(() => {
    if (!emblaApi) return;

    const autoScroll = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);

    return () => clearInterval(autoScroll);
  }, [emblaApi]);

  // Track current slide
  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setCurrentIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on('select', onSelect);
    onSelect();

    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  return (
    <section id="testimonials" className="p-6 sm:p-8 bg-primary text-primary-foreground border border-border rounded-3xl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Quote className="h-4 w-4" />
        <span className="font-medium">Depoimentos</span>
      </div>
      
      <div className="mt-2">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[0.95]">
          O que dizem nossos clientes.
        </h2>
        <p className="mt-1 text-sm sm:text-base text-muted-foreground font-medium">
          Feedbacks reais, impacto comprovado.
        </p>
      </div>

      <div className="mt-6 relative">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.333%] min-w-0 px-2">
                <article className="rounded-2xl border border-border bg-card/10 backdrop-blur-sm p-6 min-h-[220px] card-hover">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img 
                        src={testimonial.avatar} 
                        alt={testimonial.name}
                        className="h-9 w-9 rounded-md object-cover ring-2 ring-border"
                      />
                      <div>
                        <p className="text-sm font-semibold tracking-tight">
                          {testimonial.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 text-yellow-400">
                      {[...Array(testimonial.rating || 5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                  </div>
                  
                  <p className="mt-4 text-lg font-semibold tracking-tight leading-snug">
                    {testimonial.content}
                  </p>
                </article>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={scrollPrev}
              className="bg-background/10 border-border hover:bg-background/20"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={scrollNext}
              className="bg-background/10 border-border hover:bg-background/20"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Dots indicator */}
          <div className="flex gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                title={`Ir para depoimento ${index + 1}`}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-background' : 'bg-background/30'
                }`}
                onClick={() => emblaApi && emblaApi.scrollTo(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;