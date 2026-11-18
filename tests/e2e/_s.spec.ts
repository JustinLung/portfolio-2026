import { expect, test } from '@playwright/test';
test('sound control in settings', async ({ page }) => {
	await page.goto('/');
	await page.waitForLoadState('networkidle');
	await page.screenshot({ path: 'test-results/_before.png' });
	const open = page.getByRole('button', { name: /settings/i }).first();
	await open.click();
	const group = page.getByRole('radiogroup', { name: 'Sound' });
	await expect(group).toBeVisible();
	await group.getByText('Off').click();
	await expect(group.getByRole('radio', { name: 'Off' })).toBeChecked();
	await page.screenshot({ path: 'test-results/_settings.png' });
});
