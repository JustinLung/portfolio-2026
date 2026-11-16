import { test } from '@playwright/test';

test.use({
	viewport: { width: 412, height: 915 },
	deviceScaleFactor: 2.6,
	isMobile: true,
	hasTouch: true,
	reducedMotion: 'no-preference'
});
test.setTimeout(180_000);

const median = (a: number[]) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];

for (const path of ['/', '/work', '/write/the-web-platform-is-eating-javascript-whats-new-in-html-css-and-js']) {
	test(`perf ${path}`, async ({ browser }) => {
		const runs: Record<string, number>[] = [];
		for (let i = 0; i < 3; i++) {
			const context = await browser.newContext({
				viewport: { width: 412, height: 915 },
				deviceScaleFactor: 2.6,
				isMobile: true,
				hasTouch: true,
				reducedMotion: 'no-preference'
			});
			const page = await context.newPage();
			const cdp = await context.newCDPSession(page);
			await cdp.send('Network.enable');
			await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
			await cdp.send('Network.emulateNetworkConditions', {
				offline: false,
				latency: 150,
				downloadThroughput: (1.6 * 1024 * 1024) / 8,
				uploadThroughput: (750 * 1024) / 8
			});
			await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
			await page.addInitScript(() => {
				const w = window as any;
				w.__m = { lcp: 0, cls: 0, tbt: 0, fcp: 0, maxEvent: 0 };
				new PerformanceObserver((l) => { for (const e of l.getEntries()) w.__m.lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
				new PerformanceObserver((l) => { for (const e of l.getEntries() as any[]) if (!e.hadRecentInput) w.__m.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
				new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') w.__m.fcp = e.startTime; }).observe({ type: 'paint', buffered: true });
				new PerformanceObserver((l) => { for (const e of l.getEntries()) w.__m.tbt += Math.max(0, e.duration - 50); }).observe({ type: 'longtask', buffered: true });
				new PerformanceObserver((l) => { for (const e of l.getEntries()) w.__m.maxEvent = Math.max(w.__m.maxEvent, e.duration); }).observe({ type: 'event', durationThreshold: 16, buffered: true } as any);
			});
			let bytes = 0;
			cdp.on('Network.loadingFinished', (e: any) => { bytes += e.encodedDataLength; });
			const start = Date.now();
			await page.goto(path, { waitUntil: 'load' });
			// when the loader overlay is gone and content can be seen
			await page.waitForFunction(() => !document.querySelector('[class*="loader"]') || getComputedStyle(document.querySelector('[class*="loader"]')!).display === 'none' || !document.querySelector('[class*="loader"]')?.isConnected, null, { timeout: 60000 }).catch(() => {});
			const loaderGone = Date.now() - start;
			await page.waitForTimeout(2500);
			// interactions for INP-ish
			await page.tap('body', { position: { x: 200, y: 600 } }).catch(() => {});
			const m = await page.evaluate(() => (window as any).__m);
			runs.push({ lcp: Math.round(m.lcp), fcp: Math.round(m.fcp), cls: +m.cls.toFixed(3), tbt: Math.round(m.tbt), maxEvent: Math.round(m.maxEvent), loaderGoneMs: loaderGone, kb: Math.round(bytes / 1024) });
			await context.close();
		}
		const keys = Object.keys(runs[0]);
		console.log('PERF', path.slice(0, 20), JSON.stringify(Object.fromEntries(keys.map((k) => [k, median(runs.map((r) => r[k]))]))));
	});
}
