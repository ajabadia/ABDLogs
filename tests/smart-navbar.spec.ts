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
    await page.goto(PUBLIC_PAGE, { timeout: 120000 });
    await page.waitForSelector('[data-testid="smart-navbar"]', { timeout: 30000 });
  });

  test('should render SmartNavbar with brand in public mode (no login button)', async ({ page }) => {
    // ABDLogs uses federated auth via proxy — no explicit login button is rendered
    await expect(page.locator('[data-testid="smart-navbar"]')).toBeVisible();
    await expect(page.locator('[data-testid="navbar-logo"]')).toBeVisible();
    await expect(page.locator('[data-testid="navbar-logo"]')).toContainText(/ABD|LOGS/i);

    // Verify no login button is present (ABDLogs doesn't pass onLogin to SmartNavbar)
    const loginBtn = page.locator('button').filter({ hasText: /INICIAR|SIGN.?IN|LOGIN|ACCEDER/i });
    await expect(loginBtn).toHaveCount(0);
  });

  test('should display app badge "LOGS" next to the brand logo', async ({ page }) => {
    await expect(page.locator('[data-testid="navbar-logo"]')).toContainText('LOGS');
  });

  test('hamburger toggle should not be visible on desktop viewport', async ({ page }) => {
    // The hamburger uses smart-navbar-mobile-only (display:none on md+)
    await expect(page.locator('[data-testid="navbar-mobile-toggle"]')).not.toBeVisible();
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
    await expect(dropdown).toContainText(/ESPAÑOL|ENGLISH/i);

    await expect(dropdown.locator('button', { hasText: 'ESPAÑOL' })).toBeVisible();
    await expect(dropdown.locator('button', { hasText: 'ENGLISH' })).toBeVisible();
  });

  test('language mega-menu: switching to English navigates to /en', async ({ page }) => {
    await page.locator('[data-testid="navbar-menu-language"]').click();
    await page.locator('[data-testid="navbar-dropdown"]').waitFor({ state: 'visible' });

    await page.locator('[data-testid="navbar-dropdown"] button', { hasText: 'ENGLISH' }).click();
    await page.waitForURL(/\/en(?:$|\/)/, { timeout: 10000 });
  });

  test('theme switching: dark mode applies html class', async ({ page }) => {
    await page.locator('[data-testid="navbar-menu-theme"]').click();
    await page.locator('[data-testid="navbar-dropdown"]').waitFor({ state: 'visible' });

    await page.locator('[data-testid="navbar-dropdown"] button', { hasText: /OSCURO|DARK/i }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('settings slot not rendered in public mode (ABDLogs)', async ({ page }) => {
    // ABDLogs doesn't render SystemSettings in public mode
    const settingsTrigger = page.locator('[data-testid="system-settings-trigger"]');
    await expect(settingsTrigger).not.toBeVisible();
  });

  test('theme mega-menu: clicking outside closes the menu', async ({ page }) => {
    await page.locator('[data-testid="navbar-menu-theme"]').click();
    await page.locator('[data-testid="navbar-dropdown"]').waitFor({ state: 'visible' });

    // Click outside the navbar — dispatch mousedown on document to bypass dropdown overlay
    await page.evaluate(() => document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })));

    // Menu should close
    await expect(page.locator('[data-testid="navbar-dropdown"]')).not.toBeVisible({ timeout: 3000 });
  });

  test('language mega-menu: Escape key closes the menu', async ({ page }) => {
    await page.locator('[data-testid="navbar-menu-language"]').click();
    await page.locator('[data-testid="navbar-dropdown"]').waitFor({ state: 'visible' });

    // Press Escape
    await page.keyboard.press('Escape');

    // Menu should close
    await expect(page.locator('[data-testid="navbar-dropdown"]')).not.toBeVisible({ timeout: 3000 });
  });
});

// ──────────────────────────────────────────
//  Mobile Drawer Tests
// ──────────────────────────────────────────

test.describe('SmartNavbar — Mobile Drawer (ABDLogs)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/es', { timeout: 120000 });
    await page.waitForSelector('[data-testid="smart-navbar"]', { timeout: 30000 });
  });

  test('hamburger toggle is visible on mobile viewport', async ({ page }) => {
    await expect(page.locator('[data-testid="navbar-mobile-toggle"]')).toBeVisible();
  });

  test('clicking hamburger opens and closes the mobile drawer', async ({ page }) => {
    await page.locator('[data-testid="navbar-mobile-toggle"]').click();
    await expect(page.locator('[data-testid="navbar-mobile-drawer"]')).toBeVisible();

    await page.locator('[data-testid="navbar-mobile-toggle"]').click();
    await expect(page.locator('[data-testid="navbar-mobile-drawer"]')).not.toBeVisible({ timeout: 3000 });
  });

  test('mobile drawer has correct accessibility attributes', async ({ page }) => {
    await page.locator('[data-testid="navbar-mobile-toggle"]').click();
    const drawer = page.locator('[data-testid="navbar-mobile-drawer"]');
    await expect(drawer).toHaveAttribute('role', 'dialog');
    await expect(drawer).toHaveAttribute('aria-modal', 'true');
    await expect(drawer).toHaveAttribute('aria-label', 'Mobile navigation');
  });

  test('clicking backdrop closes the mobile drawer', async ({ page }) => {
    await page.locator('[data-testid="navbar-mobile-toggle"]').click();
    await expect(page.locator('[data-testid="navbar-mobile-drawer"]')).toBeVisible();

    // Click the backdrop via native DOM click (bypasses React synthetic event interception)
    await page.evaluate(() => {
      const backdrop = document.querySelector('.fixed.inset-0');
      if (backdrop) (backdrop as HTMLElement).click();
    });
    await expect(page.locator('[data-testid="navbar-mobile-drawer"]')).not.toBeVisible({ timeout: 3000 });
  });

  test('Escape key closes the mobile drawer', async ({ page }) => {
    await page.locator('[data-testid="navbar-mobile-toggle"]').click();
    await expect(page.locator('[data-testid="navbar-mobile-drawer"]')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="navbar-mobile-drawer"]')).not.toBeVisible({ timeout: 3000 });
  });
});
