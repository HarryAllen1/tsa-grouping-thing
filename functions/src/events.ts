import { HttpsError, onCall } from 'firebase-functions/https';
import { EventDoc, Team } from './types';
import { getAuthUser, getEvent, getUser, userToName } from './utils';
import { Timestamp } from 'firebase-admin/firestore';

export const leaveTeam = onCall<
	{
		event: string;
		teamId: string;
	},
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

		if (event.locked) {
			throw new HttpsError('failed-precondition', 'Event is locked');
		}

		const team = event.teams.find((team) =>
			team.members.some((m) => m.email === user.email),
		);
		if (!team) {
			throw new HttpsError(
				'failed-precondition',
				'Current user is not in a team',
			);
		} else if (team.locked) {
			throw new HttpsError('failed-precondition', 'Team is locked');
		}

		if (team.members.length === 1) {
			await eventRef.update({
				teams: event.teams.filter((t) => t !== team),
				lastUpdatedBy: user.email,
			} satisfies Partial<EventDoc>);

			return {
				success: true,
			};
		} else {
			team.members = team.members.filter(
				(member) => member.email !== user.email,
			);
			await eventRef.update({
				teams: event.teams,
				lastUpdatedBy: user.email,
			} satisfies Partial<EventDoc>);

			return {
				success: true,
			};
		}
	},
);

export const addTeamMember = onCall<
	{
		event: string;
		teamId: string;
		userEmail: string;
	},
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

		if (event.locked) {
			throw new HttpsError('failed-precondition', 'Event is locked');
		}

		const team = event.teams.find((team) =>
			team.members.some((m) => m.email === user.email),
		);
		if (!team) {
			throw new HttpsError(
				'failed-precondition',
				'Current user is not in a team',
			);
		} else if (team.locked) {
			throw new HttpsError('failed-precondition', 'Team is locked');
		} else if (team.members.some((member) => member.email === data.userEmail)) {
			throw new HttpsError('failed-precondition', 'Member is already in team');
		} else if (
			event.teams.some((team) =>
				team.members.some((member) => member.email === data.userEmail),
			)
		) {
			throw new HttpsError(
				'failed-precondition',
				'Member is already in a different team',
			);
		} else if (team.members.length >= event.maxTeamSize) {
			throw new HttpsError('failed-precondition', 'Team is at capacity');
		}

		const { user: newUser } = await getUser(data.userEmail);
		team.members.push({
			name: userToName(newUser),
			email: newUser.email,
		});
		team.lastUpdatedBy = user.email;
		team.lastUpdatedTime = Timestamp.now();

		await eventRef.update({
			teams: event.teams,
		} satisfies Partial<EventDoc>);

		return {
			success: true,
		};
	},
);

export const becomeTeamCaptain = onCall<
	{
		event: string;
		teamId: string;
	},
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

		if (event.locked) {
			throw new HttpsError('failed-precondition', 'Event is locked');
		}

		const team = event.teams.find((team) =>
			team.members.some((m) => m.email === user.email),
		);
		if (!team) {
			throw new HttpsError(
				'failed-precondition',
				'Current user is not in a team',
			);
		} else if (team.locked) {
			throw new HttpsError('failed-precondition', 'Team is locked');
		} else if (team.teamCaptain === user.email) {
			throw new HttpsError(
				'failed-precondition',
				'Current user is already team captain',
			);
		} else if (event.maxTeamSize === 1) {
			throw new HttpsError(
				'failed-precondition',
				'Individual events cannot have team captains',
			);
		}

		team.teamCaptain = user.email;
		team.lastUpdatedBy = user.email;
		team.lastUpdatedTime = Timestamp.now();

		await eventRef.update({
			teams: event.teams,
		} satisfies Partial<EventDoc>);

		return {
			success: true,
		};
	},
);

export const createTeam = onCall<
	{
		event: string;
	},
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
		if (event.locked) {
			throw new HttpsError('failed-precondition', 'Event is locked');
		} else if (event.teamCreationActuallyLocked) {
			throw new HttpsError('failed-precondition', 'Team creation is locked');
		} else if (
			event.teamCreationLocked &&
			event.teams.length >= event.perChapter
		) {
			throw new HttpsError(
				'failed-precondition',
				'Team creation has been locked at capacity',
			);
		} else if (
			event.teams.some((team) =>
				team.members.some((m) => m.email === user.email),
			)
		) {
			throw new HttpsError(
				'failed-precondition',
				'Current user is already in a team',
			);
		}

		let lowestNotTaken = 1;
		while (event.teams.some((t) => t.teamNumber === lowestNotTaken)) {
			lowestNotTaken++;
		}

		event.teams.push({
			id: crypto.randomUUID(),
			lastUpdatedBy: user.email,
			lastUpdatedTime: Timestamp.now(),
			members: [
				{
					name: userToName(user),
					email: user.email,
				},
			],
			teamNumber: lowestNotTaken,
		} satisfies Team);

		await eventRef.update({
			teams: event.teams,
		} satisfies Partial<EventDoc>);

		return {
			success: true,
		};
	},
);

export const editCardboardBoatTeamName = onCall<
	{
		teamId: string;
		name: string;
	},
	Promise<{
		success: boolean;
	}>
>(
	{
		region: 'us-west1',
	},
	async ({ auth, data }) => {
		const { user } = await getAuthUser(auth);
		const { event, eventRef } = await getEvent('*Cardboard Boat');

		const team = event.teams.find((team) =>
			team.members.some((m) => m.email === user.email),
		);

		if (!team) {
			throw new HttpsError('failed-precondition', 'Member is not in a team');
		} else if (event.locked) {
			throw new HttpsError('failed-precondition', 'Event is locked');
		} else if (team.locked) {
			throw new HttpsError('failed-precondition', 'Team is locked');
		} else if (team.teamName === data.name) {
			return {
				success: true,
			};
		}

		team.teamName = data.name;
		team.lastUpdatedBy = user.email;
		team.lastUpdatedTime = Timestamp.now();

		await eventRef.update({
			teams: event.teams,
		} satisfies Partial<EventDoc>);

		return {
			success: true,
		};
	},
);
