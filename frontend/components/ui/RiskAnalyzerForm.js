"use client";

import React, { useState } from 'react';
import NumericStepper from './NumericStepper';
import { apiRequest } from '../../lib/api';
import { getToken } from '../../lib/auth';

const RiskAnalyzerForm = () => {
    const [form, setForm] = useState({
        age: 35,
        creditHistoryLength: 8,
        numberOfExistingLoans: 2,
        annualIncome: 65000,
        loanAmount: 25000,
        latePaymentHistory: 1,
        debtToIncome: 0.35
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                <NumericStepper 
                    label="Age" 
                    value={form.age} 
                    onChange={(v) => setForm({...form, age: v})} 
                    min={18} max={100} 
                />
                <NumericStepper 
                    label="Credit History (Years)" 
                    value={form.creditHistoryLength} 
                    onChange={(v) => setForm({...form, creditHistoryLength: v})} 
                />
                <NumericStepper 
                    label="Existing Loans" 
                    value={form.numberOfExistingLoans} 
                    onChange={(v) => setForm({...form, numberOfExistingLoans: v})} 
                />
                <NumericStepper 
                    label="Annual Income" 
                    value={form.annualIncome} 
                    onChange={(v) => setForm({...form, annualIncome: v})} 
                    unit="₹" step={1000}
                />
                <NumericStepper 
                    label="Loan Amount" 
                    value={form.loanAmount} 
                    onChange={(v) => setForm({...form, loanAmount: v})} 
                    unit="₹" step={1000}
                />
                <NumericStepper 
                    label="Late Payments (Count)" 
                    value={form.latePaymentHistory} 
                    onChange={(v) => setForm({...form, latePaymentHistory: v})} 
                />

                <div className="lg:col-span-2 space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Debt-to-Income Ratio</label>
                        <span className="text-sm font-black text-indigo-600">{Math.round(form.debtToIncome * 100)}%</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" max="1" step="0.01"
                        value={form.debtToIncome}
                        onChange={(e) => setForm({...form, debtToIncome: parseFloat(e.target.value)})}
                        className="w-full accent-indigo-600 cursor-pointer"
                    />
                </div>
            </div>

            <button 
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full primary-button !py-4 flex items-center justify-center gap-3 text-lg"
            >
                {loading ? "Processing Deep Scanner..." : (
                    <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Run AI Intelligence Scanner
                    </>
                )}
            </button>

            {result && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 panel p-8 bg-indigo-950 text-white border-indigo-900 shadow-xl">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                        <div>
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Risk Verdict</span>
                            <h3 className="text-3xl font-black mt-1">Grade {result.riskGrade} Analysis</h3>
                        </div>
                        <div className={`px-6 py-2 rounded-xl text-sm font-black uppercase tracking-widest border-2 ${
                            result.recommendation === 'APPROVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                            {result.recommendation.replaceAll("_", " ")}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                         <div className="p-5 rounded-2xl bg-white/5 border border-white/5">
                            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Score</p>
                            <p className="text-3xl font-black">{result.creditScore}</p>
                         </div>
                         <div className="p-5 rounded-2xl bg-white/5 border border-white/5">
                            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Default Prob</p>
                            <p className="text-3xl font-black">{result.probabilityOfDefault}%</p>
                         </div>
                         <div className="md:col-span-2 p-5 rounded-2xl bg-white/5 border border-white/5">
                            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Core Metrics</p>
                            <div className="flex gap-4 mt-1">
                                <span className="text-xs font-bold text-indigo-100">DTI: {result.metrics.debtToIncome}%</span>
                                <span className="text-xs font-bold text-indigo-100">LTI: {result.metrics.loanToIncome}%</span>
                            </div>
                         </div>
                    </div>

                    <div className="mt-8 p-6 rounded-2xl bg-white/5 border border-indigo-800 italic text-sm text-indigo-100 leading-relaxed">
                        "{result.decisionReason}"
                    </div>
                </div>
            )}
        </div>
    );
};

export default RiskAnalyzerForm;
