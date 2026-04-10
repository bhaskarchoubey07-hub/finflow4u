"use client";

import { useEffect, useState } from "react";
import DashboardShell from "../../components/DashboardShell";
import { Card, Badge, Progress } from "../../components/ui/Core";
import Button from "../../components/ui/Button";
import ROIChart from "../../components/ui/ROIChart";
import RiskDistributionChart from "../../components/ui/RiskDistributionChart";
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
    <DashboardShell
      title={`Portfolio: ${user?.name || 'Investor'}`}
      description="Monitor your automated yield distribution and asset allocation."
      actions={
        <div className="flex items-center gap-3">
             <div className="bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-emerald-100 flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-black text-emerald-900 uppercase">Vault Active</span>
             </div>
        </div>
      }
    >
      {portfolio ? (
        <div className="space-y-10">
          {/* Top Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-8">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Deployed</p>
                <p className="text-3xl font-black text-slate-900">₹{portfolio.summary.totalInvested.toLocaleString()}</p>
            </Card>
            <Card className="p-8 border-l-4 border-l-primary">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Net Accrual</p>
                <p className="text-3xl font-black text-primary">₹{portfolio.summary.expectedReturns.toFixed(0)}</p>
                <Badge variant="success" className="mt-2 text-[10px]">
                    +{((portfolio.summary.expectedReturns / portfolio.summary.totalInvested) * 100).toFixed(1)}% Yield
                </Badge>
            </Card>
            <Card className="p-8">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Yield Collected</p>
                <p className="text-3xl font-black text-slate-900">₹{portfolio.summary.repaymentsReceived.toFixed(0)}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <ROIChart />
             <RiskDistributionChart investments={portfolio.investments} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
             <div className="lg:col-span-2 space-y-8">
                <Card className="p-0 overflow-hidden">
                   <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/10">
                       <h3 className="text-lg font-bold text-slate-900">Active Commitments</h3>
                       <Link href="/marketplace">
                          <Button size="sm" variant="ghost">Expand Portfolio</Button>
                       </Link>
                   </div>
                   <div className="divide-y divide-slate-100">
                      {portfolio.investments.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 font-medium">No assets deployed. Browse the marketplace.</div>
                      ) : (
                        portfolio.investments.map((inv) => (
                          <div key={inv.id} className="p-6 flex justify-between items-center group hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-xs text-slate-500">{inv.loan.riskGrade}</div>
                                <div>
                                    <p className="text-sm font-black text-slate-900">₹{inv.amountInvested.toLocaleString()}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                                        {inv.loan.borrower.name} • {inv.loan.interestRate}% Yield
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-black text-emerald-600">
                                  +₹{((inv.amountInvested * inv.loan.interestRate) / 100).toFixed(0)}
                                </span>
                            </div>
                          </div>
                        ))
                      )}
                   </div>
                </Card>
             </div>

             <div className="space-y-8">
                <Card className="p-8 bg-slate-900 text-white border-slate-800">
                   <div className="flex items-center justify-between mb-8">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Vault Balance</p>
                        <h3 className="text-xl font-black mt-1">Capital Reserves</h3>
                      </div>
                      <Badge variant="info" className="bg-indigo-500/20 text-indigo-300 border-0">Secure</Badge>
                   </div>
                   
                   <div className="space-y-6">
                      <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                         <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Available Liquidity</p>
                         <p className="text-4xl font-black tabular-nums">₹{Number(portfolio.wallet?.balance || 0).toLocaleString()}</p>
                      </div>
                      
                      <StripeTopUpPanel
                         onMessage={setMessage}
                         onSuccess={loadPortfolio}
                       />
                   </div>
                </Card>

                <Card 
                  className="p-8 bg-secondary text-white relative group cursor-pointer" 
                  onClick={() => window.location.href='/lab'}
                >
                  <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-500"></div>
                  <div className="relative z-10 space-y-4">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-black">AI</div>
                    <h3 className="text-xl font-black">Forensic Scanner</h3>
                    <p className="text-xs font-medium text-sky-50 leading-relaxed">Analyze high-fidelity financial data to detect manipulation and capital anomalies.</p>
                    <Button variant="ghost" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20">Launch FinLab</Button>
                  </div>
                </Card>
             </div>
          </div>
        </div>
      ) : (
        <div className="p-40 flex flex-col items-center justify-center space-y-6">
           <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
           <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Accessing Institutional Portfolio...</p>
        </div>
      )}
    </DashboardShell>
  );
}

// Helper needed because link is used as import but not in actual jsx correctly (needed import for Link)
import Link from "next/link";
