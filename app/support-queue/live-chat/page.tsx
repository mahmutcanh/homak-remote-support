"use client";

import { useEffect, useRef, useState } from "react";
import TechnicianSidebar from "@/components/TechnicianSidebar";
import TechnicianHeader from "@/components/TechnicianHeader";

interface ChatMessage {
  id: string;
  fromTech: boolean;
  senderLabel: string;
  time: string;
  text: string;
  autoAck?: boolean;
}

export default function LiveChatPage() {
  const [seconds, setSeconds] = useState(522); // 08:42
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputLocked, setInputLocked] = useState(false);
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const chatThreadRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (chatThreadRef.current) {
      chatThreadRef.current.scrollTop = chatThreadRef.current.scrollHeight;
    }
  }, [messages]);

  const formatTimer = () => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `00:${m}:${s}`;
  };

  const insertCanned = (text: string) => {
    setMessageInput(text);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = messageInput.trim();
    if (!text) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}`, fromTech: true, senderLabel: "Mahmut Homak (Teknisyen)", time: timeStr, text },
    ]);
    setMessageInput("");

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-ack`,
          fromTech: false,
          senderLabel: "Son Kullanıcı",
          time: timeStr,
          text: "Mesajınız alındı, ekranda bildirim belirdi.",
        },
      ]);
    }, 1800);
  };

  const confirmDisconnect = () => setDisconnectModalOpen(true);
  const closeDisconnectModal = () => setDisconnectModalOpen(false);
  const executeDisconnect = () => {
    closeDisconnectModal();
    alert("Oturum sonlandırıldı. İstemci agentına güvenli çıkış komutu yollandı ve kayıtlar arşivlendi.");
  };

  const toggleSideChatFocus = () => {
    const input = document.getElementById("messageInput");
    input?.focus();
  };

  const downloadTranscript = (format: string) => {
    alert(`Oturum #583921 sohbet transkripti .${format.toUpperCase()} formatında hazırlanıp şifreli paket olarak indiriliyor.`);
  };

  return (
    <>
      <TechnicianSidebar />
      <div className="lg:pl-64">
        <TechnicianHeader />
        <main className="relative pt-16 bg-surface w-full px-gutter-desktop min-h-screen">
          <div className="flex flex-col w-full gap-space-md pb-space-xl">
            {/* Top Bar / Breadcrumb & Status Ribbon */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-space-sm bg-surface-container-lowest p-space-md rounded-xl shadow-sm">
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center gap-space-xs text-on-surface-variant font-label-mono-sm text-label-mono-sm">
                  <span className="hover:text-primary transition-colors cursor-pointer">Homak Remote</span>
                  <span>/</span>
                  <span className="hover:text-primary transition-colors cursor-pointer">Oturumlar</span>
                  <span>/</span>
                  <span className="text-primary font-semibold">Attended #583921</span>
                </div>
                <div className="flex items-center gap-space-sm flex-wrap">
                  <h1 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">
                    Oturum İçi Canlı Destek &amp; Çift Yönlü İletişim
                  </h1>
                  <div className="flex items-center gap-space-xs px-space-sm py-space-xs rounded-full bg-tertiary-container text-on-tertiary-container">
                    <span className="w-2 h-2 rounded-full bg-on-tertiary-container animate-ping"></span>
                    <span className="font-label-mono-sm text-label-mono-sm uppercase font-semibold">CANLI OTURUM AKTİF</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-space-xs flex-wrap">
                <div className="flex items-center gap-space-xs px-space-sm py-space-xs rounded-lg bg-surface-container-low text-on-surface-variant font-label-mono-sm text-label-mono-sm">
                  <span className="material-symbols-outlined text-[16px] text-tertiary">lock</span>
                  <span>TLS 1.3 + ChaCha20 E2EE</span>
                </div>
                <div className="flex items-center gap-space-xs px-space-sm py-space-xs rounded-lg bg-surface-container-low text-on-surface font-label-mono-sm text-label-mono-sm">
                  <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
                  <span className="font-semibold">{formatTimer()}</span>
                </div>
                <div className="flex items-center gap-space-xs px-space-sm py-space-xs rounded-lg bg-surface-container-low text-on-surface font-label-mono-sm text-label-mono-sm">
                  <span className="material-symbols-outlined text-[16px] text-secondary">badge</span>
                  <span>
                    Teknisyen: <strong>Mahmut Homak</strong>
                  </span>
                </div>
              </div>
            </div>
            {/* Primary Workspace Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md items-start">
              {/* LEFT: Remote Screen Canvas */}
              <div className="lg:col-span-8 flex flex-col gap-space-sm">
                <div className="flex items-center justify-between bg-surface-container-lowest px-space-md py-space-xs rounded-xl shadow-sm">
                  <div className="flex items-center gap-space-xs overflow-x-auto">
                    <button className="flex items-center gap-space-xs px-space-sm py-space-xs rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-action-btn text-action-btn transition-colors">
                      <span className="material-symbols-outlined text-[18px] text-primary">content_paste_go</span>
                      <span>Pano Eşitle</span>
                    </button>
                    <button
                      className={`flex items-center gap-space-xs px-space-sm py-space-xs rounded-lg font-action-btn text-action-btn transition-colors ${
                        inputLocked
                          ? "bg-error-container text-on-error-container"
                          : "bg-surface-container-low hover:bg-surface-container text-on-surface"
                      }`}
                      onClick={() => setInputLocked((v) => !v)}
                    >
                      <span className={`material-symbols-outlined text-[18px] ${inputLocked ? "text-error" : "text-secondary"}`}>
                        {inputLocked ? "lock" : "mouse"}
                      </span>
                      <span>{inputLocked ? "Girdi Kilitli" : "Girdi Serbest"}</span>
                    </button>
                    <div className="hidden sm:flex items-center gap-space-xs px-space-sm py-space-xs rounded-lg bg-surface-container text-on-surface-variant font-label-mono-sm text-label-mono-sm">
                      <span className="material-symbols-outlined text-[16px] text-tertiary">videocam</span>
                      <span>1920x1080 @ 60 FPS (12.4 Mbps)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <button
                      className="flex items-center gap-space-xs px-space-sm py-space-xs rounded-lg bg-error text-on-error hover:bg-on-error-container font-action-btn text-action-btn transition-colors shadow-sm"
                      onClick={confirmDisconnect}
                    >
                      <span className="material-symbols-outlined text-[18px]">power_settings_new</span>
                      <span>Desteği Sonlandır</span>
                    </button>
                  </div>
                </div>
                {/* Remote Viewport Simulated Canvas */}
                <div className="relative bg-inverse-surface rounded-xl overflow-hidden aspect-[16/10] shadow-md flex flex-col justify-between p-space-md">
                  <div className="absolute inset-0 bg-gradient-to-tr from-surface-variant via-surface-dim to-surface-container opacity-40"></div>
                  <div className="relative z-10 flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-space-xs bg-inverse-surface/85 backdrop-blur-md px-space-sm py-space-xs rounded-lg shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim"></span>
                      <span className="font-label-mono-sm text-label-mono-sm text-inverse-on-surface">
                        CLIENT: DESKTOP-MAHMUT // Windows 11 Pro 23H2
                      </span>
                    </div>
                    <div className="flex items-center gap-space-xs bg-inverse-surface/85 backdrop-blur-md px-space-sm py-space-xs rounded-lg shadow-sm">
                      <span className="font-label-mono-sm text-label-mono-sm text-tertiary-fixed-dim">Gecikme: 14ms</span>
                    </div>
                  </div>
                  <div className="relative z-10 max-w-lg mx-auto w-full bg-surface-container-lowest/95 backdrop-blur-md rounded-xl p-space-md shadow-xl">
                    <div className="flex items-center justify-between pb-space-xs mb-space-sm">
                      <div className="flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-primary text-[20px]">verified_user</span>
                        <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                          certmgr.msc - Sertifika Doğrulama
                        </span>
                      </div>
                      <div className="flex items-center gap-space-xs">
                        <span className="w-3 h-3 rounded-full bg-surface-container-highest"></span>
                        <span className="w-3 h-3 rounded-full bg-surface-container-highest"></span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-space-xs font-label-mono-sm text-label-mono-sm text-on-surface-variant bg-surface-container-low p-space-sm rounded-lg">
                      <div className="flex justify-between">
                        <span>Kurumsal Kök Sertifika:</span>
                        <span className="text-tertiary font-semibold">HOMAK-CORP-CA-01</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Geçerlilik:</span>
                        <span>2024-2029 (Aktif)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Hata Durumu:</span>
                        <span className="text-error font-semibold">SEC_ERROR_UNKNOWN_ISSUER</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-space-xs mt-space-sm">
                      <button className="px-space-sm py-space-xs bg-surface-container text-on-surface rounded-lg font-action-btn text-action-btn">
                        Vazgeç
                      </button>
                      <button className="px-space-sm py-space-xs bg-primary text-on-primary rounded-lg font-action-btn text-action-btn">
                        Zinciri Düzelt
                      </button>
                    </div>
                  </div>
                  <div className="relative z-10 self-end bg-surface-container-lowest/95 backdrop-blur-md rounded-xl p-space-sm shadow-xl flex items-center gap-space-sm pointer-events-auto">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-primary text-[18px]">support_agent</span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-space-xs">
                        <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                        <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">Homak Client Agent</span>
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">Sohbet penceresi açık • Kontrol aktif</span>
                    </div>
                    <button
                      className="px-space-xs py-space-xs bg-primary-fixed hover:bg-primary-fixed-dim text-on-primary-fixed rounded-lg transition-colors"
                      onClick={toggleSideChatFocus}
                    >
                      <span className="material-symbols-outlined text-[18px]">chat</span>
                    </button>
                  </div>
                  <div
                    className="absolute left-1/3 top-1/2 pointer-events-none flex flex-col items-start gap-space-xs animate-bounce"
                    style={{ animationDuration: "2.5s" }}
                  >
                    <svg className="w-6 h-6 text-primary drop-shadow-md" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4 0l16 12.279-6.951 1.17 4.325 8.817-3.596 1.734-4.35-8.879-5.428 5.879z"></path>
                    </svg>
                    <div className="bg-primary text-on-primary font-label-mono-sm text-label-mono-sm px-space-xs py-0.5 rounded shadow-sm">
                      Mahmut (IT)
                    </div>
                  </div>
                </div>
                {/* Quick Session Status Bar beneath screen */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
                  <div className="flex items-center gap-space-sm bg-surface-container-lowest p-space-sm rounded-xl shadow-sm">
                    <span className="material-symbols-outlined text-primary text-[24px]">speed</span>
                    <div className="flex flex-col">
                      <span className="font-body-sm text-body-sm text-on-surface-variant">Kare Hızı / Bitrate</span>
                      <span className="font-label-mono-sm text-label-mono-sm text-on-surface font-semibold">
                        59.8 FPS / 12,400 kbps
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-sm bg-surface-container-lowest p-space-sm rounded-xl shadow-sm">
                    <span className="material-symbols-outlined text-tertiary text-[24px]">verified</span>
                    <div className="flex flex-col">
                      <span className="font-body-sm text-body-sm text-on-surface-variant">Oturum Şifreleme</span>
                      <span className="font-label-mono-sm text-label-mono-sm text-on-surface font-semibold">
                        ChaCha20-Poly1305
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-sm bg-surface-container-lowest p-space-sm rounded-xl shadow-sm">
                    <span className="material-symbols-outlined text-secondary text-[24px]">folder_shared</span>
                    <div className="flex flex-col">
                      <span className="font-body-sm text-body-sm text-on-surface-variant">Dosya Transfer Havuzu</span>
                      <span className="font-label-mono-sm text-label-mono-sm text-on-surface font-semibold">
                        İzin Verildi (Maks. 250MB)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {/* RIGHT: Dedicated In-Session Live Chat Panel */}
              <div className="lg:col-span-4 flex flex-col bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden h-[740px]">
                <div className="p-space-md bg-surface-container-low flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-sm">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-headline-sm text-headline-sm font-bold">
                          MH
                        </div>
                        <span className="w-3 h-3 rounded-full bg-tertiary absolute bottom-0 right-0"></span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">Canlı Destek Sohbeti</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">DESKTOP-MAHMUT (Kullanıcı)</span>
                      </div>
                    </div>
                    <button
                      className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
                      title="Sohbet Ayarları"
                    >
                      <span className="material-symbols-outlined text-[18px]">tune</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-space-xs bg-surface-container-lowest p-space-xs rounded-lg mt-space-xs">
                    <span className="material-symbols-outlined text-tertiary text-[16px]">lock_clock</span>
                    <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">
                      Uçtan uca şifreli oturum günlüğü (SHA-256)
                    </span>
                  </div>
                </div>
                {/* Quick Canned Support Responses */}
                <div className="px-space-md py-space-xs bg-surface-container flex items-center gap-space-xs overflow-x-auto">
                  <button
                    className="whitespace-nowrap px-space-xs py-space-xs rounded bg-surface-container-lowest hover:bg-surface-container-high text-on-surface font-label-mono-sm text-label-mono-sm transition-colors shadow-sm"
                    onClick={() => insertCanned("Cihaz sistem ve ağ dökümünü almak için onayınızı rica ediyorum.")}
                  >
                    + Cihaz Bilgisi İste
                  </button>
                  <button
                    className="whitespace-nowrap px-space-xs py-space-xs rounded bg-surface-container-lowest hover:bg-surface-container-high text-on-surface font-label-mono-sm text-label-mono-sm transition-colors shadow-sm"
                    onClick={() => insertCanned("İşlem sonrası makinenin yeniden başlatılması gerekebilir.")}
                  >
                    + Yeniden Başlatma
                  </button>
                  <button
                    className="whitespace-nowrap px-space-xs py-space-xs rounded bg-surface-container-lowest hover:bg-surface-container-high text-on-surface font-label-mono-sm text-label-mono-sm transition-colors shadow-sm"
                    onClick={() => insertCanned("Gerekli kök sertifika yamasını iletiyorum.")}
                  >
                    + Sertifika İlet
                  </button>
                </div>
                {/* Message History Thread */}
                <div ref={chatThreadRef} className="flex-1 p-space-md overflow-y-auto flex flex-col gap-space-sm bg-surface-container-lowest">
                  <div className="flex items-center justify-center">
                    <div className="flex items-center gap-space-xs bg-surface-container px-space-sm py-space-xs rounded-full">
                      <span className="material-symbols-outlined text-primary text-[14px]">shield</span>
                      <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">
                        15:41:25 • Güvenli kanal oluşturuldu. TLS 1.3 devrede.
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-space-xs max-w-[85%] self-end">
                    <div className="flex items-center gap-space-xs">
                      <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">15:41:40</span>
                      <span className="font-label-mono-sm text-label-mono-sm text-primary font-semibold">Mahmut Homak (Teknisyen)</span>
                    </div>
                    <div className="bg-primary text-on-primary p-space-sm rounded-2xl rounded-tr-none shadow-sm font-body-md text-body-md">
                      Merhaba, Homak IT ekibinden Mahmut. Bildirdiğiniz yazıcı ve proxy sertifika sorununu incelemek üzere
                      bağlandım.
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-space-xs max-w-[85%] self-start">
                    <div className="flex items-center gap-space-xs">
                      <span className="font-label-mono-sm text-label-mono-sm text-secondary font-semibold">Son Kullanıcı</span>
                      <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">15:42:05</span>
                    </div>
                    <div className="bg-surface-container text-on-surface p-space-sm rounded-2xl rounded-tl-none font-body-md text-body-md shadow-sm">
                      Merhaba Mahmut Bey, özellikle muhasebe portalına girerken SSL geçersiz hatası alıyorum.
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-space-xs max-w-[85%] self-end">
                    <div className="flex items-center gap-space-xs">
                      <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">15:42:30</span>
                      <span className="font-label-mono-sm text-label-mono-sm text-primary font-semibold">Mahmut Homak (Teknisyen)</span>
                    </div>
                    <div className="bg-primary text-on-primary p-space-sm rounded-2xl rounded-tr-none shadow-sm font-body-md text-body-md">
                      Anladım, certmgr üzerinden kök sertifikayı doğruluyorum. Bir onay uyarısı gelirse lütfen ekrandan
                      onaylayın.
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-space-xs max-w-[85%] self-start">
                    <div className="flex items-center gap-space-xs">
                      <span className="font-label-mono-sm text-label-mono-sm text-secondary font-semibold">Son Kullanıcı</span>
                      <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">15:42:55</span>
                    </div>
                    <div className="bg-surface-container text-on-surface p-space-sm rounded-2xl rounded-tl-none font-body-md text-body-md shadow-sm">
                      Tamamdır, takip ediyorum.
                    </div>
                  </div>
                  <div className="flex items-center justify-center my-space-xs">
                    <div className="flex items-center gap-space-xs bg-surface-container-high px-space-sm py-space-xs rounded-lg text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px] text-tertiary">history_edu</span>
                      <span className="font-label-mono-sm text-label-mono-sm">
                        15:43:12 • Teknisyen kök sertifika incelemesi başlattı [#cert-9921]
                      </span>
                    </div>
                  </div>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col gap-space-xs max-w-[85%] ${
                        msg.fromTech ? "items-end self-end" : "items-start self-start"
                      }`}
                    >
                      <div className="flex items-center gap-space-xs">
                        {msg.fromTech ? (
                          <>
                            <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">{msg.time}</span>
                            <span className="font-label-mono-sm text-label-mono-sm text-primary font-semibold">{msg.senderLabel}</span>
                          </>
                        ) : (
                          <>
                            <span className="font-label-mono-sm text-label-mono-sm text-secondary font-semibold">{msg.senderLabel}</span>
                            <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">{msg.time}</span>
                          </>
                        )}
                      </div>
                      <div
                        className={
                          msg.fromTech
                            ? "bg-primary text-on-primary p-space-sm rounded-2xl rounded-tr-none shadow-sm font-body-md text-body-md"
                            : "bg-surface-container text-on-surface p-space-sm rounded-2xl rounded-tl-none font-body-md text-body-md shadow-sm"
                        }
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Realtime Input Area */}
                <div className="p-space-sm bg-surface-container-low flex flex-col gap-space-xs">
                  <form className="flex items-center gap-space-xs" onSubmit={handleSend}>
                    <button
                      className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors shadow-sm"
                      title="Dosya veya Günlük Ekle"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[20px]">attach_file</span>
                    </button>
                    <input
                      autoComplete="off"
                      className="flex-1 bg-surface-container-lowest text-on-surface font-body-md text-body-md px-space-sm py-space-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                      id="messageInput"
                      placeholder="Mesajınızı yazın... (Enter ile gönder)"
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                    />
                    <button
                      className="w-10 h-10 rounded-lg bg-primary hover:bg-primary-container text-on-primary flex items-center justify-center transition-colors shadow-sm"
                      type="submit"
                    >
                      <span className="material-symbols-outlined text-[20px]">send</span>
                    </button>
                  </form>
                  <div className="flex items-center justify-between px-space-xs">
                    <div className="flex items-center gap-space-xs">
                      <input defaultChecked className="w-3.5 h-3.5 rounded text-primary focus:ring-0 cursor-pointer" id="enterSends" type="checkbox" />
                      <label className="font-label-mono-sm text-label-mono-sm text-outline cursor-pointer" htmlFor="enterSends">
                        Hızlı Gönder (Enter)
                      </label>
                    </div>
                    <span className="font-label-mono-sm text-label-mono-sm text-tertiary flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                      Şifreli Soket Bağlı
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* Bottom Audit Strip & Post-Session Security Policy */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-space-md bg-surface-container-low p-space-md rounded-xl shadow-sm">
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface">
                  <span className="material-symbols-outlined text-[22px]">verified_user</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    Zero-Footprint ve Tam Denetim Politikası
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Oturum kapandığında istemci tarafındaki sohbet tampon belleği ve geçici soketler tamamen bellekten
                    silinir; transcript kurumsal arşiv havuzuna kaydedilir.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-space-xs shrink-0">
                <button
                  className="flex items-center gap-space-xs px-space-sm py-space-xs rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-action-btn text-action-btn transition-colors"
                  onClick={() => downloadTranscript("json")}
                >
                  <span className="material-symbols-outlined text-[18px]">data_object</span>
                  <span>Sohbet Kaydı (.JSON)</span>
                </button>
                <button
                  className="flex items-center gap-space-xs px-space-sm py-space-xs rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-action-btn text-action-btn transition-colors"
                  onClick={() => downloadTranscript("txt")}
                >
                  <span className="material-symbols-outlined text-[18px]">description</span>
                  <span>Metin (.TXT)</span>
                </button>
              </div>
            </div>
          </div>
          {/* Safe Confirm Modal */}
          {disconnectModalOpen && (
            <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-space-md">
              <div className="bg-surface-container-lowest rounded-xl max-w-md w-full p-space-lg shadow-2xl flex flex-col gap-space-md">
                <div className="flex items-center gap-space-sm text-error">
                  <span className="material-symbols-outlined text-[28px]">warning</span>
                  <h3 className="font-headline-sm text-headline-sm font-semibold">Oturumu Sonlandır?</h3>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Aktif uzaktan destek oturumu kapatılacaktır. Kullanıcıya oturum özeti gösterilecek ve geçici erişim
                  izinleri derhal kaldırılacaktır.
                </p>
                <div className="flex items-center justify-end gap-space-sm mt-space-xs">
                  <button
                    className="px-space-md py-space-xs rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-action-btn text-action-btn transition-colors"
                    onClick={closeDisconnectModal}
                  >
                    İptal
                  </button>
                  <button
                    className="px-space-md py-space-xs rounded-lg bg-error hover:bg-on-error-container text-on-error font-action-btn text-action-btn transition-colors"
                    onClick={executeDisconnect}
                  >
                    Evet, Bağlantıyı Kes
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
