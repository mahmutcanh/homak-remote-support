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
    const interval = setInterval(loadStats, 30000); // 30 sec auto refresh
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
    <div className="min-h-screen bg-surface flex">
      <TechnicianSidebar />
      <div className="flex-1 lg:pl-64 flex flex-col">
        <TechnicianHeader />

        <main className="p-space-lg max-w-[1400px] w-full mx-auto flex flex-col gap-space-lg">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md p-space-lg rounded-2xl bg-surface-container-low border border-outline-variant/30 shadow-sm">
            <div className="flex flex-col gap-space-2xs">
              <div className="inline-flex items-center gap-space-xs px-space-xs py-[2px] rounded-md bg-primary-container/40 text-primary w-max">
                <span className="material-symbols-outlined text-[14px]">monitoring</span>
                <span className="font-label-mono-sm text-label-mono-sm font-semibold">Realtime Analytics</span>
              </div>
              <h1 className="font-headline-md text-headline-md text-on-surface font-extrabold">
                Sistem Performans Dashboard
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
                Uzaktan destek oturumu metrikleri, aktif kuyruk yoğunluğu ve istemci performans istatistikleri.
              </p>
            </div>

            <div className="flex items-center gap-space-xs">
              <button
                onClick={loadStats}
                className="inline-flex items-center gap-space-2xs px-space-md py-space-sm bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-xl font-action-btn text-action-btn transition-all border border-outline-variant/30"
              >
                <span className={`material-symbols-outlined text-[18px] ${loading ? "animate-spin" : ""}`}>refresh</span>
                <span>Yenile</span>
              </button>
              <Link
                href="/support-queue"
                className="inline-flex items-center gap-space-xs px-space-md py-space-sm bg-primary text-on-primary rounded-xl font-action-btn text-action-btn shadow-md hover:bg-primary-container transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">support_agent</span>
                <span>Kuyruğa Git</span>
              </Link>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-space-md rounded-xl bg-error-container text-on-error-container flex items-center justify-between border border-error/20">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[20px] text-error">error</span>
                <span className="font-body-md text-body-md">{errorMessage}</span>
              </div>
            </div>
          )}

          {/* 4 Main KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
            <div className="p-space-md rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center gap-space-md shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">analytics</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">Toplam Oturum</span>
                <span className="font-headline-md text-headline-md text-on-surface font-extrabold">
                  {stats ? stats.totalSessions : "-"}
                </span>
              </div>
            </div>

            <div className="p-space-md rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center gap-space-md shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">cast_connected</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant font-medium">Aktif Ekran Bağlantısı</span>
                <div className="flex items-center gap-2">
                  <span className="font-headline-md text-headline-md text-on-surface font-extrabold">
                    {stats ? stats.activeSessions : "-"}
                  </span>
                  {stats && stats.activeSessions > 0 && (
                    <span className="w-2.5 h-2.5 rounded-full bg-tertiary animate-pulse" title="Canlı Oturum Aktif"></span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-space-md rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center gap-space-md shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">today</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant font-medium">Bugünkü Talepler</span>
                <span className="font-headline-md text-headline-md text-on-surface font-extrabold">
                  {stats ? stats.todaySessions : "-"}
                </span>
              </div>
            </div>

            <div className="p-space-md rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center gap-space-md shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-surface-container-highest text-on-surface flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">timer</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant font-medium">Ortalama Kabul Süresi</span>
                <span className="font-headline-md text-headline-md text-on-surface font-extrabold">
                  {stats ? formatSeconds(stats.avgWaitSeconds) : "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Status Breakdown & Top Devices */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
            {/* Status Breakdown */}
            <div className="p-space-lg rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col gap-space-md">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-space-xs">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-[20px]">pie_chart</span>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Oturum Durumu Dağılımı</h2>
                </div>
                <span className="font-label-mono-sm text-label-mono-sm text-outline">Geçmiş ve Aktif</span>
              </div>

              {stats ? (
                <div className="flex flex-col gap-space-md">
                  <div className="flex flex-col gap-space-2xs">
                    <div className="flex justify-between font-body-sm text-body-sm">
                      <span className="flex items-center gap-1.5 font-semibold text-on-surface">
                        <span className="w-2.5 h-2.5 rounded-full bg-tertiary"></span>
                        Aktif Oturumlar (ACTIVE)
                      </span>
                      <span className="font-mono font-bold text-on-surface">{stats.activeSessions}</span>
                    </div>
                    <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full bg-tertiary transition-all duration-500"
                        style={{ width: `${stats.totalSessions ? (stats.activeSessions / stats.totalSessions) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-space-2xs">
                    <div className="flex justify-between font-body-sm text-body-sm">
                      <span className="flex items-center gap-1.5 font-semibold text-on-surface">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                        Kabul Edildi / Tamamlandı (ENDED)
                      </span>
                      <span className="font-mono font-bold text-on-surface">{stats.endedSessions}</span>
                    </div>
                    <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${stats.totalSessions ? (stats.endedSessions / stats.totalSessions) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-space-2xs">
                    <div className="flex justify-between font-body-sm text-body-sm">
                      <span className="flex items-center gap-1.5 font-semibold text-on-surface">
                        <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                        Süresi Dolan Kodlar (EXPIRED)
                      </span>
                      <span className="font-mono font-bold text-on-surface">{stats.expiredSessions}</span>
                    </div>
                    <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full bg-secondary transition-all duration-500"
                        style={{ width: `${stats.totalSessions ? (stats.expiredSessions / stats.totalSessions) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-space-2xs">
                    <div className="flex justify-between font-body-sm text-body-sm">
                      <span className="flex items-center gap-1.5 font-semibold text-on-surface">
                        <span className="w-2.5 h-2.5 rounded-full bg-error"></span>
                        Reddedilen Talepler (REJECTED)
                      </span>
                      <span className="font-mono font-bold text-on-surface">{stats.rejectedSessions}</span>
                    </div>
                    <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full bg-error transition-all duration-500"
                        style={{ width: `${stats.totalSessions ? (stats.rejectedSessions / stats.totalSessions) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-space-lg text-center text-on-surface-variant font-body-md">İstatistikler yükleniyor...</div>
              )}
            </div>

            {/* Top Devices */}
            <div className="p-space-lg rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col gap-space-md">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-space-xs">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-[20px]">desktop_windows</span>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">En Çok Bağlanan Cihazlar</h2>
                </div>
                <span className="font-label-mono-sm text-label-mono-sm text-outline">Top 5 Cihaz</span>
              </div>

              {stats && stats.topDevices && stats.topDevices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant/20 text-on-surface-variant font-label-mono-sm text-label-mono-sm">
                        <th className="py-space-xs px-space-sm font-semibold">Cihaz Adı (Hostname)</th>
                        <th className="py-space-xs px-space-sm font-semibold text-right">Bağlantı Sayısı</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10 font-body-sm text-body-sm">
                      {stats.topDevices.map((dev, i) => (
                        <tr key={i} className="hover:bg-surface-container-low/50">
                          <td className="py-space-sm px-space-sm font-mono font-semibold text-on-surface flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px] text-outline">laptop</span>
                            {dev.hostname}
                          </td>
                          <td className="py-space-sm px-space-sm text-right font-mono font-bold text-primary">
                            {dev.count} oturum
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-space-lg text-center text-on-surface-variant font-body-md">
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
