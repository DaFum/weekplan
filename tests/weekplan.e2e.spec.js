import { test, expect } from '@playwright/test';
import { createServer } from 'http';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

/** @type {import('http').Server | null} */
let server = null;
let baseURL = '';

const MIME_TYPES = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'application/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webmanifest', 'application/manifest+json']
]);

MIME_TYPES.set('.woff2', 'font/woff2');
MIME_TYPES.set('.woff', 'font/woff');
MIME_TYPES.set('.ttf', 'font/ttf');

test.use({
  locale: 'de-DE'
});

test.beforeAll(async () => {
  server = createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url ?? '/', 'http://localhost');
      let relativePath = decodeURIComponent(requestUrl.pathname);
      if (relativePath.endsWith('/')) {
        relativePath = `${relativePath}index.html`;
      }
      if (relativePath === '') {
        relativePath = '/index.html';
      }
      const normalizedPath = path.normalize(relativePath).replace(/^\/+/, '');
      const filePath = path.join(rootDir, normalizedPath);
      if (!filePath.startsWith(rootDir)) {
        res.writeHead(403).end('Forbidden');
        return;
      }

      const data = await fs.readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES.get(ext) ?? 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-store'
      });
      res.end(data);
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
        res.writeHead(404).end('Not found');
        return;
      }
      res.writeHead(500).end('Internal Server Error');
    }
  });

  await new Promise(resolve => {
    server?.listen(0, resolve);
  });

  if (!server) {
    throw new Error('Server failed to start');
  }

  const address = server.address();
  if (address && typeof address === 'object') {
    baseURL = `http://127.0.0.1:${address.port}`;
  } else if (typeof address === 'string') {
    baseURL = address;
  } else {
    throw new Error('Unable to determine server address');
  }
});

test.afterAll(async () => {
  if (server) {
    await new Promise(resolve => server.close(resolve));
    server = null;
    baseURL = '';
  }
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    class FakeNotification {
      static permission = 'default';
      constructor() {}
      static async requestPermission() {
        FakeNotification.permission = 'granted';
        return FakeNotification.permission;
      }
    }

    Object.defineProperty(window, 'Notification', {
      configurable: true,
      writable: true,
      value: FakeNotification
    });
  });

  await page.goto(`${baseURL}/`);
  await page.waitForSelector('#wochen-nav .nav-button');
});

test('displays the header and quick actions', async ({ page }) => {
  await expect(page.locator('h1.header-title')).toHaveText('Wochen-Power');
  await expect(page.locator('#motivations-spruch')).toBeVisible();
  await expect(page.locator('#theme-toggle')).toBeVisible();
});

test('opens the design menu via the toggle button', async ({ page }) => {
  const menu = page.locator('#theme-menu');
  await expect(menu).toBeHidden();

  await page.getByRole('button', { name: /Design ändern/ }).click();

  await expect(menu).toBeVisible();
  await expect(menu.getByRole('menuitemradio')).toHaveCount(5);
});

test('opens the task dialog via the floating button', async ({ page }) => {
  await page.getByRole('button', { name: 'Neue Aufgabe erstellen' }).click();

  const modal = page.locator('#task-modal');
  await expect(modal).toBeVisible();
  await expect(page.locator('#task-name')).toBeVisible();
});

test.describe('Responsive layout', () => {
  test.describe('Mobile (375px)', () => {
    test.use({ viewport: { width: 375, height: 720 } });

    test('stacks header elements vertically', async ({ page }) => {
      const headerDirection = await page.evaluate(() => {
        const header = document.querySelector('.header-container');
        return header ? getComputedStyle(header).flexDirection : null;
      });
      expect(headerDirection).toBe('column');

      const actionWrap = await page.evaluate(() => {
        const actions = document.querySelector('.header-actions');
        return actions ? getComputedStyle(actions).flexWrap : null;
      });
      expect(actionWrap).toBe('wrap');

      const menu = page.locator('#theme-menu');
      await page.getByRole('button', { name: /Design ändern/ }).click();
      await expect(menu).toBeVisible();

      const layoutMetrics = await page.evaluate(() => {
        const actions = document.querySelector('.header-actions');
        const menu = document.querySelector('#theme-menu');
        if (!actions || !menu) {
          return null;
        }

        const actionsRect = actions.getBoundingClientRect();
        const menuRect = menu.getBoundingClientRect();
        return {
          actionsBottom: actionsRect.bottom,
          menuTop: menuRect.top,
          actionsCenter: actionsRect.left + actionsRect.width / 2,
          menuCenter: menuRect.left + menuRect.width / 2
        };
      });

      expect(layoutMetrics).not.toBeNull();

      // Allow a small tolerance for layout metrics due to cross-browser rendering differences.
      expect(layoutMetrics.menuTop).toBeGreaterThanOrEqual(layoutMetrics.actionsBottom - 2);
      expect(Math.abs(layoutMetrics.menuCenter - layoutMetrics.actionsCenter)).toBeLessThanOrEqual(8);
    });
  });

  test.describe('Desktop (1280px)', () => {
    test.use({ viewport: { width: 1280, height: 720 } });

    test('aligns header actions to the right', async ({ page }) => {
      const headerDirection = await page.evaluate(() => {
        const header = document.querySelector('.header-container');
        return header ? getComputedStyle(header).flexDirection : null;
      });
      expect(headerDirection).toBe('row');

      const actionsStyles = await page.evaluate(() => {
        const actions = document.querySelector('.header-actions');
        if (!actions) {
          return null;
        }
        const styles = getComputedStyle(actions);
        return {
          wrap: styles.flexWrap,
          justify: styles.justifyContent
        };
      });

      expect(actionsStyles).not.toBeNull();
      expect(actionsStyles?.wrap).toBe('nowrap');
      expect(actionsStyles?.justify).toBe('flex-end');

      const menu = page.locator('#theme-menu');
      await page.getByRole('button', { name: /Design ändern/ }).click();
      await expect(menu).toBeVisible();

      const desktopMetrics = await page.evaluate(() => {
        const actions = document.querySelector('.header-actions');
        const menu = document.querySelector('#theme-menu');
        const toggle = document.querySelector('#theme-toggle');
        if (!actions || !menu || !toggle) {
          return null;
        }

        const actionsRect = actions.getBoundingClientRect();
        const menuRect = menu.getBoundingClientRect();
        const toggleRect = toggle.getBoundingClientRect();
        return {
          actionsRight: actionsRect.right,
          menuRight: menuRect.right,
          toggleRight: toggleRect.right,
          menuTop: menuRect.top,
          toggleBottom: toggleRect.bottom
        };
      });

      expect(desktopMetrics).not.toBeNull();

      // Allow a small tolerance for layout metrics due to cross-browser rendering differences.
      expect(desktopMetrics.menuRight).toBeLessThanOrEqual(desktopMetrics.actionsRight + 12);
      expect(desktopMetrics.menuRight).toBeGreaterThanOrEqual(desktopMetrics.toggleRight - 2);
      expect(desktopMetrics.menuTop).toBeGreaterThanOrEqual(desktopMetrics.toggleBottom - 2);
    });
  });
});

// --- Additional scenarios: server headers, menu interactions, dialog UX ---

test.describe('Static server', () => {
  test('serves index.html with correct headers', async ({ request }) => {
    const res = await request.get(`${baseURL}/index.html`);
    expect(res.status()).toBe(200);
    const headers = res.headers();
    expect(headers['content-type']).toContain('text/html');
    expect(headers['content-type']).toContain('charset=utf-8');
    expect(headers['cache-control']).toBe('no-store');
    const html = await res.text();
    expect(html.length).toBeGreaterThan(50);
  });

  test('returns 404 for missing asset', async ({ request }) => {
    const res = await request.get(`${baseURL}/__missing__-${Date.now()}.json`);
    expect(res.status()).toBe(404);
  });

  test('blocks path traversal attempts with 403', async ({ request }) => {
    const res = await request.get(`${baseURL}/..%2F..%2Fetc%2Fpasswd`);
    expect(res.status()).toBe(403);
  });
});

test.describe('Theme menu interactions', () => {
  test('toggle button toggles menu visibility and aria-expanded', async ({ page }) => {
    const toggle = page.getByRole('button', { name: /Design ändern/ });
    const menu = page.locator('#theme-menu');

    // Initial state
    await expect(menu).toBeHidden();
    const initialExpanded = await toggle.getAttribute('aria-expanded');
    expect(initialExpanded === null || initialExpanded === 'false').toBeTruthy();

    // Open
    await toggle.click();
    await expect(menu).toBeVisible();
    await expect(await toggle.getAttribute('aria-expanded')).toBe('true');

    // Close
    await toggle.click();
    await expect(menu).toBeHidden();
    const finalExpanded = await toggle.getAttribute('aria-expanded');
    expect(finalExpanded === null || finalExpanded === 'false').toBeTruthy();
  });

  test('selecting a theme updates checked state and menu can be closed with Escape', async ({ page }) => {
    await page.getByRole('button', { name: /Design ändern/ }).click();
    const radios = page.getByRole('menuitemradio');

    // There should be multiple themes; pick a non-default option
    const count = await radios.count();
    expect(count).toBeGreaterThanOrEqual(2);

    const target = radios.nth(1);
    await target.click();

    // Exactly one radio should be checked
    await expect(page.getByRole('menuitemradio', { checked: true })).toHaveCount(1);

    // Close via Escape for accessibility
    await page.keyboard.press('Escape');
    await expect(page.locator('#theme-menu')).toBeHidden();
  });
});

test.describe('Task dialog behavior', () => {
  test('focuses task name input on open and closes with Escape', async ({ page }) => {
    await page.getByRole('button', { name: 'Neue Aufgabe erstellen' }).click();

    const modal = page.locator('#task-modal');
    const nameInput = page.locator('#task-name');

    await expect(modal).toBeVisible();
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toBeFocused();

    // Close with Escape
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
  });
});
