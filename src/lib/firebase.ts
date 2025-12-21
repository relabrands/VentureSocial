import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // ¡No olvides importar Firestore si lo vas a usar!

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Asegúrate de que todos los valores de configuración sean definidos
// Esto es útil para desarrollo local o para asegurar que no hay undefined en producción
for (const key in firebaseConfig) {
    if (Object.prototype.hasOwnProperty.call(firebaseConfig, key)) {
        if (!firebaseConfig[key as keyof typeof firebaseConfig]) {
            console.warn(`Firebase config variable ${key} is undefined.`);
            // Puedes lanzar un error aquí si quieres una validación estricta
            // throw new Error(`Firebase config variable ${key} is undefined.`);
        }
    }
}


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only in browser environment and if supported
let analytics;
if (typeof window !== "undefined") {
    isSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app);
        }
    });
}

// Initialize Firestore
const db = getFirestore(app);

export { app, analytics, db }; // Exporta db también
