import React from 'react';

const GitHubGrid = ({ solvedCount }) => {
  const getGrid = () => {
    const grid = [];
    for (let i = 0; i < 30; i++) {
      grid.push(
        <div key={i} className={`w-6 h-6 ${i < solvedCount ? 'bg-green-500' : 'bg-gray-700'} border border-gray-600`} />
      );
    }
    return grid;
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-6 text-center">Daily Problem Solving Activity</h2>
      <div className="grid grid-cols-10 gap-2 justify-center">
        {getGrid()}
      </div>
    </div>
  );
};

export default GitHubGrid;