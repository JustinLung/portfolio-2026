import { untrack } from 'svelte';
import { MediaQuery } from 'svelte/reactivity';

export const motionOptions = [
	{ id: 'system', label: 'System' },
	{ id: 'reduced', label: 'Reduced' },
	{ id: 'full', label: 'Full' }
] as const;

export const qualityOptions = [
	{ id: 'high', label: 'High' },
	{ id: 'low', label: 'Low' },
	{ id: 'off', label: 'Off' }
] as const;

export const onOffOptions = [
	{ id: 'on', label: 'On' },
	{ id: 'off', label: 'Off' }
] as const;

export type MotionPreference = (typeof motionOptions)[number]['id'];
export type Quality = (typeof qualityOptions)[number]['id'];

type Settings = {
	ascii: boolean;
	cursor: boolean;
	motion: MotionPreference;
	quality: Quality;
	volume: number;
};

const STORAGE_KEY = 'portfolio:settings';

const hasOption = (options: readonly { id: string }[], value: unknown) =>
	options.some(({ id }) => id === value);

/** Reactive mirror of the visitor's display settings, shared by every control. */
export const settings = $state<Settings>({
	ascii: true,
	cursor: true,
	motion: 'system',
	quality: 'high',
	volume: 0.5
});

const systemReducedMotion = new MediaQuery('prefers-reduced-motion: reduce');

/** Devices with a mouse or trackpad, the only ones where the custom cursor makes sense. */
export const finePointer = new MediaQuery('(hover: hover) and (pointer: fine)');

/** The motion preference after the visitor's override, falling back to the OS setting. */
export function prefersReducedMotion(): boolean {
	return settings.motion === 'system' ? systemReducedMotion.current : settings.motion === 'reduced';
}

/** Same as `prefersReducedMotion`, but an effect that calls it won't re-run when the preference changes. */
export const readReducedMotion = () => untrack(prefersReducedMotion);

export function initializeSettings(): void {
	try {
		const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');

		if (typeof stored.ascii === 'boolean') settings.ascii = stored.ascii;
		if (typeof stored.cursor === 'boolean') settings.cursor = stored.cursor;
		if (hasOption(motionOptions, stored.motion)) settings.motion = stored.motion;
		if (hasOption(qualityOptions, stored.quality)) settings.quality = stored.quality;
		if (typeof stored.volume === 'number')
			settings.volume = Math.min(1, Math.max(0, stored.volume));
	} catch {
		// Storage can be blocked or hold invalid JSON; fall back to the defaults.
	}
}

export function saveSettings(): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
	} catch {
		// The setting still applies for this visit.
	}
}

/** Pass `persist = false` while a control is mid-drag, then call `saveSettings` on release. */
export function updateSetting<K extends keyof Settings>(
	key: K,
	value: Settings[K],
	persist = true
): void {
	settings[key] = value;

	if (persist) saveSettings();
}
