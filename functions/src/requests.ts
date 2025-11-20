import { onCall } from 'firebase-functions/https';
import { HttpsError } from 'firebase-functions/identity';
import { db } from './firebase.js';
import { UserDoc } from './types.js';
import { getAuthUser, getEvent, logFunctionCall, userToName } from './utils.js';

export const sendRequest = onCall<
	{ event: string; teamId: string },
	Promise<{
		success: boolean;
	}>
>(
	{
		region: 'us-west1',
	},
	async ({ auth, data }) => {
		const { user } = await getAuthUser(auth);

		const { event, eventRef } = await getEvent(data.event);

		const team = event.teams.find((t) => t.id === data.teamId);
		if (!team) {
			throw new HttpsError('not-found', 'Team not found.');
		}

		if (team.locked) {
			throw new HttpsError('failed-precondition', 'Team is locked.');
		} else if (team.members.some((m) => m.email === user.email)) {
			throw new HttpsError(
				'already-exists',
				'You are already a member of this team.',
			);
		} else if (team.requests?.some((m) => m.email === user.email)) {
			throw new HttpsError(
				'already-exists',
				'You have already requested to join this team.',
			);
		} else if (team.members.length >= event.maxTeamSize) {
			throw new HttpsError('failed-precondition', 'Team is already full.');
		}

		team.requests ??= [];
		team.requests.push({ name: userToName(user), email: user.email });
		team.lastUpdatedBy = user.email;
		eventRef.update({
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

		await logFunctionCall('sendRequest', user, data);

		return { success: true };
	},
);

export const sendRequestApproval = onCall<
	{ event: string; teamId: string; userEmail: string },
	Promise<{
		success: boolean;
	}>
>(
	{
		region: 'us-west1',
	},
	async ({ auth, data }) => {
		const { user } = await getAuthUser(auth);

		const approvedUser = (
			await db.collection('users').doc(data.userEmail).get()
		).data() as UserDoc | undefined;
		if (!approvedUser) {
			throw new HttpsError('not-found', 'Approved user not found.');
		}

		const { event, eventRef } = await getEvent(data.event);

		const team = event.teams.find((t) => t.id === data.teamId);
		if (!team) {
			throw new HttpsError('not-found', 'Team not found.');
		}

		if (team.locked) {
			throw new HttpsError('failed-precondition', 'Team is locked.');
		} else if (team.members.some((m) => m.email === data.userEmail)) {
			throw new HttpsError(
				'already-exists',
				'Member is already a part of team.',
			);
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
		team.requests = team.requests.filter((m) => m.email !== data.userEmail);
		team.members.push({
			name: userToName(approvedUser),
			email: data.userEmail,
		});
		team.lastUpdatedBy = user.email;
		eventRef.update({
			teams: event.teams,
		});

		await db
			.collection('mail')
			.doc(Date.now().toString())
			.set({
				to: data.userEmail,
				message: {
					subject: `${event.event} team request approved`,
					html: `Your request to join ${members}'s team for ${event.event} has been approved.<br /><br />- JHS TSA Board<br />Please do not reply to this email; it comes from an unmonitored email address.`,
				},
			});

		await logFunctionCall('sendRequestApproval', user, data);

		return { success: true };
	},
);

export const sendRequestDenial = onCall<
	{ event: string; teamId: string; userEmail: string },
	Promise<{
		success: boolean;
	}>
>(
	{
		region: 'us-west1',
	},
	async ({ auth, data }) => {
		const { user } = await getAuthUser(auth);

		const deniedUser = (
			await db.collection('users').doc(data.userEmail).get()
		).data() as UserDoc | undefined;
		if (!deniedUser) {
			throw new HttpsError('not-found', 'Denied user not found.');
		}

		const { event, eventRef } = await getEvent(data.event);

		const team = event.teams.find((t) => t.id === data.teamId);
		if (!team) {
			throw new HttpsError('not-found', 'Team not found.');
		}

		if (team.members.some((m) => m.email === data.userEmail)) {
			throw new HttpsError(
				'already-exists',
				'Member is already a part of team.',
			);
		}

		let members = team.members.map((m) => m.name).join(', ');
		const lastComma = members.lastIndexOf(',');
		if (lastComma !== -1) {
			members =
				members.slice(0, lastComma) + ' and' + members.slice(lastComma + 1);
		}
		team.requests ??= [];
		team.requests = team.requests.filter((m) => m.email !== data.userEmail);
		team.lastUpdatedBy = user.email;
		eventRef.update({
			teams: event.teams,
		});

		await db
			.collection('mail')
			.doc(Date.now().toString())
			.set({
				to: data.userEmail,
				message: {
					subject: `${event.event} team request denied`,
					html: `Your request to join ${members}'s team for ${event.event} has been denied. Please contact them for more information.<br /><br />- JHS TSA Board<br />Please do not reply to this email; it comes from an unmonitored email address.`,
				},
			});

		await logFunctionCall('sendRequestDenial', user, data);

		return { success: true };
	},
);
