<script lang="ts">
	import { resolve } from '$app/paths';
	import Seo from '$lib/components/shared/misc/Seo.svelte';
	import ReadProgress from '$lib/components/shared/ui/ReadProgress.svelte';
	import ShareButtons from '$lib/components/shared/ui/ShareButtons.svelte';
	import WorkPager from '$lib/components/shared/work-components/WorkPager.svelte';
	import { headingLinks } from '$lib/actions/heading-links';
	import { onMount } from 'svelte';
	import { observeHeaderHeight } from '../../../utils/header-height';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let headerHeight = $state(0);
	let article = $state<HTMLElement>();

	onMount(() => observeHeaderHeight((height) => (headerHeight = height)));
</script>

<Seo
	title={data.work.title}
	description={data.work.excerpt ?? data.work.title}
	ogImage={`/og/work/${data.work.slug}.png`}
	ogImageAlt={data.work.title}
/>

<ReadProgress target={article} />

<article
	bind:this={article}
	class="work-detail"
	aria-labelledby="work-title"
	style={`--header-height: ${headerHeight}px`}
>
	<header class="work-detail__aside">
		<nav aria-label="Work navigation">
			<a
				class="work-detail__back button"
				href={resolve('/work')}
				data-uisfx-hover="hover"
				data-uisfx="back"
			>
				← Back to all work
			</a>
		</nav>

		<h1 id="work-title">{data.work.title}</h1>
		{#if data.work.excerpt}
			<p class="work-detail__excerpt">{data.work.excerpt}</p>
		{/if}

		{#if data.work.role || data.work.at || data.work.year || data.work.siteUrl || data.work.githubUrl}
			<dl class="work-detail__meta">
				{#if data.work.role}
					<div>
						<dt>Role</dt>
						<dd>{data.work.role}</dd>
					</div>
				{/if}
				{#if data.work.at}
					<div>
						<dt>Location</dt>
						<dd>{data.work.at}</dd>
					</div>
				{/if}
				{#if data.work.year}
					<div>
						<dt>Year</dt>
						<dd><time datetime={String(data.work.year)}>{data.work.year}</time></dd>
					</div>
				{/if}
				{#if data.work.siteUrl}
					<div>
						<dt>Website</dt>
						<dd>
							<a
								href={data.work.siteUrl}
								target="_blank"
								rel="external noopener noreferrer"
								class="work-detail__link"
								data-uisfx-hover="hover"
								data-uisfx="open"
							>
								Visit live site<span class="visually-hidden"> (opens in a new tab)</span>
							</a>
						</dd>
					</div>
				{/if}
				{#if data.work.githubUrl}
					<div>
						<dt>Source code</dt>
						<dd>
							<a
								href={data.work.githubUrl}
								target="_blank"
								rel="external noopener noreferrer"
								class="work-detail__link"
								data-uisfx-hover="hover"
								data-uisfx="open"
							>
								View on GitHub<span class="visually-hidden"> (opens in a new tab)</span>
							</a>
						</dd>
					</div>
				{/if}
			</dl>
		{/if}

		<div class="work-detail__share">
			<ShareButtons title={data.work.title} />
		</div>
	</header>

	<section class="work-detail__main" aria-labelledby="project-content-title">
		<h2 id="project-content-title" class="visually-hidden">Project details</h2>
		{#if data.work.content}
			<div class="work-detail__content" use:headingLinks={data.work.content}>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -- Content comes from the trusted WordPress CMS. -->
				{@html data.work.content}
			</div>
		{/if}
	</section>
</article>

<WorkPager previous={data.previous} next={data.next} />

<style>
	.work-detail {
		margin-block: 128px 0;
		justify-content: space-between;
		gap: 64px;

		.work-detail__aside {
			margin-bottom: 48px;
		}

		.work-detail__back {
			margin-bottom: 24px;
		}

		.work-detail__share {
			margin-top: 32px;
		}

		.work-detail__meta {
			margin: 32px 0 0;
			display: flex;
			flex-direction: column;
			gap: 16px;

			div {
				display: flex;
				flex-direction: column;
				gap: 4px;
				font-size: 0.875rem;
			}

			dt {
				color: var(--color-quaternary);
			}

			dd {
				margin: 0;
			}
		}

		.work-detail__excerpt {
			margin-top: 24px;
			max-width: 768px;
		}

		.work-detail__link {
			color: inherit;
			text-decoration: underline;
		}

		.work-detail__content {
			display: grid;
			gap: 16px;
			font-size: 1rem;

			:global(p) {
				max-width: 38rem;
			}

			:global(img) {
				width: 100%;
				height: auto;

				display: block;
				width: 100%;
				aspect-ratio: 16 / 9;
				object-fit: cover;
				object-position: center;
				height: auto;
				border-radius: 4px;
			}

			:global(video) {
				width: 100%;
				height: auto;

				display: block;
				width: 100%;
				aspect-ratio: 16 / 9;
				object-fit: cover;
				object-position: center;
				height: auto;
				border-radius: 4px;
			}

			/* Skeleton shown behind media until the image or first video frame paints over it. */
			:global(img),
			:global(video) {
				background-color: var(--color-tertiary);
				background-image: linear-gradient(
					100deg,
					transparent 30%,
					color-mix(in srgb, var(--color-white) 8%, transparent) 50%,
					transparent 70%
				);
				background-size: 200% 100%;
				background-repeat: no-repeat;

				@media (--motion-allow) {
					animation: work-media-skeleton 1.4s linear infinite;
				}
			}

			:global(a) {
				color: inherit;
			}
		}

		@media (--viewport-md-up) {
			display: flex;
			align-items: flex-start;

			.work-detail__aside {
				position: sticky;
				top: var(--header-height);
				margin-bottom: 0;
				flex: 0 0 clamp(18rem, 34vw, 28rem);

				/* Mono titles are wide: scale with the column so they never run into the media. */
				h1 {
					font-size: min(var(--font-size-h1), 4vw);
					overflow-wrap: anywhere;
				}
			}

			/* Fixed width from the flex layout, so media can't resize it once its metadata loads. */
			.work-detail__main {
				flex: 1 1 0;
				min-width: 0;
			}
		}
	}

	@keyframes work-media-skeleton {
		from {
			background-position: 150% 0;
		}
		to {
			background-position: -50% 0;
		}
	}
</style>
