const OWNER = "nocturne.session.owner";
const PRIVATE_KEYS = [
  "nocturne.gang.player",
  "nocturne.couple.player",
  "nocturne.gang.display",
  "nocturne.couch.resume",
  "nocturne.couch.controller",
];

/** Clear capabilities on account changes, including changes discovered after a reload.
 * The first guest → account handoff deliberately preserves the current night. */
export function reconcileSessionOwner(
  next: string | null,
  previous?: string | null,
): boolean {
  let owner = previous;
  try {
    owner ??= sessionStorage.getItem(OWNER);
  } catch {
    /* memory-only browser */
  }
  const changed = !!owner && owner !== next;
  try {
    if (changed) {
      for (const key of PRIVATE_KEYS) sessionStorage.removeItem(key);
      for (const key of Object.keys(sessionStorage)) {
        if (key.startsWith("nocturne.gang.maj."))
          sessionStorage.removeItem(key);
      }
    }
    if (next) sessionStorage.setItem(OWNER, next);
    else sessionStorage.removeItem(OWNER);
  } catch {
    /* AuthProvider also remounts all in-memory game state. */
  }
  return changed;
}
