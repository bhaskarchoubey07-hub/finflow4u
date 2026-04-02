"use client";

import { useEffect, useState } from "react";
import Header from "../../components/Header";
import StatCard from "../../components/StatCard";
import { apiRequest } from "../../lib/api";
import { getToken, getUser } from "../../lib/auth";

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loans, setLoans] = useState([]);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);

  async function loadAdminData() {
    try {
      const token = getToken();
      const [pendingData, analyticsData] = await Promise.all([
        apiRequest("/admin/loans/pending", { token }),
        apiRequest("/admin/analytics", { token })
      ]);

      setLoans(pendingData.loans);
      setAnalytics(analyticsData.analytics);
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    setUser(getUser());
    loadAdminData();
  }, []);

  async function handleReview(loanId, reviewStatus) {
    const reviewNotes = window.prompt(
      reviewStatus === "APPROVED"
        ? "Add an approval note for the borrower"
        : "Add a rejection or revision note"
    );

    if (!reviewNotes) {
      return;
    }

    try {
      const token = getToken();
      await apiRequest(`/admin/loan/${loanId}/review`, {
        method: "PATCH",
        token,
        body: {
          reviewStatus,
          reviewNotes
        }
      });
      setMessage(`Loan marked as ${reviewStatus.toLowerCase().replaceAll("_", " ")}.`);
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
                  <button className="ghost-button" onClick={() => handleReview(loan.id, "CHANGES_REQUESTED")}>
                    Request Info
                  </button>
                  <button className="ghost-button" onClick={() => handleReview(loan.id, "REJECTED")}>
                    Reject
                  </button>
                  <button className="primary-button small" onClick={() => handleReview(loan.id, "APPROVED")}>
                    Approve
                  </button>
                </div>
              </div>
            ))}
            {!loans.length ? <div className="empty-card">No pending applications right now.</div> : null}
          </div>
        </div>
      </section>
    </main>
  );
}
