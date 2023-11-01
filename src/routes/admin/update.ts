import { db } from '$lib';
import { rawMemberData } from '$lib/rawMemberData';
import { doc, setDoc } from 'firebase/firestore';

for (const member of rawMemberData) {
	setDoc(doc(db, 'users', member.email.toLowerCase()), {
		name: member.name,
		email: member.email,
		events: member.events,
	});
}
