import { AppLink } from '@/components/AppLink';
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
            <AppLink
              href={link.href}
              className="text-muted"
              external
            >
              {link.label}
            </AppLink>
          </span>
        ))}
      </div>
    </footer>
  );
}
