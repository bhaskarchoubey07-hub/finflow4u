"use client";

import { useEffect, useState } from "react";
import Header from "../../components/Header";
import RiskAnalyzerForm from "../../components/ui/RiskAnalyzerForm";
import ForensicDashboard from "../../components/ui/ForensicDashboard";
import { getUser } from "../../lib/auth";

export default function FinLabPage() {
  const [activeTab, setActiveTab] = useState("risk-analyzer");
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  return (
    <main className="min-h-screen bg-[#fafafa] pb-24">
      <Header />
      <section className="page-shell">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="animate-in slide-in-from-left duration-700">
            <span className="eyebrow !bg-indigo-950 !text-indigo-200">FinLab Infrastructure</span>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mt-2">
              Intelligence Lab
            </h1>
            <p className="text-slate-500 font-medium mt-1">Advanced forensic modeling and high-fidelity risk scanners.</p>
          </div>
          
          <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 animate-in slide-in-from-right duration-700">
              <button 
                onClick={() => setActiveTab("risk-analyzer")}
                className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                  activeTab === "risk-analyzer" 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                Risk Analyzer
              </button>
              <button 
                onClick={() => setActiveTab("forensic")}
                className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                  activeTab === "forensic" 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                Forensic Pulse
              </button>
          </div>
        </div>

        <div className="animate-in fade-in duration-1000">
            {activeTab === "risk-analyzer" ? (
                <div className="space-y-12">
                     <div className="panel p-10 bg-white">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900">Advanced AI Risk Analyzer</h3>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Deep behavioral applicant scanning</p>
                            </div>
                        </div>
                        <RiskAnalyzerForm />
                     </div>
                </div>
            ) : (
                <div className="space-y-12">
                     <div className="panel p-10 bg-white">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-indigo-950 rounded-2xl flex items-center justify-center text-white border border-indigo-800">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900">Financial Trends & Anomalies</h3>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Institutional Ledger Forensics</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                <span className="text-[10px] font-black text-emerald-700 uppercase">Scanner Active</span>
                            </div>
                        </div>
                        <ForensicDashboard />
                     </div>
                </div>
            )}
        </div>
      </section>
    </main>
  );
}
