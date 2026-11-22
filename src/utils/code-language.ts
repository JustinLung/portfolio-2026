export type CodeLanguage =
	| 'html'
	| 'css'
	| 'scss'
	| 'javascript'
	| 'typescript'
	| 'json'
	| 'liquid'
	| 'bash'
	| 'yaml'
	| 'text';

const ALIASES: Record<string, CodeLanguage> = {
	html: 'html',
	htm: 'html',
	css: 'css',
	scss: 'scss',
	js: 'javascript',
	javascript: 'javascript',
	mjs: 'javascript',
	jsx: 'javascript',
	ts: 'typescript',
	typescript: 'typescript',
	tsx: 'typescript',
	json: 'json',
	liquid: 'liquid',
	bash: 'bash',
	sh: 'bash',
	shell: 'bash',
	zsh: 'bash',
	yaml: 'yaml',
	yml: 'yaml',
	text: 'text',
	txt: 'text',
	plaintext: 'text'
};

/**
 * The language an author declared with a `language-x` / `lang-x` class (the convention WordPress
 * code plugins and the block's "Additional CSS class" field use). Returns `'text'` for a declared
 * language we don't bundle, so an explicit choice is never second-guessed, and `undefined` when
 * nothing was declared.
 */
export function declaredLanguage(classNames: string): CodeLanguage | undefined {
	const name = /(?:^|\s)(?:language|lang)-([\w+-]+)/i.exec(classNames)?.[1]?.toLowerCase();

	return name ? (ALIASES[name] ?? 'text') : undefined;
}

const isJson = (code: string) => {
	if (!/^[[{]/.test(code)) return false;

	try {
		JSON.parse(code);
		return true;
	} catch {
		return false;
	}
};

/**
 * Best guess for a code block that declares no language, which is every block a default
 * WordPress Code block produces. Deliberately conservative: anything that isn't clearly one of
 * the supported languages (file trees, prose, output) stays plain text rather than being
 * highlighted wrongly.
 */
export function guessLanguage(code: string): CodeLanguage {
	const source = code.trim();

	if (!source) return 'text';
	if (/\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}/.test(source)) return 'liquid';
	if (isJson(source)) return 'json';
	if (/^<(?:!doctype|[a-z][\w-]*[\s>/])/i.test(source)) return 'html';
	if (
		/(?:^|\n)\s*(?:const|let|import|export)\s+[\w{*]|\bvar\s+\w+\s*=|\bfunction\b\s*\w*\s*\(|=>|\b(?:document|window|console)\./.test(
			source
		)
	) {
		return 'javascript';
	}
	if (/^(?:\$\s|(?:npm|pnpm|yarn|npx|git|cd|curl|brew|sudo)\s)/m.test(source)) return 'bash';
	// A selector or at-rule, then `property: value;` inside braces.
	if (/^\s*[.#@:*&[a-z][^{};\n]*\{[^}]*[\w-]+\s*:[^}]*;/im.test(source)) return 'css';

	return 'text';
}

/** The declared language if there is one, otherwise a guess from the code itself. */
export function resolveLanguage(classNames: string, code: string): CodeLanguage {
	return declaredLanguage(classNames) ?? guessLanguage(code);
}
