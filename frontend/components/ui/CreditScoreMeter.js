import React from 'react';

const CreditScoreMeter = ({ score }) => {
  const min = 300;
  const max = 850;
  const range = max - min;
  const percentage = Math.min(Math.max(((score - min) / range) * 100, 0), 100);

  const getColor = (s) => {
    if (s < 580) return "#ef4444"; // Poor
    if (s < 670) return "#f97316"; // Fair
    if (s < 740) return "#eab308"; // Good
    if (s < 800) return "#84cc16"; // Very Good
    return "#22c55e"; // Excellent
  };

  const getLabel = (s) => {
    if (s < 580) return "Poor";
    if (s < 670) return "Fair";
    if (s < 740) return "Good";
    if (s < 800) return "Very Good";
    return "Excellent";
  };

  return (
    <div className="flex flex-col items-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm w-full">
      <div className="relative w-48 h-24 mb-4">
        {/* Semi-circle background */}
        <div className="absolute inset-0 border-[16px] border-gray-100 rounded-t-full"></div>
        {/* Progress semi-circle */}
        <div 
          className="absolute inset-x-0 bottom-0 h-full border-[16px] rounded-t-full transition-all duration-1000 ease-out origin-bottom"
          style={{ 
            borderColor: getColor(score),
            clipPath: `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)`, // Simplified for now
            transform: `rotate(${(percentage * 1.8) - 90}deg)`,
            opacity: 0.8
          }}
        ></div>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <span className="text-4xl font-black text-gray-900 leading-none">{score}</span>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Score</span>
        </div>
      </div>
      
      <div className="text-center">
        <p className="text-sm font-bold uppercase tracking-wide" style={{ color: getColor(score) }}>
          {getLabel(score)}
        </p>
        <p className="text-xs text-gray-500 mt-1 italic">
          Your score is calculated based on AI risk modeling.
        </p>
      </div>
      
      <div className="flex justify-between w-full mt-6 text-[10px] font-bold text-gray-400 px-2">
        <span>300</span>
        <span>580</span>
        <span>670</span>
        <span>740</span>
        <span>800</span>
        <span>850</span>
      </div>
    </div>
  );
};

export default CreditScoreMeter;
