const Footer = () => {
  return (
    <footer className="py-16 px-6 border-t border-white/5 bg-zinc-950">
      <div className="container mx-auto">
        <div className="flex flex-col items-center text-center">
          <p className="text-sm text-zinc-400 mb-6">
            Powered by{" "}
            <span className="font-medium text-zinc-200">NOMI,</span>
            <span className="font-medium text-zinc-200"> RELA Brands</span>
            {" & "}
            <span className="font-medium text-zinc-200">DOKTAP</span>
          </p>

          <div className="flex items-center gap-6 text-sm text-zinc-400">
            <a
              href="mailto:hello@venturesocialdr.com"
              className="hover:text-zinc-100 transition-colors duration-200"
            >
              Contact
            </a>
            <span className="text-zinc-700">•</span>
            <a
              href="https://instagram.com/venturesocialdr"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-100 transition-colors duration-200"
            >
              Instagram
            </a>
            <span className="text-zinc-700">•</span>
            <a
              href="https://linkedin.com/company/venture-social"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-100 transition-colors duration-200"
            >
              LinkedIn
            </a>
          </div>

          <p className="mt-8 text-xs text-zinc-600 font-mono tracking-widest uppercase">
            © {new Date().getFullYear()} Venture Social. Santo Domingo, DR.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
