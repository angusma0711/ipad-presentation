import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
const env = import.meta.env;
const config = { apiKey: env.VITE_FIREBASE_API_KEY, authDomain: env.VITE_FIREBASE_AUTH_DOMAIN, projectId: env.VITE_FIREBASE_PROJECT_ID, storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET, messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID, appId: env.VITE_FIREBASE_APP_ID };
let instance: ReturnType<typeof getFirestore> | undefined;
let authentication: Promise<unknown> | undefined;
export async function database() {
    if (!Object.values(config).every(Boolean))
        throw new Error('尚未設定 Firebase。請按照 README 填寫 .env.local。');
    if (!instance) {
        const app = initializeApp(config);
        instance = getFirestore(app);
    }
    const auth = getAuth();
    if (!authentication)
        authentication = auth.authStateReady().then(async () => { if (!auth.currentUser) await signInAnonymously(auth); }).catch(error => { authentication = undefined; throw error; });
    await authentication;
    return instance;
}
