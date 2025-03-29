import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCKfJZidtjwXl-3m4-pz0lQhl9IV2DXYfA",
  authDomain: "backend-stuff-ee071.firebaseapp.com",
  projectId: "backend-stuff-ee071",
  storageBucket: "backend-stuff-ee071.appspot.com",
  messagingSenderId: "449147492921",
  appId: "1:449147492921:web:8164eb6d56debfe0f38be8",
  measurementId: "G-WJ2WKR5ZPT",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
