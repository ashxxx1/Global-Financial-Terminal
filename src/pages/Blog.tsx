import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSeo, ogImageFor } from "../lib/seo";

/**
 * The blog — growth-plan items 101, 102 and 104.
 *
 * Posts are JSON produced by scripts/weekly-recap.mjs from the same feeds the
 * terminal runs on, so every figure is checkable against the live product. The
 * page renders them; it computes nothing, which keeps the numbers in one place
 * and stops the post and the terminal ever disagreeing.
 */

interface Row { label: string; meta: string; value: string; raw: number }
interface Section { heading: string; note: string; rows: Row[] }
interface Post {
  slug: string; title: string; date: string; kind: string; summary: string;
  sections: Section[]; takeaways: string[]; method: string; generatedAt: string;
}
type IndexEntry = Pick<Post, "slug" | "title" | "date" | "summary" | "kind">;

export default function Blog() {
  const { slug } = useParams();
  return slug ? <PostView slug={slug} /> : <BlogIndex />;
}

function BlogIndex() {
  const [posts, setPosts] = useState<IndexEntry[] | null>(null);
  useSeo({
    title: "Market notes — weekly data, computed not written",
    description: "Weekly market recaps generated from the same live feeds the terminal runs on. Every figure is checkable against the product.",
    path: "/blog",
  });

  useEffect(() => {
    let live = true;
    void fetch("/blog/index.json")
      .then((r) => (r.ok ? r.json() : []))
      .then((j) => { if (live) setPosts(Array.isArray(j) ? j : []); })
      .catch(() => { if (live) setPosts([]); });
    return () => { live = false; };
  }, []);

  return (
    <div style={{ padding: 18, maxWidth: 780, margin: "0 auto" }}>
      <h1 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 800 }}>Market notes</h1>
      <p className="blog-lede">
        Weekly recaps computed from the same feeds the terminal runs on — so every
        number here can be checked against the live product. They report what moved
        and stop there; attributing a market move needs evidence a generator does
        not have.
      </p>

      {posts === null && <p className="blog-empty">Loading…</p>}
      {posts?.length === 0 && (
        <p className="blog-empty">
          No posts yet. The first weekly recap publishes on Friday.
        </p>
      )}

      <div className="blog-list">
        {posts?.map((p) => (
          <Link key={p.slug} to={`/blog/${p.slug}`} className="blog-card">
            <span className="blog-date">{new Date(p.date).toUTCString().slice(5, 16)}</span>
            <span className="blog-title">{p.title}</span>
            <span className="blog-sum">{p.summary}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function PostView({ slug }: { slug: string }) {
  const [post, setPost] = useState<Post | null | "missing">(null);

  useEffect(() => {
    let live = true;
    // The slug lands in a URL, so it is constrained rather than trusted.
    if (!/^[a-z0-9-]{3,80}$/.test(slug)) { setPost("missing"); return; }
    void fetch(`/blog/${slug}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (live) setPost(j ?? "missing"); })
      .catch(() => { if (live) setPost("missing"); });
    return () => { live = false; };
  }, [slug]);

  const real = post && post !== "missing" ? post : null;
  useSeo({
    title: real?.title ?? "Market notes",
    description: real?.summary ?? "Weekly market data from Global Financial Terminal.",
    path: `/blog/${slug}`,
    image: real ? ogImageFor({ title: "Market notes", subtitle: real.summary.slice(0, 68), kind: "weekly" }) : undefined,
  });

  if (post === null) return <div style={{ padding: 40 }} className="blog-empty">Loading…</div>;
  if (post === "missing") {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h1 style={{ fontSize: 20, margin: "0 0 8px" }}>Post not found</h1>
        <p className="blog-empty"><Link to="/blog">Back to market notes →</Link></p>
      </div>
    );
  }

  return (
    <article style={{ padding: 18, maxWidth: 780, margin: "0 auto" }}>
      <Link to="/blog" className="chip" style={{ textDecoration: "none" }}>← ALL NOTES</Link>
      <h1 style={{ margin: "14px 0 6px", fontSize: 26, fontWeight: 800, lineHeight: 1.25 }}>{post.title}</h1>
      <div className="blog-meta">
        {new Date(post.date).toUTCString().slice(5, 16)} · generated{" "}
        {new Date(post.generatedAt).toISOString().slice(11, 16)} UTC
      </div>
      <p className="blog-summary">{post.summary}</p>

      {post.takeaways.length > 0 && (
        <ul className="blog-takeaways">
          {post.takeaways.map((t, i) => <li key={i}>{t}</li>)}
        </ul>
      )}

      {post.sections.map((s) => (
        <section key={s.heading} className="blog-section">
          <h2>{s.heading}</h2>
          <p className="blog-note">{s.note}</p>
          <table className="blog-table">
            <tbody>
              {[...s.rows].sort((a, b) => b.raw - a.raw).map((r) => (
                <tr key={r.label}>
                  <td>{r.label}{r.meta && <span className="blog-rowmeta">{r.meta}</span>}</td>
                  <td className="num" style={{ color: r.raw >= 0 ? "var(--up)" : "var(--down)" }}>{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}

      <section className="blog-method">
        <h2>How this was made</h2>
        <p>{post.method}</p>
      </section>
      <p className="blog-foot">Not investment advice. <Link to="/data-sources">How we source data →</Link></p>
    </article>
  );
}
