<script lang="ts">
	import { resolve } from '$app/paths';
	import { links, policyLinks, socialLinks } from '../../../utils/links';
	import SettingsIcon from '$lib/assets/icons/settings.svg?component';
	import { getAmsterdamStatus, type AmsterdamStatus } from '../../../utils/amsterdam-status';

	const year = new Date().getFullYear();

	/** Toggle this to flip the availability badge between green and red. */
	const availableForProjects = true;

	let amsterdam = $state<AmsterdamStatus | null>(null);

	$effect(() => {
		let timeout: ReturnType<typeof setTimeout>;

		function tick() {
			amsterdam = getAmsterdamStatus();
			timeout = setTimeout(tick, 60_000 - (Date.now() % 60_000));
		}

		tick();
		return () => clearTimeout(timeout);
	});
</script>

<footer class="footer">
	<div class="footer__inner container">
		<div class="footer__cta">
			<div class="footer__status">
				<span
					class="footer__eyebrow font-small"
					class:footer__eyebrow--available={availableForProjects}
					class:footer__eyebrow--unavailable={!availableForProjects}
				>
					{availableForProjects ? 'Open to select projects' : 'Currently unavailable for projects'}
				</span>
				{#if amsterdam}
					<span class="footer__local-time font-small">
						Currently {amsterdam.time} in Amsterdam, {amsterdam.status}
					</span>
				{/if}
			</div>
			<p class="font-heading-4 font__heading font-heading">
				Have a project in mind?<br />I promise only 3% of my time is spent Googling.
			</p>
		</div>

		<nav class="footer__navigation" aria-label="Footer navigation">
			<div class="footer__column">
				<p class="footer__label font-small">Explore</p>
				<ul class="footer__links" role="list">
					{#each links as link (link.href)}
						<li>
							<a
								href={resolve(link.href as '/')}
								data-uisfx-hover="hover"
								data-uisfx="forward"
								class="link">{link.label}</a
							>
						</li>
					{/each}
				</ul>
			</div>

			<div class="footer__column">
				<p class="footer__label font-small">Socials</p>
				<ul class="footer__links" role="list">
					{#each socialLinks as link (link.href)}
						<li>
							<a
								href={link.href}
								target="_blank"
								rel="noopener noreferrer"
								data-uisfx-hover="hover"
								data-uisfx="forward"
								class="link">{link.label}</a
							>
						</li>
					{/each}
				</ul>
			</div>
		</nav>

		<div class="footer__meta font-small">
			<p>© {year} Portfolio</p>
			<div class="footer__controls">
				<button
					type="button"
					class="footer__settings-button"
					aria-haspopup="dialog"
					data-uisfx-hover="hover"
					onclick={() => window.dispatchEvent(new CustomEvent('opensettings'))}
				>
					<SettingsIcon aria-hidden="true" />
					<span class="link">Settings</span>
				</button>
				<div class="footer__policy-links">
					{#each policyLinks as link (link.href)}
						<a href={link.href} class="link" data-uisfx-hover="hover" data-uisfx="forward"
							>{link.label}</a
						>
					{/each}
				</div>
			</div>
		</div>
	</div>
</footer>

<style>
	.footer {
		color: var(--color-white);
		background-color: var(--color-tertiary);

		.footer__inner {
			display: grid;
			gap: 64px;
			padding-block: 32px 24px;
		}

		.footer__cta {
			display: flex;
			flex-direction: column;
			align-items: flex-start;
			margin-bottom: 64px;
		}

		.footer__status {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: 8px 12px;
			margin-bottom: 12px;
		}

		.footer__local-time {
			color: var(--color-quaternary);
			font-variant-numeric: tabular-nums;
		}

		.footer__eyebrow {
			padding: 4px 8px;
			border-radius: 16px;
			font-weight: 500;
			color: var(--color-white);
			display: inline-flex;
			align-items: center;
			gap: 8px;

			&::before {
				content: '';
				width: 8px;
				height: 8px;
				display: inline-block;
				border-radius: 50%;
			}

			&.footer__eyebrow--available {
				background-color: var(--color-dark-green);

				&::before {
					background-color: var(--color-light-green);
				}
			}

			&.footer__eyebrow--unavailable {
				background-color: var(--color-dark-red);

				&::before {
					background-color: var(--color-light-red);
				}
			}
		}

		.footer__navigation {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 24px;
			align-self: end;
		}

		.footer__label {
			color: var(--color-quaternary);
		}

		.footer__links {
			display: grid;
			gap: 8px;
			margin: 12px 0 0;
			padding: 0;
			list-style: none;

			a {
				display: inline-block;
				color: inherit;
				font-size: 0.875rem;
				text-decoration: none;
			}
		}

		.link {
			cursor: pointer;
		}

		.footer__meta {
			display: flex;
			justify-content: space-between;
			align-items: flex-end;
			gap: 24px;
			padding-top: 16px;
			border-top: 1px solid var(--color-primary);

			p {
				margin: 0;
			}

			a {
				color: inherit;
				font-size: 0.875rem;
				text-decoration: none;
				white-space: nowrap;
			}
		}

		.footer__policy-links {
			display: flex;
			gap: 16px;

			a {
				text-decoration: underline;
				text-underline-offset: 4px;
			}
		}

		.footer__settings-button {
			display: inline-flex;
			gap: 8px;
			align-items: center;
			padding: 0;
			border: 0;
			color: inherit;
			background: transparent;
			font: inherit;
			font-size: 0.875rem;
			cursor: pointer;

			/* The icon's dots default to the header's background; match the footer's. */
			& :global(circle) {
				fill: var(--color-tertiary);
			}

			@media (hover: hover) {
				&:hover .link {
					background-size: 100% 1px;
				}
			}

			&:focus-visible {
				outline: 2px solid currentColor;
				outline-offset: 4px;
			}
		}

		.footer__controls {
			display: flex;
			flex-wrap: wrap;
			justify-content: flex-end;
			gap: 16px 24px;
		}

		@media (--viewport-md-up) {
			.footer__inner {
				position: relative;
				grid-template-columns: repeat(4, minmax(0, 1fr));
				grid-template-rows: auto 1fr auto;
				gap: 0 32px;
				padding-block: 48px 32px;
			}

			.footer__cta {
				grid-column: 1 / 3;
				grid-row: 1;
				margin-bottom: 128px;
			}

			.footer__heading {
				max-width: 620px;
			}

			.footer__navigation {
				grid-column: 1 / 3;
				grid-row: 2;
				align-self: end;
				margin-bottom: 40px;
			}

			.footer__meta {
				grid-row: 3;
				grid-column: 1 / -1;
			}
		}

		@media (--viewport-lg-up) {
			.footer__navigation {
				gap: 48px;
			}
		}
	}
</style>
