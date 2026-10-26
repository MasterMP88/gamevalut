/** Metadata fingerprint only. No file name or audio is uploaded to history.
 * Renamed/re-encoded files may count as new; this is not acoustic recognition.
 */
export function localAudioId(
  f: Pick<File, "name" | "size" | "lastModified">,
): string {
  let h = 2166136261;
  for (const c of `${f.name}:${f.size}:${f.lastModified}`)
    h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return `audio/${(h >>> 0).toString(16)}`;
}
export const MAX_LOCAL_AUDIO_FILES = 120;
export function localAudioDeck(
  files: readonly File[],
  history: readonly string[],
  seed: number,
) {
  const unique = new Map<string, File>();
  for (const f of files)
    if (
      (f.type.startsWith("audio/") ||
        /\.(mp3|m4a|ogg|wav|flac|aac)$/i.test(f.name)) &&
      f.size <= 100 * 1024 * 1024
    )
      unique.set(localAudioId(f), f);
  let s = seed >>> 0;
  const shuffled = [...unique].map(([id, file]) => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return { id, file, tie: s, age: history.lastIndexOf(id) };
  });
  // Selection happens AFTER unseen-first ranking, even when a folder exceeds
  // the playlist limit. Otherwise its first played files can starve new ones.
  return shuffled
    .sort((a, b) => a.age - b.age || a.tie - b.tie)
    .slice(0, MAX_LOCAL_AUDIO_FILES);
}
