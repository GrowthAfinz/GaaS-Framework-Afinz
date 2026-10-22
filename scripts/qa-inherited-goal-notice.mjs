import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const out = 'tmp/inherited-goal-notice-qa';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 900, height: 600 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
let writes = 0;
await context.route('https://mipiwxadnpwtcgfcedym.supabase.co/**', async route => {
    if (route.request().method() !== 'GET') writes++;
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
});
// Isolated browser only: fake local session, no credentials and no production requests.
await context.addInitScript(() => {
    if (!localStorage.getItem('sb-mipiwxadnpwtcgfcedym-auth-token')) {
        const user = { id: '11111111-1111-4111-8111-111111111111', aud: 'authenticated', email: 'qa@example.invalid', role: 'authenticated', app_metadata: {}, user_metadata: {} };
        const exp = Math.floor(Date.now() / 1000) + 10 * 86400;
        const token = btoa('{}') + '.' + btoa(JSON.stringify({ sub: user.id, exp })) + '.fixture';
        localStorage.setItem('sb-mipiwxadnpwtcgfcedym-auth-token', JSON.stringify({ access_token: token, refresh_token: 'fixture', token_type: 'bearer', expires_at: exp, expires_in: 10 * 86400, user }));
    }
});
try {
    const url = (process.env.QA_BASE_URL || 'http://127.0.0.1:4317') + '/scripts/fixtures/inherited-goal-notice-qa.html';
    await page.clock.install();
    await page.goto(url, { waitUntil: 'networkidle' });
    const notice = () => page.getByRole('status');
    await notice().waitFor();
    await page.screenshot({ path: out + '/desktop.png' });
    await page.getByRole('button', { name: 'Fechar aviso de meta herdada' }).click();
    assert.equal(await notice().count(), 0);
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await notice().count(), 0, 'dismissal persists after reload');
    await page.evaluate(() => window.setNoticeGoal({ mes: '2026-10', herdada_de: '2026-07', b2c_meta: 6500, b2b2c_meta: 100, plurix_meta: 400, cac_max: 31 }));
    await notice().waitFor();
    await page.getByRole('button', { name: 'Fechar aviso de meta herdada' }).click();
    await page.evaluate(() => window.setNoticeGoal({ mes: '2026-11', herdada_de: '2026-07', b2c_meta: 6442, b2b2c_meta: 100, plurix_meta: 400, cac_max: 31 }));
    await notice().waitFor();
    await page.evaluate(() => { for (const key of Object.keys(localStorage)) if (key.startsWith('gaas.inherited-goal-notice.')) localStorage.removeItem(key); });
    await page.reload({ waitUntil: 'networkidle' });
    await notice().waitFor();
    await page.getByRole('button', { name: /Lembrar mais tarde/ }).click();
    assert.equal(await notice().count(), 0);
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await notice().count(), 0, 'snooze survives reload');
    await page.clock.fastForward(24 * 60 * 60 * 1000 + 1000);
    await notice().waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: out + '/mobile.png', fullPage: true });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'mobile must not overflow');
    assert.equal(writes, 0, 'closing and snoozing must never confirm or mutate goals');
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: true, checks: ['close', 'reload', 'changed goals', 'new month', 'snooze', '24h expiry while open', 'mobile', 'no backend writes'], errors }));
} catch (error) {
    await page.screenshot({ path: out + '/failure.png', fullPage: true });
    console.log(JSON.stringify({ errors, body: await page.locator('body').innerText() }));
    throw error;
} finally {
    await browser.close();
}
