<script lang="ts">
	import type { ExperienceItem } from '../../../../utils/types';

	let { item }: { item: ExperienceItem } = $props();
</script>

<!--
	@component
	An external-link row for a work or education experience.
-->
<li class="experience-item">
	<!-- eslint-disable svelte/no-navigation-without-resolve -- external experience URLs -->
	<a
		href={item.link}
		class="experience-item__link"
		target="_blank"
		rel="noopener noreferrer"
		data-uisfx-hover="hover"
		data-uisfx="open"
	>
		<span class="experience-item__title">{item.title}</span>
		<span class="experience-item__role">{item.role}</span>
		<span class="experience-item__year"
			>{item.startYear} - {#if item.currentYear}current{:else}{item.endYear}{/if}</span
		>
		<span class="experience-item__external" aria-hidden="true">↗</span>
		<span class="visually-hidden">(opens in a new tab)</span>
	</a>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
</li>

<style>
	.experience-item {
		position: relative;
		border-top: 1px solid var(--color-primary);

		&:last-child {
			border-bottom: 1px solid var(--color-primary);
		}

		&::before {
			position: absolute;
			inset: 0;
			z-index: 0;
			background-color: var(--color-white);
			content: '';
			pointer-events: none;
			transform: scaleY(0);
			transform-origin: bottom;
			transition: transform 450ms var(--easeOutExpo);
		}

		&:hover::before,
		&:focus-within::before {
			transform: scaleY(1);
		}

		&:hover .experience-item__link,
		&:focus-within .experience-item__link {
			color: var(--color-black);
		}

		.experience-item__link {
			position: relative;
			z-index: 1;
			display: grid;
			grid-template-columns: 1fr auto;
			gap: 6px 16px;
			width: 100%;
			padding: 18px 8px;
			color: var(--color-white);
			font-size: 0.875rem;
			text-decoration: none;

			.experience-item__title {
				grid-row: 1;
				grid-column: 1;
				font-size: 1rem;
			}

			.experience-item__role {
				grid-row: 2;
				grid-column: 1 / -1;
				color: var(--color-quaternary);
			}

			.experience-item__year {
				grid-row: 1;
				grid-column: 2;
			}

			.experience-item__external {
				display: none;
			}
		}
	}

	@media (--viewport-md-up) {
		.experience-item {
			.experience-item__link {
				display: grid;
				grid-template-columns: minmax(0, 1fr) minmax(10rem, 1fr) minmax(8rem, auto) 1.5rem;
				gap: 16px;
				align-items: center;
				padding: 16px 8px;

				.experience-item__title,
				.experience-item__role,
				.experience-item__year,
				.experience-item__external {
					grid-row: auto;
					grid-column: auto;
				}

				.experience-item__title {
					font-size: inherit;
				}

				.experience-item__role {
					color: inherit;
				}

				.experience-item__year {
					text-align: right;
				}

				.experience-item__external {
					display: block;
					text-align: right;
					transition: transform 250ms var(--easeOutExpo);
				}
			}

			&:hover .experience-item__external,
			&:focus-within .experience-item__external {
				transform: translate(2px, -2px);
			}
		}
	}

	@media (--motion-reduce) {
		.experience-item::before,
		.experience-item__external {
			transition-duration: 0.01ms;
		}
	}
</style>
