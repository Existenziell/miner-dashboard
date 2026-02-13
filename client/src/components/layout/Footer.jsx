export default function Footer() {
    return (
        <footer className="border-t border-default mt-8 py-4">
            <div className="max-w-7xl mx-auto px-4 text-center text-muted-standalone text-xs">
              Solo Mining Dashboard ·{' '}
              <a
                href="https://bitcoindev.info/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-standalone hover:text-foreground transition-colors"
              >
                BitcoinDev
              </a>
            </div>
        </footer>
    );
}
