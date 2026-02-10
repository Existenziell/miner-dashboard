export default function DocumentationPage() {
  return (
    <div className="space-y-8 max-w-3xl">
      <section>
        <h2 className="text-lg font-semibold text-btc-orange mb-2">Solo mining via a pool</h2>
        <p className="text-fg dark:text-fg-dark text-sm leading-relaxed mb-2">
          Solo mining means you mine blocks on your own: when your miner finds a valid block, you receive the full block reward (plus fees) instead of sharing it with other miners. To do that without running a full node, you connect to a <strong>solo pool</strong>.
        </p>
        <p className="text-fg dark:text-fg-dark text-sm leading-relaxed mb-2">
          The pool gives you work (block templates) and validates your shares, but it does not merge your hashrate with others. You are still competing for the next block; the pool just handles the Stratum protocol and block template distribution. Configure your miner with the pool’s Stratum URL and your payout address to start solo mining.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-btc-orange mb-2">Hardware</h2>
        <p className="text-fg dark:text-fg-dark text-sm leading-relaxed mb-2">
          This dashboard is built for <strong>NerdQaxe++</strong>-compatible ASIC miners. Typical setup:
        </p>
        <ul className="list-disc list-inside text-fg dark:text-fg-dark text-sm leading-relaxed space-y-1 mb-2">
          <li><strong>ASIC</strong> — SHA-256 mining hardware (e.g. S21, S19 series, or other NerdQaxe++-supported units).</li>
          <li><strong>Power</strong> — Adequate PSU and circuit capacity; miners can draw hundreds of watts.</li>
          <li><strong>Cooling</strong> — Good airflow and ambient temperature to keep ASIC and VR temps within safe limits (monitor via this dashboard).</li>
          <li><strong>Network</strong> — Miner and dashboard host must reach the pool’s Stratum server (and optionally mempool.space for network stats).</li>
        </ul>
        <p className="text-fg dark:text-fg-dark text-sm leading-relaxed">
          Set the miner’s IP in the dashboard settings (or <code className="px-1.5 py-0.5 rounded bg-surface-light dark:bg-surface-light-dark text-btc-orange text-xs">.env</code>) so the backend can poll status and show hashrate, temperature, power, and fan data.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-btc-orange mb-2">Stratum</h2>
        <p className="text-fg dark:text-fg-dark text-sm leading-relaxed mb-2">
          <strong>Stratum</strong> is the standard protocol used between mining hardware (or mining software) and a pool or solo mining service. Over TCP (often with TLS), the pool sends:
        </p>
        <ul className="list-disc list-inside text-fg dark:text-fg-dark text-sm leading-relaxed space-y-1 mb-2">
          <li><strong>mining.notify</strong> — New work (job): block template, merkle root, target, etc.</li>
          <li><strong>mining.set_difficulty</strong> — Difficulty for share validation.</li>
        </ul>
        <p className="text-fg dark:text-fg-dark text-sm leading-relaxed mb-2">
          The miner submits <strong>mining.submit</strong> with a share (nonce, job id, etc.). The pool replies with accept/reject. For solo mining, the pool still uses Stratum; when your share meets the full block difficulty, it’s a block and you get the reward.
        </p>
        <p className="text-fg dark:text-fg-dark text-sm leading-relaxed">
          Configure your miner with the pool’s Stratum endpoint (e.g. <code className="px-1.5 py-0.5 rounded bg-surface-light dark:bg-surface-light-dark text-btc-orange text-xs">stratum+tcp://pool.example.com:3333</code> or <code className="px-1.5 py-0.5 rounded bg-surface-light dark:bg-surface-light-dark text-btc-orange text-xs">stratum+ssl://...</code>) and your Bitcoin address. The dashboard does not replace Stratum; it only monitors the miner’s status and the Bitcoin network.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-btc-orange mb-2">Dashboard vs miner vs pool</h2>
        <ul className="list-disc list-inside text-fg dark:text-fg-dark text-sm leading-relaxed space-y-1">
          <li><strong>Miner (ASIC)</strong> — Does the hashing; connects to the pool via Stratum; exposes a local API for stats (hashrate, temp, power, etc.).</li>
          <li><strong>Pool (solo)</strong> — Sends work and validates shares/blocks; pays out block rewards to your address when you find a block.</li>
          <li><strong>This dashboard</strong> — Reads miner status from the miner’s API and shows network data (e.g. from mempool.space). It does not talk Stratum or replace pool configuration.</li>
        </ul>
      </section>
    </div>
  );
}
