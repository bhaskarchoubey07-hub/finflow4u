"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../../components/Header";
import { apiRequest } from "../../lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // If no token in URL
  if (!token) {
    return (
      <div className="auth-card">
        <h1>Invalid Link</h1>
        <p>No reset token found in the URL. Please request a new password reset link.</p>
        <button className="ghost-button" onClick={() => router.push("/forgot-password")}>
          Go to Forgot Password
        </button>
      </div>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (password !== confirmPassword) {
      setStatus("Passwords do not match.");
      return;
    }

    setLoading(true);
    setStatus("");

    try {
      const response = await apiRequest("/auth/reset-password", {
        method: "POST",
        body: { token, newPassword: password }
      });
      
      setStatus("success: " + response.message);
      setTimeout(() => {
        router.push("/login");
      }, 2500);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-card" onSubmit={handleSubmit}>
      <h1>Reset Password</h1>
      <p>Enter your new password below.</p>

      {status && (
        <div className={status.startsWith("success:") ? "success-banner" : "error-banner"}>
          {status.replace("success: ", "")}
        </div>
      )}

      <label>
        New Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password123!"
          required
        />
        <span className="field-hint">Use at least 8 characters, one uppercase letter, and one number.</span>
      </label>

      <label>
        Confirm Password
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Retype password"
          required
        />
      </label>

      <button className="primary-button" disabled={loading} type="submit">
        {loading ? "Resetting..." : "Reset Password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main>
      <Header />
      <section className="auth-shell">
        <Suspense fallback={<div className="auth-card">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </section>
    </main>
  );
}
