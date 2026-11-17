<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Seo from '$lib/components/shared/misc/Seo.svelte';
	import type { SearchIndex } from '../utils/types';

	const status = $derived(page.status);
	const notFound = $derived(status === 404);
	// 5xx here means WordPress, the content source, could not be reached or answered badly.
	const serverError = $derived(status >= 500);

	let suggestions = $state<{ label: string; href: string }[]>([]);
	let retrying = $state(false);

	// Suggestions are a nicety, so a failure just leaves the page without them.
	$effect(() => {
		if (!notFound) return;

		let cancelled = false;

		fetch(resolve('/search-index.json'))
			.then((response) => (response.ok ? (response.json() as Promise<SearchIndex>) : null))
			.then((index) => {
				if (!index || cancelled) return;

				suggestions = [
					...index.works.slice(0, 3).map(({ slug, title }) => ({
						label: `Project: ${title}`,
						href: resolve('/work/[slug]', { slug })
					})),
					...index.posts.slice(0, 3).map(({ slug, title }) => ({
						label: `Post: ${title}`,
						href: resolve('/write/[slug]', { slug })
					}))
				];
			})
			.catch(() => {});

		return () => (cancelled = true);
	});

	async function retry() {
		retrying = true;
		try {
			await invalidateAll();
		} finally {
			retrying = false;
		}
	}
</script>

<Seo title={notFound ? 'Page not found' : 'Something went wrong'} robots="noindex, follow" />

<section class="error">
	<div class="error__container">
		<h1>{status}</h1>
		{#if notFound}
			<p>
				I swear this worked on my local machine. The page you’re looking for doesn’t exist
				(anymore).
			</p>
		{:else if serverError}
			<p>
				The server that holds my content isn’t responding right now. That’s on my side, not yours.
				Try again in a moment.
			</p>
		{:else}
			<p>Something went wrong loading this page.</p>
		{/if}
	</div>

	<div class="error__actions">
		{#if serverError}
			<button
				type="button"
				class="button"
				onclick={retry}
				disabled={retrying}
				data-uisfx-hover="hover"
				data-uisfx="select"
			>
				{retrying ? 'Trying again…' : 'Try again'}
			</button>
		{/if}
		<a
			href={resolve('/')}
			class="button button--secondary"
			data-uisfx-hover="hover"
			data-uisfx="back"
		>
			Go back to the home page
		</a>
	</div>

	{#if suggestions.length > 0}
		<nav class="error__suggestions" aria-labelledby="error-suggestions-title">
			<h2 id="error-suggestions-title" class="font-small">Maybe you were looking for</h2>
			<ul>
				{#each suggestions as { label, href } (href)}
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- already built with resolve() above -->
					<li><a {href}>{label}</a></li>
				{/each}
			</ul>
		</nav>
	{/if}
</section>

<style>
	.error {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 32px;
		/* Clears the fixed header, and uses svh so mobile browser bars don't push content off screen. */
		min-height: calc(100svh - var(--header-height) - 64px);
		margin-top: calc(var(--header-height) + 64px);
		padding-bottom: 64px;
		text-align: center;
	}

	.error__container {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	h1 {
		margin: 0;
		padding: 0;
		font-size: 6rem;
		font-weight: 700;
		line-height: 1;

		@media (--viewport-lg-up) {
			font-size: 12rem;
		}
	}

	p {
		max-width: 520px;
		font-size: 1rem;

		@media (--viewport-lg-up) {
			font-size: 1.5rem;
		}
	}

	.error__actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 12px;
	}

	.error__suggestions {
		max-width: 520px;

		h2 {
			margin: 0 0 12px;
			color: var(--color-quaternary);
			font-weight: 400;
		}

		ul {
			display: flex;
			flex-direction: column;
			gap: 8px;
			margin: 0;
			padding: 0;
			list-style: none;
		}

		a {
			color: inherit;
			text-underline-offset: 0.2em;
		}
	}
</style>
