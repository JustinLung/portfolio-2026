import generalSansSemibold from '$lib/assets/fonts/GeneralSans-Semibold.woff?inline';
import fragmentMono from '$lib/assets/fonts/FragmentMono-Regular.ttf?inline';
import { Resvg } from '@resvg/resvg-js';
import satori, { type Font } from 'satori';
import sharp from 'sharp';

export type OgImageInput = {
	/** Seeds the ASCII pattern, so every page gets its own artwork. */
	slug: string;
	kind: string;
	title: string;
	/** Category, plus year or date. Empty parts are skipped. */
	meta: (string | undefined)[];
	/** From `loadOgPhoto`. Replaces the ASCII artwork when present. */
	photo?: string;
};

const WIDTH = 1200;
const HEIGHT = 630;
const PADDING = 72;
const PHOTO_WIDTH = 520;

// Ember theme tokens from src/lib/css/colors.css. Satori can't read CSS custom properties.
const colors = {
	background: '#14100c',
	text: '#ffffff',
	muted: '#8c8177',
	accent: '#ff2c78'
};

const decode = (dataUrl: string) => Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');

const fonts: Font[] = [
	{ name: 'General Sans', data: decode(generalSansSemibold), weight: 600, style: 'normal' },
	{ name: 'Fragment Mono', data: decode(fragmentMono), weight: 400, style: 'normal' }
];

type Node = { type: string; props: { style: Record<string, unknown>; children?: unknown } };

/** Satori needs `display: flex` on every element that has more than one child. */
const el = (style: Record<string, unknown>, children?: unknown): Node => ({
	type: 'div',
	props: { style: { display: 'flex', ...style }, children }
});

function hash(value: string): number {
	let result = 2166136261;
	for (const char of value) {
		result = Math.imul(result ^ char.codePointAt(0)!, 16777619);
	}
	return result >>> 0;
}

/** A small seeded PRNG (mulberry32). */
function random(seed: number) {
	return () => {
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const RAMP = ' .:-=+*#%@';
const COLUMNS = 56;
const ROWS = 26;

/** Rows of mono characters that thicken toward the right edge, echoing the hero's ASCII shader. */
function asciiRows(slug: string): string[] {
	const next = random(hash(slug));
	const waves = Array.from({ length: 4 }, () => ({
		fx: 0.08 + next() * 0.22,
		fy: 0.1 + next() * 0.3,
		px: next() * Math.PI * 2,
		py: next() * Math.PI * 2
	}));

	return Array.from({ length: ROWS }, (_, y) =>
		Array.from({ length: COLUMNS }, (_, x) => {
			const noise =
				waves.reduce((sum, w) => sum + Math.sin(x * w.fx + w.px) * Math.sin(y * w.fy + w.py), 0) /
					waves.length /
					2 +
				0.5;
			const mask = Math.max(0, (x / COLUMNS - 0.25) / 0.75) ** 1.4;
			const level = Math.round(noise * mask * (RAMP.length - 1));
			return RAMP[Math.min(level, RAMP.length - 1)];
		}).join('')
	);
}

function titleSize(title: string): number {
	if (title.length <= 36) return 84;
	if (title.length <= 64) return 68;
	return 54;
}

/**
 * Fetches a featured image and crops it to the card's photo panel as a JPEG data URI.
 * Satori only decodes PNG, JPEG, and GIF, and the CMS images are huge (2560px), so sharp converts
 * whatever the CMS serves (WebP and AVIF included) and shrinks it first. Returns undefined on any
 * failure so the card falls back to the ASCII artwork instead of breaking.
 */
export async function loadOgPhoto(url: string | undefined): Promise<string | undefined> {
	if (!url) return undefined;

	try {
		const response = await fetch(url, { signal: AbortSignal.timeout(5000) });

		if (!response.ok) throw new Error(`HTTP ${response.status}`);

		const jpeg = await sharp(Buffer.from(await response.arrayBuffer()))
			.resize(PHOTO_WIDTH, HEIGHT, { fit: 'cover', position: sharp.strategy.attention })
			.jpeg({ quality: 82 })
			.toBuffer();

		return `data:image/jpeg;base64,${jpeg.toString('base64')}`;
	} catch (cause) {
		console.error(`OG image: could not use featured image ${url}`, cause);
		return undefined;
	}
}

/** The photo panel, fading into the background on its left edge so the title stays readable. */
const photoPanel = (src: string): Node =>
	el({ position: 'absolute', top: 0, right: 0, bottom: 0, width: PHOTO_WIDTH }, [
		{
			type: 'img',
			props: { src, width: PHOTO_WIDTH, height: HEIGHT, style: { objectFit: 'cover' } }
		},
		el({
			position: 'absolute',
			top: 0,
			left: 0,
			bottom: 0,
			width: 200,
			backgroundImage: `linear-gradient(to right, ${colors.background}, rgba(20, 16, 12, 0))`
		})
	]);

function layout({ slug, kind, title, meta, photo }: OgImageInput): Node {
	return el(
		{
			position: 'relative',
			width: WIDTH,
			height: HEIGHT,
			backgroundColor: colors.background,
			color: colors.text,
			overflow: 'hidden'
		},
		[
			photo
				? photoPanel(photo)
				: el(
						{
							position: 'absolute',
							top: 0,
							right: 0,
							bottom: 0,
							flexDirection: 'column',
							justifyContent: 'center',
							fontFamily: 'Fragment Mono',
							fontSize: 20,
							lineHeight: '24px',
							color: colors.accent,
							opacity: 0.55,
							whiteSpace: 'pre'
						},
						asciiRows(slug).map((row) => el({}, row))
					),
			el(
				{
					position: 'absolute',
					inset: 0,
					flexDirection: 'column',
					justifyContent: 'space-between',
					padding: PADDING
				},
				[
					el(
						{
							alignItems: 'center',
							gap: 16,
							fontFamily: 'Fragment Mono',
							fontSize: 24,
							textTransform: 'uppercase',
							letterSpacing: 2
						},
						[
							el({ width: 14, height: 14, borderRadius: 14, backgroundColor: colors.accent }),
							el({ color: colors.accent }, kind),
							el({ color: colors.muted }, '/ Justin Lung')
						]
					),
					el(
						{
							maxWidth: photo ? 600 : 700,
							fontFamily: 'General Sans',
							fontWeight: 600,
							fontSize: titleSize(title),
							lineHeight: 1.05,
							letterSpacing: -2,
							lineClamp: 4
						},
						title
					),
					el(
						{
							justifyContent: 'space-between',
							alignItems: 'center',
							fontFamily: 'Fragment Mono',
							fontSize: 24,
							color: colors.muted
						},
						[
							el({}, meta.filter(Boolean).join('  ·  ')),
							el(
								{ color: colors.text, backgroundColor: colors.background, padding: '4px 12px' },
								'justinlung.com'
							)
						]
					)
				]
			)
		]
	);
}

/** Renders a 1200x630 social preview card as a PNG. */
export async function renderOgImage(input: OgImageInput): Promise<Uint8Array> {
	// Satori accepts React-style element objects. This is a plain object tree, so no React is needed.
	const svg = await satori(layout(input) as Parameters<typeof satori>[0], {
		width: WIDTH,
		height: HEIGHT,
		fonts
	});

	return new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } }).render().asPng();
}
