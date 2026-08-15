import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { reportError } from "../lib/errors";

/**
 * The last line of defence — growth-plan item 21.
 *
 * The app had no error boundary at all, which meant any thrown render unmounted
 * the whole tree and left a white page. On a terminal that is worse than a
 * visible error: a blank screen is indistinguishable from "the market is
 * closed" or "my connection dropped", so it does not even get reported.
 *
 * Deliberately a class component — `getDerivedStateFromError` has no hook
 * equivalent, and React has not shipped one.
 */
interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    reportError("render", error.message, `${error.stack || ""}\n--- component stack ---${info.componentStack || ""}`);
  }

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div role="alert" style={{
        minHeight: "60vh", display: "grid", placeItems: "center",
        padding: 24, textAlign: "center",
      }}>
        <div style={{ maxWidth: 460 }}>
          <div className="mono" style={{
            fontSize: 10, letterSpacing: "0.16em", color: "var(--faint)", marginBottom: 12,
          }}>
            SOMETHING BROKE
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 10px" }}>
            This panel failed to render.
          </h1>
          {/* Say plainly that it was reported. The alternative is a user who
              assumes nobody knows and never tells us either. */}
          <p style={{ color: "var(--muted)", fontSize: 13.5, lineHeight: 1.6, margin: "0 0 18px" }}>
            The error has been logged automatically. Your data and watchlist are
            unaffected — nothing was lost.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="chip" onClick={() => this.setState({ error: null })}>
              TRY AGAIN
            </button>
            <button className="chip" onClick={() => { window.location.href = "/"; }}>
              BACK TO THE WORLD MAP
            </button>
          </div>
          {/* The message, not the stack. Enough for a user to quote in a bug
              report, not so much that it reads as a crash dump. */}
          <p className="mono" style={{
            marginTop: 20, fontSize: 10, color: "var(--faint)", wordBreak: "break-word",
          }}>
            {error.message}
          </p>
        </div>
      </div>
    );
  }
}
