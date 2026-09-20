# Homak Remote Attended Support — Sonraki Adımlar (Yapılacaklar Listesi)

Bu dosya, sistemin ilerleyen günlerde geliştirilmesi planlanan ama henüz uygulanmamış özellikleri detaylı şekilde belgeler. Her madde bağımsız olarak, bir sonraki oturumda "şunu yap" denilerek doğrudan uygulanabilecek netlikte yazılmıştır.

**Not:** Sistem şu an tamamen çalışır durumda ve production'da canlı. Aşağıdaki maddeler "olsa iyi olur" seviyesinde iyileştirmelerdir, acil değildir.

---

## 1. Çoklu Teknisyen + Admin Yönetim Ekranı (TAMAMLANDI ✅)

**Mevcut durum:** Yönetici (Admin) ve Teknisyen rol ayrımı yapıldı. `/admin/technicians` yönetim ekranı yayında.
- `mahmut.homak` hesabı `ADMIN` rolüne yükseltildi.
- Backend NestJS REST API'ye `GET/POST/PATCH/DELETE /api/v1/technicians` endpoint'leri ve `AdminRoleGuard` eklendi.
- Frontend'e `/admin/technicians` sayfası, "Yeni Teknisyen Ekle", "Düzenle/Şifre Değiştir" ve "Sil" modalleri eklendi.
- Standart teknisyenlerin admin yönetim sayfasına erişimi HTTP 403 ile engellendi. E2E testlerin tamamı başarıyla geçti.

---

## 2. Belgeleme / Runbook Yazımı

**Mevcut durum:** Sistemin mimarisi, deploy süreci ve sorun giderme adımları hiçbir yerde yazılı değil — sadece bu konuşma geçmişinde var.

**Yapılacaklar:**
- `C:\Users\Administrator\homak-remote-support\docs\ARCHITECTURE.md` oluştur:
  - Sistem mimarisi diyagramı (metin/ASCII olabilir): Frontend (Next.js, vds12/Windows, pm2, port 3010) ↔ Backend API (NestJS, vds14/Linux, Docker, port 4500) ↔ PostgreSQL (Docker, `homak_support_db`) ↔ WebSocket (`/support-ws`) ↔ RustDesk sunucusu (vds14, hbbs/hbbr, portlar 21115-21119).
  - Cloudflare Tunnel yapısı: `remote.homaklab.com` → vds12:3010, `support-api.homaklab.com` → vds14:4500 (her ikisi de remote-managed tunnel config, Cloudflare Dashboard/API üzerinden yönetiliyor, yerel YAML dosyaları GEÇERSİZ).
- `docs/DEPLOY.md` oluştur:
  - Backend deploy adımları: GitHub push → vds14 SSH → `cd /opt/homak-support && git pull && docker compose build --no-cache api && docker compose up -d && docker exec homak_support_api npx prisma migrate deploy`
  - Frontend deploy adımları: `cd C:\Users\Administrator\homak-remote-support && npm run build && pm2 restart homak-remote-support`
  - Launcher (.NET) build adımları: `cd C:\Users\Administrator\homak-connect-launcher && dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true`, sonra çıktıyı `public\downloads\HomakConnect.exe` olarak kopyala.
- `docs/TROUBLESHOOTING.md` oluştur:
  - "Site açılmıyor" → pm2 list kontrolü, `pm2 logs homak-remote-support`
  - "API 502 veriyor" → vds14 `docker ps`, `docker logs homak_support_api`
  - "Teknisyen giriş yapamıyor" → şifre `RhkDr25.!`, DB'de bcrypt hash kontrolü (bkz. bu konuşmadaki manuel şifre değiştirme scripti)
  - "RustDesk ID gelmiyor" → launcher log'ları, `%TEMP%\HomakConnect` klasörü kontrolü
  - Cloudflare Tunnel config'i GÜNCELLERKEN yerel YAML dosyasını değil, API üzerinden (`PUT /accounts/:id/cfd_tunnel/:id/configurations`) güncellemek gerektiği notu (bu konuşmada `omni` tüneli için yaşanan sorunun tekrarlanmaması için).
- Bu dosyada geçen tüm önemli bilgiler (SSH bilgileri, GitHub repo, Cloudflare API token, RustDesk sunucu bilgileri) zaten CLAUDE.md'de mevcut, referans olarak orada tutulmaya devam edilebilir.

**Tahmini süre:** 30-45 dakika.

---

## 3. Otomatik Veritabanı Yedekleme (TAMAMLANDI ✅)

**Mevcut durum:** vds14 üzerinde `/opt/backups/homak-support/backup.sh` oluşturuldu.
- Her gece saat 03:00'te çalışan cron job tanımlandı: `0 3 * * * /opt/backups/homak-support/backup.sh >> /opt/backups/homak-support/backup.log 2>&1`
- Otomatik yedekleme PostgreSQL `pg_dump` verisini gzip ile sıkıştırıp `homak_support_YYYYMMDD_HHMMSS.sql.gz` olarak saklar.
- 30 günden eski yedekler otomatik temizlenir. Manuel yedek testi başarıyla doğrulandı.

---

## 4. Hata/Uyarı Bildirimi (Telegram Entegrasyonu)

**Mevcut durum:** Backend çökerse, disk dolarsa veya kritik bir hata oluşursa kimseye haber gitmiyor — sorunu ancak kullanıcı şikayet edince fark ediyoruz.

**Yapılacaklar:**
- CLAUDE.md'de zaten bir Telegram paneli var (`telegram-panel` container'ları, vds14 ve emirhan-server'da). Bu altyapıyı kullanarak basit bir webhook/bot mesajı gönderme mekanizması kurulabilir.
- Backend'e (NestJS) global bir exception filter ekle: 500 seviyesi hatalarda Telegram Bot API'sine (`https://api.telegram.org/bot<TOKEN>/sendMessage`) bir mesaj gönderen bir interceptor/filter yaz.
- Basit health-check monitörü: vds14'te bir cron job her 5 dakikada bir `curl -f http://localhost:4500/api/v1/support/queue` (JWT gerektirmeyen basit bir health endpoint eklenebilir, örn. `GET /health`) çağırsın, başarısızsa Telegram'a "Homak Support API DOWN" mesajı atsın.
- Disk doluluk kontrolü de aynı cron'a eklenebilir (`df -h /` çıktısını parse edip %90 üzerindeyse uyarsın).

**Tahmini süre:** 45 dakika - 1 saat (Telegram bot token/chat ID temin edilmesi gerekebilir, CLAUDE.md'de `mahmut.homak`'a KDR Telegram bildirimi için `mediatypeid 73` gibi referanslar var, muhtemelen zaten kurulu bir bot vardır, kontrol edilmeli).

---

## 5. Oturum İstatistikleri & Dashboard Ekranı (TAMAMLANDI ✅)

**Mevcut durum:** `/dashboard` yönetim paneli eklendi ve canlıya alındı.
- NestJS backend'e `GET /api/v1/support/stats` endpoint'i eklendi (JWT korumalı).
- Metrikler: Toplam Oturum, Bugünkü Talepler, Aktif Ekran Bağlantısı, Ortalama Kabul/Bekleme Süresi, Durum Dağılım Grafiği (ACTIVE, ENDED, EXPIRED, REJECTED) ve En Çok Bağlanan Cihazlar (Top 5 Hostname).
- Frontend'de `/dashboard` sayfası ve 30 saniyede bir otomatik yenileme mekanizması kuruldu. E2E test ile canlı veriler doğrulandı.

---

## 6. Süresi Dolmuş/Eski Oturumlar İçin Ek Temizlik (Kısmen Yapıldı)

**Mevcut durum:** Bu gece yapılan işle (bkz. konuşma geçmişi) zaten 1 dakikada bir çalışan bir Cron Job eklendi — süresi dolan `CREATED`/`WAITING_TECHNICIAN` oturumlar otomatik `EXPIRED` yapılıyor. **Bu madde tamamlandı sayılabilir.**

**Kalan iyileştirme (opsiyonel):** Çok eski (örn. 90 günden eski) `ENDED`/`EXPIRED`/`REJECTED` durumundaki oturum kayıtlarını (ve ilişkili audit loglarını) veritabanından tamamen silen ayrı bir haftalık temizlik job'ı eklenebilir — bu, veritabanının sonsuza kadar büyümesini önler. Ama audit/uyumluluk gerekliliği varsa (örn. "6 ay geriye dönük log tutulmalı" gibi bir kurumsal politika varsa) bu silme işlemi YAPILMAMALI, onun yerine eski kayıtlar "arşiv" tablosuna taşınabilir.

**Tahmini süre:** 20 dakika (eğer silme onaylanırsa).

---

## 7. Launcher Code Signing (İmza) Araştırması

**Mevcut durum:** `HomakConnect.exe` ve indirdiği RustDesk exe'si dijital olarak imzalanmamış. Windows SmartScreen, kullanıcıya "Tanınmayan yayıncı, yine de çalıştırmak istiyor musunuz?" uyarısı gösteriyor. Bu, kullanıcı deneyimini biraz zorlaştırıyor ve bazı kullanıcıları paniğe düşürebilir ("virüs mü bu?" tepkisi).

**Seçenekler:**
- **A) Ücretli code signing sertifikası satın al** (DigiCert, Sectigo vb. ~$100-400/yıl) — `signtool.exe` ile launcher'ı imzala. Bu, SmartScreen uyarısını tamamen ortadan kaldırır (belirli bir "reputation" biriktirdikten sonra, ilk başta yine de hafif bir uyarı olabilir).
- **B) Microsoft Trusted Signing (Azure)** — Microsoft'un daha yeni, daha uygun fiyatlı bulut imzalama servisi, aylık $9.99'dan başlıyor, Azure hesabı gerektirir. Araştırılmaya değer, geleneksel sertifikalardan daha hızlı "reputation" kazandırıyor.
- **C) İmzalamadan devam et, sadece kullanıcı talimatına bir not ekle** — `/support-portal` sayfasında "Windows bir uyarı gösterirse 'Ek Bilgi' > 'Yine de Çalıştır' deyin, bu normal bir güvenlik uyarısıdır" şeklinde açıklayıcı bir metin/ekran görüntüsü ekle. En hızlı ve ücretsiz çözüm, muhtemelen şimdilik yeterli.

**Tahmini süre:** Seçenek C için 15 dakika, A/B için birkaç saat + sertifika temin süreci (günler sürebilir).

---

## Öncelik Sıralaması Önerisi (İlerleyen Günler İçin)

1. **Belgeleme (madde 2)** — En düşük efor, en yüksek fayda. Sistemi başkası da anlayabilsin diye ilk bunu yapmak mantıklı.
2. **Otomatik yedekleme (madde 3)** — Veri kaybı riski gerçek bir risk, düşük efor ile kapatılabilir.
3. **Çoklu teknisyen yönetimi (madde 1)** — Eğer gerçekten birden fazla kişi teknisyen olarak kullanacaksa öncelikli, tek kişiyseniz ertelenebilir.
4. **Hata bildirimi (madde 4)** — Sistem büyüdükçe/kritikleştikçe önem kazanır.
5. **İstatistik ekranı (madde 5)** — Tamamen opsiyonel, "güzel olur" seviyesinde.
6. **Code signing (madde 7)** — Seçenek C (ücretsiz not ekleme) hemen yapılabilir, A/B parasal yatırım gerektirdiği için ayrı bir karar.

---

*Bu doküman [tarih: konuşma sırasında oluşturuldu] itibariyle günceldir. Sistem canlı: https://remote.homaklab.com*
