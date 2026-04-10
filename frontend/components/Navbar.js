"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession, getUser } from "../lib/auth";
import Button from "./ui/Button";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getUser());
  }, [pathname]);

  const links = [
    { href: "/", label: "Home" },
    { href: "/marketplace", label: "Marketplace" },
    { href: "/borrower", label: "Borrower" },
    { href: "/lender", label: "Lender" },
    { href: "/lab", label: "FinLab" }
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white text-xs font-black shadow-lg shadow-indigo-100">
              FF
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">FinFlow</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  pathname === link.href 
                    ? "text-primary bg-indigo-50" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4 animate-in slide-in-from-right duration-500">
                <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-200">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-[10px] text-primary font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-bold text-slate-700">{user.name.split(' ')[0]}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    clearSession();
                    setUser(null);
                    router.push("/login");
                  }}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-sm font-bold text-slate-500 hover:text-slate-900 px-4 py-2 transition-colors">
                  Login
                </Link>
                <Link href="/register">
                    <Button size="md">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
