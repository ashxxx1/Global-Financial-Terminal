import { useSeo } from "../lib/seo";
import { SITE_NAME, LEGAL_ENTITY, LEGAL_UPDATED } from "../lib/site";
import { SUPPORT_EMAIL } from "../lib/support";

/**
 * Terms of Service — growth-plan item 9.
 *
 * Written against what the product actually does today: it serves market
 * information, some of it simulated, to signed-in users for free. It does not
 * execute trades, hold funds, or give advice. The disclaimers are deliberately
 * blunt because this is a finance-adjacent product and vagueness is what gets
 * these companies in trouble.
 *
 * NOT LEGAL ADVICE. This is a template for a lawyer to review before any money
 * changes hands — see YOUR-TASKS.md item 5.
 */
export default function Terms() {
  useSeo({
    title: "Terms of Service",
    description: `The terms governing your use of ${SITE_NAME} — what the service is, what it is not, and the limits of what you can rely on it for.`,
    path: "/terms",
  });

  return (
    <div className="cl">
      <header className="cl-head">
        <span className="label" style={{ color: "var(--cyan)" }}>LEGAL</span>
        <h1>Terms of Service</h1>
        <p>Last updated {LEGAL_UPDATED}. Plain language, because you should actually be able to read this.</p>
      </header>

      <div className="ds-note">
        <b>The short version.</b> {SITE_NAME} shows you market information, some
        of which is simulated and clearly labelled as such. It is not advice, it
        is not a broker, and you must not trade on it without verifying the
        numbers elsewhere.
      </div>

      <div className="legal">
        <Section n="1" title="Who we are">
          <p>
            {SITE_NAME} (“we”, “us”) is operated by {LEGAL_ENTITY}. You can reach
            us at <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
          </p>
        </Section>

        <Section n="2" title="What the service is">
          <p>
            We provide an information and visualisation tool for global markets:
            an interactive globe, country dashboards, instrument pages, charts,
            watchlists, price alerts and news aggregation.
          </p>
        </Section>

        <Section n="3" title="What the service is not">
          <ul>
            <li><b>Not investment advice.</b> Nothing here is a recommendation to buy, sell or hold anything. We are not a licensed financial adviser, broker or dealer.</li>
            <li><b>Not a trading venue.</b> You cannot execute orders, transfer funds or hold assets with us.</li>
            <li><b>Not a real-time market feed.</b> Data may be delayed, incomplete, cached or simulated. See our <a href="/data-sources">data sources</a> page for exactly which is which.</li>
          </ul>
        </Section>

        <Section n="4" title="Simulated data">
          <p>
            Parts of this product display <b>deterministic simulated values</b>{" "}
            rather than real market data. These are always labelled{" "}
            <span className="ds-inline sim">SIM</span>,{" "}
            <span className="ds-inline sim">SIMULATED</span> or{" "}
            <span className="ds-inline demo">DEMO</span> in the interface. They
            exist so the product is usable while we license more data. You must
            not treat them as real prices under any circumstances.
          </p>
        </Section>

        <Section n="5" title="Your account">
          <p>
            You are responsible for keeping your login credentials secure and for
            everything done through your account. You must be old enough to form
            a binding contract where you live. You can export your data or delete
            your account at any time from the account menu.
          </p>
        </Section>

        <Section n="6" title="Acceptable use">
          <p>You agree not to:</p>
          <ul>
            <li>scrape, republish or resell the data we display, in bulk or systematically;</li>
            <li>attempt to breach, overload or probe the service or its infrastructure;</li>
            <li>use the service unlawfully, or to mislead others about the nature of the data.</li>
          </ul>
        </Section>

        <Section n="7" title="Third-party data and links">
          <p>
            Market data, news headlines and event feeds originate with third
            parties named on our <a href="/data-sources">data sources</a> page. We
            do not control and are not responsible for their accuracy, timeliness
            or availability, nor for the content of any site we link to.
          </p>
        </Section>

        <Section n="8" title="Availability">
          <p>
            The service is provided “as is” and “as available”. We do not promise
            uninterrupted access, and we may change, suspend or discontinue any
            part of it. We will give reasonable notice of material changes where
            we practically can.
          </p>
        </Section>

        <Section n="9" title="Limitation of liability">
          <p>
            To the maximum extent permitted by law, we are not liable for any
            trading or investment losses, lost profits, or indirect or
            consequential damages arising from your use of the service or from
            reliance on any figure displayed in it. Nothing in these terms
            excludes liability that cannot lawfully be excluded.
          </p>
        </Section>

        <Section n="10" title="Changes to these terms">
          <p>
            We may update these terms. The “last updated” date above always
            reflects the current version, and continued use after a change means
            you accept it.
          </p>
        </Section>

        <Section n="11" title="Governing law">
          <p>
            The governing law and jurisdiction for these terms are to be
            confirmed before any paid service is offered.
          </p>
        </Section>
      </div>

      <footer className="cl-foot">
        <b>Nothing on this site is investment advice.</b> Market data may be
        delayed, incomplete or simulated, and must not be relied on for trading
        decisions. Questions? <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
      </footer>
    </div>
  );
}

export function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="legal-sec">
      <h2><span className="legal-n">{n}</span>{title}</h2>
      {children}
    </section>
  );
}
