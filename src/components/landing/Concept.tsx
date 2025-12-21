import { Users, Target, TrendingUp } from "lucide-react";

const concepts = [
  {
    icon: Users,
    title: "Curated Attendees.",
    description: "Invite-only environment to ensure high-quality connections.",
  },
  {
    icon: Target,
    title: "Zero Fluff.",
    description: "No long keynotes or panels. Focused on meaningful interactions.",
  },
  {
    icon: TrendingUp,
    title: "Deal Flow.",
    description: "Where capital meets product in SDQ.",
  },
];

const Concept = () => {
  return (
    <section className="py-32 px-6 bg-off-white">
      <div className="container mx-auto max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8">
          {concepts.map((concept, index) => (
            <div 
              key={concept.title}
              className="text-center opacity-0 animate-fade-up"
              style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'forwards' }}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 mb-6">
                <concept.icon 
                  className="w-8 h-8 text-foreground" 
                  strokeWidth={1.5} 
                />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3 tracking-tight">
                {concept.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {concept.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Concept;
