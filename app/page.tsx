"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { login as apiLogin, verifyCode, ApiError } from "@/lib/api";

export default function HomePage() {
  const router = useRouter();

  // Active Tab: 'client' (Destek Kodu) or 'tech' (Teknisyen Girişi)
  const [activeTab, setActiveTab] = useState<"client" | "tech">("client");

  // Client Support Code State
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [downloading, setDownloading] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Technician Login State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Handle digit change for 6-box input
  const handleDigitChange = (index: number, value: string) => {
    const val = value.replace(/\D/g, "");
    const next = [...digits];
    next[index] = val ? val.slice(-1) : "";
    setDigits(next);
    setClientError(null);

    if (val && index < 5) {
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
    if (!pasted) return;
    const next = [...digits];
    pasted.split("").forEach((char, i) => {
      if (i < 6) next[i] = char;
    });
    setDigits(next);
    setClientError(null);
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join("");
    if (code.length !== 6) {
      setClientError("Lütfen 6 haneli destek kodunun tamamını giriniz.");
      return;
    }

    setDownloading(true);
    setClientError(null);

    try {
      const hostname =
        typeof window !== "undefined" && window.navigator ? (window.navigator.platform || "Web İstemcisi") : "Web İstemcisi";
      await verifyCode({ code, hostname, clientVersion: "web-portal-1.0" });

      // Trigger download of the customized agent with support code in filename
      const downloadUrl = `/api/download-desktop-agent/${code}`;
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `HomakDesktopAgent-${code}.exe`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          setClientError("Girdiğiniz destek kodu bulunamadı. Lütfen kodu kontrol edin.");
        } else if (err.status === 410) {
          setClientError("Destek kodunun süresi dolmuş. Lütfen teknisyeninizden yeni kod isteyin.");
        } else {
          setClientError(err.message || "Destek kodu doğrulanamadı.");
        }
      } else {
        setClientError("Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.");
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const res = await apiLogin({ username, password });
      localStorage.setItem("homak_tech_token", res.accessToken);
      localStorage.setItem("homak_tech_info", JSON.stringify(res.technician));
      router.push("/support-queue");
    } catch (err) {
      if (err instanceof ApiError) {
        setLoginError(err.message);
      } else {
        setLoginError("Giriş yapılamadı. Kullanıcı adı veya şifrenizi kontrol edin.");
      }
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-800 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <header className="w-full border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <span className="material-symbols-outlined text-white text-[20px]">desktop_windows</span>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-slate-900 flex items-center gap-1.5">
                HOMAK <span className="text-blue-600 font-semibold text-xs px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200">REMOTE</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wider">UZAKTAN DESTEK PLATFORMU</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Center Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xl shadow-slate-200/60 overflow-hidden">
            {/* Tab Selector */}
            <div className="grid grid-cols-2 p-1.5 bg-slate-100/90 border-b border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab("client")}
                className={`py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === "client"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">key</span>
                <span>Destek Kodu</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("tech")}
                className={`py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === "tech"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">lock</span>
                <span>Teknisyen Girişi</span>
              </button>
            </div>

            {/* TAB 1: MÜŞTERİ DESTEK KODU */}
            {activeTab === "client" && (
              <div className="p-8 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-4 shadow-xs">
                  <span className="material-symbols-outlined text-[26px]">connect_without_contact</span>
                </div>

                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight mb-1">
                  Uzaktan Destek Alın
                </h1>
                <p className="text-xs text-slate-500 max-w-xs mb-6">
                  Teknisyeninizin sağladığı 6 haneli destek kodunu girerek oturumu başlatın.
                </p>

                <form onSubmit={handleClientSubmit} className="w-full flex flex-col items-center gap-5">
                  {/* 6 Digit Input Boxes */}
                  <div className="flex gap-2.5 justify-center" onPaste={handlePaste}>
                    {digits.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => {
                          inputRefs.current[i] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        autoFocus={i === 0}
                        className="w-12 h-14 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-center text-2xl font-bold font-mono text-slate-900 outline-none transition-all shadow-xs focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)]"
                      />
                    ))}
                  </div>

                  {clientError && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium">
                      <span className="material-symbols-outlined text-[16px]">error</span>
                      <span>{clientError}</span>
                    </div>
                  )}

                  {downloadSuccess && (
                    <div className="w-full p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs text-left flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-[18px] text-emerald-600 shrink-0 mt-0.5">
                        check_circle
                      </span>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-emerald-950">İstemci İndirildi!</span>
                        <span className="text-[11px] text-emerald-800 leading-relaxed">
                          İndirilen <strong>HomakDesktopAgent.exe</strong> dosyasını açın. Kodunuz otomatik tanımlanacak ve teknisyeniniz onay talep edecektir.
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={downloading}
                    className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {downloading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        <span>Doğrulanıyor ve İndiriliyor...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">download</span>
                        <span>{downloadSuccess ? "Tekrar İndir" : "Desteği Başlat"}</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: TEKNİSYEN GİRİŞİ */}
            {activeTab === "tech" && (
              <div className="p-8">
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-3 shadow-xs">
                    <span className="material-symbols-outlined text-[26px]">badge</span>
                  </div>
                  <h1 className="text-xl font-extrabold text-slate-900 tracking-tight mb-1">
                    Teknisyen Girişi
                  </h1>
                  <p className="text-xs text-slate-500 max-w-xs">
                    Homak Uzaktan Destek konsoluna erişmek için kimlik bilgilerinizle giriş yapın.
                  </p>
                </div>

                <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Kullanıcı Adı
                    </label>
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 focus-within:border-blue-600 focus-within:bg-white px-3 py-2.5 rounded-xl transition-all shadow-2xs">
                      <span className="material-symbols-outlined text-slate-400 text-[18px]">person</span>
                      <input
                        type="text"
                        autoComplete="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="ör. mahmut.homak"
                        required
                        className="bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none w-full"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Şifre
                    </label>
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 focus-within:border-blue-600 focus-within:bg-white px-3 py-2.5 rounded-xl transition-all shadow-2xs">
                      <span className="material-symbols-outlined text-slate-400 text-[18px]">lock</span>
                      <input
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none w-full"
                      />
                    </div>
                  </div>

                  {loginError && (
                    <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-rose-500 shrink-0">error</span>
                      <span>{loginError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full mt-2 py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loginLoading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        <span>Giriş Yapılıyor...</span>
                      </>
                    ) : (
                      <>
                        <span>Konsola Giriş Yap</span>
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between text-[11px]">
          <span>© 2026 Homak Technologies Inc.</span>
          <span className="text-slate-400 font-medium">Uçtan Uca Şifreli Güvenli Destek</span>
        </div>
      </footer>
    </div>
  );
}
