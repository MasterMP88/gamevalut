import { describe, it, expect } from "vitest";
import { createSession, reducer, DEFAULT_SETTINGS } from "@/lib/game/engine";
import { activateHistoryAccount, mergeHistory, readHistory, rememberContent, type HistoryStore } from "@/lib/content-history";
import { authorizeDirector } from "@/lib/director-access";
import { buildDirectorPlan } from "@/lib/gang/core/director";
import { createGangRuntime, submitGangAction, advanceGangStage, requiredPlayerIds, publicGangView, normalizeAnswer, type GangRuntimeState } from "@/lib/gang/core/runtime";
import { startGame, lobbyFac } from "@/lib/gang/online";
const players = Array.from({length:8}, (_,i) => ({id:`p${i}`, name:`P ${i}`}));
const untilScore = (s: GangRuntimeState) => { for(let i=0;i<200 && publicGangView(s).stage!=="score" && !s.finished;i++) s=advanceGangStage(s,{force:true}); return s; };

describe("Premium 2026 — access and private data", () => {
 it("does not reserve paid AI capacity for a preview account", async () => {
  const calls:string[]=[];
  const result=await authorizeDirector("token",{verify:async()=>({id:"u"}),entitlements:async()=>[],reserve:async()=>{calls.push("reserve");return true;}});
  expect(result).toBeNull(); expect(calls).toEqual([]);
 });
 it("uses verified identity and the budget result", async () => {
  const ids:string[]=[];
  const result=await authorizeDirector("token",{verify:async()=>({id:"real-user"}),entitlements:async(id)=>{ids.push(id);return [{product_key:"night_pass_72h",status:"active",starts_at:null,ends_at:null}];},reserve:async(id)=>{ids.push(id);return false;}});
  expect(result).toBeNull(); expect(ids).toEqual(["real-user","real-user"]);
 });
 it("keeps optional physical/drinking content off before explicit consent",()=>{
  expect(DEFAULT_SETTINGS).toMatchObject({touch:false,sensual:false,drinks:false});
 });
});

describe("Premium 2026 — durable replay and time", () => {
 it("merges histories by latest observation and survives corrupt storage",()=>{
  const map=new Map<string,string>(); const storage:HistoryStore={getItem:k=>map.get(k)??null,setItem:(k,v)=>{map.set(k,v);}};
  rememberContent(["first"],storage,undefined,10);rememberContent(["second"],storage,undefined,20);
  expect(readHistory(storage)).toEqual([{id:"first",at:10},{id:"second",at:20}]);
  expect(mergeHistory([{id:"first",at:5}],[{id:"first",at:10}])).toEqual([{id:"first",at:10}]);
  expect(readHistory({getItem:()=>"broken",setItem:()=>{}})).toEqual([]);
 });
 it("a second couple night avoids the previous night's local deck",()=>{
  let first=createSession("roxy-after-dark",["A","B"],DEFAULT_SETTINGS,7,{durationMinutes:15});
  const used:string[]=[];
  while(!first.finished){if(first.current)used.push(first.current.id);first=reducer(first,{type:"DONE"});}
  let second=createSession("roxy-after-dark",["A","B"],DEFAULT_SETTINGS,7,{durationMinutes:15,seenIds:used});
  const again:string[]=[];
  while(!second.finished){if(second.current)again.push(second.current.id);second=reducer(second,{type:"DONE"});}
  expect(again.filter(id=>used.includes(id))).toEqual([]);
 });
 it("time exhaustion lets the current scene finish then ends the night",()=>{
  const s=createSession("roxy-after-dark",["A","B"],DEFAULT_SETTINGS,1,{durationMinutes:15});
  const ticking=reducer({...s,elapsedMs:899500},{type:"TICK",elapsedMs:1000});
  expect(ticking.finished).toBe(false); expect(ticking.current?.id).toBe(s.current?.id);
  expect(reducer(ticking,{type:"DONE"}).finished).toBe(true);
  expect(reducer(ticking,{type:"SKIP"}).finished).toBe(true);
 });
 it("budget reaches the runtime in a director night",()=>{
  const f=startGame(lobbyFac(["the-majority"],{"the-majority":2}),players.slice(0,4),7,"plan");
  expect(f.rt?.targetRounds).toBe(2);
 });
 it("all plan sizes stay inside their own budget and never repeat a title",()=>{
  for(const count of [2,4,6,12,31,99])for(const duration of [15,30,60] as const)for(let seed=1;seed<=30;seed++){
   const p=buildDirectorPlan({preferences:{playerCount:count,durationMinutes:duration,energyTarget:4,moods:["wild"],enabledCapabilities:[]},history:[],seed,deviceContext:{connectedDevices:count,hasBigScreen:true}});
   expect(p.gameIds.length).toBeGreaterThan(0);expect(new Set(p.gameIds).size).toBe(p.gameIds.length);expect(p.estimatedMinutes).toBeLessThanOrEqual(duration);
  }
 });
 it("seeded directors produce different suitable nights",()=>{
  const plans=Array.from({length:30},(_,seed)=>buildDirectorPlan({preferences:{playerCount:6,durationMinutes:30,energyTarget:3,moods:["funny"],enabledCapabilities:[]},history:[],seed,deviceContext:{connectedDevices:6,hasBigScreen:false}}).gameIds.join());
  expect(new Set(plans).size).toBeGreaterThan(3);
 });
 it("group prompts cycle through unseen cards across multiple nights",()=>{
  const seen:string[]=[];
  for(let night=0;night<4;night++){
   let s=createGangRuntime({id:`night${night}`,gameId:"the-majority",players:players.slice(0,4),targetRounds:6,seenPromptIds:seen,seed:1});
   while(!s.finished){if(!seen.includes(s.round.prompt.id))seen.push(s.round.prompt.id);s=advanceGangStage(s,{force:true});}
  }
  expect(seen.length).toBe(24);
 });
});

describe("Premium 2026 — distinct group mechanics",()=>{
 it("rotates through every hot seat in a large group",()=>{
  const s=createGangRuntime({id:"seat",gameId:"hot-seat",players:Array.from({length:20},(_,i)=>({id:`p${i}`,name:`P${i}`}))});
  expect(s.targetRounds).toBe(20);
 });
 it("double undercover is reserved for the finale",()=>{
  let s=createGangRuntime({id:"u",gameId:"undercover",players,targetRounds:4,seed:9});
  while(s.roundNumber<4){expect(s.round.undercoverPlayerIds).toHaveLength(1);s=advanceGangStage(s,{force:true});}
  expect(s.round.undercoverPlayerIds).toHaveLength(2);
 });
 it("undercover tie enters a real runoff",()=>{
  let s=createGangRuntime({id:"u",gameId:"undercover",players:players.slice(0,4),targetRounds:2});
  while(publicGangView(s).stage!=="vote")s=advanceGangStage(s,{force:true});
  for(const [playerId,targetPlayerId] of [["p0","p1"],["p1","p0"],["p2","p0"],["p3","p1"]])s=submitGangAction(s,{playerId:playerId!,targetPlayerId:targetPlayerId!});
  s=advanceGangStage(s);expect(publicGangView(s).stage).toBe("vote");expect(new Set(publicGangView(s).options)).toEqual(new Set(["p0","p1"]));
 });
 it("two-person MUSIC DROP rewards matching songs without forced reciprocal votes",()=>{
  let s=createGangRuntime({id:"m",gameId:"music-drop",players:players.slice(0,2),targetRounds:1});
  s=submitGangAction(s,{playerId:"p0",value:"Home — Artist"});s=submitGangAction(s,{playerId:"p1",value:"home - artist"});
  s=untilScore(s);expect(s.round.stages).not.toContain("vote");expect(s.scores).toEqual({p0:1,p1:1});
 });
 it("unequal teams completing the same task tie",()=>{
  let s=createGangRuntime({id:"t",gameId:"team-chaos",players:players.slice(0,7),targetRounds:1});
  s=advanceGangStage(s,{force:true});for(const playerId of requiredPlayerIds(s))s=submitGangAction(s,{playerId,success:true});s=untilScore(s);
  expect(Object.values(s.scores).every(n=>n===0)).toBe(true);
 });
 it("AFTER DARK requires each person's opt-in and one Stop wins",()=>{
  let s=createGangRuntime({id:"a",gameId:"after-dark",players:players.slice(0,3),targetRounds:1});
  expect(publicGangView(s).stage).toBe("private");for(const playerId of requiredPlayerIds(s))s=submitGangAction(s,{playerId,success:true});s=advanceGangStage(s);
  for(const playerId of requiredPlayerIds(s))s=submitGangAction(s,{playerId,optionId:playerId==="p2"?"Stop":"Bold"});s=untilScore(s);
  expect(s.round.resolution?.headline).toContain("Stop");expect(s.round.resolution?.revealItems).toEqual([{label:"Euer Ende",value:"Stop"}]);
 });
 it("declining AFTER DARK excludes that person from all later required inputs",()=>{
  let s=createGangRuntime({id:"a",gameId:"after-dark",players:players.slice(0,3),targetRounds:2});
  for(const playerId of requiredPlayerIds(s))s=submitGangAction(s,{playerId,success:playerId!=="p2"});s=advanceGangStage(s);
  expect(requiredPlayerIds(s)).not.toContain("p2");expect(s.finished).toBe(false);
 });
 it("panic really passes from one player to the next, three turns each",()=>{
  let s=createGangRuntime({id:"p",gameId:"panic-button",players:players.slice(0,2),targetRounds:1});
  const turns:string[]=[];
  while(publicGangView(s).stage!=="score"){
   if(publicGangView(s).stage==="react"){const id=requiredPlayerIds(s)[0]!;turns.push(id);s=submitGangAction(s,{playerId:id,timedOut:true});}
   s=advanceGangStage(s,{force:true});
  }
  expect(turns).toEqual(["p0","p1","p0","p1","p0","p1"]);expect(s.round.resolution?.detail).toContain("3/3");
 });
 it("draw aliases normalize umlauts and punctuation",()=>{expect(normalizeAnswer(" Gieß-Kanne ")).toBe(normalizeAnswer("Giesskanne"));});
});

// Large rooms use simultaneous lanes, while everyone receives exactly three timed turns.
it("99-player panic uses 17 parallel lanes and equal turn counts",()=>{
 let s=createGangRuntime({id:"crowd",gameId:"panic-button",players:Array.from({length:99},(_,i)=>({id:`p${i}`,name:`P ${i}`})),targetRounds:1,interactionMode:"everyone-in"});
 expect(s.round.turnLanes).toHaveLength(17);expect(s.round.stages.length).toBe(38);
 const counts:Record<string,number>={};
 while(!s.finished){
  for(const playerId of requiredPlayerIds(s)){
   if(publicGangView(s).stage==="react")counts[playerId]=(counts[playerId]??0)+1;
   s=submitGangAction(s,{playerId,success:true,value:`word${s.round.stageIndex}`});
  }
  s=advanceGangStage(s,{force:true});
 }
 expect(Object.keys(counts)).toHaveLength(99);expect(Object.values(counts).every(n=>n===3)).toBe(true);
});
