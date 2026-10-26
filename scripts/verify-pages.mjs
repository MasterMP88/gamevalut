import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(".pages-public");
assert.deepEqual((await readdir(root)).sort(), [
  ".nojekyll",
  "gang",
  "index.html",
  "packages",
]);
assert.deepEqual(await readdir(path.join(root, "packages")), ["gang-core"]);
assert.deepEqual(await readdir(path.join(root, "packages/gang-core")), [
  "dist",
]);

async function verify(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    assert.ok(!entry.isSymbolicLink(), `Unexpected symlink: ${file}`);
    if (entry.isDirectory()) await verify(file);
    else {
      assert.ok(
        !/\.(?:ts|tsx|sql|map|json|log)$/.test(entry.name),
        `Non-public file: ${file}`,
      );
      if (!entry.name.endsWith(".js")) continue;
      const body = await readFile(file, "utf8");
      for (const match of body.matchAll(
        /(?:from\s*|import\s*)["'](\.[^"']+)["']/g,
      )) {
        const dependency = path.resolve(path.dirname(file), match[1]);
        assert.ok(
          dependency.startsWith(root + path.sep),
          `Import outside artifact: ${dependency}`,
        );
        await access(dependency);
      }
    }
  }
}
await verify(root);
await access(path.join(root, "gang/index.html"));
await access(path.join(root, "gang/app.js"));
await access(path.join(root, "packages/gang-core/dist/index.js"));
console.log(
  "Pages artifact verified: imports resolve; source, SQL, maps and dependencies excluded.",
);
