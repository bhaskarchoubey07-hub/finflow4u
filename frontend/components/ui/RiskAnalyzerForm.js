"use client";

import React, { useState } from 'react';
import NumericStepper from './NumericStepper';
import { Card, Badge } from './Core';
import Button from './Button';
import { apiRequest } from '../../lib/api';
import { getToken } from '../../lib/auth';

const RiskAnalyzerForm = () => {
    const [form, setForm] = useState({
        age: 35,
        creditHistoryLength: 12,
        numberOfExistingLoans: 1,
        annualIncome: 1500000,
        loanAmount: 200000,
        latePaymentHistory: 0,
        debtToIncome: 0.25
    });

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const res = await apiRequest("/analysis/advanced-risk", {
                method: "POST",
                token,
                body: form
            });
            setResult(res);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <NumericStepper 
                    label="Applicant Age" 
                    value={form.age} 
                    onChange={(v) => setForm({...form, age: v})} 
                    min={18} max={99} 
                />
                <NumericStepper 
                    label="Credit History (Yrs)" 
                    value={form.creditHistoryLength} 
                    onChange={(v) => setForm({...form, creditHistoryLength: v})} 
                />
                <NumericStepper 
                    label="Active Obligations" 
                    value={form.numberOfExistingLoans} 
                    onChange={(v) => setForm({...form, numberOfExistingLoans: v})} 
                />
                <NumericStepper 
                    label="Annual Gross Income" 
                    value={form.annualIncome} 
                    onChange={(v) => setForm({...form, annualIncome: v})} 
                    unit="₹" step={50000}
                />
                <NumericStepper 
                    label="Requested Amount" 
                    value={form.loanAmount} 
                    onChange={(v) => setForm({...form, loanAmount: v})} 
                    unit="₹" step={25000}
                />
                <NumericStepper 
                    label="Payment Deviations" 
                    value={form.latePaymentHistory} 
                    onChange={(v) => setForm({...form, latePaymentHistory: v})} 
                />

                <div className="lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-end">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DTI Simulation</label>
                        <span className="text-sm font-black text-primary tabular-nums">{Math.round(form.debtToIncome * 100)}%</span>
                    </div>
                    <div className="relative pt-1">
                        <input 
                            type="range" 
                            min="0" max="1" step="0.01"
                            value={form.debtToIncome}
                            onChange={(e) => setForm({...form, debtToIncome: parseFloat(e.target.value)})}
                            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                    </div>
                </div>
            </div>

            <Button 
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full h-14 text-base gap-3"
            >
                {loading ? "Initializing Forensic Pulse..." : (
                    <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                        </svg>
                        Execute Risk Simulation
                    </>
                )}
            </Button>

            {result && (
                <Card className="p-10 bg-slate-900 border-slate-800 text-white shadow-2xl shadow-indigo-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8">
                         <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                             result.recommendation === 'APPROVE' 
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' 
                                : 'bg-rose-500/20 text-rose-400 border-rose-500/20'
                         }`}>
                             {result.recommendation}
                         </div>
                    </div>
                    
                    <div className="space-y-10 relative z-10">
                        <div>
                            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Risk Allocation</p>
                            <h3 className="text-4xl font-black italic tracking-tighter">Grade {result.riskGrade}</h3>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 py-8 border-y border-white/10">
                             <StatItem label="Forensic Score" value={result.creditScore} />
                             <StatItem label="Loss Prob" value={`${result.probabilityOfDefault}%`} />
                             <StatItem label="LTV Ratio" value={`${result.metrics.loanToIncome}%`} />
                             <StatItem label="Volatility" value="Low" />
                        </div>

                        <p className="text-sm font-medium text-slate-300 leading-relaxed italic border-l-2 border-indigo-500 pl-6">
                            "{result.decisionReason}"
                        </p>
                    </div>
                </Card>
            )}
        </div>
    );
};

const StatItem = ({ label, value }) => (
    <div className="space-y-1">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-black tabular-nums">{value}</p>
    </div>
);

export default RiskAnalyzerForm;
