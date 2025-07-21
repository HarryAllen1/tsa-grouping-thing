import { beforeUserCreated, HttpsError } from 'firebase-functions/identity';
import { allowedDomains, db } from './firebase';

export const onlyAllowLWSDEmails = beforeUserCreated(
	{
		region: 'us-west1',
	},
	async (event) => {
		const user = event.data;
		if (!user) {
			throw new HttpsError('invalid-argument', 'User not found');
		}
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
