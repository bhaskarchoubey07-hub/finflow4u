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
    <main className="min-h-screen bg-[#fafafa]">
      <Header />
      <div className="relative overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-indigo-200 to-emerald-200 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
        </div>
        
        <section className="page-shell pt-24 pb-32 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-7 space-y-10 animate-in slide-in-from-left duration-1000">
            <div>
              <span className="eyebrow bg-indigo-50 text-indigo-600 border border-indigo-100 mb-6">Marketplace Lending v2.0</span>
              <h1 className="text-6xl font-black tracking-tight text-slate-900 leading-[0.95] mb-8">
                Institutional Lending <span className="text-indigo-600">Infrastructure.</span>
              </h1>
              <p className="text-xl text-slate-500 font-medium max-w-2xl leading-relaxed">
                FinFlow is an industry-grade P2P ecosystem with real-time risk simulation, 
                automated repayment intelligence, and high-fidelity lender tools.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-6">
              <Link href="/register" className="primary-button !py-4 !px-10 !text-base shadow-indigo-100">
                Launch Platform
              </Link>
              <Link href="/marketplace" className="ghost-button !py-4 !px-10 !text-base !border-indigo-100 !text-indigo-600 hover:!bg-indigo-50">
                Explore Exchange
              </Link>
            </div>
            
            <div className="pt-10 border-t border-slate-100 flex items-center gap-8">
               <div className="flex flex-col">
                  <span className="text-2xl font-black text-slate-900">8.5%</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target APR</span>
               </div>
               <div className="w-px h-10 bg-slate-100"></div>
               <div className="flex flex-col">
                  <span className="text-2xl font-black text-slate-900">140ms</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Risk Scoring</span>
               </div>
               <div className="w-px h-10 bg-slate-100"></div>
               <div className="flex flex-col">
                  <span className="text-2xl font-black text-slate-900">Tier A-D</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Risk Allocation</span>
               </div>
            </div>
          </div>

          <div className="lg:col-span-5 animate-in zoom-in duration-1000">
            <div className="panel p-1 border-white/50 bg-white/30 backdrop-blur-3xl shadow-2xl relative">
              <div className="panel p-8 bg-indigo-950 text-white border-0 shadow-none overflow-hidden relative">
                 <div className="absolute top-0 right-0 p-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center font-black">AI</div>
                 </div>
                 <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Platform Stats</span>
                 <h3 className="text-4xl font-black mt-2 mb-8 tabular-nums">$24.8M</h3>
                 
                 <div className="space-y-5">
                    <div className="flex justify-between items-end border-b border-white/10 pb-3">
                       <span className="text-xs font-bold text-indigo-300 uppercase">Capital Deployed</span>
                       <span className="text-base font-black">$18,402,100</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/10 pb-3">
                       <span className="text-xs font-bold text-indigo-300 uppercase">Weighted ROI</span>
                       <span className="text-base font-black text-emerald-400">12.2%</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/10 pb-3">
                       <span className="text-xs font-bold text-indigo-300 uppercase">Default Exposure</span>
                       <span className="text-base font-black text-rose-400">0.82%</span>
                    </div>
                 </div>

                 <div className="mt-10 p-4 bg-white/5 border border-white/5 rounded-2xl text-xs font-medium text-indigo-200 leading-relaxed italic">
                    "Platform algorithms optimized for low-volatility yield preservation in high-interest environments."
                 </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

