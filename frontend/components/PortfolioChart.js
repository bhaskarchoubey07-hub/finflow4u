"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#0f766e", "#0ea5e9", "#f59e0b"];

export default function PortfolioChart({ investments = [] }) {
  const data = investments.slice(0, 3).map((investment) => ({
    name: investment.loan.borrower.name,
    value: Number(investment.amountInvested)
  }));

  if (!data.length) {
    return <div className="empty-card">No investments yet.</div>;
  }

  return (
    <div className="chart-card">
      <h3>Allocation Snapshot</h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
