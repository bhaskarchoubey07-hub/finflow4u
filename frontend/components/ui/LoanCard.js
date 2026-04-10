import React from 'react';
import RiskBadge from './RiskBadge';
import FundingProgress from './FundingProgress';

const LoanCard = ({ loan, onInvest }) => {
  return (
    <div className="panel p-5 flex flex-col h-full group hover:border-indigo-400/50 transition-all duration-300">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              {loan.purpose || "Personal Loan"}
            </h3>
            {loan.riskGrade === 'A' && (
              <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded tracking-tighter uppercase">Trending</span>
            )}
          </div>
          <p className="text-[10px] font-medium text-slate-400">ID: {loan.id.substring(0, 8)}</p>
        </div>
        <RiskBadge grade={loan.riskGrade} />
      </div>

      <div className="grid grid-cols-2 gap-4 py-3 border-y border-indigo-50/50 mb-6">
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Yield</span>
          <span className="text-lg font-extrabold text-indigo-600">{loan.interestRate}%</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Term</span>
          <span className="text-lg font-extrabold text-slate-800">{loan.termMonths} Mo</span>
        </div>
      </div>

      <div className="mb-6 flex-grow">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Funding Stage</span>
          <span className="text-xs font-bold text-indigo-600">{Math.round((loan.fundedAmount / loan.amount) * 100)}%</span>
        </div>
        <FundingProgress funded={loan.fundedAmount || 0} total={loan.amount} />
      </div>

      <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
        <div className="flex flex-col">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Available</p>
          <p className="text-sm font-black text-slate-900 leading-tight">₹{(loan.amount - (loan.fundedAmount || 0)).toLocaleString()}</p>
        </div>
        <button 
          onClick={() => onInvest(loan)}
          className="primary-button !py-2 !px-6 !text-xs group-hover:scale-[1.05]"
        >
          Invest Now
        </button>
      </div>
    </div>
  );
};


export default LoanCard;
