export const themes = [
	{ id: 'ember', label: 'Ember' },
	{ id: 'midnight', label: 'Midnight' },
	{ id: 'forest', label: 'Forest' },
	{ id: 'dusk', label: 'Dusk' },
	{ id: 'graphite', label: 'Graphite' }
] as const;

export type ThemeId = (typeof themes)[number]['id'];

// Also read by the inline script in src/app.html to avoid a flash of the default theme.
const STORAGE_KEY = 'portfolio:theme';

const isThemeId = (value: unknown): value is ThemeId => themes.some(({ id }) => id === value);

/** Reactive mirror of the active theme, shared by every theme picker. */
export const themeState = $state<{ id: ThemeId }>({ id: 'ember' });

export function initializeTheme(): void {
	// The inline script in src/app.html already applied the stored theme; adopt it, or reset a stale value.
	const applied = document.documentElement.dataset.theme;

	setTheme(isThemeId(applied) ? applied : themeState.id, false);
}

export function setTheme(id: ThemeId, persist = true): void {
	// The attribute must change before the state so listeners read the new CSS variables.
	document.documentElement.dataset.theme = id;
	themeState.id = id;

	if (!persist) return;

	try {
		localStorage.setItem(STORAGE_KEY, id);
	} catch {
		// The theme still applies for this visit.
	}
}
