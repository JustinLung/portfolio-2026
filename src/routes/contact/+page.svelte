<script lang="ts">
	import Seo from '$lib/components/shared/misc/Seo.svelte';
	import { socialLinks } from '../../utils/links';
	import { playSfx } from '$lib/sfx.svelte';

	const email = 'justinlung77@gmail.com';

	function sendEmail(event: SubmitEvent) {
		event.preventDefault();

		const form = event.currentTarget as HTMLFormElement;
		const data = new FormData(form);
		const name = String(data.get('name') ?? '');
		const subject = String(data.get('subject') ?? 'New project inquiry');
		const message = String(data.get('message') ?? '');
		const replyTo = String(data.get('email') ?? '');
		const body = `Hi Justin,\n\n${message}\n\nFrom: ${name}\nEmail: ${replyTo}`;

		playSfx('send');
		window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
	}

	function handleFieldFocus(event: FocusEvent) {
		if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
			playSfx('focus');
		}
	}
</script>

<Seo
	title="Contact"
	description="Get in touch to discuss a new website, creative development project or collaboration."
/>

<section class="contact-page">
	<header class="contact-page__header">
		<span class="font-small">Contact / Let’s talk</span>
		<h1 class="contact-page__title">Write me a message.</h1>
	</header>

	<div class="contact-page__content">
		<aside class="contact-info" aria-label="Contact information">
			<dl>
				<div>
					<dt class="font-small">Email</dt>
					<dd>
						<a class="link" href={`mailto:${email}`} data-uisfx="focus" data-uisfx-hover="hover"
							>{email}</a
						>
					</dd>
				</div>
				<div>
					<dt class="font-small">Based in</dt>
					<dd>Amsterdam, The Netherlands</dd>
				</div>
				<div>
					<dt class="font-small">Elsewhere</dt>
					<dd class="contact-info__socials">
						{#each socialLinks as link (link.href)}
							<a
								class="link"
								href={link.href}
								target="_blank"
								rel="noopener noreferrer"
								data-uisfx-hover="hover"
								data-uisfx="forward"
							>
								{link.label}
							</a>
						{/each}
					</dd>
				</div>
			</dl>
		</aside>

		<form class="contact-form" onfocusin={handleFieldFocus} onsubmit={sendEmail}>
			<div class="contact-form__row">
				<label>
					<span class="font-small">Name</span>
					<input name="name" type="text" autocomplete="name" placeholder="Your name" required />
				</label>
				<label>
					<span class="font-small">Email</span>
					<input
						name="email"
						type="email"
						autocomplete="email"
						placeholder="you@example.com"
						required
					/>
				</label>
			</div>

			<label>
				<span class="font-small">Subject</span>
				<input name="subject" type="text" placeholder="What can I help you with?" required />
			</label>

			<label>
				<span class="font-small">Message</span>
				<textarea
					name="message"
					rows="6"
					placeholder="Tell me about your project, timeline and budget."
					required></textarea>
			</label>

			<button class="button contact-form__submit" type="submit" data-uisfx-hover="hover">
				Send inquiry
				<span aria-hidden="true">↗</span>
			</button>
		</form>
	</div>
</section>

<style>
	.contact-page {
		padding-block: 128px;
	}

	.contact-page__header {
		display: grid;
		gap: 20px;
		padding-bottom: 32px;
		border-bottom: 1px solid var(--color-primary);

		span {
			color: var(--color-quaternary);
		}

		h1 {
			max-width: 768px;
			font-size: 3rem;
			line-height: 0.95;
		}
	}

	.contact-page__content {
		display: grid;
		gap: 64px;
		padding-top: 48px;
	}

	.contact-info {
		dl {
			display: grid;
			gap: 24px;
		}

		dt {
			margin-bottom: 4px;
			color: var(--color-quaternary);
		}

		dd {
			margin: 0;
			font-size: 0.875rem;
		}

		a {
			color: inherit;
		}
	}

	.contact-info__socials {
		display: flex;
		flex-wrap: wrap;
		gap: 8px 20px;
	}

	.contact-form {
		display: grid;
		gap: 28px;

		label {
			display: grid;
			gap: 10px;
		}

		label > span {
			color: var(--color-quaternary);
		}

		input,
		textarea {
			width: 100%;
			padding: 0 0 12px;
			color: var(--color-white);
			background: transparent;
			border: 0;
			border-bottom: 1px solid var(--color-secondary);
			border-radius: 0;
			font: inherit;
			outline: none !important;
			transition: border-color 200ms ease;

			&::placeholder {
				color: var(--color-quaternary);
			}

			&:focus {
				border-color: var(--color-white);
			}
		}

		textarea {
			min-height: 140px;
			resize: vertical;
		}
	}

	.contact-form__row {
		display: grid;
		gap: 16px;
	}

	.contact-form__submit {
		gap: 8px;
		height: 42px;
		margin-top: 8px;
	}

	@media (--viewport-md-up) {
		.contact-page__header {
			padding-bottom: 48px;

			h1 {
				font-size: 5rem;
			}
		}

		.contact-page__content {
			grid-template-columns: minmax(240px, 1fr) minmax(0, 2fr);
			padding-top: 64px;
		}

		.contact-form__row {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 24px;
		}
	}
</style>
