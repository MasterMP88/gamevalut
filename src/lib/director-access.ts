import { coupleSceneAccess, type Entitlement } from "./entitlements";

export interface DirectorAccessDeps {
  verify(token: string): Promise<{ id: string }>;
  entitlements(userId: string): Promise<Entitlement[]>;
  reserve(userId: string): Promise<boolean>;
}

/** Server-owned order: identity → paid access → atomic budget reservation → generation. */
export async function authorizeDirector(token: string, deps: DirectorAccessDeps): Promise<string | null> {
  const user = await deps.verify(token);
  if (!coupleSceneAccess(6, await deps.entitlements(user.id)).allowed) return null;
  return await deps.reserve(user.id) ? user.id : null;
}
