<script lang="ts">
	import Seo from '$lib/components/shared/misc/Seo.svelte';
	import { socialLinks } from '../../utils/links';
	import { playSfx } from '$lib/sfx.svelte';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import {
		CONTACT_LIMITS,
		HONEYPOT_FIELD,
		type ContactErrors,
		type ContactField
	} from '$lib/contact';
	import type { PageProps } from './$types';

	const email = 'justinlung77@gmail.com';

	let { form }: PageProps = $props();
	let sending = $state(false);

	const errors: ContactErrors = $derived(form?.errors ?? {});
	// `form` keeps its last result, so "send another" hides the confirmation locally.
	let dismissed = $state(false);
	const sent = $derived(form?.success === true && !dismissed);

	const submit: SubmitFunction = () => {
		sending = true;
		dismissed = false;
		playSfx('send');

		return async ({ update }) => {
			await update();
			sending = false;
		};
	};

	/** Moves focus to the confirmation so keyboard and screen-reader users land on it. */
	const focusOnMount = (node: HTMLElement) => node.focus();

	/** Props that tie a field to its error message for assistive tech. */
	const invalid = (field: ContactField) =>
		errors[field]
			? { 'aria-invalid': 'true' as const, 'aria-describedby': `contact-${field}-error` }
			: {};

	function handleFieldFocus(event: FocusEvent) {
		if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
			playSfx('focus');
		}
	}
</script>

{#snippet fieldError(field: ContactField)}
	{#if errors[field]}
		<span class="contact-form__field-error" id={`contact-${field}-error`}>{errors[field]}</span>
	{/if}
{/snippet}

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

		{#if sent}
			<div class="contact-form__status" role="status" tabindex="-1" {@attach focusOnMount}>
				<span class="contact-form__status-icon" aria-hidden="true">✓</span>
				<h2 class="contact-form__status-title">Message sent.</h2>
				<p>Thanks for reaching out. I’ll get back to you as soon as I can.</p>
				<button
					class="contact-form__status-action link"
					type="button"
					data-uisfx-hover="hover"
					onclick={() => (dismissed = true)}
				>
					Send another message
				</button>
			</div>
		{:else}
			<form
				class="contact-form"
				method="POST"
				novalidate
				use:enhance={submit}
				onfocusin={handleFieldFocus}
			>
				{#if form?.message}
					<p class="contact-form__error" role="alert">{form.message}</p>
				{/if}

				<div class="contact-form__row">
					<label>
						<span class="font-small">Name</span>
						<input
							name="name"
							type="text"
							autocomplete="name"
							placeholder="Your name"
							value={form?.values?.name ?? ''}
							required
							maxlength={CONTACT_LIMITS.name}
							{...invalid('name')}
						/>
						{@render fieldError('name')}
					</label>
					<label>
						<span class="font-small">Email</span>
						<input
							name="email"
							type="email"
							autocomplete="email"
							placeholder="you@example.com"
							value={form?.values?.email ?? ''}
							required
							maxlength={CONTACT_LIMITS.email}
							{...invalid('email')}
						/>
						{@render fieldError('email')}
					</label>
				</div>

				<label>
					<span class="font-small">Subject</span>
					<input
						name="subject"
						type="text"
						placeholder="What can I help you with?"
						value={form?.values?.subject ?? ''}
						required
						maxlength={CONTACT_LIMITS.subject}
						{...invalid('subject')}
					/>
					{@render fieldError('subject')}
				</label>

				<label>
					<span class="font-small">Message</span>
					<textarea
						name="message"
						rows="6"
						placeholder="Tell me about your project, timeline and budget."
						required
						maxlength={CONTACT_LIMITS.message}
						{...invalid('message')}>{form?.values?.message ?? ''}</textarea
					>
					{@render fieldError('message')}
				</label>

				<!-- Honeypot: hidden from people and assistive tech; bots tend to fill it in. -->
				<div class="contact-form__trap" aria-hidden="true">
					<label>
						Website
						<input name={HONEYPOT_FIELD} type="text" tabindex="-1" autocomplete="off" />
					</label>
				</div>

				<button
					class="button contact-form__submit"
					type="submit"
					disabled={sending}
					data-uisfx-hover="hover"
				>
					{sending ? 'Sending…' : 'Send inquiry'}
					<span aria-hidden="true">↗</span>
				</button>
			</form>
		{/if}
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

	.contact-form__field-error,
	.contact-form__error {
		color: var(--color-light-red);
		font-size: 0.8125rem;
	}

	.contact-form__status {
		display: grid;
		justify-items: start;
		align-content: start;
		gap: 12px;
		padding: 24px;
		border: 1px solid var(--color-dark-green);
		border-radius: 8px;
		background: color-mix(in srgb, var(--color-dark-green) 18%, transparent);

		&:focus {
			outline: none;
		}

		p {
			margin: 0;
		}
	}

	.contact-form__status-icon {
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: var(--color-light-green);
		color: var(--color-neutral-950);
		font-weight: 700;
	}

	.contact-form__status-title {
		color: var(--color-light-green);
	}

	.contact-form__status-action {
		padding: 0;
		border: 0;
		background-color: transparent;
		color: inherit;
		font: inherit;
		cursor: pointer;
	}

	.contact-form__trap {
		position: absolute;
		left: -9999px;
		width: 1px;
		height: 1px;
		overflow: hidden;
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
