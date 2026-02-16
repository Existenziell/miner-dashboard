const FOOTER_LINKS = [
  { href: 'https://bitcoindev.info/', label: 'BitcoinDev' },
  { href: 'https://mempool.space/', label: 'mempool.space' },
];

export default function Footer() {
  return (
    <footer className="border-t border-default mt-8 py-4">
      <div className="max-w-7xl mx-auto px-4 text-center text-muted text-xs">
        Solo Mining Dashboard
        {FOOTER_LINKS.map((link) => (
          <span key={link.href}>
            {' · '}
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-normal transition-colors"
            >
              {link.label}
            </a>
          </span>
        ))}
      </div>
    </footer>
  );
}
