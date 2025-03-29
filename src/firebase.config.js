// Import necessary functions from Firebase SDKs
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import axios from "axios";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCKfJZidtjwXl-3m4-pz0lQhl9IV2DXYfA",
  authDomain: "backend-stuff-ee071.firebaseapp.com",
  projectId: "backend-stuff-ee071",
  storageBucket: "backend-stuff-ee071.appspot.com",
  messagingSenderId: "449147492921",
  appId: "1:449147492921:web:8164eb6d56debfe0f38be8",
  measurementId: "G-WJ2WKR5ZPT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

/**
 * Fetch recommended jobs based on the user's skills
 * @param {string} userId - User ID
 */
const fetchRecommendedJobs = async (userId) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) throw new Error("User not found");

    const userData = userDoc.data();
    if (!userData.skills || userData.skills.length === 0) {
      console.log("No skills found for user.");
      return;
    }

    // 🔥 Use user's first skill as search query
    const jobSearchQuery = userData.skills[0];

    const options = {
      method: "GET",
      url: "https://indeed-indeed.p.rapidapi.com/apisearch",
      params: {
        v: "2",
        format: "json",
        q: jobSearchQuery,
        l: "remote",
        radius: "50",
      },
      headers: {
        "x-rapidapi-key": "708376d487msha9a3bc6ca8fb8d0p118620jsn4812743ad2b5",
        "x-rapidapi-host": "indeed-indeed.p.rapidapi.com",
      },
    };

    const response = await axios.request(options);
    console.log("Recommended Jobs:", response.data);
  } catch (error) {
    console.error("Error fetching recommended jobs:", error);
  }
};

// Function to fetch recommended jobs
export const fetchRecommendedJobs = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      return userData.skills || [];
    } else {
      throw new Error("User document not found");
    }
  } catch (error) {
    console.error("Error fetching recommended jobs:", error);
    throw error;
  }
};

// Export Firebase instances and functions
export { auth, db, googleProvider, fetchRecommendedJobs };
