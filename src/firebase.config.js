import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // Add this import for storage

const firebaseConfig = {
  apiKey: "AIzaSyCKfJZidtjwXl-3m4-pz0lQhl9IV2DXYfA",
  authDomain: "backend-stuff-ee071.firebaseapp.com",
  projectId: "backend-stuff-ee071",
  storageBucket: "backend-stuff-ee071.appspot.com",
  messagingSenderId: "449147492921",
  appId: "1:449147492921:web:8164eb6d56debfe0f38be8",
  measurementId: "G-WJ2WKR5ZPT",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app); // Add this line to initialize and export Storage