import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: "AIzaSyBAPdprLgMIkpY2yfjqi-WC_25HS5gvn98",
  authDomain: "greenlease-3142d.firebaseapp.com",
  databaseURL: "https://greenlease-3142d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "greenlease-3142d",
  storageBucket: "greenlease-3142d.firebasestorage.app",
  messagingSenderId: "1068995180665",
  appId: "1:1068995180665:web:1ba402c701f79b80517ca8",
  measurementId: "G-3SV3QCYPG1",
};

const app = initializeApp(firebaseConfig);

// Initialize App Check with ReCaptcha for production/development
// For local development, disable enforcement to avoid token validation errors
try {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('6Lf7LXcsAAAAAFWTwc5Hrr9f35Wb_OAUBsYkIzjK'),
    isTokenAutoRefreshEnabled: true,
    // Disable enforcement in development to allow testing without valid tokens
    enforceTokenAutoRefresh: false
  });
  console.log("✅ Firebase App Check initialized successfully");
} catch (err) {
  console.warn("⚠️ App Check initialization warning:", err.message);
}

export const auth = getAuth(app);
export const db = getFirestore(app);
