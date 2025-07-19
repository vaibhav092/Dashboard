// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: 'AIzaSyD3rEexLHqPsrs6xYvRip8Kdg31BgKFBII',
    authDomain: 'dashboard-cehpoint.firebaseapp.com',
    projectId: 'dashboard-cehpoint',
    storageBucket: 'dashboard-cehpoint.firebasestorage.app',
    messagingSenderId: '1080060874847',
    appId: '1:1080060874847:web:163cf371137260e55e0bea',
    measurementId: 'G-F98LZDVWMG',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
