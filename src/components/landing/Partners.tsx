const partners = [
  { name: "Stripe", logo: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" },
  { name: "Y Combinator", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b2/Y_Combinator_logo.svg" },
  { name: "Vercel", logo: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Vercel_logo_black.svg" },
  { name: "Linear", logo: "https://cdn.brandfetch.io/idJTT1hgvw/w/512/h/119/theme/dark/logo.png" },
  { name: "Notion", logo: "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png" },
  { name: "Figma", logo: "https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg" },
];

const Partners = () => {
  return (
    <section className="py-24 px-6 border-t border-border">
      <div className="container mx-auto">
        <p className="text-center text-xs tracking-[0.3em] text-muted-foreground uppercase mb-12 opacity-0 animate-fade-in">
          Trusted by members from
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8 max-w-4xl mx-auto">
          {partners.map((partner, index) => (
            <div 
              key={partner.name}
              className="opacity-0 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
            >
              <img
                src={partner.logo}
                alt={partner.name}
                className="h-6 sm:h-8 w-auto grayscale opacity-40 hover:opacity-60 transition-opacity duration-300"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Partners;
