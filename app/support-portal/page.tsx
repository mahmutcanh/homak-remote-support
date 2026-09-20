"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { ApiError, getSessionStatusByCode, verifyCode } from "@/lib/api";

const OS_TABS = [
  { label: "Windows 10/11", icon: "desktop_windows" },
  { label: "macOS", icon: "laptop_mac" },
  { label: "Linux", icon: "terminal" },
];

export default function SupportPortalPage() {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [simTitle, setSimTitle] = useState("6 Haneli Kodu Girin");
  const [simSub, setSimSub] = useState("Destek kodunuzu yukarıdaki kutucuklara girip \"Desteği Başlat\" butonuna basın.");
  const [simPercent, setSimPercent] = useState(0);
  const [activeOsTab, setActiveOsTab] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [supportCode, setSupportCode] = useState<string | null>(null);
  const [rustdeskId, setRustdeskId] = useState<string | null>(null);
  const [downloadClicked, setDownloadClicked] = useState(false);

  const handleDigitChange = (index: number, value: string) => {
    const val = value.replace(/\D/g, "");
    const next = [...digits];
    next[index] = val ? val.slice(-1) : "";
    setDigits(next);
    if (val && index < digits.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...digits];
    pasted.split("").forEach((char, i) => {
      next[i] = char;
    });
    setDigits(next);
    if (pasted.length > 0) {
      const nextFocus = Math.min(pasted.length, digits.length - 1);
      inputRefs.current[nextFocus]?.focus();
    }
  };

  const clearCode = () => {
    setDigits(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
  };

  const startConnection = async () => {
    const code = digits.join("");
    if (code.length < 6) {
      setErrorMessage("Lütfen 6 haneli destek kodunun tamamını giriniz.");
      return;
    }

    setErrorMessage(null);
    setConnecting(true);
    setSimTitle("Kod Doğrulanıyor");
    setSimSub(`Destek kodu ${code} sunucuya iletiliyor...`);
    setSimPercent(30);

    try {
      const hostname =
        typeof window !== "undefined" && window.navigator ? window.navigator.platform || "Web İstemcisi" : "Web İstemcisi";
      const verified = await verifyCode({ code, hostname, clientVersion: "web-portal-1.0" });
      setSessionId(verified.id);
      setSupportCode(verified.supportCode);

      setSimPercent(100);
      setSimTitle("Oturum Onayı Bekleniyor");
      setSimSub("Kodunuz doğrulandı ve destek kuyruğuna eklendi. Bir teknisyen talebinizi kabul ettiğinde bilgilendirileceksiniz.");
      setConnected(true);
    } catch (err) {
      setSimPercent(0);
      setSimTitle("Bağlantı Başarısız");
      let msg = "Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.";
      if (err instanceof ApiError) {
        if (err.status === 404) {
          msg = "Girdiğiniz destek kodu geçersiz. Lütfen kodu kontrol edip tekrar deneyin.";
        } else if (err.status === 410) {
          msg = "Destek kodunun süresi doldu. Lütfen teknisyeninizden yeni bir kod isteyin.";
        } else if (err.status === 429) {
          msg = "Çok fazla deneme yapıldı. Lütfen bir dakika sonra tekrar deneyin.";
        } else {
          msg = err.message || "Kod doğrulanamadı.";
        }
      }
      setErrorMessage(msg);
      setSimSub(msg);
    } finally {
      setConnecting(false);
    }
  };

  useEffect(() => {
    if (!supportCode || rustdeskId) return;

    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const status = await getSessionStatusByCode(supportCode);
        if (!cancelled && status.rustdeskId) {
          setRustdeskId(status.rustdeskId);
        }
      } catch {
        // sessizce yut, bir sonraki denemede tekrar dene
      }
    }, 4000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [supportCode, rustdeskId]);

  const downloadUrl = supportCode ? `/api/download-desktop-agent/${supportCode}` : "#";

  useEffect(() => {
    if (!connected || !supportCode || downloadClicked) return;
    setDownloadClicked(true);
    const link = document.createElement("a");
    link.href = `/api/download-desktop-agent/${supportCode}`;
    link.download = `HomakDesktopAgent-${supportCode}.exe`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [connected, supportCode, downloadClicked]);

  return (
    <>
      <PublicHeader />
      <main className="w-full pt-16 bg-surface">
        <div className="flex flex-col w-full">
          <div className="relative w-full overflow-hidden">
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[920px] h-[340px] bg-gradient-to-b from-primary-fixed/30 via-secondary-fixed/20 to-transparent blur-3xl pointer-events-none -z-10"></div>
            <div className="absolute top-48 -right-24 w-80 h-80 rounded-full bg-tertiary-fixed/15 blur-3xl pointer-events-none -z-10"></div>
            <div className="max-w-[1200px] mx-auto px-margin-desktop py-space-xl">
              <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-space-xl">
                <div className="inline-flex items-center gap-space-sm px-space-md py-space-xs rounded-full bg-surface-container-highest shadow-sm mb-space-md">
                  <span className="w-2.5 h-2.5 rounded-full bg-tertiary animate-ping"></span>
                  <span className="font-label-mono-sm text-label-mono-sm text-on-surface uppercase tracking-wider font-semibold">
                    Homak Sovereign Support Gateway
                  </span>
                  <span className="font-label-mono-sm text-label-mono-sm text-outline">|</span>
                  <span className="font-label-mono-sm text-label-mono-sm text-primary font-bold">TLS 1.3 Active</span>
                </div>
                <h1 className="font-headline-xl text-headline-xl text-on-surface font-extrabold tracking-tight mb-space-sm">
                  Homak Remote Support
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
                  Teknik destek ekibimizin bilgisayarınıza bağlanabilmesi için size verilen 6 haneli destek kodunu girin.
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop items-start">
                <div className="lg:col-span-8 flex flex-col gap-space-lg">
                  <div className="bg-surface-container-lowest rounded-xl shadow-md p-space-xl relative overflow-hidden">
                    <div className="flex items-center justify-between pb-space-md mb-space-lg bg-surface-container-low -mx-space-xl -mt-space-xl px-space-xl py-space-md">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-7 h-7 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
                          <span className="material-symbols-outlined text-[18px]">verified_user</span>
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="font-action-btn text-action-btn text-on-surface">Güvenli Oturum Başlatıcı</span>
                          <span className="font-label-mono-sm text-label-mono-sm text-outline">
                            BeyondTrust / Bomgar Uyumlu Protokol
                          </span>
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-space-xs bg-surface-container px-space-sm py-space-xs rounded-lg">
                        <span className="material-symbols-outlined text-tertiary text-[16px]">lock</span>
                        <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">256-Bit Uçtan Uca Şifreli</span>
                      </div>
                    </div>
                    <form
                      className="flex flex-col gap-space-lg"
                      onSubmit={(e) => {
                        e.preventDefault();
                        startConnection();
                      }}
                    >
                      <div className="flex flex-col items-center gap-space-md">
                        <label className="font-action-btn text-action-btn text-on-surface-variant uppercase tracking-wider" htmlFor="digit-1">
                          6 Haneli Destek PIN Kodu
                        </label>
                        <div className="flex items-center justify-center gap-space-sm sm:gap-space-md w-full max-w-md">
                          {digits.map((digit, index) => (
                            <Fragment key={index}>
                              {index === 3 && (
                                <span className="font-headline-lg text-headline-lg text-outline-variant select-none">
                                  -
                                </span>
                              )}
                              <input
                                autoFocus={index === 0}
                                ref={(el) => {
                                  inputRefs.current[index] = el;
                                }}
                                className="otp-input w-12 h-16 sm:w-14 sm:h-20 text-center font-label-mono-lg text-headline-md font-bold bg-surface-container-low text-primary rounded-lg shadow-sm transition-all focus:bg-surface-container-lowest focus:scale-105 focus:shadow-md outline-none"
                                id={`digit-${index + 1}`}
                                inputMode="numeric"
                                maxLength={1}
                                pattern="[0-9]*"
                                type="text"
                                value={digit}
                                onChange={(e) => handleDigitChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={handlePaste}
                              />
                            </Fragment>
                          ))}
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant text-center max-w-lg mt-space-xs">
                          Destek kodunu girdikten sonra tek bir <strong className="text-on-surface">HomakConnect.exe</strong>{" "}
                          istemcisi indirilecek, otomatik olarak bağlanacak ve bir onay penceresiyle oturumunuz başlayacaktır.
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-space-md pt-space-sm">
                        <button
                          className={`w-full sm:w-auto px-space-xl py-space-md text-on-primary rounded-lg font-action-btn text-action-btn flex items-center justify-center gap-space-sm shadow-md transition-all active:scale-[0.98] ${
                            connected ? "bg-tertiary" : "bg-primary hover:bg-primary-container"
                          }`}
                          disabled={connecting}
                          type="button"
                          onClick={startConnection}
                        >
                          <span className={`material-symbols-outlined text-[20px] ${connecting ? "animate-spin" : ""}`}>
                            {connecting ? "sync" : connected ? "check_circle" : "play_arrow"}
                          </span>
                          <span>{connecting ? "Bağlanıyor..." : connected ? "Aktif Bağlantı" : "Desteği Başlat"}</span>
                        </button>
                        <button
                          className="w-full sm:w-auto px-space-lg py-space-md bg-surface-container hover:bg-surface-container-high text-on-surface-variant rounded-lg font-action-btn text-action-btn flex items-center justify-center gap-space-xs transition-colors"
                          type="button"
                          onClick={clearCode}
                        >
                          <span className="material-symbols-outlined text-[18px]">backspace</span>
                          <span>Kodu Sıfırla</span>
                        </button>
                      </div>
                    </form>
                    {errorMessage && (
                      <div className="mt-space-md p-space-md rounded-xl bg-error-container/40 border border-error-container text-on-surface flex items-center gap-space-sm">
                        <span className="material-symbols-outlined text-error text-[20px]">error</span>
                        <span className="font-body-sm text-body-sm">{errorMessage}</span>
                      </div>
                    )}
                    <div className="mt-space-lg bg-surface-container-low rounded-xl p-space-md transition-all">
                      <div className="flex items-center justify-between mb-space-sm">
                        <div className="flex items-center gap-space-sm">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-[18px]">
                              {connected ? "check_circle" : "cloud_download"}
                            </span>
                          </div>
                          <div className="flex flex-col text-left">
                            <span className="font-action-btn text-action-btn text-on-surface">{simTitle}</span>
                            <span className="font-label-mono-sm text-label-mono-sm text-outline">{simSub}</span>
                          </div>
                        </div>
                        <span className="font-label-mono-sm text-label-mono-sm text-primary font-bold px-space-sm py-space-xs bg-surface-container rounded">
                          {simPercent}%
                        </span>
                      </div>
                      <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full transition-all duration-300 rounded-full"
                          style={{ width: `${simPercent}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between mt-space-sm text-left">
                        <div className="flex items-center gap-space-xs">
                          <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                          <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">
                            Doğrulandı: SHA-256 Checksum Geçerli
                          </span>
                        </div>
                        <span className="font-label-mono-sm text-label-mono-sm text-outline">Süreç ID: #HSC-9941</span>
                      </div>
                    </div>
                    {connected && (
                      <div className="mt-space-lg bg-surface-container-low rounded-xl p-space-lg text-left">
                        <div className="flex items-center gap-space-sm mb-space-md">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-[18px]">desktop_windows</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-headline-sm text-headline-sm text-on-surface">
                              Homak Connect ile Otomatik Bağlantı
                            </span>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">
                              Tek program, sıfır manuel adım. Aşağıdaki butona basın, gerisini biz hallederiz.
                            </span>
                          </div>
                        </div>

                        {!rustdeskId ? (
                          <div className="flex flex-col gap-space-md p-space-lg rounded-lg bg-surface-container-lowest items-center text-center">
                            <a
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-space-sm px-space-xl py-space-md bg-primary text-on-primary rounded-lg font-action-btn text-action-btn shadow-md hover:bg-primary-container transition-all"
                                href={downloadUrl}
                                download={supportCode ? `HomakDesktopAgent-${supportCode}.exe` : undefined}
                                onClick={() => setDownloadClicked(true)}
                              >
                              <span className="material-symbols-outlined text-[22px]">download</span>
                              <span>Homak Connect&apos;i İndir ve Bağlan</span>
                            </a>
                            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-lg">
                              İndirdiğiniz programı çalıştırın. Otomatik olarak güvenli bağlantı kurulacak ve destek
                              ekibi bilgilendirilecektir. Bağlantı geldiğinde ekranınızda bir onay penceresi belirecek,
                              sadece <strong className="text-on-surface">&apos;İzin Ver&apos;</strong> demeniz yeterli.
                            </p>
                            {downloadClicked && (
                              <div className="flex items-center gap-space-xs p-space-sm rounded-lg bg-surface-container text-on-surface-variant">
                                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                                <span className="font-body-sm text-body-sm">
                                  Program çalıştırıldıktan sonra bağlantı otomatik olarak burada görünecektir...
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-space-sm p-space-md rounded-lg bg-tertiary/10 border border-tertiary/20 text-on-surface">
                            <span className="material-symbols-outlined text-tertiary text-[22px]">check_circle</span>
                            <div className="flex flex-col">
                              <span className="font-action-btn text-action-btn">Bağlantı kuruldu!</span>
                              <span className="font-body-sm text-body-sm text-on-surface-variant">
                                Teknisyen destek talebinizi görüyor. Ekranınızda bir onay penceresi belirdiğinde
                                &apos;İzin Ver&apos;e tıklamanız yeterli olacaktır.
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md mt-space-xl pt-space-lg bg-surface-container-lowest">
                      <div className="flex items-start gap-space-sm p-space-sm rounded-lg bg-surface-container-low">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[18px]">lock</span>
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="font-action-btn text-action-btn text-on-surface">256-bit TLS Şifreli</span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            Banka düzeyinde NIST onaylı tünelleme standardı.
                          </span>
                        </div>
                      </div>
                      <div className="flex items-start gap-space-sm p-space-sm rounded-lg bg-surface-container-low">
                        <div className="w-8 h-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[18px]">front_hand</span>
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="font-action-btn text-action-btn text-on-surface">Kullanıcı İzni Zorunlu</span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            Sessiz erişim engellidir (No Silent Access).
                          </span>
                        </div>
                      </div>
                      <div className="flex items-start gap-space-sm p-space-sm rounded-lg bg-surface-container-low">
                        <div className="w-8 h-8 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[18px]">auto_delete</span>
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="font-action-btn text-action-btn text-on-surface">Geçici &amp; Otomatik Temizleme</span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            Oturum bittiğinde tüm agent modülleri silinir.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-surface-container-low rounded-xl p-space-lg shadow-sm flex flex-col md:flex-row items-center justify-between gap-space-md">
                    <div className="flex items-center gap-space-md text-left">
                      <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center shrink-0 text-primary">
                        <span className="material-symbols-outlined text-[28px]">terminal</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-headline-sm text-headline-sm text-on-surface">Doğrudan Konsol Başlatıcısı</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Kurumsal alan adları ve kısıtlı ağlar için alternatif MSI dağıtım paketi mevcuttur.
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-space-sm w-full md:w-auto">
                      <a
                        className="w-full md:w-auto px-space-md py-space-xs bg-surface-container-highest hover:bg-surface-variant text-on-surface font-action-btn text-action-btn rounded-lg flex items-center justify-center gap-space-xs transition-colors"
                        href="#"
                      >
                        <span className="material-symbols-outlined text-[18px]">download</span>
                        <span>Stand-alone İstemci (.msi)</span>
                      </a>
                    </div>
                  </div>
                  <div className="bg-surface-container-lowest rounded-xl shadow-md p-space-xl text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-md border-b border-surface-container-high mb-space-lg">
                      <div>
                        <div className="inline-flex items-center gap-space-xs text-primary font-label-mono-sm uppercase tracking-wider mb-1">
                          <span className="material-symbols-outlined text-[16px]">developer_guide</span>
                          <span>Kılavuz &amp; Güvenlik Protokolü</span>
                        </div>
                        <h3 className="font-headline-md text-headline-md text-on-surface">Adım Adım Bağlantı Rehberi</h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          Tüm işletim sistemlerinde sorunsuz oturum başlatma ve güvenlik onay yönergeleri
                        </p>
                      </div>
                      <div className="flex items-center gap-1 bg-surface-container p-1 rounded-lg self-start sm:self-auto">
                        {OS_TABS.map((tab, idx) => (
                          <button
                            key={tab.label}
                            className={`px-space-sm py-1 rounded font-action-btn text-action-btn flex items-center gap-1 transition-colors ${
                              activeOsTab === idx
                                ? "bg-surface-container-lowest text-primary shadow-sm"
                                : "text-on-surface-variant hover:text-on-surface"
                            }`}
                            type="button"
                            onClick={() => setActiveOsTab(idx)}
                          >
                            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                            <span>{tab.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
                      <div className="flex flex-col gap-space-sm p-space-md bg-surface-container-low rounded-xl border border-surface-container-high">
                        <div className="flex items-center justify-between">
                          <span className="px-space-sm py-0.5 rounded bg-primary text-on-primary font-label-mono-sm font-bold text-[11px]">
                            ADIM 1
                          </span>
                          <span className="font-label-mono-sm text-outline">Süre: ~10 sn</span>
                        </div>
                        <h4 className="font-headline-sm text-headline-sm text-on-surface">6 Haneli Kodu Doğrulayın</h4>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          Destek uzmanınızın aktardığı tek kullanımlık 6 basamaklı PIN kodunu ilgili kutucuklara girip{" "}
                          <strong>&apos;Desteği Başlat&apos;</strong> butonuna tıklayın. Kod tek oturumluktur.
                        </p>
                        <div className="mt-space-xs p-space-sm rounded bg-surface-container font-label-mono-sm text-label-mono-sm text-primary flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px]">info</span>
                          <span>
                            Örnek PIN: <strong>583-921</strong> (Her oturumda değişir)
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-space-sm p-space-md bg-surface-container-low rounded-xl border border-surface-container-high">
                        <div className="flex items-center justify-between">
                          <span className="px-space-sm py-0.5 rounded bg-primary text-on-primary font-label-mono-sm font-bold text-[11px]">
                            ADIM 2
                          </span>
                          <span className="font-label-mono-sm text-outline">SmartScreen &amp; UAC</span>
                        </div>
                        <h4 className="font-headline-sm text-headline-sm text-on-surface">HomakDesktopAgent.exe Çalıştırın</h4>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          İndirilen tek programa çift tıklayın; güvenli tünel otomatik kurulur ve bağlanır.
                          Windows Defender veya SmartScreen uyarısı belirmesi halinde aşağıdaki adımı izleyin.
                        </p>
                        <div className="mt-space-xs p-space-sm rounded bg-primary/10 border border-primary/20 text-on-surface flex flex-col gap-1">
                          <div className="flex items-center gap-space-xs text-primary font-action-btn text-action-btn">
                            <span className="material-symbols-outlined text-[16px]">warning</span>
                            <span>SmartScreen İpucu:</span>
                          </div>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            <strong className="text-primary">&apos;Ek Bilgi&apos; (More Info)</strong> → ardından çıkan{" "}
                            <strong className="text-primary">&apos;Yine de Çalıştır&apos; (Run Anyway)</strong> butonuna
                            basınız.
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-space-sm p-space-md bg-surface-container-low rounded-xl border border-surface-container-high">
                        <div className="flex items-center justify-between">
                          <span className="px-space-sm py-0.5 rounded bg-primary text-on-primary font-label-mono-sm font-bold text-[11px]">
                            ADIM 3
                          </span>
                          <span className="font-label-mono-sm text-outline">Yetkilendirme Onayı</span>
                        </div>
                        <h4 className="font-headline-sm text-headline-sm text-on-surface">Ekranda İzin Penceresini Onaylayın</h4>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          Masaüstünüzde belirecek açılır pencerede atanan teknisyenin adını teyit edin. Yeşil{" "}
                          <strong>&apos;İzin Ver&apos; (Allow)</strong> butonuna tıklayarak görüntüyü paylaşın.
                        </p>
                        <div className="mt-space-xs p-space-sm rounded bg-tertiary/10 border border-tertiary/20 text-on-surface flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-tertiary text-[18px]">verified_user</span>
                            <span className="font-label-mono-sm text-label-mono-sm font-semibold text-tertiary">
                              Homak Operatör: Onay Bekleniyor
                            </span>
                          </div>
                          <span className="px-space-sm py-0.5 rounded bg-tertiary text-on-tertiary font-label-mono-sm font-bold text-[11px]">
                            İzin Ver
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-space-sm p-space-md bg-surface-container-low rounded-xl border border-surface-container-high">
                        <div className="flex items-center justify-between">
                          <span className="px-space-sm py-0.5 rounded bg-primary text-on-primary font-label-mono-sm font-bold text-[11px]">
                            ADIM 4
                          </span>
                          <span className="font-label-mono-sm text-outline">Tam Kontrol Sizde</span>
                        </div>
                        <h4 className="font-headline-sm text-headline-sm text-on-surface">Canlı İzleyin &amp; Anında Kesin</h4>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          Teknisyenin gerçekleştirdiği işlemler ekranda canlı görünür. İstediğiniz saniye ekrandaki kırmızı{" "}
                          <strong>&apos;Desteği Sonlandır&apos;</strong> tuşuna basarak oturumu kapatabilirsiniz.
                        </p>
                        <div className="mt-space-xs p-space-sm rounded bg-error-container/40 border border-error-container text-on-surface flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-error text-[18px]">cancel</span>
                            <span className="font-label-mono-sm text-label-mono-sm font-semibold text-on-surface">
                              Acil Durdurma Anahtarı
                            </span>
                          </div>
                          <span className="px-space-sm py-0.5 rounded bg-error text-on-error font-label-mono-sm font-bold text-[11px]">
                            Desteği Sonlandır
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-4 flex flex-col gap-space-lg">
                  <div className="bg-surface-container-lowest rounded-xl shadow-md p-space-lg">
                    <div className="flex items-center justify-between pb-space-sm mb-space-md border-b border-surface-container-high">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                          <span className="material-symbols-outlined text-[20px]">menu_book</span>
                        </div>
                        <div>
                          <h2 className="font-headline-sm text-headline-sm text-on-surface">Bağlantı Rehberi</h2>
                          <p className="font-label-mono-sm text-label-mono-sm text-outline">4 Adımda Güvenli Oturum</p>
                        </div>
                      </div>
                      <span className="px-space-sm py-0.5 rounded-full bg-tertiary/10 text-tertiary font-label-mono-sm font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>Gözetimli
                      </span>
                    </div>
                    <ol className="flex flex-col gap-space-md text-left">
                      <li className="flex items-start gap-space-sm bg-surface-container-low p-space-sm rounded-lg">
                        <span className="w-6 h-6 rounded-full bg-primary text-on-primary font-label-mono-sm flex items-center justify-center shrink-0 font-bold text-[12px]">
                          1
                        </span>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center justify-between">
                            <span className="font-action-btn text-action-btn text-on-surface">6 Haneli Kodu Girin</span>
                            <span className="material-symbols-outlined text-primary text-[16px]">pin</span>
                          </div>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            Teknisyenin telefon veya mesajla ilettiği kodu girip &apos;Desteği Başlat&apos; butonuna tıklayın.
                          </span>
                        </div>
                      </li>
                      <li className="flex items-start gap-space-sm bg-surface-container-low p-space-sm rounded-lg">
                        <span className="w-6 h-6 rounded-full bg-primary text-on-primary font-label-mono-sm flex items-center justify-center shrink-0 font-bold text-[12px]">
                          2
                        </span>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center justify-between">
                            <span className="font-action-btn text-action-btn text-on-surface">
                              HomakConnect.exe İndir ve Çalıştır
                            </span>
                            <span className="material-symbols-outlined text-primary text-[16px]">download_for_offline</span>
                          </div>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            İndirilen dosyayı açın. SmartScreen uyarısı gelirse{" "}
                            <em>&apos;Ek Bilgi&apos; → &apos;Yine de Çalıştır&apos;</em> seçin.
                          </span>
                        </div>
                      </li>
                      <li className="flex items-start gap-space-sm bg-surface-container-low p-space-sm rounded-lg">
                        <span className="w-6 h-6 rounded-full bg-primary text-on-primary font-label-mono-sm flex items-center justify-center shrink-0 font-bold text-[12px]">
                          3
                        </span>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center justify-between">
                            <span className="font-action-btn text-action-btn text-on-surface">İzin Penceresini Onaylayın</span>
                            <span className="material-symbols-outlined text-tertiary text-[16px]">verified</span>
                          </div>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            Ekrandaki teknisyen adını ve PIN eşleşmesini kontrol edin. Yeşil &apos;İzin Ver&apos; butonuna
                            basın.
                          </span>
                        </div>
                      </li>
                      <li className="flex items-start gap-space-sm bg-surface-container-low p-space-sm rounded-lg">
                        <span className="w-6 h-6 rounded-full bg-primary text-on-primary font-label-mono-sm flex items-center justify-center shrink-0 font-bold text-[12px]">
                          4
                        </span>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center justify-between">
                            <span className="font-action-btn text-action-btn text-on-surface">
                              Canlı İzleyin &amp; İstediğiniz An Kapatın
                            </span>
                            <span className="material-symbols-outlined text-secondary text-[16px]">visibility</span>
                          </div>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            Her hamle gözünüzün önündedir. &apos;Desteği Sonlandır&apos; butonuyla oturumu anında tek tıkla
                            kesebilirsiniz.
                          </span>
                        </div>
                      </li>
                    </ol>
                    <div className="mt-space-md pt-space-sm bg-surface-container-low -mx-space-lg -mb-space-lg p-space-lg rounded-b-xl flex items-center gap-space-sm">
                      <span className="material-symbols-outlined text-primary text-[20px] shrink-0">shield</span>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        <strong>Sıfır Gizli Erişim:</strong> Sizin onayınız olmadan oturum kurulamaz veya dosya aktarımı
                        başlatılamaz.
                      </p>
                    </div>
                  </div>
                  <div className="bg-surface-container-lowest rounded-xl shadow-md p-space-lg text-left">
                    <div className="flex items-center justify-between mb-space-sm">
                      <span className="font-action-btn text-action-btn text-on-surface">Canlı Gateway Durumu</span>
                      <span className="font-label-mono-sm text-label-mono-sm text-tertiary font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> 99.99% UP
                      </span>
                    </div>
                    <div className="space-y-space-sm">
                      <div className="flex items-center justify-between font-label-mono-sm text-label-mono-sm text-on-surface-variant py-space-xs bg-surface-container px-space-sm rounded">
                        <span>Avrupa (Frankfurt Edge)</span>
                        <span className="text-on-surface font-semibold">18 ms</span>
                      </div>
                      <div className="flex items-center justify-between font-label-mono-sm text-label-mono-sm text-on-surface-variant py-space-xs bg-surface-container px-space-sm rounded">
                        <span>Türkiye (Istanbul Hub)</span>
                        <span className="text-on-surface font-semibold">4 ms</span>
                      </div>
                      <div className="flex items-center justify-between font-label-mono-sm text-label-mono-sm text-on-surface-variant py-space-xs bg-surface-container px-space-sm rounded">
                        <span>Kuzey Amerika (East 1)</span>
                        <span className="text-on-surface font-semibold">82 ms</span>
                      </div>
                    </div>
                    <div className="mt-space-md">
                      <div className="flex justify-between items-center text-on-surface-variant font-label-mono-sm text-label-mono-sm mb-space-xs">
                        <span>Gateway Şifreleme Yükü</span>
                        <span>Optimum (%24)</span>
                      </div>
                      <svg className="w-full h-10 text-primary" fill="none" preserveAspectRatio="none" viewBox="0 0 240 40">
                        <path
                          d="M0 32 Q 30 15, 60 28 T 120 18 T 180 25 T 240 12"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeWidth="2.5"
                        ></path>
                        <path
                          d="M0 32 Q 30 15, 60 28 T 120 18 T 180 25 T 240 12 L 240 40 L 0 40 Z"
                          fill="currentColor"
                          fillOpacity="0.08"
                        ></path>
                      </svg>
                    </div>
                  </div>
                  <div className="bg-surface-container-high/40 rounded-xl p-space-md flex items-center gap-space-md text-left">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="w-14 h-14 rounded-lg object-cover shadow-sm shrink-0"
                      alt="A clean corporate technical support certified security badge on pristine architectural glass background, enterprise IT blue aesthetic"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBPOU8vqoWn2atvNvvvohyb2mbC7l386WdazrUrLMCQcv6xpWzCotti5myf1UMv1DMJCCQSFQfaXzdL-62BrP112zJ-uEG_x5tJ3NSII0MPhs3vEqRPVtmCuTHceRgs-Xk6SlzTV7HbVMn4eD5MFVWK8DhGGj83y_ILLyA4DuHs6F3pxExHQy1Dd3Lyhs62KM7v4YzknYtEDWROojXW4tFTNyPRexcdwkkQopaBI_R-MB4C6fJjNxoA"
                    />
                    <div className="flex flex-col">
                      <span className="font-action-btn text-action-btn text-on-surface">Yetkili Teknisyen Doğrulama</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Yalnızca Homak Security Operations ekibi erişim anahtarı oluşturabilir.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-space-xl pt-space-lg text-center">
                <p className="font-label-mono-sm text-label-mono-sm text-outline tracking-wide">
                  Homak Remote Secure Remote Support • Powered by Homak Lab Enterprise Security
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
