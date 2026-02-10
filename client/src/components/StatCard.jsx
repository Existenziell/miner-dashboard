export default function StatCard({ label, value, sub, color = 'text-btc-orange' }) {
  return (
    <div className="bg-surface-card rounded-xl p-5 border border-[var(--c-border)] hover:border-btc-orange/20 transition-colors">
      <div className="text-text-secondary text-sm font-medium mb-2">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-text-secondary text-xs mt-1">{sub}</div>}
    </div>
  );
}
