import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase.config';
import { getDoc, doc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import DailyChallenges from '../components/DailyChallenges';
import GitHubGrid from '../components/GitHubGrid';

const Account = () => {
  const [userData, setUserData] = useState(null);
  const [geoLocation, setGeoLocation] = useState(null);
  const [profilePicture, setProfilePicture] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;

      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserData(data);
          setupProfilePicture(data);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    const setupProfilePicture = (data) => {
      if (data.profilePicture) {
        setProfilePicture(data.profilePicture);
      } else if (data.authProvider === 'google') {
        setProfilePicture('https://path-to-google-profile-picture');
      } else {
        setProfilePicture(data.username.charAt(0).toUpperCase());
      }
    };

    fetchData();
    fetchGeoLocation();
  }, []);

  const fetchGeoLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setGeoLocation({ latitude, longitude });
      },
      (error) => {
        console.error('Error fetching geo-location:', error);
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#242424] text-white">
      <Navbar />
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto p-4 sm:p-8"
      >
        <h1 className="text-4xl font-bold mb-6 text-center">Account</h1>
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center text-2xl">
            {profilePicture && (
              <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
            )}
          </div>
          {userData && (
            <div className="mt-4 text-center">
              <h2 className="text-2xl font-bold">{userData.fullName}</h2>
              <p className="text-gray-300">{userData.email}</p>
              <p className="text-gray-300">Username: {userData.username}</p>
              {geoLocation && (
                <p className="text-gray-300">
                  Location: {geoLocation.latitude}, {geoLocation.longitude}
                </p>
              )}
            </div>
          )}
        </div>
        {userData && <DailyChallenges skills={userData.skills} />}
        <GitHubGrid solvedCount={10} /> {/* For demonstration, setting solvedCount to 10 */}
      </motion.div>
    </div>
  );
};

export default Account;