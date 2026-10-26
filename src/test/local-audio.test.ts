import { expect, it } from "vitest";
import {
  localAudioDeck,
  localAudioId,
  MAX_LOCAL_AUDIO_FILES,
} from "@/lib/gang/local-audio";
const files = (n: number) =>
  Array.from(
    { length: n },
    (_, i) =>
      new File([`sound${i}`], `Artist ${i} – Track ${i}.wav`, {
        type: "audio/wav",
        lastModified: 1,
      }),
  );
it("three 13-drop nights consume different files even with an identical seed", () => {
  const pool = files(39),
    seen: string[] = [];
  for (let night = 0; night < 3; night++) {
    const selected = localAudioDeck(pool, seen, 42).slice(0, 13);
    expect(selected.every((t) => !seen.includes(t.id))).toBe(true);
    seen.push(...selected.map((t) => t.id));
  }
  expect(new Set(seen).size).toBe(39);
});
it("unheard files beyond a large folder's first 120 entries are selected before played files", () => {
  const pool = files(150),
    seen = pool.slice(0, 120).map(localAudioId);
  const deck = localAudioDeck(pool, seen, 42);
  expect(deck).toHaveLength(MAX_LOCAL_AUDIO_FILES);
  expect(deck.slice(0, 30).every((t) => !seen.includes(t.id))).toBe(true);
});
it("deduplicates identical file selections and rejects unsupported files", () => {
  const f = files(1)[0]!;
  expect(
    localAudioDeck([f, f, new File(["x"], "readme.txt")], [], 1),
  ).toHaveLength(1);
  expect(localAudioId(f)).toMatch(/^audio\/[0-9a-f]+$/);
  expect(localAudioId(f)).not.toContain(f.name);
});
