import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const URL = 'https://growthafinz.github.io/GaaS-Framework-Afinz/#';
const OUT_DIR = path.resolve('screenshots-publicado');
const AUTH_KEY = 'sb-mipiwxadnpwtcgfcedym-auth-token';

const nowSeconds = Math.floor(Date.now() / 1000);
const fakeJwtPayload = Buffer.from(JSON.stringify({
  sub: '00000000-0000-4000-8000-000000000001',
  email: 'screenshot@example.com',
  role: 'authenticated',
  aud: 'authenticated',
  exp: nowSeconds + 86400,
})).toString('base64url');

const fakeSession = {
  access_token: `eyJhbGciOiJub25lIn0.${fakeJwtPayload}.screenshot`,
  token_type: 'bearer',
  expires_in: 86400,
  expires_at: nowSeconds + 86400,
  refresh_token: 'screenshot-refresh-token',
  user: {
    id: '00000000-0000-4000-8000-000000000001',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'screenshot@example.com',
    email_confirmed_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function prepareOutputDir() {
  await fs.rm(OUT_DIR, { recursive: true, force: true });
  await fs.mkdir(OUT_DIR, { recursive: true });
}

function sanitizeName(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

async function capture(page, index, name) {
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
  await sleep(900);
  const fileName = `${String(index).padStart(2, '0')}-${sanitizeName(name)}.png`;
  const filePath = path.join(OUT_DIR, fileName);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`${fileName} :: ${await page.title()} :: ${page.url()}`);
}

async function clickByText(page, text, options = {}) {
  const locator = page.getByText(text, { exact: options.exact ?? true }).first();
  await locator.waitFor({ state: 'visible', timeout: options.timeout ?? 12000 });
  await locator.click();
}

async function openDropdownItem(page, group, item) {
  await page.getByRole('button', { name: group }).click();
  await clickByText(page, item);
}

async function main() {
  await prepareOutputDir();

  const browser = await chromium.launch({ headless: true });

  const loginContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const loginPage = await loginContext.newPage();
  await loginPage.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await capture(loginPage, 1, 'login');
  await loginContext.close();

  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(([key, session]) => {
    window.localStorage.setItem(key, JSON.stringify(session));
  }, [AUTH_KEY, fakeSession]);

  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on('dialog', (dialog) => dialog.dismiss().catch(() => {}));
  page.on('console', (msg) => {
    if (['error', 'warning'].includes(msg.type())) {
      console.log(`[browser:${msg.type()}] ${msg.text().slice(0, 240)}`);
    }
  });

  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await capture(page, 2, 'area-autenticada-sem-dados');

  const testButton = page.getByText('Ativar Modo Teste', { exact: false }).first();
  await testButton.waitFor({ state: 'visible', timeout: 30000 });
  await testButton.click();
  await sleep(1400);

  await capture(page, 3, 'launch-planner');

  await openDropdownItem(page, 'Planejamento', 'Diario de Bordo');
  await capture(page, 4, 'diario-de-bordo');

  await page.getByRole('button', { name: 'Framework' }).click();
  await capture(page, 5, 'explorador-avancado');

  await openDropdownItem(page, 'Análise', 'Originação B2C');
  await capture(page, 6, 'originacao-b2c');

  await openDropdownItem(page, 'Análise', 'Relatórios');
  await capture(page, 7, 'relatorios');

  await openDropdownItem(page, 'Análise', 'Jornada & Disparos');
  await capture(page, 8, 'jornada-e-disparos');

  await openDropdownItem(page, 'Análise', 'Orientador');
  await capture(page, 9, 'orientador');

  await page.getByRole('button', { name: 'Mídia Paga' }).click();
  await capture(page, 10, 'media-analytics');

  await context.close();

  const settingsContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await settingsContext.addInitScript(([key, session]) => {
    window.localStorage.setItem(key, JSON.stringify(session));
  }, [AUTH_KEY, fakeSession]);
  const settingsPage = await settingsContext.newPage();
  settingsPage.setDefaultTimeout(15000);
  await settingsPage.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await sleep(1200);
  await settingsPage.getByText('Ativar Modo Teste', { exact: false }).first().click();
  await sleep(1400);
  await settingsPage.getByRole('button', { name: 'Configurações' }).click();
  await capture(settingsPage, 11, 'configuracoes');

  await fs.writeFile(
    path.join(OUT_DIR, 'manifest.json'),
    JSON.stringify({
      source: URL,
      capturedAt: new Date().toISOString(),
      note: 'Authentication was simulated in the automated browser to capture the published app screens without using real credentials.',
      files: (await fs.readdir(OUT_DIR)).filter((file) => file.endsWith('.png')),
    }, null, 2),
    'utf8'
  );

  await settingsContext.close();
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
