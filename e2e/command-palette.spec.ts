import { test, expect } from '@playwright/test';

test('Ctrl+K opens the command palette with Navigate and Actions groups', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Control+k');
  await expect(page.getByPlaceholder('Jump to a feed or run a command…')).toBeVisible();
  await expect(page.getByText('Navigate')).toBeVisible();
  await expect(page.getByText('Actions')).toBeVisible();
  await expect(page.getByText('Refresh All Feeds')).toBeVisible();
});

test('selecting "Dashboard" from the command palette navigates and closes it', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Control+k');
  await page.getByRole('menuitem', { name: /Dashboard/ }).click();
  await expect(page.getByPlaceholder('Jump to a feed or run a command…')).not.toBeVisible();
  await expect(page.getByRole('heading', { name: '🌾 Dashboard' })).toBeVisible();
});

test('Escape closes the command palette', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Control+k');
  await expect(page.getByPlaceholder('Jump to a feed or run a command…')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByPlaceholder('Jump to a feed or run a command…')).not.toBeVisible();
});
