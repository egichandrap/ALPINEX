import { test, expect } from '@playwright/test';
import * as path from 'path';

const EVIDENCE_DIR = path.resolve('e2e/evidence');

test.describe('ALPINEX Overview Analytics: Real Dynamic Telemetry, Line Chart & Candlestick Playwright Suite', () => {
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

  test('Overview Dashboard: Verify Real Dynamic Line Chart, Candlestick, Bar Chart, and Empty State', async ({ page }) => {
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

    // Step 1: Inject real performance test reports into active project storage
    await page.evaluate(() => {
      const realReports = [
        {
          id: 'rep-01',
          projectId: 'proj-default',
          scenarioName: 'Payment Checkout API',
          endpointMethod: 'POST',
          endpointUrl: 'https://api.stripe.com/v1/charges',
          totalRequests: 2450,
          p50Latency: 64,
          p95Latency: 142,
          p95Threshold: 200,
          errorRate: 0.012,
          verdict: 'PASSED',
          timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
        },
        {
          id: 'rep-02',
          projectId: 'proj-default',
          scenarioName: 'User Profile Service',
          endpointMethod: 'GET',
          endpointUrl: 'https://api.example.com/v1/users',
          totalRequests: 4120,
          p50Latency: 78,
          p95Latency: 168,
          p95Threshold: 200,
          errorRate: 0.008,
          verdict: 'PASSED',
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
        {
          id: 'rep-03',
          projectId: 'proj-default',
          scenarioName: 'Inventory Search Query',
          endpointMethod: 'GET',
          endpointUrl: 'https://api.example.com/v1/search',
          totalRequests: 5800,
          p50Latency: 110,
          p95Latency: 245,
          p95Threshold: 200,
          errorRate: 0.035,
          verdict: 'BREACH',
          timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
        },
        {
          id: 'rep-04',
          projectId: 'proj-default',
          scenarioName: 'Authentication Token Verify',
          endpointMethod: 'POST',
          endpointUrl: 'https://api.example.com/v1/auth/verify',
          totalRequests: 3200,
          p50Latency: 52,
          p95Latency: 125,
          p95Threshold: 200,
          errorRate: 0.004,
          verdict: 'PASSED',
          timestamp: new Date().toISOString(),
        },
      ];
      localStorage.setItem('alpinex_perf_reports_proj-default', JSON.stringify(realReports));
    });

    // Step 2: Navigate to Overview tab
    await page.click('text=Overview');
    await expect(page.locator('h2:has-text("Platform Overview")')).toBeVisible();
    await expect(page.locator('text=ACTIVE COLLECTIONS')).toBeVisible();
    await expect(page.locator('text=API ENDPOINTS')).toBeVisible();
    await expect(page.getByText('FUNCTIONAL SUITES', { exact: true })).toBeVisible();
    await expect(page.locator('text=SLA PASS RATE')).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '17-overview-dashboard-loaded.png') });

    // Step 3: Verify Split View (Real Bar Chart + Real Line Chart)
    const barChart = page.locator('[data-testid="overview-bar-chart"]');
    const lineChart = page.locator('[data-testid="overview-line-chart"]');
    const statusCodes = page.locator('[data-testid="status-code-distribution"]');

    await expect(barChart).toBeVisible();
    await expect(lineChart).toBeVisible();
    await expect(statusCodes).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '18-overview-split-view-charts.png') });

    // Step 4: Switch to Single View: Latency Line Chart (P50 & P95 SLA Tracking)
    await page.click('button:has-text("Line Chart (Trend)")');
    await expect(lineChart).toBeVisible();
    await expect(barChart).not.toBeVisible();
    await expect(page.locator('text=SLA Target: 200ms')).toBeVisible();
    await expect(page.locator('text=P95 Tail')).toBeVisible();
    await expect(page.locator('text=P50 Median')).toBeVisible();

    // Hover over a line point
    await lineChart.locator('circle').first().hover();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '19-overview-line-chart-view.png') });

    // Step 5: Switch to Single View: Candlestick Chart (Latency Jitter & Outliers)
    await page.click('button:has-text("Candlestick (Jitter)")');
    const candlestickChart = page.locator('[data-testid="overview-candlestick-chart"]');
    await expect(candlestickChart).toBeVisible();
    await expect(lineChart).not.toBeVisible();
    await expect(page.locator('text=SLA Threshold: 200ms')).toBeVisible();

    // Hover over candlestick
    await candlestickChart.locator('rect').first().hover();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '20-overview-candlestick-chart-view.png') });

    // Step 6: Switch to Single View: Throughput (Bars)
    await page.click('button:has-text("Throughput (Bars)")');
    await expect(barChart).toBeVisible();
    await expect(candlestickChart).not.toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '21-overview-bar-chart-view.png') });

    // Step 7: Verify Status Code Ratio (Real Aggregated Data)
    await page.click('button:has-text("Split View")');
    await expect(statusCodes).toBeVisible();
    await expect(page.locator('text=Success (2xx)')).toBeVisible();
    await expect(page.locator('text=Failed / Error Requests')).toBeVisible();
    await expect(page.locator('text=Active Test Runs')).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '22-overview-status-code-health.png') });

    // Step 8: Verify Clean Adaptive Empty State when Project Has No Runs
    await page.evaluate(() => {
      localStorage.removeItem('alpinex_perf_reports_proj-default');
    });
    // Navigate away and back to re-render Overview with empty state
    await page.click('text=API Collections');
    await page.click('text=Overview');
    const emptyState = page.locator('[data-testid="overview-empty-state"]');
    await expect(emptyState).toBeVisible();
    await expect(page.locator('text=No Test Telemetry Recorded Yet')).toBeVisible();
    await expect(page.locator('text=Launch Performance Studio (k6)')).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '23-overview-adaptive-empty-state.png') });
  });
});
