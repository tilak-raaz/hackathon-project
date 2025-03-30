import React, { useState, useEffect, useCallback } from 'react';
import { auth, db, storage } from '../firebase.config';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import GitHubContributionGrid from '../components/GitHubContributionGrid';
import SkillBadge from '../components/SkillBadge';
import LoadingSpinner from '../components/LoadingSpinner';

const COMMON_SKILLS = ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'TypeScript', 'SQL'];

const Account = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profilePicture, setProfilePicture] = useState('');
  const [newProfilePicture, setNewProfilePicture] = useState(null);
  const [profileData, setProfileData] = useState({
    skills: [],
    linkedin: '',
    github: '',
    portfolio: '',
    bio: '',
    location: ''
  });
  const [newSkill, setNewSkill] = useState('');
  const [activeSection, setActiveSection] = useState('profile');

  // Load user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserData(data);
          setProfileData({
            skills: data.skills || [],
            linkedin: data.linkedin || '',
            github: data.github || '',
            portfolio: data.portfolio || '',
            bio: data.bio || '',
            location: data.location || ''
          });
          setupProfilePicture(data);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const setupProfilePicture = useCallback((data) => {
    if (data.profilePicture) {
      setProfilePicture(data.profilePicture);
    } else if (data.authProvider === 'google') {
      const user = auth.currentUser;
      if (user?.providerData) {
        const googleProviderData = user.providerData.find(
          (provider) => provider.providerId === 'google.com'
        );
        if (googleProviderData?.photoURL) {
          setProfilePicture(googleProviderData.photoURL);
        }
      }
    } else if (data.username) {
      // Use initial as fallback
      setProfilePicture(data.username.charAt(0).toUpperCase());
    }
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewProfilePicture(file);
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async () => {
    if (!auth.currentUser) return;
    
    setSaving(true);
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      let updateData = { ...profileData };
      
      // Upload new profile picture if selected
      if (newProfilePicture) {
        const storageRef = ref(storage, `profilePictures/${auth.currentUser.uid}`);
        await uploadBytes(storageRef, newProfilePicture);
        const downloadURL = await getDownloadURL(storageRef);
        updateData.profilePicture = downloadURL;
      }
      
      await updateDoc(userRef, updateData);
      setNewProfilePicture(null);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = (skill) => {
    if (!skill || profileData.skills.includes(skill)) return;
    
    setProfileData(prev => ({
      ...prev,
      skills: [...prev.skills, skill]
    }));
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setProfileData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#242424] text-white flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-[#242424] text-white">
        <Navbar />
        <div className="max-w-4xl mx-auto p-8 text-center">
          <h2 className="text-2xl font-bold">Please sign in to view your account</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#242424] text-white">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-4 gap-6"
        >
          {/* Left sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center text-4xl mb-4">
                    {typeof profilePicture === 'string' && profilePicture.startsWith('http') ? (
                      <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      typeof profilePicture === 'string' && profilePicture.startsWith('data:') ? (
                        <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span>{profilePicture}</span>
                      )
                    )}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <label className="bg-black bg-opacity-50 text-white p-2 rounded-full cursor-pointer">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold">{userData.fullName}</h2>
                <p className="text-gray-300">{userData.email}</p>
                <p className="text-gray-300 mb-4">@{userData.username}</p>
                
                <nav className="w-full mt-4">
                  <ul className="space-y-2">
                    <li>
                      <button 
                        onClick={() => setActiveSection('profile')}
                        className={`w-full text-left px-4 py-2 rounded ${activeSection === 'profile' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                      >
                        Profile
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => setActiveSection('skills')}
                        className={`w-full text-left px-4 py-2 rounded ${activeSection === 'skills' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                      >
                        Skills
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => setActiveSection('links')}
                        className={`w-full text-left px-4 py-2 rounded ${activeSection === 'links' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                      >
                        Links
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => setActiveSection('activity')}
                        className={`w-full text-left px-4 py-2 rounded ${activeSection === 'activity' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                      >
                        Activity
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
          
          {/* Main content */}
          <div className="lg:col-span-3">
            <div className="bg-gray-800 bg-opacity-80 backdrop-blur-lg rounded-lg shadow-lg p-6 
              relative overflow-hidden 
              before:w-24 before:h-24 before:absolute before:bg-purple-600 before:rounded-full before:-z-10 before:blur-2xl before:opacity-20
              after:w-32 after:h-32 after:absolute after:bg-sky-400 after:rounded-full after:-z-10 after:blur-xl after:top-24 after:-right-12 after:opacity-20"
            >
              {activeSection === 'profile' && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">Profile Information</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-300 mb-1">Bio</label>
                      <textarea
                        name="bio"
                        value={profileData.bio}
                        onChange={handleInputChange}
                        className="w-full p-3 rounded bg-gray-700 text-white"
                        rows="4"
                        placeholder="Tell us about yourself..."
                      ></textarea>
                    </div>
                    
                    <div>
                      <label className="block text-gray-300 mb-1">Location</label>
                      <input
                        type="text"
                        name="location"
                        value={profileData.location}
                        onChange={handleInputChange}
                        placeholder="City, Country"
                        className="w-full p-3 rounded bg-gray-700 text-white"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {activeSection === 'skills' && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">Skills</h2>
                  
                  <div className="mb-4">
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        className="flex-grow p-2 rounded bg-gray-700 text-white"
                        placeholder="Add a new skill..."
                      />
                      <button
                        onClick={() => handleAddSkill(newSkill)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                      >
                        Add
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      {COMMON_SKILLS.map((skill) => (
                        <button
                          key={skill}
                          onClick={() => handleAddSkill(skill)}
                          className={`px-3 py-1 rounded text-sm ${
                            profileData.skills.includes(skill)
                              ? 'bg-gray-700 text-gray-400'
                              : 'bg-gray-600 hover:bg-gray-500 text-white'
                          }`}
                          disabled={profileData.skills.includes(skill)}
                        >
                          + {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-2">Your Skills</h3>
                  {profileData.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profileData.skills.map((skill, index) => (
                        <div key={index} className="flex items-center bg-blue-600 rounded-full px-3 py-1">
                          <span>{skill}</span>
                          <button
                            onClick={() => handleRemoveSkill(skill)}
                            className="ml-2 text-white hover:text-red-300"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">No skills added yet.</p>
                  )}
                </div>
              )}
              
              {activeSection === 'links' && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">Professional Links</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-300 mb-1">LinkedIn</label>
                      <div className="flex">
                        <span className="bg-gray-600 text-gray-300 px-3 py-2 rounded-l">linkedin.com/in/</span>
                        <input
                          type="text"
                          name="linkedin"
                          value={profileData.linkedin}
                          onChange={handleInputChange}
                          className="flex-grow p-2 rounded-r bg-gray-700 text-white"
                          placeholder="username"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-gray-300 mb-1">GitHub</label>
                      <div className="flex">
                        <span className="bg-gray-600 text-gray-300 px-3 py-2 rounded-l">github.com/</span>
                        <input
                          type="text"
                          name="github"
                          value={profileData.github}
                          onChange={handleInputChange}
                          className="flex-grow p-2 rounded-r bg-gray-700 text-white"
                          placeholder="username"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-gray-300 mb-1">Portfolio Website</label>
                      <input
                        type="text"
                        name="portfolio"
                        value={profileData.portfolio}
                        onChange={handleInputChange}
                        className="w-full p-2 rounded bg-gray-700 text-white"
                        placeholder="https://your-portfolio.com"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {activeSection === 'activity' && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">Activity</h2>
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">GitHub Contributions</h3>
                    <GitHubContributionGrid 
                      solvedChallenges={userData.solvedChallenges || 0} 
                      className="bg-gray-900 p-4 rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Recent Applications</h3>
                    {userData.recentApplications?.length > 0 ? (
                      <ul className="space-y-2">
                        {userData.recentApplications.map((app, index) => (
                          <li key={index} className="bg-gray-700 p-3 rounded">
                            <div className="font-medium">{app.jobTitle}</div>
                            <div className="text-sm text-gray-300">{app.company}</div>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-xs text-gray-400">{app.date}</span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                app.status === 'pending' ? 'bg-yellow-600' : 
                                app.status === 'accepted' ? 'bg-green-600' : 'bg-red-600'
                              }`}>
                                {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-400">No recent job applications.</p>
                    )}
                  </div>
                </div>
              )}
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleUpdateProfile}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded flex items-center"
                >
                  {saving && (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Account;