import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import Partners from "@/components/landing/Partners";
import Concept from "@/components/landing/Concept";
import Countdown from "@/components/landing/Countdown";
import Gallery from "@/components/landing/Gallery";
import Audience from "@/components/landing/Audience";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Partners />
        <Concept />
        <Countdown />
        <Gallery />
        <Audience />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
