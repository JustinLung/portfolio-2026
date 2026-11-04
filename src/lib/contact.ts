/** Contact form fields and rules, shared by the server action and the page. */
export const CONTACT_FIELDS = ['name', 'email', 'subject', 'message'] as const;

export type ContactField = (typeof CONTACT_FIELDS)[number];
export type ContactValues = Record<ContactField, string>;
export type ContactErrors = Partial<Record<ContactField, string>>;

export const CONTACT_LIMITS: Record<ContactField, number> = {
	name: 100,
	email: 254,
	subject: 150,
	message: 5000
};

/** Name of the hidden spam-trap input. Humans never see it, bots tend to fill it in. */
export const HONEYPOT_FIELD = 'website';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RULES: Record<ContactField, (value: string) => string | undefined> = {
	name: (value) => (value ? undefined : 'Please enter your name.'),
	email: (value) => (EMAIL_PATTERN.test(value) ? undefined : 'Please enter a valid email address.'),
	subject: (value) => (value ? undefined : 'Please enter a subject.'),
	message: (value) => (value.length >= 10 ? undefined : 'Please write a few more words.')
};

export function readContactValues(data: FormData): ContactValues {
	const values = Object.fromEntries(
		CONTACT_FIELDS.map((field) => [field, String(data.get(field) ?? '').trim()])
	) as ContactValues;

	// The subject ends up in an email header and heading, so keep it on one line.
	values.subject = values.subject.replace(/\s+/g, ' ');

	return values;
}

export function validateContact(values: ContactValues): ContactErrors {
	const errors: ContactErrors = {};

	for (const field of CONTACT_FIELDS) {
		const tooLong =
			values[field].length > CONTACT_LIMITS[field]
				? `Please keep this under ${CONTACT_LIMITS[field]} characters.`
				: undefined;
		const message = tooLong ?? RULES[field](values[field]);

		if (message) errors[field] = message;
	}

	return errors;
}
