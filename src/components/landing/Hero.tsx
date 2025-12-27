import ApplicationForm from "@/components/landing/ApplicationForm";
import { useVenueMode } from "@/hooks/useVenueMode";
import FounderPass from "@/components/members/FounderPass";

const Hero = () => {
  const { isVenueMode } = useVenueMode();
  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 pt-32 pb-12 overflow-hidden">

      {/* Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/50 via-zinc-950 to-zinc-950 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        {/* Left Column: Text Content */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left order-1">
          <div className="opacity-0 animate-fade-up">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-zinc-100 leading-[1.1] text-balance mb-6">
              Where Santo Domingo's <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">Founders Build the Future.</span>
            </h1>

            {isVenueMode && (
              <div className="mt-4 flex items-center justify-center lg:justify-start gap-3 animate-fade-in transition-all duration-700 mb-6">
                <span className="text-xs font-medium tracking-[0.2em] uppercase text-zinc-500">Partner oficial</span>
                <img
                  src="https://barna.edu.do/wp-content/uploads/2025/01/LOGO_BARNA_HORIZONTAL_BLANCO.webp"
                  alt="Barna Management School"
                  className="h-6 object-contain opacity-70 hover:opacity-100 transition-opacity"
                />
              </div>
            )}
          </div>

          <div className="opacity-0 animate-fade-up animation-delay-200">
            <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light">
              A curated monthly gathering for high-impact founders and investors. <span className="text-zinc-200 font-medium">Powered by AI to ensure zero wasted time.</span>
            </p>
          </div>

          <div className="mt-10 opacity-0 animate-fade-up animation-delay-400 flex flex-col items-center lg:items-start w-full sm:w-auto">
            <ApplicationForm />
            <p className="mt-4 text-[10px] uppercase tracking-widest text-zinc-600">
              Limited to 20 seats per cohort
            </p>
          </div>
        </div>

        {/* Right Column: Floating Founder Pass Visual */}
        {/* Mobile: Order 2 (Below text) | Desktop: Order 2 (Right side) */}
        <div className="flex justify-center items-center order-2 mt-8 lg:mt-0 opacity-0 animate-fade-up animation-delay-300 relative group perspective-1000">
          <div className="absolute -inset-4 bg-yellow-500/20 rounded-full blur-3xl opacity-50 group-hover:opacity-75 transition-opacity duration-700" />
          <div className="relative transform transition-transform duration-700 hover:scale-105 hover:rotate-y-12">
            <div className="scale-[0.85] sm:scale-100 origin-center pointer-events-none border border-yellow-500/30 rounded-[20px] shadow-[0_0_50px_rgba(234,179,8,0.1)]">
              <FounderPass
                name="Robinson Sánchez"
                memberId="001"
                company="@VentureSocialDR"
                role="FOUNDER"
                positionRole="Founder"
                variant="private"
                cohort="JAN 2026"
              />
            </div>
            {/* Gold Member Badge */}
            <div className="absolute -top-6 -right-6 bg-yellow-500 text-black font-bold text-xs px-3 py-1 rounded-full shadow-lg border border-yellow-300 animate-bounce">
              GOLD MEMBER
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;
