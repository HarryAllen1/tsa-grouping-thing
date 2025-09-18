import { dev } from '$app/environment';
import { env } from '$env/dynamic/public';
import { getAnalytics } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { getPerformance } from 'firebase/performance';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

const firebaseConfig = {
	apiKey:
		env.PUBLIC_FIREBASE_API_KEY ||
		/* restricted key */ 'AIzaSyA-_aVUnDt3gOHjtoFwO4S1vSGSnZtCvAU',
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
export const analytics = getAnalytics(app);
export const functions = getFunctions(app, 'us-west1');

if (env.PUBLIC_FIREBASE_EMULATORS === 'true') {
	connectAuthEmulator(auth, 'http://127.0.0.1:9099');
	connectFirestoreEmulator(db, '127.0.0.1', 8080);
	connectStorageEmulator(storage, '127.0.0.1', 9199);
	connectFunctionsEmulator(functions, '127.0.0.1', 5001);
}

if (!dev) getPerformance(app);
