import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
import { auth, db, fetchRecommendedJobs } from "../firebase.config";
import { motion } from "framer-motion";
import { FaSpinner } from "react-icons/fa";

const skillsList = ["JavaScript", "React", "Node.js", "Python", "Java", "C++", "SQL", "Machine Learning", "DevOps", "Cybersecurity"];
const experienceLevels = ["Entry Level", "Mid Level", "Senior Level"];

const ProfileSetupPage = ({ userData, setUserData, setHasCompletedProfile }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: userData?.displayName || "",
    skills: userData?.skills || [],
    experience: userData?.experience || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [redirect, setRedirect] = useState(false); // 🚀 NEW: Track when to navigate

  // Navigate to Dashboard when profile is completed
  useEffect(() => {
    if (redirect) {
      navigate("/dashboard");
    }
  }, [redirect, navigate]); // 🔥 Ensures it navigates after state updates

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleSkill = (skill) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill) ? prev.skills.filter((s) => s !== skill) : [...prev.skills, skill],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("User not authenticated");

      await setDoc(doc(db, "users", currentUser.uid), {
        ...formData,
        email: currentUser.email,
        profileCompleted: true,
        updatedAt: new Date(),
      }, { merge: true });

      setUserData({ ...formData, profileCompleted: true });
      setHasCompletedProfile(true);

      // 🔥 Fetch job recommendations after profile setup
      await fetchRecommendedJobs(currentUser.uid);

      setRedirect(true); // 🚀 NEW: Trigger navigation after state updates
    } catch (error) {
      setError("Failed to save profile: " + error.message);
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#242424] text-white p-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-lg">
        <h2 className="text-3xl font-bold mb-4 text-center">Complete Your Profile</h2>
        <p className="text-gray-400 text-center mb-6">This helps us recommend the best jobs for you.</p>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-1">Full Name</label>
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Select Your Skills</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {skillsList.map((skill) => (
                <button key={skill} type="button" onClick={() => toggleSkill(skill)} className={`p-2 rounded-lg border transition ${formData.skills.includes(skill) ? "bg-blue-500 border-blue-600 text-white" : "bg-gray-700 border-gray-600 text-gray-300"}`}>
                  {skill}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-gray-300 mb-1">Experience Level</label>
            <select name="experience" value={formData.experience} onChange={handleChange} required className="w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select Experience Level</option>
              {experienceLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" disabled={saving} className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition flex items-center justify-center">
            {saving ? <FaSpinner className="animate-spin mr-2" /> : "Save & Continue"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ProfileSetupPage;