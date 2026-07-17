export default function Footer() {
  return (
    <footer className="nx-footer">
      <div className="nx-footer__status">
        <span className="nx-footer__chip">
          <span className="nx-footer__chip-dot" />
          FEEDS ONLINE
        </span>
        <span style={{ color: "rgba(255,157,0,0.6)" }}>⚠</span>
        <span>
          Simulated platform · Not financial advice · Educational use only
        </span>
      </div>
      <div style={{ color: "rgba(63, 211, 232,0.45)", letterSpacing: "0.12em" }}>
        GLOBAL FINANCIAL TERMINAL · GFT-SECURE · v0.6.0
      </div>
    </footer>
  );
}
