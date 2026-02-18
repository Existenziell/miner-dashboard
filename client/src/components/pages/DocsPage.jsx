import { SOLO_POOLS } from '@/lib/constants';
import AppLink from '@/components/AppLink';
import Image from '@/components/Image';

export default function DocsPage() {
  return (
    <div className="doc-page card mx-auto">
      <section className="doc-section">
        <h2 className="doc-heading">About this dashboard</h2>
        <div className="doc-prose">
          <p className="doc-body">
            This app monitors a <strong>NerdQaxe++</strong>-compatible ASIC miner and the Bitcoin network in real time. It shows hashrate, temperature, power, shares, and network stats.
            Set the miner IP and expected hashrate in{' '}
            <AppLink href="/?tab=settings&section=setup">
              Setup
            </AppLink>{' '}
            so gauges and alerts are adapted to your miner capabilities. For API endpoints and server config, see the{' '}
            <AppLink href="/?tab=api">
              API
            </AppLink>{' '}
            tab.
          </p>
        </div>
      </section>

      <section className="doc-section">
        <h2 className="doc-heading">Solo mining via a pool</h2>
        <div className="doc-prose">
          <p className="doc-body">
            Solo mining means you mine blocks on your own: when your miner finds a valid block, you receive the full block reward (plus fees) instead of sharing it with other miners. To do that without running a full node, you connect to a <strong>solo pool</strong>.
          </p>
          <p className="doc-body">
            The pool gives you work (block templates) and validates your shares, but it does not merge your hashrate with others. You are still competing for the next block; the pool just handles the Stratum protocol and block template distribution. Configure your miner with the pool's Stratum URL and your payout address to start solo mining.
          </p>
          <Image src="/images/miner.jpg" alt="NerdQaxe++ miner" className="my-4" />
        </div>
        <div className="overflow-x-auto doc-table-wrap">
          <p className="doc-lead-in">Known solo mining pools:</p>
          <table className="doc-pools-table">
            <thead>
              <tr>
                <th className="doc-th doc-th--compact">Pool</th>
                <th className="doc-th doc-th--compact">Stratum host</th>
                <th className="doc-th doc-th--compact">Port</th>
                <th className="doc-th doc-th--compact">TLS</th>
                <th className="doc-th doc-th--compact">Fee</th>
                <th className="doc-th doc-th--compact">Registration</th>
                <th className="doc-th doc-th--compact">Region</th>
                <th className="doc-th doc-th--compact">Worker format</th>
                <th className="doc-th doc-th--compact">Notes</th>
              </tr>
            </thead>
            <tbody>
              {SOLO_POOLS.map((pool) => (
                <tr key={pool.identifier}>
                  <td className="doc-td doc-td--compact">
                    <AppLink href={pool.webUrl} external>
                      {pool.name}
                    </AppLink>
                  </td>
                  <td className="doc-td doc-td--compact"><code className="code-inline">{pool.stratumHost}</code></td>
                  <td className="doc-td doc-td--compact">{pool.port}</td>
                  <td className="doc-td doc-td--compact">{pool.tls ? 'Yes' : 'No'}</td>
                  <td className="doc-td doc-td--compact">{pool.fee ?? '—'}</td>
                  <td className="doc-td doc-td--compact">{pool.registration ?? '—'}</td>
                  <td className="doc-td doc-td--compact">{pool.region ?? '—'}</td>
                  <td className="doc-td doc-td--compact">{pool.workerFormat ?? '—'}</td>
                  <td className="doc-td doc-td--compact">{pool.notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="doc-section">
        <h2 className="doc-heading">Hardware</h2>
        <div className="doc-prose">
          <p className="doc-body">
            This dashboard is built for <strong>NerdQaxe++</strong>-compatible ASIC miners. Typical setup:
          </p>
          <ul className="doc-list">
            <li><strong>ASIC</strong>: SHA-256 mining hardware (e.g. S21, S19 series, or other NerdQaxe++-supported units).</li>
            <li><strong>Power</strong>: Adequate PSU and circuit capacity; miners can draw hundreds of watts.</li>
            <li><strong>Cooling</strong>: Good airflow and ambient temperature to keep ASIC and VR temps within safe limits (monitor via this dashboard).</li>
            <li><strong>Network</strong>: Miner and dashboard host must reach the pool's Stratum server (and optionally mempool.space for network stats).</li>
          </ul>
          <p className="doc-body">
            Set the miner&apos;s IP in{' '}
            <AppLink href="/?tab=settings&section=setup">
              Settings → Setup
            </AppLink>{' '}
            (or <code className="code-inline">.env</code>) so the backend can poll status and show hashrate, temperature, power, and fan data.
          </p>
          <p className="doc-body">
            <AppLink href="https://github.com/shufps/qaxe" external>NerdQ Hardware Repository</AppLink>
          </p>
        </div>
        <Image src="/images/asic.jpg" alt="BM1370 ASIC" className="my-4" />
      </section>

      <section className="doc-section">
        <h2 className="doc-heading">Stratum</h2>
        <div className="doc-prose">
          <p className="doc-body">
            <strong>Stratum</strong> is the standard protocol used between mining hardware (or mining software) and a pool or solo mining service. Over TCP (often with TLS), the pool sends:
          </p>
          <ul className="doc-list">
            <li><strong>mining.notify</strong>: New work (job): block template, merkle root, target, etc.</li>
            <li><strong>mining.set_difficulty</strong>: Difficulty for share validation.</li>
          </ul>
          <p className="doc-body">
            The miner submits <strong>mining.submit</strong> with a share (nonce, job id, etc.). The pool replies with accept/reject. For solo mining, the pool still uses Stratum; when your share meets the full block difficulty, it's a block and you get the reward.
          </p>
          <p className="doc-body">
            Configure your miner with the pool's Stratum endpoint (e.g. <code className="code-inline">stratum+tcp://pool.example.com:3333</code> or <code className="code-inline">stratum+ssl://...</code>) and your Bitcoin address. The dashboard does not replace Stratum; it only monitors the miner's status and the Bitcoin network.
          </p>
        </div>
      </section>

      <section className="doc-section">
        <h2 className="doc-heading">Shares and blocks</h2>
        <div className="doc-prose">
          <p className="doc-body">
            The dashboard shows <strong>Shares &amp; Performance</strong>: accepted/rejected shares, best difficulty, and pool difficulty. In solo mining, the pool still asks for shares at a lower difficulty (proof of work). When a share meets the <strong>full block difficulty</strong>, it is a valid block and you receive the full block reward (currently 3.125 BTC plus fees). Until then, shares are just evidence of hashing; the dashboard helps you monitor reject rate and connectivity (e.g. ping RTT/loss).
          </p>
          <p className="doc-body">
            <strong>Network difficulty</strong> adjusts roughly every 2,016 blocks (~2 weeks). Higher difficulty means more hashes needed per block; your expected time to find a block depends on your hashrate and the network hashrate (often quoted in EH/s).
          </p>
        </div>
      </section>

      <section className="doc-section">
        <h2 className="doc-heading">Conversions</h2>
        <h3 className="doc-subheading">Hash rate</h3>
        <div className="doc-prose">
          <p className="doc-body">
            Hash rate is how many double-SHA256 hashes per second the hardware can try. Units use the same prefixes as SI (×1000 per step):
          </p>
        </div>
        <div className="overflow-x-auto doc-table-wrap">
          <table className="doc-table">
            <thead>
              <tr>
                <th className="doc-th">Unit</th>
                <th className="doc-th">Name</th>
                <th className="doc-th">10ⁿ (H/s)</th>
                <th className="doc-th">Equals</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="doc-td"><strong>H/s</strong></td><td className="doc-td">Hashes/second</td><td className="doc-td">10⁰</td><td className="doc-td">1 H/s</td></tr>
              <tr><td className="doc-td"><strong>kH/s</strong></td><td className="doc-td">Kilo</td><td className="doc-td">10³</td><td className="doc-td">1,000 H/s</td></tr>
              <tr><td className="doc-td"><strong>MH/s</strong></td><td className="doc-td">Mega</td><td className="doc-td">10⁶</td><td className="doc-td">1,000,000 H/s</td></tr>
              <tr><td className="doc-td"><strong>GH/s</strong></td><td className="doc-td">Giga</td><td className="doc-td">10⁹</td><td className="doc-td">1,000,000,000 H/s</td></tr>
              <tr><td className="doc-td"><strong>TH/s</strong></td><td className="doc-td">Tera</td><td className="doc-td">10¹²</td><td className="doc-td">1,000,000,000,000 H/s</td></tr>
              <tr><td className="doc-td"><strong>PH/s</strong></td><td className="doc-td">Peta</td><td className="doc-td">10¹⁵</td><td className="doc-td">1,000,000,000,000,000 H/s</td></tr>
              <tr><td className="doc-td"><strong>EH/s</strong></td><td className="doc-td">Exa</td><td className="doc-td">10¹⁸</td><td className="doc-td">1,000,000,000,000,000,000 H/s</td></tr>
              <tr><td className="doc-td"><strong>ZH/s</strong></td><td className="doc-td">Zetta</td><td className="doc-td">10²¹</td><td className="doc-td">1,000,000,000,000,000,000,000 H/s</td></tr>
              <tr><td className="doc-td"><strong>YH/s</strong></td><td className="doc-td">Yotta</td><td className="doc-td">10²⁴</td><td className="doc-td">1,000,000,000,000,000,000,000,000 H/s</td></tr>
            </tbody>
          </table>
        </div>
        <h3 className="doc-subheading">Electrical basics</h3>
        <div className="overflow-x-auto doc-table-wrap">
          <table className="doc-table">
            <thead>
              <tr>
                <th className="doc-th">Quantity</th>
                <th className="doc-th">Formula</th>
                <th className="doc-th">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="doc-td"><strong>Power (watts)</strong></td>
                <td className="doc-td"><code className="code-inline">P = U × I</code></td>
                <td className="doc-td">Power = voltage × current (also written <code className="code-inline">P = V × I</code>). Unit: <strong>W</strong>.</td>
              </tr>
              <tr>
                <td className="doc-td"><strong>Efficiency</strong></td>
                <td className="doc-td"><strong>W/TH</strong>, <strong>J/TH</strong></td>
                <td className="doc-td">Power per unit hashrate. Lower is better.</td>
              </tr>
              <tr>
                <td className="doc-td"><strong>Energy</strong></td>
                <td className="doc-td"><code className="code-inline">E = P × t</code></td>
                <td className="doc-td">Energy = power × time. 1 kWh = 1,000 W for 1 hour. Your bill is in kWh.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
