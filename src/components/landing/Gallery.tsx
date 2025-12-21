const Gallery = () => {
  const placeholders = [1, 2, 3];

  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-muted-foreground text-xs tracking-[0.3em] uppercase mb-4">
            Past Events
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Moments from the Community.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {placeholders.map((i) => (
            <div
              key={i}
              className="aspect-[3/2] bg-muted/30 border border-border flex items-center justify-center"
            >
              <p className="text-muted-foreground font-light tracking-widest uppercase text-sm">
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
