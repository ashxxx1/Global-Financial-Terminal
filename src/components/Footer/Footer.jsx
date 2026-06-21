export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__disclaimer">
        <span className="footer__warning-icon">⚠</span>
        <span className="footer__disclaimer-text">
          <strong>DISCLAIMER:</strong> Global Financial Terminal is a simulated platform for educational and demonstration purposes only. The information and data provided on this platform do not constitute investment, financial, trading, tax, or legal advice. Trading financial instruments involves significant risk.
        </span>
      </div>
      <div className="footer__version">
        GFT-SECURE · v0.1.1
      </div>
    </footer>
  );
}
