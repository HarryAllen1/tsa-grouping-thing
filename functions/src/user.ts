import { HttpsError, onCall } from 'firebase-functions/https';
import { z } from 'zod';
import type { EventDoc, UserDoc } from '../../src/lib/types';
import { db } from './firebase';

const setEventsSchema = z.object({
	events: z
		.array(z.string())
		.max(6, 'A person cannot have more than 6 events.'),
	user: z.string().email(),
});

export const setEvents = onCall<z.infer<typeof setEventsSchema>>(
	async ({ auth, data }) => {
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

		const result = setEventsSchema.safeParse(data);

		if (!result.success) {
			throw new HttpsError('invalid-argument', result.error.message);
		}

		const userRef = db.doc(`users/${result.data.user}`);
		const userDoc = await userRef.get();

		if (!userDoc.exists) {
			throw new HttpsError('not-found', 'User not found.');
		}

		const userData = userDoc.data() as UserDoc;

		if (userData.email !== email && !userData.admin) {
			throw new HttpsError(
				'permission-denied',
				'You do not have permission to edit this user.',
			);
		}

		const eventsCollection = db.collection('events');
		const events = await eventsCollection.get();
		const eventNames = events.docs.map((doc) => doc.get('event'));

		for (const event of result.data.events) {
			if (!eventNames.includes(event)) {
				throw new HttpsError('invalid-argument', 'Invalid event name.');
			}
		}

		if (!userData.admin) {
			const newEvents = result.data.events.filter(
				(event) => !userData.events.includes(event),
			);
			console.log(result.data);
			for (const event of newEvents) {
				const eventRef = eventsCollection.doc(event);
				const eventDoc = await eventRef.get();
				const eventData = eventDoc.data() as EventDoc;

				if (eventData.locked) {
					throw new HttpsError(
						'failed-precondition',
						`Event ${event} is locked.`,
					);
				}
				if (eventData.teamCreationLocked) {
					if (
						eventData.maxTeamSize === 1 &&
						eventData.teams.length >= eventData.perChapter
					) {
						throw new HttpsError(
							'failed-precondition',
							`Event ${event} is full.`,
						);
					}
					if (
						eventData.teams.reduce(
							(acc, team) => acc + team.members.length,
							0,
						) >=
						eventData.maxTeamSize * eventData.perChapter
					) {
						throw new HttpsError(
							'failed-precondition',
							`Event ${event} is full.`,
						);
					}
				}
			}
		}

		await userRef.update({
			events: result.data.events,
		});

		return { success: true };
	},
);

const userSchema = z.object({
	email: z.string().email(),
	name: z.string(),
	uid: z.string(),
	events: z.array(z.string()),
	admin: z.boolean(),
});
const updateUserSchema = z.object({
	user: z.string().email(),
	data: userSchema,
});
export const updateUser = onCall<z.infer<typeof userSchema>>(
	async ({ auth, data }) => {
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

		const result = updateUserSchema.safeParse(data);

		if (!result.success) {
			throw new HttpsError('invalid-argument', result.error.message);
		}

		const userRef = db.doc(`users/${result.data.user}`);
		const userDoc = await userRef.get();

		if (!userDoc.exists) {
			throw new HttpsError('not-found', 'User not found.');
		}

		const userData = userDoc.data() as UserDoc;

		if (userData.email !== email && !userData.admin) {
			throw new HttpsError(
				'permission-denied',
				'You do not have permission to edit this user.',
			);
		}

		if (result.data.data.events) {
			throw new HttpsError(
				'invalid-argument',
				'Cannot update events through `updateUser`. Use `setEvents` instead.',
			);
		}

		await userRef.update(result.data.data);

		return { success: true };
	},
);
