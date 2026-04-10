"use client";

import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiRequest } from '../../lib/api';
import { getToken } from '../../lib/auth';
import { Card, Badge } from './Core';
import Button from './Button';

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
                    <div className="panel p-6 bg-white border-dashed border-2 border-slate-200 hover:border-indigo-400 transition-all group flex flex-col items-center justify-center text-center cursor-pointer min-h-[160px]">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-indigo-50 transition-colors">
                            <svg className="w-6 h-6 text-slate-400 group-hover:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <h4 className="text-sm font-black text-slate-900 leading-none">Global Data Drop</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 px-4 leading-tight">Excel, CSV, or Ledger XML</p>
                        <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} id="forensic-upload" />
                        <label htmlFor="forensic-upload" className="mt-4 text-[10px] font-black bg-indigo-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors">
                            {file ? file.name : "Choose File"}
                        </label>
                    </div>

                    <Button 
                        onClick={handleUpload}
                        disabled={!file || analyzing}
                        className="w-full !py-4"
                    >
                        {analyzing ? "Running Pulse Scan..." : "Execute Forensic Scan"}
                    </Button>

                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Ingestion Schema</p>
                        <ul className="space-y-3">
                             {['Capital Flow', 'Operational Margin', 'Net Accruals', 'Asset Velocity'].map(col => (
                                 <li key={col} className="flex items-center gap-3 text-xs font-bold text-slate-600">
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
                                <MetricCard label="Anomalies" value={report.metrics.anomalyPoints} variant="danger" />
                                <MetricCard label="Ratios" value={report.metrics.ratioAnomalies} variant="warning" />
                                <MetricCard label="Signals" value={report.metrics.manipulationPatterns} variant="info" />
                                <MetricCard label="Periods" value={report.metrics.anomalyPeriods} variant="neutral" />
                            </div>

                            <Card className="p-8 bg-white overflow-hidden">
                                <div className="flex justify-between items-center mb-10">
                                     <div>
                                        <h3 className="text-lg font-bold text-slate-900">Financial Pulse Analysis</h3>
                                        <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-widest">Time-series manipulation scan</p>
                                     </div>
                                </div>
                                <div className="h-80 w-full lg:-ml-6">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={report.trends}>
                                            <defs>
                                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                                                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                                            <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'}} />
                                            <Area type="monotone" dataKey="revenue" stroke="#4F46E5" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                                            <Area type="monotone" dataKey="profit" stroke="#10B981" fillOpacity={0} strokeWidth={2} strokeDasharray="5 5" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex gap-6 mt-6 pt-6 border-t border-slate-50">
                                     <div className="flex items-center gap-2">
                                         <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Rev</span>
                                     </div>
                                     <div className="flex items-center gap-2">
                                         <div className="w-2 h-2 border-2 border-emerald-500 rounded-full"></div>
                                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Net Accrual</span>
                                     </div>
                                </div>
                            </Card>
                        </>
                    ) : (
                        <div className="panel p-32 flex flex-col items-center justify-center text-center bg-slate-50/30 border-dashed border-2 border-slate-200">
                             <div className="w-16 h-16 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center mb-6">
                                 <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.691.34a2 2 0 01-1.783 0l-.691-.34a6 6 0 00-3.86-.517l-2.387.477a2 2 0 00-1.022.547V18a2 2 0 002 2h11a2 2 0 002-2v-2.572z" />
                                 </svg>
                             </div>
                             <h3 className="text-xl font-bold text-slate-900 leading-none">Pulse Scanner Idle</h3>
                             <p className="text-sm text-slate-400 font-medium max-w-sm mt-3">
                                Upload an institutional dataset to execute the deep ledger forensic scan and identify capital anomalies.
                             </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ label, value, variant }) => {
    return (
        <Card className="p-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <div className="flex items-center gap-2">
                <p className="text-2xl font-black text-slate-900 tabular-nums">{value}</p>
                <Badge variant={variant} className="scale-75 origin-left">Audit</Badge>
            </div>
        </Card>
    );
};

export default ForensicDashboard;
