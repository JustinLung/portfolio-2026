const timeZone = 'Europe/Amsterdam';

const partsFormatter = new Intl.DateTimeFormat('en-GB', {
	timeZone,
	weekday: 'short',
	hour: '2-digit',
	minute: '2-digit',
	hourCycle: 'h23'
});

type Slot = { from: number; status: string };

// Guesses, not a live feed. Each slot runs until the next one starts; hours are 24h decimals.
const weekday: Slot[] = [
	{ from: 0, status: 'probably asleep' },
	{ from: 7.5, status: 'probably having breakfast' },
	{ from: 9, status: 'probably at my desk' },
	{ from: 12.5, status: 'probably getting lunch' },
	{ from: 13.5, status: 'probably at my desk' },
	{ from: 17.5, status: 'probably lifting' },
	{ from: 19, status: 'probably cooking dinner' },
	{ from: 20.5, status: 'probably winding down' },
	{ from: 23, status: 'probably asleep' }
];

const weekend: Slot[] = [
	{ from: 0, status: 'probably asleep' },
	{ from: 9, status: 'probably having breakfast' },
	{ from: 10.5, status: 'probably lifting' },
	{ from: 12, status: 'probably out and about' },
	{ from: 19, status: 'probably cooking dinner' },
	{ from: 20.5, status: 'probably winding down' },
	{ from: 23.5, status: 'probably asleep' }
];

export type AmsterdamStatus = { time: string; status: string };

export function getAmsterdamStatus(now: Date = new Date()): AmsterdamStatus {
	const parts = Object.fromEntries(partsFormatter.formatToParts(now).map((p) => [p.type, p.value]));
	const hour = Number(parts.hour);
	const minute = Number(parts.minute);
	const decimalHour = hour + minute / 60;

	const slots = parts.weekday === 'Sat' || parts.weekday === 'Sun' ? weekend : weekday;
	const { status } = slots.findLast((slot) => slot.from <= decimalHour) ?? slots[0];

	return { time: `${parts.hour}:${parts.minute}`, status };
}
