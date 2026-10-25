import test from 'node:test';
import assert from 'node:assert/strict';
import {createGangRuntime,advanceGangStage,submitGangAction,publicGangView,requiredPlayerIds} from '../dist/index.js';
const players=Array.from({length:4},(_,i)=>({id:`p${i}`,name:`P${i}`}));
const act=(s,options)=>options.reduce((n,optionId,i)=>submitGangAction(n,{playerId:`p${i}`,optionId}),s);
function line(){return createGangRuntime({id:'line',gameId:'the-line',players,targetRounds:2,optionalMechanics:{linePredictions:true}})}
test('optional line predictions are sealed, no self-prediction, accurate adjacent positions earn one point',()=>{
  let s=line();assert.equal(publicGangView(s).stage,'predict');
  assert.throws(()=>submitGangAction(s,{playerId:'p0',optionId:'p0'}));
  s=act(s,['p1','p3','p1','__skip__']);
  assert.throws(()=>submitGangAction(s,{playerId:'p0',optionId:'p2'}));
  assert.equal(JSON.stringify(publicGangView(s)).includes('stageSubmissions'),false);
  s=advanceGangStage(s);assert.equal(publicGangView(s).stage,'perform');
  s=act(s,['1','2','3','4']);s=advanceGangStage(s);s=advanceGangStage(s);
  assert.deepEqual(s.scores,{p0:1,p1:0,p2:1,p3:0});
  s=advanceGangStage(s);assert.equal(publicGangView(s).stage,'predict');
  assert.equal(s.round.prompt.category,'finale-silent');
});
test('duplicate/missing positions cannot produce a fabricated neighbor bonus; plain mode stays fast',()=>{
  let s=line();s=act(s,['p1','p0','p3','p2']);s=advanceGangStage(s);s=act(s,['1','1','3','4']);s=advanceGangStage(s);s=advanceGangStage(s);
  assert.deepEqual(Object.values(s.scores),[0,0,0,0]);assert.match(s.round.resolution.detail,/doppelt/);
  assert.equal(publicGangView(createGangRuntime({id:'plain',gameId:'the-line',players})).stage,'perform');
});
test('after-dark reactions aggregate without identities, scores, or a forced reaction after Stop',()=>{
  let s=createGangRuntime({id:'after',gameId:'after-dark',players,targetRounds:2,optionalMechanics:{afterDarkReactions:true}});
  for(const p of players) s=submitGangAction(s,{playerId:p.id,success:true});
  s=advanceGangStage(s);
  for(let guard=0;publicGangView(s).stage!=='react'&&guard<6;guard++) s=advanceGangStage(s,{force:true});
  assert.equal(publicGangView(s).stage,'react');
  assert.deepEqual(publicGangView(s).options,['Lachen','Überrascht','Verbunden','Skip']);
  s=act(s,['Lachen','Lachen','Verbunden','Skip']);s=advanceGangStage(s);s=advanceGangStage(s);
  assert.deepEqual(s.round.resolution.revealItems.slice(-2),[{label:'2 Reaktionen',value:'Lachen'},{label:'1 Reaktionen',value:'Verbunden'}]);
  assert.deepEqual(Object.values(s.scores),[0,0,0,0]);
  s=advanceGangStage(s);s=act(s,['Bold','Bold','Stop','Bold']);s=advanceGangStage(s);
  assert.equal(publicGangView(s).stage,'reveal');assert.ok(!s.round.stages.includes('react'));
});
