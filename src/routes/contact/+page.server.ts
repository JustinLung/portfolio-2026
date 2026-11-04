import { HONEYPOT_FIELD, readContactValues, validateContact } from '$lib/contact';
import { isRateLimited, sendContactEmail } from '$lib/server/contact';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, getClientAddress, fetch }) => {
		const data = await request.formData();

		// Pretend success so bots learn nothing.
		if (String(data.get(HONEYPOT_FIELD) ?? '') !== '') {
			return { success: true };
		}

		const values = readContactValues(data);
		const errors = validateContact(values);

		if (Object.keys(errors).length > 0) {
			return fail(400, { values, errors });
		}

		const reject = (status: number, message: string) =>
			fail(status, { values, errors: {}, message });

		if (isRateLimited(getClientAddress())) {
			return reject(429, 'Too many messages in a short time. Please try again in a few minutes.');
		}

		try {
			await sendContactEmail(values, fetch);
		} catch (cause) {
			console.error('Failed to send contact email', cause);
			return reject(
				502,
				'Something went wrong sending your message. Please email me directly instead.'
			);
		}

		return { success: true };
	}
};
