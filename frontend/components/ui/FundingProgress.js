import React from 'react';

const FundingProgress = ({ funded, total }) => {
  const percentage = Math.min(Math.round((funded / total) * 100), 100);
  
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600 font-medium">{percentage}% Funded</span>
        <span className="text-gray-400">${funded.toLocaleString()} / ${total.toLocaleString()}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default FundingProgress;
