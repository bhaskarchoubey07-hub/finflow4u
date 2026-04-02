"use client";

import { useEffect, useState } from "react";
import Header from "../../components/Header";
import StatCard from "../../components/StatCard";
import { apiRequest } from "../../lib/api";
import { getToken, getUser } from "../../lib/auth";

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

  async function loadLoans() {
    try {
      const token = getToken();
      const [data, wallet] = await Promise.all([
        apiRequest("/loan/my-loans", { token }),
        apiRequest("/payments/wallet", { token })
      ]);
      setLoans(data.loans);
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

      setMessage(
        `Application submitted. Score ${response.creditScore}, ${response.riskBand} risk, PD ${response.probabilityOfDefault}% and EMI $${response.emiAmount}.`
      );
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
      setMessage(
        `Repayment intent created. Complete the Razorpay checkout using order ${intent.payment.providerOrderId}.`
      );
      loadLoans();
    } catch (error) {
      setMessage(error.message);
    }
  }

  const activeLoans = loans.filter((loan) => loan.status === "ACTIVE" || loan.status === "FUNDED").length;
  const defaults = loans.filter((loan) => loan.status === "DEFAULTED").length;

  return (
    <main>
      <Header />
      <section className="page-shell">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Borrower Dashboard</span>
            <h1>Borrow with transparent pricing</h1>
          </div>
          <p>{user ? `${user.name} | Credit score ${user.creditScore ?? "Pending"}` : "Login required"}</p>
        </div>

        {message ? <div className="info-banner">{message}</div> : null}

        <div className="stats-grid">
          <StatCard label="Total Loans" value={String(loans.length)} />
          <StatCard label="Active Loans" value={String(activeLoans)} tone="success" />
          <StatCard label="Defaults" value={String(defaults)} tone="warning" />
        </div>

        {walletData?.wallet ? (
          <div className="panel">
            <h3>Borrower wallet snapshot</h3>
            <div className="timeline-list">
              <div className="timeline-item">
                <div className="stack">
                  <strong>Wallet balance</strong>
                  <span>${Number(walletData.wallet.balance || 0).toLocaleString()}</span>
                </div>
              </div>
              {walletData.wallet.accounts.map((account) => (
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
          <form className="panel form-panel" onSubmit={handleApply}>
            <h3>Apply for a loan</h3>
            <div className="field-grid">
              <label>
                Amount
                <input
                  type="number"
                  value={form.amount}
                  onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })}
                />
              </label>
              <label>
                Term (months)
                <input
                  type="number"
                  value={form.termMonths}
                  onChange={(event) => setForm({ ...form, termMonths: Number(event.target.value) })}
                />
              </label>
              <label>
                Annual income
                <input
                  type="number"
                  value={form.annualIncome}
                  onChange={(event) => setForm({ ...form, annualIncome: Number(event.target.value) })}
                />
              </label>
              <label>
                Existing debt
                <input
                  type="number"
                  value={form.existingDebt}
                  onChange={(event) => setForm({ ...form, existingDebt: Number(event.target.value) })}
                />
              </label>
              <label>
                Purpose
                <input
                  value={form.purpose}
                  onChange={(event) => setForm({ ...form, purpose: event.target.value })}
                />
              </label>
              <label>
                Employment status
                <input
                  value={form.employmentStatus}
                  onChange={(event) => setForm({ ...form, employmentStatus: event.target.value })}
                />
              </label>
            </div>
            <button className="primary-button" type="submit">
              Submit application
            </button>
          </form>

          <div className="panel">
            <h3>Loan health</h3>
            <div className="timeline-list">
              {loans.map((loan) => {
                const nextRepayment = loan.repayments.find((item) => item.status !== "PAID");
                return (
                  <div className="timeline-item" key={loan.id}>
                    <div className="stack">
                      <strong>
                        ${Number(loan.amount).toLocaleString()} | {loan.riskGrade}
                      </strong>
                      <span>
                        {loan.status} | Review {loan.reviewStatus} | EMI ${Number(loan.emiAmount).toLocaleString()}
                      </span>
                      <span>
                        {loan.riskBand || "Pending"} risk | PD {Number(loan.probabilityOfDefault || 0).toFixed(2)}%
                      </span>
                    </div>
                    {nextRepayment ? (
                      <button
                        className="ghost-button"
                        onClick={() => handleRepayment(loan.id, nextRepayment.amountPaid)}
                      >
                        Pay next EMI
                      </button>
                    ) : (
                      <span className="pill status-closed">Settled</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
