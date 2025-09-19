import type { EventDoc, UserDoc } from '$lib/types';

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
		.toSorted((a, b) => a.event.localeCompare(b.event));
	const eventStats = eventData.find((e) => e.event === event);

	if (
		(eventStats?.members ?? []).length > 0 &&
		(eventStats?.members ?? []).length < eventInfo.minTeamSize
	)
		return 'errorNotEnough';
	if (
		(eventStats?.teams ?? []).length > eventInfo.perChapter ||
		(eventStats?.members.length ?? 0) / eventInfo.maxTeamSize >
			eventInfo.perChapter
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
	return false;
};
