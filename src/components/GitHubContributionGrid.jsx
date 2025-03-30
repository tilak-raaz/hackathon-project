import React, { useState } from 'react';

const GitHubContributionGrid = ({ solvedChallenges }) => {
  const generateRandomData = () => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    let gridData = [];
    
    months.forEach(month => {
      let monthData = [];
      for (let i = 0; i < 30; i++) {
        const count = i < solvedChallenges ? 1 : 0; // Initially black, turns green as challenges are solved
        const date = new Date(2025, months.indexOf(month), i + 1);
        monthData.push({
          date: date.toDateString(),
          count: count
        });
      }
      gridData.push({
        month: month,
        days: monthData
      });
    });
    
    return gridData;
  };

  const [data] = useState(generateRandomData());
  
  const getSquareColor = (count) => {
    if (count === 0) return 'bg-black';
    if (count === 1) return 'bg-green-100';
    return 'bg-green-700';
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md max-w-sm mx-auto">
      <h2 className="text-xl font-bold mb-4">Contribution Activity</h2>
      
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm text-gray-600">Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 bg-black border border-gray-200"></div>
          <div className="w-3 h-3 bg-green-100 border border-gray-200"></div>
          <div className="w-3 h-3 bg-green-700 border border-gray-200"></div>
        </div>
        <span className="text-sm text-gray-600">More</span>
      </div>
      
      <div className="grid grid-cols-12 gap-1">
        {data.map((month, monthIndex) => (
          <div key={monthIndex} className="flex flex-col">
            <div className="text-xs text-gray-500 h-6 flex items-center justify-center">
              {month.month}
            </div>
            <div className="grid grid-cols-1 gap-1">
              {month.days.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className={`w-3 h-3 ${getSquareColor(day.count)} border border-gray-200 rounded-sm`}
                  title={`${day.date}: ${day.count} contributions`}
                ></div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Learn how we count contributions</p>
      </div>
    </div>
  );
};

export default GitHubContributionGrid;