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
    <div className="panel p-8 flex flex-col items-center gap-6">
      <div className="text-center">
        <span className="eyebrow mb-2">FinFlow AI Rank</span>
        <h3 className="text-xl font-bold text-slate-900 leading-tight">Your Credit Health</h3>
      </div>

      <div className="relative w-56 h-28 mb-4">
        {/* Semi-circle background */}
        <div className="absolute inset-0 border-[20px] border-slate-100 rounded-t-full"></div>
        {/* Progress semi-circle */}
        <div 
          className="absolute inset-x-0 bottom-0 h-full border-[20px] rounded-t-full transition-all duration-1000 ease-out origin-bottom"
          style={{ 
            borderColor: getColor(score),
            clipPath: `inset(0 0 0 0)`, // Show full top half
            transform: `rotate(${(percentage * 1.8) - 90}deg)`,
            filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))'
          }}
        ></div>
        <div className="absolute inset-0 flex flex-col items-center justify-end">
          <span className="text-5xl font-black text-slate-900 tracking-tighter tabular-nums leading-none mb-1">{score}</span>
          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Points</span>
        </div>
      </div>
      
      <div className="w-full space-y-4">
        <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Category</span>
          <span className="text-sm font-black" style={{ color: getColor(score) }}>{getLabel(score)}</span>
        </div>
        
        <p className="text-xs text-slate-400 font-medium leading-relaxed indent-1 text-center italic">
          "Your AI rank is in the top {Math.max(100 - Math.round(percentage), 3)}% of users with similar profiles."
        </p>
      </div>
      
      <div className="flex justify-between w-full text-[9px] font-black text-slate-300 uppercase px-1">
        <span>300</span>
        <span>850</span>
      </div>
    </div>

  );
};

export default CreditScoreMeter;
