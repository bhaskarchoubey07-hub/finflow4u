"use client";

import { useEffect, useState } from "react";
import LoanCard from "../../components/ui/LoanCard";
import { apiRequest } from "../../lib/api";
import { getToken, getUser } from "../../lib/auth";
import { Badge } from "../../components/ui/Core";

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
      setMessage("Please login as a lender to participate in the marketplace.");
      return;
    }

    try {
      await apiRequest("/invest", {
        method: "POST",
        token,
        body: {
          loanId: loan.id,
          amountInvested: 1000 // Standard chunk for demo
        }
      });

      setMessage(`Success! Invested ₹1,000 in ${loan.purpose || "Loan Contract"}`);
      setTimeout(() => setMessage(""), 5000);

      const refreshed = await apiRequest("/loan/marketplace");
      setLoans(refreshed.loans);
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      <section className="page-shell">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-12 gap-8">
          <div className="animate-in slide-in-from-left duration-700">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
              Capital Marketplace
            </h1>
            <p className="text-slate-500 font-medium mt-1 max-w-xl">
              Access curated lending opportunities with deep behavioral risk scoring and transparent capital tracking.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
            {["All", "A", "B", "C", "D"].map((grade) => (
              <button
                key={grade}
                onClick={() => setActiveFilter(grade)}
                className={`px-5 py-2.5 rounded-xl transition-all text-sm font-bold ${
                  activeFilter === grade 
                    ? "bg-primary text-white shadow-lg shadow-indigo-100" 
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {grade === "All" ? "Global Inventory" : `Grade ${grade}`}
              </button>
            ))}
          </div>
        </div>

        {/* Global Notifications */}
        {message && (
          <div className="mb-10 p-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <span className="text-sm font-bold">{message}</span>
          </div>
        )}

        {/* Loading State */}
        {status === "loading" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-72 bg-white/50 border border-slate-200 rounded-3xl animate-pulse"></div>
            ))}
          </div>
        )}

        {/* Loan Grid */}
        {status === "ready" && filteredLoans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in duration-1000">
            {filteredLoans.map((loan) => (
              <LoanCard key={loan.id} loan={loan} onInvest={handleInvest} />
            ))}
          </div>
        ) : status === "ready" && (
          <div className="panel p-20 flex flex-col items-center justify-center text-center bg-white border-dashed border-slate-300">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 border border-slate-100 text-slate-300">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900">No active opportunities</h3>
            <p className="text-sm text-slate-400 font-medium max-w-xs mt-2">Adjust your risk filters or check back later for new capital requests.</p>
          </div>
        )}
      </section>
    </main>
  );
}
