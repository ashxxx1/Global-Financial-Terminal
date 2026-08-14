import { useSeo } from "../lib/seo";
import { SITE_NAME, LEGAL_ENTITY, LEGAL_UPDATED } from "../lib/site";
import { SUPPORT_EMAIL } from "../lib/support";
import { Section } from "./Terms";

/**
 * Privacy Policy — growth-plan item 10 (GDPR + CCPA).
 *
 * Describes the data we genuinely process today: Firebase Auth identity,
 * a single Firestore profile document, local watchlist/alert state, and
 * consent-gated PostHog analytics. Written to match the controls that actually
 * exist in the product (export + delete, item 13; consent banner, item 11) so
 * the policy and the software cannot drift apart.
 *
 * NOT LEGAL ADVICE. Template for lawyer review — see YOUR-TASKS.md item 5.
 */
export default function Privacy() {
  useSeo({
    title: "Privacy Policy",
    description: `What data ${SITE_NAME} collects, why, how long it is kept, and how to export or delete it.`,
    path: "/privacy",
  });

  return (
    <div className="cl">
      <header className="cl-head">
        <span className="label" style={{ color: "var(--cyan)" }}>LEGAL</span>
        <h1>Privacy Policy</h1>
        <p>Last updated {LEGAL_UPDATED}. What we collect, why, and how to get rid of it.</p>
      </header>

      <div className="ds-note">
        <b>The short version.</b> We collect the minimum needed to run an
        account: your email, your watchlist, and — only if you agree — anonymous
        product analytics. We do not sell your data. You can download everything
        or delete it permanently from the account menu, at any time.
      </div>

      <div className="legal">
        <Section n="1" title="Who is responsible">
          <p>
            {LEGAL_ENTITY} is the data controller for {SITE_NAME}. For any
            privacy question or request, contact{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
          </p>
        </Section>

        <Section n="2" title="What we collect">
          <ul>
            <li><b>Account data</b> — your email address, display name and (if you sign in with Google) your profile photo URL. Handled by Firebase Authentication.</li>
            <li><b>Your app data</b> — watchlist symbols, price alerts, and onboarding preferences. Stored in your browser, and in a single profile document keyed to your user ID.</li>
            <li><b>Product analytics</b> — counts of which features you use, stored on your own account record and, if a provider is configured, also sent to PostHog. <b>Only collected if you accept analytics.</b> Because these counters live on your account document, they are included in your data export and are erased with your account.</li>
            <li><b>Support and feedback</b> — anything you voluntarily type into the feedback widget or send us by email.</li>
          </ul>
          <p>
            We do <b>not</b> collect payment card details, government identifiers,
            brokerage credentials, or any financial account information. We never
            ask for them, and you should never send them to us.
          </p>
        </Section>

        <Section n="3" title="Why we process it (lawful basis)">
          <ul>
            <li><b>To provide the service</b> — performance of a contract with you (account, watchlist, alerts).</li>
            <li><b>To improve the product</b> — your consent, which you give or withhold in the cookie banner and can change at any time.</li>
            <li><b>To keep the service secure</b> — our legitimate interest in preventing abuse.</li>
          </ul>
        </Section>

        <Section n="4" title="Cookies and tracking">
          <p>
            Strictly necessary storage (your login session and local preferences)
            is always active. Analytics is <b>off until you accept it</b>; if you
            decline or ignore the banner, no analytics events are sent at all. We
            do not run advertising trackers or sell data to ad networks.
          </p>
        </Section>

        <Section n="5" title="Who we share it with">
          <p>We use a small number of processors, and share only what each needs to function:</p>
          <ul>
            <li><b>Google Firebase</b> — authentication and profile storage.</li>
            <li><b>Vercel</b> — hosting and request logs.</li>
            <li><b>PostHog</b> — product analytics, only with your consent.</li>
          </ul>
          <p>We do not sell personal information, and we do not share it for cross-context behavioural advertising.</p>
        </Section>

        <Section n="6" title="How long we keep it">
          <p>
            Account and app data are kept until you delete your account, at which
            point the profile document and the authentication record are removed.
            Analytics events are retained by PostHog under their standard
            retention. Deletion is immediate and cannot be undone.
          </p>
        </Section>

        <Section n="7" title="Your rights">
          <p>
            Depending on where you live (including under the <b>GDPR</b> in the
            EU/UK and the <b>CCPA/CPRA</b> in California) you have the right to
            access, correct, delete, restrict or object to the processing of your
            data, to data portability, and to withdraw consent at any time. You
            will never be discriminated against for exercising these rights.
          </p>
          <p>
            <b>Two of these are self-service.</b> Open the account menu (your
            avatar, top right) to <b>export a full copy of your data</b> as JSON,
            or to <b>permanently delete your account</b>. For anything else,
            email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> and we
            will respond within 30 days.
          </p>
        </Section>

        <Section n="8" title="International transfers">
          <p>
            Our processors operate globally, so your data may be processed
            outside your country, including in the United States. Where required,
            transfers rely on the appropriate safeguards offered by those
            providers.
          </p>
        </Section>

        <Section n="9" title="Children">
          <p>
            The service is not directed at children, and we do not knowingly
            collect data from anyone under 16. If you believe a child has given
            us data, contact us and we will delete it.
          </p>
        </Section>

        <Section n="10" title="Security">
          <p>
            Access to your profile document is restricted to your own
            authenticated user ID by database security rules. Traffic is served
            over HTTPS. No system is perfectly secure, so please use a strong,
            unique password.
          </p>
        </Section>

        <Section n="11" title="Changes to this policy">
          <p>
            We will update the “last updated” date above whenever this policy
            changes, and will flag material changes in the product.
          </p>
        </Section>
      </div>

      <footer className="cl-foot">
        Want a copy of your data or want it erased? Both are one click away in
        the account menu — or email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </footer>
    </div>
  );
}
