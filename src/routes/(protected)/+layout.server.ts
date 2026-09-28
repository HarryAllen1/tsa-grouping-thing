import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import { createRemoteJWKSet, decodeJwt, jwtVerify } from 'jose';
import type { LayoutServerLoad } from './$types';

const SESSION_COOKIE = 'firebase_id_token';
const FIREBASE_PROJECT_ID = 'tsa-grouping-thing';
const FIREBASE_JWKS = createRemoteJWKSet(
	new URL(
		'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
	),
);

export const load: LayoutServerLoad = async ({ cookies }) => {
	const idToken = cookies.get(SESSION_COOKIE);
	if (!idToken) {
		redirect(303, '/');
	}

	let payload: { admin?: unknown; aud?: unknown; iss?: unknown };
	try {
		if (env.PUBLIC_FIREBASE_EMULATORS === 'true') {
			// The Auth Emulator does not use Firebase's production signing keys.
			// This branch is strictly opt-in and must never be enabled in production.
			payload = decodeJwt(idToken);
			if (
				payload.aud !== FIREBASE_PROJECT_ID ||
				payload.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`
			) {
				redirect(303, '/');
			}
		} else {
			({ payload } = await jwtVerify(idToken, FIREBASE_JWKS, {
				audience: FIREBASE_PROJECT_ID,
				issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
			}));
		}
	} catch {
		redirect(303, '/');
	}

	if (payload.admin !== true) {
		redirect(303, '/');
	}
};
