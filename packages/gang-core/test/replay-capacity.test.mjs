import assert from 'node:assert/strict';
import test from 'node:test';
import {createMissionNight, createGangRuntime, advanceGangStage, getGangPlaybook} from '../dist/index.js';
const roster = n => Array.from({length:n},(_,i)=>({id:`p${i}`,name:`Person ${i+1}`}));
test('three maximum-size mission nights each receive 30 different authored missions',()=>{
  const seen=[];
  for(let evening=0;evening<3;evening++){
    // Identical seed deliberately: history, not luck, must prevent repetitions.
    const night=createMissionNight(`night-${evening}`,roster(30),42,seen);
    const ids=Object.values(night.assignments).map(a=>a.id);
    assert.equal(new Set(ids).size,30);
    assert.ok(ids.every(id=>!seen.includes(id)));
    seen.push(...ids);
  }
  assert.equal(new Set(seen).size,90);
});
test('three complete hot-seat evenings rotate all 20 people with unseen questions',()=>{
  const seen=[];
  for(let evening=0;evening<3;evening++){
    let state=createGangRuntime({id:`night-${evening}`,gameId:'hot-seat',players:roster(20),seed:42,seenPromptIds:seen});
    const ids=[],actors=[];
    let safety=0;
    while(!state.finished && safety++<150){
      if(!ids.includes(state.round.prompt.id)){
        ids.push(state.round.prompt.id);actors.push(state.round.activePlayerId);
      }
      state=advanceGangStage(state,{force:true});
    }
    assert.ok(state.finished);
    assert.equal(ids.length,20);assert.equal(new Set(actors).size,20);
    assert.ok(ids.every(id=>!seen.includes(id)));
    seen.push(...ids);
  }
  assert.equal(new Set(seen).size,60);
});
test('expanded banks have unique text and stable unique IDs',()=>{
  for(const id of ['secret-missions','hot-seat']){
    const bank=getGangPlaybook(id).prompts;
    assert.equal(new Set(bank.map(p=>p.id)).size,bank.length);
    assert.equal(new Set(bank.map(p=>p.prompt.trim().toLocaleLowerCase('de'))).size,bank.length);
  }
});

test('each released generic game has enough authored cards for three maximum-length evenings',()=>{
  for(const id of ['the-majority','whos-that','undercover','secret-missions','bad-answers-only','bluff','the-line','hot-seat','team-chaos','photo-hunt','draw-this','music-drop','chain-reaction','one-of-you','panic-button','after-dark']){
    const pb=getGangPlaybook(id);
    const perEvening=id==='secret-missions'?30:id==='hot-seat'?20:pb.rounds[1];
    assert.ok(pb.prompts.length>=perEvening*3,`${id} capacity`);
    const identities=pb.prompts.map(p=>id==='draw-this' ? p.answer : id==='undercover' ? `${p.answer}|${p.altPrompt}` : id==='team-chaos' ? `${p.prompt}|${p.teamChallenge?.secret ?? ''}` : p.prompt);
    assert.equal(new Set(identities.map(s=>s.trim().toLowerCase())).size,pb.prompts.length,`${id} repeated editorial content`);
  }
});
