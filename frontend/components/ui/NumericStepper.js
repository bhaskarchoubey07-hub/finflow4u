"use client";

import React from 'react';

const NumericStepper = ({ label, value, onChange, min = 0, max = 10000000, step = 1, unit = "" }) => {
  const handleDecrement = () => {
    if (value > min) onChange(Math.max(min, value - step));
  };

  const handleIncrement = () => {
    if (value < max) onChange(Math.min(max, value + step));
  };

  return (
    <div className="space-y-3">
      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">{label}</label>
      <div className="flex items-center bg-slate-100 rounded-2xl p-1 border border-slate-200 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100 transition-all">
        <button 
          onClick={handleDecrement}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-sm border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 active:scale-90 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4" />
          </svg>
        </button>
        
        <div className="flex-grow px-4 flex items-center justify-center">
          <span className="text-xl font-black text-slate-800 tabular-nums">
            {unit}{value.toLocaleString()}
          </span>
        </div>

        <button 
          onClick={handleIncrement}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-sm border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 active:scale-90 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default NumericStepper;
