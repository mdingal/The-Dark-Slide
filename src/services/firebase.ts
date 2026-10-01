import { initializeApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { initializeFirestore, memoryLocalCache } from 'firebase/firestore';
export const firebaseApp = initializeApp({ apiKey: 'AIzaSyDVEKNgNjCUyGl0NSrYtw7E07LgOX5gyAM', authDomain: 'the-dark-slide-fe8a4.firebaseapp.com', projectId: 'the-dark-slide-fe8a4', storageBucket: 'the-dark-slide-fe8a4.firebasestorage.app', messagingSenderId: '515578381846', appId: '1:515578381846:web:90a25ac2029bdcdaa79737' });
export const auth = getAuth(firebaseApp);
export const authReady = setPersistence(auth, browserLocalPersistence);
export const db = initializeFirestore(firebaseApp, { localCache: memoryLocalCache() });
