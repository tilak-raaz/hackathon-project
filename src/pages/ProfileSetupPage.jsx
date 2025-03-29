import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db, createUserRecommendationDoc } from "../firebase.config";

const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    title: "",
    skills: [],
    experience: "",
    education: "",
    location: "",
    bio: ""
  });
  
  const [skillInput, setSkillInput] = useState("");
  
  // Common skills for suggestions
  const skillSuggestions = [
    "JavaScript", "React", "Node.js", "Python", "Java", "C#", "SQL",
    "AWS", "Azure", "Git", "Docker", "TypeScript", "HTML", "CSS",
    "PHP", "Ruby", "Swift", "Kotlin", "Flutter", "Go", "Rust"
  ];

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          navigate("/signin");
          return;
        }

        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setFormData({
            fullName: userData.fullName || "",
            title: userData.title || "",
            skills: userData.skills || [],
            experience: userData.experience || "",
            education: userData.education || "",
            location: userData.location || "",
            bio: userData.bio || ""
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError("Failed to load profile data");
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const addSkill = (skill = skillInput) => {
    if (skill && !formData.skills.includes(skill)) {
      setFormData(prevData => ({
        ...prevData,
        skills: [...prevData.skills, skill]
      }));
      setSkillInput("");
    }
  };

  const removeSkill = (skill) => {
    setFormData(prevData => ({
      ...prevData,
      skills: prevData.skills.filter(s => s !== skill)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("User not authenticated");
      
      // Update user profile in Firestore
      await setDoc(doc(db, "users", currentUser.uid), {
        ...formData,
        email: currentUser.email,
        updatedAt: new Date()
      }, { merge: true });
      
      // Create recommendation document with skills
      await createUserRecommendationDoc(currentUser.uid, formData.skills);
      
      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("Error saving profile:", error);
      setError("Failed to save profile: " + error.message);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-screen bg-[#242424]">
        <div className="text-white">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-screen bg-[#242424] text-white p-4">
      <h1 className="text-4xl font-bold mb-6 text-center">Profile Setup</h1>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-2xl mx-auto relative overflow-hidden z-10 bg-gray-800 p-8 rounded-lg shadow-md w-full
        before:w-24 before:h-24 before:absolute before:bg-purple-600 before:rounded-full before:-z-10 before:blur-2xl 
        after:w-32 after:h-32 after:absolute after:bg-sky-400 after:rounded-full after:-z-10 after:blur-xl after:top-24 after:-right-12"
      >
        <h2 className="text-2xl font-bold text-white mb-6">Your Professional Profile</h2>
        
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="mb-4"
            >
              <label className="block text-sm font-medium text-gray-300" htmlFor="fullName">
                Full Name
              </label>
              <input
                className="mt-1 p-2 w-full bg-gray-700 border border-gray-600 rounded-md text-white"
                name="fullName"
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-4"
            >
              <label className="block text-sm font-medium text-gray-300" htmlFor="title">
                Professional Title
              </label>
              <input
                className="mt-1 p-2 w-full bg-gray-700 border border-gray-600 rounded-md text-white"
                name="title"
                id="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Full Stack Developer"
              />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mb-4"
          >
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Skills
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.skills.map((skill, index) => (
                <div 
                  key={index}
                  className="bg-purple-600 bg-opacity-30 px-3 py-1 rounded-full flex items-center"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="ml-2 text-xs text-gray-300 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="flex">
              <input
                className="p-2 flex-grow bg-gray-700 border border-gray-600 rounded-l-md text-white"
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Add a skill"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              />
              <button
                type="button"
                onClick={() => addSkill()}
                className="bg-purple-600 text-white px-4 py-2 rounded-r-md hover:bg-purple-700"
              >
                Add
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {skillSuggestions.filter(skill => !formData.skills.includes(skill)).slice(0, 8).map((skill, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => addSkill(skill)}
                  className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded hover:bg-gray-600"
                >
                  +{skill}
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mb-4"
          >
            <label className="block text-sm font-medium text-gray-300" htmlFor="experience">
              Experience
            </label>
            <textarea
              className="mt-1 p-2 w-full bg-gray-700 border border-gray-600 rounded-md text-white h-24"
              name="experience"
              id="experience"
              value={formData.experience}
              onChange={handleChange}
              placeholder="Summarize your work experience"
            />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mb-4"
            >
              <label className="block text-sm font-medium text-gray-300" htmlFor="education">
                Education
              </label>
              <input
                className="mt-1 p-2 w-full bg-gray-700 border border-gray-600 rounded-md text-white"
                name="education"
                id="education"
                type="text"
                value={formData.education}
                onChange={handleChange}
                placeholder="Highest degree or certification"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mb-4"
            >
              <label className="block text-sm font-medium text-gray-300" htmlFor="location">
                Location
              </label>
              <input
                className="mt-1 p-2 w-full bg-gray-700 border border-gray-600 rounded-md text-white"
                name="location"
                id="location"
                type="text"
                value={formData.location}
                onChange={handleChange}
                placeholder="City, Country or Remote"
              />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mb-6"
          >
            <label className="block text-sm font-medium text-gray-300" htmlFor="bio">
              Bio
            </label>
            <textarea
              className="mt-1 p-2 w-full bg-gray-700 border border-gray-600 rounded-md text-white h-24"
              name="bio"
              id="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell us a bit about yourself"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="flex justify-end"
          >
            <button
              className="bg-gradient-to-r from-purple-600 via-purple-400 to-blue-500 text-white px-6 py-2 font-bold rounded-md hover:opacity-80 disabled:opacity-50"
              type="submit"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
};

export default ProfileSetupPage;