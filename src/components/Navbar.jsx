import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { auth } from '../firebase.config';
import { useAuthState } from 'react-firebase-hooks/auth';

const Navbar = () => {
  const location = useLocation();
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  // Handle profile click - only navigate if not already on Account page
  const handleProfileClick = () => {
    if (location.pathname !== '/account') {
      navigate('/account');
    }
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-gray-800 p-2"
    >
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link to="/home" className="text-white font-bold text-lg">
          Home
        </Link>
        <div className="flex space-x-4">
          {/* Only navigate if not already on ResumeUpload page */}
          <Link 
            to={location.pathname === '/resume-upload' ? location.pathname : '/resume-upload'} 
            className="text-white"
          >
            Upload Resume
          </Link>
          {/* Only navigate if not already on DailyChallenge page */}
          <Link 
            to={location.pathname === '/daily-challenge' ? location.pathname : '/daily-challenge'} 
            className="text-white"
          >
            Daily Challenges
          </Link>
        </div>
        {user && (
          <div 
            onClick={handleProfileClick}
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-white cursor-pointer"
          >
            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    </motion.nav>
  );   
};

export default Navbar;