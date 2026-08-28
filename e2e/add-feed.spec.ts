import { test, expect } from '@playwright/test';

test('the Add Feed form validates via Zod and shows a field-level error for an invalid URL', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Add Feed/ }).click();
  await expect(page.getByText('Add a New Feed')).toBeVisible();

  const input = page.getByPlaceholder('https://example.com/feed.xml');
  await input.fill('not-a-url');
  await page.getByRole('button', { name: /^Add Feed$/ }).click();

  await expect(page.getByText('Enter a valid RSS or Atom feed URL')).toBeVisible();
});

test('the Add Feed modal closes via its own Close action', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Add Feed/ }).click();
  await expect(page.getByText('Add a New Feed')).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByText('Add a New Feed')).not.toBeVisible();
});
