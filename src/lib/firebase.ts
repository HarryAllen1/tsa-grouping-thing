import { dev } from '$app/environment';
import { PUBLIC_FIREBASE_API_KEY } from '$env/static/public';
import { getAnalytics } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { doc, getFirestore, setDoc } from 'firebase/firestore';
import { getPerformance } from 'firebase/performance';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
	apiKey: PUBLIC_FIREBASE_API_KEY || 'AIzaSyAqCsVW3uEohPwFmJR1T-NOF0Gxu8SUwMM',
	authDomain: 'hosa-grouping-thing.firebaseapp.com',
	projectId: 'hosa-grouping-thing',
	storageBucket: 'hosa-grouping-thing.appspot.com',
	messagingSenderId: '416434035170',
	appId: '1:416434035170:web:28d793ded20654259d81bb',
	measurementId: 'G-Q2C4D90KYH',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

!dev && getPerformance(app);

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
