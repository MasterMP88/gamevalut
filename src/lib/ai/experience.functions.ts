import { createServerFn } from "@tanstack/react-start";
import { experienceRequestSchema } from "./experience-schema";

export const getAiExperience = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => experienceRequestSchema.parse(input))
  .handler(async ({ data }) => {
    const { runExperience } = await import("./experience.server");
    return runExperience(data);
  });
