import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../firebase.config";

const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form states
  const [fullName, setFullName] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [status, setStatus] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [skills, setSkills] = useState([]);
  const [customSkill, setCustomSkill] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [isEmployee, setIsEmployee] = useState(false);
  const [error, setError] = useState("");

  // Predefined skills list
  const skillsList = [
    "React", "JavaScript", "Python", "Node.js", "HTML/CSS", 
    "UI/UX Design", "Data Science", "Marketing", "Project Management", 
    "DevOps", "Cloud Computing", "Mobile Development", "Machine Learning"
  ];

  // Function to generate avatar with initials
  const generateInitialsAvatar = (name) => {
    const initial = name && name.trim() ? name.trim()[0].toUpperCase() : '?';
    // Google-like colors for the background
    const colors = [
      '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
      '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
      '#8BC34A', '#CDDC39', '#FFC107', '#FF9800', '#FF5722'
    ];
    // Use the initial's character code to pick a color deterministically
    const colorIndex = initial.charCodeAt(0) % colors.length;
    return {
      initial,
      backgroundColor: colors[colorIndex]
    };
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Pre-fill data from user profile if available
        if (currentUser.displayName) {
          setFullName(currentUser.displayName);
        }
        
        // Check for photoURL from Google auth
        if (currentUser.photoURL) {
          setProfilePic(currentUser.photoURL);
        }
        // Note: No need for else case here as we'll handle it in the render
        
        // Check if user profile already exists in Firestore
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists() && userDoc.data().profileComplete) {
            setProfileComplete(true);
            navigate("/dashboard");
          }
        } catch (error) {
          console.error("Error checking profile status:", error);
        }
        
        setLoading(false);
      } else {
        // Redirect to sign in if no user
        navigate("/signin");
      }
    });
    
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    // Show company fields if the status is Employee
    setIsEmployee(status === "Employee");
  }, [status]);

  const handleSkillToggle = (skill) => {
    if (skills.includes(skill)) {
      setSkills(skills.filter((s) => s !== skill));
    } else {
      setSkills([...skills, skill]);
    }
  };

  const handleAddCustomSkill = () => {
    if (customSkill && !skills.includes(customSkill)) {
      setSkills([...skills, customSkill]);
      setCustomSkill("");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicFile(file);
      // Create a preview URL
      const previewURL = URL.createObjectURL(file);
      setProfilePic(previewURL);
    }
  };

  const uploadProfilePicture = async () => {
    if (!profilePicFile) return profilePic;
    
    try {
      setUploading(true);
      const fileRef = ref(storage, `profilePics/${user.uid}/${profilePicFile.name}`);
      await uploadBytes(fileRef, profilePicFile);
      const downloadURL = await getDownloadURL(fileRef);
      setUploading(false);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      setUploading(false);
      return null;
    }
  };

  const handleNextStep = () => {
    // Validation for each step
    if (currentStep === 1) {
      if (!fullName.trim()) {
        setError("Full name is required");
        return;
      }
    } else if (currentStep === 2) {
      if (!status) {
        setError("Please select your current status");
        return;
      }
    } else if (currentStep === 3 && isEmployee) {
      if (!companyName.trim() || !jobRole.trim()) {
        setError("Company name and job role are required");
        return;
      }
    } else if (currentStep === 4) {
      if (skills.length === 0) {
        setError("Please select at least one skill");
        return;
      }
    }
    
    setError("");
    setCurrentStep(currentStep + 1);
  };

  const handlePrevStep = () => {
    setError("");
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (skills.length === 0) {
      setError("Please select at least one skill");
      return;
    }
    
    try {
      // Upload profile picture if changed
      let photoURL = profilePic;
      if (profilePicFile) {
        photoURL = await uploadProfilePicture();
        
        // Update auth profile
        await updateProfile(auth.currentUser, {
          displayName: fullName,
          photoURL: photoURL
        });
      }
      
      // Save to Firestore
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        fullName,
        email: user.email,
        photoURL,
        status,
        ...(isEmployee && {
          companyName,
          yearsOfExperience: yearsOfExperience || 0,
          jobRole
        }),
        skills,
        profileComplete: true,
        createdAt: new Date(),
      });
      
      navigate("/dashboard");
    } catch (error) {
      setError("Failed to save profile: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#242424]">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (profileComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#242424]">
        <div className="text-white text-xl">Redirecting to Dashboard...</div>
      </div>
    );
  }

  // Get initial and avatar color for user if no profile pic
  const avatarData = generateInitialsAvatar(fullName || (user?.email?.split('@')[0]) || '?');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-screen bg-[#242424] text-white">
      <h1 className="text-4xl font-bold mb-6 text-center">Complete Your Profile</h1>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-2xl w-full mx-auto relative overflow-hidden z-10 bg-gray-800 p-8 rounded-lg shadow-md mb-8
        before:w-24 before:h-24 before:absolute before:bg-purple-600 before:rounded-full before:-z-10 before:blur-2xl before:-left-12 
        after:w-32 after:h-32 after:absolute after:bg-sky-400 after:rounded-full after:-z-10 after:blur-xl after:top-24 after:-right-12"
      >
        {/* Progress Indicator */}
        <div className="flex justify-between mb-8">
          {[1, 2, 3, 4].map((step) => (
            <div 
              key={step} 
              className={`w-full h-1 rounded-full mx-1 ${
                step <= currentStep ? "bg-gradient-to-r from-purple-600 to-blue-500" : "bg-gray-600"
              }`}
            />
          ))}
        </div>
        
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500 bg-opacity-20 border border-red-500 text-red-100 px-4 py-2 rounded-md mb-4"
          >
            {error}
          </motion.div>
        )}
        
        <form onSubmit={handleSubmit}>
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-bold mb-6">Basic Information</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || ""}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white cursor-not-allowed"
                  disabled
                />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Profile Picture
                </label>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {profilePic ? (
                      <img
                        src={profilePic}
                        alt="Profile Preview"
                        className="w-24 h-24 rounded-full object-cover border-2 border-purple-500"
                      />
                    ) : (
                      <div 
                        className="w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold border-2 border-gray-600"
                        style={{ backgroundColor: avatarData.backgroundColor }}
                      >
                        {avatarData.initial}
                      </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Recommended: Square image, max 2MB
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Step 2: Current Status */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-bold mb-6">Current Status</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                {["Student", "Graduate", "Employee", "Freelancer", "Looking for Job", "Entrepreneur"].map((option) => (
                  <motion.div
                    key={option}
                    whileHover={{ scale: 1.02 }}
                    className={`p-4 rounded-lg border-2 cursor-pointer ${
                      status === option
                        ? "border-purple-500 bg-purple-500 bg-opacity-20"
                        : "border-gray-600 hover:border-gray-400"
                    }`}
                    onClick={() => setStatus(option)}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                          status === option ? "border-purple-500" : "border-gray-400"
                        }`}
                      >
                        {status === option && (
                          <div className="w-3 h-3 rounded-full bg-purple-500" />
                        )}
                      </div>
                      <span>{option}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
          
          {/* Step 3: Employee Details (Conditional) */}
          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {isEmployee ? (
                <>
                  <h2 className="text-2xl font-bold mb-6">Employment Details</h2>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Years of Experience
                    </label>
                    <select
                      value={yearsOfExperience}
                      onChange={(e) => setYearsOfExperience(e.target.value)}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                    >
                      <option value="">Select Years</option>
                      <option value="0-1">Less than 1 year</option>
                      <option value="1-3">1-3 years</option>
                      <option value="3-5">3-5 years</option>
                      <option value="5-10">5-10 years</option>
                      <option value="10+">10+ years</option>
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Job Role
                    </label>
                    <input
                      type="text"
                      value={jobRole}
                      onChange={(e) => setJobRole(e.target.value)}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                      required
                    />
                  </div>
                </>
              ) : (
                <div className="text-center py-10">
                  <h2 className="text-2xl font-bold mb-4">Great!</h2>
                  <p className="text-gray-300 mb-6">
                    Let's move on to selecting your skills.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 via-purple-400 to-blue-500 rounded-md text-white font-medium"
                    type="button"
                    onClick={handleNextStep}
                  >
                    Continue to Skills
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}
          
          {/* Step 4: Skills */}
          {currentStep === 4 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-bold mb-6">Select Your Skills</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Select skills that best describe your expertise
                </label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {skillsList.map((skill) => (
                    <motion.div
                      key={skill}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-3 py-1 rounded-full text-sm cursor-pointer ${
                        skills.includes(skill)
                          ? "bg-gradient-to-r from-purple-600 to-blue-500 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                      onClick={() => handleSkillToggle(skill)}
                    >
                      {skill}
                    </motion.div>
                  ))}
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Add Custom Skill
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    className="flex-grow p-2 bg-gray-700 border border-gray-600 rounded-l-md text-white"
                    placeholder="Enter a skill"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSkill}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-r-md"
                  >
                    Add
                  </button>
                </div>
              </div>
              
              {skills.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your Selected Skills:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <div
                        key={skill}
                        className="bg-purple-500 bg-opacity-20 border border-purple-500 text-white px-3 py-1 rounded-full text-sm flex items-center"
                      >
                        {skill}
                        <button
                          type="button"
                          className="ml-2 text-purple-300 hover:text-white"
                          onClick={() => handleSkillToggle(skill)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
          
          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {currentStep > 1 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={handlePrevStep}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md"
              >
                Back
              </motion.button>
            )}
            
            <div className="ml-auto">
              {currentStep < 4 ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 via-purple-400 to-blue-500 text-white font-medium rounded-md"
                >
                  Next
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 via-purple-400 to-blue-500 text-white font-medium rounded-md disabled:opacity-70"
                >
                  {uploading ? "Saving..." : "Complete Profile"}
                </motion.button>
              )}
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ProfileSetupPage;