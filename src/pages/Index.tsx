import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import BentoGrid from "@/components/landing/BentoGrid";
import Countdown from "@/components/landing/Countdown";
import Audience from "@/components/landing/Audience";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500/30">
      <Header />
      <main className="space-y-0 pb-24">
        <Hero />
        <Countdown />
        <BentoGrid />
        <Audience />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
