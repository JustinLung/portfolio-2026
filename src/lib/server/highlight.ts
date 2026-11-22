import { createHighlighterCore, type HighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import { decodeEntities } from '../../utils/text';
import { resolveLanguage, type CodeLanguage } from '../../utils/code-language';

/** Light and dark palettes; the page picks one with `data-mode` (see the post page's CSS). */
const THEMES = { light: 'github-light-high-contrast', dark: 'github-dark-high-contrast' } as const;

let highlighter: Promise<HighlighterCore> | undefined;

/**
 * One shared instance per server process. Only the languages the blog uses are bundled, and the
 * JavaScript regex engine avoids shipping and compiling the Oniguruma WebAssembly module.
 */
function getHighlighter(): Promise<HighlighterCore> {
	highlighter ??= createHighlighterCore({
		themes: [
			import('shiki/themes/github-light-high-contrast.mjs'),
			import('shiki/themes/github-dark-high-contrast.mjs')
		],
		langs: [
			import('shiki/langs/html.mjs'),
			import('shiki/langs/css.mjs'),
			import('shiki/langs/scss.mjs'),
			import('shiki/langs/javascript.mjs'),
			import('shiki/langs/typescript.mjs'),
			import('shiki/langs/json.mjs'),
			import('shiki/langs/liquid.mjs'),
			import('shiki/langs/bash.mjs'),
			import('shiki/langs/yaml.mjs')
		],
		engine: createJavaScriptRegexEngine()
	}).catch((cause) => {
		// Don't cache a failed start-up; the next request retries.
		highlighter = undefined;
		throw cause;
	});

	return highlighter;
}

// `<pre ...><code ...>…</code></pre>` as WordPress emits it. Capturing the attributes lets an
// author-supplied `language-x` class on either element decide the language.
const CODE_BLOCK = /<pre((?:\s[^>]*)?)>\s*<code((?:\s[^>]*)?)>([\s\S]*?)<\/code>\s*<\/pre>/gi;

const classOf = (attrs: string) => /\sclass=(["'])(.*?)\1/i.exec(attrs)?.[2] ?? '';

/** The code's source text: tags WordPress may add (`<br>`, stray spans) removed, entities decoded. */
const toSource = (inner: string) =>
	decodeEntities(inner.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '')).replace(/\n+$/, '');

const escapeHtml = (value: string) =>
	value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Replaces every code block in WordPress HTML with Shiki's highlighted markup. Colors are CSS
 * variables (`--shiki-light` / `--shiki-dark`), so the one render serves every theme and mode
 * with no client JavaScript. A block that can't be highlighted is left exactly as it was.
 */
export async function highlightCodeBlocks(html: string): Promise<string> {
	const blocks = [...html.matchAll(CODE_BLOCK)];
	if (blocks.length === 0) return html;

	let shiki: HighlighterCore;
	try {
		shiki = await getHighlighter();
	} catch (cause) {
		console.error('Failed to start the syntax highlighter; serving plain code blocks', cause);
		return html;
	}

	let output = '';
	let cursor = 0;

	for (const match of blocks) {
		const [whole, preAttrs, codeAttrs, inner] = match;
		const code = toSource(inner);
		const language: CodeLanguage = resolveLanguage(
			`${classOf(preAttrs)} ${classOf(codeAttrs)}`,
			code
		);

		let replacement: string;
		try {
			replacement = shiki.codeToHtml(code, {
				lang: language,
				themes: THEMES,
				// Without a default color, each token carries only the two variables.
				defaultColor: false
			});
		} catch (cause) {
			console.error(`Failed to highlight a "${language}" code block`, cause);
			replacement = `<pre><code>${escapeHtml(code)}</code></pre>`;
		}

		output += html.slice(cursor, match.index) + replacement;
		cursor = match.index + whole.length;
	}

	return output + html.slice(cursor);
}
