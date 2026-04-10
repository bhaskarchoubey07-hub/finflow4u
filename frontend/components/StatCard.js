export default function StatCard({ label, value, trend, symbol = "₹" }) {
  return (
    <div className="stat-card p-6 flex flex-col gap-1">
      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-black text-slate-900 mr-0.5">{symbol}</span>
        <span className="stat-value text-indigo-950">{value}</span>
      </div>
      {trend && (
        <div className={`mt-2 text-[10px] font-bold px-2 py-1 rounded-full w-fit border ${
          trend.startsWith('+') || trend.includes('↑') 
            ? 'text-emerald-600 bg-emerald-50 border-emerald-100/50' 
            : 'text-rose-600 bg-rose-50 border-rose-100/50'
        }`}>
          {trend}
        </div>
      )}
    </div>
  );
}


