import { SOLO_POOLS } from '../lib/constants';

/** Solo pool fee by identifier (for documentation table only). */
const POOL_FEE_BY_ID = {
  ocean: '2%',
  ckpool: '2%',
  'ckpool-eu': '2%',
  'ckpool-oceania': '2%',
  viabtc: '1%',
  'public-pool': '0%',
  'solo-pool-eu': '1%',
  'solopool-org': '2%',
  kano: '0.9%',
  braiins: '0.5%',
};

/** Registration: No signup (address-only) vs Account required. */
const POOL_REGISTRATION_BY_ID = {
  ocean: 'No signup',
  ckpool: 'No signup',
  'ckpool-eu': 'No signup',
  'ckpool-oceania': 'No signup',
  viabtc: 'Account required',
  'public-pool': 'No signup',
  'solo-pool-eu': 'No signup',
  'solopool-org': 'No signup',
  kano: 'No signup',
  braiins: 'No signup',
};

/** Region / server location. */
const POOL_REGION_BY_ID = {
  ocean: 'Global',
  ckpool: 'Americas',
  'ckpool-eu': 'EU',
  'ckpool-oceania': 'Oceania',
  viabtc: 'Global',
  'public-pool': 'Global',
  'solo-pool-eu': 'EU',
  'solopool-org': 'EU',
  kano: 'Global',
  braiins: 'Global',
};

/** Worker / username format. */
const POOL_WORKER_FORMAT_BY_ID = {
  ocean: 'Address or Address.Worker',
  ckpool: 'Address or Address.Worker',
  'ckpool-eu': 'Address or Address.Worker',
  'ckpool-oceania': 'Address or Address.Worker',
  viabtc: 'user.worker (account)',
  'public-pool': 'Address.Worker, password x',
  'solo-pool-eu': 'Address or Address.Worker',
  'solopool-org': 'Address or Address.RIG_ID',
  kano: 'username.worker (register first)',
  braiins: 'Address or Address.Worker',
};

/** Short notes per pool. */
const POOL_NOTES_BY_ID = {
  ocean: 'Alternate template ports available.',
  ckpool: '—',
  'ckpool-eu': '—',
  'ckpool-oceania': '—',
  viabtc: 'Set solo mode in pool dashboard.',
  'public-pool': 'TLS on port 4333.',
  'solo-pool-eu': 'Instant coinbase payout.',
  'solopool-org': 'Low-end port (250K diff); 7005, 9005 for higher hashrate.',
  kano: '0.9% solo fee.',
  braiins: '0.5% solo fee; stats at solo.braiins.com.',
};

export default function DocumentationPage() {

  return (
    <div className="doc-page space-y-8 card mx-auto text-lg px-8!">
      <section>
        <h2 className="text-2xl font-semibold mb-2">Solo mining via a pool</h2>
        <p className="doc-body mb-2">
          Solo mining means you mine blocks on your own: when your miner finds a valid block, you receive the full block reward (plus fees) instead of sharing it with other miners. To do that without running a full node, you connect to a <strong>solo pool</strong>.
        </p>
        <p className="doc-body mb-2">
          The pool gives you work (block templates) and validates your shares, but it does not merge your hashrate with others. You are still competing for the next block; the pool just handles the Stratum protocol and block template distribution. Configure your miner with the pool’s Stratum URL and your payout address to start solo mining.
        </p>
        <p className="doc-body mb-1">Known solo mining pools:</p>
        <div className="overflow-x-auto my-2">
          <table className="doc-pools-table w-full doc-body border border-gray-300 dark:border-gray-600 text-left">
            <thead>
              <tr className="border-b border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800">
                <th className="p-2 font-semibold">Pool</th>
                <th className="p-2 font-semibold">Stratum host</th>
                <th className="p-2 font-semibold">Port</th>
                <th className="p-2 font-semibold">TLS</th>
                <th className="p-2 font-semibold">Fee</th>
                <th className="p-2 font-semibold">Registration</th>
                <th className="p-2 font-semibold">Region</th>
                <th className="p-2 font-semibold">Worker format</th>
                <th className="p-2 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody>
              {SOLO_POOLS.map((pool) => (
                <tr key={pool.identifier} className="border-b border-gray-200 dark:border-gray-600">
                  <td className="p-2">
                    <a href={pool.webUrl} target="_blank" rel="noopener noreferrer" className="font-medium no-underline! hover:underline">
                      {pool.name}
                    </a>
                  </td>
                  <td className="p-2"><code className="code-inline">{pool.stratumHost}</code></td>
                  <td className="p-2">{pool.port}</td>
                  <td className="p-2">{pool.tls ? 'Yes' : 'No'}</td>
                  <td className="p-2">{POOL_FEE_BY_ID[pool.identifier] ?? '—'}</td>
                  <td className="p-2">{POOL_REGISTRATION_BY_ID[pool.identifier] ?? '—'}</td>
                  <td className="p-2">{POOL_REGION_BY_ID[pool.identifier] ?? '—'}</td>
                  <td className="p-2">{POOL_WORKER_FORMAT_BY_ID[pool.identifier] ?? '—'}</td>
                  <td className="p-2">{POOL_NOTES_BY_ID[pool.identifier] ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">Hardware</h2>
        <p className="doc-body mb-2">
          This dashboard is built for <strong>NerdQaxe++</strong>-compatible ASIC miners. Typical setup:
        </p>
        <ul className="list-disc list-inside doc-body space-y-1 mb-2">
          <li><strong>ASIC</strong>: SHA-256 mining hardware (e.g. S21, S19 series, or other NerdQaxe++-supported units).</li>
          <li><strong>Power</strong>: Adequate PSU and circuit capacity; miners can draw hundreds of watts.</li>
          <li><strong>Cooling</strong>: Good airflow and ambient temperature to keep ASIC and VR temps within safe limits (monitor via this dashboard).</li>
          <li><strong>Network</strong>: Miner and dashboard host must reach the pool's Stratum server (and optionally mempool.space for network stats).</li>
        </ul>
        <p className="doc-body">
          Set the miner's IP in the dashboard settings (or <code className="code-inline">.env</code>) so the backend can poll status and show hashrate, temperature, power, and fan data.
        </p>
        <p className="doc-body mt-2">
          <a href="https://github.com/shufps/qaxe" target="_blank" rel="noopener noreferrer" className="hover:underline">NerdQ Hardware Repository</a>
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">Stratum</h2>
        <p className="doc-body mb-2">
          <strong>Stratum</strong> is the standard protocol used between mining hardware (or mining software) and a pool or solo mining service. Over TCP (often with TLS), the pool sends:
        </p>
        <ul className="list-disc list-inside doc-body space-y-1 mb-2">
          <li><strong>mining.notify</strong>: New work (job): block template, merkle root, target, etc.</li>
          <li><strong>mining.set_difficulty</strong>: Difficulty for share validation.</li>
        </ul>
        <p className="doc-body mb-2">
          The miner submits <strong>mining.submit</strong> with a share (nonce, job id, etc.). The pool replies with accept/reject. For solo mining, the pool still uses Stratum; when your share meets the full block difficulty, it’s a block and you get the reward.
        </p>
        <p className="doc-body">
          Configure your miner with the pool’s Stratum endpoint (e.g. <code className="code-inline">stratum+tcp://pool.example.com:3333</code> or <code className="code-inline">stratum+ssl://...</code>) and your Bitcoin address. The dashboard does not replace Stratum; it only monitors the miner’s status and the Bitcoin network.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">Conversions</h2>
        <h3 className="text-xl font-medium mb-2 mt-4">Hash rate</h3>
        <p className="doc-body mb-2">
          Hash rate is how many double-SHA256 hashes per second the hardware can try. Units use the same prefixes as SI (×1000 per step):
        </p>
        <div className="overflow-x-auto mb-2">
          <table className="w-full doc-body border border-gray-300 dark:border-gray-600 text-left">
            <thead>
              <tr className="border-b border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800">
                <th className="p-2 font-semibold">Unit</th>
                <th className="p-2 font-semibold">Name</th>
                <th className="p-2 font-semibold">10ⁿ (H/s)</th>
                <th className="p-2 font-semibold">Equals</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200 dark:border-gray-600"><td className="p-2"><strong>H/s</strong></td><td className="p-2">hashes per second</td><td className="p-2">10⁰</td><td className="p-2">1 H/s</td></tr>
              <tr className="border-b border-gray-200 dark:border-gray-600"><td className="p-2"><strong>kH/s</strong></td><td className="p-2">kilo</td><td className="p-2">10³</td><td className="p-2">1,000 H/s</td></tr>
              <tr className="border-b border-gray-200 dark:border-gray-600"><td className="p-2"><strong>MH/s</strong></td><td className="p-2">mega</td><td className="p-2">10⁶</td><td className="p-2">1,000,000 H/s</td></tr>
              <tr className="border-b border-gray-200 dark:border-gray-600"><td className="p-2"><strong>GH/s</strong></td><td className="p-2">giga</td><td className="p-2">10⁹</td><td className="p-2">1,000,000,000 H/s</td></tr>
              <tr className="border-b border-gray-200 dark:border-gray-600"><td className="p-2"><strong>TH/s</strong></td><td className="p-2">tera</td><td className="p-2">10¹²</td><td className="p-2">1,000,000,000,000 H/s</td></tr>
              <tr className="border-b border-gray-200 dark:border-gray-600"><td className="p-2"><strong>PH/s</strong></td><td className="p-2">peta</td><td className="p-2">10¹⁵</td><td className="p-2">1,000,000,000,000,000 H/s</td></tr>
            </tbody>
          </table>
        </div>
        <h3 className="text-xl font-medium mb-2 mt-6">Electrical basics</h3>
        <div className="overflow-x-auto">
          <table className="w-full doc-body border border-gray-300 dark:border-gray-600 text-left">
            <thead>
              <tr className="border-b border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800">
                <th className="p-2 font-semibold">Quantity</th>
                <th className="p-2 font-semibold">Formula</th>
                <th className="p-2 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200 dark:border-gray-600">
                <td className="p-2"><strong>Power (watts)</strong></td>
                <td className="p-2"><code className="code-inline">P = U × I</code></td>
                <td className="p-2">Power = voltage × current (also written <code className="code-inline">P = V × I</code>). Unit: <strong>W</strong>.</td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-600">
                <td className="p-2"><strong>Efficiency</strong></td>
                <td className="p-2"><strong>W/TH</strong>, <strong>J/TH</strong></td>
                <td className="p-2">Power per unit hashrate. Lower is better.</td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-600">
                <td className="p-2"><strong>Energy</strong></td>
                <td className="p-2"><code className="code-inline">E = P × t</code></td>
                <td className="p-2">Energy = power × time. 1 kWh = 1,000 W for 1 hour. Your bill is in kWh.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
