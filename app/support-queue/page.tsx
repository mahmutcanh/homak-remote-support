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
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => v.toString().padStart(2, "0")).join(":");
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
  const [copyBtnText, setCopyBtnText] = useState("Kopyala");
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
      showToast("Kuyruk yüklenemedi. Bağlantıyı kontrol edin.", "error", true);
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
            showToast(`[${item.supportCode}] Oturumuna davet edildiniz. Bağlantı kuruluyor...`, "person_add");
          })
          .catch(() => {
            showToast("Davet edilen oturum bulunamadı veya sonlandırılmış.", "error", true);
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
    queueItems.find((item) => item.id === selectedId) ??
    activeItems.find((item) => item.id === selectedId) ??
    null;

  const acceptSession = async (id: string, hostname: string | null) => {
    try {
      const updated = await apiAcceptSession(id, { technicianName: "Mahmut Homak" });
      showToast(
        `Oturum kabul edildi! ${hostname ?? "Cihaz"} bağlantısı aktifleştirildi.`,
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
      showToast(`[${code}] Destek talebi reddedildi ve kuyruktan kaldırıldı.`, "cancel", true);
      refreshQueue();
    } catch {
      showToast("Talep reddedilemedi.", "cancel", true);
    }
  };

  const acceptSelectedSession = () => {
    if (!selectedItem) return;
    acceptSession(selectedItem.id, selectedItem.deviceHostname);
  };

  const rejectSelectedSession = () => {
    if (!selectedItem) return;
    rejectSession(selectedItem.id, selectedItem.supportCode);
  };

  const terminateSelectedSession = async () => {
    if (!selectedItem) return;
    try {
      await apiTerminateSession(selectedItem.id, { reason: "Teknisyen tarafından sonlandırıldı" });
      showToast(`[${selectedItem.supportCode}] Oturum sonlandırıldı.`, "check_circle");
      setActiveItems((prev) => prev.filter((item) => item.id !== selectedItem.id));
      setSelectedId(null);
      refreshQueue();
    } catch {
      showToast("Oturum sonlandırılamadı.", "cancel", true);
    }
  };

  const copyModalPin = () => {
    navigator.clipboard?.writeText(modalPin.replace(/\s+/g, "")).catch(() => {});
    setModalCopyText("Kopyalandı!");
    setTimeout(() => setModalCopyText("Kodu Kopyala"), 2000);
    showToast(`Yeni destek kodu ${modalPin} kopyalandı.`);
  };

  const copyGeneratedPin = () => {
    if (!modalPin) return;
    navigator.clipboard?.writeText(modalPin.replace(/\s+/g, "")).catch(() => {});
    setCopyBtnText("Kopyalandı!");
    setTimeout(() => setCopyBtnText("Kopyala"), 2000);
    showToast(`PIN ${modalPin} panoya kopyalandı.`);
  };

  const handleGenerateCode = async () => {
    setLoading(true);
    try {
      const res = await apiGenerateCode({ technicianName: "Mahmut Homak", department: "IT Destek" });
      const raw = res.supportCode;
      setModalPin(`${raw.slice(0, 3)} ${raw.slice(3)}`);
      setModalOpen(true);
    } catch {
      showToast("Kod üretilemedi. Lütfen tekrar deneyin.", "error", true);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    refreshQueue();
    showToast(`Kuyruk yenilendi. ${queueItems.length} aktif istek hazır.`);
  };

  return (
    <>
      <TechnicianSidebar />
      <div className="lg:pl-64">
        <TechnicianHeader />
        <main className="relative pt-16 bg-surface w-full px-gutter-desktop min-h-screen">
          <div className="flex flex-col w-full">
            {/* Active Incident / Sticky Alert Ribbon */}
            <div className="mb-space-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-space-sm p-space-md rounded-xl bg-surface-container-low shadow-sm">
              <div className="flex items-center gap-space-md">
                <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-primary-container text-on-primary shadow-sm">
                  <span className="material-symbols-outlined text-[22px]">badge</span>
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-tertiary shadow-sm"></span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-space-xs">
                    <span className="font-headline-sm text-headline-sm text-on-surface">Mahmut Homak</span>
                    <span className="px-space-xs py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-label-mono-sm text-label-mono-sm">
                      IT Support &amp; IT Manager
                    </span>
                  </div>
                  <div className="flex items-center gap-space-sm text-outline font-body-sm text-body-sm">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                      <span className="font-label-mono-sm text-label-mono-sm text-tertiary font-semibold">SOK-SESSION ACTIVE</span>
                    </span>
                    <span>•</span>
                    <span className="font-label-mono-sm text-label-mono-sm">MFA-ED25519 VERIFIED</span>
                    <span>•</span>
                    <span>
                      RBAC: <code className="font-label-mono-sm text-label-mono-sm text-primary font-semibold">homak.ops.tier3.all</code>
                    </span>
                  </div>
                </div>
              </div>
              {/* Live Telemetry Badge */}
              <div className="flex items-center gap-space-sm bg-surface-container-lowest px-space-md py-space-xs rounded-lg shadow-sm">
                <div className="flex flex-col items-end">
                  <span className="font-label-mono-sm text-label-mono-sm text-outline">RELAY GATEWAY</span>
                  <span className="font-label-mono-sm text-label-mono-sm text-tertiary font-semibold">IST-CORE-02</span>
                </div>
                <div className="h-6 w-px bg-surface-container-high"></div>
                <div className="flex items-center gap-1 text-tertiary">
                  <span className="material-symbols-outlined text-[18px]">lock</span>
                  <span className="font-label-mono-sm text-label-mono-sm font-semibold">TLS 1.3 GCM</span>
                </div>
              </div>
            </div>
            {/* Primary Header & Global Queue Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md mb-space-lg">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-space-sm">
                  <span className="px-space-xs py-0.5 rounded bg-error-container text-on-error-container font-label-mono-sm text-label-mono-sm font-semibold tracking-wider">
                    LIVE DISPATCH
                  </span>
                  <span className="font-label-mono-sm text-label-mono-sm text-outline">SEC-LEVEL-3 RESTRICTED</span>
                </div>
                <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">
                  Support Queue{" "}
                  <span className="font-headline-md text-headline-md text-outline font-normal">(Geçici Destek Talepleri)</span>
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
                  Son kullanıcı anlık erişim talepleri ve dinamik kriptografik eşleşme havuzu. Tüm oturumlar kurumsal audit
                  loglarına ve video capture protokolüne tabidir.
                </p>
              </div>
              {/* Quick Action Controls */}
              <div className="flex flex-wrap items-center gap-space-sm">
                <button
                  className="flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container-high transition-colors shadow-sm font-action-btn text-action-btn"
                  onClick={handleRefresh}
                >
                  <span className="material-symbols-outlined text-[18px]">sync</span>
                  <span>Kuyruğu Yenile</span>
                </button>
                <button
                  className="flex items-center gap-space-xs px-space-lg py-space-sm rounded-lg bg-primary-container text-on-primary hover:bg-primary transition-all shadow-md font-action-btn text-action-btn group disabled:opacity-60"
                  onClick={handleGenerateCode}
                  disabled={loading}
                >
                  <span className="material-symbols-outlined text-[20px] transition-transform group-hover:rotate-45">
                    add_moderator
                  </span>
                  <span>Yeni Destek Kodu Üret (Generate Code)</span>
                </button>
              </div>
            </div>
            {/* Realtime KPI Metric Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md mb-space-xl">
              <div className="flex flex-col p-space-lg rounded-xl bg-surface-container-lowest shadow-sm relative overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-error"></div>
                <div className="flex items-center justify-between mb-space-sm">
                  <span className="font-body-sm text-body-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                    Bekleyen Talepler
                  </span>
                  <span className="material-symbols-outlined text-error text-[22px]">pending_actions</span>
                </div>
                <div className="flex items-baseline gap-space-sm">
                  <span className="font-headline-xl text-headline-xl text-on-surface font-bold">{queueItems.length}</span>
                  <span className="px-space-xs py-0.5 rounded bg-error-container text-on-error-container font-label-mono-sm text-label-mono-sm font-semibold">
                    Kritik Kuyruk
                  </span>
                </div>
                <div className="mt-space-sm flex items-center gap-space-xs text-outline font-body-sm text-body-sm">
                  <span className="material-symbols-outlined text-[16px] text-error">trending_up</span>
                  <span>Gerçek zamanlı WebSocket akışı</span>
                </div>
              </div>
              <div className="flex flex-col p-space-lg rounded-xl bg-surface-container-lowest shadow-sm relative overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-primary-container"></div>
                <div className="flex items-center justify-between mb-space-sm">
                  <span className="font-body-sm text-body-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                    Seçili PIN
                  </span>
                  <span className="material-symbols-outlined text-primary-container text-[22px]">mimo</span>
                </div>
                <div className="flex items-baseline gap-space-sm">
                  <span className="font-headline-xl text-headline-xl text-on-surface font-bold">
                    {selectedItem?.supportCode ?? "—"}
                  </span>
                </div>
                <div className="mt-space-sm flex items-center gap-space-xs text-outline font-body-sm text-body-sm">
                  <span className="material-symbols-outlined text-[16px] text-tertiary">check_circle</span>
                  <span>{selectedItem?.status ?? "Kuyrukta oturum yok"}</span>
                </div>
              </div>
              <div className="flex flex-col p-space-lg rounded-xl bg-surface-container-lowest shadow-sm relative overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-tertiary"></div>
                <div className="flex items-center justify-between mb-space-sm">
                  <span className="font-body-sm text-body-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                    Ortalama Bekleme
                  </span>
                  <span className="material-symbols-outlined text-tertiary text-[22px]">timer</span>
                </div>
                <div className="flex items-baseline gap-space-sm">
                  <span className="font-headline-xl text-headline-xl text-on-surface font-bold">
                    {queueItems.length > 0
                      ? Math.round(queueItems.reduce((sum, i) => sum + i.waitSeconds, 0) / queueItems.length)
                      : 0}{" "}
                    <span className="text-headline-md font-normal text-on-surface-variant">sn</span>
                  </span>
                  <span className="px-space-xs py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-mono-sm text-label-mono-sm font-semibold">
                    SLA: &lt;120 sn
                  </span>
                </div>
              </div>
              <div className="flex flex-col p-space-lg rounded-xl bg-surface-container-lowest shadow-sm relative overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-secondary-container"></div>
                <div className="flex items-center justify-between mb-space-sm">
                  <span className="font-body-sm text-body-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                    Bağlantı Durumu
                  </span>
                  <span className="material-symbols-outlined text-secondary-container text-[22px]">task_alt</span>
                </div>
                <div className="flex items-baseline gap-space-sm">
                  <span className="font-headline-md text-headline-md text-on-surface font-bold">Canlı API</span>
                </div>
                <div className="mt-space-sm flex items-center gap-space-xs text-outline font-body-sm text-body-sm">
                  <span className="material-symbols-outlined text-[16px]">verified_user</span>
                  <span>support-api.homaklab.com</span>
                </div>
              </div>
            </div>
            {/* Main Interaction Section: Queue Table + Realtime Inspector Split Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start pb-space-xl">
              {/* Table Container (8 Cols on XL) */}
              <div className="xl:col-span-8 flex flex-col gap-space-md">
                {/* Table Filter Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-space-sm p-space-md rounded-xl bg-surface-container-lowest shadow-sm">
                  <div className="flex items-center gap-space-sm flex-1">
                    <span className="material-symbols-outlined text-outline text-[20px]">filter_list</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface">Bekleyen Oturum Talepleri</span>
                    <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-mono-sm text-label-mono-sm font-bold">
                      {queueItems.length} Bekliyor
                    </span>
                  </div>
                </div>
                {/* Data Table Card */}
                <div className="overflow-x-auto rounded-xl bg-surface-container-lowest shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low text-outline font-label-mono-sm text-label-mono-sm uppercase tracking-wider">
                        <th className="py-space-md px-space-md font-semibold">Destek Kodu</th>
                        <th className="py-space-md px-space-md font-semibold">Cihaz / Hostname</th>
                        <th className="py-space-md px-space-md font-semibold">IP Adresi</th>
                        <th className="py-space-md px-space-md font-semibold">Bekleme</th>
                        <th className="py-space-md px-space-md font-semibold">İstemci Versiyon</th>
                        <th className="py-space-md px-space-md font-semibold">Durum</th>
                        <th className="py-space-md px-space-md font-semibold text-right">Erişim Onayı</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-0 text-on-surface font-body-sm text-body-sm">
                      {queueItems.length === 0 && (
                        <tr>
                          <td className="py-space-lg px-space-md text-center text-on-surface-variant" colSpan={7}>
                            Şu anda bekleyen destek talebi yok.
                          </td>
                        </tr>
                      )}
                      {queueItems.map((item) => {
                        const isSelected = selectedId === item.id;
                        const urgent = item.waitSeconds > 90 && item.status === "WAITING_TECHNICIAN";
                        const isWaiting = item.status === "WAITING_TECHNICIAN";
                        const isEnded = item.status === "ENDED" || item.status === "EXPIRED" || item.status === "REJECTED";

                        return (
                          <tr
                            key={item.id}
                            className={`queue-row cursor-pointer transition-colors ${
                              isSelected ? "bg-surface-container/60" : "hover:bg-surface-container/50"
                            } ${isEnded ? "opacity-65" : ""}`}
                            onClick={() => setSelectedId(item.id)}
                          >
                            <td className="py-space-md px-space-md">
                              <div className="flex items-center gap-space-xs">
                                <span className={`w-2 h-2 rounded-full ${isWaiting ? (urgent ? "bg-error animate-ping" : "bg-tertiary") : "bg-outline"}`}></span>
                                <span className="font-label-mono-lg text-label-mono-lg font-bold text-primary tracking-widest bg-primary-fixed/40 px-2 py-0.5 rounded">
                                  {item.supportCode}
                                </span>
                              </div>
                            </td>
                            <td className="py-space-md px-space-md">
                              <div className="flex flex-col">
                                <span className="font-semibold text-on-surface">{item.deviceHostname ?? "Bilinmiyor"}</span>
                                <span className="font-label-mono-sm text-label-mono-sm text-outline">{item.department ?? "-"}</span>
                              </div>
                            </td>
                            <td className="py-space-md px-space-md font-label-mono-sm text-label-mono-sm">
                              <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface">
                                {item.deviceIp ?? "-"}
                              </span>
                            </td>
                            <td className="py-space-md px-space-md">
                              <div
                                className={`flex items-center gap-1 font-label-mono-sm text-label-mono-sm font-semibold ${
                                  urgent ? "text-error" : "text-on-surface-variant"
                                }`}
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  {urgent ? "warning" : "schedule"}
                                </span>
                                <span>{isWaiting ? formatWait(item.waitSeconds) : "-"}</span>
                              </div>
                            </td>
                            <td className="py-space-md px-space-md">
                              <div className="flex items-center gap-1 font-label-mono-sm text-label-mono-sm">
                                <span className="material-symbols-outlined text-[16px] text-primary">terminal</span>
                                <span>{item.clientVersion ?? "-"}</span>
                              </div>
                            </td>
                            <td className="py-space-md px-space-md">
                              <span
                                className={`inline-flex items-center gap-1 px-space-xs py-0.5 rounded font-label-mono-sm text-label-mono-sm font-semibold ${
                                  isWaiting
                                    ? "bg-error-container text-on-error-container"
                                    : "bg-surface-container-high text-on-surface-variant"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isWaiting ? "bg-error" : "bg-outline"
                                  }`}
                                ></span>
                                {item.status}
                              </span>
                            </td>
                            <td className="py-space-md px-space-md text-right">
                              {isWaiting ? (
                                <div className="flex items-center justify-end gap-space-xs">
                                  <button
                                    className="flex items-center gap-1 px-space-sm py-1.5 rounded-lg bg-tertiary-container hover:bg-tertiary text-on-tertiary font-action-btn text-action-btn shadow-sm transition-all"
                                    title="support.accept yetkisi ile oturumu devral"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      acceptSession(item.id, item.deviceHostname);
                                    }}
                                  >
                                    <span className="material-symbols-outlined text-[16px]">login</span>
                                    <span>Kabul Et</span>
                                  </button>
                                  <button
                                    className="p-1.5 rounded-lg bg-surface-container-high hover:bg-error-container hover:text-on-error-container text-outline transition-colors"
                                    title="Talebi reddet / iptal et"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      rejectSession(item.id, item.supportCode);
                                    }}
                                  >
                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="font-label-mono-sm text-label-mono-sm text-outline font-semibold">
                                  Sonlandı
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/* RBAC Security Clearance Banner below queue */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-sm p-space-md rounded-xl bg-surface-container-low">
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-primary text-[20px]">admin_panel_settings</span>
                    <div className="flex flex-col">
                      <span className="font-label-mono-sm text-label-mono-sm font-semibold text-on-surface">
                        RBAC AUTHORITY MATRIX ENFORCED
                      </span>
                      <span className="font-body-sm text-body-sm text-outline">
                        Oturum kabul yetkisi:{" "}
                        <code className="font-label-mono-sm text-label-mono-sm text-primary">support.accept</code> aktif ve
                        Mahmut Homak adına loglanmaktadır.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                    <span className="font-label-mono-sm text-label-mono-sm text-tertiary font-semibold">
                      SOVEREIGN SESSION AUDIT ACTIVE
                    </span>
                  </div>
                </div>
              </div>
              {/* Inspector / Request Preview Panel (4 Cols on XL) */}
              <div className="xl:col-span-4 flex flex-col gap-space-md">
                <div className="flex flex-col p-space-lg rounded-xl bg-surface-container-lowest shadow-sm">
                  <div className="flex items-center justify-between pb-space-sm mb-space-sm border-b-0">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-primary text-[20px]">preview</span>
                      <span className="font-headline-sm text-headline-sm text-on-surface">Talep Detay İncelemesi</span>
                    </div>
                    <span className="px-space-xs py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-mono-sm text-label-mono-sm font-semibold">
                      WEBSOCKET CANLI
                    </span>
                  </div>
                  {/* Selected Code Display Banner */}
                  <div className="p-space-md rounded-xl bg-primary-fixed/30 flex flex-col items-center justify-center text-center gap-1 mb-space-md">
                    <span className="font-label-mono-sm text-label-mono-sm text-primary uppercase font-bold tracking-wider">
                      Seçili PIN Kodu
                    </span>
                    <span className="font-headline-xl text-headline-xl text-primary font-extrabold tracking-widest font-label-mono-lg">
                      {selectedItem?.supportCode ?? "------"}
                    </span>
                    <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                      {selectedItem?.deviceHostname ?? "Kuyrukta seçili oturum yok"}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{selectedItem?.department ?? ""}</span>
                  </div>
                  {/* Verification Checklist */}
                  <div className="flex flex-col gap-space-sm mb-space-md">
                    <span className="font-label-mono-sm text-label-mono-sm text-outline font-semibold uppercase">
                      Oturum Bilgisi
                    </span>
                    <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low">
                      <div className="flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-tertiary text-[18px]">verified</span>
                        <span className="font-body-sm text-body-sm text-on-surface">Durum</span>
                      </div>
                      <span className="font-label-mono-sm text-label-mono-sm text-tertiary font-bold">
                        {selectedItem?.status ?? "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low">
                      <div className="flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-tertiary text-[18px]">cloud_done</span>
                        <span className="font-body-sm text-body-sm text-on-surface">IP Adresi</span>
                      </div>
                      <span className="font-label-mono-sm text-label-mono-sm text-on-surface font-semibold">
                        {selectedItem?.deviceIp ?? "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low">
                      <div className="flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-outline text-[18px]">schedule</span>
                        <span className="font-body-sm text-body-sm text-on-surface">Oluşturulma</span>
                      </div>
                      <span className="font-label-mono-sm text-label-mono-sm text-outline">
                        {selectedItem ? new Date(selectedItem.createdAt).toLocaleTimeString("tr-TR") : "-"}
                      </span>
                    </div>
                  </div>
                  {/* Homak Native Remote Desktop Panel with Multi-Session Tab Bar */}
                  <div className="flex flex-col gap-space-xs mb-space-md">
                    <div className="flex items-center justify-between">
                      <span className="font-label-mono-sm text-label-mono-sm text-outline font-semibold uppercase">
                        Homak Native Uzak Masaüstü {activeItems.length > 0 ? `(${activeItems.length} Aktif Oturum)` : ""}
                      </span>
                    </div>

                    {/* Multi-Session Tab Bar */}
                    {activeItems.length > 0 && (
                      <div className="flex items-center gap-1 overflow-x-auto p-1 bg-surface-container-low rounded-lg mb-1">
                        {activeItems.map((item) => {
                          const isActive = selectedId === item.id;
                          return (
                            <div
                              key={item.id}
                              onClick={() => setSelectedId(item.id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-label-mono-sm text-label-mono-sm cursor-pointer transition-all ${
                                isActive
                                  ? "bg-primary text-on-primary font-bold shadow-xs"
                                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                              }`}
                            >
                              <span className="material-symbols-outlined text-[14px]">desktop_windows</span>
                              <span className="truncate max-w-[100px]">{item.deviceHostname || item.supportCode}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveItems((prev) => prev.filter((x) => x.id !== item.id));
                                  if (selectedId === item.id) {
                                    const remaining = activeItems.filter((x) => x.id !== item.id);
                                    setSelectedId(remaining[0]?.id ?? null);
                                  }
                                }}
                                title="Sekmeyi Kapat"
                                className="hover:opacity-80 p-0.5"
                              >
                                <span className="material-symbols-outlined text-[12px]">close</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Render all active sessions in background, show only selected */}
                    {activeItems.map((item) => (
                      <div key={item.id} className={selectedId === item.id ? "block" : "hidden"}>
                        <RemoteDesktopViewer
                          sessionId={item.id}
                          supportCode={item.supportCode}
                          deviceHostname={item.deviceHostname}
                        />
                      </div>
                    ))}

                    {/* Empty State when no active session selected */}
                    {activeItems.length === 0 && (
                      <div className="flex items-center gap-space-sm p-space-md rounded-lg bg-surface-container-low text-on-surface-variant">
                        <span className="material-symbols-outlined text-[18px] text-outline">desktop_access_disabled</span>
                        <span className="font-body-sm text-body-sm font-medium">
                          Lütfen uzak masaüstü bağlantısı başlatmak için soldaki listeden bir oturum seçin ve &apos;Kabul Et&apos; butonuna basın.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Session Elevation Mode Selection */}
                  <div className="flex flex-col gap-space-xs mb-space-md">
                    <label className="font-label-mono-sm text-label-mono-sm text-outline font-semibold uppercase">
                      Erişim Ayrıcalık Seviyesi
                    </label>
                    <div className="grid grid-cols-2 gap-space-xs">
                      <button
                        className={`flex flex-col items-center justify-center p-space-sm rounded-lg font-action-btn text-action-btn transition-all ${
                          permMode === "full"
                            ? "bg-primary-container text-on-primary shadow-sm"
                            : "bg-surface-container-low hover:bg-surface-container-high text-on-surface"
                        }`}
                        onClick={() => setPermMode("full")}
                      >
                        <span className="material-symbols-outlined text-[18px]">mouse</span>
                        <span className="font-body-sm text-body-sm font-semibold">Tam Kontrol</span>
                      </button>
                      <button
                        className={`flex flex-col items-center justify-center p-space-sm rounded-lg font-action-btn text-action-btn transition-all ${
                          permMode === "view"
                            ? "bg-primary-container text-on-primary shadow-sm"
                            : "bg-surface-container-low hover:bg-surface-container-high text-on-surface"
                        }`}
                        onClick={() => setPermMode("view")}
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                        <span className="font-body-sm text-body-sm">Salt Okunur</span>
                      </button>
                    </div>
                  </div>
                  {/* Big Acceptance Trigger CTA */}
                  <div className="flex flex-col gap-space-xs">
                    {selectedItem?.status === "ACTIVE" ? (
                      <>
                        <div className="w-full flex items-center justify-center gap-space-xs py-space-sm rounded-xl bg-tertiary-fixed/30 text-on-tertiary-fixed-variant font-action-btn text-action-btn font-bold">
                          <span className="material-symbols-outlined text-[20px]">check_circle</span>
                          <span>Oturum Aktif</span>
                        </div>
                        <button
                          className="w-full flex items-center justify-center gap-space-xs py-space-sm rounded-xl bg-surface-container-low hover:bg-error-container hover:text-on-error-container text-outline font-action-btn text-action-btn transition-colors"
                          onClick={terminateSelectedSession}
                        >
                          <span className="material-symbols-outlined text-[18px]">stop_circle</span>
                          <span>Oturumu Sonlandır</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="w-full flex items-center justify-center gap-space-xs py-space-md rounded-xl bg-tertiary-container hover:bg-tertiary text-on-tertiary font-headline-sm text-headline-sm font-bold shadow-md transition-all disabled:opacity-50"
                          onClick={acceptSelectedSession}
                          disabled={!selectedItem}
                        >
                          <span className="material-symbols-outlined text-[24px]">cast_connected</span>
                          <span>Oturumu Başlat / Kabul Et</span>
                        </button>
                        <button
                          className="w-full flex items-center justify-center gap-space-xs py-space-sm rounded-xl bg-surface-container-low hover:bg-error-container hover:text-on-error-container text-outline font-action-btn text-action-btn transition-colors disabled:opacity-50"
                          onClick={rejectSelectedSession}
                          disabled={!selectedItem}
                        >
                          <span className="material-symbols-outlined text-[18px]">cancel</span>
                          <span>Talebi Kuyruktan Kaldır (Reject)</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Interactive Modal for Code Generation */}
          {modalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-md p-gutter">
              <div className="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-xl p-space-xl flex flex-col gap-space-md transform transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-xs text-primary">
                    <span className="material-symbols-outlined text-[24px]">vpn_key</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface font-bold">Yeni Destek Kodu Üretildi</span>
                  </div>
                  <button
                    className="p-1 rounded-lg text-outline hover:bg-surface-container transition-colors"
                    onClick={() => setModalOpen(false)}
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>
                <div className="p-space-lg rounded-xl bg-primary-fixed/30 flex flex-col items-center justify-center gap-1">
                  <span className="font-label-mono-sm text-label-mono-sm text-primary uppercase font-bold">
                    15 Dakika Geçerli Destek Kodu
                  </span>
                  <span className="font-headline-xl text-headline-xl text-primary font-extrabold tracking-widest font-label-mono-lg my-space-xs">
                    {modalPin}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant text-center">
                    İstemciye girildiğinde otomatik onay talebi panoya düşecektir.
                  </span>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between text-outline font-body-sm text-body-sm">
                    <span>Oluşturan:</span>
                    <span className="text-on-surface font-semibold">Mahmut Homak</span>
                  </div>
                  <div className="flex items-center justify-between text-outline font-body-sm text-body-sm">
                    <span>Kaynak:</span>
                    <span className="text-on-surface font-label-mono-sm text-label-mono-sm">homak-support-api</span>
                  </div>
                </div>
                <div className="flex items-center gap-space-sm pt-space-sm">
                  <button
                    className="flex-1 flex items-center justify-center gap-1 py-space-sm rounded-lg bg-primary-container text-on-primary font-action-btn text-action-btn shadow-sm hover:bg-primary transition-all"
                    onClick={copyModalPin}
                  >
                    <span className="material-symbols-outlined text-[18px]">content_copy</span>
                    <span>{modalCopyText}</span>
                  </button>
                  <button
                    className="px-space-lg py-space-sm rounded-lg bg-surface-container text-on-surface font-action-btn text-action-btn hover:bg-surface-container-high transition-colors"
                    onClick={() => setModalOpen(false)}
                  >
                    Kapat
                  </button>
                </div>
                <button
                  className="flex items-center justify-center gap-1 py-space-xs text-outline hover:text-primary transition-colors font-label-mono-sm text-label-mono-sm"
                  onClick={copyGeneratedPin}
                >
                  <span className="material-symbols-outlined text-[14px]">content_copy</span>
                  <span>{copyBtnText}</span>
                </button>
              </div>
            </div>
          )}
          {/* Notification Toast Container */}
          <div
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-space-sm px-space-md py-space-sm rounded-xl bg-inverse-surface text-inverse-on-surface shadow-xl transform transition-all duration-300 ${
              toast.visible ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0"
            }`}
          >
            <span className={`material-symbols-outlined text-[20px] ${toast.isError ? "text-error-container" : "text-tertiary-fixed"}`}>
              {toast.icon}
            </span>
            <span className="font-body-sm text-body-sm font-semibold">{toast.message || "İşlem başarıyla kaydedildi."}</span>
          </div>
        </main>
      </div>
    </>
  );
}
