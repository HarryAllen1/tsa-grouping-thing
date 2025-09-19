import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import tseslint from 'typescript-eslint';

const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url));

/** @type {import('eslint').Linter.Config[]} */
export default tseslint.config(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	...tseslint.configs.recommended,
	...svelte.configs['flat/recommended'],
	eslintPluginUnicorn.configs['recommended'],
	prettier,
	...svelte.configs['flat/prettier'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
		rules: {
			'unicorn/prevent-abbreviations': 'off',
			'unicorn/no-null': 'off',
			'unicorn/filename-case': 'off',
			'unicorn/import-style': 'off',
			'unicorn/no-await-expression-member': 'off',
			'unicorn/no-array-reduce': 'off',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					args: 'all',
					argsIgnorePattern: '^_',
					caughtErrors: 'all',
					caughtErrorsIgnorePattern: '^_',
					destructuredArrayIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					ignoreRestSiblings: true,
				},
			],
		},
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: {
				parser: tseslint.parser,
			},
		},
		rules: {
			'svelte/valid-compile': 'off',
			'svelte/require-each-key': 'off',
			'svelte/no-dom-manipulating': 'off',
			'svelte/no-navigation-without-resolve': 'off',
		},
	},
	{
		ignores: [
			'docs/',
			'functions/',
			'src/lib/components/ui/',
			'src/lib/utils.ts',
		],
	},
);
