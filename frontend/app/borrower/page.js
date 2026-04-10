"use client";

import { useEffect, useState } from "react";
import DashboardShell from "../../components/DashboardShell";
import { Card, Badge, Progress, Input } from "../../components/ui/Core";
import Button from "../../components/ui/Button";
import CreditScoreMeter from "../../components/ui/CreditScoreMeter";
import { apiRequest } from "../../lib/api";
import { getToken, getUser } from "../../lib/auth";
import { launchRazorpayCheckout, pollPaymentStatus } from "../../lib/payments";

const initialForm = {
  amount: 50000,
  purpose: "Business Expansion",
  termMonths: 12,
  annualIncome: 1200000,
  existingDebt: 50000,
  employmentStatus: "Full-time"
};

export default function BorrowerDashboard() {
  const [form, setForm] = useState(initialForm);
  const [loans, setLoans] = useState([]);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  async function loadLoans() {
    try {
      const token = getToken();
      if (!token) return;
      const [data, wallet] = await Promise.all([
        apiRequest("/loan/my-loans", { token }),
        apiRequest("/payments/wallet", { token })
      ]);
      setLoans(data.loans || []);
      setWalletData(wallet);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    setUser(getUser());
    loadLoans();
  }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      const token = getToken();
      await apiRequest("/loan/apply", {
        method: "POST",
        token,
        body: form
      });
      setMessage("Application submitted successfully!");
      loadLoans();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const token = getToken();
      const response = await apiRequest("/loan/analyze", {
        method: "POST",
        token,
        body: form
      });
      setAnalysis(response);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

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
        prefill: { name: user?.name, email: user?.email },
        onSuccess: async (res) => {
          await apiRequest("/payments/razorpay/verify", {
            method: "POST",
            token,
            body: {
                orderId: res.razorpay_order_id,
                paymentId: res.razorpay_payment_id,
                signature: res.razorpay_signature
            }
          });
          loadLoans();
        }
      });
    } catch (error) {
      setMessage(error.message);
    }
  }

  const activeLoansCount = loans.filter(l => l.status === 'ACTIVE').length;

  return (
    <DashboardShell 
      title={`Welcome back, ${user?.name?.split(' ')[0] || 'User'}`}
      description="Access institutional-grade capital and monitor your credit health."
      actions={
        <Card className="!p-3 !bg-emerald-50 border-emerald-100 flex items-center gap-3">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
             <span className="text-xs font-black text-emerald-800 tabular-nums">Wallet: ₹{Number(walletData?.wallet?.balance || 0).toLocaleString()}</span>
        </Card>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Limit</p>
                <p className="text-2xl font-black text-slate-900">₹5,00,000</p>
            </Card>
            <Card className="p-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Loans</p>
                <p className="text-2xl font-black text-slate-900">{activeLoansCount}</p>
            </Card>
            <Card className="p-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg interest</p>
                <p className="text-2xl font-black text-slate-900">12.4%</p>
            </Card>
          </div>

          {/* Form & List */}
          <Card className="p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Request Capital</h3>
            <form onSubmit={handleApply} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input 
                      label="Principal Amount (₹)" 
                      type="number" 
                      value={form.amount} 
                      onChange={e => setForm({...form, amount: e.target.value})}
                    />
                    <div className="space-y-1.5 w-full">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Repayment Term</label>
                        <select 
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all cursor-pointer"
                          value={form.termMonths}
                          onChange={e => setForm({...form, termMonths: e.target.value})}
                        >
                            <option value="12">12 Months</option>
                            <option value="24">24 Months</option>
                            <option value="36">36 Months</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-4">
                    <Button type="submit" className="flex-1 h-12">Submit Application</Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex-1 h-12"
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                    >
                        {isAnalyzing ? "Analyzing Risk..." : "Run AI Simulation"}
                    </Button>
                </div>
            </form>
          </Card>

          <Card className="p-0 overflow-hidden">
             <div className="p-6 border-b border-slate-50">
                <h3 className="text-lg font-bold text-slate-900">Loan Portfolio</h3>
             </div>
             <div className="divide-y divide-slate-100">
                {loans.map(loan => (
                    <div key={loan.id} className="p-6 flex justify-between items-center group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-xs text-slate-500">{loan.riskGrade}</div>
                            <div>
                                <p className="text-sm font-black text-slate-900">₹{Number(loan.amount).toLocaleString()}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{loan.status} • {loan.interestRate}% APR</p>
                            </div>
                        </div>
                        {loan.status === 'ACTIVE' && (
                             <Button size="sm" variant="ghost" className="border border-slate-200" onClick={() => handleRepayment(loan.id, loan.emiAmount)}>
                                Pay EMI
                             </Button>
                        )}
                        {loan.status === 'PENDING' && (
                            <Badge>Processing</Badge>
                        )}
                    </div>
                ))}
                {loans.length === 0 && (
                     <div className="p-12 text-center text-slate-400 font-medium text-sm">No applications recorded.</div>
                )}
             </div>
          </Card>
        </div>

        <div className="space-y-8">
            <CreditScoreMeter score={user?.creditScore || 720} />
            
            {analysis && (
                 <Card className="p-8 bg-slate-900 text-white border-slate-800 relative shadow-2xl shadow-indigo-100">
                    <div className="absolute top-0 right-0 p-4">
                        <Badge variant="success" className="bg-emerald-500/20 text-emerald-300 border-0">High Eligibility</Badge>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">AI Verdict</p>
                            <p className="text-sm font-semibold italic text-slate-100 leading-relaxed">"{analysis.decisionReason}"</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                            <div>
                                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Defaults</p>
                                <p className="text-lg font-black">{analysis.probabilityOfDefault?.toFixed(1)}%</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Risk Grade</p>
                                <p className="text-lg font-black">{analysis.riskGrade}</p>
                            </div>
                        </div>
                        <Button variant="ghost" className="w-full text-indigo-300 hover:text-white hover:bg-white/5 border-white/10" onClick={() => setAnalysis(null)}>Clear Analysis</Button>
                    </div>
                 </Card>
            )}

            <Card className="p-8 bg-indigo-600 text-white relative group overflow-hidden">
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full group-hover:scale-125 transition-all duration-500 blur-2xl"></div>
                <div className="relative z-10 space-y-4">
                    <h3 className="text-xl font-black">Financial Pulse</h3>
                    <p className="text-sm font-medium text-indigo-100 leading-relaxed">Our behavioral engine tracks your repayment consistency to optimize future credit limits.</p>
                    <div className="pt-4">
                         <div className="flex justify-between items-center mb-2">
                             <span className="text-[10px] font-black uppercase">Limit Health</span>
                             <span className="text-[10px] font-black uppercase">84%</span>
                         </div>
                         <Progress value={84} className="bg-indigo-700 h-1.5" />
                    </div>
                </div>
            </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
