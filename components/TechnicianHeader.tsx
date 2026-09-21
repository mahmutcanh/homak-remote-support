"use client";

import { useEffect, useState } from "react";
import { getStoredTechnician, Technician } from "@/lib/api";

export default function TechnicianHeader() {
  const [technician, setTechnician] = useState<Technician | null>(null);

  useEffect(() => {
    setTechnician(getStoredTechnician());
  }, []);

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 z-40 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="material-symbols-outlined text-slate-400 text-[18px]">verified_user</span>
          <span className="font-medium text-slate-700">Homak Uzaktan Teknik Destek Sistemi</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Realtime Server Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Canlı Ağ Aktif</span>
        </div>

        {/* Technician Badge */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {technician?.displayName ? technician.displayName.charAt(0).toUpperCase() : "M"}
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-bold text-slate-800 leading-tight">
              {technician?.displayName ?? "Mahmut Homak"}
            </span>
            <span className="text-[10px] text-slate-500 leading-tight">
              {technician?.department ?? "IT Yetkilisi"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
