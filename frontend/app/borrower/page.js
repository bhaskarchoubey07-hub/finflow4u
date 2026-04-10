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
        amount: Number(amountPaid),
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
    <main className="min-h-screen bg-neutral-50 pb-20">
      <Header />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start mb-10">
          <div>
            <span className="text-blue-600 font-bold tracking-wider uppercase text-xs">Borrower Dashboard</span>
            <h1 className="text-3xl font-extrabold text-gray-900 mt-1">
              Welcome back, {user?.name?.split(' ')[0] || "User"}
            </h1>
            <p className="text-gray-500 mt-1">Manage your loans and check your financial health.</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
             <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-xs font-bold text-gray-600">Wallet: ${Number(walletData?.wallet?.balance || 0).toLocaleString()}</span>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Form and Stats */}
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <StatCard label="Total Applications" value={String(loans.length)} />
              <StatCard label="Active Loans" value={String(activeLoans)} tone="success" />
              <StatCard label="Overdue / Default" value={String(defaults)} tone="warning" />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Apply for a New Loan</h3>
              <form onSubmit={handleApply} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Loan Amount ($)</label>
                    <input
                      type="number"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Term (Months)</label>
                    <select
                      value={form.termMonths}
                      onChange={(e) => setForm({ ...form, termMonths: Number(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    >
                      <option value={12}>12 Months</option>
                      <option value={24}>24 Months</option>
                      <option value={36}>36 Months</option>
                      <option value={60}>60 Months</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Annual Income ($)</label>
                    <input
                      type="number"
                      value={form.annualIncome}
                      onChange={(e) => setForm({ ...form, annualIncome: Number(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Existing Monthly Debt ($)</label>
                    <input
                      type="number"
                      value={form.existingDebt}
                      onChange={(e) => setForm({ ...form, existingDebt: Number(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Loan Purpose</label>
                    <input
                      type="text"
                      value={form.purpose}
                      onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                      placeholder="e.g. Debt Consolidation, Home Improvement"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button 
                    type="submit" 
                    className="flex-grow py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95"
                  >
                    Submit Loan Application
                  </button>
                  <button 
                    type="button" 
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="flex-grow py-4 bg-white border-2 border-blue-600 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all disabled:opacity-50"
                  >
                    {isAnalyzing ? "AI Analyzing..." : "Run AI Eligibility Check"}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Your Loan Portfolio</h3>
              {loans.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-gray-400">No loan applications yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {loans.map((loan) => (
                    <div key={loan.id} className="p-5 rounded-xl border border-gray-100 bg-gray-50 flex flex-col md:flex-row justify-between items-center group hover:border-blue-200 transition-all">
                      <div className="mb-4 md:mb-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-gray-900">${Number(loan.amount).toLocaleString()}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            loan.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {loan.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {loan.riskGrade} Grade | {loan.interestRate}% Interest | EMI ${Number(loan.emiAmount).toLocaleString()}
                        </p>
                      </div>
                      
                      {loan.status === 'ACTIVE' && (
                        <button 
                          onClick={() => handleRepayment(loan.id, loan.emiAmount)}
                          className="px-6 py-2 bg-white border border-blue-600 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-600 hover:text-white transition-all"
                        >
                          Pay EMI
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: AI Insights */}
          <div className="space-y-8">
            <CreditScoreMeter score={user?.creditScore || 700} />

            {analysis ? (
              <div className="bg-white rounded-2xl shadow-md border border-blue-100 p-8 animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-lg font-bold text-gray-900">AI Eligibility Result</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                    analysis.recommendation === 'APPROVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {analysis.recommendation}
                  </span>
                </div>

                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                     <p className="text-xs font-bold text-blue-800 uppercase mb-2">AI Assessment</p>
                     <p className="text-sm text-blue-900 leading-relaxed font-medium">{analysis.decisionReason}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Prob. Default</p>
                      <p className="text-lg font-bold text-gray-900">{analysis.probabilityOfDefault?.toFixed(1)}%</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Risk Grade</p>
                      <p className="text-lg font-bold text-gray-900">{analysis.riskGrade}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setAnalysis(null)}
                    className="w-full text-xs font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest"
                  >
                    Dismiss Analysis
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-blue-600 rounded-2xl shadow-xl p-8 text-white">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Ready to grow?</h3>
                <p className="text-blue-100 text-sm leading-relaxed mb-6">
                  Run the AI Eligibility check to see your personalized interest rates and risk profile before applying.
                </p>
                <button 
                   onClick={handleAnalyze}
                   className="w-full py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all"
                >
                  Start Assessment
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
      <ChatAdvisor />
    </main>
  );
}

