import { DecodedIdToken } from 'firebase-admin/auth';
import { HttpsError } from 'firebase-functions/https';
import { db } from './firebase.js';
import { EventDoc, UserDoc } from './types.js';
import { Timestamp } from 'firebase-admin/firestore';

export const userToName = (user: UserDoc): string =>
	user.preferredFirstName
		? `${user.preferredFirstName} (${user.firstName}) ${user.lastName}`
		: `${user.firstName} ${user.lastName}`;

export const getUser = async (
	email: string,
): Promise<{ user: UserDoc; userRef: FirebaseFirestore.DocumentReference }> => {
	const userRef = db.collection('users').doc(email);
	const user = (await userRef.get()).data() as UserDoc | undefined;
	if (!user) {
		throw new HttpsError('not-found', 'User not found.');
	}

	return { user, userRef };
};

export const getAuthUser = async (
	auth:
		| {
				uid: string;
				token: DecodedIdToken;
		  }
		| undefined,
): Promise<{ user: UserDoc; userRef: FirebaseFirestore.DocumentReference }> => {
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

	return getUser(email);
};

export const getEvent = async (
	event: string,
): Promise<{
	event: EventDoc;
	eventsCollection: FirebaseFirestore.CollectionReference;
	eventRef: FirebaseFirestore.DocumentReference;
}> => {
	const eventsCollection = db.collection('events');
	const eventDoc = eventsCollection.doc(event);
	const eventData = (await eventDoc.get()).data() as EventDoc | undefined;

	if (!eventData) {
		throw new HttpsError('not-found', 'Event not found.');
	}

	return { event: eventData, eventsCollection, eventRef: eventDoc };
};

export const logFunctionCall = async (
	functionName: string,
	user: UserDoc,
	data: Record<string, number | string | null | boolean>,
) => {
	db.collection('event_logs').doc(Date.now().toString()).set({
		updatedAt: Timestamp.now(),
		updatedBy: user.email,
		function: functionName,
		data,
	});
};
