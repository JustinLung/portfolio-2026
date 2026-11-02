import {
	bindUISFX,
	createUISFX,
	type CueName,
	type PlayOptions,
	type PlayingSFX,
	type UISFXPlayer
} from 'uisfx';

let player: UISFXPlayer | null = null;
let unbind: (() => void) | null = null;
let context: AudioContext | null = null;

function getAudioContext(): AudioContext | undefined {
	if (typeof window === 'undefined') return undefined;

	if (!context) {
		const AudioContextClass =
			window.AudioContext ??
			(window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

		if (!AudioContextClass) return undefined;

		context = new AudioContextClass({ latencyHint: 'interactive' });
	}

	return context;
}

export function initializeSfx(root: Document): () => Promise<void> {
	if (!player) {
		player = createUISFX({
			pack: 'glass',
			volume: 0.5,
			context: getAudioContext(),
			preferences: { key: 'portfolio:sound' }
		});
		sfxState.enabled = player.isEnabled();
	}

	unbind?.();
	unbind = bindUISFX(root, { player }).unbind;

	return async () => {
		unbind?.();
		unbind = null;
		await player?.destroy();
		player = null;
		await context?.close();
		context = null;
	};
}

export function unlockSfx(): Promise<boolean> {
	return player?.unlock() ?? Promise.resolve(false);
}

export function playSfx(cue: CueName, options?: PlayOptions): PlayingSFX | null {
	return player?.play(cue, options) ?? null;
}

export function isSfxUnlocked(): boolean {
	return context?.state === 'running';
}

/**
 * Autoplay policies keep the audio context suspended until the visitor
 * interacts, and a cue queued while suspended would fire on that later
 * interaction instead of the moment it belongs to. Only play when audio is
 * already permitted, giving the pending unlock a brief window to settle.
 */
export async function playSfxIfUnlocked(cue: CueName, options?: PlayOptions): Promise<void> {
	if (!isSfxUnlocked()) {
		const settled = await Promise.race([
			unlockSfx(),
			new Promise<boolean>((resolve) => window.setTimeout(() => resolve(isSfxUnlocked()), 150))
		]);

		if (!settled) return;
	}

	playSfx(cue, options);
}

/** Reactive mirror of the player's preference, shared by every sound toggle. */
export const sfxState = $state({ enabled: true });

export function setSfxVolume(volume: number): void {
	player?.setVolume(volume);
}

export function setSfxEnabled(enabled: boolean): void {
	if (!player) return;

	if (!enabled) player.stopAll();
	player.setEnabled(enabled);
	sfxState.enabled = enabled;
}

/** Flips interface sound and returns the new state. The off cue plays before muting so it is heard. */
export function toggleSfx(): boolean {
	if (!sfxState.enabled) {
		setSfxEnabled(true);
		playSfx('toggle-on');
		return true;
	}

	playSfx('toggle-off');
	setSfxEnabled(false);
	return false;
}
