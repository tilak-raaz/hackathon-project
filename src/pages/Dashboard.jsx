import { useState, useEffect } from "react";
import { auth, db } from "../firebase.config";
import { getDoc, doc } from "firebase/firestore";
import { motion } from "framer-motion";
import axios from "axios";

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [jobsFromAPI, setJobsFromAPI] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;

      try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserData(data);
          await fetchJobsFromAPI(data.skills);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  /**
   * Fetch jobs from the provided API based on the user's skills.
   */
  const fetchJobsFromAPI = async (skills) => {
    if (!skills || skills.length === 0) return;

    const options = {
      method: 'POST',
      url: 'https://jobs-search-api.p.rapidapi.com/getjobs',
      headers: {
        'x-rapidapi-key': '708376d487msha9a3bc6ca8fb8d0p118620jsn4812743ad2b5',
        'x-rapidapi-host': 'jobs-search-api.p.rapidapi.com',
        'Content-Type': 'application/json'
      },
      data: {
        search_term: skills.join(", "), // Use user's skills as the search term
        location: 'remote', // Search remote jobs (can be customized)
        results_wanted: 10,
        site_name: ['indeed', 'linkedin', 'zip_recruiter', 'glassdoor'],
        distance: 50,
        job_type: 'fulltime',
        is_remote: true,
        linkedin_fetch_description: false,
        hours_old: 72
      }
    };

    try {
      const response = await axios.request(options);
      if (response.data.results) {
        setJobsFromAPI(response.data.results);
      }
    } catch (error) {
      console.error("Error fetching jobs from API:", error);
    }
  };

  if (loading) {
    return <div className="text-white text-center mt-10">Loading job recommendations...</div>;
  }

  return (
    <div className="text-white p-6 min-h-screen w-screen bg-[#242424]">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.6 }} 
        className="text-4xl font-bold mb-6 text-center"
      >
        Job Recommendations for You
      </motion.h1>

      {recommendedJobs.length === 0 && jobsFromAPI.length === 0 ? (
        <p className="text-gray-400 text-center">No job recommendations found. Try updating your skills.</p>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {jobsFromAPI.map((job, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ duration: 0.5 }}
              className="bg-gray-800 p-5 rounded-lg shadow-md border border-gray-700"
            >
              <h3 className="text-xl font-bold">{job.jobtitle}</h3>
              <p className="text-gray-400">{job.company}</p>
              <p className="text-gray-500">{job.formattedLocation}</p>
              <a 
                href={job.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="block mt-3 text-blue-400 hover:underline"
              >
                View Job
              </a>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;