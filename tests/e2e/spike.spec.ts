import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

async function openMap(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Interactive map of Japan' })).toBeVisible();
  await expect(page.getByText('Opening the map of Japan…')).not.toBeVisible({ timeout: 30000 });
}
async function openList(page: Page, mobile: boolean) {
  if (mobile && !await page.locator('.places-panel').isVisible()) await page.getByRole('button', { name: 'Places', exact: true }).click();
  await expect(page.locator('.places-list button').first()).toBeVisible({ timeout: 15000 });
}

test('reading, canvas tap, suffix feedback, Next and persisted practice', async ({ page }, testInfo) => {
  // Names and furigana must work when the old third-party glyph host is unavailable.
  await page.route('https://demotiles.maplibre.org/**', route => route.abort());
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  const mobile = testInfo.project.name === 'mobile';
  await openMap(page);
  await openList(page, mobile);
  await expect(page.locator('.places-list rt')).toHaveCount(0);
  await page.getByRole('button', { name: /Furigana/ }).click();
  await expect(page.locator('.places-list rt').first()).toBeVisible();
  await page.getByRole('button', { name: /Furigana/ }).click();
  await page.getByRole('button', { name: /Explore Gunma/ }).click();
  await expect(page.locator('#place-title')).toHaveText('草津町');
  await expect(page.locator('#reading-input')).toBeFocused();
  await expect(page.locator('.romanization')).toHaveCount(0);
  await page.waitForTimeout(1300);
  await page.getByRole('button', { name: 'Close place card' }).click();
  const canvas = page.locator('.maplibregl-canvas');
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error('Canvas missing');
  await canvas.click({ position: { x: bounds.width / 2 + (mobile ? 0 : -60), y: bounds.height / 2 + (mobile ? -100 : 0) } });
  await expect(page.locator('#place-title')).toHaveText('草津町');
  if (mobile) {
    await page.setViewportSize({ width: 390, height: 460 });
    await expect.poll(async () => {
      const inputBounds = await page.locator('#reading-input').boundingBox();
      return !!inputBounds && inputBounds.y >= 60 && inputBounds.y + inputBounds.height <= 460;
    }).toBe(true);
    await page.setViewportSize({ width: 390, height: 844 });
  }
  await page.locator('#reading-input').fill('kusatsuchou');
  await page.locator('#reading-input').press('Enter');
  await expect(page.getByText('A reading to practise.')).toBeVisible();
  await expect(page.locator('.reading-feedback')).toBeFocused();
  await expect(page.locator('.feedback-note').first()).toContainText('まち');
  await expect(page.locator('.romanization')).toHaveText('kusatsumachi');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Next place' })).toBeFocused();
  await page.getByRole('button', { name: 'Next place' }).click();
  await expect(page.locator('#reading-input')).toBeFocused();
  await expect(page.locator('#place-title')).not.toContainText('草津町');
  await page.getByRole('button', { name: 'Close place card' }).click();
  await openList(page, mobile);
  await page.getByRole('button', { name: /Explore Gunma/ }).click();
  await page.locator('#reading-input').fill('kusatsu');
  await page.locator('#reading-input').press('Enter');
  await expect(page.getByText('Exactly right.')).toBeVisible();
  await expect(page.locator('.reading-feedback')).toBeFocused();
  await page.waitForTimeout(1500);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await mkdir('.impeccable/review', { recursive: true });
  await page.screenshot({ path: `.impeccable/review/phase1-${testInfo.project.name}-feedback.png`, fullPage: true });
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByLabel('Require the suffix', { exact: false }).check();
  // IndexedDB commits asynchronously; reload only once this setting is durable.
  await expect.poll(() => page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const open = indexedDB.open('chizu');
      open.onsuccess = () => resolve(open.result); open.onerror = () => reject(open.error);
    });
    try {
      return await new Promise<boolean>((resolve, reject) => {
        const request = database.transaction('settings').objectStore('settings').get('preferences');
        request.onsuccess = () => resolve(request.result?.value?.requireSuffix === true);
        request.onerror = () => reject(request.error);
      });
    } finally { database.close(); }
  })).toBe(true);
  await page.reload();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(page.getByLabel('Require the suffix', { exact: false })).toBeChecked();
  await page.getByRole('button', { name: 'Close settings' }).click();
  await openList(page, mobile);
  await expect(page.locator('.panel-intro')).toContainText('1 name practised');
  await page.getByRole('button', { name: /Explore Gunma/ }).click();
  await expect(page.locator('.input-note')).toContainText('Include 町');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `.impeccable/review/phase1-${testInfo.project.name}-input.png`, fullPage: true });
  if (mobile) {
    await page.locator('#reading-input').fill('kusatsu');
    await page.getByRole('button', { name: 'Places', exact: true }).click();
    await expect(page.locator('.place-sheet')).not.toBeVisible();
    await page.getByRole('button', { name: 'Places', exact: true }).click();
    await expect(page.locator('#reading-input')).toHaveValue('kusatsu');
    await expect(page.locator('#reading-input')).toBeFocused();
    await page.getByRole('button', { name: 'Places', exact: true }).click();
    await page.locator('.places-list button').filter({ hasNotText: '草津町' }).first().click();
    await expect(page.locator('#place-title')).not.toContainText('草津町');
    await expect(page.locator('#reading-input')).toBeFocused();
  }
  await page.getByRole('button', { name: 'Reveal', exact: true }).click();
  await expect(page.locator('.reading-feedback')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Next place' })).toBeFocused();
});

test('Close explains long vowels, strictness and kana IME remain distinct', async ({ page }, testInfo) => {
  const mobile = testInfo.project.name === 'mobile';
  await openMap(page); await openList(page, mobile);
  await page.getByRole('button', { name: /^北海道/ }).click();
  await page.locator('#reading-input').fill('hokkaido');
  await page.locator('#reading-input').press('Enter');
  await expect(page.getByText('Close — a long vowel to keep.')).toBeVisible();
  await expect(page.locator('.feedback-note').first()).toContainText('ほっかいどう');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByLabel('Require long vowels', { exact: false }).check();
  await page.getByRole('button', { name: 'Close settings' }).click();
  await page.locator('#reading-input').fill('hokkaido');
  await page.locator('#reading-input').press('Enter');
  await expect(page.getByText('A reading to practise.')).toBeVisible();
  await page.getByRole('button', { name: 'Close place card' }).click();
  await openList(page, mobile);
  await page.getByRole('button', { name: /^北海道/ }).click();
  const input = page.locator('#reading-input');
  await input.fill('ホッカイドウ');
  await input.dispatchEvent('keydown', { key: 'Enter', code: 'Enter', isComposing: true });
  await expect(input).toBeVisible();
  await input.press('Enter');
  await expect(page.getByText('Exactly right.')).toBeVisible();
});

test('zoom tiers expose prefectures then major cities without answer text', async ({ page }, testInfo) => {
  const mobile = testInfo.project.name === 'mobile';
  const municipalityLoads: string[] = [];
  page.on('response', response => {
    if (/\/data\/places\/\d{2}\.json$/.test(response.url()) && response.ok()) municipalityLoads.push(response.url());
  });
  await openMap(page); await openList(page, mobile);
  expect(municipalityLoads).toEqual([]);
  await page.getByRole('button', { name: /^関東地方/ }).click();
  await page.getByRole('button', { name: 'Close place card' }).click();
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await page.waitForTimeout(500);
  await openList(page, mobile);
  await expect(page.getByRole('button', { name: /^東京都/ })).toBeVisible();
  await page.getByRole('button', { name: /^東京都/ }).click();
  await page.getByRole('button', { name: 'Close place card' }).click();
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await page.waitForTimeout(400);
  await openList(page, mobile);
  await expect(page.locator('.places-list button').filter({ hasText: /市|区/ }).first()).toBeVisible();
  await expect(page.locator('.places-list rt')).toHaveCount(0);
  if (mobile) await page.getByRole('button', { name: 'Places', exact: true }).click();
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await expect.poll(() => municipalityLoads.length, { timeout: 15000 }).toBeGreaterThan(0);
  await openList(page, mobile);
  const municipalNames = new Set<string>();
  for (const url of municipalityLoads) {
    const chunk = await (await page.request.get(url)).json();
    for (const place of chunk) if (place.kind === 'municipality') municipalNames.add(place.name_kanji);
  }
  await expect.poll(async () => (await page.locator('.places-list [lang="ja"]').allTextContents()).some(name => municipalNames.has(name))).toBe(true);
});

test('audio uses canonical kana, persisted speed and counts as a reading aid', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    const calls: { text: string; rate: number }[] = [];
    Object.defineProperty(window, '__speechCalls', { value: calls });
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: class { text: string; constructor(text: string) { this.text = text; } } });
    Object.defineProperty(window, 'speechSynthesis', { value: {
      getVoices: () => [{ lang: 'ja-JP', voiceURI: 'test-ja', name: 'Test Japanese' }],
      addEventListener() {}, removeEventListener() {}, cancel() {},
      speak(utterance: { text: string; rate: number }) { calls.push({ text: utterance.text, rate: utterance.rate }); },
    } });
  });
  await openMap(page);
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByLabel('Speech speed').selectOption('0.7');
  await page.getByRole('button', { name: 'Close settings' }).click();
  await openList(page, testInfo.project.name === 'mobile');
  await page.getByRole('button', { name: /Explore Gunma/ }).click();
  await page.getByRole('button', { name: 'Listen to the reading' }).click();
  expect(await page.evaluate(() => (window as unknown as { __speechCalls: unknown[] }).__speechCalls)).toEqual([{ text: 'くさつまち', rate: 0.7 }]);
  await page.locator('#reading-input').fill('kusatsu');
  await page.locator('#reading-input').press('Enter');
  await expect(page.getByText('You used a reading aid. Try without it next time.')).toBeVisible();
});
