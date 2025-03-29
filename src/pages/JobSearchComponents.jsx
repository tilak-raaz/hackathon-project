import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { auth, db, saveSearchHistory } from "../firebase.config";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";

const JobSearchComponent = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [radius, setRadius] = useState("25");
  const [isLoading, setIsLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState("");
  const [userSkills, setUserSkills] = useState([]);
  const [filters, setFilters] = useState({ remote: false, fullTime: false, entryLevel: false });

  useEffect(() => {
    const fetchUserSkills = async () => {
      if (auth.currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
          if (userDoc.exists() && userDoc.data().skills) {
            setUserSkills(userDoc.data().skills);
            // Auto-fill search with top skill if available
            if (userDoc.data().skills.length > 0 && !searchQuery) {
              setSearchQuery(userDoc.data().skills[0]);
            }
          }
        } catch (error) {
          console.error("Error fetching user skills:", error);
        }
      }
    };

    fetchUserSkills();
  }, [auth.currentUser, searchQuery]);

  const searchJobs = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Save search to history
    if (auth.currentUser) {
      await saveSearchHistory(auth.currentUser.uid, searchQuery, {
        location,
        radius,
        ...filters
      });
    }

    // API call configuration
    const options = {
      method: 'GET',
      url: 'https://indeed-indeed.p.rapidapi.com/apisearch',
      params: {
        v: '2',
        format: 'json',
        q: searchQuery,
        l: location || "anywhere",
        radius: radius,
        jt: filters.fullTime ? "fulltime" : "",
        rbc: filters.entryLevel ? "entry_level" : "",
        explvl: filters.entryLevel ? "entry_level" : "",
        remotejob: filters.remote ? "1" : "0"
      },
      headers: {
        'x-rapidapi-key': '708376d487msha9a3bc6ca8fb8d0p118620jsn4812743ad2b5',
        'x-rapidapi-host': 'indeed-indeed.p.rapidapi.com'
      }
    };

    try {
      const response = await axios.request(options);
      if (response.data && response.data.results) {
        setJobs(response.data.results);
      } else {
        setJobs([]);
        setError("No jobs found. Try adjusting your search parameters.");
      }
    } catch (error) {
      console.error("API Error:", error);
      setError("Failed to search jobs. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter toggles
  const toggleFilter = (filter) => {
    setFilters(prev => ({
      ...prev,
      [filter]: !prev[filter]
    }));
  };

  return (
    <div className="min-h-screen bg-[#242424] text-white p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-5xl mx-auto"
      >
        <h1 className="text-3xl font-bold mb-8 text-center">Find Your Perfect Job</h1>
        
        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8 relative overflow-hidden
            before:w-24 before:h-24 before:absolute before:bg-purple-600 before:rounded-full before:-z-10 before:blur-2xl before:-top-12 before:-left-12
            after:w-32 after:h-32 after:absolute after:bg-sky-400 after:rounded-full after:-z-10 after:blur-xl after:-bottom-16 after:-right-16"
        >
          <form onSubmit={searchJobs} className="relative z-10">
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-300 mb-1">
                  Skills / Job Title
                </label>
                <input
                  id="searchQuery"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white"
                  placeholder="e.g. React, Web Developer"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-1">
                  Location
                </label>
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white"
                  placeholder="City, State or Remote"
                />
              </div>
              
              <div>
                <label htmlFor="radius" className="block text-sm font-medium text-gray-300 mb-1">
                  Radius (miles)
                </label>
                <select
                  id="radius"
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white"
                >
                  <option value="5">5 miles</option>
                  <option value="10">10 miles</option>
                  <option value="25">25 miles</option>
                  <option value="50">50 miles</option>
                  <option value="100">100 miles</option>
                </select>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 mb-4">
              <button
                type="button"
                onClick={() => toggleFilter('remote')}
                className={`px-3 py-1 rounded-full text-sm ${
                  filters.remote 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                Remote
              </button>
              
              <button
                type="button"
                onClick={() => toggleFilter('fullTime')}
                className={`px-3 py-1 rounded-full text-sm ${
                  filters.fullTime 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                Full Time
              </button>
              
              <button
                type="button"
                onClick={() => toggleFilter('entryLevel')}
                className={`px-3 py-1 rounded-full text-sm ${
                  filters.entryLevel 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                Entry Level
              </button>
            </div>
            
            {/* Your Skills */}
            {userSkills.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-300 mb-2">Your Skills:</h3>
                <div className="flex flex-wrap gap-2">
                  {userSkills.map((skill, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSearchQuery(skill)}
                      className="px-3 py-1 bg-blue-500 bg-opacity-20 border border-blue-500 rounded-full text-xs text-blue-300 hover:bg-opacity-30"
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-center mt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-600 via-purple-400 to-blue-500 text-white px-6 py-2 rounded-md font-bold hover:opacity-90 transition duration-300"
              >
                {isLoading ? 'Searching...' : 'Search Jobs'}
              </button>
            </div>
          </form>
        </motion.div>
        
        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500 bg-opacity-20 border border-red-500 text-red-100 px-4 py-3 rounded-md mb-6"
          >
            {error}
          </motion.div>
        )}
        
        {/* Results */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {isLoading ? (
            <div className="flex justify-center my-12">
              <div className="w-12 h-12 border-4 border-t-purple-600 border-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {jobs.length > 0 && (
                <h2 className="text-xl font-bold mb-4">Found {jobs.length} jobs</h2>
              )}
              
              <div className="grid gap-6">
                {jobs.map((job, index) => (
                  <motion.div
                    key={job.jobkey || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 hover:border-purple-500 transition-all duration-300"
                  >
                    <h3 className="text-xl font-bold mb-2 text-purple-300">{job.jobtitle}</h3>
                    <p className="text-gray-300 font-semibold mb-1">{job.company}</p>
                    <p className="text-gray-400 mb-3">{job.formattedLocation || job.formattedLocationFull}</p>
                    
                    <div className="mb-4" dangerouslySetInnerHTML={{ __html: job.snippet }}></div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.formattedRelativeTime && (
                        <span className="px-2 py-1 bg-gray-700 rounded-full text-xs">
                          {job.formattedRelativeTime}
                        </span>
                      )}
                      {job.jobtype && (
                        <span className="px-2 py-1 bg-blue-900 rounded-full text-xs">
                          {job.jobtype}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex justify-end">
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-gradient-to-r from-purple-600 to-blue-500 text-white px-4 py-2 rounded-md font-medium hover:opacity-90 transition duration-300"
                      >
                        Apply Now
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default JobSearchComponent;