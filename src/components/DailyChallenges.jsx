import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { assessSkills } from '../utils/api';

const DailyChallenges = ({ skills }) => {
  const [challenges, setChallenges] = useState([]);
  const [solutions, setSolutions] = useState({});
  const [responses, setResponses] = useState({});

  useEffect(() => {
    const generateChallenges = async () => {
      const challenges = await assessSkills(skills);
      setChallenges(challenges);
    };

    generateChallenges();
  }, [skills]);

  const handleSolutionChange = (index, solution) => {
    setSolutions({ ...solutions, [index]: solution });
  };

  const handleSubmit = async (index) => {
    const solution = solutions[index];
    const response = await assessSkills([solution]); // Assuming assessSkills can validate solutions
    setResponses({ ...responses, [index]: response });
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-6 text-center">Daily Challenges</h2>
      <div className="space-y-6">
        {challenges.map((challenge, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gray-800 p-4 rounded-lg shadow-md"
          >
            <h3 className="font-bold text-lg">{challenge.title}</h3>
            <p className="text-gray-400">{challenge.description}</p>
            <textarea
              value={solutions[index] || ''}
              onChange={(e) => handleSolutionChange(index, e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white mt-3"
              placeholder="Enter your solution here..."
            />
            <button
              onClick={() => handleSubmit(index)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md mt-3"
            >
              Submit
            </button>
            {responses[index] && (
              <div className="mt-3">
                <p className="text-green-400">AI Response: {responses[index]}</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default DailyChallenges;