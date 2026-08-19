import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTerminal } from "../store";
import { subscribe, quoteFor, metaFor } from "../lib/market";
import { useSeo } from "../lib/seo";

/**
 * Watchlist depth — growth-plan item 75.
 *
 * The rail's watchlist is a glance surface and should stay that way. This is
 * the working one: notes on why a name is here, tags to group by theme, a
 * target price with the distance to it computed, and several named lists.
 *
 * The note is the point. A watchlist without one is a list of tickers whose
 * reasons you have already forgotten.
 */
export default function Watchlist() {
  const navigate = useNavigate();
  const watchlist = useTerminal((s) => s.watchlist);
  const updateWatch = useTerminal((s) => s.updateWatch);
  const removeWatch = useTerminal((s) => s.removeWatch);
  const lists = useTerminal((s) => s.watchLists);
  const addWatchList = useTerminal((s) => s.addWatchList);
  const removeWatchList = useTerminal((s) => s.removeWatchList);
  const activeList = useTerminal((s) => s.activeList);
  const setActiveList = useTerminal((s) => s.setActiveList);

  useSeo({
    title: "Watchlist — notes, tags and target prices",
    description: "Track the companies you care about with notes on why, tags to group them, and target prices with live distance.",
    path: "/watchlist",
  });

  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((t) => t + 1)), []);
  const [editing, setEditing] = useState<string | null>(null);
  const [newList, setNewList] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const shown = useMemo(
    () => watchlist.filter((w) => (activeList ? w.listId === activeList : true))
      .filter((w) => (tagFilter ? (w.tags ?? []).includes(tagFilter) : true)),
    [watchlist, activeList, tagFilter],
  );

  const allTags = useMemo(() => {
    const t = new Set<string>();
    for (const w of watchlist) for (const x of w.tags ?? []) t.add(x);
    return [...t].sort();
  }, [watchlist]);

  return (
    <div style={{ padding: 18, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Watchlist</h1>
        <span className="label" style={{ color: "var(--faint)" }}>{shown.length} of {watchlist.length}</span>
      </div>

      <div className="wl-lists">
        <button className={`chip ${activeList === null ? "active" : ""}`} onClick={() => setActiveList(null)}>ALL</button>
        {lists.map((l) => (
          <span key={l.id} className="wl-list-chip">
            <button className={`chip ${activeList === l.id ? "active" : ""}`} onClick={() => setActiveList(l.id)}>{l.name}</button>
            <button className="wl-x" onClick={() => removeWatchList(l.id)} aria-label={`Delete list ${l.name}`}>×</button>
          </span>
        ))}
        <form
          onSubmit={(e) => { e.preventDefault(); if (newList.trim()) { addWatchList(newList.trim()); setNewList(""); } }}
          style={{ display: "flex", gap: 6 }}
        >
          <input className="wl-new" value={newList} onChange={(e) => setNewList(e.target.value)} placeholder="New list…" />
          <button className="chip" type="submit" disabled={!newList.trim()}>ADD LIST</button>
        </form>
      </div>

      {allTags.length > 0 && (
        <div className="wl-tags">
          <button className={`wl-tag ${tagFilter === null ? "on" : ""}`} onClick={() => setTagFilter(null)}>all tags</button>
          {allTags.map((t) => (
            <button key={t} className={`wl-tag ${tagFilter === t ? "on" : ""}`} onClick={() => setTagFilter(tagFilter === t ? null : t)}>{t}</button>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <div className="panel" style={{ padding: 22 }}>
          <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
            Nothing here yet. Open any company and use ☆ Watch, then come back to add
            a note on why you are watching it.
          </p>
        </div>
      ) : (
        <div className="panel" style={{ overflow: "hidden" }}>
          <table className="tbl">
            <thead>
              <tr><th>Symbol</th><th className="num">Price</th><th className="num">1D</th><th className="num">Target</th><th>Note & tags</th><th /></tr>
            </thead>
            <tbody>
              {shown.map((w) => {
                const q = quoteFor(w.symbol);
                const meta = metaFor(w.symbol);
                const toTarget = q && w.targetPrice ? ((w.targetPrice - q.price) / q.price) * 100 : null;
                const open = editing === w.symbol;
                return (
                  <tr key={w.symbol}>
                    <td>
                      <button className="pf-sym" onClick={() => navigate(`/stock/${w.symbol}`)}>{w.symbol}</button>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>{w.name}</div>
                    </td>
                    <td className="num">{q ? q.display : "—"}</td>
                    <td className="num" style={{ color: q && q.changePct >= 0 ? "var(--up)" : "var(--down)" }}>
                      {q ? `${q.changePct >= 0 ? "+" : ""}${q.changePct.toFixed(2)}%` : "—"}
                    </td>
                    <td className="num">
                      {w.targetPrice
                        ? <>
                            {meta?.currency}{w.targetPrice}
                            {toTarget !== null && (
                              <div style={{ fontSize: 10, color: "var(--faint)" }}>
                                {toTarget >= 0 ? "+" : ""}{toTarget.toFixed(1)}% away
                              </div>
                            )}
                          </>
                        : <span style={{ color: "var(--faint)" }}>—</span>}
                    </td>
                    <td style={{ maxWidth: 320 }}>
                      {open ? (
                        <WatchEditor item={w} lists={lists} onDone={() => setEditing(null)} onSave={(patch) => updateWatch(w.symbol, patch)} />
                      ) : (
                        <div>
                          {w.note ? <div style={{ fontSize: 12, lineHeight: 1.5 }}>{w.note}</div>
                            : <span style={{ fontSize: 11.5, color: "var(--faint)" }}>No note yet.</span>}
                          {(w.tags ?? []).length > 0 && (
                            <div style={{ marginTop: 4, display: "flex", gap: 4, flexWrap: "wrap" }}>
                              {(w.tags ?? []).map((t) => <span key={t} className="wl-tagchip">{t}</span>)}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="num" style={{ whiteSpace: "nowrap" }}>
                      <button className="chip" onClick={() => setEditing(open ? null : w.symbol)}>{open ? "DONE" : "EDIT"}</button>
                      <button className="chip" onClick={() => removeWatch(w.symbol)} aria-label={`Remove ${w.symbol}`}>×</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function WatchEditor({ item, lists, onSave, onDone }: {
  item: ReturnType<typeof useTerminal.getState>["watchlist"][number];
  lists: ReturnType<typeof useTerminal.getState>["watchLists"];
  onSave: (patch: { note?: string; tags?: string[]; targetPrice?: number; listId?: string }) => void;
  onDone: () => void;
}) {
  const [note, setNote] = useState(item.note ?? "");
  const [tags, setTags] = useState((item.tags ?? []).join(", "));
  const [target, setTarget] = useState(item.targetPrice ? String(item.targetPrice) : "");
  const [listId, setListId] = useState(item.listId ?? "");

  const commit = () => {
    const n = Number(target);
    onSave({
      note: note.trim() || undefined,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      targetPrice: Number.isFinite(n) && n > 0 ? n : undefined,
      listId: listId || undefined,
    });
    onDone();
  };

  return (
    <div className="wl-edit">
      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Why are you watching this?" />
      <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="tags, comma separated" />
      <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="target price" inputMode="decimal" />
      {lists.length > 0 && (
        <select value={listId} onChange={(e) => setListId(e.target.value)}>
          <option value="">Default list</option>
          {lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      )}
      <button className="chip" onClick={commit}>SAVE</button>
    </div>
  );
}
