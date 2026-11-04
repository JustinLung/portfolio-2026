<script lang="ts">
	import type { TocItem } from '../../../../utils/post-content';

	let { items }: { items: TocItem[] } = $props();

	let activeId = $state<string>();

	// Matches the headings' scroll-margin-top, which Lenis ignores.
	const SCROLL_OFFSET = 96;

	function scrollToHeading(event: MouseEvent, id: string) {
		const lenis = window.Lenis;
		const heading = document.getElementById(id);
		// Without Lenis (reduced motion) the native anchor jump handles it.
		if (!lenis || !heading) return;

		event.preventDefault();
		lenis.scrollTo(heading, { offset: -SCROLL_OFFSET });
		history.replaceState(history.state, '', `#${id}`);
	}

	$effect(() => {
		let visible: string[] = [];
		const observer = new IntersectionObserver(
			(entries) => {
				for (const { target, isIntersecting } of entries) {
					visible = isIntersecting
						? [...visible, target.id]
						: visible.filter((id) => id !== target.id);
				}

				// The first heading in document order that is in the reading band wins.
				activeId = items.find(({ id }) => visible.includes(id))?.id ?? activeId;
			},
			{ rootMargin: '-80px 0px -65% 0px' }
		);

		for (const { id } of items) {
			const heading = document.getElementById(id);
			if (heading) observer.observe(heading);
		}

		return () => observer.disconnect();
	});
</script>

{#if items.length > 1}
	<nav class="toc" aria-label="Table of contents">
		<p class="toc__title font-small">On this page</p>
		<ol class="toc__list">
			{#each items as item (item.id)}
				<li class="toc__item" class:toc__item--sub={item.level === 3}>
					<a
						href={`#${item.id}`}
						aria-current={activeId === item.id ? 'location' : undefined}
						data-uisfx-hover="hover"
						onclick={(event) => scrollToHeading(event, item.id)}
					>
						{item.text}
					</a>
				</li>
			{/each}
		</ol>
	</nav>
{/if}

<style>
	.toc {
		.toc__title {
			margin-bottom: 12px;
			color: var(--color-quaternary);
		}

		.toc__list {
			display: grid;
			gap: 8px;
			margin: 0;
			padding: 0;
			list-style: none;
		}

		.toc__item--sub {
			padding-left: 12px;
		}

		a {
			color: var(--color-quaternary);
			font-size: 0.8125rem;
			line-height: 1.4;
			text-decoration: none;
			transition: color 250ms var(--easeOutExpo);

			&:hover,
			&[aria-current='location'] {
				color: var(--color-white);
			}
		}
	}
</style>
