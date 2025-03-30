import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="bg-gray-800 p-4">
      <div className="max-w-6xl mx-auto flex justify-between">
        <Link to="/account" className={`text-white ${location.pathname === '/account' ? 'font-bold' : ''}`}>
          Account
        </Link>
        <Link to="/resume-upload" className={`text-white ${location.pathname === '/resume-upload' ? 'font-bold' : ''}`}>
          Upload Resume
        </Link>
        <Link to="/job-recommendations" className={`text-white ${location.pathname === '/job-recommendations' ? 'font-bold' : ''}`}>
          Job Recommendations
        </Link>
      </div>
    </nav>
  );
};

export default Navbar; 