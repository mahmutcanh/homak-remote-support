export default function PublicFooter() {
  return (
    <footer className="w-full bg-surface-container-low py-space-xl">
      <div className="max-w-[1200px] mx-auto px-margin-desktop flex flex-col md:flex-row items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-sm">
          <span className="material-symbols-outlined text-outline text-[18px]">verified_user</span>
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            © 2024 Homak Remote Technologies Inc. Sovereign Enterprise Support Suite.
          </span>
        </div>
        <div className="flex items-center gap-space-lg">
          <span className="font-label-mono-sm text-label-mono-sm text-outline">SOC 2 Type II Certified</span>
          <span className="font-label-mono-sm text-label-mono-sm text-outline">End-to-End TLS 1.3 Encryption</span>
        </div>
      </div>
    </footer>
  );
}
