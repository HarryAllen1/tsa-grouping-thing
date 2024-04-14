import { persisted } from 'svelte-local-storage-store';

import type { Theme } from './themes.js';

type Config = {
	theme: Theme['name'];
	radius: number;
};

export const config = persisted<Config>('config', {
	theme: 'zinc',
	radius: 0.5,
});
