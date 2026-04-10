"use client";

import { useEffect, useState } from "react";
import Header from "../../components/Header";
import StatCard from "../../components/StatCard";
import ROIChart from "../../components/ui/ROIChart";
import RiskDistributionChart from "../../components/ui/RiskDistributionChart";
import RiskBadge from "../../components/ui/RiskBadge";
import ChatAdvisor from "../../components/ui/ChatAdvisor";
import StripeTopUpPanel from "../../components/StripeTopUpPanel";
import { apiRequest } from "../../lib/api";
import { getToken, getUser } from "../../lib/auth";

export default function LenderDashboard() {
  const [portfolio, setPortfolio] = useState(null);
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");

  async function loadPortfolio() {
    try {
      const token = getToken();
      const data = await apiRequest("/portfolio", { token });
      setPortfolio(data);
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    setUser(getUser());
    loadPortfolio();
  }, []);

  return (
    <main className="min-h-screen bg-[#fafafa] pb-24">
      <Header />
      <section className="page-shell">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="animate-in slide-in-from-left duration-700">
            <span className="eyebrow">Institutional Dashboard</span>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mt-2">
              {user ? `Portfolio: ${user.name}` : "Investment Dashboard"}
            </h1>
            <p className="text-slate-500 font-medium mt-1">Capital deployment and automated yield distribution.</p>
          </div>
          <div className="flex items-center gap-3 animate-in slide-in-from-right duration-700">
             <div className="bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-emerald-100 flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                <span className="text-sm font-black text-emerald-900 uppercase tracking-tighter">Lender Active</span>
             </div>
          </div>
        </div>

        {message && (
          <div className="info-banner animate-in fade-in slide-in-from-top-4 duration-500">
            <svg className="w-5 h-5 mr-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-bold">{message}</span>
          </div>
        )}

        {portfolio ? (
          <div className="space-y-12">
            <div className="stats-grid">
              <StatCard
                label="Total Capital"
                value={portfolio.summary.totalInvested.toLocaleString()}
                symbol="₹"
              />
              <StatCard
                label="Net Accrual"
                value={portfolio.summary.expectedReturns.toFixed(2)}
                symbol="₹"
                trend={`+${((portfolio.summary.expectedReturns / portfolio.summary.totalInvested) * 100).toFixed(1)}% Yield`}
              />
              <StatCard
                label="Yield Collected"
                value={portfolio.summary.repaymentsReceived.toFixed(2)}
                symbol="₹"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
               <div className="panel p-6 bg-white"><ROIChart /></div>
               <div className="panel p-6 bg-white"><RiskDistributionChart investments={portfolio.investments} /></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-10">
                <div className="panel p-0 overflow-hidden bg-white">
                   <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/10">
                      <div>
                        <h3 className="text-xl font-extrabold text-slate-900">Active Commitments</h3>
                        <p className="text-sm text-slate-500 font-medium">Monitoring deployed assets across the market.</p>
                      </div>
                      <a href="/marketplace" className="primary-button !py-2 !px-4 !text-xs">Expand Portfolio</a>
                   </div>
                   <div className="divide-y divide-slate-50">
                     {portfolio.investments.length === 0 ? (
                       <div className="p-20 text-center bg-slate-50/20">
                          <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No Assets Deployed</p>
                       </div>
                     ) : (
                       portfolio.investments.map((investment) => (
                         <div key={investment.id} className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row justify-between items-center group">
                            <div className="flex items-center gap-6">
                               <div className="flex flex-col">
                                  <div className="flex items-center gap-3">
                                     <span className="text-xl font-black text-slate-900 tabular-nums">₹{investment.amountInvested.toLocaleString()}</span>
                                     <RiskBadge grade={investment.loan.riskGrade} />
                                  </div>
                                  <p className="text-xs text-slate-400 font-bold mt-1">
                                     Client: {investment.loan.borrower.name} • {investment.loan.interestRate}% Yield • {investment.loan.status}
                                  </p>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Accrual View</p>
                               <p className="text-sm font-black text-emerald-600 transition-transform group-hover:scale-105">
                                 +₹{((investment.amountInvested * investment.loan.interestRate) / 100).toFixed(2)}
                               </p>
                            </div>
                         </div>
                       ))
                     )}
                   </div>
                </div>

                {portfolio.payments?.length > 0 && (
                  <div className="panel p-0 overflow-hidden bg-white">
                    <div className="p-8 border-b border-slate-50 bg-slate-50/10">
                      <h3 className="text-xl font-extrabold text-slate-900">Transaction History</h3>
                      <p className="text-sm text-slate-500 font-medium mt-1">Audit log for all ledger movements.</p>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {portfolio.payments.map((pyment) => (
                        <div key={pyment.id} className="p-5 flex justify-between items-center hover:bg-slate-50/30 transition-colors">
                           <div className="flex items-center gap-4">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                pyment.status === 'SUCCEEDED' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                              }`}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={pyment.amount > 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
                                </svg>
                              </div>
                              <div>
                                 <p className="text-sm font-black text-slate-800 uppercase tracking-tighter">{pyment.purpose.replaceAll("_", " ")}</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{pyment.status} • {pyment.provider}</p>
                              </div>
                           </div>
                           <p className={`text-sm font-black tabular-nums ${pyment.status === 'SUCCEEDED' ? 'text-emerald-600' : 'text-slate-400'}`}>
                             ₹{pyment.amount.toLocaleString()}
                           </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-10">
                {portfolio.wallet && (
                  <div className="panel p-8 bg-indigo-950 text-white border-indigo-900/50 shadow-indigo-200/50">
                     <div className="flex items-center justify-between mb-8">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Vault Balance</span>
                          <h3 className="text-xl font-black mt-1">Capital Reserves</h3>
                        </div>
                        <span className="text-[10px] font-black text-indigo-400 uppercase border border-indigo-800 px-3 py-1 rounded-full bg-indigo-900/50">Secure</span>
                     </div>
                     
                     <div className="space-y-6 mb-10">
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
                           <p className="text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-1">Available Liquidity</p>
                           <p className="text-4xl font-black tabular-nums">₹{Number(portfolio.wallet.balance).toLocaleString()}</p>
                        </div>
                        <div className="space-y-3 px-1">
                          {portfolio.wallet.accounts.map((acc) => (
                            <div key={acc.type} className="flex justify-between items-center opacity-80 group cursor-default">
                               <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wide group-hover:text-white transition-colors">{acc.type.replaceAll("_", " ")}</span>
                               <span className="text-sm font-black tabular-nums text-white">₹{Number(acc.balance).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                     </div>

                     <StripeTopUpPanel
                        onMessage={setMessage}
                        onSuccess={loadPortfolio}
                      />
                  </div>
                )}

                <div 
                  className="panel p-8 bg-indigo-600 text-white overflow-hidden relative group cursor-pointer" 
                  onClick={() => window.location.href='/lab'}
                >
                  <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-500"></div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 border border-white/20">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-black mb-2">Forensic Intelligence</h3>
                    <p className="text-indigo-100 text-xs leading-relaxed mb-6 font-medium">
                      Analyze batch financial data for manipulation patterns and capital anomalies.
                    </p>
                    <button className="w-full py-3 bg-white text-indigo-600 font-black rounded-xl hover:shadow-xl transition-all">
                      Launch Scanner
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40">
             <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
             <p className="text-xs font-black text-slate-400 uppercase tracking-[0.25em]">Initialising Institutional Access...</p>
          </div>
        )}
      </section>
      <ChatAdvisor />
    </main>
  );
}


