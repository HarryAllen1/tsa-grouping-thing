import { beforeUserCreated, HttpsError } from 'firebase-functions/identity';
import { user } from 'firebase-functions/v1/auth';
import { allowedDomains, db } from './firebase';

export const onlyAllowLWSDEmails = beforeUserCreated(
	{
		region: 'us-west1',
	},
	async ({ data: user }) => {
		if (!user) throw new HttpsError('invalid-argument', 'User data is missing');
		if (!allowedDomains.has(user.email?.split('@')[1] ?? '')) {
			throw new HttpsError('invalid-argument', 'Unauthorized email');
		}
		const doc = db.doc(`users/${user.email}`);
		if (!(await doc.get()).exists) {
			await doc.update({
				email: user.email,
				name: user.displayName ?? '',
				uid: user.uid,
				events: [],
			});
		} else {
			await doc.update({
				uid: user.uid,
			});
		}
	},
);

export const onUserDelete = user().onDelete(async (user) => {
	const doc = db.doc(`users/${user.email}`);
	await doc.delete();
});
