"use client";

import { useState } from "react";
import Header from "../../components/Header";
import { apiRequest } from "../../lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [devLink, setDevLink] = useState("");
  const [devError, setDevError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setStatus("");
    setDevLink("");
    setDevError("");

    try {
      const response = await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: { email }
      });
      
      setStatus(response.message || "Reset link sent.");
      if (response._devOnlyResetLink) {
        setDevLink(response._devOnlyResetLink);
      }
      if (response._devOnlyError) {
        setDevError(response._devOnlyError);
      }
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <Header />
      <section className="auth-shell">
        <form className="auth-card" onSubmit={handleSubmit}>
          <h1>Forgot Password</h1>
          <p>We'll send you a link to reset your password.</p>

          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
          </label>

          {status && <div className={status.includes("sent") ? "info-banner" : "error-banner"}>{status}</div>}

          {devLink && (
            <div className="panel" style={{ marginTop: "12px", background: "rgba(0, 255, 255, 0.05)" }}>
              <p style={{ fontSize: "13px", color: "var(--teal)" }}>
                <strong>Local Dev Link Generated:</strong>
                <br/>
                <a href={devLink} style={{ color: "var(--foreground)", textDecoration: "underline", wordBreak: "break-all" }}>{devLink}</a>
              </p>
            </div>
          )}

          {devError && (
            <div className="panel error-card" style={{ marginTop: "12px", background: "rgba(255, 0, 0, 0.05)" }}>
              <p style={{ fontSize: "13px", color: "var(--warning)" }}>
                <strong>Dev Alert:</strong> {devError}
              </p>
            </div>
          )}

          <button className="primary-button" disabled={loading} type="submit">
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      </section>
    </main>
  );
}
