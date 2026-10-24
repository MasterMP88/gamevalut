import { createServerFn } from "@tanstack/react-start";
import { directorContextSchema } from "./game/ai-schema";
import { aiAuthMiddleware } from "./ai/auth-middleware";

export const getDirectorScenes = createServerFn({ method: "POST" })
  .middleware([aiAuthMiddleware])
  .inputValidator((input: unknown) => directorContextSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { runDirector } = await import("./director.server");
    return runDirector(data, context.aiUserId);
  });
