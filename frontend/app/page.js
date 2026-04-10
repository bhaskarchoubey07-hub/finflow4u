import Link from "next/link";
import Button from "../components/ui/Button";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-primary text-xs font-bold uppercase tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Next-Gen P2P Infrastructure
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              The Operating System for <br />
              <span className="text-primary">Institutional Lending.</span>
            </h1>
            
            <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
              Scale your capital deployment with AI-powered risk scoring, automated EMI management, and institutional-grade portfolio analytics.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto h-14 px-10 text-base">
                  Launch Platform
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-10 text-base">
                  Explore Marketplace
                </Button>
              </Link>
            </div>
            
            {/* Social Proof / Stats */}
            <div className="pt-16 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-slate-100">
              <div className="space-y-1">
                <p className="text-3xl font-black text-slate-900">₹24.8M+</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Capital Managed</p>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-black text-slate-900">12.2%</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Weighted ROI</p>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-black text-slate-900">0.82%</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Default Rate</p>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-black text-slate-900">Tier A-D</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Risk Graded</p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 -z-0 opacity-20 pointer-events-none translate-x-1/4 -translate-y-1/4">
           <div className="w-[800px] h-[800px] rounded-full bg-gradient-to-br from-indigo-200 to-sky-100 blur-3xl"></div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="bg-white py-32 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-primary">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Lightning Underwriting</h3>
              <p className="text-slate-500 font-medium">Get credit decisions in milliseconds using our advanced behavioral ML analysis engine.</p>
            </div>
            
            <div className="space-y-4">
              <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center text-secondary">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Institutional Trust</h3>
              <p className="text-slate-500 font-medium">Secured with enterprise-grade encryption and audited financial reporting for all stakeholders.</p>
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Seamless Liquidity</h3>
              <p className="text-slate-500 font-medium">Deposit capital and start earning yield instantly with our automated portfolio distribution tools.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
