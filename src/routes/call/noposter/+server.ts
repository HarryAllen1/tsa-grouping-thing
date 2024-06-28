import type { RequestHandler } from './$types';

export const GET = (() => {
	return new Response('Not found', {
		status: 404,
	});
}) satisfies RequestHandler;
