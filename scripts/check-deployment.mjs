/** No credentials, purchases or successful webhook events. Verifies the exact
 * deployed app, rejection of unsigned input and public-page delivery. */
import assert from "node:assert/strict";
const origin = new URL(
  process.argv[2] || "https://nocturne-games-for-two.lovable.app",
);
if (
  origin.protocol !== "https:" &&
  !["localhost", "127.0.0.1"].includes(origin.hostname)
)
  throw new Error("Use HTTPS outside local development");
const checks = [];
const request = (p, options = {}) =>
  fetch(new URL(p, origin), {
    ...options,
    signal: AbortSignal.timeout(15000),
    redirect: "error",
  });
for (const path of ["/", "/gang", "/privatsphaere", "/sitemap.xml"]) {
  try {
    const res = await request(path);
    assert.equal(res.status, 200);
    const body = await res.text();
    assert.ok(body.length > 100);
    checks.push({ path, pass: true });
  } catch {
    checks.push({ path, pass: false });
  }
}
try {
  const res = await request("/api/public/health");
  assert.equal(res.status, 200);
  const health = await res.json();
  assert.equal(health.app, "nocturne");
  assert.equal(health.release, "operations-2026-10-26");
  if (process.argv.includes("--expect-payments"))
    assert.equal(health.payments, "enabled");
  checks.push({
    path: "/api/public/health",
    pass: true,
    release: health.release,
    payments: health.payments,
  });
} catch {
  checks.push({ path: "/api/public/health", pass: false });
}
try {
  const res = await request("/api/public/stripe/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  assert.equal(res.status, 400);
  assert.equal(await res.text(), "Invalid signature");
  checks.push({
    path: "/api/public/stripe/webhook",
    pass: true,
    unsignedRejected: true,
  });
} catch {
  checks.push({ path: "/api/public/stripe/webhook", pass: false });
}
console.log(
  JSON.stringify(
    {
      origin: origin.origin,
      checkedAt: new Date().toISOString(),
      checks,
      limitation:
        "Does not certify signed delivery, payment fulfillment, real devices or human playtests.",
    },
    null,
    2,
  ),
);
if (checks.some((c) => !c.pass)) process.exitCode = 1;
