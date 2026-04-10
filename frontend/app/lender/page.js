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
    <main className="min-h-screen bg-neutral-50 pb-20">
      <Header />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start mb-10">
          <div>
            <span className="text-blue-600 font-bold tracking-wider uppercase text-xs">Lender Dashboard</span>
            <h1 className="text-3xl font-extrabold text-gray-900 mt-1">
              {user ? `Portfolio Review: ${user.name}` : "Investment Dashboard"}
            </h1>
            <p className="text-gray-500 mt-1">Monitor your capital deployment and automated yield generation.</p>
          </div>
          <div className="mt-4 md:mt-0">
             <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-xs font-bold text-gray-600">Lender Account Active</span>
             </div>
          </div>
        </div>

        {message && (
          <div className="mb-8 p-4 bg-white border-l-4 border-blue-600 shadow-sm flex items-center animate-in fade-in slide-in-from-left-2">
            <svg className="w-5 h-5 text-blue-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-gray-700">{message}</span>
          </div>
        )}

        {portfolio ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <StatCard
                label="Total Invested"
                value={`$${portfolio.summary.totalInvested.toLocaleString()}`}
              />
              <StatCard
                label="Expected Yield"
                value={`$${portfolio.summary.expectedReturns.toFixed(2)}`}
                tone="success"
              />
              <StatCard
                label="Cash Collected"
                value={`$${portfolio.summary.repaymentsReceived.toFixed(2)}`}
                tone="accent"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <ROIChart />
               <RiskDistributionChart investments={portfolio.investments} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                   <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                      <h3 className="font-bold text-gray-900">Current Investments</h3>
                      <a href="/marketplace" className="text-xs font-bold text-blue-600 hover:underline">Find new opportunities →</a>
                   </div>
                   <div className="divide-y divide-gray-50">
                     {portfolio.investments.length === 0 ? (
                       <div className="p-10 text-center">
                          <p className="text-gray-400">No active investments found.</p>
                       </div>
                     ) : (
                       portfolio.investments.map((investment) => (
                         <div key={investment.id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col md:flex-row justify-between items-center group">
                            <div className="mb-4 md:mb-0">
                               <div className="flex items-center space-x-2">
                                  <span className="font-bold text-gray-900 text-lg">${investment.amountInvested.toLocaleString()}</span>
                                  <RiskBadge grade={investment.loan.riskGrade} />
                               </div>
                               <p className="text-xs text-gray-500 mt-1">
                                  Borrower: {investment.loan.borrower.name} | Rate: {investment.loan.interestRate}% | Status: {investment.loan.status}
                               </p>
                            </div>
                            <div className="text-right">
                               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Est. Return</p>
                               <p className="text-sm font-bold text-green-600">+${(investment.amountInvested * investment.loan.interestRate / 100).toFixed(2)}</p>
                            </div>
                         </div>
                       ))
                     )}
                   </div>
                </div>

                {portfolio.payments?.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50">
                      <h3 className="font-bold text-gray-900">Recent Transactions</h3>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {portfolio.payments.map((pyment) => (
                        <div key={pyment.id} className="p-4 flex justify-between items-center">
                           <div>
                              <p className="text-sm font-bold text-gray-800">{pyment.purpose.replaceAll("_", " ")}</p>
                              <p className="text-[10px] text-gray-400 uppercase">{pyment.status} | {pyment.provider}</p>
                           </div>
                           <p className={`text-sm font-bold ${pyment.status === 'SUCCEEDED' ? 'text-green-600' : 'text-gray-400'}`}>
                             ${pyment.amount.toLocaleString()}
                           </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-8">
                {portfolio.wallet && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                     <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-900">Lender Wallet</h3>
                        <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded">Verified</span>
                     </div>
                     
                     <div className="space-y-4 mb-8">
                        <div className="p-4 rounded-xl bg-gray-50">
                           <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Total Balance</p>
                           <p className="text-2xl font-black text-gray-900">${Number(portfolio.wallet.balance).toLocaleString()}</p>
                        </div>
                        {portfolio.wallet.accounts.map((acc) => (
                          <div key={acc.type} className="flex justify-between items-center px-2">
                             <span className="text-xs text-gray-500">{acc.type.replaceAll("_", " ")}</span>
                             <span className="text-sm font-bold text-gray-700">${Number(acc.balance).toLocaleString()}</span>
                          </div>
                        ))}
                     </div>

                     <StripeTopUpPanel
                        onMessage={setMessage}
                        onSuccess={loadPortfolio}
                      />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
             <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Hydrating Dashboard...</p>
          </div>
        )}
      </section>
      <ChatAdvisor />
    </main>
  );
}

