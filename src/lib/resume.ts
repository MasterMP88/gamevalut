import { supabase } from "@/integrations/supabase/client";
import { restore } from "@/lib/game/persist";
import type { GameId, SessionState } from "@/lib/game/types";

export interface SessionSummary {
  id: string;
  game_id: string;
  game_slug: string;
  status: string;
  scene_number: number;
  chapter: number | null;
  updated_at: string;
  completed_at: string | null;
  started_at: string;
}

export async function fetchOpenSession(userId: string, gameId: GameId) {
  const { data } = await supabase.from("game_sessions").select("id, state, state_version, content_version, revision, game_id, scene_number").eq("user_id", userId).eq("game_id", gameId).eq("status", "active").maybeSingle();
  return data;
}

export async function loadSession(id: string): Promise<{ state: SessionState; revision: number; gameId: GameId } | null> {
  const { data } = await supabase.from("game_sessions").select("id, state, state_version, content_version, revision, game_id").eq("id", id).maybeSingle();
  if (!data) return null;
  const r = restore(data);
  return r.ok ? { state: r.state, revision: data.revision, gameId: data.game_id as GameId } : null;
}

export function relTime(iso: string) {
  const m = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (m < 2) return "gerade eben";
  if (m < 60) return `vor ${m} Min.`;
  const h = Math.round(m / 60);
  if (h < 24) return `vor ${h} Std.`;
  const d = Math.round(h / 24);
  return d === 1 ? "gestern" : `vor ${d} Tagen`;
}
