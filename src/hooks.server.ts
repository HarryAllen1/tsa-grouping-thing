import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

export const handle: Handle = sequence(async ({ event, resolve }) => {
	if (event.url.hostname === 'tsa-grouping-thing.vercel.app') {
		return Response.redirect(
			`https://teaming.jhstsa.org${event.url.pathname}${event.url.search}`,
			301,
		);
	}

	const response = await resolve(event);
	return response;
});
