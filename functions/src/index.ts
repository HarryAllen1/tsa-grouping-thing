import { initializeApp } from 'firebase-admin/app';
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
	async (event) => {
		if (event.params.collection !== 'firestore_logs') {
			const now = Timestamp.now();
			db.doc(`firestore_logs/${now.toDate().getTime()}`).set({
				collection: event.params.collection,
				id: event.params.id,
				afterData: event.data?.after.data(),
				beforeData: event.data?.before.data(),
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
	(event) => {
		const user = event.data;
		if (!allowedDomains.some((domain) => user.email?.endsWith(domain))) {
			throw new HttpsError('invalid-argument', 'Unauthorized email');
		}
	},
);
