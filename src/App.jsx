import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getDoc, doc } from "firebase/firestore";
import { auth, db } from "./firebase.config";
import SignUpPage from "./pages/SignUpPage";
import SignInPage from "./pages/SignInPage";
import ProfileSetupPage from "./pages/ProfileSetupPage";
import Dashboard from "./pages/Dashboard";

const App = () => {
  const [user, setUser] = useState(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Check if user is new (hasn't completed profile setup)
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          // If user document doesn't exist or profileSetupComplete is false, they're a new user
          setIsNewUser(!userDoc.exists() || !userDoc.data().profileSetupComplete);
        } catch (error) {
          console.error("Error checking user status:", error);
          // If there's an error, assume they're a new user to be safe
          setIsNewUser(true);
        }
      } else {
        setUser(null);
        setIsNewUser(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Protected route component that checks if user should complete profile first
  const ProtectedRoute = ({ children }) => {
    if (loading) return <div className="flex items-center justify-center min-h-screen bg-[#242424] text-white">Loading...</div>;
    
    if (!user) {
      return <Navigate to="/signin" />;
    }
    
    // If new user, redirect to profile setup first
    if (isNewUser) {
      return <Navigate to="/profile-setup" />;
    }
    
    return children;
  };

  // Route specifically for the profile setup page
  const ProfileSetupRoute = ({ children }) => {
    if (loading) return <div className="flex items-center justify-center min-h-screen bg-[#242424] text-white">Loading...</div>;
    
    if (!user) {
      return <Navigate to="/signin" />;
    }
    
    // If not a new user (already completed profile), redirect to dashboard
    if (!isNewUser) {
      return <Navigate to="/dashboard" />;
    }
    
    return children;
  };

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={user ? (isNewUser ? <Navigate to="/profile-setup" /> : <Navigate to="/dashboard" />) : <SignUpPage />} />
        <Route path="/signup" element={user ? (isNewUser ? <Navigate to="/profile-setup" /> : <Navigate to="/dashboard" />) : <SignUpPage />} />
        <Route path="/signin" element={user ? (isNewUser ? <Navigate to="/profile-setup" /> : <Navigate to="/dashboard" />) : <SignInPage />} />
        
        {/* Protected routes */}
        <Route path="/profile-setup" element={
          <ProfileSetupRoute>
            <ProfileSetupPage />
          </ProfileSetupRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;