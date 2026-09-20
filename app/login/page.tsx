"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login as apiLogin, ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiLogin({ username, password });
      localStorage.setItem("homak_tech_token", res.accessToken);
      localStorage.setItem("homak_tech_info", JSON.stringify(res.technician));
      router.push("/support-queue");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Giriş yapılamadı. Lütfen tekrar deneyin.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-surface px-gutter">
      <div className="w-full max-w-md flex flex-col gap-space-lg">
        <div className="flex flex-col items-center gap-space-sm">
          <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-on-primary text-[24px]">terminal</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-headline-lg text-headline-lg text-on-surface font-bold">HOMAK</span>
            <span className="font-label-mono-sm text-label-mono-sm text-primary tracking-wider">ENTERPRISE</span>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-space-md p-space-xl rounded-xl bg-surface-container-lowest shadow-md"
        >
          <div className="flex flex-col gap-1 mb-space-sm">
            <h1 className="font-headline-md text-headline-md text-on-surface font-bold">Teknisyen Girişi</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Homak Remote Attended Support paneline erişmek için giriş yapın.
            </p>
          </div>

          <div className="flex flex-col gap-space-xs">
            <label className="font-label-mono-sm text-label-mono-sm text-outline uppercase font-semibold">
              Kullanıcı Adı
            </label>
            <div className="flex items-center gap-space-xs bg-surface-container-low px-space-sm py-space-sm rounded-lg">
              <span className="material-symbols-outlined text-outline text-[18px]">person</span>
              <input
                className="bg-transparent font-body-md text-body-md text-on-surface outline-none w-full placeholder:text-outline"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ör. mahmut.homak"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-space-xs">
            <label className="font-label-mono-sm text-label-mono-sm text-outline uppercase font-semibold">
              Şifre
            </label>
            <div className="flex items-center gap-space-xs bg-surface-container-low px-space-sm py-space-sm rounded-lg">
              <span className="material-symbols-outlined text-outline text-[18px]">lock</span>
              <input
                className="bg-transparent font-body-md text-body-md text-on-surface outline-none w-full placeholder:text-outline"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-space-xs px-space-sm py-space-sm rounded-lg bg-error-container text-on-error-container font-body-sm text-body-sm">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-space-sm flex items-center justify-center gap-space-xs py-space-md rounded-lg bg-primary-container text-on-primary hover:bg-primary transition-all shadow-md font-action-btn text-action-btn disabled:opacity-60"
          >
            {loading ? (
              <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[20px]">login</span>
            )}
            <span>{loading ? "Giriş yapılıyor..." : "Giriş Yap"}</span>
          </button>
        </form>

        <p className="text-center font-body-sm text-body-sm text-on-surface-variant">
          Bu panel yalnızca yetkili Homak teknisyenleri içindir.
        </p>
      </div>
    </main>
  );
}
