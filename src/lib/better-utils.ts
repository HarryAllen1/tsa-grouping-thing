import * as Dialog from '$lib/components/ui/dialog';
import * as Drawer from '$lib/components/ui/drawer';
import { derived, readable, type Readable } from 'svelte/store';

export const sleep = (ms: number): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, ms));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const removeRef = (obj: Record<string, any>) => {
	const newObj = { ...obj };
	delete newObj.ref;
	for (const key in newObj) {
		if (typeof newObj[key] === 'object') {
			newObj[key] = removeRef(newObj[key]);
		}
	}
	return newObj;
};

export const mediaQuery = (query: string): Readable<boolean> => {
	return readable(false, (set) => {
		const window = globalThis as unknown as Window | undefined;
		const isSupported =
			window &&
			'matchMedia' in window &&
			typeof window.matchMedia === 'function';

		let mediaQuery: MediaQueryList | undefined;

		const cleanup = (): void => {
			if (!mediaQuery) return;
			if ('removeEventListener' in mediaQuery)
				mediaQuery.removeEventListener('change', update);
		};

		const update = (): void => {
			if (!isSupported) return;

			cleanup();

			mediaQuery = window.matchMedia(query);
			set(mediaQuery.matches);

			if ('addEventListener' in mediaQuery)
				mediaQuery.addEventListener('change', update);
		};

		update();

		return cleanup;
	});
};

export const isDesktop = mediaQuery('(min-width: 768px)');

export const infoComponent = derived(isDesktop, ($isDesktop) =>
	$isDesktop ? Dialog : Drawer,
);

export const canScroll = (
	el: Element,
	scrollAxis: 'scrollLeft' | 'scrollTop',
) => {
	if (el[scrollAxis] === 0) {
		el[scrollAxis] = 1;
		if (el[scrollAxis] === 1) {
			el[scrollAxis] = 0;
			return true;
		}
	} else {
		return true;
	}
	return false;
};
