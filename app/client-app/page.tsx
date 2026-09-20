"use client";

import { useEffect, useRef, useState } from "react";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

const STAGE_TABS = [
  { num: "01", label: "Bekleme" },
  { num: "02", label: "Onay İsteği" },
  { num: "03", label: "Aktif Oturum" },
  { num: "04", label: "Temizleme" },
];

export default function ClientAppPage() {
  const [stage, setStage] = useState(1);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(522);
  const [shutdownCountdown, setShutdownCountdown] = useState(3);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const shutdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (stage === 3) {
      timerRef.current = setInterval(() => {
        setSecondsElapsed((s) => s + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stage]);

  useEffect(() => {
    if (stage === 4) {
      shutdownRef.current = setInterval(() => {
        setShutdownCountdown((c) => {
          if (c <= 1) {
            if (shutdownRef.current) clearInterval(shutdownRef.current);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } else if (shutdownRef.current) {
      clearInterval(shutdownRef.current);
      shutdownRef.current = null;
    }
    return () => {
      if (shutdownRef.current) clearInterval(shutdownRef.current);
    };
  }, [stage]);

  const switchStage = (num: number) => {
    setStage(num);
    setConfirmModalOpen(false);
    if (num === 4) {
      setShutdownCountdown(3);
    }
  };

  const confirmTerminate = () => {
    setConfirmModalOpen(false);
    switchStage(4);
  };

  const formatSessionTimer = () => {
    const mins = Math.floor(secondsElapsed / 60);
    const secs = secondsElapsed % 60;
    return `00:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const cleanupWidth = shutdownCountdown <= 0 ? 100 : 30 + (3 - shutdownCountdown) * 23;

  return (
    <>
      <PublicHeader />
      <main className="w-full pt-16 bg-surface">
        <div className="flex flex-col w-full">
          <section className="relative w-full overflow-hidden py-space-xl px-margin md:px-margin-desktop">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[720px] h-[520px] bg-gradient-to-tr from-primary-fixed-dim/40 via-secondary-fixed/30 to-tertiary-fixed/20 rounded-full blur-[110px] pointer-events-none -z-10"></div>
            <div className="absolute bottom-10 right-10 w-[380px] h-[380px] bg-secondary-container/20 rounded-full blur-[90px] pointer-events-none -z-10"></div>
            <div className="max-w-[1200px] mx-auto flex flex-col gap-space-xl">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
                <div className="flex flex-col gap-space-xs">
                  <div className="flex items-center gap-space-xs text-primary font-label-mono-sm text-label-mono-sm uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                    <span>Windows 11 Native Attended Runtime</span>
                    <span className="text-outline">/</span>
                    <span className="text-on-surface-variant font-medium">WinUI 3 &amp; WPF Host</span>
                  </div>
                  <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                    HomakSupport.exe Client Lifecycle
                  </h1>
                  <p className="font-body-md text-body-md text-on-surface-variant max-w-[620px]">
                    Kurumsal denetimli attended bağlantı modülü. Arka planda gizli erişim barındırmayan, tam kullanıcı onayı
                    gerektiren ve oturum bitiminde otonom sterilizasyon sağlayan yerel istemci simülatörü.
                  </p>
                </div>
                <div className="bg-surface-container-high/70 backdrop-blur-md p-space-xs rounded-xl flex items-center flex-wrap gap-space-xs shadow-sm">
                  {STAGE_TABS.map((tab, idx) => {
                    const num = idx + 1;
                    const active = stage === num;
                    return (
                      <button
                        key={tab.num}
                        className={`px-space-md py-space-xs rounded-lg font-action-btn text-action-btn transition-all duration-200 flex items-center gap-space-xs ${
                          active
                            ? "bg-primary text-on-primary shadow-sm"
                            : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                        }`}
                        onClick={() => switchStage(num)}
                      >
                        <span className={`font-label-mono-sm text-label-mono-sm ${active ? "opacity-80" : "opacity-70"}`}>
                          {tab.num}
                        </span>
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
                {/* LEFT: Windows 11 Native App Window */}
                <div className="lg:col-span-7 flex justify-center w-full">
                  <div className="w-full max-w-[530px] bg-surface-container-lowest/95 backdrop-blur-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300">
                    <div className="h-11 bg-surface-container-low/90 backdrop-blur-md px-space-md flex items-center justify-between select-none">
                      <div className="flex items-center gap-space-xs overflow-hidden pr-space-sm">
                        <div className="w-5 h-5 rounded bg-primary flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-on-primary text-[14px]">desktop_windows</span>
                        </div>
                        <span className="font-body-sm text-body-sm text-on-surface font-medium truncate">
                          Homak Remote Support - v1.0.0 (.NET 8 WPF)
                        </span>
                      </div>
                      <div className="flex items-center -mr-space-md h-full shrink-0">
                        <button className="h-full px-space-md hover:bg-surface-container-high transition-colors flex items-center justify-center text-on-surface" title="Küçült">
                          <span className="material-symbols-outlined text-[16px]">remove</span>
                        </button>
                        <button className="h-full px-space-md opacity-40 cursor-not-allowed flex items-center justify-center text-on-surface" disabled title="Ekranı Kapla (Pasif)">
                          <span className="material-symbols-outlined text-[15px]">crop_square</span>
                        </button>
                        <button className="h-full px-space-md hover:bg-error hover:text-on-error transition-colors flex items-center justify-center text-on-surface" title="Kapat">
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    </div>
                    <div className="relative p-space-lg flex flex-col min-h-[510px] justify-between">
                      {/* STAGE 1 */}
                      {stage === 1 && (
                        <div className="stage-view flex flex-col gap-space-lg">
                          <div className="flex items-center gap-space-md">
                            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
                              <span className="font-headline-sm text-headline-sm font-bold text-on-primary tracking-tight">HR</span>
                            </div>
                            <div className="flex flex-col">
                              <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-bold">
                                HOMAK REMOTE SUPPORT
                              </h2>
                              <div className="flex items-center gap-space-xs text-tertiary font-body-sm text-body-sm font-medium">
                                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                <span>Destek sunucusuna bağlandınız</span>
                              </div>
                            </div>
                          </div>
                          <div className="bg-surface-container-low rounded-xl p-space-lg flex flex-col items-center justify-center text-center gap-space-xs relative overflow-hidden shadow-inner">
                            <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary-fixed/40 rounded-full blur-xl pointer-events-none"></div>
                            <span className="font-label-mono-sm text-label-mono-sm uppercase text-outline tracking-wider font-semibold">
                              Destek Kodu (Session PIN)
                            </span>
                            <div className="flex items-center gap-space-md my-space-xs">
                              <div className="font-label-mono-lg text-headline-xl text-primary font-bold tracking-widest selection:bg-primary-fixed px-space-md py-space-xs bg-surface-container-lowest rounded-lg shadow-sm">
                                583 921
                              </div>
                              <button
                                className="p-space-sm rounded-lg bg-surface-container-highest hover:bg-primary-fixed text-on-surface transition-all flex items-center justify-center"
                                title="PIN Kopyala"
                                onClick={() => navigator.clipboard?.writeText("583921").catch(() => {})}
                              >
                                <span className="material-symbols-outlined text-[20px]">content_copy</span>
                              </button>
                            </div>
                            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-[280px]">
                              Bu tek kullanımlık 6 haneli PIN kodunu çağrı merkezindeki veya yetkili IT teknisyenine
                              iletiniz.
                            </p>
                          </div>
                          <div className="bg-surface-container rounded-lg p-space-sm flex items-center justify-between">
                            <div className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
                              <span className="material-symbols-outlined text-[18px]">laptop_windows</span>
                              <span className="font-medium">Cihaz Kimliği:</span>
                            </div>
                            <span className="font-label-mono-sm text-label-mono-sm text-on-surface font-semibold bg-surface-container-lowest px-space-sm py-0.5 rounded">
                              DESKTOP-MAHMUT
                            </span>
                          </div>
                          <div className="p-space-md rounded-xl bg-primary-fixed/30 flex items-center gap-space-md">
                            <div className="relative flex items-center justify-center shrink-0">
                              <span className="w-3 h-3 rounded-full bg-primary animate-ping absolute"></span>
                              <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                            </div>
                            <div className="flex flex-col">
                              <span className="font-body-md text-body-md font-medium text-on-surface">
                                Bir teknik destek personelinin bağlanması bekleniyor...
                              </span>
                              <span className="font-body-sm text-body-sm text-outline">
                                Gelen istekler için ekranınızda yetkilendirme penceresi belirecektir.
                              </span>
                            </div>
                          </div>
                          <div className="pt-space-md flex justify-end">
                            <button
                              className="w-full sm:w-auto px-space-lg py-space-sm rounded-lg font-action-btn text-action-btn bg-surface-container-highest hover:bg-error-container hover:text-on-error-container text-on-surface transition-colors flex items-center justify-center gap-space-xs"
                              onClick={() => switchStage(4)}
                            >
                              <span className="material-symbols-outlined text-[18px]">cancel</span>
                              <span>Desteği İptal Et</span>
                            </button>
                          </div>
                        </div>
                      )}
                      {/* STAGE 2 */}
                      {stage === 2 && (
                        <div className="stage-view flex flex-col gap-space-md">
                          <div className="bg-primary-container text-on-primary rounded-xl p-space-md flex items-center justify-between shadow-md">
                            <div className="flex items-center gap-space-sm">
                              <span className="material-symbols-outlined text-[24px]">vpn_lock</span>
                              <span className="font-headline-sm text-headline-sm font-bold">Gelen Bağlantı İsteği</span>
                            </div>
                            <span className="px-space-sm py-0.5 rounded-full bg-surface-container-lowest/20 font-label-mono-sm text-label-mono-sm">
                              60s içinde reddedilecek
                            </span>
                          </div>
                          <div className="bg-surface-container-low rounded-xl p-space-md flex items-start gap-space-md">
                            <div className="w-12 h-12 rounded-full bg-primary-fixed-variant text-on-primary flex items-center justify-center font-bold text-headline-sm shrink-0">
                              MH
                            </div>
                            <div className="flex flex-col">
                              <span className="font-body-sm text-body-sm text-outline uppercase tracking-wider font-semibold">
                                Kurumsal Yetkili Destek
                              </span>
                              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Mahmut Homak</h3>
                              <p className="font-body-md text-body-md text-on-surface-variant">
                                IT Support Division (ID: #HOM-9042) bilgisayarınıza uzaktan bağlanmak istiyor.
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-space-xs">
                            <span className="font-label-mono-sm text-label-mono-sm uppercase text-outline font-semibold tracking-wider">
                              Talep Edilen İzin Seviyeleri:
                            </span>
                            <div className="bg-surface-container rounded-xl p-space-md flex flex-col gap-space-sm">
                              <div className="flex items-center gap-space-sm text-on-surface font-body-md text-body-md font-medium">
                                <span className="material-symbols-outlined text-tertiary text-[20px]">visibility</span>
                                <span>Ekranınızı anlık görüntüleme</span>
                              </div>
                              <div className="flex items-center gap-space-sm text-on-surface font-body-md text-body-md font-medium">
                                <span className="material-symbols-outlined text-tertiary text-[20px]">mouse</span>
                                <span>Fare ve klavye etkileşimi kontrolü</span>
                              </div>
                              <div className="flex items-center gap-space-sm text-on-surface font-body-md text-body-md font-medium">
                                <span className="material-symbols-outlined text-tertiary text-[20px]">content_paste</span>
                                <span>Clipboard (Pano metin senkronizasyonu)</span>
                              </div>
                            </div>
                          </div>
                          <div className="p-space-sm rounded-lg bg-surface-container-high/60 flex items-start gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
                            <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">verified_user</span>
                            <span>
                              <strong>Attended Session Garantisi:</strong> Bu ekran kullanıcının açık onayı olmadan
                              kesinlikle açılamaz. Oturum anında istediğiniz saniye bağlantıyı tek tuşla kesebilirsiniz.
                            </span>
                          </div>
                          <div className="pt-space-sm grid grid-cols-2 gap-space-md">
                            <button
                              className="px-space-md py-space-md rounded-lg font-action-btn text-action-btn bg-error-container text-on-error-container hover:bg-error hover:text-on-error transition-all flex items-center justify-center gap-space-xs"
                              onClick={() => switchStage(1)}
                            >
                              <span className="material-symbols-outlined text-[18px]">block</span>
                              <span>Reddet</span>
                            </button>
                            <button
                              className="px-space-md py-space-md rounded-lg font-action-btn text-action-btn bg-primary text-on-primary hover:bg-surface-tint shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-space-xs font-bold"
                              onClick={() => switchStage(3)}
                            >
                              <span className="material-symbols-outlined text-[18px]">check</span>
                              <span>İzin Ver &amp; Başlat</span>
                            </button>
                          </div>
                        </div>
                      )}
                      {/* STAGE 3 */}
                      {stage === 3 && (
                        <div className="stage-view flex flex-col gap-space-md">
                          <div className="bg-tertiary text-on-tertiary rounded-xl p-space-md flex items-center justify-between shadow-md">
                            <div className="flex items-center gap-space-sm">
                              <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-on-tertiary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-surface-container-lowest"></span>
                              </span>
                              <span className="font-label-mono-lg text-label-mono-lg font-bold tracking-wider">
                                BAĞLI (ACTIVE SESSION)
                              </span>
                            </div>
                            <span className="font-label-mono-sm text-label-mono-sm bg-surface-container-lowest/20 px-space-sm py-0.5 rounded">
                              E2E TLS 1.3
                            </span>
                          </div>
                          <div className="bg-surface-container-low rounded-xl p-space-md flex items-center justify-between">
                            <div className="flex items-center gap-space-sm">
                              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary">
                                <span className="material-symbols-outlined text-[20px]">engineering</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="font-body-sm text-body-sm text-outline">Teknik Uzman</span>
                                <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                                  Mahmut Homak (IT Manager)
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-body-sm text-body-sm text-outline block">Başlangıç</span>
                              <span className="font-label-mono-sm text-label-mono-sm text-on-surface font-semibold">15:41:22</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-space-sm">
                            <div className="bg-surface-container rounded-lg p-space-sm flex flex-col">
                              <span className="font-label-mono-sm text-label-mono-sm text-outline uppercase">Oturum Süresi</span>
                              <span className="font-label-mono-lg text-headline-sm text-primary font-bold">
                                {formatSessionTimer()}
                              </span>
                            </div>
                            <div className="bg-surface-container rounded-lg p-space-sm flex flex-col">
                              <span className="font-label-mono-sm text-label-mono-sm text-outline uppercase">Kanal Sağlığı</span>
                              <span className="font-label-mono-lg text-headline-sm text-tertiary font-bold">18ms (60 FPS)</span>
                            </div>
                          </div>
                          <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col gap-space-xs">
                            <span className="font-label-mono-sm text-label-mono-sm uppercase text-outline font-semibold">
                              Yetki Durumu:
                            </span>
                            <div className="flex items-center justify-between text-body-sm text-on-surface">
                              <span className="flex items-center gap-space-xs text-tertiary font-medium">
                                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                Ekran paylaşımı aktif (Desktop Duplication API)
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-body-sm text-on-surface">
                              <span className="flex items-center gap-space-xs text-tertiary font-medium">
                                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                Klavye / Fare kontrolü devrede
                              </span>
                            </div>
                          </div>
                          <div className="pt-space-xs flex flex-col gap-space-xs">
                            <button
                              className="w-full py-space-md rounded-lg font-action-btn text-action-btn bg-error text-on-error hover:bg-error/90 shadow-md shadow-error/30 transition-all flex items-center justify-center gap-space-sm font-bold tracking-wide"
                              onClick={() => setConfirmModalOpen(true)}
                            >
                              <span className="material-symbols-outlined text-[20px]">power_settings_new</span>
                              <span>Desteği Sonlandır (Acil Kes)</span>
                            </button>
                            <p className="font-body-sm text-body-sm text-outline text-center">
                              Kullanıcı istediği an müdahale ederek kontrolü geri alabilir.
                            </p>
                          </div>
                          {confirmModalOpen && (
                            <div className="absolute inset-0 bg-inverse-surface/60 backdrop-blur-sm rounded-xl p-space-lg flex items-center justify-center z-30">
                              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-2xl flex flex-col gap-space-md max-w-[380px] text-center">
                                <div className="w-12 h-12 rounded-full bg-error-container text-on-error-container mx-auto flex items-center justify-center">
                                  <span className="material-symbols-outlined text-[24px]">warning</span>
                                </div>
                                <div className="flex flex-col gap-space-xs">
                                  <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                                    Oturum Kapatılsın mı?
                                  </h4>
                                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                                    Teknik destek bağlantısını anında sonlandırmak ve teknisyenin erişimini geri almak
                                    istiyor musunuz?
                                  </p>
                                </div>
                                <div className="grid grid-cols-2 gap-space-sm pt-space-xs">
                                  <button
                                    className="py-space-sm rounded-lg font-action-btn text-action-btn bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors"
                                    onClick={() => setConfirmModalOpen(false)}
                                  >
                                    Devam Et
                                  </button>
                                  <button
                                    className="py-space-sm rounded-lg font-action-btn text-action-btn bg-error text-on-error hover:bg-error/90 transition-colors font-bold"
                                    onClick={confirmTerminate}
                                  >
                                    Evet, Sonlandır
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {/* STAGE 4 */}
                      {stage === 4 && (
                        <div className="stage-view flex flex-col gap-space-lg text-center justify-center py-space-md">
                          <div className="w-20 h-20 rounded-full bg-tertiary-container/30 text-tertiary mx-auto flex items-center justify-center shadow-inner">
                            <span className="material-symbols-outlined text-[44px]">check_circle</span>
                          </div>
                          <div className="flex flex-col gap-space-xs">
                            <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
                              Destek Oturumu Sona Erdi
                            </h3>
                            <p className="font-body-md text-body-md text-on-surface-variant max-w-[340px] mx-auto">
                              Teknik destek bağlantısı başarıyla kapatıldı. Tüm uzaktan kontrol sürücüleri devreden
                              çıkarıldı.
                            </p>
                          </div>
                          <div className="bg-surface-container-low rounded-xl p-space-md max-w-[380px] mx-auto w-full flex flex-col gap-space-xs text-left">
                            <div className="flex justify-between font-body-sm text-body-sm">
                              <span className="text-outline">Yetkili Teknisyen:</span>
                              <span className="text-on-surface font-semibold">Mahmut Homak</span>
                            </div>
                            <div className="flex justify-between font-body-sm text-body-sm">
                              <span className="text-outline">Toplam Süre:</span>
                              <span className="text-on-surface font-semibold">18 dakika 42 saniye</span>
                            </div>
                            <div className="flex justify-between font-body-sm text-body-sm">
                              <span className="text-outline">Bağlantı Türü:</span>
                              <span className="text-on-surface font-semibold">TLS 1.3 Attended Direct</span>
                            </div>
                          </div>
                          <div className="bg-surface-container rounded-xl p-space-md max-w-[400px] mx-auto w-full flex flex-col gap-space-sm text-left">
                            <div className="flex items-center gap-space-xs text-on-surface font-label-mono-sm text-label-mono-sm font-semibold">
                              <span className="material-symbols-outlined text-primary text-[18px] animate-spin">sync</span>
                              <span>İstemci Temizleme Protokolü Çalışıyor...</span>
                            </div>
                            <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-primary h-full transition-all duration-500"
                                style={{ width: `${cleanupWidth}%` }}
                              ></div>
                            </div>
                            <p className="font-label-mono-sm text-label-mono-sm text-outline truncate">
                              Geçici dosyalar temizleniyor (%TEMP%\HomakRemote\session_583921.tmp)...
                            </p>
                            <p className="font-body-sm text-body-sm text-on-surface-variant font-medium">
                              Uygulama{" "}
                              <span className="text-primary font-bold">
                                {shutdownCountdown <= 0 ? "0 (Hazır)" : shutdownCountdown}
                              </span>{" "}
                              saniye içinde otomatik olarak kapanacaktır.
                            </p>
                          </div>
                          <div className="pt-space-xs">
                            <button
                              className="px-space-md py-space-xs rounded-lg font-action-btn text-action-btn bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-colors"
                              onClick={() => switchStage(1)}
                            >
                              Yeni Oturum Başlat (Simülasyonu Sıfırla)
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="h-7 bg-surface-container px-space-md flex items-center justify-between font-label-mono-sm text-label-mono-sm text-outline select-none">
                      <span className="flex items-center gap-space-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                        <span>Port 8443 / WebRTC Mesh</span>
                      </span>
                      <span>Homak Sovereign Engine v2.8</span>
                    </div>
                  </div>
                </div>
                {/* RIGHT: Attended Security & Live Telemetry Inspector */}
                <div className="lg:col-span-5 flex flex-col gap-space-md">
                  <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
                    <div className="flex items-center gap-space-sm text-primary">
                      <span className="material-symbols-outlined text-[24px]">verified</span>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                        Attended Architecture Prensibi
                      </h3>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      Homak Support Client, geleneksel RMM agentlarının aksine makinede arka plan servisi kurmaz. Kullanıcı
                      onaylamadan tek bir piksel bile destek merkezine iletilmez.
                    </p>
                    <div className="flex flex-col gap-space-sm pt-space-xs">
                      <div className="p-space-sm rounded-lg bg-surface-container-low flex items-start gap-space-sm">
                        <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">
                          notification_important
                        </span>
                        <div className="flex flex-col">
                          <span className="font-body-md text-body-md font-semibold text-on-surface">
                            Tam Kullanıcı Farkındalığı
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            Ekranın üst kısmında her an görünen yeşil oturum rozeti ile kontrolün teknisyende olduğu açıkça
                            belirtilir.
                          </span>
                        </div>
                      </div>
                      <div className="p-space-sm rounded-lg bg-surface-container-low flex items-start gap-space-sm">
                        <span className="material-symbols-outlined text-tertiary text-[20px] shrink-0 mt-0.5">delete_sweep</span>
                        <div className="flex flex-col">
                          <span className="font-body-md text-body-md font-semibold text-on-surface">
                            Kalıntısız Çıkış (Zero Footprint)
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            Oturum sonlandığı anda bellekteki geçici video capture sürücüleri ve Pano kancaları Windows API
                            çağrısıyla imha edilir.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
                    <div className="flex items-center justify-between">
                      <span className="font-headline-sm text-headline-sm text-on-surface font-bold">Protokol Günlüğü</span>
                      <span className="font-label-mono-sm text-label-mono-sm bg-surface-container px-space-sm py-0.5 rounded text-outline">
                        IPC EVENT LOG
                      </span>
                    </div>
                    <div className="bg-surface-container-highest p-space-md rounded-lg font-label-mono-sm text-label-mono-sm flex flex-col gap-space-xs text-on-surface-variant max-h-[190px] overflow-y-auto">
                      <div className="text-outline">
                        [15:40:02] Initializing HomakSupport.exe (.NET 8.0.4 WPF Host)...
                      </div>
                      <div className="text-outline">[15:40:04] DXGI Desktop Duplication API initialized.</div>
                      <div className="text-outline">
                        [15:40:08] Connected to Gateway: gw-tr-ist-01.homaklab.com:8443
                      </div>
                      <div className="text-primary font-semibold">
                        [15:40:09] State changed: WAITING_FOR_OPERATOR (PIN: 583-921)
                      </div>
                      {stage >= 2 && (
                        <div className="text-on-surface">
                          [15:41:20] Inbound peer handshaking: &quot;Mahmut Homak&quot; requesting CONTROL...
                        </div>
                      )}
                      {stage >= 3 && (
                        <div className="text-tertiary font-semibold">
                          [15:41:22] Attended permissions GRANTED by user. Capture pipe open.
                        </div>
                      )}
                      {stage >= 4 && (
                        <div className="text-error font-semibold">
                          [15:59:04] Session terminated by user trigger. Executing memory purge.
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-space-sm text-center">
                    <div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm">
                      <span className="font-label-mono-lg text-label-mono-lg text-primary font-bold block">0 MB</span>
                      <span className="font-body-sm text-body-sm text-outline">Disk Kalıntısı</span>
                    </div>
                    <div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm">
                      <span className="font-label-mono-lg text-label-mono-lg text-tertiary font-bold block">100%</span>
                      <span className="font-body-sm text-body-sm text-outline">Attended Onay</span>
                    </div>
                    <div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm">
                      <span className="font-label-mono-lg text-label-mono-lg text-on-surface font-bold block">AES-256</span>
                      <span className="font-body-sm text-body-sm text-outline">Kanal Şifreleme</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
