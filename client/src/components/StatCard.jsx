export default function StatCard({ label, value, sub, color = 'text-btc-orange' }) {
  return (
    <div className="card hover:border-btc-orange/20 transition-colors">
      <div className="text-muted dark:text-muted-dark text-sm font-medium mb-2">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-muted dark:text-muted-dark text-xs mt-1">{sub}</div>}
    </div>
  );
}
