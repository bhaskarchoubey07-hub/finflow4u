"use client";

import { useEffect, useState } from "react";
import Header from "../../components/Header";
import LoanTable from "../../components/LoanTable";
import { apiRequest } from "../../lib/api";
import { getToken, getUser } from "../../lib/auth";

export default function MarketplacePage() {
  const [loans, setLoans] = useState([]);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadMarketplace() {
      try {
        const data = await apiRequest("/loan/marketplace");
        setLoans(data.loans);
        setStatus("ready");
      } catch (error) {
        setMessage(error.message);
        setStatus("error");
      }
    }

    loadMarketplace();
  }, []);

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
          amountInvested: Math.min(1000, loan.remainingAmount || loan.amount)
        }
      });

      setMessage("Investment submitted.");
      const refreshed = await apiRequest("/loan/marketplace");
      setLoans(refreshed.loans);
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <main>
      <Header />
      <section className="page-shell">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Loan Marketplace</span>
            <h1>Open lending opportunities</h1>
          </div>
          <p>Compare borrower score, funding progress, risk grade, and expected yield.</p>
        </div>

        {message ? <div className="info-banner">{message}</div> : null}

        {status === "loading" ? <div className="empty-card">Loading marketplace...</div> : null}
        {status === "error" ? <div className="error-banner">{message}</div> : null}
        {status === "ready" ? <LoanTable loans={loans} onInvest={handleInvest} showAction /> : null}
      </section>
    </main>
  );
}
