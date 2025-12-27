import { Check } from "lucide-react";

const audiences = [
  "Scalable startup founders",
  "Angel & VC investors",
  "Senior Engineers & Product Leaders",
  "Corporate Innovation Heads",
];

const Audience = () => {
  return (
    <section className="py-32 px-6">
      <div className="container mx-auto max-w-2xl">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-zinc-100 text-center mb-16 tracking-tight opacity-0 animate-fade-up">
          Who Belongs Here.
        </h2>

        <div className="space-y-6">
          {audiences.map((audience, index) => (
            <div
              key={audience}
              className="flex items-center gap-4 opacity-0 animate-fade-up"
              style={{ animationDelay: `${(index + 1) * 100}ms`, animationFillMode: 'forwards' }}
            >
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
                <Check className="w-4 h-4 text-emerald-500" strokeWidth={2.5} />
              </div>
              <span className="text-lg sm:text-xl text-zinc-300">
                {audience}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Audience;
