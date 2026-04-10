"use client";

import { useEffect, useState } from "react";
import DashboardShell from "../../components/DashboardShell";
import RiskAnalyzerForm from "../../components/ui/RiskAnalyzerForm";
import ForensicDashboard from "../../components/ui/ForensicDashboard";
import { getUser } from "../../lib/auth";

export default function FinLabPage() {
  const [activeTab, setActiveTab] = useState("risk-analyzer");
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const actions = (
    <div className="flex items-center gap-1 bg-white p-1 rounded-2xl shadow-sm border border-slate-200">
        <button 
          onClick={() => setActiveTab("risk-analyzer")}
          className={`px-6 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${
            activeTab === "risk-analyzer" 
              ? "bg-primary text-white shadow-lg shadow-indigo-100" 
              : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          Risk Analyzer
        </button>
        <button 
          onClick={() => setActiveTab("forensic")}
          className={`px-6 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${
            activeTab === "forensic" 
              ? "bg-primary text-white shadow-lg shadow-indigo-100" 
              : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          Forensic Pulse
        </button>
    </div>
  );

  return (
    <DashboardShell
      title="Intelligence Lab"
      description="Advanced forensic modeling and high-fidelity risk scanners."
      actions={actions}
    >
        <div className="space-y-12">
            {activeTab === "risk-analyzer" ? (
                <div className="animate-in fade-in duration-700">
                     <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 leading-none">Risk Underwriting Suite</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 px-1">Deep behavioral applicant scanning</p>
                        </div>
                     </div>
                     <RiskAnalyzerForm />
                </div>
            ) : (
                <div className="animate-in fade-in duration-700">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-200">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 leading-none">Financial Ledger Forensics</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 px-1">Institutional data analysis engine</p>
                        </div>
                     </div>
                     <ForensicDashboard />
                </div>
            )}
        </div>
    </DashboardShell>
  );
}
