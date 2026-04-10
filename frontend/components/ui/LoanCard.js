import React from 'react';
import RiskBadge from './RiskBadge';
import FundingProgress from './FundingProgress';

const LoanCard = ({ loan, onInvest }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md hover:border-blue-100 flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{loan.purpose || "Personal Loan"}</h3>
          <p className="text-sm text-gray-500">ID: {loan.id.substring(0, 8)}</p>
        </div>
        <RiskBadge grade={loan.riskGrade} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-xs text-gray-400 uppercase font-semibold">Interest Rate</p>
          <p className="text-xl font-bold text-gray-900">{loan.interestRate}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase font-semibold">Tenure</p>
          <p className="text-xl font-bold text-gray-900">{loan.termMonths} Months</p>
        </div>
      </div>

      <div className="mb-6 flex-grow">
        <FundingProgress funded={loan.fundedAmount || 0} total={loan.amount} />
      </div>

      <div className="mt-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
              {loan.borrower?.name?.charAt(0) || "B"}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800">{loan.borrower?.name || "Anonymous"}</p>
              <p className="text-[10px] text-gray-400">Score: {loan.borrower?.creditScore || "N/A"}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase font-bold">Estimated ROI</p>
            <p className="text-sm font-bold text-green-600">{loan.expectedReturn || "N/A"}%</p>
          </div>
        </div>

        <button 
          onClick={() => onInvest(loan)}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-sm active:transform active:scale-[0.98]"
        >
          Invest Now
        </button>
      </div>
    </div>
  );
};

export default LoanCard;
