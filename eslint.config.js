import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import ts from 'typescript-eslint';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs['flat/recommended'],
	eslintPluginUnicorn.configs['flat/recommended'],
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
		},
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: {
				parser: ts.parser,
			},
		},
		rules: {
			'svelte/valid-compile': 'off',
		},
	},
	{
		ignores: [
			'build/',
			'.svelte-kit/',
			'dist/',
			'docs/.vitepress/dist/',
			'docs/.vitepress/cache/',
			'.vercel/',
			'functions/',
			'src/lib/components/ui/',
			'src/lib/utils.ts',
		],
	},
];
