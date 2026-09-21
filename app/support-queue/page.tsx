"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import TechnicianSidebar from "@/components/TechnicianSidebar";
import TechnicianHeader from "@/components/TechnicianHeader";
import {
  QueueItem,
  acceptSession as apiAcceptSession,
  generateCode as apiGenerateCode,
  getQueue,
  getSession,
  getStoredToken,
  rejectSession as apiRejectSession,
  terminateSession as apiTerminateSession,
} from "@/lib/api";
import { useSupportSocket } from "@/lib/useSupportSocket";
import RemoteDesktopViewer from "@/components/RemoteDesktopViewer";

type ToastState = {
  message: string;
  icon: string;
  isError: boolean;
  visible: boolean;
};

function formatWait(seconds: number): string {
  if (seconds < 60) return `${seconds} sn`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m} dk ${s} sn`;
}

export default function SupportQueuePage() {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [activeItems, setActiveItems] = useState<QueueItem[]>([]);
  const activeItemsRef = useRef<QueueItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [permMode, setPermMode] = useState<"full" | "view">("full");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPin, setModalPin] = useState("");
  const [modalCopyText, setModalCopyText] = useState("Kodu Kopyala");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    message: "",
    icon: "check_circle",
    isError: false,
    visible: false,
  });

  const showToast = useCallback(
    (message: string, icon: string = "check_circle", isError: boolean = false) => {
      setToast({ message, icon, isError, visible: true });
      setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 3200);
    },
    [],
  );

  const refreshQueue = useCallback(async () => {
    try {
      const data = await getQueue();
      const now = Date.now();
      const validItems = data.filter(
        (item) =>
          item.status === "WAITING_TECHNICIAN" &&
          new Date(item.expiresAt).getTime() > now,
      );
      setQueueItems(validItems);
      setSelectedId((prev) => {
        if (
          prev &&
          (validItems.some((item) => item.id === prev) ||
            activeItemsRef.current.some((item) => item.id === prev))
        ) {
          return prev;
        }
        return validItems[0]?.id ?? null;
      });
    } catch {
      showToast("Kuyruk bilgisi güncellenemedi.", "error", true);
    }
  }, [showToast]);

  useEffect(() => {
    if (!getStoredToken()) {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return;
    }
    refreshQueue();

    // Check for invite parameter ?session=<id>
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const invitedId = params.get("session");
      if (invitedId) {
        getSession(invitedId)
          .then((sess) => {
            const item: QueueItem = { ...sess, waitSeconds: 0 };
            setActiveItems((prev) => {
              if (prev.some((x) => x.id === item.id)) return prev;
              return [item, ...prev];
            });
            setSelectedId(item.id);
            showToast(`[${item.supportCode}] Oturumu açıldı.`, "person_add");
          })
          .catch(() => {
            showToast("Oturum bulunamadı veya sonlandırılmış.", "error", true);
          });
      }
    }

    const interval = setInterval(() => {
      const now = Date.now();
      setQueueItems((prev) => {
        const filtered = prev.filter(
          (item) =>
            item.status === "WAITING_TECHNICIAN" &&
            new Date(item.expiresAt).getTime() > now,
        );
        return filtered.map((item) => ({
          ...item,
          waitSeconds: Math.max(
            0,
            Math.floor((now - new Date(item.createdAt).getTime()) / 1000),
          ),
        }));
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [refreshQueue]);

  useEffect(() => {
    activeItemsRef.current = activeItems;
  }, [activeItems]);

  useSupportSocket({
    onSessionCreated: () => refreshQueue(),
    onSessionUpdated: (payload) => {
      refreshQueue();
      const updated = payload as QueueItem | undefined;
      if (updated && updated.id) {
        setActiveItems((prev) => {
          const exists = prev.some((item) => item.id === updated.id);
          if (!exists) return prev;
          if (updated.status === "ENDED" || updated.status === "REJECTED" || updated.status === "EXPIRED") {
            return prev.filter((item) => item.id !== updated.id);
          }
          return prev.map((item) =>
            item.id === updated.id ? { ...item, ...updated, waitSeconds: item.waitSeconds } : item,
          );
        });
      }
    },
    onQueueChanged: () => refreshQueue(),
  });

  const selectedItem =
    activeItems.find((item) => item.id === selectedId) ??
    queueItems.find((item) => item.id === selectedId) ??
    null;

  const acceptSession = async (id: string, hostname: string | null) => {
    try {
      const updated = await apiAcceptSession(id, { technicianName: "Mahmut Homak" });
      showToast(
        `${hostname || "Cihaz"} bağlantısı kabul edildi. Ekran açılıyor...`,
        "check_circle",
      );
      setActiveItems((prev) => {
        const withoutOld = prev.filter((item) => item.id !== updated.id);
        return [{ ...updated, waitSeconds: 0 }, ...withoutOld];
      });
      setSelectedId(updated.id);
      refreshQueue();
    } catch {
      showToast("Oturum kabul edilemedi.", "cancel", true);
    }
  };

  const rejectSession = async (id: string, code: string) => {
    try {
      await apiRejectSession(id);
      showToast(`[${code}] Destek talebi reddedildi.`, "cancel", true);
      refreshQueue();
    } catch {
      showToast("Talep reddedilemedi.", "cancel", true);
    }
  };

  const terminateActiveSession = async (id: string, code: string) => {
    try {
      await apiTerminateSession(id, { reason: "Teknisyen tarafından sonlandırıldı" });
      showToast(`[${code}] Oturum başarıyla sonlandırıldı.`, "check_circle");
      setActiveItems((prev) => prev.filter((item) => item.id !== id));
      if (selectedId === id) {
        const remaining = activeItems.filter((item) => item.id !== id);
        setSelectedId(remaining[0]?.id ?? null);
      }
      refreshQueue();
    } catch {
      showToast("Oturum sonlandırılamadı.", "cancel", true);
    }
  };

  const copyModalPin = () => {
    navigator.clipboard?.writeText(modalPin.replace(/\s+/g, "")).catch(() => {});
    setModalCopyText("Kopyalandı!");
    setTimeout(() => setModalCopyText("Kodu Kopyala"), 2000);
    showToast(`Destek kodu ${modalPin} kopyalandı.`);
  };

  const handleGenerateCode = async () => {
    setLoading(true);
    try {
      const res = await apiGenerateCode({ technicianName: "Mahmut Homak", department: "IT Destek" });
      const raw = res.supportCode;
      setModalPin(`${raw.slice(0, 3)} ${raw.slice(3)}`);
      setModalOpen(true);
    } catch {
      showToast("Destek kodu üretilemedi.", "error", true);
    } finally {
      setLoading(false);
    }
  };

  const activeSelectedSession = activeItems.find((item) => item.id === selectedId);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <TechnicianSidebar />

      <div className="flex-1 lg:pl-64 flex flex-col">
        <TechnicianHeader />

        <main className="p-6 sm:p-8 max-w-[1400px] w-full mx-auto flex flex-col gap-6 pt-22">
          {/* Top Title & Primary Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Canlı Destek Masası</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Uzaktan Destek ve Oturum Yönetimi
              </h1>
              <p className="text-sm text-slate-500">
                Gelen destek taleplerini tek tıkla onaylayabilir ve uzak bilgisayarı canlı olarak kontrol edebilirsiniz.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={refreshQueue}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
                title="Kuyruğu Yenile"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                <span>Yenile</span>
              </button>

              <button
                onClick={handleGenerateCode}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
                <span>Yeni Destek Kodu Üret</span>
              </button>
            </div>
          </div>

          {/* 3 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bekleyen Talepler</span>
                <span className="text-3xl font-extrabold text-slate-900 mt-1">
                  {queueItems.length}
                </span>
                <span className="text-xs text-slate-400 mt-0.5">Onay bekleyen müşteriler</span>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${queueItems.length > 0 ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-400"}`}>
                <span className="material-symbols-outlined text-[26px]">hourglass_top</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Aktif Ekran Bağlantısı</span>
                <span className="text-3xl font-extrabold text-slate-900 mt-1">
                  {activeItems.length}
                </span>
                <span className="text-xs text-slate-400 mt-0.5">Şu an kontrol edilen cihaz</span>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${activeItems.length > 0 ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"}`}>
                <span className="material-symbols-outlined text-[26px]">desktop_windows</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ortalama Bekleme</span>
                <span className="text-3xl font-extrabold text-slate-900 mt-1">
                  {queueItems.length > 0
                    ? formatWait(Math.round(queueItems.reduce((sum, i) => sum + i.waitSeconds, 0) / queueItems.length))
                    : "0 sn"}
                </span>
                <span className="text-xs text-slate-400 mt-0.5">Müşteri ortalama yanıt süresi</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[26px]">timer</span>
              </div>
            </div>
          </div>

          {/* ACTIVE REMOTE SESSIONS WORKSPACE */}
          {activeItems.length > 0 && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                  <div className="flex flex-col">
                    <h2 className="text-lg font-bold text-slate-900">Canlı Uzak Masaüstü Ekranı</h2>
                    <span className="text-xs text-slate-500">Müşteri bilgisayarı gerçek zamanlı görüntüleniyor</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Mode Selector */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => setPermMode("full")}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        permMode === "full" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Tam Kontrol
                    </button>
                    <button
                      onClick={() => setPermMode("view")}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        permMode === "view" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Salt Okunur
                    </button>
                  </div>

                  {activeSelectedSession && (
                    <button
                      onClick={() => terminateActiveSession(activeSelectedSession.id, activeSelectedSession.supportCode)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">call_end</span>
                      <span>Oturumu Sonlandır</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Multiple Session Tabs */}
              {activeItems.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {activeItems.map((item) => {
                    const isActive = selectedId === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedId(item.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                          isActive
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">desktop_windows</span>
                        <span>{item.deviceHostname || `Kod: ${item.supportCode}`}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            terminateActiveSession(item.id, item.supportCode);
                          }}
                          className="hover:opacity-70 ml-1"
                          title="Kapat"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Viewers */}
              {activeItems.map((item) => (
                <div key={item.id} className={selectedId === item.id ? "block" : "hidden"}>
                  <RemoteDesktopViewer
                    sessionId={item.id}
                    supportCode={item.supportCode}
                    deviceHostname={item.deviceHostname}
                  />
                </div>
              ))}
            </div>
          )}

          {/* WAITING QUEUE SECTION */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-blue-600 text-[22px]">inbox</span>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">Bekleyen Destek İstekleri</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-extrabold">
                    {queueItems.length} Talep
                  </span>
                </div>
              </div>
            </div>

            {queueItems.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-3">
                  <span className="material-symbols-outlined text-[28px]">check_circle</span>
                </div>
                <h3 className="text-base font-bold text-slate-800">Şu Anda Bekleyen Destek Talebi Yok</h3>
                <p className="text-sm text-slate-500 max-w-md mt-1 mb-4">
                  Müşteri bilgisayarına bağlanmak için yukarıdaki &quot;Yeni Destek Kodu Üret&quot; butonuna basıp 6 haneli kodu müşteriye iletebilirsiniz.
                </p>
                <button
                  onClick={handleGenerateCode}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-bold transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>Yeni Destek Kodu Oluştur</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-4">Destek Kodu</th>
                      <th className="py-3 px-4">Cihaz / Bilgisayar</th>
                      <th className="py-3 px-4">IP Adresi</th>
                      <th className="py-3 px-4">Bekleme Süresi</th>
                      <th className="py-3 px-4 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {queueItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-4 font-mono font-bold text-blue-600 text-base">
                          {item.supportCode}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2 font-medium text-slate-800">
                            <span className="material-symbols-outlined text-slate-400 text-[18px]">laptop</span>
                            <span>{item.deviceHostname || "Bilinmeyen Cihaz"}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-mono text-xs text-slate-500">
                          {item.deviceIp || "—"}
                        </td>
                        <td className="py-4 px-4 text-xs font-semibold text-amber-600">
                          {formatWait(item.waitSeconds)}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => rejectSession(item.id, item.supportCode)}
                              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
                            >
                              Reddet
                            </button>
                            <button
                              onClick={() => acceptSession(item.id, item.deviceHostname)}
                              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px]">screen_share</span>
                              <span>Bağlan (Kabul Et)</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* NEW CODE GENERATION MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[32px]">dialpad</span>
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Yeni Destek Kodu Hazır</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5 max-w-xs">
              Bu 6 haneli kodu müşterinize bildirin. Müşteri kodu girdiğinde destek oturumu başlayacaktır.
            </p>

            {/* Big Monospace Code Display */}
            <div
              onClick={copyModalPin}
              className="w-full py-4 px-6 rounded-2xl bg-slate-50 border-2 border-dashed border-blue-200 hover:border-blue-400 cursor-pointer flex items-center justify-center gap-3 transition-colors mb-5 group"
              title="Kopyalamak için tıklayın"
            >
              <span className="font-mono text-3xl font-extrabold tracking-widest text-slate-900 group-hover:text-blue-600 transition-colors">
                {modalPin}
              </span>
              <span className="material-symbols-outlined text-slate-400 group-hover:text-blue-600 text-[20px] transition-colors">
                content_copy
              </span>
            </div>

            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors"
              >
                Kapat
              </button>
              <button
                onClick={copyModalPin}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-xs transition-colors"
              >
                {modalCopyText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.visible && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold animate-in slide-in-from-bottom-2 ${
            toast.isError
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-slate-900 border-slate-800 text-white"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">{toast.icon}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
