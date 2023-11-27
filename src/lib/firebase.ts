import { dev } from '$app/environment';
import { PUBLIC_FIREBASE_API_KEY } from '$env/static/public';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { doc, getFirestore, setDoc } from 'firebase/firestore';
import { getPerformance } from 'firebase/performance';
import { getStorage } from 'firebase/storage';
import {
	ReCaptchaEnterpriseProvider,
	initializeAppCheck,
} from 'firebase/app-check';

const firebaseConfig = {
	apiKey: PUBLIC_FIREBASE_API_KEY || 'AIzaSyA-_aVUnDt3gOHjtoFwO4S1vSGSnZtCvAU',
	authDomain: 'tsa-grouping-thing.firebaseapp.com',
	projectId: 'tsa-grouping-thing',
	storageBucket: 'tsa-grouping-thing.appspot.com',
	messagingSenderId: '1034710953450',
	appId: '1:1034710953450:web:20baf0bbc221b34fcfd693',
	measurementId: 'G-V9TSZ35FNE',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

!dev && getPerformance(app);
initializeAppCheck(app, {
	provider: new ReCaptchaEnterpriseProvider(
		'6LfGYx0pAAAAAAuvtvrjheXi6ACyJ2w1vlpIHrbj',
	),
	isTokenAutoRefreshEnabled: true,
});

export const sendEmail = async (
	to: string | string[],
	subject: string,
	body: string,
) =>
	setDoc(doc(db, `mail/${Date.now()}`), {
		to: Array.isArray(to) ? to : [to],
		message: {
			subject,
			html: body,
		},
	});
