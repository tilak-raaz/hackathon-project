import React, { useState, useEffect, useLayoutEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { getDoc, doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase.config";

// Pages
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import Dashboard from "./pages/Dashboard";
import ProfileSetupPage from "./pages/ProfileSetupPage";
import NotFoundPage from "./pages/NotFoundPage";

// Components
import LoadingScreen from "./components/LoadingScreen";

function AppRoutes() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedProfile, setHasCompletedProfile] = useState(false);
  const location = useLocation();

  useLayoutEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(true); // Show loading screen while fetching Firestore data

      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userDataFromFirestore = userDoc.data();
            setUserData(userDataFromFirestore);
            setHasCompletedProfile(!!userDataFromFirestore.profileCompleted);
          } else {
            const newUserData = {
              email: currentUser.email,
              displayName: currentUser.displayName || "",
              createdAt: new Date().toISOString(),
              profileCompleted: false,
              skills: []
            };

            await setDoc(userDocRef, newUserData);
            setUserData(newUserData);
            setHasCompletedProfile(false);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUserData(null);
        setHasCompletedProfile(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/signup" />} />
      <Route path="/signin" element={user ? (hasCompletedProfile ? <Navigate to="/dashboard" /> : <Navigate to="/profile-setup" />) : <SignInPage />} />
      <Route path="/signup" element={user ? (hasCompletedProfile ? <Navigate to="/dashboard" /> : <Navigate to="/profile-setup" />) : <SignUpPage />} />
      <Route 
        path="/profile-setup" 
        element={
          user 
            ? <ProfileSetupPage userData={userData} setUserData={setUserData} setHasCompletedProfile={setHasCompletedProfile} />
            : <Navigate to="/signup" />
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          user 
            ? (hasCompletedProfile ? <Dashboard userData={userData} /> : <Navigate to="/profile-setup" />)
            : <Navigate to="/signin" />
        } 
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

// Main App component
export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}