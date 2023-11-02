import { db, events } from '$lib';
import { rawMemberData as memberData } from '$lib/rawMemberData';
import { doc, getDoc } from 'firebase/firestore';
import { correctTeamsDataType } from '$lib/types';

const eventData = memberData
	.reduce(
		(acc, item) => {
			item.events.forEach((eventName) => {
				const existingEntry = acc.find((entry) => entry.event === eventName);

				if (existingEntry) {
					existingEntry.members.push({
						name: item.name,
						id: item.id,
						email: item.email,
					});
				} else {
					acc.push({
						event: eventName,
						members: [{ name: item.name, id: item.id, email: item.email }],
					});
				}
			});

			return acc;
		},
		[] as {
			event: string;
			members: { name: string; id: string; email: string }[];
		}[],
	)
	.sort((a, b) => a.event.localeCompare(b.event));

(async () => {
	const teamless = [];
	for (const event of eventData.filter(
		(e) => (events.find((ev) => ev.event === e.event)?.maxTeamSize ?? 1) > 1,
	)) {
		const res = await getDoc(doc(db, 'events', event.event));
		const teams = res.data()?.teams ?? [];
		const withoutTeam = memberData
			.filter(
				(p) =>
					!correctTeamsDataType(teams).find(
						(t) =>
							t.members?.find(
								(e) => e.email.toLowerCase() === p.email.toLowerCase(),
							),
					),
			)
			.sort((a, b) => a.name.localeCompare(b.name))
			.filter((m) => m.events.includes(event.event ?? ''));

		teamless.push({
			event: event.event,
			members: withoutTeam,
		});
	}
	console.log(
		teamless
			.map(
				(e) => `${e.event}:
${e.members.map((m) => `${m.name} (${m.email})`).join('\n')}
`,
			)
			.join('\n'),
	);
})();
