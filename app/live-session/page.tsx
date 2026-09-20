"use client";

import { useCallback, useEffect, useState } from "react";
import TechnicianSidebar from "@/components/TechnicianSidebar";
import TechnicianHeader from "@/components/TechnicianHeader";
import RemoteDesktopViewer from "@/components/RemoteDesktopViewer";
import {
  ActiveSupportSession,
  getActiveSessions,
  getStoredToken,
  terminateSession as apiTerminateSession,
} from "@/lib/api";
import { useSupportSocket } from "@/lib/useSupportSocket";

function formatSeconds(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}dk ${s}sn`;
}

export default function LiveSessionPage() {
  const [sessions, setSessions] = useState<ActiveSupportSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const refreshSessions = useCallback(async () => {
    try {
      const data = await getActiveSessions();
      setSessions(data);
      if (data.length > 0) {
        setSelectedSessionId((prev) => (prev && data.some((s) => s.id === prev) ? prev : data[0].id));
      } else {
        setSelectedSessionId(null);
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getStoredToken()) {
      if (typeof window !== "undefined") window.location.href = "/login";
      return;
    }
    refreshSessions();
    const interval = setInterval(refreshSessions, 5000);
    return () => clearInterval(interval);
  }, [refreshSessions]);

  useSupportSocket({
    onSessionCreated: refreshSessions,
    onSessionUpdated: refreshSessions,
    onQueueChanged: refreshSessions,
  });

  const terminateSession = async (id: string, code: string) => {
    if (!confirm(`[PIN: ${code}] Oturumunu sonlandırmak istediğinize emin misiniz?`)) return;
    try {
      await apiTerminateSession(id, { reason: "Teknisyen /live-session sayfasından sonlandırdı" });
      refreshSessions();
    } catch {
      alert("Oturum sonlandırılamadı.");
    }
  };

  const copyInvite = (sessionId: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://remote.homaklab.com";
    const inviteUrl = `${origin}/support-queue?session=${sessionId}`;
    navigator.clipboard?.writeText(inviteUrl).catch(() => {});
    setCopiedId(sessionId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) ?? null;

  return (
    <>
      <TechnicianSidebar />
      <div className="lg:pl-64">
        <TechnicianHeader />
        <main className="relative pt-16 bg-surface w-full px-gutter-desktop min-h-screen">
          <div className="flex flex-col w-full pb-space-xl">
            {/* Header section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-space-lg gap-space-md">
              <div className="flex flex-col gap-space-xs">
                <nav className="flex items-center gap-space-xs text-on-surface-variant font-body-sm">
                  <span className="hover:text-primary cursor-pointer transition-colors">Homak Remote</span>
                  <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                  <span className="font-semibold text-primary">Canlı Oturumlar</span>
                </nav>
                <div className="flex items-center gap-space-sm mt-space-xs">
                  <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                    Aktif Ekran Bağlantıları
                  </h1>
                  <span className="px-space-sm py-0.5 rounded-full bg-tertiary-container text-on-tertiary-container font-label-mono-sm text-label-mono-sm font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-tertiary animate-ping"></span>
                    {sessions.length} CANLI OTURUM
                  </span>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
                  Tüm aktif uzaktan masaüstü bağlantılarını tek ekrandan izleyin. 5 dakika boyunca fare/klavye/ekran
                  hareketi olmayan oturumlar güvenlik gereği otomatik sonlandırılır.
                </p>
              </div>
              <button
                onClick={refreshSessions}
                className="flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-surface-container-highest text-on-surface hover:bg-surface-container-high transition-all shadow-sm self-start"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                <span className="font-action-btn text-action-btn">Yenile</span>
              </button>
            </div>

            {/* Inactivity Policy Ribbon */}
            <div className="bg-surface-container-low p-space-md rounded-xl shadow-sm mb-space-lg flex items-center justify-between gap-space-md flex-wrap">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-tertiary text-[22px]">timer_off</span>
                <div className="flex flex-col">
                  <span className="font-label-mono-sm text-label-mono-sm font-semibold text-on-surface">
                    5 DAKİKA İNAKTİVİTE KORUMASI AKTİF
                  </span>
                  <span className="font-body-sm text-body-sm text-outline">
                    Fare veya klavye hareketi 5 dakika durduğunda oturum otomatik EXPIRED yapılarak kapatılır.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-space-xs text-tertiary font-label-mono-sm text-label-mono-sm font-semibold">
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>Otomatik Bellek Temizliği</span>
              </div>
            </div>

            {/* Main Split Grid: Active Sessions List (Left) vs Remote Desktop Viewer (Right) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
              {/* Left Column: Active Sessions Cards / Table */}
              <div className="xl:col-span-5 flex flex-col gap-space-md">
                <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between">
                  <span className="font-headline-sm text-headline-sm text-on-surface">
                    Bağlı Cihazlar Listesi ({sessions.length})
                  </span>
                  <span className="font-label-mono-sm text-label-mono-sm text-outline">Otomatik 5s Yenileme</span>
                </div>

                {loading && (
                  <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm text-center text-on-surface-variant font-body-sm">
                    Aktif oturumlar yükleniyor...
                  </div>
                )}

                {!loading && sessions.length === 0 && (
                  <div className="bg-surface-container-lowest p-space-xl rounded-xl shadow-sm text-center flex flex-col items-center gap-space-sm">
                    <span className="material-symbols-outlined text-4xl text-outline">desktop_access_disabled</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface">Aktif Oturum Bulunmuyor</span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm">
                      Şu anda kabul edilmiş veya çalışan canlı ekran bağlantısı yok. Destek talepleri için &apos;Support Queue&apos; sayfasını kontrol edin.
                    </p>
                  </div>
                )}

                {sessions.map((sess) => {
                  const isSelected = sess.id === selectedSessionId;
                  const isInactiveWarning = sess.lastActivitySecondsAgo > 240; // >4 mins
                  return (
                    <div
                      key={sess.id}
                      onClick={() => setSelectedSessionId(sess.id)}
                      className={`p-space-md rounded-xl shadow-sm transition-all cursor-pointer border-2 ${
                        isSelected
                          ? "bg-surface-container-lowest border-primary shadow-md"
                          : "bg-surface-container-lowest border-transparent hover:border-surface-container-high"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-space-xs">
                        <div className="flex items-center gap-space-xs">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              sess.isAgentOnline ? "bg-tertiary animate-pulse" : "bg-error"
                            }`}
                          ></span>
                          <span className="font-label-mono-lg text-label-mono-lg font-bold text-primary tracking-widest bg-primary-fixed/40 px-2 py-0.5 rounded">
                            {sess.supportCode}
                          </span>
                          {sess.techCount > 1 && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800/50 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">group</span>
                              {sess.techCount} Teknisyen
                            </span>
                          )}
                        </div>
                        <span className="font-label-mono-sm text-label-mono-sm text-outline">
                          Süre: {formatSeconds(sess.activeSeconds)}
                        </span>
                      </div>

                      <div className="flex flex-col gap-0.5 mb-space-sm">
                        <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                          {sess.deviceHostname || "Bilinmeyen Cihaz"}
                        </span>
                        <div className="flex items-center gap-space-sm font-body-sm text-body-sm text-on-surface-variant">
                          <span>IP: {sess.deviceIp || "-"}</span>
                          <span>•</span>
                          <span>Teknisyen: {sess.technicianName || "-"}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-space-xs border-t border-outline-variant/20 font-label-mono-sm text-label-mono-sm">
                        <span
                          className={`flex items-center gap-1 ${
                            isInactiveWarning ? "text-error font-bold animate-pulse" : "text-tertiary"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {isInactiveWarning ? "warning" : "schedule"}
                          </span>
                          <span>
                            {isInactiveWarning
                              ? `İnaktif (${sess.lastActivitySecondsAgo}s) - Kapanmak Üzere!`
                              : `Son hareket: ${sess.lastActivitySecondsAgo}s önce`}
                          </span>
                        </span>

                        <div className="flex items-center gap-space-xs" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => copyInvite(sess.id)}
                            title="Davet linkini kopyala"
                            className="px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-action-btn text-action-btn flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[14px]">person_add</span>
                            <span>{copiedId === sess.id ? "Kopyalandı!" : "Davet"}</span>
                          </button>
                          <button
                            onClick={() => terminateSession(sess.id, sess.supportCode)}
                            title="Oturumu sonlandır"
                            className="px-2 py-1 rounded bg-error-container hover:bg-error text-on-error-container hover:text-on-error font-action-btn text-action-btn transition-colors"
                          >
                            Sonlandır
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Interactive Remote Desktop Canvas */}
              <div className="xl:col-span-7 flex flex-col gap-space-md">
                {selectedSession ? (
                  <div className="flex flex-col gap-space-sm">
                    <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-primary text-[20px]">desktop_windows</span>
                        <span className="font-headline-sm text-headline-sm text-on-surface">
                          Canlı Ekran: {selectedSession.deviceHostname || selectedSession.supportCode}
                        </span>
                      </div>
                      <span className="font-label-mono-sm text-label-mono-sm text-tertiary font-bold">
                        PIN: {selectedSession.supportCode}
                      </span>
                    </div>

                    <RemoteDesktopViewer
                      sessionId={selectedSession.id}
                      supportCode={selectedSession.supportCode}
                      deviceHostname={selectedSession.deviceHostname}
                    />
                  </div>
                ) : (
                  <div className="bg-surface-container-lowest p-space-xl rounded-xl shadow-sm text-center flex flex-col items-center gap-space-sm">
                    <span className="material-symbols-outlined text-5xl text-outline">monitor</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface">İzlemek İçin Bir Oturum Seçin</span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm">
                      Soldaki listeden aktif bir destek oturumuna tıklayarak canlı ekran görüntüsünü ve kontrolleri açın.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
