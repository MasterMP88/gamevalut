/** ES256 JWT for Apple MusicKit, signed with WebCrypto (works on the edge runtime). */
const b64url = (buf: ArrayBuffer | Uint8Array) => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const enc = (o: unknown) => b64url(new TextEncoder().encode(JSON.stringify(o)));

export async function signDeveloperToken({ teamId, keyId, pem, ttlSeconds }: { teamId: string; keyId: string; pem: string; ttlSeconds: number }) {
  const body = pem.replace(/-----[^-]+-----/g, "").replace(/\\n/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const now = Math.floor(Date.now() / 1000);
  const input = `${enc({ alg: "ES256", kid: keyId })}.${enc({ iss: teamId, iat: now, exp: now + ttlSeconds })}`;
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(input));
  return `${input}.${b64url(sig)}`;
}
