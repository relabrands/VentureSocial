const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold tracking-[0.2em] text-foreground">
            VENTURE SOCIAL
          </span>
          <span className="hidden sm:block text-xs text-muted-foreground tracking-wider uppercase">
            Santo Domingo
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
