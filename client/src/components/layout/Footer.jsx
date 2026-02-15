export default function Footer() {
    return (
        <footer className="border-t border-default mt-8 py-4">
            <div className="max-w-7xl mx-auto px-4 text-center text-muted dark:text-muted-dark text-xs">
              Solo Mining Dashboard ·{' '}
              <a
                href="https://bitcoindev.info/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted dark:text-muted-dark hover:text-body transition-colors"
              >
                BitcoinDev
              </a>
            </div>
        </footer>
    );
}
