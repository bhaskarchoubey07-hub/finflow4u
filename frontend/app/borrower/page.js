"use client";

import { useEffect, useState } from "react";
import Header from "../../components/Header";
import StatCard from "../../components/StatCard";
import CreditScoreMeter from "../../components/ui/CreditScoreMeter";
import ChatAdvisor from "../../components/ui/ChatAdvisor";
import { apiRequest } from "../../lib/api";
import { getToken, getUser } from "../../lib/auth";
import { launchRazorpayCheckout, pollPaymentStatus } from "../../lib/payments";

const initialForm = {
  amount: 10000,
  purpose: "Working capital",
  termMonths: 12,
  annualIncome: 36000,
  existingDebt: 2500,
  employmentStatus: "Full-time"
};

export default function BorrowerDashboard() {
  const [form, setForm] = useState(initialForm);
  const [loans, setLoans] = useState([]);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [paymentState, setPaymentState] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  async function handleAnalyze(event) {
    if (event) event.preventDefault();
    setMessage("");
    setIsAnalyzing(true);

    try {
      const token = getToken();
      const response = await apiRequest("/loan/analyze", {
        method: "POST",
        token,
        body: form
      });
      setAnalysis(response);
      setMessage("Eligibility check completed.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function loadLoans() {
    try {
      const token = getToken();
      const [data, wallet] = await Promise.all([
        apiRequest("/loan/my-loans", { token }),
        apiRequest("/payments/wallet", { token })
      ]);
      setLoans(data.loans || []);
      setWalletData(wallet);
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    setUser(getUser());
    loadLoans();
  }, []);

  async function handleApply(event) {
    event.preventDefault();
    setMessage("");

    try {
      const token = getToken();
      const response = await apiRequest("/loan/apply", {
        method: "POST",
        token,
        body: form
      });

      setMessage(`Application submitted successfully!`);
      loadLoans();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleRepayment(loanId, amountPaid) {
    try {
      const token = getToken();
      const intent = await apiRequest("/payments/intent", {
        method: "POST",
        token,
        body: {
          provider: "RAZORPAY",
          purpose: "BORROWER_REPAYMENT",
          amount: Number(amountPaid),
          currency: "INR",
          loanId
        }
      });
      await launchRazorpayCheckout({
        keyId: intent.providerConfig?.keyId,
        orderId: intent.payment.providerOrderId,
        amount: Math.round(Number(amountPaid)),
        name: "FinFlow Repayments",
        description: "Borrower EMI repayment",
        prefill: {
          name: user?.name || "Borrower",
          email: user?.email || ""
        },
        onSuccess: async (gatewayResponse) =>
          apiRequest("/payments/razorpay/verify", {
            method: "POST",
            token,
            body: {
              orderId: gatewayResponse.razorpay_order_id,
              paymentId: gatewayResponse.razorpay_payment_id,
              signature: gatewayResponse.razorpay_signature
            }
          })
      });
      setPaymentState({ status: "verifying", paymentId: intent.payment.id });
      const verified = await pollPaymentStatus({
        paymentId: intent.payment.id,
        token,
        apiRequest
      });
      setPaymentState({ status: verified?.status || "pending", paymentId: intent.payment.id });
      loadLoans();
    } catch (error) {
      setPaymentState({ status: "failed" });
      setMessage(error.message);
    }
  }

  const activeLoans = loans.filter((loan) => loan.status === "ACTIVE" || loan.status === "FUNDED").length;
  const defaults = loans.filter((loan) => loan.status === "DEFAULTED").length;

  return (

    <main className="min-h-screen bg-[#fafafa] pb-24">
      <Header />
      <section className="page-shell">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="animate-in slide-in-from-left duration-700">
            <span className="eyebrow">Enterprise Dashboard</span>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mt-2">
              Welcome, {user?.name?.split(' ')[0] || "User"}
            </h1>
            <p className="text-slate-500 font-medium mt-1">Monitor your capital access and AI credit insights.</p>
          </div>
          <div className="flex items-center gap-3 animate-in slide-in-from-right duration-700">
             <div className="bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                 <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                 <span className="text-sm font-black text-slate-700">Wallet: ₹{Number(walletData?.wallet?.balance || 0).toLocaleString()}</span>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            <div className="stats-grid">
              <StatCard label="Loan Requests" value={String(loans.length)} />
              <StatCard label="Active Portfolio" value={String(activeLoans)} />
              <StatCard label="Default Risk" value={String(defaults)} />
            </div>

            <div className="panel p-10 bg-white">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">Capital Application</h3>
                  <p className="text-sm text-slate-500 font-medium">Configure your loan parameters below.</p>
                </div>
              </div>
              
              <form onSubmit={handleApply} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Principal Amount (₹)</label>
                    <input
                      type="number"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                      placeholder="Enter amount"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Repayment Term</label>
                    <select
                      value={form.termMonths}
                      onChange={(e) => setForm({ ...form, termMonths: Number(e.target.value) })}
                    >
                      <option value={12}>12 Months (Standard)</option>
                      <option value={24}>24 Months (Extended)</option>
                      <option value={36}>36 Months (Business)</option>
                      <option value={60}>60 Months (Long-term)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Verified Annual Income</label>
                    <input
                      type="number"
                      value={form.annualIncome}
                      onChange={(e) => setForm({ ...form, annualIncome: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Outstanding Obligations</label>
                    <input
                      type="number"
                      value={form.existingDebt}
                      onChange={(e) => setForm({ ...form, existingDebt: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    type="submit" 
                    className="primary-button flex-grow !py-4"
                  >
                    Submit Official Request
                  </button>
                  <button 
                    type="button" 
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="ghost-button flex-grow !py-4 !border-indigo-200 !text-indigo-600 hover:!bg-indigo-50"
                  >
                    {isAnalyzing ? "Processing AI Analysis..." : "Run Eligibility Simulation"}
                  </button>
                </div>
              </form>
            </div>

            <div className="panel p-0 overflow-hidden">
              <div className="p-8 border-b border-slate-50">
                <h3 className="text-xl font-extrabold text-slate-900">Application Portfolio</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Real-time status of your borrowing history.</p>
              </div>
              
              {loans.length === 0 ? (
                <div className="p-20 text-center bg-slate-50/30">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Awaiting First Application</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {loans.map((loan) => (
                    <div key={loan.id} className="p-6 flex flex-col md:flex-row justify-between items-center group hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-6">
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border ${
                           loan.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                         }`}>
                           {loan.riskGrade}
                         </div>
                         <div>
                             <div className="flex items-center gap-2">
                                <span className="text-lg font-black text-slate-900">₹{Number(loan.amount).toLocaleString()}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                                  loan.status === 'ACTIVE' ? 'status-active' : 'status-pending'
                                }`}>
                                  {loan.status}
                                </span>
                             </div>
                             <p className="text-xs text-slate-400 font-bold mt-0.5">
                               {loan.interestRate}% APY • Monthly EMI: ₹{Number(loan.emiAmount).toLocaleString()}
                             </p>
                         </div>
                      </div>
                      
                      {loan.status === 'ACTIVE' && (
                        <button 
                          onClick={() => handleRepayment(loan.id, loan.emiAmount)}
                          className="primary-button !py-2 !px-6 !text-xs !bg-indigo-50 !text-indigo-600 !border-indigo-100 hover:!bg-indigo-600 hover:!text-white"
                        >
                          Execute EMI Payment
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <CreditScoreMeter score={user?.creditScore || 700} />

            {analysis ? (
              <div className="panel p-8 !bg-indigo-900 text-white border-indigo-700 shadow-indigo-200/50">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">AI Intelligence Insight</span>
                    <h3 className="text-xl font-black mt-1">Eligibility Verdict</h3>
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-xs font-black uppercase border ${
                    analysis.recommendation === 'APPROVE' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  }`}>
                    {analysis.recommendation === 'APPROVE' ? 'High Probability' : 'Low Probability'}
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="p-5 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md">
                     <p className="text-sm leading-relaxed font-semibold italic">"{analysis.decisionReason}"</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Risk Factor</p>
                      <p className="text-xl font-black">{analysis.probabilityOfDefault?.toFixed(1)}%</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Target Tier</p>
                      <p className="text-xl font-black">Grade {analysis.riskGrade}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setAnalysis(null)}
                    className="w-full text-[10px] font-black text-indigo-300 hover:text-white transition-colors uppercase tracking-[0.3em] mt-4"
                  >
                    Clear Analysis
                  </button>
                </div>
              </div>
            ) : (
              <div className="panel p-8 bg-indigo-600 text-white overflow-hidden relative group">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-500"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-8 border border-white/20">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-black mb-2 leading-tight">Elite Financial Access</h3>
                  <p className="text-indigo-100 text-sm leading-relaxed mb-8 font-medium">
                    Run the advanced AI simulation to unlock optimized interest rates based on your verified income data.
                  </p>
                  <button 
                     onClick={handleAnalyze}
                     className="w-full py-4 bg-white text-indigo-600 font-black rounded-2xl hover:shadow-xl hover:scale-[1.02] transition-all"
                  >
                    Initiate Smart Check
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      <ChatAdvisor />
    </main>
  );
}


