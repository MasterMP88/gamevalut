/** Browser QA, no production route. Requires playwright + an installed Chromium.
 * CODEX_PRIMARY_RUNTIME_NODE_MODULES and GANG_QA_BROWSER may point to existing tools.
 * Creates three temporary Vite files, then removes them even when a check fails.
 */
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { writeFile, readFile, unlink, mkdir } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES
  ? require(
      path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, "playwright"),
    )
  : require("playwright");
const root = process.cwd(),
  out = process.env.GANG_QA_OUTPUT || "/tmp/gang-couch-qa";
const files = ["couch-qa.html", "src/couch-qa.tsx", "couch-qa.config.ts"];
const originals = await Promise.all(
  files.map((f) => readFile(f).catch(() => null)),
);
await mkdir(out, { recursive: true });
let server, browser;
try {
  await writeFile(
    files[0],
    '<!doctype html><html lang="de"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/src/couch-qa.tsx"></script></body></html>',
  );
  await writeFile(
    files[1],
    `import React from 'react';import {createRoot} from 'react-dom/client';import {CouchPlayer,GangSharedNight} from './components/gang/CouchPlayer';import {readCouchCheckpoint} from './lib/gang/couch-resume';import {GangBigScreen} from './components/gang/GangBigScreen';import {defaultRoomClient} from './lib/gang/room-client';import type {GangGameId} from './lib/gang/core/playbooks';import './styles.css';const p=new URLSearchParams(location.search);createRoot(document.getElementById('root')!).render(p.has('screen')?<GangBigScreen client={defaultRoomClient()} code='ABC123' pollMs={200}/>:p.has('recovery')||p.has('controller')?<GangSharedNight queue={p.has('controller')?['the-majority','the-line']:['panic-button','the-line']} players={Array.from({length:6},(_,i)=>({id:'p'+i,name:'Person '+(i+1)}))} checkpoint={readCouchCheckpoint()??undefined} onExit={()=>{document.body.dataset['exited']='true'}}/>:<CouchPlayer gameId={(p.get('game')||'the-majority') as GangGameId} count={Number(p.get('n')||6)} display={p.get('display')==='phone'?'phone':'couch'} rounds={2} onExit={()=>{document.body.dataset['exited']='true'}}/>);`,
  );
  await writeFile(
    files[2],
    `import {defineConfig} from 'vite';import react from '@vitejs/plugin-react';import tailwind from '@tailwindcss/vite';import path from 'node:path';export default defineConfig({plugins:[react(),tailwind()],resolve:{alias:{'@':path.resolve('src')}},optimizeDeps:{entries:['couch-qa.html']},define:{'import.meta.env.VITE_SUPABASE_URL':JSON.stringify('http://127.0.0.1:9'),'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY':JSON.stringify('qa-public-placeholder')},server:{host:'127.0.0.1',port:4176,strictPort:true}});`,
  );
  server = spawn(
    process.execPath,
    [
      path.resolve("node_modules/vite/bin/vite.js"),
      "--config",
      "couch-qa.config.ts",
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  let logs = "";
  server.stdout.on("data", (d) => (logs += d));
  server.stderr.on("data", (d) => (logs += d));
  for (let i = 0; i < 100; i++) {
    try {
      await fetch("http://127.0.0.1:4176/couch-qa.html");
      break;
    } catch {
      if (i === 99) throw new Error(logs);
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  browser = await chromium.launch({
    headless: true,
    ...(process.env.GANG_QA_BROWSER
      ? { executablePath: process.env.GANG_QA_BROWSER }
      : {}),
    args: ["--no-sandbox"],
  });
  const errors = [],
    report = [];
  const ids = [
    "the-majority",
    "whos-that",
    "the-line",
    "bad-answers-only",
    "music-drop",
    "music-drop-dj",
    "panic-button",
    "team-chaos",
    "chain-reaction",
    "hot-seat",
  ];
  function wav(frequency) {
    const rate = 8000,
      size = rate * 3 * 2,
      b = Buffer.alloc(44 + size);
    b.write("RIFF");
    b.writeUInt32LE(36 + size, 4);
    b.write("WAVEfmt ", 8);
    b.writeUInt32LE(16, 16);
    b.writeUInt16LE(1, 20);
    b.writeUInt16LE(1, 22);
    b.writeUInt32LE(rate, 24);
    b.writeUInt32LE(rate * 2, 28);
    b.writeUInt16LE(2, 32);
    b.writeUInt16LE(16, 34);
    b.write("data", 36);
    b.writeUInt32LE(size, 40);
    for (let i = 0; i < size / 2; i++)
      b.writeInt16LE(
        Math.floor(Math.sin((i * 2 * Math.PI * frequency) / rate) * 2000),
        44 + i * 2,
      );
    return b;
  }
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1440, height: 1000 },
    { width: 1920, height: 1080 },
  ])
    for (const scenario of ids) {
      const dj = scenario === "music-drop-dj";
      const id = dj ? "music-drop" : scenario;
      const count = dj
        ? viewport.width === 390
          ? 2
          : viewport.width === 1440
            ? 8
            : 99
        : id === "hot-seat"
          ? 15
          : id === "team-chaos"
            ? 30
            : viewport.width === 1920
              ? 99
              : id === "the-line"
                ? 9
                : 6;
      const page = await browser.newPage({ viewport, reducedMotion: "reduce" });
      page.on("pageerror", (e) =>
        errors.push(`${id}/${viewport.width}: ${e.message}`),
      );
      await page.goto(
        `http://127.0.0.1:4176/couch-qa.html?game=${id}&n=${count}&display=${viewport.width === 390 ? "phone" : "couch"}`,
      );
      await page
        .getByRole("button", { name: "Los geht’s", exact: true })
        .waitFor();
      if (dj) {
        assert.equal(
          await page
            .getByRole("button", { name: "Los geht’s", exact: true })
            .isEnabled(),
          true,
        );
        assert.equal(await page.locator("input[type=file]").count(), 0);
        await page.screenshot({
          path: path.join(out, `music-drop-dj-ready-${viewport.width}.png`),
          fullPage: true,
        });
      }
      if (id === "music-drop" && !dj) {
        await page
          .getByRole("button", { name: "Eigene Audiodateien", exact: true })
          .click();
        assert.equal(
          await page
            .getByRole("button", { name: "Los geht’s", exact: true })
            .isDisabled(),
          true,
        );
        await page.getByLabel("Eure Musik mitbringen").setInputFiles([
          {
            name: "Secret Artist - Hidden Song A.wav",
            mimeType: "audio/wav",
            buffer: wav(440),
          },
          {
            name: "Secret Artist - Hidden Song B.wav",
            mimeType: "audio/wav",
            buffer: wav(660),
          },
          {
            name: "Secret Artist - Hidden Song C.wav",
            mimeType: "audio/wav",
            buffer: wav(880),
          },
        ]);
      }
      await page
        .getByRole("button", { name: "Los geht’s", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Runde starten", exact: true })
        .click();
      for (let round = 0; round < 2; round++) {
        assert.equal(
          await page
            .locator("[data-testid=couch-player]")
            .getAttribute("data-phase"),
          "play",
        );
        const overflow = await page
          .locator("[data-testid=couch-player]")
          .evaluate((el) => el.scrollWidth > el.clientWidth + 1);
        assert.equal(overflow, false, `${id}/${viewport.width} overflow`);
        if (round === 0) {
          await page.screenshot({
            path: path.join(out, `${scenario}-${viewport.width}.png`),
            fullPage: true,
          });
        }
        if (id === "panic-button" || id === "chain-reaction") {
          let guard = 0;
          while (
            (await page
              .locator("[data-testid=couch-player]")
              .getAttribute("data-phase")) === "play" &&
            guard++ < 20
          )
            await page
              .getByRole("button", { name: "Gültig · weiter", exact: true })
              .click();
        } else if (dj) {
          assert.equal(await page.locator("audio").count(), 0);
          const first = count === 2 ? "Person 2" : "Team A";
          assert.equal(
            await page
              .getByRole("button", { name: first, exact: true })
              .isDisabled(),
            true,
          );
          await page
            .getByRole("button", {
              name: "Musik läuft · Raten öffnen",
              exact: true,
            })
            .click();
          await page.getByRole("button", { name: first, exact: true }).click();
          if (count > 2 && round === 0) {
            await page
              .getByRole("button", {
                name: "Daneben · Steal öffnen",
                exact: true,
              })
              .click();
            await page
              .getByRole("button", { name: "Team B", exact: true })
              .click();
          }
          await page
            .getByRole("button", { name: "Richtig erkannt", exact: true })
            .click();
          assert.match(
            await page.locator("body").innerText(),
            /Person 1, Bühne frei/,
          );
        } else if (id === "music-drop") {
          assert.equal(
            (await page.locator("body").innerText()).includes("Hidden Song"),
            false,
          );
          await page.getByRole("button", { name: /Sekunden hören/ }).click();
          await page.waitForFunction(
            () => document.querySelector("audio")?.currentTime > 0,
          );
          await page
            .getByRole("button", { name: "Team A", exact: true })
            .click();
          assert.equal(
            await page.locator("audio").evaluate((a) => a.paused),
            true,
          );
          await page
            .getByRole("button", { name: "Richtig erkannt", exact: true })
            .click();
          assert.match(await page.locator("body").innerText(), /Hidden Song/);
        } else {
          if (id !== "the-line")
            await page
              .getByRole("button", {
                name: /Alle abgestimmt|Alle gezeigt|Auftritte durch|Ergebnisse eintragen|Alle festgelegt/,
              })
              .click();
          const inputs = page.getByRole("spinbutton");
          for (let i = 0; i < (await inputs.count()); i++)
            await inputs
              .nth(i)
              .fill(String(id === "the-majority" ? (i === 0 ? count : 0) : 3));
          const selects = page.getByRole("combobox");
          for (let i = 0; i < (await selects.count()); i++)
            await selects.nth(i).selectOption("1");
          if (id === "whos-that" || id === "bad-answers-only")
            await page
              .locator('[aria-label="Host-Steuerung"] button[aria-pressed]')
              .first()
              .click();
          await page
            .getByRole("button", {
              name: id === "the-line" ? "Alle stehen · auflösen" : "Auflösen",
              exact: true,
            })
            .click();
        }
        assert.equal(
          await page
            .locator("[data-testid=couch-player]")
            .getAttribute("data-phase"),
          "reveal",
        );
        await page
          .getByRole("button", {
            name: id === "the-line" ? "Weiter" : "Punkte zeigen",
            exact: true,
          })
          .click();
        await page
          .getByRole("button", {
            name: round === 0 ? "Nächste Runde" : "Zum Finale",
            exact: true,
          })
          .click();
        if (round === 0)
          await page
            .getByRole("button", { name: "Bereit. Los.", exact: true })
            .click();
      }
      await page.getByTestId("couch-finale").waitFor();
      await page
        .getByRole("button", { name: "Noch eine. Genau eine.", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Bereit. Los.", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Runde überspringen", exact: true })
        .click();
      await page
        .getByRole("button", {
          name: id === "the-line" ? "Weiter" : "Punkte zeigen",
          exact: true,
        })
        .click();
      await page
        .getByRole("button", { name: "Zum Finale", exact: true })
        .click();
      assert.equal(
        await page
          .getByRole("button", { name: "Noch eine. Genau eine.", exact: true })
          .count(),
        0,
      );
      await page
        .getByRole("button", { name: "Neu mischen", exact: true })
        .click();
      assert.equal(
        await page
          .locator("[data-testid=couch-player]")
          .getAttribute("data-phase"),
        "ready",
      );
      report.push({
        game: id,
        ...(id === "music-drop" ? { musicMode: dj ? "dj" : "local" } : {}),
        width: viewport.width,
        players: count,
        rounds: 3,
        status: "pass",
      });
      await page.close();
    }
  const recoveryChecks = [];
  for (const width of [390, 1440, 1920]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
    });
    page.on("pageerror", (e) => errors.push(`recovery/${width}: ${e.message}`));
    await page.goto("http://127.0.0.1:4176/couch-qa.html?recovery=1");
    await page.getByRole("button", { name: "Los geht’s", exact: true }).click();
    await page
      .getByRole("button", { name: "Runde starten", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Gültig · weiter", exact: true })
      .click();
    const before = await page.evaluate(() =>
      JSON.parse(sessionStorage.getItem("nocturne.couch.resume")),
    );
    await page.reload();
    await page.getByText("Kurz durchatmen.", { exact: true }).waitFor();
    const after = await page.evaluate(() =>
      JSON.parse(sessionStorage.getItem("nocturne.couch.resume")),
    );
    assert.equal(after.state.paused, true);
    assert.deepEqual(after.state.deck, before.state.deck);
    assert.equal(
      await page
        .getByTestId("couch-player")
        .evaluate((el) => el.scrollWidth > el.clientWidth + 1),
      false,
      `recovery/${width} overflow`,
    );
    assert.deepEqual(after.state.turnResults, before.state.turnResults);
    assert.deepEqual(after.state.scores, before.state.scores);
    await page.screenshot({
      path: path.join(out, `recovery-${width}.png`),
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Weiter geht’s", exact: true })
      .click();
    assert.equal(
      await page
        .getByRole("button", { name: "Gültig · weiter", exact: true })
        .isEnabled(),
      true,
    );
    recoveryChecks.push({
      width,
      status: "pass",
      paused: true,
      deckPreserved: true,
      scoresPreserved: true,
    });
    await page.close();
  }
  // Two real browser pages, isolated RPC transport. SQL fixture separately
  // verifies the deployed permissions; this checks the controller → TV UI.
  const context = await browser.newContext();
  let room = {
    roomId: "r1",
    code: "ABC123",
    phase: "lobby",
    entryMode: "catalog",
    gameId: null,
    roundKey: null,
    stage: null,
    publicState: {},
    version: 1,
    maxPlayers: 2,
    players: [],
  };
  const hostToken = "a".repeat(48),
    tvToken = "b".repeat(48);
  const snap = (token) => ({
    ...room,
    serverNow: new Date().toISOString(),
    playerId: token === hostToken ? "host" : "tv",
    isFacilitator: token === hostToken,
  });
  const published = [];
  await context.route("http://127.0.0.1:9/rest/v1/rpc/**", async (route) => {
    if (route.request().method() === "OPTIONS")
      return route.fulfill({
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "*",
        },
      });
    const fn = route.request().url().split("/").at(-1),
      args = route.request().postDataJSON();
    let data,
      status = 200;
    if (fn === "gang_create_room")
      data = { playerToken: hostToken, snapshot: snap(hostToken) };
    else if (fn === "gang_join_display") {
      room.version++;
      data = { playerToken: tvToken, snapshot: snap(tvToken) };
    } else if (fn === "gang_room_snapshot") data = snap(args.p_player_token);
    else if (fn === "gang_poll")
      data = { snapshot: snap(args.p_player_token), progress: null };
    else if (fn === "gang_set_room_state") {
      if (
        args.p_player_token !== hostToken ||
        args.p_expected_version !== room.version
      ) {
        status = 400;
        data = { message: "version_conflict", code: "P0001" };
      } else {
        room = {
          ...room,
          version: room.version + 1,
          phase: args.p_phase,
          gameId: args.p_game_id,
          roundKey: args.p_round_key,
          stage: args.p_stage,
          publicState: args.p_public_state,
        };
        published.push(room.publicState);
        data = snap(hostToken);
      }
    } else if (fn === "gang_leave_room") data = snap(args.p_player_token);
    else throw new Error(`Unexpected TV RPC: ${fn}`);
    await route.fulfill({
      status,
      contentType: "application/json",
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(data),
    });
  });
  const controller = await context.newPage(),
    tv = await context.newPage();
  controller.on("pageerror", (e) => errors.push(`controller: ${e.message}`));
  tv.on("pageerror", (e) => errors.push(`tv: ${e.message}`));
  await controller.setViewportSize({ width: 390, height: 844 });
  await tv.setViewportSize({ width: 1920, height: 1080 });
  await controller.goto(
    "http://127.0.0.1:4176/couch-qa.html?controller=1",
  );
  await controller
    .getByRole("button", { name: "Handy steuert · TV verbinden" })
    .click();
  await controller
    .getByRole("button", { name: "TV · ABC123", exact: true })
    .waitFor();
  await tv.goto("http://127.0.0.1:4176/couch-qa.html?screen=ABC123");
  await tv.getByTestId("couch-tv").waitFor();
  await controller
    .getByRole("button", { name: "Los geht’s", exact: true })
    .click();
  await controller
    .getByRole("button", { name: "Runde starten", exact: true })
    .click();
  await tv
    .getByRole("heading", { name: /Kurz durchatmen/ })
    .waitFor({ state: "hidden" });
  for (let i = 0; i < 40 && room.publicState.phase !== "play"; i++)
    await new Promise((r) => setTimeout(r, 100));
  assert.equal(room.publicState.phase, "play");
  await tv
    .getByRole("heading", { name: room.publicState.heading, exact: true })
    .waitFor();
  assert.equal(await tv.getByRole("button").count(), 0);
  assert.ok(
    published.every((p) => !p.deck && !p.history && !p.token && !p.answer),
  );
  await controller.getByRole("button", { name: "Pause", exact: true }).click();
  await tv
    .getByRole("heading", { name: "Kurz durchatmen.", exact: true })
    .waitFor();
  await tv.screenshot({
    path: path.join(out, "couch-tv-1920.png"),
    fullPage: true,
  });
  await controller.screenshot({
    path: path.join(out, "couch-controller-390.png"),
    fullPage: true,
  });
  assert.equal(
    await controller.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    ),
    false,
  );
  const priorController = room.publicState.controller;
  await controller.reload();
  await controller.getByRole("button", { name: "TV · ABC123", exact: true }).waitFor();
  for (let i = 0; i < 50 && room.publicState.controller === priorController; i++) await new Promise(r => setTimeout(r, 100));
  assert.notEqual(room.publicState.controller, priorController);
  assert.equal(room.publicState.paused, true);
  await controller.getByRole("button", { name: "TV · ABC123", exact: true }).click();
  await controller
    .getByRole("button", { name: "TV trennen", exact: true })
    .click();
  await tv
    .getByRole("heading", { name: "Danke, Raum.", exact: true })
    .waitFor();
  const tvChecks = {
    status: "pass",
    twoPages: true,
    controllerReload: true,
    readOnly: true,
    pause: true,
    disconnect: true,
    transport:
      "isolated RPC fixture; deployed permission SQL tested separately",
  };
  await context.close();
  assert.deepEqual(errors, []);
  await writeFile(
    path.join(out, "report.json"),
    JSON.stringify(
      { checks: report, recoveryChecks, tvChecks, errors },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify({
      sessions: report.length,
      rounds: report.length * 3,
      reloads: recoveryChecks.length,
      tv: tvChecks,
      errors,
    }),
  );
} finally {
  await Promise.all(
    files.map((f, i) =>
      originals[i] ? writeFile(f, originals[i]) : unlink(f).catch(() => {}),
    ),
  );
  server?.kill();
  await browser?.close();
}
