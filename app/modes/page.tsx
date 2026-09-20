"use client";

import { useState } from "react";

export default function ModesPage() {
  const [simStatus, setSimStatus] = useState<"idle" | "pending" | "elevated">("idle");

  const simulateElevation = () => {
    setSimStatus("pending");
    setTimeout(() => {
      setSimStatus("elevated");
    }, 2400);
  };

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 w-full px-margin-desktop flex items-center justify-between">
          <div className="flex items-center gap-space-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-on-primary">
                <span className="material-symbols-outlined text-[18px]">hub</span>
              </div>
              <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-bold">HOMAK</span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-mono-sm text-label-mono-sm">
                ENTERPRISE
              </span>
            </div>
            <div className="hidden md:flex items-center gap-2 px-space-md py-space-xs rounded-full bg-surface-container-low">
              <span className="material-symbols-outlined text-[16px] text-tertiary">shield</span>
              <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">TLS 1.3 / ChaCha20</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-space-sm">
            <a className="px-space-md py-space-xs text-on-surface-variant hover:text-on-surface transition-colors font-action-btn text-action-btn" href="#">
              Quick Connect
            </a>
            <a className="px-space-md py-space-xs text-on-surface-variant hover:text-on-surface transition-colors font-action-btn text-action-btn" href="#">
              Active Rooms
            </a>
            <a className="px-space-md py-space-xs text-on-surface-variant hover:text-on-surface transition-colors font-action-btn text-action-btn" href="#">
              Cryptographic Spec
            </a>
            <a
              aria-current="page"
              className="px-space-md py-space-xs transition-colors bg-surface-container text-on-surface font-semibold rounded-lg"
              href="#"
            >
              Agent Binaries
            </a>
          </nav>
          <div className="flex items-center gap-space-md">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
            </div>
          </div>
        </div>
      </header>
      <main className="w-full pt-16 bg-surface">
        <div className="flex flex-col w-full">
          {/* Top Ambient Banner & Architecture Overview */}
          <section className="relative w-full px-margin-desktop py-space-xl overflow-hidden">
            <div className="absolute -top-32 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute top-10 left-10 w-72 h-72 bg-tertiary/5 rounded-full blur-2xl pointer-events-none"></div>
            <div className="max-w-[1240px] mx-auto flex flex-col gap-space-lg relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-space-md">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface font-label-mono-sm text-label-mono-sm font-semibold shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                    NIST SP 800-47 PROTOCOL
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface font-label-mono-sm text-label-mono-sm font-semibold shadow-sm">
                    <span className="material-symbols-outlined text-[14px] text-primary">security_update_good</span>
                    UAC ELEVATION ON DEMAND
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface font-label-mono-sm text-label-mono-sm font-semibold shadow-sm">
                    <span className="material-symbols-outlined text-[14px] text-tertiary">cleaning_services</span>
                    ZERO-FOOTPRINT EPHEMERAL
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface font-label-mono-sm text-label-mono-sm font-semibold shadow-sm">
                    <span className="material-symbols-outlined text-[14px] text-secondary">verified_user</span>
                    NON-ADMIN FRIENDLY
                  </span>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant font-label-mono-sm text-label-mono-sm bg-surface-container-low px-3 py-1 rounded">
                  <span className="material-symbols-outlined text-[14px] text-tertiary">terminal</span>
                  <span>DISPATCH HOST: SOV-GATE-04.HOMAK.CORP</span>
                </div>
              </div>
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg">
                <div className="flex flex-col gap-2 max-w-3xl">
                  <span className="text-primary font-label-mono-sm text-label-mono-sm uppercase tracking-widest font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">account_tree</span>
                    HOMAK REMOTE ATTENDED MİMARİSİ
                  </span>
                  <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">
                    2 Kademeli Geçici Destek Mimarisi
                  </h1>
                  <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                    Kullanıcı ortamına ve yapılacak müdahalenin derinliğine göre optimize edilmiş iki bağımsız çalıştırma
                    modeli. Kurumsal Zero-Trust güvenlik standartlarına tam uyumlu, kalıntısız (zero-footprint) uzaktan
                    oturum altyapısı.
                  </p>
                </div>
                <div className="bg-surface-container-low p-space-md rounded-xl flex items-center gap-4 shadow-sm shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[26px]">tune</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">ÖNERİLEN ÇALIŞTIRMA</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">Hibrit Oturum Başlatma</span>
                    <span className="font-body-sm text-body-sm text-tertiary flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                      Standart Mod başlatılıp ihtiyaç anında UAC&apos;ye yükseltilebilir
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* Dual Mode Comparison Cards Grid */}
          <section className="w-full px-margin-desktop py-space-md">
            <div className="max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-space-lg items-stretch">
              {/* CARD 1: STANDART KULLANICI MODU */}
              <div className="relative bg-surface-container-lowest rounded-xl shadow-md p-space-lg flex flex-col justify-between transition-all duration-300 hover:shadow-xl">
                <div className="flex flex-col gap-space-md">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-lg bg-tertiary/10 text-tertiary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[24px]">desktop_windows</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-mono-sm text-label-mono-sm text-tertiary font-bold tracking-wider">
                          LEVEL 01 • TEMEL KULLANICI DÜZEYİ
                        </span>
                        <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">Standart Kullanıcı Modu</h2>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-mono-sm text-label-mono-sm font-bold shadow-sm">
                      <span className="material-symbols-outlined text-[15px]">check_circle</span>
                      YÖNETİCİ ŞİFRESİ İSTEMEZ
                    </span>
                  </div>
                  <div className="bg-surface-container-low p-space-md rounded-lg flex items-start gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant text-[20px] shrink-0 mt-0.5">group</span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      <strong className="text-on-surface font-semibold">Hedef Kitle:</strong> Standart şirket çalışanları,
                      kısıtlı Active Directory domain hesapları ve yerel bilgisayar yönetici parolasına sahip olmayan son
                      kullanıcılar için anında erişim.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 p-space-md bg-surface-container rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[18px]">file_open</span>
                        <span className="font-label-mono-lg text-label-mono-lg text-on-surface font-bold">
                          HomakSupport-User.exe
                        </span>
                      </div>
                      <span className="font-label-mono-sm text-label-mono-sm px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant">
                        4.2 MB • PE32+ Portable
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Sıfır kurulum. Tamamen kullanıcı oturum yetkileriyle{" "}
                      <code className="font-label-mono-sm bg-surface-container-highest px-1.5 py-0.5 rounded text-on-surface">
                        %LOCALAPPDATA%\Temp
                      </code>{" "}
                      altında geçici RAM belleğinde çalışır.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="font-label-mono-sm text-label-mono-sm text-tertiary uppercase font-bold tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      Özellikler &amp; Kapsam (Tam Yetkili)
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-start gap-2.5 p-2 rounded bg-surface-container-low">
                        <span className="material-symbols-outlined text-tertiary text-[18px] shrink-0 mt-0.5">screen_share</span>
                        <span className="font-body-md text-body-md text-on-surface">
                          Kullanıcı masaüstü ultra düşük gecikmeli ekran paylaşımı ve canlı izleme
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5 p-2 rounded bg-surface-container-low">
                        <span className="material-symbols-outlined text-tertiary text-[18px] shrink-0 mt-0.5">mouse</span>
                        <span className="font-body-md text-body-md text-on-surface">
                          Kullanıcı alanı yazılımlarında (MS 365, Teams, Chrome, SAP, ERP) tam fare/klavye kontrolü
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5 p-2 rounded bg-surface-container-low">
                        <span className="material-symbols-outlined text-tertiary text-[18px] shrink-0 mt-0.5">folder_shared</span>
                        <span className="font-body-md text-body-md text-on-surface">
                          Masaüstü, İndirilenler ve Belgeler dizinlerine onaylı dosya aktarımı
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5 p-2 rounded bg-surface-container-low">
                        <span className="material-symbols-outlined text-tertiary text-[18px] shrink-0 mt-0.5">chat</span>
                        <span className="font-body-md text-body-md text-on-surface">
                          Entegre teknisyen sohbeti ve sistem tanılama (dxdiag, systeminfo özeti)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="font-label-mono-sm text-label-mono-sm text-error uppercase font-bold tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">block</span>
                      Güvenlik Kısıtlamaları (Windows Sandbox Sınırı)
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-start gap-2.5 p-2 rounded bg-error-container/40 text-on-error-container">
                        <span className="material-symbols-outlined text-error text-[18px] shrink-0 mt-0.5">visibility_off</span>
                        <span className="font-body-sm text-body-sm">
                          <strong>UAC Siyah Ekran Kısıtı:</strong> Yönetici onayı gerektiren bir pencere açıldığında
                          Windows Secure Desktop devreye girer; ekran teknisyene kararır ve tıklanamaz.
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5 p-2 rounded bg-error-container/40 text-on-error-container">
                        <span className="material-symbols-outlined text-error text-[18px] shrink-0 mt-0.5">settings_suggest</span>
                        <span className="font-body-sm text-body-sm">
                          Windows Hizmetleri (services.msc), C:\Program Files, HKEY_LOCAL_MACHINE Kayıt Defteri ve Sürücü
                          kurulumları yapılamaz.
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5 p-2 rounded bg-error-container/40 text-on-error-container">
                        <span className="material-symbols-outlined text-error text-[18px] shrink-0 mt-0.5">lock</span>
                        <span className="font-body-sm text-body-sm">
                          Uzaktan <strong>Ctrl+Alt+Del</strong> komutu gönderilemez ve Kilit Ekranı (Lock Screen)
                          açılamaz.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-space-md pt-space-lg">
                  <div className="flex items-center justify-between p-space-sm bg-surface-container rounded-lg font-label-mono-sm text-label-mono-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                      <span className="text-on-surface-variant">Çalışma Modu:</span>
                      <span className="text-on-surface font-semibold">User Space (Medium IL)</span>
                    </div>
                    <span className="text-on-surface-variant">Oturum: ahmet.yilmaz (PID: 5820)</span>
                  </div>
                  <button className="w-full h-12 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary font-action-btn text-action-btn flex items-center justify-center gap-2 shadow-sm transition-all duration-200">
                    <span className="material-symbols-outlined text-[20px]">download</span>
                    Standart Modu Başlat (Yönetici İstemez — 4.2 MB)
                  </button>
                </div>
              </div>
              {/* CARD 2: YÜKSELTİLMİŞ YÖNETİCİ MODU */}
              <div className="relative bg-surface-container-lowest rounded-xl shadow-md p-space-lg flex flex-col justify-between transition-all duration-300 hover:shadow-xl">
                <div className="absolute top-0 right-8 px-3 py-1 bg-primary text-on-primary rounded-b-lg font-label-mono-sm text-label-mono-sm font-semibold tracking-wider flex items-center gap-1 shadow-md">
                  <span className="material-symbols-outlined text-[13px]">verified</span>
                  TAM SİSTEM YETKİSİ
                </div>
                <div className="flex flex-col gap-space-md">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[24px]">shield</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-mono-sm text-label-mono-sm text-primary font-bold tracking-wider">
                          LEVEL 02 • SİSTEM SERVİS ENJEKSİYONU
                        </span>
                        <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">Yükseltilmiş Yönetici Modu</h2>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-mono-sm text-label-mono-sm font-bold shadow-sm">
                      <span className="material-symbols-outlined text-[15px]">admin_panel_settings</span>
                      UAC YÖNETİCİ AYRICALIĞI
                    </span>
                  </div>
                  <div className="bg-surface-container-low p-space-md rounded-lg flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">engineering</span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      <strong className="text-on-surface font-semibold">Hedef Kitle:</strong> Kurumsal Sistem
                      Mühendisleri, Helpdesk Seviye 2/3 teknisyenleri, derin kayıt defteri düzeltmeleri, MSI paket
                      kurulumları ve işletim sistemi onarımı gerçekleştiren BT personeli.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 p-space-md bg-surface-container rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
                        <span className="font-label-mono-lg text-label-mono-lg text-on-surface font-bold">
                          HomakSupport-Elevated.exe
                        </span>
                      </div>
                      <span className="font-label-mono-sm text-label-mono-sm px-2 py-0.5 rounded bg-primary-container text-on-primary font-bold">
                        4.8 MB • NT Hook Service
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Kalıcı arka plan servisi kurmaz. Oturum süresince geçici{" "}
                      <code className="font-label-mono-sm bg-surface-container-highest px-1.5 py-0.5 rounded text-on-surface">
                        HomakServiceHook
                      </code>{" "}
                      başlatılır, oturum sonlandığı anda tamamen diskten silinir.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="font-label-mono-sm text-label-mono-sm text-primary uppercase font-bold tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">task_alt</span>
                      Tam Yetkili Sistem Kapsamı
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-start gap-2.5 p-2 rounded bg-surface-container-low">
                        <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">lock_open</span>
                        <span className="font-body-md text-body-md text-on-surface">
                          <strong>Windows Güvenli Masaüstü (Secure Desktop):</strong> UAC onay ve şifre pencerelerini
                          kesintisiz görüntüleme ve tıklama
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5 p-2 rounded bg-surface-container-low">
                        <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">restart_alt</span>
                        <span className="font-body-md text-body-md text-on-surface">
                          <strong>Reboot &amp; Reconnect:</strong> Bilgisayarı uzaktan Yeniden Başlatma, Güvenli Modda
                          (Safe Mode with Networking) açma ve otomatik oturuma dönme
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5 p-2 rounded bg-surface-container-low">
                        <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">
                          keyboard_command_key
                        </span>
                        <span className="font-body-md text-body-md text-on-surface">
                          <strong>Ctrl+Alt+Del Simülasyonu:</strong> Windows oturum açma ve kilit ekranı arayüzlerini
                          uzaktan açıp kimlik doğrulama
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5 p-2 rounded bg-surface-container-low">
                        <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">
                          developer_board
                        </span>
                        <span className="font-body-md text-body-md text-on-surface">
                          <strong>HKLM &amp; System32 Tam Erişim:</strong> Registry, Event Viewer, Services.msc ve
                          CertMgr üzerinde kısıtlamasız operasyon
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant uppercase font-bold tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">alt_route</span>
                      Çalıştırma Metotları
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-on-surface-variant font-body-sm text-body-sm">
                      <div className="p-2.5 rounded bg-surface-container">
                        <span className="font-semibold text-on-surface block mb-1">Yöntem A: Doğrudan</span>
                        <span>İndirilen dosyaya sağ tıklayıp &quot;Yönetici Olarak Çalıştır&quot; seçilerek açılır.</span>
                      </div>
                      <div className="p-2.5 rounded bg-surface-container">
                        <span className="font-semibold text-on-surface block mb-1">Yöntem B: Dinamik</span>
                        <span>Standart oturum sırasında teknisyenin tek tıkla UAC daveti istemesiyle yükseltilir.</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-space-md pt-space-lg">
                  <div className="flex items-center justify-between p-space-sm bg-surface-container rounded-lg font-label-mono-sm text-label-mono-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                      <span className="text-on-surface-variant">Çalışma Modu:</span>
                      <span className="text-on-surface font-semibold">NT AUTHORITY\SYSTEM (High IL)</span>
                    </div>
                    <span className="text-primary font-bold">Secure Desktop Hook: ACTIVE</span>
                  </div>
                  <button className="w-full h-12 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-action-btn text-action-btn flex items-center justify-center gap-2 shadow-md transition-all duration-200">
                    <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                    Yönetici Modunu Başlat (UAC Yetkili — 4.8 MB)
                  </button>
                </div>
              </div>
            </div>
          </section>
          {/* In-Session Dynamic Elevation Workflow Section */}
          <section className="w-full px-margin-desktop py-space-xl">
            <div className="max-w-[1240px] mx-auto bg-surface-container-lowest rounded-xl shadow-md p-space-xl flex flex-col gap-space-lg">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-secondary-container"></span>
                    <span className="font-label-mono-sm text-label-mono-sm text-secondary font-bold uppercase tracking-wider">
                      KESİNTİSİZ HİBRİT GEÇİŞ
                    </span>
                  </div>
                  <h3 className="font-headline-lg text-headline-lg text-on-surface font-bold">
                    Oturum İçi Dinamik Yetki Yükseltme Akışı (Elevation on Demand)
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Kullanıcı oturumu Standart Mod ile başlatsa bile görüşmeyi kapatmaya gerek yoktur. Teknisyen tek bir
                    butona tıklayarak oturumu anında Yönetici Moduna yükseltebilir.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-surface-container px-3 py-1.5 rounded-lg shrink-0">
                  <span className="material-symbols-outlined text-primary text-[20px]">timer</span>
                  <span className="font-label-mono-sm text-label-mono-sm text-on-surface font-semibold">
                    GEÇİŞ SÜRESİ: &lt; 3 SANİYE
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md relative">
                <div className="bg-surface-container-low p-space-lg rounded-xl flex flex-col gap-space-sm relative">
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-full bg-surface-container-highest text-on-surface flex items-center justify-center font-label-mono-sm text-label-mono-sm font-bold">
                      01
                    </span>
                    <span className="font-label-mono-sm text-label-mono-sm px-2 py-0.5 rounded bg-tertiary/10 text-tertiary font-bold">
                      AKTİF OTURUM
                    </span>
                  </div>
                  <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-1">
                    Standart Oturum Açık
                  </h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Son kullanıcı `HomakSupport-User.exe` ile bağlanmıştır. Kullanıcı seviyesindeki ekran paylaşımı ve
                    sohbet akıcı şekilde devam eder.
                  </p>
                  <div className="mt-2 p-2 rounded bg-surface-container font-label-mono-sm text-label-mono-sm text-on-surface-variant flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-tertiary">check</span>
                    <span>UAC olmadan 10 saniyede başlar</span>
                  </div>
                </div>
                <div className="bg-surface-container-low p-space-lg rounded-xl flex flex-col gap-space-sm relative">
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-mono-sm text-label-mono-sm font-bold">
                      02
                    </span>
                    <span className="font-label-mono-sm text-label-mono-sm px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
                      TEKNİSYEN TETİĞİ
                    </span>
                  </div>
                  <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-1">
                    UAC Yetki Talebi İletilir
                  </h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Teknisyen konsolundaki &quot;Yetki Yükselt (Elevate)&quot; butonuna tıklar. Kullanıcının masaüstüne
                    sistem seviyesinde güvenli bir UAC onay kutusu gelir.
                  </p>
                  <div className="mt-2 p-2 rounded bg-surface-container font-label-mono-sm text-label-mono-sm text-on-surface-variant flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-primary">touch_app</span>
                    <span>Kullanıcı &apos;Evet&apos; der veya BT şifresi girer</span>
                  </div>
                </div>
                <div className="bg-surface-container-low p-space-lg rounded-xl flex flex-col gap-space-sm relative">
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center font-label-mono-sm text-label-mono-sm font-bold">
                      03
                    </span>
                    <span className="font-label-mono-sm text-label-mono-sm px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold">
                      SYSTEM ELEVATION
                    </span>
                  </div>
                  <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-1">
                    Oturum Kopmadan Yükselir
                  </h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Onay verildiği an arka planda geçici NT Hook servisi ayağa kalkar. Oturum kopmadan saniyeler içinde
                    Tam Yönetici yetkilerine kavuşulur.
                  </p>
                  <div className="mt-2 p-2 rounded bg-surface-container font-label-mono-sm text-label-mono-sm text-on-surface-variant flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-tertiary">lock_open</span>
                    <span>UAC Secure Desktop tam kontrol edilir</span>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container p-space-md rounded-xl flex flex-col md:flex-row items-center justify-between gap-space-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-highest text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">bolt</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-bold">Canlı Yükseltme Simülatörü</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Destek sırasında yetki geçişinin nasıl gerçekleştiğini test edin:
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    className="h-10 px-4 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-action-btn text-action-btn flex items-center gap-2 transition-colors disabled:opacity-50"
                    disabled={simStatus === "pending"}
                    onClick={simulateElevation}
                  >
                    <span className="material-symbols-outlined text-[18px]">upgrade</span>
                    <span>Oturum İçi Yükseltmeyi Simüle Et</span>
                  </button>
                  <div className="font-label-mono-sm text-label-mono-sm px-3 py-2 rounded bg-surface-container-highest text-on-surface-variant">
                    {simStatus === "idle" && "Şu anki Durum: Standart Mod (Non-Admin)"}
                    {simStatus === "pending" && (
                      <span className="text-primary font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span> UAC Onayı
                        Bekleniyor...
                      </span>
                    )}
                    {simStatus === "elevated" && (
                      <span className="text-tertiary font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span> Yükseltildi: NT
                        AUTHORITY\SYSTEM (Secure Desktop Aktif)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* Comprehensive Feature Comparison Table */}
          <section className="w-full px-margin-desktop py-space-xl">
            <div className="max-w-[1240px] mx-auto flex flex-col gap-space-md">
              <div className="flex flex-col gap-1">
                <span className="font-label-mono-sm text-label-mono-sm text-primary font-bold uppercase tracking-wider">
                  MATRİS KARŞILAŞTIRMASI
                </span>
                <h3 className="font-headline-lg text-headline-lg text-on-surface font-bold">
                  Ayrıntılı Yetki ve Mimari Matrisi
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Standart Mod ile Yükseltilmiş Yönetici Modu arasındaki teknik kabiliyet ve işletim sistemi müdahale
                  sınırları.
                </p>
              </div>
              <div className="w-full bg-surface-container-lowest rounded-xl shadow-md overflow-hidden">
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-high text-on-surface font-label-mono-sm text-label-mono-sm uppercase tracking-wider">
                        <th className="py-4 px-6 font-semibold">Özellik / Sistem Yetkisi</th>
                        <th className="py-4 px-6 font-semibold text-tertiary">Standart Mod (Non-Admin)</th>
                        <th className="py-4 px-6 font-semibold text-primary">Yükseltilmiş Yönetici Modu</th>
                      </tr>
                    </thead>
                    <tbody className="font-body-md text-body-md text-on-surface">
                      <tr className="hover:bg-surface-container-low transition-colors">
                        <td className="py-4 px-6 font-semibold flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">password</span>
                          UAC / Yönetici Şifresi Gereksinimi
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1 text-tertiary font-semibold">
                            <span className="material-symbols-outlined text-[16px]">check</span>
                            KESİNLİKLE İSTEMEZ (Sıfır İzin)
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1 text-on-surface font-semibold">
                            <span className="material-symbols-outlined text-[16px] text-primary">info</span>
                            Evet (Tek tık UAC onayı veya yerel parola)
                          </span>
                        </td>
                      </tr>
                      <tr className="bg-surface-container-lowest hover:bg-surface-container-low transition-colors">
                        <td className="py-4 px-6 font-semibold flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">delete_sweep</span>
                          Kurulum &amp; Disk Kalıntısı
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-on-surface-variant">Yok • Tamamen RAM üzerinde ve geçici AppData alanında çalışır</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-on-surface font-medium">
                            Yok • Oturum bittiğinde geçici NT Hook servisi diskten tamamen silinir
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-surface-container-low transition-colors">
                        <td className="py-4 px-6 font-semibold flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">shield_lock</span>
                          Windows UAC Güvenli Masaüstü (Secure Desktop)
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1 text-error font-semibold">
                            <span className="material-symbols-outlined text-[16px]">cancel</span>
                            Kısıtlı (UAC belirdiğinde ekran kararır)
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1 text-tertiary font-semibold">
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                            Tam Denetim (UAC ekranında fare ve klavye aktif)
                          </span>
                        </td>
                      </tr>
                      <tr className="bg-surface-container-lowest hover:bg-surface-container-low transition-colors">
                        <td className="py-4 px-6 font-semibold flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">settings</span>
                          Sistem Servisleri &amp; Kayıt Defteri (Registry)
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-on-surface-variant">Yalnızca HKEY_CURRENT_USER (HKCU) ve kullanıcı izinleri</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-on-surface font-medium">HKLM, System32, Sürücüler ve services.msc Tam Yetkili</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-surface-container-low transition-colors">
                        <td className="py-4 px-6 font-semibold flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">restart_alt</span>
                          Oturum İçinde Yeniden Başlatma &amp; Yeniden Bağlanma
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-error font-medium">Desteklemez (Cihaz kapanırsa oturum biter)</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1 text-tertiary font-semibold">
                            <span className="material-symbols-outlined text-[16px]">sync</span>
                            Reboot &amp; Reconnect (Güvenli Mod Destekli)
                          </span>
                        </td>
                      </tr>
                      <tr className="bg-surface-container-lowest hover:bg-surface-container-low transition-colors">
                        <td className="py-4 px-6 font-semibold flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">keyboard</span>
                          Ctrl+Alt+Del Tuş Kombinasyonu Enjeksiyonu
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-error font-medium">Hayır (Windows Güvenlik Mimarisi Engeller)</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1 text-tertiary font-semibold">
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                            Evet (Sistem Seviyesi Girdisi Gönderilebilir)
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-surface-container-low transition-colors">
                        <td className="py-4 px-6 font-semibold flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">upgrade</span>
                          Oturum İçi Yükseltme Geçişi (Dynamic Upgrade)
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-primary font-bold">Tek tıkla Yönetici Moduna Yükseltilebilir</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-on-surface-variant">Zaten En Yüksek Ayrıcalık Seviyesinde</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
          {/* Interactive Terminal / Quick Verification Section */}
          <section className="w-full px-margin-desktop py-space-lg mb-space-xl">
            <div className="max-w-[1240px] mx-auto bg-inverse-surface text-inverse-on-surface rounded-xl p-space-lg shadow-xl flex flex-col lg:flex-row items-center justify-between gap-space-lg">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 font-label-mono-sm text-label-mono-sm text-secondary-container">
                  <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse"></span>
                  <span>ENTERPRISE DISPATCH COMMAND CLI</span>
                </div>
                <h4 className="font-headline-md text-headline-md font-bold">
                  Tek Tık Oturum Başlatma ve Dağıtım Parametreleri
                </h4>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  BT ekipleri Intune, SCCM veya komut istemi üzerinden sessiz parametrelerle ilgili modu doğrudan
                  çağırabilir:
                </p>
                <div className="bg-black/30 p-3 rounded-lg font-label-mono-sm text-label-mono-sm text-on-tertiary-container flex items-center justify-between mt-1">
                  <code>HomakSupport.exe --mode=elevated --require-token=AUTH-9920-X --zero-cleanup</code>
                  <button
                    className="hover:text-on-tertiary transition-colors"
                    title="Kopyala"
                    onClick={() =>
                      navigator.clipboard
                        ?.writeText("HomakSupport.exe --mode=elevated --require-token=AUTH-9920-X --zero-cleanup")
                        .catch(() => {})
                    }
                  >
                    <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  </button>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-space-md shrink-0">
                <button className="h-11 px-6 rounded-lg bg-surface-container-lowest text-on-surface font-action-btn text-action-btn flex items-center gap-2 hover:bg-surface-container transition-colors shadow-sm">
                  <span className="material-symbols-outlined text-[18px]">terminal</span>
                  CLI Rehberini İncele
                </button>
                <button className="h-11 px-6 rounded-lg bg-primary-container text-on-primary font-action-btn text-action-btn flex items-center gap-2 hover:bg-primary transition-colors shadow-sm">
                  <span className="material-symbols-outlined text-[18px]">download_for_offline</span>
                  Tüm Agent Paketlerini İndir (.ZIP)
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
      <footer className="w-full bg-surface-container-low py-space-xl">
        <div className="w-full px-margin-desktop flex flex-col md:flex-row items-center justify-between gap-space-md">
          <div className="flex flex-col gap-1">
            <span className="font-headline-sm text-headline-sm text-on-surface">Homak Remote Attended Ecosystem</span>
            <span className="text-on-surface-variant font-body-sm text-body-sm">
              © 2024 Homak Security Infrastructure Systems Ltd. Sovereign Zero-Trust Protocols Enforced.
            </span>
          </div>
          <div className="flex items-center gap-space-lg text-on-surface-variant font-body-sm text-body-sm">
            <span>Strict Session Revocation</span>
            <span>Ephemeral Memory Only</span>
            <span className="font-label-mono-sm text-label-mono-sm text-tertiary">ISO 27001 / SOC2 TYPE II</span>
          </div>
        </div>
      </footer>
    </>
  );
}
