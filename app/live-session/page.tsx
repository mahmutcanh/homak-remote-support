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
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const refreshSessions = useCallback(async () => {
    setIsRefreshing(true);
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
      setTimeout(() => setIsRefreshing(false), 400);
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
        <main className="relative pt-16 bg-slate-50/60 min-h-screen">
          <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">

            {/* Breadcrumb & Header Title */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
              <div className="flex flex-col gap-1.5">
                <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <span className="hover:text-blue-600 cursor-pointer transition-colors">Homak Remote</span>
                  <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                  <span className="text-blue-600">Canlı Uzak Masaüstü</span>
                </nav>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Canlı Uzak Masaüstü Ekranı
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200/60 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    {sessions.length} CANLI OTURUM
                  </span>
                </div>
                <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                  Bağlı istemci bilgisayarlarını yüksek çözünürlük ve düşük gecikmeyle uzaktan izleyin, fareniz ve klavyenizle doğrudan yönetin.
                </p>
              </div>

              {/* Top Quick Actions */}
              <div className="flex items-center gap-2.5 self-start md:self-auto">
                <button
                  onClick={refreshSessions}
                  disabled={isRefreshing}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <span className={`material-symbols-outlined text-[16px] ${isRefreshing ? "animate-spin text-blue-600" : ""}`}>
                    refresh
                  </span>
                  <span>Yenile</span>
                </button>
              </div>
            </div>

            {/* Inactivity & Protection Banner */}
            <div className="bg-gradient-to-r from-blue-900/5 via-indigo-900/5 to-transparent border border-blue-100 rounded-2xl p-3.5 px-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-slate-700">
                <span className="material-symbols-outlined text-blue-600 text-[20px]">verified_user</span>
                <span className="font-semibold text-slate-800">
                  Uçtan Uca Şifreli WebRTC & WebSocket İletişimi
                </span>
                <span className="hidden sm:inline text-slate-400">•</span>
                <span className="hidden sm:inline text-slate-500">
                  1 saat boyunca hareketsiz kalan oturumlar otomatik olarak sonlandırılır.
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-500 text-[11px] font-mono">
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Gecikmesiz İletim (60 FPS)
                </span>
              </div>
            </div>

            {/* Split Screen Workspace: Session Cards (Left) vs Live Desktop Viewer (Right) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

              {/* Left Column: Active Connected Devices (Col 4) */}
              <div className="xl:col-span-4 flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Aktif Cihazlar ({sessions.length})
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">Otomatik 5s Güncelleme</span>
                </div>

                {loading && (
                  <div className="p-8 rounded-2xl bg-white border border-slate-200/80 text-center text-slate-400 text-xs shadow-xs">
                    Aktif oturumlar yükleniyor...
                  </div>
                )}

                {!loading && sessions.length === 0 && (
                  <div className="p-8 rounded-2xl bg-white border border-slate-200/80 text-center flex flex-col items-center gap-2.5 shadow-xs">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                      <span className="material-symbols-outlined text-2xl">desktop_access_disabled</span>
                    </div>
                    <span className="text-sm font-bold text-slate-800">Aktif Oturum Bulunmuyor</span>
                    <p className="text-xs text-slate-500 max-w-xs">
                      Şu anda çalışan bir ekran bağlantısı yok. Yeni gelen destek talepleri için <b>Destek Kuyruğu</b> sayfasını kontrol edebilirsiniz.
                    </p>
                  </div>
                )}

                {sessions.map((sess) => {
                  const isSelected = sess.id === selectedSessionId;
                  const isInactiveWarning = sess.lastActivitySecondsAgo > 300; // >5 mins
                  return (
                    <div
                      key={sess.id}
                      onClick={() => setSelectedSessionId(sess.id)}
                      className={`p-4 rounded-2xl transition-all cursor-pointer border ${
                        isSelected
                          ? "bg-white border-blue-500 shadow-md ring-2 ring-blue-500/10"
                          : "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              sess.isAgentOnline ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                            }`}
                          ></span>
                          <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-black tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60">
                            {sess.supportCode}
                          </span>
                          {sess.techCount > 1 && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">group</span>
                              {sess.techCount}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-mono font-semibold text-slate-500">
                          {formatSeconds(sess.activeSeconds)}
                        </span>
                      </div>

                      <div className="flex flex-col gap-0.5 mb-3">
                        <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-blue-600">devices</span>
                          {sess.deviceHostname || "Bilinmeyen Cihaz"}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                          <span>IP: {sess.deviceIp || "-"}</span>
                          <span>•</span>
                          <span>{sess.technicianName || "Teknisyen"}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
                        <span
                          className={`flex items-center gap-1 text-[11px] ${
                            isInactiveWarning ? "text-rose-600 font-bold animate-pulse" : "text-slate-500"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {isInactiveWarning ? "warning" : "schedule"}
                          </span>
                          <span>
                            {isInactiveWarning
                              ? `İnaktif (${sess.lastActivitySecondsAgo}s)`
                              : `${sess.lastActivitySecondsAgo}s önce`}
                          </span>
                        </span>

                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => copyInvite(sess.id)}
                            title="Oturum davet linkini kopyala"
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[13px]">person_add</span>
                            <span>{copiedId === sess.id ? "Kopyalandı!" : "Davet"}</span>
                          </button>
                          <button
                            onClick={() => terminateSession(sess.id, sess.supportCode)}
                            title="Oturumu sonlandır"
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors"
                          >
                            Sonlandır
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Interactive Remote Desktop Screen & Control Console (Col 8) */}
              <div className="xl:col-span-8 flex flex-col gap-3">
                {selectedSession ? (
                  <div className="flex flex-col gap-2">
                    <div className="p-3.5 px-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[20px]">desktop_windows</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">
                            {selectedSession.deviceHostname || selectedSession.supportCode}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            Oturum ID: {selectedSession.id}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono font-bold text-xs">
                          PIN: {selectedSession.supportCode}
                        </span>
                      </div>
                    </div>

                    <RemoteDesktopViewer
                      sessionId={selectedSession.id}
                      supportCode={selectedSession.supportCode}
                      deviceHostname={selectedSession.deviceHostname}
                    />
                  </div>
                ) : (
                  <div className="p-16 rounded-3xl bg-white border border-slate-200/80 text-center flex flex-col items-center gap-3 shadow-xs">
                    <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-400">
                      <span className="material-symbols-outlined text-3xl text-slate-400">monitor</span>
                    </div>
                    <span className="text-base font-bold text-slate-800">İzlemek İçin Bir Cihaz Seçin</span>
                    <p className="text-xs text-slate-500 max-w-sm">
                      Sol taraftaki listeden aktif bir cihaza tıklayarak canlı ekran görüntüsünü, sesli görüşmeyi ve kontrol araçlarını açabilirsiniz.
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
