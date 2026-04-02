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
    ...(user?.role === "ADMIN" ? [{ href: "/admin", label: "Admin" }] : [])
  ];

  return (
    <header className="shell header">
      <Link className="brand" href="/">
        LendGrid
      </Link>

      <nav className="nav">
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
          <>
            <span className="user-chip">
              {user.name} | {user.role}
            </span>
            <button
              className="ghost-button"
              onClick={() => {
                clearSession();
                setUser(null);
                router.push("/login");
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link className="ghost-button" href="/login">
              Login
            </Link>
            <Link className="primary-button small" href="/register">
              Register
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
