import { test, expect } from '@playwright/test';

/**
 * 🎭 SmartNavbar Industrial E2E Tests — ABDLogs (Public Mode)
 *
 * Coverage:
 *   ✓ SmartNavbar renders in public mode (landing page)
 *   ✓ Theme mega-menu: open/close, switch light/dark/system
 *   ✓ Language mega-menu: ES/EN options and locale switch
 *   ✓ Settings slot visible
 *   ✓ Login/SSO redirect trigger visible
 *
 * ABDLogs runs on port 3600. Login redirects to ABDAuth (port 3400).
 * These tests ONLY cover the public/public-mode navbar functionality.
 */

const PUBLIC_PAGE = '/es';

test.describe('SmartNavbar — Public Mode (ABDLogs)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PUBLIC_PAGE);
    await page.waitForSelector('[data-testid="smart-navbar"]', { timeout: 15000 });
  });

  test('should render SmartNavbar with brand and login button', async ({ page }) => {
    await expect(page.locator('[data-testid="smart-navbar"]')).toBeVisible();
    await expect(page.locator('[data-testid="navbar-logo"]')).toBeVisible();
    await expect(page.locator('[data-testid="navbar-logo"]')).toContainText(/ABD|LOGS/i);

    // Login button in public mode
    const loginBtn = page.locator('button', { hasText: /INICIAR SESIÓN|SIGN IN/i });
    await expect(loginBtn).toBeVisible();
  });

  test('theme mega-menu: opens with light/dark/system options', async ({ page }) => {
    await page.locator('[data-testid="navbar-menu-theme"]').click();
    const dropdown = page.locator('[data-testid="navbar-dropdown"]');
    await expect(dropdown).toBeVisible();
    await expect(dropdown).toContainText(/TEMA|THEME/i);

    await expect(dropdown.locator('button', { hasText: /CLARO|LIGHT/i })).toBeVisible();
    await expect(dropdown.locator('button', { hasText: /OSCURO|DARK/i })).toBeVisible();
    await expect(dropdown.locator('button', { hasText: /SISTEMA|SYSTEM/i })).toBeVisible();
  });

  test('language mega-menu: opens with ES/EN options', async ({ page }) => {
    await page.locator('[data-testid="navbar-menu-language"]').click();
    const dropdown = page.locator('[data-testid="navbar-dropdown"]');
    await expect(dropdown).toBeVisible();
    await expect(dropdown).toContainText(/IDIOMA|LANGUAGE/i);

    await expect(dropdown.locator('button', { hasText: 'ESPAÑOL' })).toBeVisible();
    await expect(dropdown.locator('button', { hasText: 'ENGLISH' })).toBeVisible();
  });

  test('language mega-menu: switching to English navigates to /en', async ({ page }) => {
    await page.locator('[data-testid="navbar-menu-language"]').click();
    await page.locator('[data-testid="navbar-dropdown"]').waitFor({ state: 'visible' });

    await page.locator('[data-testid="navbar-dropdown"] button', { hasText: 'ENGLISH' }).click();
    await page.waitForURL(/\/en\//, { timeout: 10000 });
  });

  test('theme switching: dark mode applies html class', async ({ page }) => {
    await page.locator('[data-testid="navbar-menu-theme"]').click();
    await page.locator('[data-testid="navbar-dropdown"]').waitFor({ state: 'visible' });

    await page.locator('[data-testid="navbar-dropdown"] button', { hasText: /OSCURO|DARK/i }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('settings slot visible in public mode', async ({ page }) => {
    // The settings slot (SystemSettings) should be present in public mode
    const settingsTrigger = page.locator('[data-testid="system-settings-trigger"]');
    await expect(settingsTrigger).toBeVisible();
  });
});
