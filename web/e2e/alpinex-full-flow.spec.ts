import { test, expect } from '@playwright/test';
import * as path from 'path';

const EVIDENCE_DIR = path.resolve('e2e/evidence');

test.describe('ALPINEX End-to-End Test Suite with Step-by-Step Evidence Capture', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept API Login to return valid JWT and admin profile
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              id: 'usr-admin',
              username: 'admin',
              email: 'admin@alpinex.io',
              full_name: 'Platform Administrator',
              role: 'admin',
            },
            access_token: 'fake-jwt-token-playwright',
          },
        }),
      });
    });

    // Intercept dynamic projects API
    await page.route('**/api/v1/workspaces/**/projects', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'proj-default',
              workspace_id: 'ws-default',
              name: 'Default Project',
              description: 'Primary workspace project',
            },
          ],
        }),
      });
    });
  });

  test('Complete Platform Flow: Auth, API Studio, Shortcuts, Environments, Suites & Telemetry', async ({ page }) => {
    // -------------------------------------------------------------------------
    // TEST CASE 1: Authentication & Login Screen
    // -------------------------------------------------------------------------
    await page.goto('/');

    // Step 1: Verify Login Screen is presented
    await expect(page.locator('text=ALPINE')).toBeVisible();
    await expect(page.locator('input[placeholder="admin"]')).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '01-login-screen.png') });

    // Step 2: Fill credentials
    await page.fill('input[placeholder="admin"]', 'admin');
    await page.fill('input[type="password"]', 'admin');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '02-credentials-filled.png') });

    // Submit login and verify dashboard loaded
    await page.click('button[type="submit"]');

    // Dismiss tutorial tour if it appears
    const lewatiTurBtn = page.locator('button:has-text("Lewati Tur"), button[title="Tutup / Lewati Tur"]');
    try {
      await lewatiTurBtn.first().waitFor({ state: 'visible', timeout: 3000 });
      await lewatiTurBtn.first().click();
    } catch {
      // Tutorial did not pop up, continue
    }

    // Verify main app layout is active
    await expect(page.locator('text=Engine Active')).toBeVisible();
    await expect(page.locator('text=SSRF Guard')).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '03-dashboard-overview-loaded.png') });

    // -------------------------------------------------------------------------
    // TEST CASE 2: API Collections, Search & Collection Creation with Toast
    // -------------------------------------------------------------------------
    // Step 4: Navigate to API Collections Studio
    await page.click('text=API Collections');
    await expect(page.locator('input[placeholder*="Filter requests"]')).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '04-api-studio-workspace.png') });

    // Step 5: Open Add Collection Modal
    await page.click('[data-tour="add-collection-btn"]');
    await expect(page.locator('h2:has-text("Add API Collection")')).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '05-add-collection-modal.png') });

    // Step 6: Create new collection "Payment Gateway API"
    await page.fill('input[placeholder*="Payment Gateway API"]', 'Payment Gateway API');
    await page.fill('input[placeholder*="https://api.example.com"]', 'https://api.stripe.com/v1');
    await page.fill('textarea[placeholder*="Briefly describe"]', 'Core payment endpoints');
    await page.click('button:has-text("Create Collection")');

    // Verify collection created and toast appeared
    await expect(page.getByText('Payment Gateway API', { exact: true })).toBeVisible();
    await expect(page.locator('text=created successfully')).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '06-collection-created-with-toast.png') });

    // Step 7: Export Collection as JSON
    const exportBtn = page.locator('button[title="Export collection as JSON"]').first();
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();
    await expect(page.locator('text=exported successfully')).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '07-collection-exported-toast.png') });

    // -------------------------------------------------------------------------
    // TEST CASE 3: Keyboard Shortcuts Guide Modal
    // -------------------------------------------------------------------------
    // Step 8: Open Keyboard Shortcuts Guide
    await page.click('button[title*="Keyboard Shortcuts Guide"]');
    await expect(page.locator('text=Keyboard Shortcuts')).toBeVisible();
    await expect(page.locator('text=Send active API Request')).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '08-shortcuts-modal-guide.png') });

    // Step 9: Dismiss Shortcuts Guide via Escape
    await page.keyboard.press('Escape');
    await expect(page.locator('text=Send active API Request')).not.toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '09-shortcuts-modal-dismissed.png') });

    // -------------------------------------------------------------------------
    // TEST CASE 4: Environment & Variable Manager
    // -------------------------------------------------------------------------
    // Step 10: Open Variables Modal
    await page.click('button[title*="Configure Environment Variables"]');
    await expect(page.locator('text=Environment & Variable Manager')).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '10-environment-modal-open.png') });

    // Step 11: Save environment variables
    await page.click('button:has-text("Save Changes")');
    await expect(page.locator('text=Environments & encrypted secrets updated successfully')).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '11-environment-saved-toast.png') });

    // Step 12: Switch to Production Environment
    await page.selectOption('header select', 'prod');
    await expect(page.locator('text=Switched environment to: Production (Locked)')).toBeVisible();
    await expect(page.locator('text=PRODUCTION (LOCKED) MODE ACTIVE')).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '12-production-mode-active.png') });

    // Switch back to dev
    await page.selectOption('header select', 'dev');

    // -------------------------------------------------------------------------
    // TEST CASE 5: Functional Suites & Step Assertions
    // -------------------------------------------------------------------------
    await page.click('text=Functional Suites');
    await expect(page.locator('text=Functional Suites (Chained API Automation)')).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '13-functional-suites-view.png') });

    // -------------------------------------------------------------------------
    // TEST CASE 6: Performance Engineering (Grafana k6)
    // -------------------------------------------------------------------------
    await page.click('text=Performance (k6)');
    await expect(page.locator('text=Performance & Load Testing Studio (k6)')).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '14-performance-k6-view.png') });

    // -------------------------------------------------------------------------
    // TEST CASE 7: Execution Center & Diagnostics
    // -------------------------------------------------------------------------
    await page.click('text=Execution Center');
    await expect(page.locator('text=Execution Center & Distributed Queue')).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '15-execution-center-view.png') });

    // -------------------------------------------------------------------------
    // TEST CASE 8: Reports & Telemetry Analytics
    // -------------------------------------------------------------------------
    await page.click('text=Reports & Compare');
    await expect(page.locator('text=Reports & Performance Regression Compare')).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '16-reports-view.png') });
  });
});
