import { db, removeRef } from '$lib';
import { collection, getDocs } from 'firebase/firestore';

export const downloadAsJSON = async () => {
	const teamsJSON = removeRef({
		events: (await getDocs(collection(db, 'events'))).docs.map((d) => ({
			...d.data(),
		})),
		users: (await getDocs(collection(db, 'users'))).docs.map((d) => ({
			user: d.id,
			...d.data(),
		})),
		settings: (await getDocs(collection(db, 'settings'))).docs.map((d) => ({
			...d.data(),
		})),
	});

	const teamsBlob = new Blob(
		[
			new TextEncoder().encode(
				JSON.stringify(
					teamsJSON,
					(k, v) =>
						[
							'members',
							'events',
							'users',
							'teams',
							'results',
							'requests',
							'settings',
						].includes(k)
							? Object.values(v)
							: v,
					2,
				),
			),
		],
		{
			type: 'application/json;charset=utf-8',
		},
	);

	const url = URL.createObjectURL(teamsBlob);
	const a = document.createElement('a');
	a.style.display = 'none';
	a.href = url;
	a.download = 'teams.json';
	document.body.append(a);
	a.click();
	URL.revokeObjectURL(url);
	a.remove();
};

export const downloadAsCSV = async () => {
	let csv =
		'Full Name,First Name,Last Name,Email,Grade,Events,Gender,Demographic,National ID,WTSA ID\n';

	for (const userData of (await getDocs(collection(db, 'users'))).docs
		.map((d) => ({ ...d.data() }))
		.filter((u) => u.events.length)) {
		csv += `${userData.name},${userData.firstName},${userData.lastName},${userData.email},${userData.grade},"${userData.events.join(', ')}",${userData.gender},${userData.demographic},${userData.nationalId},${userData.washingtonId}\n`;
	}

	const csvBlob = new Blob([new TextEncoder().encode(csv)], {
		type: 'text/csv',
	});

	const url = URL.createObjectURL(csvBlob);
	const a = document.createElement('a');
	a.style.display = 'none';
	a.href = url;
	a.download = 'members.csv';
	document.body.append(a);
	a.click();
	URL.revokeObjectURL(url);
	a.remove();
};
