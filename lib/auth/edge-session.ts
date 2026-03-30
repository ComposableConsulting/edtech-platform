/**
 * Edge-compatible session management using Web Crypto API (no Node.js dependencies).
 * Replaces Firebase Admin SDK session cookies.
 */

const ALGO = { name: "HMAC", hash: "SHA-256" } as const;
const SESSION_DURATION_MS = 60 * 60 * 24 * 5 * 1000; // 5 days

export type SessionPayload = {
  uid: string;
  role: string;
  exp: number;
};

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    ALGO,
    false,
    ["sign", "verify"]
  );
}

function toBase64Url(buf: ArrayBuffer): string {
  return btoa(Array.from(new Uint8Array(buf), (b) => String.fromCharCode(b)).join(""))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function fromBase64Url(str: string): Uint8Array {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

export async function createSession(
  uid: string,
  role: string,
  secret: string
): Promise<string> {
  const payload: SessionPayload = { uid, role, exp: Date.now() + SESSION_DURATION_MS };
  const data = JSON.stringify(payload);
  const encoded = new TextEncoder().encode(data);
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign(ALGO, key, encoded);
  return `${btoa(data)}.${toBase64Url(sig)}`;
}

export async function verifySession(
  token: string,
  secret: string
): Promise<SessionPayload | null> {
  try {
    const dot = token.indexOf(".");
    if (dot === -1) return null;

    const encodedData = token.slice(0, dot);
    const encodedSig = token.slice(dot + 1);

    const data = atob(encodedData);
    const sig = fromBase64Url(encodedSig).buffer as ArrayBuffer;
    const key = await getKey(secret);

    const valid = await crypto.subtle.verify(
      ALGO,
      key,
      sig,
      new TextEncoder().encode(data)
    );
    if (!valid) return null;

    const payload = JSON.parse(data) as SessionPayload;
    if (payload.exp < Date.now()) return null; // expired

    return payload;
  } catch {
    return null;
  }
}

/** Verify a Firebase ID token via the Firebase Auth REST API. */
export async function verifyFirebaseIdToken(
  idToken: string,
  apiKey: string
): Promise<{ uid: string; email: string } | null> {
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { users?: Array<{ localId: string; email: string }> };
    const user = data.users?.[0];
    if (!user) return null;
    return { uid: user.localId, email: user.email };
  } catch {
    return null;
  }
}
