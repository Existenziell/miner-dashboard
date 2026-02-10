export default function StatCard({ label, value, sub, color = 'text-accent' }) {
  return (
    <div className="card hover:border-accent/20 transition-colors">
      <div className="text-muted-standalone text-sm font-medium mb-2">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-muted-standalone text-xs mt-1">{sub}</div>}
    </div>
  );
}
