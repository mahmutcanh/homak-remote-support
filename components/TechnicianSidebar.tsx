"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearAuth, getStoredTechnician, getStoredToken, Technician } from "@/lib/api";

const NAV_ITEMS = [
  { href: "/dashboard", icon: "dashboard", label: "Dashboard" },
  { href: "/support-queue", icon: "support_agent", label: "Support Queue" },
  { href: "/admin/technicians", icon: "manage_accounts", label: "Teknisyen Yönetimi" },
  { href: "/devices", icon: "devices", label: "Devices" },
  { href: "/live-session", icon: "cast_connected", label: "Sessions" },
  { href: "/recordings", icon: "video_library", label: "Oturum Kayıtları" },
  { href: "/audit-logs", icon: "receipt_long", label: "Audit Logs" },
  { href: "/access-policies", icon: "admin_panel_settings", label: "Access Policies" },
];

const ACTIVE_CLASSES =
  "flex items-center gap-space-sm px-space-sm py-space-sm transition-all bg-primary-container text-on-primary font-semibold rounded-lg shadow-[0_1px_4px_rgba(11,87,208,0.2)]";
const INACTIVE_CLASSES =
  "flex items-center gap-space-sm px-space-sm py-space-sm rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all";

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
    <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-low shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 hidden lg:flex flex-col justify-between p-space-md">
      <div className="flex flex-col gap-space-lg">
        <div className="flex items-center gap-space-sm px-space-sm py-space-xs">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-[18px]">terminal</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm text-on-surface font-bold">HOMAK</span>
            <span className="font-label-mono-sm text-label-mono-sm text-primary tracking-wider">ENTERPRISE</span>
          </div>
        </div>
        <nav className="flex flex-col gap-space-xs">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={isActive ? ACTIVE_CLASSES : INACTIVE_CLASSES}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span className="font-action-btn text-action-btn">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex flex-col gap-space-xs">
        <div className="flex flex-col gap-1 p-1 bg-surface-container rounded-lg">
          <a
            href="/downloads/HomakTechnicianConsole.exe"
            download
            className="flex items-center gap-space-xs px-space-sm py-1.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-all font-action-btn text-action-btn"
            title="Teknisyen Konsol Uygulamasını İndirin (HomakTechnicianConsole.exe)"
          >
            <span className="material-symbols-outlined text-[16px]">computer</span>
            <span className="text-[11px] font-semibold">Teknisyen Konsolu (.exe)</span>
          </a>
          <a
            href="/downloads/HomakDesktopAgent.exe"
            download
            className="flex items-center gap-space-xs px-space-sm py-1.5 rounded bg-tertiary/10 text-tertiary hover:bg-tertiary/20 transition-all font-action-btn text-action-btn"
            title="Müşteri Destek Agent Uygulamasını İndirin (HomakDesktopAgent.exe)"
          >
            <span className="material-symbols-outlined text-[16px]">download_for_offline</span>
            <span className="text-[11px] font-semibold">Müşteri Agent (.exe)</span>
          </a>
        </div>
        <div className="bg-surface-container p-space-sm rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <span className="w-2 h-2 rounded-full bg-tertiary"></span>
            <div className="flex flex-col">
              <span className="font-label-mono-sm text-label-mono-sm text-on-surface font-semibold">
                {technician?.displayName ?? "Teknisyen"}
              </span>
              <span className="font-body-sm text-body-sm text-outline">
                {technician?.department ?? "Homak Ops Core"}
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-outline text-[18px]">verified</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-space-xs px-space-sm py-space-xs rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-error transition-all font-action-btn text-action-btn"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span>Çıkış Yap</span>
        </button>
      </div>
    </aside>
  );
}
