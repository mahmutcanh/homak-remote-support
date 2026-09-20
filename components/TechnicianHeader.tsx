export default function TechnicianHeader() {
  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-gutter-desktop">
      <div className="flex items-center gap-space-md">
        <div className="flex items-center gap-space-xs px-space-sm py-space-xs bg-surface-container-low rounded-lg">
          <span className="material-symbols-outlined text-outline text-[18px]">search</span>
          <span className="font-body-sm text-body-sm text-outline">Filter session tokens, hosts, agents...</span>
        </div>
      </div>
      <div className="flex items-center gap-space-md">
        <div className="flex items-center gap-space-xs px-space-sm py-space-xs rounded-full bg-error-container text-on-error-container">
          <span className="material-symbols-outlined text-[16px]">shield</span>
          <span className="font-label-mono-sm text-label-mono-sm font-semibold">PRIVILEGE LEVEL 3</span>
        </div>
        <button className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors">
          <span className="material-symbols-outlined text-[20px]">notifications</span>
        </button>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
        </div>
      </div>
    </header>
  );
}
