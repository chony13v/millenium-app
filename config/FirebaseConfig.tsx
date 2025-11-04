import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { initializeAuth } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

console.log('Firebase Config:', firebaseConfig);

// ✅ Initialize Firebase app
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ✅ Initialize Auth with AsyncStorage persistence (removes warning)
let auth;

try {
  auth = initializeAuth(app, {
    // For web/Expo, you can use browserLocalPersistence or browserSessionPersistence
    // persistence: browserLocalPersistence,
  });
} catch (error) {
  auth = getAuth(app);
}

// ✅ Analytics (only if supported)
let analytics: ReturnType<typeof getAnalytics> | null = null;
isSupported()
  .then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    } else {
      console.log('Firebase Analytics is not supported in this environment');
    }
  })
  .catch((err) => console.log('Error checking analytics support:', err));

// ✅ Initialize Firestore
const db = getFirestore(app);

export { app, db, auth, analytics };
