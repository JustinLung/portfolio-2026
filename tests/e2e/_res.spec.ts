import { test } from '@playwright/test';
test.use({ viewport: { width: 412, height: 915 }, isMobile: true, reducedMotion: 'no-preference' });
test('res', async ({ page }) => {
	const rows: { url: string; kb: number; type: string }[] = [];
	page.on('response', async (r) => {
		const b = await r.body().catch(() => null);
		const enc = Number(r.headers()['content-length'] ?? b?.length ?? 0);
		rows.push({ url: r.url().replace(/^https?:\/\/[^/]+/, '').slice(0, 70), kb: Math.round(enc / 1024), type: r.request().resourceType() });
	});
	await page.goto('/', { waitUntil: 'networkidle' });
	await page.waitForTimeout(3000);
	const byType: Record<string, number> = {};
	for (const r of rows) byType[r.type] = (byType[r.type] ?? 0) + r.kb;
	console.log('BYTYPE', JSON.stringify(byType));
	for (const r of rows.sort((a, b) => b.kb - a.kb).slice(0, 12)) console.log('RES', r.kb, r.type, r.url);
});
