"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "../lib/api";
import { setSession } from "../lib/auth";

export default function AuthForm({ mode }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "BORROWER"
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest(isRegister ? "/auth/register" : "/auth/login", {
        method: "POST",
        body: isRegister ? form : { email: form.email, password: form.password }
      });

      setSession(data.token, data.user);
      router.push(
        data.user.role === "BORROWER"
          ? "/borrower"
          : data.user.role === "ADMIN"
            ? "/admin"
            : "/lender"
      );
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-card" onSubmit={handleSubmit}>
      <h1>{isRegister ? "Create your account" : "Welcome back"}</h1>
      <p>{isRegister ? "Join as a borrower or lender." : "Access your lending workspace."}</p>

      {isRegister ? (
        <label>
          Full name
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Priya Sharma"
            required
          />
        </label>
      ) : null}

      <label>
        Email
        <input
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          placeholder="name@example.com"
          required
        />
      </label>

      <label>
        Password
        <input
          type="password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          placeholder="Password123!"
          required
        />
        {isRegister ? (
          <span className="field-hint">Use at least 8 characters, one uppercase letter, and one number.</span>
        ) : null}
      </label>

      {isRegister ? (
        <label>
          Account type
          <select
            value={form.role}
            onChange={(event) => setForm({ ...form, role: event.target.value })}
          >
            <option value="BORROWER">Borrower</option>
            <option value="LENDER">Lender</option>
          </select>
        </label>
      ) : null}

      {error ? <div className="error-banner">{error}</div> : null}

      <button className="primary-button" disabled={loading} type="submit">
        {loading ? "Please wait..." : isRegister ? "Register" : "Login"}
      </button>
    </form>
  );
}
