"use client";

import { useEffect, useState } from "react";
import Header from "../../components/Header";
import StatCard from "../../components/StatCard";
import { apiRequest } from "../../lib/api";
import { getToken, getUser } from "../../lib/auth";

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loans, setLoans] = useState([]);
  const [ledger, setLedger] = useState(null);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);
  const [activeReviewLoan, setActiveReviewLoan] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    overrideScore: "",
    overrideRate: "",
    overrideGrade: "",
    overridePD: "",
    reviewNotes: ""
  });

  async function loadAdminData() {
    try {
      const token = getToken();
      const [pendingData, analyticsData, ledgerData] = await Promise.all([
        apiRequest("/admin/loans/pending", { token }),
        apiRequest("/admin/analytics", { token }),
        apiRequest("/admin/ledger", { token })
      ]);

      setLoans(pendingData.loans);
      setAnalytics(analyticsData.analytics);
      setLedger(ledgerData);
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    setUser(getUser());
    loadAdminData();
  }, []);

  async function handleQuickRejectOrInfo(loanId, reviewStatus) {
    const reviewNotes = window.prompt(
      reviewStatus === "CHANGES_REQUESTED"
        ? "Add a request for more information"
        : "Add a rejection note"
    );

    if (!reviewNotes) {
      return;
    }

    try {
      const token = getToken();
      await apiRequest(`/admin/loan/${loanId}/review`, {
        method: "PATCH",
        token,
        body: { reviewStatus, reviewNotes }
      });
      setMessage(`Loan marked as ${reviewStatus.toLowerCase().replaceAll("_", " ")}.`);
      loadAdminData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleReviewSubmit(e) {
    e.preventDefault();
    if (!activeReviewLoan) return;

    try {
      const token = getToken();
      await apiRequest(`/admin/loan/${activeReviewLoan.id}/review`, {
        method: "PATCH",
        token,
        body: {
          reviewStatus: "APPROVED",
          reviewNotes: reviewForm.reviewNotes || "Approved by admin.",
          overrideScore: Number(reviewForm.overrideScore) || undefined,
          overrideRate: Number(reviewForm.overrideRate) || undefined,
          overrideGrade: reviewForm.overrideGrade || undefined,
          overridePD: Number(reviewForm.overridePD) || undefined
        }
      });
      setMessage("Loan configured and approved successfully.");
      setActiveReviewLoan(null);
      loadAdminData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleAdjustment(targetUserId, role) {
    const amount = window.prompt("Adjustment amount");
    const reason = window.prompt("Adjustment reason");

    if (!amount || !reason) {
      return;
    }

    try {
      const token = getToken();
      await apiRequest("/admin/manual-adjustment", {
        method: "POST",
        token,
        body: {
          userId: targetUserId,
          role,
          amount: Number(amount),
          reason
        }
      });
      setMessage("Manual adjustment posted.");
      loadAdminData();
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
            <span className="eyebrow">Admin Dashboard</span>
            <h1>Review credit risk and approve applications</h1>
          </div>
          <p>{user ? `${user.name} | Admin reviewer` : "Login required"}</p>
        </div>

        {message ? <div className="info-banner">{message}</div> : null}

        {analytics ? (
          <div className="stats-grid">
            <StatCard label="Pending" value={String(analytics.pendingApplications)} />
            <StatCard label="Approved" value={String(analytics.approvedApplications)} tone="success" />
            <StatCard label="Rejected" value={String(analytics.rejectedApplications)} tone="warning" />
          </div>
        ) : null}

        {analytics ? (
          <div className="stats-grid">
            <StatCard label="Defaults" value={String(analytics.defaultedLoans)} />
            <StatCard
              label="Reviewed Capital"
              value={`$${Number(analytics.totalReviewedCapital).toLocaleString()}`}
              tone="accent"
            />
            <StatCard label="Queue" value={String(loans.length)} />
          </div>
        ) : null}

        {analytics ? (
          <div className="stats-grid">
            <StatCard label="Overdue EMIs" value={String(analytics.overdueRepayments)} tone="warning" />
            <StatCard
              label="Notifications"
              value={String(analytics.notificationsSent)}
              tone="accent"
            />
            <StatCard
              label="Platform Wallet"
              value={`$${Number(analytics.platformWalletBalance).toLocaleString()}`}
            />
          </div>
        ) : null}

        <div className="panel">
          <h3>Pending applications</h3>
          <div className="timeline-list">
            {loans.map((loan) => (
              <div className="timeline-item review-item" key={loan.id}>
                <div className="stack">
                  <strong>
                    {loan.borrower.name} | ${Number(loan.amount).toLocaleString()} | {loan.riskGrade}
                  </strong>
                  <span>
                    {loan.riskBand} risk | PD {Number(loan.probabilityOfDefault || 0).toFixed(2)}% | Rate{" "}
                    {Number(loan.recommendedRate || loan.interestRate).toFixed(2)}%
                  </span>
                  <span>{loan.decisionReason}</span>
                </div>
                <div className="review-actions">
                  <button className="ghost-button" onClick={() => handleQuickRejectOrInfo(loan.id, "CHANGES_REQUESTED")}>
                    Request Info
                  </button>
                  <button className="ghost-button" onClick={() => handleQuickRejectOrInfo(loan.id, "REJECTED")}>
                    Reject
                  </button>
                  <button
                    className="primary-button small"
                    onClick={() => {
                      setActiveReviewLoan(loan);
                      setReviewForm({
                        overrideScore: loan.borrower.creditScore || "",
                        overrideRate: Number(loan.recommendedRate || loan.interestRate).toFixed(2),
                        overrideGrade: loan.riskGrade || "",
                        overridePD: Number(loan.probabilityOfDefault || 0).toFixed(2),
                        reviewNotes: ""
                      });
                    }}
                  >
                    Configure & Approve
                  </button>
                </div>
                {activeReviewLoan?.id === loan.id && (
                  <form className="panel nested-panel" onSubmit={handleReviewSubmit} style={{ marginTop: 16 }}>
                    <h4>Manual Underwriting Overrides</h4>
                    <div className="field-grid">
                      <label>
                        Final Credit Score
                        <input
                          type="number"
                          value={reviewForm.overrideScore}
                          onChange={e => setReviewForm({ ...reviewForm, overrideScore: e.target.value })}
                        />
                      </label>
                      <label>
                        Final Interest Rate (%)
                        <input
                          type="number"
                          step="0.01"
                          value={reviewForm.overrideRate}
                          onChange={e => setReviewForm({ ...reviewForm, overrideRate: e.target.value })}
                        />
                      </label>
                      <label>
                        Final Risk Grade
                        <input
                          type="text"
                          value={reviewForm.overrideGrade}
                          onChange={e => setReviewForm({ ...reviewForm, overrideGrade: e.target.value })}
                        />
                      </label>
                      <label>
                        Probability of Default (%)
                        <input
                          type="number"
                          step="0.01"
                          value={reviewForm.overridePD}
                          onChange={e => setReviewForm({ ...reviewForm, overridePD: e.target.value })}
                        />
                      </label>
                      <label style={{ gridColumn: "1 / -1" }}>
                        Approval Notes
                        <input
                          type="text"
                          placeholder="Optional notes for borrower"
                          value={reviewForm.reviewNotes}
                          onChange={e => setReviewForm({ ...reviewForm, reviewNotes: e.target.value })}
                        />
                      </label>
                    </div>
                    <div className="review-actions">
                      <button type="button" className="ghost-button" onClick={() => setActiveReviewLoan(null)}>
                        Cancel
                      </button>
                      <button type="submit" className="primary-button">
                        Confirm Approval
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))}
            {!loans.length ? <div className="empty-card">No pending applications right now.</div> : null}
          </div>
        </div>

        {ledger ? (
          <div className="grid-two admin-grid">
            <div className="panel">
              <h3>Wallets and balances</h3>
              <div className="timeline-list">
                {ledger.wallets.map((wallet) => (
                  <div className="timeline-item review-item" key={wallet.id}>
                    <div className="stack">
                      <strong>
                        {wallet.user?.name || "Platform"} | {wallet.type}
                      </strong>
                      <span>Balance ${Number(wallet.balance).toLocaleString()}</span>
                      <span>
                        {wallet.accounts.map((account) => `${account.type}: $${account.balance.toFixed(2)}`).join(" | ")}
                      </span>
                    </div>
                    {wallet.user ? (
                      <button
                        className="ghost-button"
                        onClick={() => handleAdjustment(wallet.user.id, wallet.user.role)}
                      >
                        Adjust
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <h3>Flagged and delinquent exposure</h3>
              <div className="timeline-list">
                {ledger.flaggedLoans.map((loan) => (
                  <div className="timeline-item review-item" key={loan.id}>
                    <div className="stack">
                      <strong>{loan.borrower.name}</strong>
                      <span>
                        ${loan.amount.toLocaleString()} | {loan.status} | {loan.riskBand}
                      </span>
                      <span>PD {loan.probabilityOfDefault.toFixed(2)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {ledger ? (
          <div className="panel">
            <h3>Recent transfers</h3>
            <div className="timeline-list">
              {ledger.recentTransfers.map((transfer) => (
                <div className="timeline-item review-item" key={transfer.id}>
                  <div className="stack">
                    <strong>{transfer.description}</strong>
                    <span>
                      ${transfer.amount.toLocaleString()} | {transfer.referenceType}
                    </span>
                    <span>{new Date(transfer.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
