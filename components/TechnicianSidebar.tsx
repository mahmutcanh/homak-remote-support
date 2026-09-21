"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearAuth, getStoredTechnician, getStoredToken, Technician } from "@/lib/api";

const NAV_ITEMS = [
  { href: "/support-queue", icon: "support_agent", label: "Destek Masası", desc: "Canlı talepler ve ekran" },
  { href: "/dashboard", icon: "dashboard", label: "Genel Bakış", desc: "Sistem ve oturum istatistikleri" },
  { href: "/live-session", icon: "cast_connected", label: "Aktif Oturumlar", desc: "Mevcut uzak bağlantılar" },
  { href: "/devices", icon: "devices", label: "Cihazlar", desc: "Bağlanan bilgisayarlar" },
  { href: "/recordings", icon: "video_library", label: "Kayıtlar", desc: "Oturum video geçmişi" },
  { href: "/admin/technicians", icon: "manage_accounts", label: "Teknisyenler", desc: "Yetkili kullanıcılar" },
];

export default function TechnicianSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [technician, setTechnician] = useState<Technician | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setTechnician(getStoredTechnician());
  }, [router]);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 shadow-sm z-50 hidden lg:flex flex-col justify-between">
      {/* Brand Header */}
      <div className="flex flex-col">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <span className="material-symbols-outlined text-[20px]">desktop_windows</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 text-sm tracking-tight">HOMAK DESTEK</span>
            <span className="text-[11px] font-semibold text-blue-600 tracking-wider">TEKNİSYEN PANELİ</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1.5">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Ana Menü
          </div>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-50 text-blue-600 font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                  }`}
                >
                  {item.icon}
                </span>
                <div className="flex flex-col">
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Footer & Logout */}
      <div className="p-4 border-t border-slate-100 flex flex-col gap-2">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
              {technician?.displayName ? technician.displayName.charAt(0).toUpperCase() : "T"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-slate-800 truncate">
                {technician?.displayName ?? "Teknisyen"}
              </span>
              <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Çevrimiçi
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span>Çıkış Yap</span>
        </button>
      </div>
    </aside>
  );
}
