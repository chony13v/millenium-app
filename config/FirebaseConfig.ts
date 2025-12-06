// config/FirebaseConfig.ts
import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// ────────────────────────────────
// Configuración base
// ────────────────────────────────
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Validación de variables requeridas
const requiredKeys: (keyof typeof firebaseConfig)[] = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
  "measurementId",
];

const missingKeys = requiredKeys.filter((key) => !firebaseConfig[key]);
if (missingKeys.length > 0) {
  throw new Error(
    `❌ Faltan claves de configuración de Firebase: ${missingKeys.join(", ")}. ` +
      "Verifica tus variables de entorno EXPO_PUBLIC_FIREBASE_*"
  );
}

// ────────────────────────────────
// Inicialización de App
// ────────────────────────────────
export const app: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// ────────────────────────────────
// Autenticación (con persistencia en React Native)
// ────────────────────────────────
let auth: Auth;

if (Platform.OS === "web") {
  auth = getAuth(app);
} else {
  // Lazy import para RN
  const rnAuth = require("firebase/auth");
  const initializeAuth = rnAuth.initializeAuth as (
    app: FirebaseApp,
    options: { persistence: unknown }
  ) => Auth;

  const getReactNativePersistence = rnAuth.getReactNativePersistence as (
    storage: typeof AsyncStorage
  ) => unknown;

  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // Si ya fue inicializado, reutiliza instancia existente
    auth = getAuth(app);
  }
}

export { auth };

// ────────────────────────────────
// Analytics (solo si es soportado)
// ────────────────────────────────
let analytics: Analytics | null = null;
isSupported()
  .then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  })
  .catch(() => {
    // Ignorar error en entornos donde Analytics no aplica (RN)
  });

export { analytics };

// ────────────────────────────────
// Firestore
// ────────────────────────────────
export const db: Firestore = getFirestore(app);
