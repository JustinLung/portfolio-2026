<script lang="ts">
	import { readReducedMotion } from '$lib/settings.svelte';
	import { onMount } from 'svelte';
	import gsap from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';

	gsap.registerPlugin(ScrollTrigger);

	let sectionRef: HTMLElement;

	const lines = [
		'Design with intent.',
		'Code with character.',
		'Motion with purpose.',
		'Digital, but human.'
	];

	onMount(() => {
		if (readReducedMotion()) return;

		const context = gsap.context(() => {
			const words = gsap.utils.toArray<HTMLElement>('.manifesto__word');
			gsap.to(words, {
				color: '#ffffff',
				stagger: 0.08,
				ease: 'none',
				scrollTrigger: {
					trigger: '.manifesto__statement',
					start: 'top 75%',
					end: 'bottom 50%',
					scrub: true
				}
			});

			gsap.from('.manifesto__meta', {
				opacity: 0,
				y: 24,
				duration: 0.7,
				ease: 'power3.out',
				scrollTrigger: {
					trigger: '.manifesto__meta',
					start: 'top 88%',
					once: true
				}
			});

			gsap.from('.manifesto__footer', {
				opacity: 0,
				y: 24,
				duration: 0.7,
				ease: 'power3.out',
				scrollTrigger: {
					trigger: '.manifesto__footer',
					start: 'top 88%',
					once: true
				}
			});
		}, sectionRef);

		return () => context.revert();
	});
</script>

<section class="manifesto" bind:this={sectionRef} aria-labelledby="manifesto-title">
	<header class="manifesto__meta font-small">
		<span>Manifesto / 01</span>
		<span>Design · Code · Motion</span>
	</header>

	<h2 id="manifesto-title" class="visually-hidden">{lines.join(' ')}</h2>
	<div class="manifesto__statement" aria-hidden="true">
		{#each lines as line, lineIndex (line)}
			<p class:manifesto__line--accent={lineIndex % 2 === 1} class="manifesto__line">
				{#each line.split(' ') as word, wordIndex (`${line}-${wordIndex}`)}
					<span class="manifesto__word-mask">
						<span class="manifesto__word">{word}</span>
					</span>
				{/each}
			</p>
		{/each}
	</div>

	<footer class="manifesto__footer">
		<p>
			I create expressive digital experiences where thoughtful design, clean development and
			meaningful motion work as one.
		</p>
		<span class="font-small" aria-hidden="true">Scroll to explore ↓</span>
	</footer>
</section>

<style>
	.manifesto {
		position: relative;
		margin-block: 128px;
		padding-block: 32px;
		overflow: clip;
		border-block: 1px solid var(--color-primary);
	}

	.manifesto__meta,
	.manifesto__footer {
		display: flex;
		justify-content: space-between;
		gap: 24px;
		color: var(--color-quaternary);
	}

	.manifesto__statement {
		display: grid;
		justify-items: center;
		margin-block: 128px;
	}

	.manifesto__line {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: 0 0.3em;
		width: auto;
		max-width: 100%;
		margin: 0;
		color: rgb(255 255 255 / 18%);
		font-family: var(--font-family-heading);
		font-size: clamp(2rem, 6.6vw, 6.5rem);
		line-height: 1.05;
		text-align: center;
	}

	.manifesto__line--accent {
		font-family: var(--font-family-body);
	}

	.manifesto__word-mask {
		display: inline-block;
		overflow: visible;
	}

	.manifesto__word {
		display: inline-block;
		will-change: color;
	}

	.manifesto__footer {
		align-items: end;

		p {
			max-width: 38rem;
			margin: 0;
			color: var(--color-white);
			font-size: clamp(1rem, 1.8vw, 1.35rem);
		}

		span {
			flex: none;
			text-align: right;
		}
	}

	@media (--viewport-md-down) {
		.manifesto {
			margin-block: 96px;
		}

		.manifesto__meta span:last-child,
		.manifesto__footer > span {
			display: none;
		}

		.manifesto__statement {
			justify-items: start;
			margin-block: 72px;
		}

		.manifesto__line {
			justify-content: flex-start;
			width: auto;
			font-size: clamp(2.1rem, 10vw, 4rem);
			text-align: left;
		}
	}

	@media (--motion-reduce) {
		.manifesto__line {
			color: var(--color-white);
		}

		.manifesto__word {
			will-change: auto;
		}
	}
</style>
