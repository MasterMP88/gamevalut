import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
for (const name of ['gang', 'commerce']) {
  const source = `packages/${name}-core/src`;
  const target = `src/lib/${name}/core`;
  await mkdir(target, { recursive: true });
  for (const file of await readdir(source)) {
    if (!file.endsWith('.ts')) continue;
    const body = await readFile(`${source}/${file}`, 'utf8');
    await writeFile(`${target}/${file}`, `// Generated from ${source}/${file} by scripts/vendor-cores.mjs. Edit the canonical package.\n${body}`);
  }
}
