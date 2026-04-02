"use client";

import { useEffect, useState } from "react";
import Header from "../../components/Header";
import StatCard from "../../components/StatCard";
import PortfolioChart from "../../components/PortfolioChart";
import { apiRequest } from "../../lib/api";
import { getToken, getUser } from "../../lib/auth";

export default function LenderDashboard() {
  const [portfolio, setPortfolio] = useState(null);
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadPortfolio() {
      try {
        const token = getToken();
        const data = await apiRequest("/portfolio", { token });
        setPortfolio(data);
      } catch (error) {
        setMessage(error.message);
      }
    }

    setUser(getUser());
    loadPortfolio();
  }, []);

  return (
    <main>
      <Header />
      <section className="page-shell">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Lender Dashboard</span>
            <h1>Monitor capital deployment and yield</h1>
          </div>
          <p>{user ? `${user.name} | Ready to deploy capital` : "Login required"}</p>
        </div>

        {message ? <div className="info-banner">{message}</div> : null}

        {portfolio ? (
          <>
            <div className="stats-grid">
              <StatCard
                label="Total Invested"
                value={`$${portfolio.summary.totalInvested.toLocaleString()}`}
              />
              <StatCard
                label="Expected Returns"
                value={`$${portfolio.summary.expectedReturns.toFixed(2)}`}
                tone="success"
              />
              <StatCard
                label="Repayments Received"
                value={`$${portfolio.summary.repaymentsReceived.toFixed(2)}`}
                tone="accent"
              />
            </div>

            <div className="grid-two">
              <PortfolioChart investments={portfolio.investments} />

              <div className="panel">
                <h3>Current investments</h3>
                <div className="timeline-list">
                  {portfolio.investments.map((investment) => (
                    <div className="timeline-item" key={investment.id}>
                      <div className="stack">
                        <strong>{investment.loan.borrower.name}</strong>
                        <span>
                          ${investment.amountInvested.toLocaleString()} at {investment.loan.interestRate}% |{" "}
                          {investment.loan.status}
                        </span>
                        <span>
                          {investment.loan.riskBand || "Pending"} risk | PD{" "}
                          {Number(investment.loan.probabilityOfDefault || 0).toFixed(2)}%
                        </span>
                      </div>
                      <span className={`pill risk-${investment.loan.riskGrade.toLowerCase()}`}>
                        {investment.loan.riskGrade}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-card">Loading portfolio...</div>
        )}
      </section>
    </main>
  );
}
