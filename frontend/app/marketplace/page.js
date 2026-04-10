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

      setMessage(`Invested $100 in ${loan.purpose || "Loan"}`);
      const refreshed = await apiRequest("/loan/marketplace");
      setLoans(refreshed.loans);
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <Header />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 space-y-4 md:space-y-0">
          <div>
            <span className="text-blue-600 font-bold tracking-wider uppercase text-xs">P2P Marketplace</span>
            <h1 className="text-3xl font-extrabold text-gray-900 mt-1">Diversify your portfolio</h1>
            <p className="text-gray-500 mt-2 max-w-xl">
              Discover verified loan opportunities curated by our AI engine. Focus on high-yield returns with managed risk.
            </p>
          </div>
          
          <div className="flex bg-white p-1 rounded-lg shadow-sm border border-gray-100">
            {["All", "A", "B", "C", "D"].map((grade) => (
              <button
                key={grade}
                onClick={() => setActiveFilter(grade)}
                className={`px-4 py-2 rounded-md transition-all text-sm font-medium ${
                  activeFilter === grade 
                    ? "bg-blue-600 text-white shadow-md" 
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                {grade}
              </button>
            ))}
          </div>
        </div>

        {message ? (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-100 text-blue-700 rounded-lg flex items-center shadow-sm animate-fade-in">
            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">{message}</span>
          </div>
        ) : null}

        {status === "loading" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl h-96 animate-pulse border border-gray-100"></div>
            ))}
          </div>
        )}

        {status === "ready" && filteredLoans.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredLoans.map((loan) => (
              <LoanCard key={loan.id} loan={loan} onInvest={handleInvest} />
            ))}
          </div>
        ) : status === "ready" && (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">No active loans found</h3>
            <p className="text-gray-500 max-w-xs mx-auto mt-1">Check back later for new investment opportunities.</p>
          </div>
        )}
      </section>
    </main>
  );
}

