import { createServerFn } from "@tanstack/react-start";
import { directorContextSchema } from "./game/ai-schema";

export const getDirectorScenes = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => directorContextSchema.parse(input))
  .handler(async ({ data }) => {
    const { runDirector } = await import("./director.server");
    return runDirector(data);
  });