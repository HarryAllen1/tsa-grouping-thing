import type { EventDoc } from './types';

/** Returns the points for selected events that still exist in Firestore. */
export const totalEventPoints = (
	eventNames: string[] | undefined,
	events: Pick<EventDoc, 'event' | 'points'>[],
) =>
	(eventNames ?? []).reduce(
		(total, eventName) =>
			total + (events.find((event) => event.event === eventName)?.points ?? 0),
		0,
	);
