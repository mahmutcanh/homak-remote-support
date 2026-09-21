"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TechnicianSidebar from "@/components/TechnicianSidebar";
import TechnicianHeader from "@/components/TechnicianHeader";
import { ApiError, getSupportStats, SupportStats } from "@/lib/api";

export default function DashboardPage() {
  const [stats, setStats] = useState<SupportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await getSupportStats();
      setStats(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("İstatistikler yüklenemedi.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatSeconds = (sec: number) => {
    if (!sec || sec < 0) return "0 dk 0 sn";
    const mins = Math.floor(sec / 60);
    const remainingSec = sec % 60;
    if (mins === 0) return `${remainingSec} sn`;
    return `${mins} dk ${remainingSec} sn`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <TechnicianSidebar />
      <div className="flex-1 lg:pl-64 flex flex-col">
        <TechnicianHeader />

        <main className="p-6 sm:p-8 max-w-[1400px] w-full mx-auto flex flex-col gap-6 pt-22">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Performans Raporu</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Destek ve Sistem İstatistikleri
              </h1>
              <p className="text-sm text-slate-500">
                Uzaktan destek oturumları, bekleme süreleri ve en sık bağlanan cihazların özet görünümü.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadStats}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
              >
                <span className={`material-symbols-outlined text-[18px] ${loading ? "animate-spin" : ""}`}>refresh</span>
                <span>Yenile</span>
              </button>
              <Link
                href="/support-queue"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">support_agent</span>
                <span>Canlı Destek Masası</span>
              </Link>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px]">error</span>
              <span className="text-sm font-medium">{errorMessage}</span>
            </div>
          )}

          {/* 4 Main KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">analytics</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-500 uppercase">Toplam Oturum</span>
                <span className="text-2xl font-extrabold text-slate-900">
                  {stats ? stats.totalSessions : "-"}
                </span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">cast_connected</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-500 uppercase">Aktif Ekran</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-extrabold text-slate-900">
                    {stats ? stats.activeSessions : "-"}
                  </span>
                  {stats && stats.activeSessions > 0 && (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">today</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-500 uppercase">Bugünkü Talepler</span>
                <span className="text-2xl font-extrabold text-slate-900">
                  {stats ? stats.todaySessions : "-"}
                </span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">timer</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-500 uppercase">Ort. Yanıt Süresi</span>
                <span className="text-2xl font-extrabold text-slate-900">
                  {stats ? formatSeconds(stats.avgWaitSeconds) : "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Status Breakdown & Top Devices */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Breakdown */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-[20px]">pie_chart</span>
                  <h2 className="text-base font-bold text-slate-900">Oturum Durum Dağılımı</h2>
                </div>
                <span className="text-xs text-slate-400 font-medium">Toplam</span>
              </div>

              {stats ? (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        Aktif Oturumlar
                      </span>
                      <span className="font-mono font-bold text-slate-900">{stats.activeSessions}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${stats.totalSessions ? (stats.activeSessions / stats.totalSessions) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                        Tamamlanan Oturumlar
                      </span>
                      <span className="font-mono font-bold text-slate-900">{stats.endedSessions}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${stats.totalSessions ? (stats.endedSessions / stats.totalSessions) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        Süresi Dolan Kodlar
                      </span>
                      <span className="font-mono font-bold text-slate-900">{stats.expiredSessions}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all"
                        style={{ width: `${stats.totalSessions ? (stats.expiredSessions / stats.totalSessions) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                        Reddedilen Talepler
                      </span>
                      <span className="font-mono font-bold text-slate-900">{stats.rejectedSessions}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full transition-all"
                        style={{ width: `${stats.totalSessions ? (stats.rejectedSessions / stats.totalSessions) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm">İstatistikler yükleniyor...</div>
              )}
            </div>

            {/* Top Devices */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-[20px]">desktop_windows</span>
                  <h2 className="text-base font-bold text-slate-900">En Çok Bağlanan Cihazlar</h2>
                </div>
                <span className="text-xs text-slate-400 font-medium">İlk 5</span>
              </div>

              {stats && stats.topDevices && stats.topDevices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="py-2.5 px-3">Cihaz Adı (Hostname)</th>
                        <th className="py-2.5 px-3 text-right">Oturum Sayısı</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {stats.topDevices.map((dev, i) => (
                        <tr key={i} className="hover:bg-slate-50/80">
                          <td className="py-3 px-3 font-medium text-slate-800 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px] text-slate-400">laptop</span>
                            {dev.hostname}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-blue-600">
                            {dev.count} oturum
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm">
                  Henüz bağlı cihaz geçmişi bulunmuyor.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
