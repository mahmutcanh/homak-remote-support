export default function PublicHeader() {
  return (
    <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-16 max-w-[1200px] mx-auto px-margin-desktop flex items-center justify-between">
        <div className="flex items-center gap-space-md">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-[20px]">security</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight">
              HOMAK<span className="text-primary ml-space-xs font-normal">REMOTE</span>
            </span>
            <span className="font-label-mono-sm text-label-mono-sm text-outline">support.homaklab.com</span>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-space-lg">
          <a className="font-action-btn text-action-btn text-on-surface-variant hover:text-on-surface transition-colors" href="#">
            Client Portal
          </a>
          <a
            aria-current="page"
            className="transition-colors bg-primary-container text-on-primary font-action-btn text-action-btn rounded-lg px-space-md py-space-xs shadow-[0_1px_4px_rgba(11,87,208,0.2)]"
            href="#"
          >
            Connection Guide
          </a>
          <a className="font-action-btn text-action-btn text-on-surface-variant hover:text-on-surface transition-colors" href="#">
            Security &amp; Trust
          </a>
          <a className="font-action-btn text-action-btn text-on-surface-variant hover:text-on-surface transition-colors" href="#">
            Downloads
          </a>
        </nav>
        <div className="flex items-center gap-space-md">
          <div className="hidden sm:flex items-center gap-space-xs px-space-sm py-space-xs bg-surface-container rounded-full">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
            <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">Sovereign Gateway Active</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
          </div>
        </div>
      </div>
    </header>
  );
}
