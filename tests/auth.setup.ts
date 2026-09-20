import { test as setup, expect } from '@playwright/test';
import path from 'path';

const BASE_URL = 'https://remote.homaklab.com';
const TECH_USER = 'mahmut.homak';
const TECH_PASS = 'RhkDr25.!';

const authFile = path.join(__dirname, '.auth', 'technician.json');

setup('authenticate as technician', async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="text"]', TECH_USER);
  await page.fill('input[type="password"]', TECH_PASS);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/support-queue', { timeout: 20000 });
  await expect(page.locator('h1')).toContainText('Support Queue');

  await page.context().storageState({ path: authFile });
});
