export default function StatCard({ label, value }) {
  return (
    <div className="stat-card p-6 flex flex-col gap-1">
      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="stat-value text-indigo-950">{value}</span>
      </div>
      <div className="mt-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full w-fit border border-emerald-100/50">
        ↑ 12% since last month
      </div>
    </div>
  );
}

