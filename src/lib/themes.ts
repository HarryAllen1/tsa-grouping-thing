// https://github.com/huntabyte/shadcn-svelte/blob/main/apps/www/src/lib/registry/themes.ts

const randomNumberBetweenInclusive = (lower: number, upper: number) =>
	Math.floor(Math.random() * (upper - lower + 1) + lower);

const tailwindColors = [
	'red',
	'orange',
	'amber',
	'yellow',
	'lime',
	'green',
	'emerald',
	'teal',
	'cyan',
	'sky',
	'blue',
	'indigo',
	'violet',
	'purple',
	'fuchsia',
	'pink',
	'rose',
	'slate',
	'gray',
	'zinc',
	'neutral',
	'stone',
];
const tailwindColorShades = [
	'50',
	'100',
	'200',
	'300',
	'400',
	'500',
	'600',
	'700',
	'800',
	'900',
	'950',
];

export const getRandomTailwindColor = () =>
	`var(--color-${tailwindColors[randomNumberBetweenInclusive(0, tailwindColors.length - 1)]}-${tailwindColorShades[randomNumberBetweenInclusive(0, tailwindColorShades.length - 1)]})`;

export const themes = [
	{
		name: 'default',
		label: 'Default',
		primaryColor: {
			light: 'oklch(0.205 0 0)',
			dark: 'oklch(0.922 0 0)',
		},
	},
	{
		name: 'blue',
		label: 'Blue',
		primaryColor: {
			light: 'var(--color-blue-600)',
			dark: 'var(--color-blue-500)',
		},
	},
	{
		name: 'green',
		label: 'Green',
		primaryColor: {
			light: 'var(--color-lime-600)',
			dark: 'var(--color-lime-600)',
		},
	},
	{
		name: 'amber',
		label: 'Amber',
		primaryColor: {
			light: 'var(--color-amber-600)',
			dark: 'var(--color-amber-500)',
		},
	},
	{
		name: 'rose',
		label: 'Rose',
		primaryColor: {
			light: 'var(--color-rose-600)',
			dark: 'var(--color-rose-500)',
		},
	},
	{
		name: 'purple',
		label: 'Purple',
		primaryColor: {
			light: 'var(--color-purple-600)',
			dark: 'var(--color-purple-500)',
		},
	},
	{
		name: 'orange',
		label: 'Orange',
		primaryColor: {
			light: 'var(--color-orange-600)',
			dark: 'var(--color-orange-500)',
		},
	},
	{
		name: 'teal',
		label: 'Teal',
		primaryColor: {
			light: 'var(--color-teal-600)',
			dark: 'var(--color-teal-500)',
		},
	},

	{
		name: 'mono',
		label: 'Mono',
		primaryColor: {
			light: 'var(--color-stone-600)',
			dark: 'var(--color-stone-500)',
		},
	},
	{
		name: 'scaled',
		label: 'Scaled',
		primaryColor: {
			light: 'var(--color-slate-600)',
			dark: 'var(--color-slate-500)',
		},
	},
	{
		name: 'red',
		label: 'Red',
		primaryColor: {
			light: 'var(--color-red-600)',
			dark: 'var(--color-red-500)',
		},
	},
	{
		name: 'yellow',
		label: 'Yellow',
		primaryColor: {
			light: 'var(--color-yellow-400)',
			dark: 'var(--color-yellow-500)',
		},
	},
	{
		name: 'violet',
		label: 'Violet',
		primaryColor: {
			light: 'var(--color-violet-600)',
			dark: 'var(--color-violet-500)',
		},
	},
	{
		name: 'random',
		label: 'Random',
		primaryColor: {
			light: getRandomTailwindColor(),
			dark: getRandomTailwindColor(),
		},
	},
] as const;

export type Theme = (typeof themes)[number];
