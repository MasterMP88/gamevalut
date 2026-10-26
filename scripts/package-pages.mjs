// GitHub Pages serves the legacy static player. The React app needs server hosting.
// Never upload the repo root: it also holds SQL, tests and installed dependencies.
import { copyFile, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const target = path.resolve(".pages-public");
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await copyFile("index.html", path.join(target, "index.html"));
await writeFile(path.join(target, ".nojekyll"), "");

async function copyPublic(source, extensions) {
  const out = path.join(target, source);
  await mkdir(out, { recursive: true });
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (entry.isDirectory())
      await copyPublic(path.join(source, entry.name), extensions);
    else if (entry.isFile() && extensions.has(path.extname(entry.name)))
      await copyFile(path.join(source, entry.name), path.join(out, entry.name));
  }
}

await copyPublic(
  "gang",
  new Set([".html", ".js", ".css", ".svg", ".png", ".webp", ".woff2"]),
);
await copyPublic("packages/gang-core/dist", new Set([".js"]));
console.log(
  "Pages package ready: static entry, gang player and compiled core only.",
);
