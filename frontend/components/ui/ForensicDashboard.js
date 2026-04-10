"use client";

import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiRequest } from '../../lib/api';
import { getToken } from '../../lib/auth';

const ForensicDashboard = () => {
    const [file, setFile] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [report, setReport] = useState(null);

    const handleUpload = async () => {
        if (!file) return;
        setAnalyzing(true);
        // Simulate processing delay
        setTimeout(async () => {
            try {
               const token = getToken();
               const res = await apiRequest("/analysis/forensics", {
                   method: "POST",
                   token,
                   body: { data: [{ type: 'dummy' }] }
               });
               setReport(res);
            } catch (error) {
               console.error(error);
            } finally {
               setAnalyzing(false);
            }
        }, 1500);
    };

    return (
        <div className="space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                <div className="lg:col-span-1 space-y-6">
                    <div className="panel p-6 bg-white border-dashed border-2 border-slate-200 hover:border-indigo-400 transition-all group flex flex-col items-center justify-center text-center cursor-pointer">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-indigo-50 transition-colors">
                            <svg className="w-6 h-6 text-slate-400 group-hover:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <h4 className="text-sm font-black text-slate-900">Upload Ledger Data</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Excel, CSV, or XLSX</p>
                        <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} id="forensic-upload" />
                        <label htmlFor="forensic-upload" className="mt-4 text-[10px] font-black bg-indigo-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors">
                            {file ? file.name : "Select File"}
                        </label>
                    </div>

                    <button 
                        onClick={handleUpload}
                        disabled={!file || analyzing}
                        className="w-full primary-button !py-4"
                    >
                        {analyzing ? "Running Forensic Pulse..." : "Launch Pulse Scanner"}
                    </button>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Required Schema</p>
                        <ul className="space-y-2">
                             {['Revenue', 'Expenses', 'Profit', 'Assets', 'Liabilities', 'Equity'].map(col => (
                                 <li key={col} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                     <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                                     {col}
                                 </li>
                             ))}
                        </ul>
                    </div>
                </div>

                <div className="lg:col-span-3 space-y-10">
                    {report ? (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <MetricCard label="Anomaly Points" value={`${report.metrics.anomalyPoints} pts`} color="rose" />
                                <MetricCard label="Ratio Anomalies" value={`${report.metrics.ratioAnomalies} pts`} color="amber" />
                                <MetricCard label="Pattern Match" value={`${report.metrics.manipulationPatterns} pts`} color="indigo" />
                                <MetricCard label="Deviant Periods" value={report.metrics.anomalyPeriods} color="slate" />
                            </div>

                            <div className="panel p-8 bg-white overflow-hidden">
                                <h3 className="text-xl font-extrabold text-slate-900 mb-8">Financial Pulse Analysis</h3>
                                <div className="h-80 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={report.trends}>
                                            <defs>
                                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                                            <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: 'var(--shadow-lg)'}} />
                                            <Area type="monotone" dataKey="revenue" stroke="#4f46e5" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                                            <Area type="monotone" dataKey="profit" stroke="#10b981" fillOpacity={0} strokeWidth={2} strokeDasharray="5 5" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex gap-6 mt-6 pt-6 border-t border-slate-50">
                                     <div className="flex items-center gap-2">
                                         <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>
                                         <span className="text-[10px] font-black text-slate-500 uppercase">Gross Revenue</span>
                                     </div>
                                     <div className="flex items-center gap-2">
                                         <div className="w-3 h-3 border-2 border-emerald-500 rounded-full"></div>
                                         <span className="text-[10px] font-black text-slate-500 uppercase">Net Profit Margin</span>
                                     </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="panel p-32 flex flex-col items-center justify-center text-center bg-slate-50/50 border-dashed border-2 border-slate-200">
                             <div className="w-16 h-16 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center mb-6">
                                 <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                 </svg>
                             </div>
                             <h3 className="text-xl font-black text-slate-900">Awaiting Pulse Scan</h3>
                             <p className="text-sm text-slate-400 font-medium max-w-sm mt-2">
                                Upload and execute a ledger Pulse scan to identify manipulation patterns and capital anomalies.
                             </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ label, value, color }) => {
    const colorMap = {
        rose: 'text-rose-600 bg-rose-50 border-rose-100',
        amber: 'text-amber-600 bg-amber-50 border-amber-100',
        indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
        slate: 'text-slate-600 bg-slate-50 border-slate-100'
    };
    
    return (
        <div className="panel p-6 bg-white group hover:scale-[1.02] transition-all">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
            <p className={`text-2xl font-black mt-1 ${colorMap[color] || colorMap.slate} px-3 py-1 rounded-xl border w-fit`}>
                {value}
            </p>
        </div>
    );
};

export default ForensicDashboard;
