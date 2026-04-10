"use client";

import { useEffect, useState } from "react";
import Header from "../../components/Header";
import LoanCard from "../../components/ui/LoanCard";
import { apiRequest } from "../../lib/api";
import { getToken, getUser } from "../../lib/auth";

export default function MarketplacePage() {
  const [loans, setLoans] = useState([]);
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    async function loadMarketplace() {
      try {
        const data = await apiRequest("/loan/marketplace");
        const list = Array.isArray(data.loans) ? data.loans : [];
        setLoans(list);
        setFilteredLoans(list);
        setStatus("ready");
      } catch (error) {
        setMessage(error.message);
        setStatus("error");
      }
    }

    loadMarketplace();
  }, []);

  useEffect(() => {
    if (activeFilter === "All") {
      setFilteredLoans(loans);
    } else {
      setFilteredLoans(loans.filter(l => l.riskGrade === activeFilter));
    }
  }, [activeFilter, loans]);

  async function handleInvest(loan) {
    const user = getUser();
    const token = getToken();

    if (!user || user.role !== "LENDER") {
      setMessage("Login as a lender to invest.");
      return;
    }

    try {
      await apiRequest("/invest", {
        method: "POST",
        token,
        body: {
          loanId: loan.id,
          amountInvested: 100 // Default investment amount for demo
        }
      });

      setMessage(`Invested ₹100 in ${loan.purpose || "Loan"}`);

      const refreshed = await apiRequest("/loan/marketplace");
      setLoans(refreshed.loans);
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <main className="min-h-screen bg-[#fafafa] pb-24">
      <Header />
      <section className="page-shell">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="animate-in slide-in-from-left duration-700">
            <span className="eyebrow">Enterprise Exchange</span>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mt-2">
              Capital Marketplace
            </h1>
            <p className="text-slate-500 font-medium mt-1 max-w-xl">
              Verified borrowing opportunities structured for institutional-grade yield and precision risk allocation.
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 animate-in slide-in-from-right duration-700">
            {["All", "A", "B", "C", "D"].map((grade) => (
              <button
                key={grade}
                onClick={() => setActiveFilter(grade)}
                className={`px-5 py-2 rounded-xl transition-all text-sm font-black tracking-tighter ${
                  activeFilter === grade 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                    : "text-slate-500 hover:text-indigo-600 hover:bg-slate-50"
                }`}
              >
                {grade === "All" ? "Global" : `Grade ${grade}`}
              </button>
            ))}
          </div>
        </div>

        {message && (
          <div className="info-banner mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
            <svg className="w-5 h-5 mr-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-bold">{message}</span>
          </div>
        )}

        {status === "loading" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="panel h-96 bg-slate-50/50 border-slate-100 animate-pulse"></div>
            ))}
          </div>
        )}

        {status === "ready" && filteredLoans.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 animate-in fade-in duration-1000">
            {filteredLoans.map((loan) => (
              <LoanCard key={loan.id} loan={loan} onInvest={handleInvest} />
            ))}
          </div>
        ) : status === "ready" && (
          <div className="panel p-24 text-center bg-white border-dashed border-slate-200">
            <div className="mx-auto w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 border border-slate-100">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">No Match Found</h3>
            <p className="text-slate-500 font-medium max-w-xs mx-auto mt-2">Adjust your risk filters to discover active opportunities in other grades.</p>
          </div>
        )}
      </section>
    </main>
  );
}



