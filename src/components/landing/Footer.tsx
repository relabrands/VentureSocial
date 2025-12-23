const Footer = () => {
  return (
    <footer className="py-16 px-6 border-t border-border">
      <div className="container mx-auto">
        <div className="flex flex-col items-center text-center">
          <p className="text-sm text-muted-foreground mb-6">
            Powered by{" "}
            <span className="font-medium text-foreground/70">NOMI</span>
            {" & "}
            <span className="font-medium text-foreground/70">DOKTAP</span>
          </p>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a
              href="mailto:hello@venturesocialdr.com"
              className="hover:text-foreground transition-colors duration-200"
            >
              Contact
            </a>
            <span className="text-border">•</span>
            <a
              href="https://instagram.com/venturesocialdr"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors duration-200"
            >
              Instagram
            </a>
            <span className="text-border">•</span>
            <a
              href="https://linkedin.com/company/venture-social"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors duration-200"
            >
              LinkedIn
            </a>
          </div>

          <p className="mt-8 text-xs text-muted-foreground/60">
            © {new Date().getFullYear()} Venture Social. Santo Domingo, DR.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
