/** Seen content only: never names, answers, roles, song choices or intimate text. */
export interface SeenContent { id: string; at: number }
export interface HistoryStore { getItem(key: string): string | null; setItem(key: string, value: string): void }
const KEY = "nocturne.content-history.v2";
const MAX = 20_000;
const VALID_ID = /^[a-zA-Z0-9][a-zA-Z0-9_./:-]{0,119}$/;

export function mergeHistory(...lists: readonly SeenContent[][]): SeenContent[] {
  const merged = new Map<string, number>();
  for (const list of lists) for (const row of list) {
    if (!row || !VALID_ID.test(row.id) || !Number.isFinite(row.at) || row.at < 0) continue;
    merged.set(row.id, Math.max(row.at, merged.get(row.id) ?? 0));
  }
  return [...merged].map(([id, at]) => ({ id, at })).sort((a, b) => a.at - b.at || a.id.localeCompare(b.id)).slice(-MAX);
}
export function historyKey(accountId?: string): string { return `${KEY}:${accountId || "guest"}`; }
export function readHistory(storage?: HistoryStore | null, accountId?: string): SeenContent[] {
  try {
    const raw: unknown = JSON.parse(storage?.getItem(historyKey(accountId)) ?? "[]");
    return Array.isArray(raw) ? mergeHistory(raw as SeenContent[]) : [];
  } catch { return []; }
}
export function rememberContent(ids: readonly string[], storage?: HistoryStore | null, accountId?: string, now = Date.now()): SeenContent[] {
  const result = mergeHistory(readHistory(storage, accountId), ids.map((id) => ({ id, at: now })));
  try { storage?.setItem(historyKey(accountId), JSON.stringify(result)); } catch { /* memory/session fallback remains playable */ }
  return result;
}
export function browserHistoryStore(): HistoryStore | null {
  try { return typeof window === "undefined" ? null : window.localStorage; } catch { return null; }
}
let activeAccount: string | undefined;
let historyListener: ((rows: SeenContent[]) => void) | undefined;
/** Separate account histories on shared devices. Guests are merged on explicit sign-in. */
export function activateHistoryAccount(accountId?: string, onRecord?: (rows: SeenContent[]) => void): void {
  activeAccount = accountId; historyListener = onRecord;
  if (accountId) mergeStoredHistory(readHistory(browserHistoryStore()), accountId);
}
export function mergeStoredHistory(rows: SeenContent[], accountId = activeAccount): SeenContent[] {
  const storage = browserHistoryStore();
  const merged = mergeHistory(readHistory(storage, accountId), rows);
  try { storage?.setItem(historyKey(accountId), JSON.stringify(merged)); } catch { /* storage optional */ }
  return merged;
}
export function clearContentHistory(): void {
  try { browserHistoryStore()?.setItem(historyKey(activeAccount), "[]"); } catch { /* storage optional */ }
}
/** Shared unpersonalized deck history for this device, including cross-game content IDs. */
export function seenIds(): string[] { return readHistory(browserHistoryStore(), activeAccount).map((r) => r.id); }
export function recordSeen(ids: readonly string[]): void {
  const now = Date.now();
  rememberContent(ids, browserHistoryStore(), activeAccount, now);
  historyListener?.(ids.map((id) => ({ id, at: now })));
}
