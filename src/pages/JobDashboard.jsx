import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { auth, db, fetchJobsForSkills, getJobRecommendations, getSkillGapAnalysis } from "../firebase.config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const JobDashboard = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [skillGaps, setSkillGaps] = useState([]);
  const [trendingSkills, setTrendingSkills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchUserData(currentUser.uid);
      } else {
        // Redirect to sign in if not authenticated
        navigate("/signin");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchUserData = async (userId) => {
    try {
      setIsLoading(true);
      // Fetch user profile
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        setProfile(userDoc.data());
        
        // If user has skills, fetch job recommendations
        if (userDoc.data().skills && userDoc.data().skills.length > 0) {
          const skills = userDoc.data().skills;
          
          // Fetch job recommendations based on skills
          const jobMatches = await fetchJobsForSkills(skills, 5);
          setRecommendations(jobMatches);
          
          // Get skill gap analysis
          try {
            const skillGapResult = await getSkillGapAnalysis({ skills });
            if (skillGapResult.data) {
              setSkillGaps(skillGapResult.data.gaps || []);
            }
          } catch (error) {
            console.error("Error getting skill gaps:", error);
          }
          
          // Set some trending skills (normally would come from backend)
          setTrendingSkills([
            "React", "Node.js", "TypeScript", "Python", 
            "Data Science", "Machine Learning", "AWS", "Docker"
          ]);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#242424]">
        <div className="w-12 h-12 border-4 border-t-purple-600 border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#242424] text-white">
      {/* Header */}
      <header className="bg-gray-900 p-4 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
            Job Compass
          </h1>
          
          <div className="flex items-center space-x-4">
            {profile && (
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-400 flex items-center justify-center text-white font-bold">
                  {profile.name ? profile.name[0].toUpperCase() : user.email[0].toUpperCase()}
                </div>
                <span className="ml-2 hidden md:inline">{profile.name || user.email}</span>
              </div>
            )}
            
            <button
              onClick={() => auth.signOut()}
              className="text-sm text-gray-300 hover:text-white"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto p-6">
        {/* Welcome Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <h2 className="text-3xl font-bold mb-2">
            Welcome back{profile?.name ? `, ${profile.name}` : ''}!
          </h2>
          <p className="text-gray-300">
            {profile?.skills?.length > 0 
              ? "Here's your personalized job dashboard based on your skills." 
              : "Complete your profile setup to get personalized job recommendations."}
          </p>
        </motion.section>
        
        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10"
        >
          <Link
            to="/job-search"
            className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-purple-500 transition-all duration-300 flex items-center"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-500 rounded-full flex items-center justify-center mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">Search Jobs</h3>
              <p className="text-gray-300">Find opportunities that match your skills and interests</p>
            </div>
          </Link>
          
          <Link
            to="/profile-setup"
            className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-purple-500 transition-all duration-300 flex items-center"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-500 rounded-full flex items-center justify-center mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">Update Profile</h3>
              <p className="text-gray-300">Enhance your profile to improve job matches</p>
            </div>
          </Link>
        </motion.div>
        
        {/* Job Recommendations */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-10"
        >
          <h2 className="text-2xl font-bold mb-4">Recommended Jobs</h2>
          
          {recommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((job, index) => (
                <motion.div
                  key={job.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
                  className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-purple-500 transition-all duration-300"
                >
                  <h3 className="text-lg font-bold mb-1 text-purple-300">{job.title || job.jobtitle}</h3>
                  <p className="text-gray-300 font-medium mb-1">{job.company}</p>
                  <p className="text-gray-400 text-sm mb-2">{job.location || job.formattedLocation}</p>
                  
                  {job.skillsRequired && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1 mt-2">
                        {job.skillsRequired.slice(0, 3).map((skill, i) => (
                          <span key={i} className="text-xs bg-blue-900 bg-opacity-40 px-2 py-1 rounded-full">
                            {skill}
                          </span>
                        ))}
                        {job.skillsRequired.length > 3 && (
                          <span className="text-xs bg-gray-700 px-2 py-1 rounded-full">
                            +{job.skillsRequired.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end">
                    <a
                      href={job.url || `#/job/${job.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm bg-gradient-to-r from-purple-600 to-blue-500 text-white px-3 py-1 rounded-md hover:opacity-90 transition duration-300"
                    >
                      View Job
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-800 p-6 rounded-lg text-center">
              {profile?.skills?.length > 0 ? (
                <p>No job recommendations available at the moment. Try searching for jobs instead.</p>
              ) : (
                <div>
                  <p className="mb-4">Complete your profile to get personalized job recommendations.</p>
                  <Link
                    to="/profile-setup"
                    className="bg-gradient-to-r from-purple-600 to-blue-500 text-white px-4 py-2 rounded-md hover:opacity-90 transition duration-300"
                  >
                    Set Up Profile
                  </Link>
                </div>
              )}
            </div>
          )}
        </motion.section>
        
        {/* Skills & Trends Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Skill Gaps */}
          <div>
            <h2 className="text-xl font-bold mb-4">Skill Gap Analysis</h2>
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              {skillGaps.length > 0 ? (
                <div>
                  <p className="text-gray-300 mb-4">
                    Consider learning these in-demand skills to boost your job prospects:
                  </p>
                  <ul className="space-y-2">
                    {skillGaps.map((skill, index) => (
                      <li key={index} className="flex items-center">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                        <span>{skill}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div>
                  <p className="text-gray-300">
                    {profile?.skills?.length > 0 
                      ? "Your skills look great! We don't see any critical skill gaps at the moment."
                      : "Complete your profile to see a skill gap analysis."}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Trending Skills */}
          <div>
            <h2 className="text-xl font-bold mb-4">Trending Skills</h2>
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <p className="text-gray-300 mb-4">
                Skills currently in high demand:
              </p>
              <div className="flex flex-wrap gap-2">
                {trendingSkills.map((skill, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-500 bg-opacity-20 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default JobDashboard;