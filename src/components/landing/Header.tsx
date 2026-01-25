import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-[0.2em] text-foreground">
              VENTURE SOCIAL
            </span>
            <span className="hidden sm:block text-xs text-muted-foreground tracking-wider uppercase">
              Santo Domingo
            </span>
          </div>

          <Link to="/access">
            <Button
              variant="outline"
              size="sm"
              className="border-[#10b981]/50 text-[#10b981] hover:bg-[#10b981]/10 hover:text-[#10b981] transition-all"
            >
              Member Access
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
