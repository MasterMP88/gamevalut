import { createServerFn } from "@tanstack/react-start";
import { experienceRequestSchema } from "./experience-schema";
import { aiAuthMiddleware } from "./auth-middleware";

export const getAiExperience = createServerFn({ method: "POST" })
  .middleware([aiAuthMiddleware])
  .inputValidator((input: unknown) => experienceRequestSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { runExperience } = await import("./experience.server");
    return runExperience(data, context.aiUserId);
  });
