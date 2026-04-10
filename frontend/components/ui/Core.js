"use client";

import React from 'react';

export const Card = ({ children, className = '', hover = true }) => (
  <div className={`panel ${hover ? 'hover:shadow-md hover:border-slate-300 transition-all duration-300' : ''} ${className}`}>
    {children}
  </div>
);

export const Badge = ({ children, variant = 'neutral', className = '' }) => {
  const variants = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-100",
    danger: "bg-rose-50 text-rose-700 border-rose-100",
    warning: "bg-amber-50 text-amber-700 border-amber-100",
    info: "bg-sky-50 text-sky-700 border-sky-100",
    neutral: "bg-slate-50 text-slate-700 border-slate-200"
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export const Progress = ({ value, max = 100, className = '' }) => (
  <div className={`w-full bg-slate-100 rounded-full h-2 overflow-hidden ${className}`}>
    <div 
      className="bg-primary h-full transition-all duration-500 ease-out"
      style={{ width: `${(value / max) * 100}%` }}
    />
  </div>
);

export const Input = ({ label, error, className = '', ...props }) => (
  <div className="space-y-1.5 w-full">
    {label && <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>}
    <input 
      className={`w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-primary transition-all placeholder:text-slate-400 ${error ? 'border-rose-300 focus:ring-rose-50' : ''} ${className}`}
      {...props}
    />
    {error && <p className="text-xs font-medium text-rose-500 mt-1">{error}</p>}
  </div>
);
