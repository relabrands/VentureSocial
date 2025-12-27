const Gallery = () => {
  const placeholders = [1, 2, 3];

  return (
    <section className="py-24 md:py-32">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-zinc-500 text-xs tracking-[0.3em] uppercase mb-4">
            Past Events
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 tracking-tight">
            Moments from the Community.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {placeholders.map((i) => (
            <div
              key={i}
              className="aspect-[3/2] bg-white/5 border border-white/10 flex items-center justify-center rounded-xl"
            >
              <p className="text-zinc-600 font-light tracking-widest uppercase text-sm">
                Coming Soon
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Gallery;
