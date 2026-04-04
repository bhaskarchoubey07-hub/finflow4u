import Link from "next/link";
import Header from "../components/Header";
import { API_URL } from "../lib/api";

export const metadata = {
  title: "Home | LendGrid Infrastructure",
  description: "Marketplace Lending Infrastructure. Fund borrowers faster. Price risk smarter. Track returns clearly.",
};

const benefits = [
  "Risk-tiered underwriting with transparent pricing",
  "Marketplace discovery with expected return visibility",
  "EMI scheduling, repayment tracking, and default escalation"
];

export default function HomePage() {
  return (
    <main>
      <Header />
      <section className="hero shell">
        <div className="hero-copy">
          <span className="eyebrow">Marketplace Lending Infrastructure</span>
          <h1>Fund borrowers faster. Price risk smarter. Track returns clearly.</h1>
          <p>
            LendGrid is a production-ready peer-to-peer lending platform with borrower onboarding,
            lender portfolio tools, automated credit scoring, and repayment intelligence.
          </p>
          <div className="hero-actions">
            <Link href="/register" className="primary-button">
              Launch platform
            </Link>
            <Link href="/marketplace" className="ghost-button">
              Explore marketplace
            </Link>
          </div>
          <div className="inline-note">Backend API target: {API_URL}</div>
        </div>

        <div className="hero-panel">
          <div className="hero-metric">
            <span>Average APR</span>
            <strong>8.5% - 16.75%</strong>
          </div>
          <div className="hero-metric">
            <span>Funding flow</span>
            <strong>Borrower - Marketplace - Lender</strong>
          </div>
          <ul className="benefit-list">
            {benefits.map((benefit) => (
              <li key={benefit}>{benefit}</li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
