import { useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { GLOSSARY, glossaryBySlug, type Term } from "../data/glossary";
import { useSeo } from "../lib/seo";
import { useReveal } from "../lib/useReveal";

/**
 * Educational glossary — growth-plan item 103.
 *
 * Definition queries are evergreen, informational, and mostly contested by thin
 * content farms, which makes them the cheapest durable organic traffic in
 * finance. `/glossary` is the hub; each term gets its own indexable route.
 *
 * Item 100 warns that thin programmatic pages get penalised, so every entry
 * carries a real definition, a worked example with numbers, the common mistake,
 * and links to related terms — plus DefinedTerm structured data so the
 * definition is machine-readable.
 */

const CATEGORIES = ["Markets", "Analysis", "Instruments", "Risk"] as const;

export default function Glossary() {
  const { slug } = useParams();
  const term = slug ? glossaryBySlug(slug) : undefined;
  return slug && term ? <TermPage term={term} /> : <Index missing={Boolean(slug && !term)} />;
}

function Index({ missing }: { missing: boolean }) {
  useSeo({
    title: "Markets Glossary — Plain-English Definitions",
    description:
      "Clear definitions of the terms that actually matter when reading markets — breadth, spreads, drawdown, yield and more, each with a worked example.",
    path: "/glossary",
  });
  const gridRef = useReveal<HTMLDivElement>(".gl-card");

  const byCategory = useMemo(
    () => CATEGORIES.map((c) => ({ c, items: GLOSSARY.filter((t) => t.category === c) })),
    [],
  );

  return (
    <div className="gl">
      <header className="gl-head">
        <span className="label">Glossary</span>
        <h1>The words, without the fog.</h1>
        <p>
          {GLOSSARY.length} terms that change how you read a chart — each with a
          plain definition, a worked example, and the mistake most people make.
        </p>
        {missing && (
          <p className="gl-missing">That term isn’t in the glossary yet — here’s everything that is.</p>
        )}
      </header>

      <div ref={gridRef}>
        {byCategory.map(({ c, items }) => (
          <section key={c} className="gl-section">
            <h2 className="gl-cat">{c}</h2>
            <div className="gl-grid">
              {items.map((t) => (
                <Link key={t.slug} to={`/glossary/${t.slug}`} className="gl-card">
                  <b>{t.term}</b>
                  <p>{t.short}</p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function TermPage({ term }: { term: Term }) {
  const navigate = useNavigate();
  useSeo({
    title: `${term.term} — Definition & Example`,
    description: term.short,
    path: `/glossary/${term.slug}`,
  });

  return (
    <article className="gl gl-term">
      {/* DefinedTerm markup: the definition itself becomes machine-readable,
          which is what a glossary page is for. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "DefinedTerm",
            name: term.term,
            description: term.short,
            inDefinedTermSet: { "@type": "DefinedTermSet", name: "GFT Markets Glossary" },
          }),
        }}
      />

      <button className="chip" onClick={() => navigate("/glossary")}>← Glossary</button>

      <header className="gl-head">
        <span className="label">{term.category}</span>
        <h1>{term.term}</h1>
        <p className="gl-short">{term.short}</p>
      </header>

      <div className="gl-body">
        <p>{term.body}</p>

        <div className="gl-box">
          <span className="label">Worked example</span>
          <p>{term.example}</p>
        </div>

        {term.pitfall && (
          <div className="gl-box warn">
            <span className="label">The common mistake</span>
            <p>{term.pitfall}</p>
          </div>
        )}

        {term.related.length > 0 && (
          <div className="gl-related">
            <span className="label">Related</span>
            <div>
              {term.related
                .map((r) => glossaryBySlug(r))
                .filter((t): t is Term => Boolean(t))
                .map((t) => (
                  <Link key={t.slug} to={`/glossary/${t.slug}`} className="chip">{t.term}</Link>
                ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
