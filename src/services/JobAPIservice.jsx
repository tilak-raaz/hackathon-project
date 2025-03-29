import axios from 'axios';
import { auth, db, fetchJobsForSkills, saveSearchHistory } from '../firebase.config';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';

class JobAPIService {
  constructor() {
    this.apiKey = '708376d487msha9a3bc6ca8fb8d0p118620jsn4812743ad2b5';
    this.apiHost = 'indeed-indeed.p.rapidapi.com';
  }

  // Get current user skills from Firestore
  async getUserSkills(userId) {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return userSnap.data().skills || [];
      }
      return [];
    } catch (error) {
      console.error("Error fetching user skills:", error);
      return [];
    }
  }

  // Search jobs using Indeed API
  async searchJobs(searchParams) {
    const { keywords, location, radius = 25, limit = 20 } = searchParams;
    
    const options = {
      method: 'GET',
      url: 'https://indeed-indeed.p.rapidapi.com/apisearch',
      params: {
        v: '2',
        format: 'json',
        q: keywords,
        l: location,
        radius: radius.toString(),
        limit: limit.toString()
      },
      headers: {
        'x-rapidapi-key': this.apiKey,
        'x-rapidapi-host': this.apiHost
      }
    };

    try {
      const response = await axios.request(options);
      // Save search history if user is logged in
      const currentUser = auth.currentUser;
      if (currentUser) {
        await saveSearchHistory(currentUser.uid, keywords, {location, radius});
      }
      return response.data.results || [];
    } catch (error) {
      console.error("Error searching jobs:", error);
      throw error;
    }
  }

  // Get job recommendations based on user skills
  async getJobRecommendations() {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("User not authenticated");
      
      const skills = await this.getUserSkills(currentUser.uid);
      if (!skills.length) return [];
      
      // First try to get recommendations from our own database based on skills
      const jobsFromDB = await fetchJobsForSkills(skills);
      
      // If we don't have enough jobs, supplement with API results
      if (jobsFromDB.length < 10) {
        // Join skills with OR for API search
        const skillsKeyword = skills.slice(0, 3).join(" OR ");
        const apiJobs = await this.searchJobs({
          keywords: skillsKeyword,
          location: "remote", // Default to remote jobs for recommendations
          limit: 20 - jobsFromDB.length
        });
        
        // Format API jobs to match our database structure
        const formattedApiJobs = apiJobs.map(job => ({
          id: job.jobkey,
          title: job.jobtitle,
          company: job.company,
          location: job.formattedLocation,
          description: job.snippet,
          url: job.url,
          date: job.date,
          skillsRequired: skills.filter(() => Math.random() > 0.5) // Simulate skill matching
        }));
        
        return [...jobsFromDB, ...formattedApiJobs];
      }
      
      return jobsFromDB;
    } catch (error) {
      console.error("Error getting job recommendations:", error);
      return [];
    }
  }

  // Search for jobs by specific skills
  async searchJobsBySkills(skills, location = "remote") {
    try {
      if (!skills || !skills.length) return [];
      
      // First check internal database
      const internalJobs = await fetchJobsForSkills(skills);
      
      // Then supplement with API results
      const skillsKeyword = skills.slice(0, 3).join(" OR ");
      const apiJobs = await this.searchJobs({
        keywords: skillsKeyword,
        location: location,
        limit: 20
      });
      
      // Format and combine results
      const formattedApiJobs = apiJobs.map(job => ({
        id: job.jobkey,
        title: job.jobtitle,
        company: job.company,
        location: job.formattedLocation,
        description: job.snippet,
        url: job.url,
        date: job.date,
        skillsRequired: skills.filter(() => Math.random() > 0.5) // Simulate skill matching
      }));
      
      // Remove duplicates by ID
      const allJobs = [...internalJobs, ...formattedApiJobs];
      const uniqueJobs = Array.from(new Map(allJobs.map(job => [job.id, job])).values());
      
      return uniqueJobs;
    } catch (error) {
      console.error("Error searching jobs by skills:", error);
      return [];
    }
  }
}

export default new JobAPIService();