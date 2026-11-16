export type ToastTone = 'success' | 'error';

export type Toast = {
	id: number;
	message: string;
	tone: ToastTone;
	/** Milliseconds on screen once the pointer and focus have left it. */
	duration: number;
};

const MAX_VISIBLE = 3;
const DURATIONS: Record<ToastTone, number> = { success: 4000, error: 7000 };

/** Reactive list of visible toasts, rendered by `Toaster.svelte` (the single live region for outcomes). */
export const toasts = $state<Toast[]>([]);

let nextId = 0;

/**
 * Shows a short outcome message ("Email address copied"). A repeat of a message already on screen
 * replaces it instead of stacking, and only the newest few are kept.
 */
export function showToast(message: string, tone: ToastTone = 'success'): void {
	const existing = toasts.findIndex((toast) => toast.message === message);
	if (existing !== -1) toasts.splice(existing, 1);

	toasts.push({ id: nextId++, message, tone, duration: DURATIONS[tone] });
	if (toasts.length > MAX_VISIBLE) toasts.splice(0, toasts.length - MAX_VISIBLE);
}

export function dismissToast(id: number): void {
	const index = toasts.findIndex((toast) => toast.id === id);
	if (index !== -1) toasts.splice(index, 1);
}
