"use client";

import React from 'react';

const NumericStepper = ({ 
  label, 
  value, 
  onChange, 
  min = 0, 
  max = 1000000, 
  step = 1,
  unit = ""
}) => {
  const handleDecrement = () => onChange(Math.max(min, value - step));
  const handleIncrement = () => onChange(Math.min(max, value + step));

  return (
    <div className="flex flex-col space-y-2 group">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
        {label}
      </label>
      <div className="flex items-center h-12 bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:ring-4 focus-within:ring-indigo-100 focus-within:border-primary transition-all shadow-sm">
        <button 
          onClick={handleDecrement}
          className="w-12 h-full flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-colors border-r border-slate-100 font-bold text-xl active:bg-slate-100"
        >
          -
        </button>
        <div className="flex-1 flex items-center justify-center gap-1 min-w-[120px]">
          {unit && <span className="text-sm font-bold text-slate-400">{unit}</span>}
          <span className="text-base font-black text-slate-900 tabular-nums">
            {step >= 1000 ? (value / 1000).toLocaleString() + (unit ? 'k' : '') : value.toLocaleString()}
          </span>
        </div>
        <button 
          onClick={handleIncrement}
          className="w-12 h-full flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-colors border-l border-slate-100 font-bold text-xl active:bg-slate-100"
        >
          +
        </button>
      </div>
    </div>
  );
};

export default NumericStepper;
