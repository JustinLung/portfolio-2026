export const themes = [
	{ id: 'ember', label: 'Ember' },
	{ id: 'midnight', label: 'Midnight' },
	{ id: 'forest', label: 'Forest' },
	{ id: 'dusk', label: 'Dusk' },
	{ id: 'graphite', label: 'Graphite' }
] as const;

export const modes = [
	{ id: 'light', label: 'Light' },
	{ id: 'dark', label: 'Dark' },
	{ id: 'system', label: 'System' }
] as const;

export type ThemeId = (typeof themes)[number]['id'];
/** What the visitor chose; `system` follows the device. */
export type ModeId = (typeof modes)[number]['id'];
/** What is actually applied: `data-mode` on <html> is always one of these. */
export type ResolvedMode = Exclude<ModeId, 'system'>;

// Also read by the inline script in src/app.html to avoid a flash of the default theme.
const STORAGE_KEY = 'portfolio:theme';
const MODE_STORAGE_KEY = 'portfolio:mode';

const isThemeId = (value: unknown): value is ThemeId => themes.some(({ id }) => id === value);
const isModeId = (value: unknown): value is ModeId => modes.some(({ id }) => id === value);

/** Reactive mirror of the active theme, shared by every theme picker. */
export const themeState = $state<{ id: ThemeId }>({ id: 'ember' });

/** Reactive mirror of the mode choice, and the light or dark it resolves to. Every theme has both. */
export const modeState = $state<{ id: ModeId; resolved: ResolvedMode }>({
	id: 'dark',
	resolved: 'dark'
});

let systemLight: MediaQueryList | undefined;

const resolveMode = (id: ModeId): ResolvedMode =>
	id === 'system' ? (systemLight?.matches ? 'light' : 'dark') : id;

/** Storage can be blocked; the choice still applies for this visit. */
function persistChoice(key: string, value: string): void {
	try {
		localStorage.setItem(key, value);
	} catch {
		// Not persisted.
	}
}

// The attributes change before the state so listeners read the new CSS variables.
function applyTheme(id: ThemeId): void {
	document.documentElement.dataset.theme = id;
	themeState.id = id;
}

function applyMode(id: ModeId): void {
	const resolved = resolveMode(id);

	document.documentElement.dataset.mode = resolved;
	modeState.id = id;
	modeState.resolved = resolved;
}

export function initializeTheme(): void {
	// "System" must follow the device if it changes while the page is open.
	if (!systemLight) {
		systemLight = matchMedia('(prefers-color-scheme: light)');
		systemLight.addEventListener('change', () => {
			if (modeState.id === 'system') setMode('system', false);
		});
	}

	// The inline script in src/app.html already applied the stored theme; adopt it, or reset a stale value.
	const applied = document.documentElement.dataset.theme;

	// It only applied the resolved mode, so the choice itself comes from storage.
	let stored: string | null = null;
	try {
		stored = localStorage.getItem(MODE_STORAGE_KEY);
	} catch {
		// Fall back to the default mode.
	}

	applyTheme(isThemeId(applied) ? applied : themeState.id);
	applyMode(isModeId(stored) ? stored : modeState.id);
	syncThemeColor();
}

/** Matches the browser UI (mobile address bar, installed-app title bar) to the page background. */
function syncThemeColor(): void {
	const color = getComputedStyle(document.documentElement)
		.getPropertyValue('--color-neutral-800')
		.trim();

	if (color) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
}

export function setTheme(id: ThemeId, persist = true): void {
	applyTheme(id);
	syncThemeColor();
	if (persist) persistChoice(STORAGE_KEY, id);
}

export function setMode(id: ModeId, persist = true): void {
	applyMode(id);
	syncThemeColor();
	if (persist) persistChoice(MODE_STORAGE_KEY, id);
}
