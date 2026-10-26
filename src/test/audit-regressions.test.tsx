import { describe, expect, it, afterEach } from 'vitest';
import { render, cleanup, within, waitFor, fireEvent } from '@testing-library/react';
import { GANG_PLAYBOOKS } from '@/lib/gang/core/playbooks';
import { createGangRuntime, submitGangAction, advanceGangStage, publicGangView, requiredPlayerIds } from '@/lib/gang/core/runtime';
import { inputKind, requiredOnline, privatePayloadsFor, lobbyFac, startGame, buildPublic } from '@/lib/gang/online';
import { createSession, DEFAULT_SETTINGS, dueAnchor } from '@/lib/game/engine';
import { buildDirectorPlan } from '@/lib/gang/core/director';
import { GangRoom } from '@/components/gang/GangRoom';
import { createRoomClient } from '@/lib/gang/room-client';
import { fakeServer } from './gang-fake-server';
afterEach(cleanup);
const players=Array.from({length:6},(_,i)=>({id:`p${i}`,name:`Test ${i}`}));
describe('Independent audit: promised behavior',()=>{
 for(const game of GANG_PLAYBOOKS.filter(g=>g.runtime!=='time-drop'))it(`${game.id}: every required secret acknowledgement has a payload`,()=>{
  const ps=players.slice(0,game.minPlayers);
  const fac=startGame(lobbyFac([game.id]),ps,123,game.id);
  const input=inputKind(fac.rt!);
  if(input==='ack'){
   const required=requiredOnline(fac.rt!,input,ps[0]!.id,new Set(ps.map(p=>p.id)));
   const payloads=privatePayloadsFor(fac,new Set(ps.map(p=>p.id)));
   for(const id of required)expect(payloads.some(p=>p.playerId===id),id).toBe(true);
  }
 });
 it('BLUFF: player given the truth is not a competing truth voter',()=>{
  let s=createGangRuntime({id:'b',gameId:'bluff',players:players.slice(0,3),seed:1});
  s=advanceGangStage(s); // private truth keeper briefing
  for(const playerId of requiredPlayerIds(s))s=submitGangAction(s,{playerId,value:'A lie'});
  s=advanceGangStage(s);
  expect(requiredPlayerIds(s)).not.toContain(s.round.activePlayerId);
 });
 it('BAD ANSWERS ONLY: five-word finale rejects six words',()=>{
  let s=createGangRuntime({id:'bad',gameId:'bad-answers-only',players:players.slice(0,3),seed:1});
  while(s.roundNumber<s.targetRounds)s=advanceGangStage(s,{force:true});
  expect(s.round.prompt.category).toBe('finale-five-words');
  expect(()=>submitGangAction(s,{playerId:'p0',value:'eins zwei drei vier fünf sechs'})).toThrow();
 });
 it('NIGHT ECHO: a private anchor marked no echo never becomes due',()=>{
  const s=createSession('night-echo',['A','B'],DEFAULT_SETTINGS,1);
  s.anchors=[{id:'private',owner:'A',shortText:'PRIVATE TEST',tags:[],sceneNumber:1,sensitivity:'high',dueAt:1,used:false}];
  expect(dueAnchor(s)).toBeNull();
 });
 it('Director: a 15 minute plan fits its own duration estimates',()=>{
  const plan=buildDirectorPlan({preferences:{playerCount:6,durationMinutes:15,energyTarget:4,moods:['wild'],enabledCapabilities:[]},history:[],deviceContext:{connectedDevices:6,hasBigScreen:true}});
  expect(plan.estimatedMinutes).toBeLessThanOrEqual(18);
 });
 it('Director: 60 minute night does not repeat a title before all eligible titles',()=>{
  const plan=buildDirectorPlan({preferences:{playerCount:6,durationMinutes:60,energyTarget:3,moods:['funny'],enabledCapabilities:[]},history:[],deviceContext:{connectedDevices:6,hasBigScreen:true}});
  expect(new Set(plan.gameIds).size).toBe(plan.gameIds.length);
 });
 for(const gameId of ['the-line','after-dark'] as const)it(`${gameId}: normal controller reaches the real first interaction without a phantom secret`,async()=>{
  const srv=fakeServer(), client=createRoomClient(srv.rpc);
  const host=await client.create('Test Host','catalog',99);
  const sessions=[host.session];
  for(const n of ['Test A','Test B','Test C'])sessions.push((await client.join(host.snapshot.code,n)).session);
  const snap=await client.snapshot(host.session.token);
  const ps=snap.players.filter(p=>p.canInput).map(p=>({id:p.id,name:p.name}));
  const fac=startGame(lobbyFac([gameId]),ps,123,'test');
  const built=buildPublic(fac,snap);
  await client.saveRuntime(host.session.token,built.fac as unknown as Record<string,unknown>);
  await client.setState(host.session.token,snap,()=>built.write);
  const payloads=privatePayloadsFor(built.fac,new Set(ps.map(p=>p.id)));
  if(payloads.length)await client.setPrivate(host.session.token,built.write.roundKey!,payloads);
  const c=render(<GangRoom client={client} session={sessions[1]!} initial={null} pollMs={20} onExit={()=>{}}/>).container;
  expect(within(c).queryByText('Dein Geheimnis wird zugestellt …')).toBeNull();
  if(gameId==='the-line') expect(await within(c).findByRole('button',{name:'Ich stehe'})).toBeEnabled();
  else {
   expect(await within(c).findByRole('button',{name:'Ich bin 18+ und möchte mitspielen'})).toBeEnabled();
   expect(within(c).getByRole('button',{name:'Heute lieber zuschauen'})).toBeEnabled();
  }
 });
});
