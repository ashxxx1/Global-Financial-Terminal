/**
 * Deployment banner — growth-plan item 31.
 *
 * A Vercel preview URL is pixel-identical to production. Someone reading a
 * price off a staging build, or a teammate reviewing a branch, has no way to
 * tell — and on a market terminal that is a genuine hazard, not a cosmetic one.
 *
 * Renders nothing in production, which is the only state where silence is
 * correct.
 */

declare const __DEPLOY_ENV__: string;
declare const __DEPLOY_REF__: string;
declare const __DEPLOY_SHA__: string;

export default function EnvBanner() {
  const env = typeof __DEPLOY_ENV__ === "string" ? __DEPLOY_ENV__ : "development";
  if (env === "production") return null;

  const ref = typeof __DEPLOY_REF__ === "string" ? __DEPLOY_REF__ : "";
  const sha = typeof __DEPLOY_SHA__ === "string" ? __DEPLOY_SHA__ : "";
  const label = env === "preview" ? "PREVIEW BUILD" : "LOCAL BUILD";

  return (
    <div className="env-banner" role="status">
      <span className="env-banner-tag">{label}</span>
      <span>
        Not the live terminal. Data and accounts here are for testing.
        {ref && <> · <code>{ref}</code></>}
        {sha && <> · <code>{sha}</code></>}
      </span>
    </div>
  );
}
