import React from 'react';

const SkillBadge = ({ skill, onRemove, className = "" }) => {
  return (
    <div className={`inline-flex items-center bg-blue-600 rounded-full px-3 py-1 ${className}`}>
      <span>{skill}</span>
      {onRemove && (
        <button
          onClick={() => onRemove(skill)}
          className="ml-2 text-white hover:text-red-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default SkillBadge;