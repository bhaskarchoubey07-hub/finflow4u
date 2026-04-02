"use client";

import { useEffect, useState } from "react";
import Header from "../../components/Header";
import StatCard from "../../components/StatCard";
import PortfolioChart from "../../components/PortfolioChart";
import { apiRequest } from "../../lib/api";
import { getToken, getUser } from "../../lib/auth";
import { loadStripeJs } from "../../lib/payments";

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

            {portfolio.wallet ? (
              <div className="panel">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">Wallet</span>
                    <h3>Lender cash position</h3>
                  </div>
                  <button
                    className="primary-button small"
                    onClick={async () => {
                      try {
                        const token = getToken();
                        const amount = window.prompt("Top-up amount");
                        if (!amount) return;
                        const response = await apiRequest("/payments/intent", {
                          method: "POST",
                          token,
                          body: {
                            provider: "STRIPE",
                            purpose: "LENDER_TOP_UP",
                            amount: Number(amount),
                            currency: "USD"
                          }
                        });
                        const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

                        if (!stripeKey) {
                          setMessage(
                            `Stripe intent created. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to use client confirmation.`
                          );
                          return;
                        }

                        const stripe = await loadStripeJs(stripeKey);
                        setMessage(
                          stripe
                            ? `Stripe intent ready. Use client secret ${response.payment.clientSecret} in the next checkout step.`
                            : "Stripe SDK unavailable."
                        );
                      } catch (error) {
                        setMessage(error.message);
                      }
                    }}
                  >
                    Top Up Wallet
                  </button>
                </div>
                <div className="timeline-list">
                  <div className="timeline-item">
                    <div className="stack">
                      <strong>Total wallet balance</strong>
                      <span>${Number(portfolio.wallet.balance).toLocaleString()}</span>
                    </div>
                  </div>
                  {portfolio.wallet.accounts.map((account) => (
                    <div className="timeline-item" key={account.type}>
                      <div className="stack">
                        <strong>{account.type}</strong>
                        <span>${Number(account.balance).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

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
                  {portfolio.payments?.length ? (
                    <div className="panel nested-panel">
                      <h3>Recent payments</h3>
                      <div className="timeline-list">
                        {portfolio.payments.map((payment) => (
                          <div className="timeline-item" key={payment.id}>
                            <div className="stack">
                              <strong>{payment.purpose}</strong>
                              <span>
                                ${payment.amount.toLocaleString()} | {payment.provider} | {payment.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
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
