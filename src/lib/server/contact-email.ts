import type { ContactValues } from '$lib/contact';

const escapeHtml = (value: string) =>
	value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');

const sentFormatter = new Intl.DateTimeFormat('en-GB', {
	dateStyle: 'long',
	timeStyle: 'short',
	timeZone: 'Europe/Amsterdam'
});

const ACCENT = '#ff2c78';

/**
 * Notification email for a contact inquiry. Email clients ignore most CSS, so this is
 * table-based markup with inline styles. Every visitor-supplied value is escaped.
 */
export function renderContactEmail(values: ContactValues, sentAt = new Date()) {
	const name = escapeHtml(values.name);
	const email = escapeHtml(values.email);
	const subject = escapeHtml(values.subject);
	const message = escapeHtml(values.message).replace(/\r?\n/g, '<br />');
	const replyHref = `mailto:${encodeURIComponent(values.email)}?subject=${encodeURIComponent(
		`Re: ${values.subject}`
	)}`;
	const sent = sentFormatter.format(sentAt);

	const labelStyle = 'font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#8c8177;';
	const valueStyle = 'font-size:15px;line-height:1.5;color:#2f2a24;';

	const html = `<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:#f4f1ed;">
	<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${name}: ${subject}</div>
	<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ed;padding:32px 16px;">
		<tr>
			<td align="center">
				<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:8px;border:1px solid #e4ded6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
					<tr>
						<td style="padding:24px 32px 0;">
							<div style="width:32px;height:3px;background:${ACCENT};border-radius:2px;"></div>
							<p style="margin:16px 0 4px;${labelStyle}">New inquiry · Portfolio</p>
							<h1 style="margin:0;font-size:22px;line-height:1.3;color:#2f2a24;">${subject}</h1>
						</td>
					</tr>
					<tr>
						<td style="padding:24px 32px 0;">
							<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
								<tr>
									<td width="50%" valign="top" style="padding-bottom:16px;">
										<div style="${labelStyle}">From</div>
										<div style="${valueStyle}">${name}</div>
									</td>
									<td width="50%" valign="top" style="padding-bottom:16px;">
										<div style="${labelStyle}">Email</div>
										<div style="${valueStyle}"><a href="mailto:${email}" style="color:#2f2a24;">${email}</a></div>
									</td>
								</tr>
							</table>
						</td>
					</tr>
					<tr>
						<td style="padding:0 32px;">
							<div style="${labelStyle}padding-bottom:6px;">Message</div>
							<div style="${valueStyle}padding:16px;background:#f4f1ed;border-radius:6px;">${message}</div>
						</td>
					</tr>
					<tr>
						<td style="padding:24px 32px 8px;">
							<a href="${replyHref}" style="display:inline-block;padding:12px 20px;background:#2f2a24;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:6px;">Reply to ${name}</a>
						</td>
					</tr>
					<tr>
						<td style="padding:16px 32px 28px;font-size:12px;color:#8c8177;">
							Sent ${escapeHtml(sent)} via the contact form. You can also reply directly to this email.
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>`;

	const text = `New inquiry from your portfolio

From: ${values.name} <${values.email}>
Subject: ${values.subject}
Sent: ${sent}

${values.message}

Reply directly to this email to respond.`;

	return { html, text };
}
