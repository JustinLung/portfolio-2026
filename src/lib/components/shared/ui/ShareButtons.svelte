<script lang="ts">
	import { page } from '$app/state';
	import CheckIcon from '$lib/assets/icons/check.svg?component';
	import FacebookIcon from '$lib/assets/icons/facebook.svg?component';
	import LinkIcon from '$lib/assets/icons/link.svg?component';
	import LinkedinIcon from '$lib/assets/icons/linkedin.svg?component';
	import ShareIcon from '$lib/assets/icons/share.svg?component';
	import XIcon from '$lib/assets/icons/x.svg?component';
	import { SITE_URL } from '../../../../utils/site';

	let { title }: { title: string } = $props();

	// Canonical URL, so a preview deployment's address is never shared.
	const url = $derived(new URL(page.url.pathname, SITE_URL).href);

	const networks = $derived([
		{
			label: 'LinkedIn',
			icon: LinkedinIcon,
			href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
		},
		{
			label: 'X',
			icon: XIcon,
			href: `https://x.com/intent/post?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
		},
		{
			label: 'Facebook',
			icon: FacebookIcon,
			href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
		}
	]);

	// Both are progressive enhancements: the network links above work without either.
	let canShare = $state(false);
	let canCopy = $state(false);
	let copied = $state(false);
	let status = $state('');
	let resetTimeout: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		canShare = typeof navigator.share === 'function';
		canCopy = Boolean(navigator.clipboard?.writeText);

		return () => clearTimeout(resetTimeout);
	});

	async function share() {
		try {
			await navigator.share({ title, url });
		} catch (cause) {
			// Dismissing the share sheet rejects with AbortError. That is not a failure.
			if (!(cause instanceof DOMException && cause.name === 'AbortError')) {
				status = 'Sharing failed';
			}
		}
	}

	async function copy() {
		try {
			await navigator.clipboard.writeText(url);
			copied = true;
			status = 'Link copied';
			clearTimeout(resetTimeout);
			resetTimeout = setTimeout(() => {
				copied = false;
				status = '';
			}, 2000);
		} catch {
			status = 'Could not copy the link';
		}
	}
</script>

<!--
	@component
	Share row for the current page: network links, plus native share and copy-link where the browser supports them.
	Shares the canonical URL, whose social preview is generated at `/og/...`.
-->
<div class="share" role="group" aria-labelledby="share-label">
	<span id="share-label" class="share__label">Share</span>

	<ul class="share__list" role="list">
		{#each networks as { label, icon: Icon, href } (label)}
			<li>
				<a
					class="share__button"
					{href}
					target="_blank"
					rel="external noopener noreferrer"
					data-uisfx-hover="hover"
					data-uisfx="open"
				>
					<Icon aria-hidden="true" />
					<span class="visually-hidden">Share on {label} (opens in a new tab)</span>
				</a>
			</li>
		{/each}

		{#if canCopy}
			<li>
				<button
					type="button"
					class="share__button"
					onclick={copy}
					data-uisfx-hover="hover"
					data-uisfx="select"
				>
					{#if copied}
						<CheckIcon aria-hidden="true" />
					{:else}
						<LinkIcon aria-hidden="true" />
					{/if}
					<span class="visually-hidden">Copy link</span>
				</button>
			</li>
		{/if}

		{#if canShare}
			<li>
				<button
					type="button"
					class="share__button"
					onclick={share}
					data-uisfx-hover="hover"
					data-uisfx="select"
				>
					<ShareIcon aria-hidden="true" />
					<span class="visually-hidden">Share via your device</span>
				</button>
			</li>
		{/if}
	</ul>

	<span class="visually-hidden" role="status">{status}</span>
</div>

<style>
	.share {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 12px 16px;
	}

	.share__label {
		color: var(--color-white);
		font-size: 1rem;
	}

	.share__list {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.share__button {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		padding: 0;
		color: var(--color-white);
		background: transparent;
		border: 1px solid var(--color-primary);
		border-radius: 4px;
		cursor: pointer;
		transition:
			color 250ms var(--easeOutExpo),
			background-color 250ms var(--easeOutExpo),
			transform 250ms var(--easeOutExpo);

		&:active {
			transform: scale(0.95);
		}

		@media (hover: hover) {
			&:hover {
				color: var(--color-primary);
				background-color: var(--color-white);
			}
		}

		@media (prefers-reduced-motion: reduce) {
			transition: none;
		}
	}
</style>
