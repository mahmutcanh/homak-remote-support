"use client";

import { useEffect, useRef, useState } from "react";

export default function ApprovalPage() {
  const [secondsRemaining, setSecondsRemaining] = useState(45);
  const [grantState, setGrantState] = useState<"idle" | "granted">("idle");
  const [denyState, setDenyState] = useState<"idle" | "denied">("idle");
  const decidedRef = useRef(false);

  const handleDeny = () => {
    if (decidedRef.current) return;
    decidedRef.current = true;
    setDenyState("denied");
  };

  const handleGrant = () => {
    if (decidedRef.current) return;
    decidedRef.current = true;
    setGrantState("granted");
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsRemaining((s) => {
        if (s <= 1) {
          clearInterval(interval);
          if (!decidedRef.current) {
            decidedRef.current = true;
            setDenyState("denied");
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const decided = grantState === "granted" || denyState === "denied";

  return (
    <main className="relative bg-surface w-full px-gutter-desktop py-space-xl min-h-screen">
      <div className="flex flex-col w-full max-w-[1600px] mx-auto">
            {/* Interactive Top Breadcrumb & Step Pipeline */}
            <section className="w-full mb-space-lg">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
                <div className="flex flex-col gap-space-xs">
                  <div className="flex items-center gap-space-xs text-outline font-label-mono-sm text-label-mono-sm uppercase tracking-wider">
                    <span>Windows 11 Native Attended Runtime</span>
                    <span>/</span>
                    <span className="text-primary font-semibold">Security Handshake</span>
                    <span>/</span>
                    <span>Policy Enforcement</span>
                  </div>
                  <div className="flex items-center gap-space-sm">
                    <div className="w-7 h-7 rounded bg-primary-container text-on-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">verified_user</span>
                    </div>
                    <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
                      Homak Remote Support — Güvenlik Onay Aşaması
                    </h1>
                  </div>
                </div>
                <div className="flex items-center gap-space-xs flex-wrap bg-surface-container-low p-1.5 rounded-lg">
                  <div className="flex items-center gap-space-xs px-space-sm py-1 rounded text-outline font-body-sm text-body-sm">
                    <span className="w-2 h-2 rounded-full bg-outline"></span>
                    <span>01 Bağlantı Başlatma</span>
                  </div>
                  <span className="text-outline-variant font-label-mono-sm text-label-mono-sm">→</span>
                  <div className="flex items-center gap-space-xs px-space-sm py-1 rounded bg-primary text-on-primary font-body-sm text-body-sm font-semibold shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-tertiary-fixed animate-pulse"></span>
                    <span>02 Onay İsteği (Aktif)</span>
                  </div>
                  <span className="text-outline-variant font-label-mono-sm text-label-mono-sm">→</span>
                  <div className="flex items-center gap-space-xs px-space-sm py-1 rounded text-outline font-body-sm text-body-sm">
                    <span className="w-2 h-2 rounded-full bg-outline-variant"></span>
                    <span>03 Canlı Oturum</span>
                  </div>
                  <span className="text-outline-variant font-label-mono-sm text-label-mono-sm">→</span>
                  <div className="flex items-center gap-space-xs px-space-sm py-1 rounded text-outline font-body-sm text-body-sm">
                    <span className="w-2 h-2 rounded-full bg-outline-variant"></span>
                    <span>04 İptal &amp; Temizlik</span>
                  </div>
                </div>
              </div>
            </section>
            {/* Main Work Area: Desktop Window Simulator + Context Panel */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
              {/* LEFT / CENTER: Native Windows 11 Fluent 520px Application Frame */}
              <div className="xl:col-span-7 flex justify-center w-full">
                <div className="w-full max-w-[540px] bg-surface-container-lowest rounded-xl shadow-xl flex flex-col overflow-hidden transition-all relative">
                  <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-tertiary-container/10 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="h-10 bg-surface-container-high px-space-sm flex items-center justify-between select-none">
                    <div className="flex items-center gap-space-xs">
                      <div className="w-4 h-4 rounded bg-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-primary text-[11px]">shield</span>
                      </div>
                      <span className="font-body-sm text-body-sm font-medium text-on-surface">
                        Homak Remote Support — v1.0.0 (.NET 8 WPF / WinUI 3)
                      </span>
                    </div>
                    <div className="flex items-center h-full">
                      <button className="h-8 w-9 flex items-center justify-center hover:bg-surface-container text-on-surface-variant transition-colors" title="Simge Durumuna Küçült">
                        <span className="material-symbols-outlined text-[15px]">remove</span>
                      </button>
                      <button className="h-8 w-9 flex items-center justify-center hover:bg-surface-container text-on-surface-variant transition-colors" title="Ekranı Kapla">
                        <span className="material-symbols-outlined text-[13px]">check_box_outline_blank</span>
                      </button>
                      <button className="h-8 w-10 flex items-center justify-center hover:bg-error hover:text-on-error text-on-surface-variant transition-colors" title="Kapat">
                        <span className="material-symbols-outlined text-[15px]">close</span>
                      </button>
                    </div>
                  </div>
                  <div className="p-space-lg flex flex-col gap-space-md relative z-10">
                    <div className="flex items-start gap-space-sm p-space-sm bg-primary-fixed/30 rounded-lg">
                      <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary flex-shrink-0 flex items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-[24px]">vpn_key_alert</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-space-xs">
                          <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                          <span className="font-label-mono-sm text-label-mono-sm uppercase text-primary font-semibold tracking-wider">
                            Etkileşimli Erişim Onayı
                          </span>
                        </div>
                        <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold truncate">Gelen Bağlantı Talebi</h2>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          Yetkili IT operatörü bilgisayarınızda interaktif oturum açmak için izninizi talep ediyor.
                        </p>
                      </div>
                    </div>
                    <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col gap-space-sm shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-space-sm min-w-0">
                          <div className="relative flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              className="w-12 h-12 rounded-full object-cover shadow-sm"
                              alt="Corporate headshot of Mahmut Homak, a male IT infrastructure engineer in a clean modern data center wearing navy polo, warm confident smile, crisp professional enterprise lighting"
                              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYga5MJyvPlxEQdP1LiG1DMuzrGHG0RnWVKKw_f7rQAYceqDQTlkVgh0Xh5B8JZoE1jLebBd_UU8ofc3pgb6jyDbKKoZNVKyW4zHv7i1U0cBeHWpJraVGRIi7wYBiEkb04aKK1ivPrj3B-xNAZgHozHYs81daHQGEfeI7u75hFcR4QHCFWJ0lsdKeSZ8Kb8C1U_ASbE0bJoYCW_C4VpJtdmK13WR9Xrr2DvkySVzUVcqrG-rWCVcD_"
                            />
                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-tertiary flex items-center justify-center text-on-tertiary">
                              <span className="material-symbols-outlined text-[10px]">check</span>
                            </span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-space-xs">
                              <span className="font-headline-sm text-headline-sm font-bold text-on-surface truncate">Mahmut Homak</span>
                              <span className="material-symbols-outlined text-primary text-[18px]" title="Firma Tarafından Doğrulanmış">
                                verified
                              </span>
                            </div>
                            <span className="font-body-sm text-body-sm text-on-surface-variant font-medium truncate">
                              IT Support &amp; Infrastructure Lead
                            </span>
                          </div>
                        </div>
                        <div className="hidden sm:flex flex-col items-end">
                          <span className="font-label-mono-sm text-label-mono-sm text-outline uppercase tracking-wider">
                            Doğrulama PIN
                          </span>
                          <span className="font-label-mono-lg text-label-mono-lg text-primary font-bold tracking-wider">583 921</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-xs pt-space-xs">
                        <div className="flex items-center gap-space-xs px-2.5 py-1.5 rounded-md bg-surface-container-lowest">
                          <span className="material-symbols-outlined text-primary text-[16px]">domain_verification</span>
                          <span className="font-body-sm text-body-sm text-on-surface font-medium truncate">
                            Homak Lab Enterprise Ops (RBAC MFA)
                          </span>
                        </div>
                        <div className="flex items-center gap-space-xs px-2.5 py-1.5 rounded-md bg-surface-container-lowest">
                          <span className="material-symbols-outlined text-tertiary text-[16px]">lock</span>
                          <span className="font-label-mono-sm text-label-mono-sm text-outline truncate">
                            gw-tr-ist-01.homaklab.com (TLS 1.3)
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-surface-container rounded-xl p-space-md flex flex-col gap-space-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-action-btn text-action-btn text-on-surface font-semibold">
                          Teknisyen aşağıdaki yetkileri talep ediyor:
                        </span>
                        <span className="font-label-mono-sm text-label-mono-sm px-2 py-0.5 rounded bg-error-container text-on-error-container font-semibold">
                          NO SILENT ACCESS
                        </span>
                      </div>
                      <div className="flex flex-col gap-space-xs">
                        <div className="flex items-center gap-space-sm p-space-xs rounded-lg bg-surface-container-lowest">
                          <div className="w-7 h-7 rounded-md bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-space-xs">
                              <span className="font-body-sm text-body-sm font-semibold text-on-surface">Ekran Görüntüleme</span>
                              <span className="font-label-mono-sm text-label-mono-sm text-primary px-1 rounded bg-primary-fixed">
                                Canlı 60 FPS
                              </span>
                            </div>
                            <span className="font-body-sm text-body-sm text-outline truncate">
                              Ekranınızı gerçek zamanlı canlı izleme (Masaüstü &amp; Uygulamalar)
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-space-sm p-space-xs rounded-lg bg-surface-container-lowest">
                          <div className="w-7 h-7 rounded-md bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
                            <span className="material-symbols-outlined text-[18px]">mouse</span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-space-xs">
                              <span className="font-body-sm text-body-sm font-semibold text-on-surface">Fare ve Klavye Kontrolü</span>
                              <span className="font-label-mono-sm text-label-mono-sm text-secondary px-1 rounded bg-secondary-fixed">
                                Girdi Enjeksiyonu
                              </span>
                            </div>
                            <span className="font-body-sm text-body-sm text-outline truncate">
                              Destek amaçlı fare imleci ve klavye girdisi gönderme
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-space-sm p-space-xs rounded-lg bg-surface-container-lowest">
                          <div className="w-7 h-7 rounded-md bg-surface-container-high flex items-center justify-center text-on-surface">
                            <span className="material-symbols-outlined text-[18px]">content_paste</span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-space-xs">
                              <span className="font-body-sm text-body-sm font-semibold text-on-surface">Pano Paylaşımı (Clipboard)</span>
                              <span className="font-label-mono-sm text-label-mono-sm text-outline px-1 rounded bg-surface-container-high">
                                Metin Yalnızca
                              </span>
                            </div>
                            <span className="font-body-sm text-body-sm text-outline truncate">
                              Metin kopyalama/yapıştırma (Dosya transferi devre dışı)
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-space-xs p-2.5 rounded-lg bg-surface-container-low text-on-surface-variant text-body-sm font-body-sm">
                        <span className="material-symbols-outlined text-primary text-[18px] flex-shrink-0 mt-0.5">security</span>
                        <span>
                          <strong>Sessiz erişim (arka kapı) engellenmiştir.</strong> Bu oturum uçtan uca şifrelenir ve
                          dilediğiniz saniye ekranın üstündeki veya bu penceredeki kırmızı buton ile kesilebilir.
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-space-xs mt-space-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
                        <button
                          className={`flex items-center justify-center gap-space-xs px-space-md py-3 rounded-lg font-action-btn text-action-btn font-semibold shadow-md transition-all active:scale-[0.98] ${
                            grantState === "granted"
                              ? "bg-primary text-on-primary"
                              : "bg-tertiary-container hover:bg-tertiary text-on-tertiary"
                          }`}
                          disabled={decided}
                          onClick={handleGrant}
                        >
                          <span className={`material-symbols-outlined text-[20px] ${grantState === "granted" ? "animate-spin" : ""}`}>
                            {grantState === "granted" ? "sync" : "check_circle"}
                          </span>
                          <span>{grantState === "granted" ? "Bağlantı Kuruluyor..." : "İzin Ver (Bağlantıyı Başlat)"}</span>
                        </button>
                        <button
                          className="flex items-center justify-center gap-space-xs px-space-md py-3 rounded-lg bg-error hover:bg-on-error-container text-on-error font-action-btn text-action-btn font-semibold shadow-sm transition-all active:scale-[0.98]"
                          disabled={decided}
                          onClick={handleDeny}
                        >
                          <span className="material-symbols-outlined text-[20px]">{denyState === "denied" ? "block" : "cancel"}</span>
                          <span>{denyState === "denied" ? "Bağlantı Reddedildi" : "Reddet (Bağlantıyı Engelle)"}</span>
                        </button>
                      </div>
                      {!decided && (
                        <div className="flex items-center justify-center gap-space-xs py-1 text-on-surface-variant font-label-mono-sm text-label-mono-sm">
                          <span
                            className="material-symbols-outlined text-[16px] text-outline animate-spin"
                            style={{ animationDuration: "4s" }}
                          >
                            hourglass_top
                          </span>
                          <span>
                            Yanıt bekleniyor: Otomatik iptal süresi{" "}
                            <strong className="text-primary font-bold">{secondsRemaining}</strong> sn
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-surface-container px-space-md py-2 flex items-center justify-between text-outline font-label-mono-sm text-label-mono-sm">
                    <div className="flex items-center gap-space-sm">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                        <span>Port 8443 / WebRTC Mesh</span>
                      </span>
                      <span>•</span>
                      <span>Zero-Footprint Mode</span>
                    </div>
                    <span className="font-semibold text-on-surface">Oturum ID: #HSC-583921</span>
                  </div>
                </div>
              </div>
              {/* RIGHT: Complementary Side Information Cards */}
              <div className="xl:col-span-5 flex flex-col gap-space-md">
                <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-primary-fixed/20 rounded-full blur-2xl pointer-events-none"></div>
                  <div className="flex items-center gap-space-xs text-primary font-headline-sm text-headline-sm font-bold">
                    <span className="material-symbols-outlined text-[22px]">gavel</span>
                    <h3>Sıfır Sessiz Erişim (Zero-Trust) İlkesi</h3>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Homak Enterprise mimarisinde hiçbir teknisyen veya süper yönetici, kullanıcı onay ekranını
                    (Interactive Prompt) bypass edemez.
                  </p>
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-space-xs">
                    <div className="flex items-center gap-space-xs text-on-surface font-body-sm text-body-sm font-semibold">
                      <span className="material-symbols-outlined text-tertiary text-[18px]">verified</span>
                      <span>NIST SP 800-47 &amp; ISO 27001 Uyumluluğu</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-outline">
                      Tüm girdi enjeksiyon yetkileri yerel oturum kullanıcısının anlık rızasına bağlıdır. Onay
                      verilmediği sürece ekran verisi tek bir piksel bile dış ağa aktarılmaz.
                    </p>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-primary text-[20px]">terminal</span>
                      <h3 className="font-action-btn text-action-btn font-bold text-on-surface">Canlı Güvenlik &amp; IPC Olay Günlüğü</h3>
                    </div>
                    <span className="font-label-mono-sm text-label-mono-sm text-tertiary bg-tertiary-fixed/30 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
                      CANLI
                    </span>
                  </div>
                  <div className="bg-surface-container-highest p-space-sm rounded-lg flex flex-col gap-1.5 font-label-mono-sm text-label-mono-sm overflow-hidden">
                    <div className="flex items-start gap-space-xs text-on-surface">
                      <span className="text-outline flex-shrink-0">[15:40:48]</span>
                      <span className="text-secondary font-semibold">OPERATOR</span>
                      <span className="truncate">usr_8921 initiated join handshake</span>
                    </div>
                    <div className="flex items-start gap-space-xs text-on-surface">
                      <span className="text-outline flex-shrink-0">[15:40:49]</span>
                      <span className="text-tertiary font-semibold">CRYPTO</span>
                      <span className="truncate">TLS 1.3 key exchange verified (ECDHE-P384)</span>
                    </div>
                    <div className="flex items-start gap-space-xs text-on-surface">
                      <span className="text-outline flex-shrink-0">[15:40:50]</span>
                      <span className="text-primary font-semibold">UI_PROMPT</span>
                      <span className="truncate">Prompting user for interactive consent</span>
                    </div>
                    <div className="flex items-start gap-space-xs text-on-surface">
                      <span className="text-outline flex-shrink-0">[15:40:50]</span>
                      <span className="text-error font-semibold">STATE</span>
                      <span className="truncate">Awaiting CLIENT_APPROVED or CLIENT_REJECTED</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-space-sm">
                  <div className="bg-surface-container-lowest p-space-sm rounded-xl shadow-sm flex flex-col items-center text-center">
                    <span className="font-label-mono-lg text-label-mono-lg text-primary font-bold">0 MB</span>
                    <span className="font-body-sm text-body-sm text-outline mt-0.5">Disk Kalıntısı</span>
                  </div>
                  <div className="bg-surface-container-lowest p-space-sm rounded-xl shadow-sm flex flex-col items-center text-center">
                    <span className="font-label-mono-lg text-label-mono-lg text-tertiary font-bold">100%</span>
                    <span className="font-body-sm text-body-sm text-outline mt-0.5">Attended Onay</span>
                  </div>
                  <div className="bg-surface-container-lowest p-space-sm rounded-xl shadow-sm flex flex-col items-center text-center">
                    <span className="font-label-mono-lg text-label-mono-lg text-secondary font-bold truncate w-full">ChaCha20</span>
                    <span className="font-body-sm text-body-sm text-outline mt-0.5">AES-256 Poly</span>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-action-btn text-action-btn text-on-surface font-semibold">Güvenli Geçit &amp; Coğrafi Konum</span>
                    <span className="font-label-mono-sm text-label-mono-sm text-outline">TR-Marmara Zone</span>
                  </div>
                  <div
                    className="w-full h-32 bg-cover bg-center rounded-lg shadow-inner relative overflow-hidden flex items-end p-2.5"
                    style={{
                      backgroundImage:
                        "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDX3c4JzXmbhR7qAjS5oSAPFP_YP64slTwG3lPYZouXKgo70P5MntXzoOgYrRz_osW5waLOyonRRo6eFaCzkJJ0u8ZqtzT0Scr59ul_DQUv0rmbukOFZ5mU8ZY3RmzHjCN-JPFF1sLmANvRLvlJWRKJtfZAOmeJr68RtYDqP8mJksEl0JtoVUG6d2ClRyOHnjuIiuEw_xpdE3BG1T3W422JgByC9kdrWVOWYOsnqHGehaBXRWMMcVoV')",
                    }}
                  >
                    <div className="bg-surface-container-lowest/90 backdrop-blur-md px-2.5 py-1 rounded-md flex items-center gap-space-xs text-on-surface shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                      <span className="font-label-mono-sm text-label-mono-sm font-semibold">gw-tr-ist-01 • 9ms Latency</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
    </main>
  );
}
