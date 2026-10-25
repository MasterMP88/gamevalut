import { createServerFn } from "@tanstack/react-start";

/**
 * Returns a short-lived MusicKit developer token when Apple Music is configured server-side.
 * Secrets (never in client code): APPLE_MUSIC_TEAM_ID, APPLE_MUSIC_KEY_ID, APPLE_MUSIC_PRIVATE_KEY (.p8 PEM).
 * Without them: { enabled: false } and the game stays in manual mode.
 */
export const getMusicKitConfig = createServerFn({ method: "GET" }).handler(async () => {
  const teamId = process.env["APPLE_MUSIC_TEAM_ID"];
  const keyId = process.env["APPLE_MUSIC_KEY_ID"];
  const pem = process.env["APPLE_MUSIC_PRIVATE_KEY"];
  if (!teamId || !keyId || !pem) return { enabled: false as const };
  try {
    const { signDeveloperToken } = await import("./musickit.server");
    const developerToken = await signDeveloperToken({ teamId, keyId, pem, ttlSeconds: 60 * 60 * 12 });
    return { enabled: true as const, developerToken, app: { name: "NOCTURNE", build: "1" } };
  } catch (e) {
    console.error("MusicKit token signing failed", e instanceof Error ? e.message : e);
    return { enabled: false as const };
  }
});
