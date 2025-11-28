import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Build. Share. Discover.');
  });

  test('browse page loads', async ({ page }) => {
    await page.goto('/farms');
    await expect(page.locator('h1')).toContainText('Browse Farms');
  });

  test('can navigate to account page', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Sign In');
    await expect(page).toHaveURL(/\/account/);
  });
});

