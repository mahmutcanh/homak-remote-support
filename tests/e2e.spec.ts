import { test, expect } from '@playwright/test';

const BASE_URL = 'https://remote.homaklab.com';

test.describe('Homak Remote Support — E2E Test Suite (Authenticated)', () => {

  test('1. Public Portal Page (/support-portal)', async ({ page }) => {
    await page.goto(`${BASE_URL}/support-portal`);
    await expect(page).toHaveTitle(/Homak/i);
    await expect(page.locator('h1')).toContainText('Homak Remote Support');

    const pinInputs = page.locator('.otp-input');
    await expect(pinInputs).toHaveCount(6);
    await expect(page.locator('body')).toContainText('6 Haneli Destek PIN Kodu');
  });

  test('2. Support Queue Page (/support-queue)', async ({ page }) => {
    await page.goto(`${BASE_URL}/support-queue`);
    await expect(page.locator('h1')).toContainText('Support Queue');
    await expect(page.locator('body')).toContainText('Bekleyen Talepler');
    await expect(page.locator('body')).toContainText('Mahmut Homak');

    const generateBtn = page.locator('button:has-text("Yeni Destek Kodu Üret")');
    await expect(generateBtn).toBeVisible();
    await generateBtn.click();
    await expect(page.locator('body')).toContainText(/PIN/i);
  });

  test('3. Dashboard Analytics (/dashboard)', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page.locator('h1')).toContainText('Sistem Performans Dashboard');
    await expect(page.locator('body')).toContainText('Toplam Oturum');
    await expect(page.locator('body')).toContainText('Aktif Ekran Bağlantısı');
    await expect(page.locator('body')).toContainText('Bugünkü Talepler');
    await expect(page.locator('body')).toContainText('Oturum Durumu Dağılımı');
    await expect(page.locator('body')).toContainText('En Çok Bağlanan Cihazlar');
  });

  test('4. Admin Technicians Management (/admin/technicians)', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/technicians`);
    await expect(page.locator('h1')).toContainText('Ekip ve Yetki Yönetimi');
    await expect(page.locator('body')).toContainText('@mahmut.homak');
    await expect(page.locator('body')).toContainText('YÖNETİCİ (ADMIN)');

    const addBtn = page.locator('button:has-text("Yeni Teknisyen Ekle")');
    await expect(addBtn).toBeVisible();
  });

  test('5. Audit Logs Page (/audit-logs)', async ({ page }) => {
    await page.goto(`${BASE_URL}/audit-logs`);
    await expect(page.locator('body')).toContainText(/Audit|Denetim/i);
  });

  test('6. Devices Page (/devices)', async ({ page }) => {
    await page.goto(`${BASE_URL}/devices`);
    await expect(page.locator('body')).not.toContainText('404');
  });

  test('7. Live Sessions Page (/live-session)', async ({ page }) => {
    await page.goto(`${BASE_URL}/live-session`);
    await expect(page.locator('body')).not.toContainText('404');
  });

  test('8. Access Policies Page (/access-policies)', async ({ page }) => {
    await page.goto(`${BASE_URL}/access-policies`);
    await expect(page.locator('body')).not.toContainText('404');
  });

  test('9. Client App Overview (/client-app)', async ({ page }) => {
    await page.goto(`${BASE_URL}/client-app`);
    await expect(page.locator('body')).toContainText('HomakSupport.exe');
  });

  test('10. Client App Approval Screen (/client-app/approval)', async ({ page }) => {
    await page.goto(`${BASE_URL}/client-app/approval`);
    await expect(page.locator('body')).toContainText('Gelen Bağlantı Talebi');
    await expect(page.locator('body')).toContainText('İzin Ver');
  });

  test('11. Modes Page (/modes)', async ({ page }) => {
    await page.goto(`${BASE_URL}/modes`);
    await expect(page.locator('body')).not.toContainText('404');
  });

  test('12. Login Failure — Wrong Password', async ({ browser }) => {
    // Use a fresh unauthenticated context for this specific test
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();

    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="text"]', 'mahmut.homak');
    await page.fill('input[type="password"]', 'wrong-password-xyz-test');
    await page.click('button[type="submit"]');

    await expect(page.locator('body')).toContainText(/hatalı|geçersiz|başarısız/i, { timeout: 8000 });
    await expect(page).toHaveURL(/\/login/);

    await context.close();
  });

});
