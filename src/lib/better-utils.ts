import * as Dialog from '$lib/components/ui/dialog';
import * as Drawer from '$lib/components/ui/drawer';
import type { Attachment } from 'svelte/attachments';
import { derived, readable, type Readable } from 'svelte/store';
import { loaderString } from './loader-string';
import type { BasicUser, UserDoc } from './types';

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

/**
 * Disables a button on click and re-enables it after the callback resolves.
 *
 *
 * @param callback Listener which runs on click.
 * @returns An attachment to be applied to a button with {@attach disableOnClick}
 */
export const disableOnClick =
	(
		callback: (event: Event) => unknown,
	): Attachment<HTMLButtonElement | HTMLAnchorElement> =>
	(node: HTMLButtonElement | HTMLAnchorElement) => {
		const listener: EventListenerOrEventListenerObject = (mouseEvent) => {
			if (node instanceof HTMLButtonElement) {
				node.disabled = true;
			}
			const container = document.createElement('div');
			container.classList.add('mr-1');
			container.innerHTML = loaderString;
			// sentry sveltekit -> cloudflare workers types messes up this type def
			node.prepend(container as unknown as string);

			const result = callback(mouseEvent);

			if (result instanceof Promise) {
				result.finally(() => {
					if (node instanceof HTMLButtonElement) {
						node.disabled = false;
						container.remove();
					}
				});
			} else {
				if (node instanceof HTMLButtonElement) {
					node.disabled = false;
					container.remove();
				}
			}
		};

		node.addEventListener('click', listener);
		return () => {
			node.removeEventListener('click', listener);
		};
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

export const filterObjectKeys = <T extends object>(
	object: T,
	filter: (key: keyof T, index: number) => boolean,
): T =>
	Object.keys(object)
		.filter((key, index) => filter(key as keyof T, index))
		.reduce((obj, key) => {
			obj[key as keyof T] = object[key as keyof T];
			return obj;
		}, {} as T);

export const resolveName = (
	basicUser: BasicUser,
	allUsers: UserDoc[],
): string =>
	allUsers.find(
		(user) => basicUser.email.toLowerCase() === user.email.toLowerCase(),
	)?.name || basicUser.name;

export const humanDate = (dateString: string): string => {
	const date = new Date(dateString);
	const today = new Date();
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- this isn't used in Svelte markup
	const tomorrow = new Date();
	tomorrow.setDate(today.getDate() + 1);

	if (date.toDateString() === today.toDateString()) {
		return `Today ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
	}

	if (date.toDateString() === tomorrow.toDateString()) {
		return `Tomorrow ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
	}

	return date.toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});
};
