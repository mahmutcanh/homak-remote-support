import Link from "next/link";

interface PageLink {
  href: string;
  title: string;
  description: string;
  icon: string;
  tag: string;
}

const PAGES: PageLink[] = [
  {
    href: "/support-queue",
    title: "Support Queue",
    description: "Teknisyen konsolu — geçici destek talepleri ve dinamik kriptografik eşleşme havuzu.",
    icon: "support_agent",
    tag: "Teknisyen Paneli",
  },
  {
    href: "/support-portal",
    title: "Destek Portalı",
    description: "support.homaklab.com — son kullanıcı için 6 haneli destek kodu giriş sayfası.",
    icon: "security",
    tag: "Public",
  },
  {
    href: "/client-app",
    title: "HomakSupport.exe İstemci",
    description: "Windows 11 WPF istemci arayüzü — bekleme, onay, aktif oturum ve temizleme aşamaları.",
    icon: "desktop_windows",
    tag: "İstemci Simülasyonu",
  },
  {
    href: "/live-session",
    title: "Aktif Oturum",
    description: "HomakSupport.exe canlı istemci arayüzü — aktif destek oturumu ve izin matrisi.",
    icon: "cast_connected",
    tag: "İstemci Simülasyonu",
  },
  {
    href: "/modes",
    title: "Destek Modları",
    description: "Standart Kullanıcı Modu ile Yükseltilmiş Yönetici Modu karşılaştırması.",
    icon: "hub",
    tag: "Public",
  },
  {
    href: "/support-queue/live-chat",
    title: "Canlı Sohbet & Uzak Masaüstü",
    description: "Oturum içi canlı sohbet ve uzak masaüstü konsolu — teknisyen tarafı.",
    icon: "chat_bubble",
    tag: "Teknisyen Paneli",
  },
  {
    href: "/client-app/approval",
    title: "İzin İsteği",
    description: "HomakSupport.exe onay ekranı — kullanıcı tarafında gelen bağlantı isteği.",
    icon: "vpn_key_alert",
    tag: "İstemci Simülasyonu",
  },
  {
    href: "/audit-logs",
    title: "Audit Logs",
    description: "Geçici destek oturumları için güvenlik denetim kayıtları ve uyumluluk raporu.",
    icon: "receipt_long",
    tag: "Teknisyen Paneli",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-surface flex flex-col">
      <header className="w-full border-b border-outline-variant/30 bg-surface-container-lowest">
        <div className="max-w-[1200px] mx-auto px-margin-desktop py-space-lg flex items-center gap-space-md">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-[22px]">terminal</span>
          </div>
          <div className="flex flex-col">
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
              Homak Remote Attended Support
            </h1>
            <span className="font-label-mono-sm text-label-mono-sm text-outline">
              Sovereign Enterprise Remote Support Suite — Ekran Kartlarına Genel Bakış
            </span>
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-margin-desktop py-space-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-space-lg">
          {PAGES.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="group flex flex-col gap-space-sm p-space-lg rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">{page.icon}</span>
                </div>
                <span className="px-space-xs py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-mono-sm text-label-mono-sm">
                  {page.tag}
                </span>
              </div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold group-hover:text-primary transition-colors">
                {page.title}
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">{page.description}</p>
              <span className="mt-space-xs flex items-center gap-1 font-action-btn text-action-btn text-primary">
                Sayfaya Git
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </span>
            </Link>
          ))}
        </div>
      </main>
      <footer className="w-full border-t border-outline-variant/30 bg-surface-container-low py-space-lg">
        <div className="max-w-[1200px] mx-auto px-margin-desktop flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant">
          <span>© 2024 Homak Remote Technologies Inc.</span>
          <span className="font-label-mono-sm text-label-mono-sm text-outline">Sovereign Enterprise Support Suite</span>
        </div>
      </footer>
    </div>
  );
}
