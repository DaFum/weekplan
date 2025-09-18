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

  if (server) {
    await new Promise(resolve => server.close(resolve));
  }
    if (server) {
      server.close(() => resolve(undefined));
      server = null;
    } else {
      resolve(undefined);
    }
  });
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

test('zeigt den Header und die Schnellaktionen an', async ({ page }) => {
  await expect(page.locator('h1.header-title')).toHaveText('Wochen-Power');
  await expect(page.locator('#motivations-spruch')).toBeVisible();
  await expect(page.locator('#theme-toggle')).toBeVisible();
});

test('öffnet das Design-Menü über den Toggle-Button', async ({ page }) => {
  const menu = page.locator('#theme-menu');
  await expect(menu).toBeHidden();

  await page.getByRole('button', { name: /Design ändern/ }).click();

  await expect(menu).toBeVisible();
  await expect(menu.getByRole('menuitemradio')).toHaveCount(5);
});

test('öffnet den Aufgaben-Dialog über den Floating Button', async ({ page }) => {
  await page.getByRole('button', { name: 'Neue Aufgabe erstellen' }).click();

  const modal = page.locator('#task-modal');
  await expect(modal).toBeVisible();
  await expect(page.locator('#task-name')).toBeVisible();
});

test.describe('Responsives Layout', () => {
  test.describe('Mobil (375px)', () => {
    test.use({ viewport: { width: 375, height: 720 } });

    test('ordnet Header-Elemente untereinander an', async ({ page }) => {
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

      expect(layoutMetrics.menuTop).toBeGreaterThanOrEqual(layoutMetrics.actionsBottom - 2);
      expect(Math.abs(layoutMetrics.menuCenter - layoutMetrics.actionsCenter)).toBeLessThanOrEqual(8);
    });
  });

  test.describe('Desktop (1280px)', () => {
    test.use({ viewport: { width: 1280, height: 720 } });

    test('richtet Header-Aktionen rechtsbündig aus', async ({ page }) => {
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

      expect(desktopMetrics.menuRight).toBeLessThanOrEqual(desktopMetrics.actionsRight + 12);
      expect(desktopMetrics.menuRight).toBeGreaterThanOrEqual(desktopMetrics.toggleRight - 2);
      expect(desktopMetrics.menuTop).toBeGreaterThanOrEqual(desktopMetrics.toggleBottom - 2);
    });
  });
});
