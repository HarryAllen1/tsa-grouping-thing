// eslint-disable-next-line @typescript-eslint/no-var-requires
const { join } = require('node:path');

module.exports = {
	root: true,
	env: {
		es6: true,
		node: true,
	},
	extends: [
		'eslint:recommended',
		'plugin:import/errors',
		'plugin:import/warnings',
		'plugin:import/typescript',
		'plugin:@typescript-eslint/recommended',
	],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		project: [
			join(__dirname, 'tsconfig.json'),
			join(__dirname, 'tsconfig.dev.json'),
		],
		sourceType: 'module',
	},
	ignorePatterns: [
		'/lib/**/*', // Ignore built files.
	],
	plugins: ['@typescript-eslint', 'import'],
	rules: {
		'import/no-unresolved': 0,
	},
};
