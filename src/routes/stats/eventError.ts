import type { EventDoc, UserDoc } from '$lib';

export const eventError = (
	event: string,
	events: EventDoc[],
	users: UserDoc[],
): 'errorNotEnough' | 'errorTooMany' | 'warning' | false => {
	const eventInfo = events.find((d) => d.event === event)!;
	const eventData = events
		.map((e) => ({
			...e,
			members: (users.filter((m) => m.events.includes(e.event)) ?? []).map(
				(m) => ({
					name: m.name,
					email: m.email,
				}),
			),
		}))
		.sort((a, b) => a.event.localeCompare(b.event));
	const eventStats = eventData.find((e) => e.event === event);

	if (
		(eventStats?.members ?? []).length &&
		(eventStats?.members ?? []).length < eventInfo.minTeamSize
	)
		return 'errorNotEnough';
	if (
		(eventStats?.members ?? []).length >
		eventInfo.maxTeamSize * eventInfo.perChapter
	)
		return 'errorTooMany';
	else if (
		(eventStats?.members ?? []).length >
		(((eventInfo.maxTeamSize + eventInfo.minTeamSize) / 2 +
			eventInfo.minTeamSize) /
			2) *
			eventInfo.perChapter
	)
		return 'warning';
	else return false;
};
