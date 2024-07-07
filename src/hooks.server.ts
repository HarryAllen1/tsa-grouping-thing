import {sequence} from '@sveltejs/kit/hooks';
import * as Sentry from '@sentry/sveltekit';
import type { Handle } from '@sveltejs/kit';

Sentry.init({
    dsn: "https://0c7f0ce6a3dd0adedc74dfa71107da37@o4504343003791360.ingest.us.sentry.io/4507561453748224",
    tracesSampleRate: 1
})

export const handle: Handle = sequence(Sentry.sentryHandle(), async ({ event, resolve }) => {
	if (event.url.hostname === 'tsa-grouping-thing.vercel.app') {
		return Response.redirect(
			`https://teaming.jhstsa.org${event.url.pathname}${event.url.search}`,
			301,
		);
	}

	const response = await resolve(event);
	return response;
});
export const handleError = Sentry.handleErrorWithSentry();