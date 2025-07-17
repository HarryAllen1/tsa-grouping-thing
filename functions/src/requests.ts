import { onCall } from 'firebase-functions/https';
import { HttpsError } from 'firebase-functions/identity';
import { db } from './firebase';
import { EventDoc, UserDoc } from './types';
import { userToName } from './utils';

export const sendRequest = onCall<
	{ event: string; teamId: string },
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

	const user = (await db.collection('users').doc(email).get()).data() as
		| UserDoc
		| undefined;
	if (!user) {
		throw new HttpsError('not-found', 'User not found.');
	}

	const eventsCollection = db.collection('events');
	const event = (await eventsCollection.doc(data.event).get()).data() as
		| EventDoc
		| undefined;

	if (!event) {
		throw new HttpsError('not-found', 'Event not found.');
	}

	const team = event.teams.find((t) => t.id === data.teamId);
	if (!team) {
		throw new HttpsError('not-found', 'Team not found.');
	}

	if (team.locked) {
		throw new HttpsError('failed-precondition', 'Team is locked.');
	} else if (team.members.some((m) => m.email === email)) {
		throw new HttpsError(
			'already-exists',
			'You are already a member of this team.',
		);
	} else if (team.requests?.some((m) => m.email === email)) {
		throw new HttpsError(
			'already-exists',
			'You have already requested to join this team.',
		);
	} else if (team.members.length >= event.maxTeamSize) {
		throw new HttpsError('failed-precondition', 'Team is already full.');
	}

	team.requests ??= [];
	team.requests.push({ name: userToName(user), email });
	team.lastUpdatedBy = email;
	await eventsCollection.doc(data.event).update({
		teams: event.teams,
	});

	await db
		.collection('mail')
		.doc(Date.now().toString())
		.set({
			to: team.members.map((m) => m.email),
			message: {
				subject: 'New TSA team request',
				html: `${
					userToName(user) || 'Someone'
				} has requested to join your team for ${
					event.event
				}. Please go to the <a href="https://teaming.jhstsa.org">team creation wizard</a> to accept or deny the request.<br /><br />- JHS TSA Board<br />Please do not reply to this email; it comes from an unmonitored email address.`,
			},
		});

	return { success: true };
});

export const sendRequestApproval = onCall<
	{ event: string; teamId: string },
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

	const user = (await db.collection('users').doc(email).get()).data() as
		| UserDoc
		| undefined;
	if (!user) {
		throw new HttpsError('not-found', 'User not found.');
	}

	const eventsCollection = db.collection('events');
	const event = (await eventsCollection.doc(data.event).get()).data() as
		| EventDoc
		| undefined;

	if (!event) {
		throw new HttpsError('not-found', 'Event not found.');
	}

	const team = event.teams.find((t) => t.id === data.teamId);
	if (!team) {
		throw new HttpsError('not-found', 'Team not found.');
	}

	if (team.locked) {
		throw new HttpsError('failed-precondition', 'Team is locked.');
	} else if (team.members.some((m) => m.email === email)) {
		throw new HttpsError('already-exists', 'Member is already a part of team.');
	} else if (team.members.length >= event.maxTeamSize) {
		throw new HttpsError('failed-precondition', 'Team is already full.');
	}

	let members = team.members.map((m) => m.name).join(', ');
	const lastComma = members.lastIndexOf(',');
	if (lastComma !== -1) {
		members =
			members.slice(0, lastComma) + ' and' + members.slice(lastComma + 1);
	}
	team.requests ??= [];
	team.requests = team.requests.filter((m) => m.email !== email);
	team.members.push({ name: userToName(user), email });
	team.lastUpdatedBy = email;
	await eventsCollection.doc(data.event).update({
		teams: event.teams,
	});

	await db
		.collection('mail')
		.doc(Date.now().toString())
		.set({
			to: email,
			message: {
				subject: `${event.event} team request approved`,
				html: `Your request to join ${members}'s team for ${event.event} has been approved.<br /><br />- JHS TSA Board<br />Please do not reply to this email; it comes from an unmonitored email address.`,
			},
		});

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
