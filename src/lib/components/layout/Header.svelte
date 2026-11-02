<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import gsap from 'gsap';
	import { tick } from 'svelte';
	import { links, socialLinks } from '../../../utils/links';
	import { MediaQuery } from 'svelte/reactivity';
	import {
		finePointer,
		onOffOptions,
		motionOptions,
		prefersReducedMotion,
		qualityOptions,
		settings,
		updateSetting
	} from '$lib/settings.svelte';
	import { lockScroll } from '$lib/scroll-lock';
	import { playSfx } from '$lib/sfx.svelte';
	import TerminalIcon from '$lib/assets/icons/terminal.svg?component';
	import SettingsIcon from '$lib/assets/icons/settings.svg?component';
	import BottomSheet from '../shared/ui/BottomSheet.svelte';
	import CommandPalette from '../shared/ui/CommandPalette.svelte';
	import { themes, themeState } from '$lib/theme.svelte';
	import SegmentedControl from '../shared/ui/SegmentedControl.svelte';
	import VolumeSlider from '../shared/ui/VolumeSlider.svelte';
	import SoundToggle from '../shared/ui/SoundToggle.svelte';
	import ThemePicker from '../shared/ui/ThemePicker.svelte';

	type Tab = 'menu' | 'settings';

	const tabs: { id: Tab; label: string }[] = [
		{ id: 'menu', label: 'Menu' },
		{ id: 'settings', label: 'Settings' }
	];

	let sheetOpen = $state(false);
	let paletteOpen = $state(false);
	let tab = $state<Tab>('menu');
	let panels: HTMLElement;
	let menuButton: HTMLButtonElement;
	let settingsButton: HTMLButtonElement;

	// Mirrors --viewport-md-up in src/lib/css/media.css.
	const desktop = new MediaQuery('min-width: 48em');

	function toggleSheet(next: Tab) {
		if (sheetOpen) {
			closeSheet();
			return;
		}

		tab = next;
		sheetOpen = true;
		playSfx('open');
	}

	function openSettings() {
		if (sheetOpen) {
			selectTab('settings');
			return;
		}

		toggleSheet('settings');
	}

	function closeSheet() {
		if (!sheetOpen) return;
		sheetOpen = false;
		playSfx('close');
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key !== 'Escape') return;
		closeSheet();
	}

	// The panels differ in height; morph the sheet instead of letting it jump.
	async function selectTab(next: Tab) {
		if (next === tab) return;

		gsap.killTweensOf(panels);
		const from = panels.offsetHeight;

		tab = next;
		await tick();

		gsap.set(panels, { height: 'auto' });
		const to = panels.offsetHeight;

		if (from === to || prefersReducedMotion()) return;

		gsap.fromTo(
			panels,
			{ height: from, overflow: 'hidden' },
			{
				height: to,
				duration: 0.6,
				ease: 'expo.out',
				onComplete: () => {
					gsap.set(panels, { clearProps: 'height,overflow' });
				}
			}
		);
	}

	function handleTabKeydown(event: KeyboardEvent) {
		if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
		event.preventDefault();
		const next = tab === 'menu' ? 'settings' : 'menu';
		selectTab(next);

		const buttons = (event.currentTarget as HTMLElement).parentElement?.children;
		(buttons?.[tabs.findIndex(({ id }) => id === next)] as HTMLElement | undefined)?.focus();
	}

	$effect(() => {
		if (sheetOpen) return lockScroll();
	});

	$effect(() => {
		if (desktop.current && tab === 'menu') sheetOpen = false;
	});

	$effect(() => () => gsap.killTweensOf(panels));

	$effect(() => {
		window.addEventListener('opensettings', openSettings);
		return () => window.removeEventListener('opensettings', openSettings);
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#snippet navigationLinks()}
	<ul class="header__links" role="list" aria-label="Main navigation">
		{#each links as link (link.href)}
			<li class="header__link" role="listitem" aria-label={link.label}>
				<a
					href={resolve(link.href as '/')}
					class="link"
					class:link--active={page.url.pathname === link.href}
					aria-current={page.url.pathname === link.href ? 'page' : undefined}
					aria-label={link.label}
					data-uisfx-hover="hover"
					data-uisfx="forward"
					onclick={() => (sheetOpen = false)}>{link.label}</a
				>
			</li>
		{/each}
	</ul>
{/snippet}

<!-- Keep this wrapper unpositioned (no z-index/transform): a stacking context here would trap the blend. -->
<header>
	<!-- Fixed layers are stacking contexts, so the blended links and the unblended buttons are siblings. -->
	<div class="header header--blend container">
		<a href={resolve('/')} class="header__logo" data-uisfx-hover="hover" data-uisfx="back">
			Portfolio
		</a>

		<nav class="header__nav">
			{@render navigationLinks()}
		</nav>
	</div>

	<div class="header header__controls container">
		<div class="header__actions">
			<button
				type="button"
				class="header__palette-button"
				aria-haspopup="dialog"
				aria-keyshortcuts="Control+K Meta+K"
				aria-label="Open command palette"
				title="Command palette (⌘K or Ctrl+K)"
				data-uisfx-hover="hover"
				onclick={() => (paletteOpen = true)}
			>
				<TerminalIcon aria-hidden="true" />
			</button>

			<button
				bind:this={settingsButton}
				type="button"
				class="header__settings-button"
				aria-expanded={sheetOpen}
				aria-controls="header-sheet"
				aria-label={sheetOpen ? 'Close settings' : 'Open settings'}
				data-uisfx-hover="hover"
				onclick={() => toggleSheet('settings')}
			>
				<SettingsIcon aria-hidden="true" />
			</button>

			<button
				bind:this={menuButton}
				type="button"
				class="header__menu-button"
				class:header__menu-button--open={sheetOpen}
				aria-expanded={sheetOpen}
				aria-controls="header-sheet"
				aria-label={sheetOpen ? 'Close menu' : 'Open menu'}
				data-uisfx-hover="hover"
				onclick={() => toggleSheet('menu')}
			>
				<span class="header__menu-icon">
					<span class="header__menu-bar"></span>
					<span class="header__menu-bar"></span>
					<span class="header__menu-bar"></span>
				</span>
			</button>
		</div>
	</div>
</header>

<BottomSheet
	id="header-sheet"
	open={sheetOpen}
	onclose={closeSheet}
	returnFocus={() => (desktop.current ? settingsButton : menuButton)}
>
	<div class="header__tabs" role="tablist" aria-label="Menu sections">
		{#each tabs as { id, label } (id)}
			<button
				type="button"
				role="tab"
				id="header-tab-{id}"
				class="header__tab"
				aria-selected={tab === id}
				aria-controls="header-panel-{id}"
				tabindex={tab === id ? 0 : -1}
				data-uisfx-hover="hover"
				data-uisfx="forward"
				onclick={() => selectTab(id)}
				onkeydown={handleTabKeydown}>{label}</button
			>
		{/each}
	</div>

	<div bind:this={panels}>
		<div
			id="header-panel-menu"
			class="header__panel--menu"
			role="tabpanel"
			aria-labelledby="header-tab-menu"
			hidden={tab !== 'menu'}
		>
			<nav class="header__menu" aria-label="Mobile navigation">
				{@render navigationLinks()}
				<!-- eslint-disable svelte/no-navigation-without-resolve -- external URLs -->
				<ul class="header__socials" role="list" aria-label="Social links">
					{#each socialLinks as link (link.href)}
						<li>
							<a
								href={link.href}
								target="_blank"
								rel="noopener noreferrer"
								class="link"
								data-uisfx-hover="hover"
								data-uisfx="forward">{link.label}</a
							>
						</li>
					{/each}
				</ul>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			</nav>
		</div>

		<div
			id="header-panel-settings"
			role="tabpanel"
			aria-labelledby="header-tab-settings"
			hidden={tab !== 'settings'}
		>
			<p class="header__settings-title">Settings</p>
			<div class="header__setting">
				<div>
					<p class="header__setting-label">Sound</p>
					<p class="header__setting-hint">Play interface sound effects</p>
				</div>
				<div class="header__sound">
					<SoundToggle />
				</div>
			</div>
			<div class="header__setting">
				<label class="header__setting-label" for="setting-volume">Volume</label>
				<VolumeSlider id="setting-volume" />
			</div>
			<div class="header__setting">
				<div>
					<p class="header__setting-label">ASCII effect</p>
					<p class="header__setting-hint">Render the rose as text</p>
				</div>
				<SegmentedControl
					name="setting-ascii"
					label="ASCII effect"
					options={onOffOptions}
					value={settings.ascii ? 'on' : 'off'}
					onchange={(value) => updateSetting('ascii', value === 'on')}
				/>
			</div>
			{#if finePointer.current}
				<div class="header__setting">
					<div>
						<p class="header__setting-label">Custom cursor</p>
						<p class="header__setting-hint">Replace the mouse pointer</p>
					</div>
					<SegmentedControl
						name="setting-cursor"
						label="Custom cursor"
						options={onOffOptions}
						value={settings.cursor ? 'on' : 'off'}
						onchange={(value) => updateSetting('cursor', value === 'on')}
					/>
				</div>
			{/if}
			<div class="header__setting">
				<div>
					<p class="header__setting-label">Motion</p>
					<p class="header__setting-hint">System follows your device</p>
				</div>
				<SegmentedControl
					name="setting-motion"
					label="Motion"
					options={motionOptions}
					value={settings.motion}
					onchange={(value) => updateSetting('motion', value)}
				/>
			</div>
			<div class="header__setting">
				<div>
					<p class="header__setting-label">3D quality</p>
					<p class="header__setting-hint">Lower it if the page feels slow</p>
				</div>
				<SegmentedControl
					name="setting-quality"
					label="3D quality"
					options={qualityOptions}
					value={settings.quality}
					onchange={(value) => updateSetting('quality', value)}
				/>
			</div>
			<div class="header__setting header__setting--stacked">
				<div class="header__setting-heading">
					<p class="header__setting-label">Theme</p>
					<p class="header__setting-hint">
						{themes.find(({ id }) => id === themeState.id)?.label}
					</p>
				</div>
				<ThemePicker />
			</div>
		</div>
	</div>
</BottomSheet>

<CommandPalette bind:open={paletteOpen} />

<style>
	.header {
		position: fixed;
		z-index: 10;
		width: 100%;
		left: 50%;
		transform: translateX(-50%);
		top: 0;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-block: 32px;

		&.header--blend {
			mix-blend-mode: difference;
		}

		&.header__controls {
			justify-content: flex-end;
			min-height: calc(64px + 1lh);
			font-size: 0.875rem;
			pointer-events: none;

			.header__actions {
				pointer-events: auto;
			}
		}

		.header__logo {
			color: var(--color-white) !important;
			text-decoration: none !important;
			font-size: 0.875rem;
		}

		.header__actions {
			display: flex;
			align-items: center;
			gap: 8px;
		}

		.header__menu-button,
		.header__palette-button,
		.header__settings-button {
			display: inline-flex;
			width: 32px;
			height: 32px;
			margin-block: -16px;
			padding: 0;
			align-items: center;
			justify-content: center;
			color: var(--color-white);
			background: none;
			border: 0;
			font: inherit;
			font-size: 0.875rem;
			cursor: pointer;

			background-color: var(--color-secondary) !important;
			border-radius: 4px;
		}

		.header__palette-button,
		.header__settings-button {
			display: none;
		}

		.header__menu-button:focus-visible,
		.header__palette-button:focus-visible,
		.header__settings-button:focus-visible {
			outline: 2px solid var(--color-primary) !important;
			outline-offset: 0.25em !important;
		}

		.header__menu-icon {
			display: block;
			position: relative;
			width: 16px;
			height: 10px;
		}

		.header__menu-bar {
			position: absolute;
			left: 0;
			width: 100%;
			height: 1px;
			background-color: currentColor;
			border-radius: 2px;
			transition:
				transform 0.25s ease,
				opacity 0.15s ease;
		}

		.header__menu-bar:nth-child(1) {
			top: 0;
		}

		.header__menu-bar:nth-child(2) {
			top: 50%;
			transform: translateY(-50%);
		}

		.header__menu-bar:nth-child(3) {
			bottom: 0;
		}

		.header__menu-button--open .header__menu-bar:nth-child(1) {
			transform: translateY(4.25px) rotate(45deg);
		}

		.header__menu-button--open .header__menu-bar:nth-child(2) {
			opacity: 0;
		}

		.header__menu-button--open .header__menu-bar:nth-child(3) {
			transform: translateY(-4.25px) rotate(-45deg);
		}

		@media (prefers-reduced-motion: reduce) {
			.header__menu-bar {
				transition: none;
			}
		}

		.header__nav {
			display: none;
		}

		@media (--viewport-md-up) {
			.header__menu-button {
				display: none;
			}

			.header__palette-button,
			.header__settings-button {
				display: inline-flex;
			}

			.header__nav {
				display: flex;
				margin-right: 104px;
			}

			.header__links {
				flex-direction: row;
				justify-content: space-between;
				align-items: center;
				gap: 32px;

				.header__link {
					.link {
						font-size: 0.875rem;
					}
				}
			}
		}
	}

	.header__menu {
		.header__links {
			gap: 24px;
			padding-bottom: 24px;
			border-bottom: 1px solid color-mix(in srgb, var(--color-quaternary) 40%, transparent);
		}
	}

	.header__socials {
		display: flex;
		flex-wrap: wrap;
		gap: 8px 24px;
		list-style: none;
		margin: 0;
		padding: 24px 0 0;

		.link {
			color: var(--color-quaternary);
			font-size: 0.875rem;
		}
	}

	.header__tabs {
		display: flex;
		gap: 24px;
		margin-bottom: 24px;

		@media (--viewport-md-up) {
			display: none;
		}
	}

	.header__tab {
		padding: 0 0 4px;
		color: var(--color-quaternary);
		background: none;
		border: 0;
		border-bottom: 1px solid transparent;
		font: inherit;
		font-size: 0.875rem;
		cursor: pointer;
		transition:
			color 200ms ease,
			border-color 200ms ease;

		&[aria-selected='true'] {
			color: var(--color-white);
			border-bottom-color: currentColor;
		}

		&:focus-visible {
			outline: 2px solid currentColor;
			outline-offset: 4px;
		}
	}

	.header__panel--menu {
		@media (--viewport-md-up) {
			display: none;
		}
	}

	/* The tab already names the panel on mobile. */
	.header__settings-title {
		display: none;
		margin: 0 0 8px;
		color: var(--color-white);
		font-size: 1.25rem;

		@media (--viewport-md-up) {
			display: block;
		}
	}

	.header__setting {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
		padding-block: 12px;
		border-top: 1px solid color-mix(in srgb, var(--color-quaternary) 40%, transparent);
	}

	.header__setting--stacked {
		flex-direction: column;
		align-items: stretch;
		gap: 12px;
		padding-bottom: 0;
	}

	.header__sound {
		color: var(--color-white);
		font-size: 1rem;
	}

	.header__setting-heading {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 16px;
	}

	.header__setting-label,
	.header__setting-hint {
		margin: 0;
	}

	.header__setting-label {
		color: var(--color-white);
		font-size: 1rem;
	}

	.header__setting-hint {
		color: color-mix(in srgb, var(--color-white) 65%, transparent);
		font-size: 0.875rem;
	}

	.header__setting-label + .header__setting-hint {
		margin-top: 2px;
	}

	.header__links {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		list-style: none;
		gap: 16px;
		margin: 0;
		padding: 0;

		.header__link {
			.link {
				color: var(--color-white) !important;
				text-decoration: none !important;
				font-size: 1.125rem;
			}
		}
	}
</style>
