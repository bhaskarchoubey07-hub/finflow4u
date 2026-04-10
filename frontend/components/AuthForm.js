"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "../lib/api";
import { setSession } from "../lib/auth";
import { Card, Input } from "./ui/Core";
import Button from "./ui/Button";

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
    <Card className="max-w-md w-full p-10 !rounded-3xl shadow-2xl shadow-indigo-100">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-slate-900 leading-tight">
          {isRegister ? "Join FinFlow" : "Institutional Login"}
        </h1>
        <p className="text-sm font-medium text-slate-400 mt-2">
          {isRegister ? "Create your institutional lending account." : "Access your lending and borrowing workspace."}
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {isRegister && (
          <Input
            label="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Rahul Singh"
            required
          />
        )}

        <Input
          label="Email Address"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="name@company.com"
          required
        />

        <div className="space-y-1.5">
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
            required
          />
          {!isRegister && (
            <div className="text-right">
              <Link href="/forgot-password" size="sm" className="text-xs font-bold text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
          )}
        </div>

        {isRegister && (
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Account Type</label>
            <div className="grid grid-cols-2 gap-3">
               <button
                  type="button"
                  onClick={() => setForm({...form, role: 'BORROWER'})}
                  className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    form.role === 'BORROWER' ? 'bg-primary text-white shadow-lg' : 'bg-slate-50 text-slate-400 border border-slate-100'
                  }`}
               >
                 Borrower
               </button>
               <button
                  type="button"
                  onClick={() => setForm({...form, role: 'LENDER'})}
                  className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    form.role === 'LENDER' ? 'bg-primary text-white shadow-lg' : 'bg-slate-50 text-slate-400 border border-slate-100'
                  }`}
               >
                 Lender
               </button>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-bold animate-in shake-x duration-500">
            {error}
          </div>
        )}

        <Button className="w-full h-12" disabled={loading} type="submit">
          {loading ? "Verifying Credentials..." : isRegister ? "Create Account" : "Secure Login"}
        </Button>
      </form>

      <div className="mt-10 text-center">
        <p className="text-sm font-medium text-slate-400">
          {isRegister ? "Already part of the network?" : "New to FinFlow?"}{" "}
          <Link href={isRegister ? "/login" : "/register"} className="text-primary font-bold hover:underline">
            {isRegister ? "Login here" : "Get started now"}
          </Link>
        </p>
      </div>
    </Card>
  );
}
