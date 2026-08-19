import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTerminal } from "../store";

/**
 * Saved views — growth-plan item 77.
 *
 * A view is the current route plus the two layout toggles, not a serialised
 * component tree. That choice is deliberate: a saved layout that breaks the
 * first time the page is redesigned is worse than none, and a route survives
 * any redesign.
 */
export default function SavedViews() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const views = useTerminal((s) => s.savedViews);
  const saveView = useTerminal((s) => s.saveView);
  const removeView = useTerminal((s) => s.removeView);
  const nerdMode = useTerminal((s) => s.nerdMode);
  const setNerdMode = useTerminal((s) => s.setNerdMode);
  const highDensity = useTerminal((s) => s.highDensity);
  const setHighDensity = useTerminal((s) => s.setHighDensity);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const apply = (v: (typeof views)[number]) => {
    setNerdMode(v.nerdMode);
    setHighDensity(v.highDensity);
    navigate(v.path);
    setOpen(false);
  };

  return (
    <div className="sv">
      <button className="nav-tour" title="Saved views" aria-expanded={open} onClick={() => setOpen((v) => !v)}>◫</button>
      {open && (
        <div className="sv-menu" role="menu">
          <div className="sv-head">SAVED VIEWS</div>
          {views.length === 0 && <p className="sv-empty">None yet. Save the current page and its layout to come back to it.</p>}
          {views.map((v) => (
            <div key={v.id} className="sv-row">
              <button className="sv-open" onClick={() => apply(v)}>
                <b>{v.name}</b>
                <span>{v.path}{v.nerdMode ? " · nerd" : ""}{v.highDensity ? " · dense" : ""}</span>
              </button>
              <button className="sv-x" onClick={() => removeView(v.id)} aria-label={`Delete ${v.name}`}>×</button>
            </div>
          ))}
          <form
            className="sv-add"
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              saveView({ name: name.trim(), path: pathname + search, nerdMode, highDensity });
              setName("");
            }}
          >
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name this view…" />
            <button className="chip" type="submit" disabled={!name.trim()}>SAVE</button>
          </form>
        </div>
      )}
    </div>
  );
}
