"use client";

import React from 'react';
import { Card, Badge, Progress } from './Core';
import Button from './Button';

const LoanCard = ({ loan, onInvest }) => {
  const getRiskColor = (grade) => {
    switch (grade) {
      case 'A': return 'success';
      case 'B': return 'info';
      case 'C': return 'warning';
      case 'D': return 'danger';
      default: return 'neutral';
    }
  };

  const fundingPercent = Math.min(((loan.amount - (loan.remainingAmount || 0)) / loan.amount) * 100, 100);

  return (
    <Card className="flex flex-col h-full bg-white p-6 justify-between group">
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h4 className="text-lg font-bold text-slate-900 leading-none">₹{Number(loan.amount).toLocaleString()}</h4>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{loan.purpose || "Business Capital"}</p>
          </div>
          <Badge variant={getRiskColor(loan.riskGrade)}>Grade {loan.riskGrade}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ROI (Expected)</p>
            <p className="text-sm font-black text-slate-900">{loan.interestRate}% APR</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Term</p>
            <p className="text-sm font-black text-slate-900">{loan.term || 12} Months</p>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-black text-slate-500 uppercase">Funding Progress</span>
            <span className="text-xs font-black text-primary">{Math.round(fundingPercent)}%</span>
          </div>
          <Progress value={fundingPercent} />
        </div>
      </div>

      <div className="mt-8">
        <Button 
          className="w-full h-11" 
          variant={fundingPercent >= 100 ? 'outline' : 'primary'}
          disabled={fundingPercent >= 100}
          onClick={() => onInvest(loan)}
        >
          {fundingPercent >= 100 ? 'Fully Funded' : 'Invest Now'}
        </Button>
      </div>
    </Card>
  );
};

export default LoanCard;
