"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession, getUser } from "../lib/auth";

export default function Header() {
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
    { href: "/lab", label: "FinLab" },
    ...(user?.role === "ADMIN" ? [{ href: "/admin", label: "Admin" }] : [])
  ];

  return (
    <header className="header">
      <div className="page-shell flex items-center justify-between w-full">
        <Link className="brand" href="/">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-black">FF</div>
          <span>FinFlow</span>
        </Link>
  
        <nav className="hidden md:flex items-center space-x-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname === link.href ? "nav-link active" : "nav-link"}
            >
              {link.label}
            </Link>
          ))}
        </nav>
  
        <div className="header-actions">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-full border border-indigo-100">
                <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-bold text-indigo-900">{user.name}</span>
              </div>
              <button
                className="ghost-button !py-1.5 !px-3 !text-xs"
                onClick={() => {
                  clearSession();
                  setUser(null);
                  router.push("/login");
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition" href="/login">
                Login
              </Link>
              <Link className="primary-button !py-2 !px-5" href="/register">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>

  );
}
