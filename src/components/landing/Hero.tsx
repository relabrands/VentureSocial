import ApplicationForm from "@/components/landing/ApplicationForm";
import { useVenueMode } from "@/hooks/useVenueMode";

const Hero = () => {
  const { isVenueMode } = useVenueMode();
  return (
    <section className="min-h-screen flex items-center justify-center px-6 pt-20">
      <div className="max-w-3xl mx-auto text-center">
        <div className="opacity-0 animate-fade-up">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.1] text-balance">
            The Gathering for Santo Domingo's Tech Ecosystem.
          </h1>

          {isVenueMode && (
            <div className="mt-4 flex items-center justify-center gap-3 animate-fade-in transition-all duration-700">
              <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">Hosted by</span>
              <img
                src="https://barna.edu.do/wp-content/uploads/2025/01/LOGO_BARNA_HORIZONTAL_BLANCO.webp"
                alt="Barna Management School"
                className="h-8 object-contain invert dark:invert-0"
              />
            </div>
          )}
        </div>

        <div className="opacity-0 animate-fade-up animation-delay-200">
          <p className="mt-8 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Founders. Operators. Investors. A curated monthly event for high-density networking. No sales pitches, just connection.
          </p>
        </div>

        <div className="mt-12 opacity-0 animate-fade-up animation-delay-400">
          <ApplicationForm />
          <p className="mt-4 text-xs text-muted-foreground">
            Applications reviewed within 48 hours
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
