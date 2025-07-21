import { persisted } from 'svelte-persisted-store';
import type { Theme } from './themes.js';

type Config = {
	theme: Theme['name'];
	radius: number;
	background: string | null | undefined;
};

export const config = persisted<Config>('config', {
	theme: 'default',
	radius: 0.5,
	background: null,
});
