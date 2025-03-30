import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, addDoc, setDoc, doc, getDoc } from "firebase/firestore"; // Ensure getDoc is imported
import { getStorage } from "firebase/storage";
import { getFunctions, httpsCallable } from "firebase/functions";

// Firebase configuration
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
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Collection references
export const usersCollection = collection(db, "users");
export const jobPostingsCollection = collection(db, "jobPostings");
export const skillTrendsCollection = collection(db, "skillTrends");
export const userRecommendationsCollection = collection(db, "userRecommendations");

// Firebase Functions for AI job matching
export const getJobRecommendations = httpsCallable(functions, 'getJobRecommendations');
export const getSkillGapAnalysis = httpsCallable(functions, 'getSkillGapAnalysis');
export const getMarketTrends = httpsCallable(functions, 'getMarketTrends');

// Helper functions for job-related operations
export const fetchJobsForSkills = async (skills, limit = 20) => {
  try {
    const q = query(
      jobPostingsCollection,
      where("skillsRequired", "array-contains-any", skills)
    );

    const querySnapshot = await getDocs(q);
    const jobs = [];

    querySnapshot.forEach((doc) => {
      jobs.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Sort by relevance (count of matching skills)
    return jobs.sort((a, b) => {
      const aMatches = a.skillsRequired.filter(skill => skills.includes(skill)).length;
      const bMatches = b.skillsRequired.filter(skill => skills.includes(skill)).length;
      return bMatches - aMatches;
    }).slice(0, limit);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    throw error;
  }
};

// Create user-specific recommendation document
export const createUserRecommendationDoc = async (userId, skills) => {
  try {
    const userRecommendationRef = doc(db, "userRecommendations", userId);
    await setDoc(userRecommendationRef, {
      userId,
      skills,
      lastUpdated: new Date(),
      jobRecommendations: [],
      skillGaps: [],
      marketInsights: {}
    });
    return userRecommendationRef;
  } catch (error) {
    console.error("Error creating recommendation document:", error);
    throw error;
  }
};

// Track user job application
export const trackJobApplication = async (userId, jobId, status = "applied") => {
  try {
    const applicationRef = collection(db, "users", userId, "applications");
    await addDoc(applicationRef, {
      jobId,
      status,
      appliedAt: new Date(),
      updatedAt: new Date()
    });
  } catch (error) {
    console.error("Error tracking job application:", error);
    throw error;
  }
};

// Save job search history to improve recommendations
export const saveSearchHistory = async (userId, searchQuery, selectedFilters) => {
  try {
    const searchHistoryRef = collection(db, "users", userId, "searchHistory");
    await addDoc(searchHistoryRef, {
      query: searchQuery,
      filters: selectedFilters,
      timestamp: new Date()
    });
  } catch (error) {
    console.error("Error saving search history:", error);
    throw error;
  }
};

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

export default app;