import { HttpsError, onCall } from 'firebase-functions/https';
import { getAuthUser, getEvent, userToName } from './utils';
import { EventDoc } from './types';
import { Timestamp } from 'firebase-admin/firestore';

export const saveCheckIn = onCall<
	| {
			preparationLevel: 1 | 2 | 3 | 4;
			preparationLevelDescription: string;
			event: string;
			teamId: string;
			markAsComplete: true;
	  }
	| {
			preparationLevel?: 1 | 2 | 3 | 4;
			preparationLevelDescription?: string;
			event: string;
			teamId: string;
			markAsComplete?: false;
	  },
	Promise<{ success: boolean }>
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
		} else if (!event.eventStatusCheckInEnabled) {
			throw new HttpsError(
				'failed-precondition',
				'Check-ins are not enabled for this event',
			);
		}

		if (
			data.markAsComplete &&
			(!data.preparationLevel || !data.preparationLevelDescription)
		) {
			throw new HttpsError(
				'failed-precondition',
				'Preparation level and description must be filled in for check-in to be marked as complete',
			);
		}

		if (data.markAsComplete) {
			team.checkInComplete = data.markAsComplete;
			team.checkInSubmittedBy = {
				email: user.email,
				name: userToName(user),
			};
			team.checkInSubmittedTime = Timestamp.now();
		}
		if (data.preparationLevel !== undefined) {
			team.preparationLevel = data.preparationLevel.toString();
		}
		if (data.preparationLevelDescription?.length) {
			team.preparationLevelDescription = data.preparationLevelDescription;
		}

		await eventRef.update({
			teams: event.teams,
		} satisfies Partial<EventDoc>);

		return {
			success: true,
		};
	},
);
