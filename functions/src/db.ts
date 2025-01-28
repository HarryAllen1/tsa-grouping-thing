import { HttpsError, onCall } from 'firebase-functions/https';
import { db } from './firebase';

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

	const eventsCollection = db.collection('events');

	const { docs: events } = await eventsCollection.get();

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
