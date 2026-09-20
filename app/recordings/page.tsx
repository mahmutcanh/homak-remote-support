"use client";

import { useCallback, useEffect, useState } from "react";
import TechnicianSidebar from "@/components/TechnicianSidebar";
import TechnicianHeader from "@/components/TechnicianHeader";
import {
  SessionRecording,
  RecordingStatus,
  getRecordings,
  getRecordingStreamUrl,
} from "@/lib/api";

const STATUS_STYLES: Record<RecordingStatus, string> = {
  RECORDING: "bg-tertiary-container text-on-tertiary-container",
  PROCESSING: "bg-surface-container-high text-on-surface",
  COMPLETED: "bg-primary-container text-on-primary-container",
  FAILED: "bg-error-container text-on-error-container",
};

const STATUS_LABELS: Record<RecordingStatus, string> = {
  RECORDING: "Kayıt Alınıyor",
  PROCESSING: "İşleniyor",
  COMPLETED: "Tamamlandı",
  FAILED: "Başarısız",
};

function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return "-";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}dk ${s}sn`;
}

function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return "-";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState<SessionRecording[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"ALL" | RecordingStatus>("ALL");
  const [playingSessionId, setPlayingSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRecordings({ limit: 100 });
      setRecordings(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kayıtlar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  const filtered = recordings.filter((r) => statusFilter === "ALL" || r.status === statusFilter);
  const playingRecording = recordings.find((r) => r.sessionId === playingSessionId) ?? null;

  return (
    <>
      <TechnicianSidebar />
      <div className="lg:pl-64">
        <TechnicianHeader />
        <main className="relative pt-16 bg-surface w-full px-gutter-desktop min-h-screen">
          <div className="flex flex-col w-full">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-space-lg gap-space-md">
              <div className="flex flex-col gap-space-xs">
                <nav className="flex items-center gap-space-xs text-on-surface-variant font-body-sm">
                  <span className="hover:text-primary cursor-pointer transition-colors">Homak Remote</span>
                  <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                  <span className="font-semibold text-primary">Oturum Kayıtları</span>
                </nav>
                <div className="flex items-center gap-space-sm mt-space-xs">
                  <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                    Teknisyen Oturum Kayıtları
                  </h1>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
                  Her onaylanmış destek oturumu, teknisyenin ekranı üzerinden yaptığı işlemleri sıkıştırılmış MP4
                  video olarak otomatik kaydeder. Denetim ve kalite kontrol amaçlı izlenebilir.
                </p>
              </div>
              <button
                onClick={refresh}
                className="flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-surface-container-highest text-on-surface hover:bg-surface-container-high transition-all shadow-sm self-start"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                <span className="font-action-btn text-action-btn">Yenile</span>
              </button>
            </div>

            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm mb-space-lg flex items-center gap-space-md flex-wrap">
              <span className="font-label-mono-sm text-label-mono-sm text-outline uppercase font-semibold">
                Durum Filtresi:
              </span>
              {(["ALL", "RECORDING", "COMPLETED", "PROCESSING", "FAILED"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-space-sm py-1 rounded-full font-label-mono-sm text-label-mono-sm font-semibold transition-colors ${
                    statusFilter === s
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  {s === "ALL" ? "Tümü" : STATUS_LABELS[s]}
                </button>
              ))}
            </div>

            {error && (
              <div className="bg-error-container text-on-error-container p-space-md rounded-xl mb-space-md">
                {error}
              </div>
            )}

            <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden mb-space-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-body-sm text-body-sm">
                  <thead className="bg-surface-container text-on-surface-variant font-label-mono-sm text-label-mono-sm uppercase tracking-wider">
                    <tr>
                      <th className="px-space-md py-space-sm font-semibold">Başlangıç</th>
                      <th className="px-space-md py-space-sm font-semibold">Destek Kodu</th>
                      <th className="px-space-md py-space-sm font-semibold">Teknisyen</th>
                      <th className="px-space-md py-space-sm font-semibold">Cihaz</th>
                      <th className="px-space-md py-space-sm font-semibold">Süre</th>
                      <th className="px-space-md py-space-sm font-semibold">Boyut</th>
                      <th className="px-space-md py-space-sm font-semibold">Durum</th>
                      <th className="px-space-md py-space-sm font-semibold text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-0 text-on-surface">
                    {!loading && filtered.length === 0 && (
                      <tr>
                        <td className="px-space-md py-space-lg text-center text-on-surface-variant" colSpan={8}>
                          Henüz kayıt yok.
                        </td>
                      </tr>
                    )}
                    {filtered.map((rec) => (
                      <tr key={rec.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-space-md py-space-sm font-label-mono-sm text-label-mono-sm whitespace-nowrap text-on-surface font-medium">
                          {new Date(rec.startedAt).toLocaleString("tr-TR")}
                        </td>
                        <td className="px-space-md py-space-sm font-label-mono-sm text-label-mono-sm whitespace-nowrap">
                          {rec.supportCode ?? "-"}
                        </td>
                        <td className="px-space-md py-space-sm whitespace-nowrap">{rec.technicianName ?? "-"}</td>
                        <td className="px-space-md py-space-sm whitespace-nowrap">{rec.deviceHostname ?? "-"}</td>
                        <td className="px-space-md py-space-sm whitespace-nowrap">{formatDuration(rec.durationSec)}</td>
                        <td className="px-space-md py-space-sm whitespace-nowrap">{formatFileSize(rec.fileSizeByte)}</td>
                        <td className="px-space-md py-space-sm whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-space-sm py-0.5 rounded-full font-label-mono-sm text-label-mono-sm font-semibold ${STATUS_STYLES[rec.status]}`}
                          >
                            {STATUS_LABELS[rec.status]}
                          </span>
                        </td>
                        <td className="px-space-md py-space-sm text-right whitespace-nowrap">
                          {rec.status === "COMPLETED" ? (
                            <button
                              onClick={() => setPlayingSessionId(rec.sessionId)}
                              className="px-space-sm py-1 rounded bg-primary text-on-primary hover:bg-surface-tint font-label-mono-sm text-label-mono-sm flex items-center gap-space-xs ml-auto"
                            >
                              <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                              <span>İzle</span>
                            </button>
                          ) : (
                            <span className="text-on-surface-variant font-label-mono-sm text-label-mono-sm">
                              {rec.status === "FAILED" ? (rec.errorMessage ?? "Kullanılamıyor") : "Bekleniyor..."}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-space-md bg-surface-container-low flex items-center justify-between">
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {filtered.length} kayıt gösteriliyor (toplam {recordings.length})
                </span>
                <span className="font-label-mono-sm text-label-mono-sm text-outline">15 saniyede bir otomatik yenilenir</span>
              </div>
            </div>
          </div>
        </main>
      </div>

      {playingRecording && (
        <div
          className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-space-lg"
          onClick={() => setPlayingSessionId(null)}
        >
          <div
            className="bg-surface-container-lowest rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-space-md flex items-center justify-between bg-surface-container-low">
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-on-surface">
                  Kayıt: {playingRecording.supportCode} — {playingRecording.deviceHostname ?? "Bilinmeyen Cihaz"}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {new Date(playingRecording.startedAt).toLocaleString("tr-TR")} · {formatDuration(playingRecording.durationSec)}
                </span>
              </div>
              <button
                onClick={() => setPlayingSessionId(null)}
                className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <video
              key={playingRecording.sessionId}
              src={getRecordingStreamUrl(playingRecording.sessionId)}
              controls
              autoPlay
              className="w-full max-h-[70vh] bg-black"
            />
          </div>
        </div>
      )}
    </>
  );
}
