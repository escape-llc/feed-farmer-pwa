import { test, expect } from '@playwright/test';

test('the app shell loads with header, sidebar, and dashboard stat cards', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Feed Farmer')).toBeVisible();
  await expect(page.getByRole('treeitem', { name: /Dashboard/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: '🌾 Dashboard' })).toBeVisible();

  // Stat cards render regardless of whether feed seeding has finished yet
  for (const label of ['Feeds', 'Unread', 'Starred', 'Total']) {
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  }
});

test('the header actions render as one merged UIGroup', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /Add Feed/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Refresh All' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Theme settings' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reset' })).toBeVisible();
});
