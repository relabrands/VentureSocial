const partners = [
  { name: "RelaBrands", logo: "https://relabrands.com/wp-content/uploads/2024/07/Rela-Brands-Final-01-2-e1719947021908.png", className: "h-10 sm:h-14 invert" },
  { name: "RELA Collab", logo: "https://relabrands.com/wp-content/uploads/2026/03/Logo-Blanco-icono-color.png", className: "h-10 sm:h-14" },
  { name: "Nomi", logo: "https://relabrands.com/wp-content/uploads/2026/07/Nomi-Logo.png", className: "h-16 sm:h-24 invert" },
  { name: "Portier", logo: "https://relabrands.com/wp-content/uploads/2026/07/portier.png", className: "h-10 sm:h-14 invert" },
];

const Partners = () => {
  return (
    <section className="py-24 px-6 border-t border-white/5">
      <div className="container mx-auto">
        <p className="text-center text-xs tracking-[0.3em] text-zinc-500 uppercase mb-12 opacity-0 animate-fade-in">
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
                className={`w-auto grayscale opacity-40 hover:opacity-80 transition-opacity duration-300 ${partner.className}`}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Partners;
