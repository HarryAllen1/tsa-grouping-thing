import { getAuth } from 'firebase-admin/auth';
import { HttpsError, onCall } from 'firebase-functions/https';
import { getAuthUser, getUser } from './utils.js';

type SetAdminRoleData = {
	email: string;
	admin: boolean;
};

/**
 * One-time migration path for administrators that existed before roles were
 * stored as Firebase custom claims.
 */
export const claimExistingAdminRole = onCall(
	{
		region: 'us-west1',
	},
	async ({ auth }) => {
		const { user } = await getAuthUser(auth);
		if (user.admin !== true) {
			throw new HttpsError(
				'permission-denied',
				'Administrator access required.',
			);
		}

		await getAuth().setCustomUserClaims(auth!.uid, { admin: true });
		return { admin: true };
	},
);

/** Updates the custom claim that authorizes administrator access. */
export const setAdminRole = onCall<SetAdminRoleData>(
	{
		region: 'us-west1',
	},
	async ({ auth, data }) => {
		if (auth?.token.admin !== true) {
			throw new HttpsError(
				'permission-denied',
				'Administrator access required.',
			);
		}
		if (!data.email || typeof data.admin !== 'boolean') {
			throw new HttpsError(
				'invalid-argument',
				'A member email and role are required.',
			);
		}

		const { user, userRef } = await getUser(data.email);
		const authUser = await getAuth().getUserByEmail(user.email);
		await getAuth().setCustomUserClaims(authUser.uid, {
			...authUser.customClaims,
			admin: data.admin,
		});
		await userRef.update({ admin: data.admin });

		return { success: true };
	},
);
