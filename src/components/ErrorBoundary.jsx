import { Component } from "react";

/**
 * Catches render/runtime errors in the tree below it and shows a fallback
 * instead of a blank white page. Reset returns to the app after a fix/reload.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("UI crash caught by ErrorBoundary:", error, info?.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          background: "#05070d",
          color: "#c9bea3",
          fontFamily: "'JetBrains Mono', monospace",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "20px", color: "#f5b13d", letterSpacing: "0.1em" }}>
          ⚠ SOMETHING WENT WRONG
        </div>
        <div style={{ fontSize: "12px", maxWidth: "440px", lineHeight: 1.6, color: "#7a7360" }}>
          A part of the terminal hit an error. Your data is safe. Try reloading — if it
          keeps happening, let us know what you were doing.
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: "8px",
            padding: "10px 22px",
            background: "rgba(245, 177, 61,0.12)",
            border: "1px solid rgba(245, 177, 61,0.4)",
            borderRadius: "4px",
            color: "#f0e6d2",
            fontFamily: "inherit",
            fontSize: "12px",
            letterSpacing: "0.08em",
            cursor: "pointer",
          }}
        >
          ↻ RELOAD TERMINAL
        </button>
      </div>
    );
  }
}
