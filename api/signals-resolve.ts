/**
 * Vercel cron: resolve active GFT signals.
 */
export const config = { runtime: "edge" };

export default async function handler(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const backend = process.env.VITE_API_URL || process.env.API_URL;
  if (!backend) {
    return Response.json({
      ok: true,
      mode: "frontend-demo",
      note: "No backend URL configured — client resolves signals locally on load.",
    });
  }

  try {
    const r = await fetch(`${backend.replace(/\/$/, "")}/api/signals/jobs/resolve`, {
      method: "POST",
      headers: secret ? { authorization: `Bearer ${secret}` } : {},
    });
    const data = await r.json();
    return Response.json(data, { status: r.ok ? 200 : 502 });
  } catch (e: any) {
    return Response.json({ error: e?.message || "upstream_failed" }, { status: 502 });
  }
}
