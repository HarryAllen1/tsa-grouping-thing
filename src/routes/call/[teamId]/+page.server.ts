import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { error } from '@sveltejs/kit';
import agoraToken from 'agora-token';
const { RtcRole, RtcTokenBuilder } = agoraToken;
import type { PageServerLoad } from './$types';

export const load = (async ({ params: { teamId }, url }) => {
	let uid = url.searchParams.get('uid');
	try {
		if (!uid) {
			throw error(400, 'UID is required');
		}

		uid = [...uid].map((c) => c.codePointAt(0)).join('');

		const token = RtcTokenBuilder.buildTokenWithUid(
			publicEnv.PUBLIC_AGORA_APP_ID,
			env.AGORA_APP_CERTIFICATE,
			teamId,
			Number.parseInt(uid),
			RtcRole.PUBLISHER,
			600,
			600,
		);

		return { token, uid, teamId };
	} catch (error_) {
		throw error(400, `json expected: ${JSON.stringify(error_)}`);
	}
}) satisfies PageServerLoad;
