import { writable } from 'svelte/store';

export const selected = writable<string | null>(null);
