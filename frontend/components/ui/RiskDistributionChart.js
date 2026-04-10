import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const RiskDistributionChart = ({ investments = [] }) => {
  // Aggregate investments by risk grade
  const distribution = investments.reduce((acc, inv) => {
    const grade = inv.loan.riskGrade || 'U'; // U for unknown
    const amount = Number(inv.amountInvested);
    acc[grade] = (acc[grade] || 0) + amount;
    return acc;
  }, {});

  const data = Object.keys(distribution).map(grade => ({
    name: `Grade ${grade}`,
    value: distribution[grade]
  })).sort((a, b) => a.name.localeCompare(b.name));

  const COLORS = {
    'Grade A': '#22c55e',
    'Grade B': '#3b82f6',
    'Grade C': '#eab308',
    'Grade D': '#ef4444',
    'Grade U': '#9ca3af'
  };

  if (data.length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
           <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
           </svg>
        </div>
        <h3 className="text-gray-900 font-bold">No Allocation Yet</h3>
        <p className="text-xs text-gray-400 mt-1 max-w-[150px]">Start investing to see your portfolio risk distribution.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-full">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Risk Distribution</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#3b82f6'} />
              ))}
            </Pie>
            <Tooltip 
               contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
               formatter={(value) => `$${Number(value).toLocaleString()}`}
            />
            <Legend verticalAlign="bottom" height={36}/>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RiskDistributionChart;
