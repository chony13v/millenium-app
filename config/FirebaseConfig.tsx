// config/FirebaseConfig.ts
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const requiredFirebaseKeys: (keyof typeof firebaseConfig)[] = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
  "measurementId",
];

const missingKeys = requiredFirebaseKeys.filter((key) => !firebaseConfig[key]);

if (missingKeys.length) {
  throw new Error(
    `Faltan claves de configuración de Firebase: ${missingKeys.join(", ")}. ` +
      "Verifica que todas las variables de entorno estén definidas."
  );
}

// App
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Auth (tipado) con persistencia en RN y fallback si ya estaba inicializado
let auth: Auth;

if (Platform.OS === "web") {
  auth = getAuth(app);
} else {
  const rnAuth = require("firebase/auth");
  const initializeAuth = rnAuth.initializeAuth as (app: any, opts: any) => Auth;
  const getReactNativePersistence = rnAuth.getReactNativePersistence as (
    storage: unknown
  ) => any;

  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // si ya estaba inicializado en otro lugar
    auth = getAuth(app);
  }
}

export { auth };

// Analytics (solo si es soportado)
let analytics: ReturnType<typeof getAnalytics> | null = null;
isSupported()
  .then((supported) => {
    if (supported) analytics = getAnalytics(app);
  })
  .catch(() => {});

export { analytics };

// Firestore
export const db = getFirestore(app);
