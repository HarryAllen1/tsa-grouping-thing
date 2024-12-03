import { beforeUserCreated, HttpsError } from 'firebase-functions/identity';
import { user } from 'firebase-functions/v1/auth';
import { allowedDomains, db } from './firebase';

export const onlyAllowLWSDEmails = beforeUserCreated(
	{
		region: 'us-west1',
	},
	async (event) => {
		const user = event.data;
		if (!allowedDomains.has(user.email?.split('@')[1] ?? '')) {
			throw new HttpsError('invalid-argument', 'Unauthorized email');
		}
		const doc = db.doc(`users/${user.email}`);
		if (!(await doc.get()).exists) {
			await doc.set(
				{
					email: user.email,
					name: user.displayName ?? '',
					uid: user.uid,
					events: [],
				},
				{
					merge: true,
				},
			);
		} else {
			await doc.set(
				{
					uid: user.uid,
				},
				{
					merge: true,
				},
			);
		}
	},
);

export const onUserDelete = user().onDelete(async (user) => {
	const doc = db.doc(`users/${user.email}`);
	await doc.delete();
});
