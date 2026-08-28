import { test, expect } from '@playwright/test';

test('the theme popup opens and shows the live HSV editor', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Theme settings' }).click();
  await expect(page.getByText('Base Color Swatch (HSV)')).toBeVisible();
  await expect(page.getByText('Hue (H)')).toBeVisible();
  await expect(page.getByText('Saturation (S)')).toBeVisible();
  await expect(page.getByText('Brightness (V)')).toBeVisible();
});

test('adjusting the theme editor actually changes a real CSS variable', async ({ page }) => {
  // Radix's Slider is keyboard-driven (role="slider" thumb, not a native
  // <input type="range">) -- "End" jumps it to its max value, guaranteed
  // to differ from the seeded default (hue 145).
  await page.goto('/');
  const before = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--ai-color-primary').trim()
  );
  await page.getByRole('button', { name: 'Theme settings' }).click();
  const hueSlider = page.getByRole('slider').first();
  await hueSlider.focus();
  await hueSlider.press('End');
  const after = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--ai-color-primary').trim()
  );
  expect(after).not.toBe(before);
});
