import { onDocumentUpdated } from 'firebase-functions/firestore';
import { HttpsError, onCall } from 'firebase-functions/https';
import { db } from './firebase';
import { EventDoc } from './types';

export const logEventChanges = onDocumentUpdated(
	'events/{event_name}',
	(event) => {
		const beforeData = event.data?.before.data() as EventDoc;
		const afterData = event.data?.after.data() as EventDoc;
		db.collection('event_logs')
			.doc(Date.now().toString())
			.set({
				afterData,
				beforeData,
				updatedAt: Date.now(),
				updatedBy: afterData.lastUpdatedBy!,
			} satisfies {
				beforeData: EventDoc;
				afterData: EventDoc;
				updatedAt: number;
				updatedBy: string;
			});
	},
);

export const sendRequest = onCall<
	{ event: string; teamId: string; userEmail: string },
	Promise<{
		success: boolean;
	}>
>(async ({ auth, data }) => {
	if (!auth) {
		throw new HttpsError(
			'failed-precondition',
			'The function must be called while authenticated.',
		);
	}

	const { email } = auth.token;

	if (!email) {
		throw new HttpsError('failed-precondition', 'Invalid or missing email.');
	}

	// const eventsCollection = db.collection('events');

	// const { docs: events } = await eventsCollection.get();

	return { success: true };
});
export const sendRequestApproval = onCall<
	{ event: string; teamId: string; userEmail: string },
	Promise<{
		success: boolean;
	}>
>(async ({ auth, data }) => {
	if (!auth) {
		throw new HttpsError(
			'failed-precondition',
			'The function must be called while authenticated.',
		);
	}

	const { email } = auth.token;

	if (!email) {
		throw new HttpsError('failed-precondition', 'Invalid or missing email.');
	}

	return { success: true };
});
export const sendRequestDenial = onCall<
	{ event: string; teamId: string; userEmail: string },
	Promise<{
		success: boolean;
	}>
>(async ({ auth, data }) => {
	if (!auth) {
		throw new HttpsError(
			'failed-precondition',
			'The function must be called while authenticated.',
		);
	}

	const { email } = auth.token;

	if (!email) {
		throw new HttpsError('failed-precondition', 'Invalid or missing email.');
	}

	return { success: true };
});
