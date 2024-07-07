import type { RequestHandler } from './$types';

export const GET = (() => {
	return new Response(
		"Not found. This just exists because agora is stupid and keeps posting to this address and i don't like error messages.",
		{
			status: 404,
		},
	);
}) satisfies RequestHandler;
