import { writable } from 'svelte/store';

export const rerender = writable(Date.now());
