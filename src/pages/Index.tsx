import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Services from "@/components/Services";
import Portfolio from "@/components/Portfolio";
import Benefits from "@/components/Benefits";
import Partners from "@/components/Partners";
import ChatAssistant from "@/components/ChatAssistant";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

const Index = () => {
  const location = useLocation();

  useEffect(() => {
    // Se veio de outra página com instrução para scroll
    if (location.state?.scrollTo) {
      setTimeout(() => {
        const element = document.getElementById(location.state.scrollTo);
        if (element) {
          const headerOffset = 96;
          const elementPosition = element.getBoundingClientRect().top + window.scrollY;
          const offsetPosition = elementPosition - headerOffset;
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
      }, 100);
    }
  }, [location.state]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-8 pb-16 sm:pb-20 flex flex-col gap-12">
        <Hero />
        <About />
        <Services />
        <Portfolio />
        <Benefits />
        <ChatAssistant />
        <Partners />
        <Contact />
        <Footer />
      </main>
    </div>
  );
};

export default Index;
