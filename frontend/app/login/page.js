"use client";

import AuthForm from "../../components/AuthForm";

export default function LoginPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-slate-50 flex items-center justify-center p-6">
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none overflow-hidden">
            <div className="absolute top-0 -left-20 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 -right-20 w-96 h-96 bg-secondary rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 w-full flex justify-center">
            <AuthForm mode="login" />
        </div>
    </main>
  );
}
