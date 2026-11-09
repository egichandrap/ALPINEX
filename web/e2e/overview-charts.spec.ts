import { test, expect } from '@playwright/test';
import * as path from 'path';

const EVIDENCE_DIR = path.resolve('e2e/evidence');

test.describe('ALPINEX Overview Analytics: Diagram Batang & Candlestick Playwright Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept Login
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

    // Intercept Projects
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

  test('Overview Dashboard: Visualizing Bar Chart, Candlestick Latency Dispersion, and Health Ratio', async ({ page }) => {
    await page.goto('/');

    // Authenticate
    await page.fill('input[placeholder="admin"]', 'admin');
    await page.fill('input[type="password"]', 'admin');
    await page.click('button[type="submit"]');

    // Dismiss tutorial if visible
    const lewatiTurBtn = page.locator('button:has-text("Lewati Tur"), button[title="Tutup / Lewati Tur"]');
    try {
      await lewatiTurBtn.first().waitFor({ state: 'visible', timeout: 3000 });
      await lewatiTurBtn.first().click();
    } catch {
      // Continue
    }

    // Step 1: Navigate to Overview tab
    await page.click('text=Overview');
    await expect(page.locator('h2:has-text("Platform Overview")')).toBeVisible();
    await expect(page.locator('text=ACTIVE COLLECTIONS')).toBeVisible();
    await expect(page.locator('text=API ENDPOINTS')).toBeVisible();
    await expect(page.getByText('FUNCTIONAL SUITES', { exact: true })).toBeVisible();
    await expect(page.locator('text=SLA PASS RATE')).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '17-overview-dashboard-loaded.png') });

    // Step 2: Verify Split View (Diagram Batang & Candlestick Side-by-Side)
    const barChart = page.locator('[data-testid="overview-bar-chart"]');
    const candlestickChart = page.locator('[data-testid="overview-candlestick-chart"]');
    const statusCodes = page.locator('[data-testid="status-code-distribution"]');

    await expect(barChart).toBeVisible();
    await expect(candlestickChart).toBeVisible();
    await expect(statusCodes).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '18-overview-split-view-charts.png') });

    // Step 3: Switch to Single View: Diagram Batang (Throughput & Request Volume)
    await page.click('button:has-text("Throughput (Bars)")');
    await expect(barChart).toBeVisible();
    await expect(candlestickChart).not.toBeVisible();

    // Hover over bar element to inspect interactive tooltip
    await barChart.locator('rect').first().hover();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '19-overview-bar-chart-view.png') });

    // Step 4: Switch to Single View: Candlestick Chart (Latency Variance & Outliers)
    await page.click('button:has-text("Latency (Candlestick)")');
    await expect(candlestickChart).toBeVisible();
    await expect(barChart).not.toBeVisible();
    await expect(page.locator('text=SLA Threshold: 200ms')).toBeVisible();
    await expect(page.locator('text=P95 ≤ SLA Target')).toBeVisible();

    // Hover over candlestick
    await candlestickChart.locator('rect').first().hover();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '20-overview-candlestick-chart-view.png') });

    // Step 5: Switch Time Range to 24H and 7D
    await page.click('button:has-text("24H")');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '21-overview-24h-timerange.png') });

    // Step 6: Switch back to Split View and inspect HTTP Status Distribution
    await page.click('button:has-text("Split View")');
    await expect(barChart).toBeVisible();
    await expect(candlestickChart).toBeVisible();
    await expect(page.locator('text=2xx Success')).toBeVisible();
    await expect(page.locator('text=4xx Client Error')).toBeVisible();
    await expect(page.locator('text=5xx Server Fault')).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '22-overview-status-code-health.png') });
  });
});
