import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { RequestHandler } from './$types';

const SESSION_COOKIE = 'firebase_id_token';
const MAX_AGE_SECONDS = 60 * 60;

export const POST: RequestHandler = async ({ cookies, request }) => {
	const { idToken } = (await request.json()) as { idToken?: unknown };

	if (typeof idToken !== 'string' || idToken.length === 0) {
		return json({ error: 'A Firebase ID token is required.' }, { status: 400 });
	}

	// The protected server layout verifies this token with Firebase before it is
	// used for authorization. Keeping it HTTP-only prevents application scripts
	// from reading or directly changing the persisted session.
	cookies.set(SESSION_COOKIE, idToken, {
		httpOnly: true,
		maxAge: MAX_AGE_SECONDS,
		path: '/',
		sameSite: 'lax',
		secure: !dev,
	});

	return new Response(null, { status: 204 });
};

export const DELETE: RequestHandler = ({ cookies }) => {
	cookies.delete(SESSION_COOKIE, { path: '/' });
	return new Response(null, { status: 204 });
};
