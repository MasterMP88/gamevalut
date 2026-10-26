import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GANG_PLAYBOOKS, gangContentCapacity, gangRoundPrompts, gangContentKey, expandGangSeenIds,
  createGangRuntime, advanceGangStage, publicGangView, requiredPlayerIds, submitGangAction,
  createMissionNight, couchGame, couchRange, createCouchSession, reduceCouch,
} from '../dist/index.js';
const released = GANG_PLAYBOOKS.filter(p => p.runtime !== 'time-drop');
const roster = n => Array.from({length:n},(_,i)=>({id:`p${i}`,name:`Person ${i+1}`}));

test('every released bank has three maximum nights plus at least 25% reserve; prototypes and supplied audio are explicit',()=>{
  for(const p of released) for(const mode of ['private','couch']) {
    const c=gangContentCapacity(p.id,mode);
    if(!c) continue;
    if(c.source==='own-audio'){assert.equal(c.completeNights,null);continue;}
    assert.ok(c.cards>=c.threeNightReserve,`${p.id} ${mode}: ${c.cards}/${c.threeNightReserve}`);
    assert.ok(c.completeNights>=4,`${p.id} ${mode}`);
  }
  assert.equal(gangContentCapacity('time-drop'),null);
});

for (const p of released.filter(p=>p.id!=='secret-missions')) {
  for(const interactionMode of ['one-phone','everyone-in']) test(`${p.id}: four full nights at ${p.maxPlayers} people (${interactionMode}), identical seed, no editorial repeats`,()=>{
    const history=[];
    const rounds=p.id==='hot-seat'?p.maxPlayers:p.rounds[1];
    for(let night=0;night<4;night++){
      let s=createGangRuntime({id:`${p.id}/${night}`,gameId:p.id,players:roster(p.maxPlayers),seed:42,targetRounds:rounds,seenPromptIds:history,interactionMode});
      const ids=[];let observed=0,steps=0;
      while(!s.finished&&steps++<20000){
        if(s.roundNumber!==observed){ids.push(s.round.prompt.id);observed=s.roundNumber;}
        if(p.id==='after-dark'&&publicGangView(s).stage==='private'){
          for(const playerId of requiredPlayerIds(s))s=submitGangAction(s,{playerId,success:true});
        }
        s=advanceGangStage(s,{force:true});
      }
      assert.ok(s.finished,`${p.id} must actually finish`);
      assert.equal(ids.length,rounds,`${p.id} must not silently shorten a night`);
      const fresh=ids.filter(id=>id!=='after-dark-finale'); // Deliberate Soft/Bold/Stop safety ritual.
      assert.equal(new Set(fresh).size,fresh.length);
      assert.ok(fresh.every(id=>!history.includes(id)),`${p.id}, night ${night+1}: repeated card`);
      history.push(...ids);
    }
  });
}

test('120 individual missions across four 30-person nights, no recycled assignment',()=>{
  const history=[];
  for(let n=0;n<4;n++){
    const s=createMissionNight(`n${n}`,roster(30),42,history);
    const ids=Object.values(s.assignments).map(x=>x.id);
    assert.equal(new Set(ids).size,30);
    assert.ok(ids.every(id=>!history.includes(id)));
    history.push(...ids);
  }
});

test('mixed schedules preserve unseen choices across titles, not just within one bank',()=>{
  for(const order of [released,[...released].reverse()])for(const seed of [1,42,98765]){
    const history=[];
    for(let night=0;night<4;night++)for(const p of order){
      if(p.id==='secret-missions'){
        const ids=Object.values(createMissionNight(`m${night}`,roster(30),seed,history).assignments).map(x=>x.id);
        assert.ok(ids.every(id=>!history.includes(id)));history.push(...ids);continue;
      }
      let s=createGangRuntime({id:p.id,gameId:p.id,players:roster(p.maxPlayers),seed,targetRounds:p.id==='hot-seat'?20:p.rounds[1],seenPromptIds:history,interactionMode:'everyone-in'});
      let observed=0,steps=0;
      while(!s.finished&&steps++<20000){
        if(s.roundNumber!==observed){
          observed=s.roundNumber;
          if(s.round.prompt.id!=='after-dark-finale')assert.ok(!history.includes(s.round.prompt.id),`${p.id} night ${night+1}, seed ${seed}`);
          history.push(s.round.prompt.id);
        }
        if(p.id==='after-dark'&&publicGangView(s).stage==='private')for(const playerId of requiredPlayerIds(s))s=submitGangAction(s,{playerId,success:true});
        s=advanceGangStage(s,{force:true});
      }
      assert.ok(s.finished,p.id);
    }
  }
});

for(const p of released.filter(p=>couchGame(p.id)&&p.id!=='music-drop')) test(`${p.id}: four couch nights at maximum size, including every encore`,()=>{
  const history=[];
  for(let night=0;night<4;night++){
    let s=createCouchSession({gameId:p.id,playerCount:couchRange(p.id)[1],seed:42,rounds:12,seen:history});
    const exposed=[];let steps=0,encored=false;
    while(steps++<150){
      if(s.phase==='play'){
        const id=s.deck[s.index].id;exposed.push(id);
        s=reduceCouch(s,{type:'SKIP'}); // Exposed skipped content must also be consumed.
      }else if(s.phase==='finale'){
        if(encored)break;
        encored=true;s=reduceCouch(s,{type:'ENCORE',at:0});
      }else s=reduceCouch(s,{type:'NEXT',at:0});
    }
    assert.equal(exposed.length,13);
    assert.equal(new Set(exposed).size,13);
    assert.ok(exposed.every(id=>!history.includes(id)),`${p.id}: night ${night+1}`);
    history.push(...exposed);
  }
});

test('IDs cannot silently change meaning across simultaneous content editions',()=>{
  const global=new Map();
  for(const p of released){
    assert.equal(new Set(p.prompts.map(c=>c.id)).size,p.prompts.length,p.id);
    for(const card of p.prompts){
      const json=JSON.stringify(card);
      if(global.has(card.id))assert.equal(global.get(card.id),json,card.id);
      global.set(card.id,json);
    }
    const content=gangRoundPrompts(p.id).map(c=>p.id==='undercover'
      ? [c.answer,c.altPrompt].sort().join('|')
      : p.id==='draw-this'?c.answer
      : p.id==='team-chaos'?`${c.prompt}|${c.teamChallenge?.secret??''}`
      : c.prompt);
    assert.equal(new Set(content).size,content.length,`${p.id}: same concept with another ID`);
  }
});

test('a drawing alias cannot accidentally accept another card’s answer',()=>{
  const normalize=s=>s.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const deck=gangRoundPrompts('draw-this');
  for(const p of deck)for(const alias of p.aliases??[]){
    assert.ok(!deck.some(other=>other.id!==p.id&&normalize(other.answer)===normalize(alias)),`${p.id}: unrelated alias ${alias}`);
  }
});

test('retired duplicate and safety ending are excluded; legacy history still excludes equivalents',()=>{
  assert.ok(!gangRoundPrompts('after-dark').some(p=>p.id==='after-10'));
  assert.ok(!gangRoundPrompts('team-chaos').some(p=>p.id==='team-edition3-4'));
  assert.equal(gangContentKey('team-edition3-4'),gangContentKey('team-collect-v2-7'));
  const s=createCouchSession({gameId:'team-chaos',playerCount:99,seed:42,seen:['team-edition3-5']});
  assert.equal(s.deck.at(-1).id,'team-couch-11');
});

test('ambiguous legacy content excludes both possible cards, while fresh IDs never consume unseen sibling cards',()=>{
  const migrated=expandGangSeenIds(['mission-edition3-1','who-edition3-1','draw-edition3-1','after-edition3-1']);
  for(const prefix of ['mission','who','draw','after']){
    assert.ok(migrated.includes(`${prefix}-replay26-1`));
    assert.ok(migrated.includes(`${prefix}-couch2026-1`));
    assert.deepEqual(expandGangSeenIds([`${prefix}-replay26-1`]),[`${prefix}-replay26-1`]);
  }
});

test('fully exhausted old history never permits repeats inside a new runtime',()=>{
  for(const p of released.filter(p=>p.id!=='secret-missions')){
    let s=createGangRuntime({id:p.id,gameId:p.id,players:roster(p.minPlayers),targetRounds:p.rounds[1],seenPromptIds:p.prompts.map(x=>x.id)});
    const ids=new Set();let last=0,steps=0;
    while(!s.finished&&steps++<10000){
      if(s.roundNumber!==last){assert.ok(!ids.has(s.round.prompt.id),p.id);ids.add(s.round.prompt.id);last=s.roundNumber;}
      if(p.id==='after-dark'&&publicGangView(s).stage==='private')for(const playerId of requiredPlayerIds(s))s=submitGangAction(s,{playerId,success:true});
      s=advanceGangStage(s,{force:true});
    }
    assert.ok(s.finished,p.id);
  }
});
