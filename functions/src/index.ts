import { initializeApp } from 'firebase-admin/app';
import { diff } from 'deep-object-diff';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { beforeUserCreated, HttpsError } from 'firebase-functions/v2/identity';

initializeApp();
const db = getFirestore();

export const dbLogger = onDocumentWritten(
	{
		document: '{collection}/{id}',
		region: 'us-west1',
	},
	(event) => {
		if (
			event.params.collection === 'mail' &&
			event.data?.after.data()?.delivery.state === 'PROCESSING'
		)
			return;
		if (event.params.collection !== 'firestore_logs') {
			const now = Timestamp.now();
			const beforeData = event.data?.before.data() ?? {};
			const afterData = event.data?.after.data() ?? {};
			db.doc(`firestore_logs/${now.toDate().getTime()}`).set({
				collection: event.params.collection,
				id: event.params.id,
				afterData,
				beforeData,
				difference: diff(beforeData, afterData),
				timestamp: now,
				eventType: event.type,
			});
		}
	},
);

const allowedDomains = ['lwsd.org', 'kampmusic.org'];

export const onlyAllowLWSDEmails = beforeUserCreated(
	{
		region: 'us-west1',
	},
	async (event) => {
		const user = event.data;
		if (!allowedDomains.some((domain) => user.email?.endsWith(domain))) {
			throw new HttpsError('invalid-argument', 'Unauthorized email');
		}
		const doc = db.doc(`users/${user.email}`);
		if (!(await doc.get()).exists) {
			doc.set(
				{
					email: user.email,
					name: user.displayName,
					events: [],
				},
				{
					merge: true,
				},
			);
		}
	},
);
