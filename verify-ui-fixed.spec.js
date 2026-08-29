const { test, expect } = require('@playwright/test');

test('approval flow and page interactions', async ({ page }) => {
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.locator('.btn-approve').first().evaluate((el) => el.click());
  await expect(page.locator('.approval-card').first()).toContainText('✓ Approved — LESCO bill paid via demo rail', { timeout: 6000 });
  await page.locator('.faq-q').first().evaluate((el) => el.click());
  await expect(page.locator('.faq-item').first()).toHaveClass(/is-open/);
  await page.locator('.drop-mock').first().evaluate((el) => el.click());
  await expect(page.locator('.stamp-note')).toContainText('4 entries extracted, Folio 02', { timeout: 8000 });
});
