import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
const state=vi.hoisted(()=>({user:{id:'a'} as {id:string}|null,resolvePrefs:[] as Array<(r:{data:unknown})=>void>}));
vi.mock('@/lib/auth',()=>({useAuth:()=>({user:state.user})}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{from:(table:string)=>{
 const query={select:()=>query,eq:()=>query,maybeSingle:()=>table==='preferences'?new Promise<{data:unknown}>(resolve=>state.resolvePrefs.push(resolve)):Promise.resolve({data:null}),upsert:()=>({then:(fn:(r:unknown)=>void)=>Promise.resolve({error:null}).then(fn)})};
 return query;
}}}));
import {SessionProvider,useSessions} from '@/lib/game/store';
function View(){const s=useSessions();return <><button onClick={()=>s.setPlayers(['Private Name','Partner'])}>Names</button><button onClick={()=>s.start('night-echo')}>Start</button><button onClick={()=>s.dispatch('night-echo',{type:'DONE',capture:{text:'private phrase from account A',private:true}})}>Remember</button><output>{JSON.stringify({players:s.players,sessions:s.sessions,dbIds:s.dbIds})}</output></>;}
afterEach(()=>{cleanup();state.user={id:'a'};state.resolvePrefs=[];});
describe('account boundaries',()=>{
 it.each(['b',null])('clears private tab state when account A changes to %s, including late preference responses',async(next)=>{
  const r=render(<SessionProvider><View/></SessionProvider>);
  fireEvent.click(screen.getByText('Names'));fireEvent.click(screen.getByText('Start'));fireEvent.click(screen.getByText('Remember'));
  expect(screen.getByRole('status').textContent).toContain('private phrase from account A');
  state.user=next?{id:next}:null;r.rerender(<SessionProvider><View/></SessionProvider>);
  expect(screen.getByRole('status').textContent).not.toContain('private phrase from account A');
  expect(screen.getByRole('status').textContent).not.toContain('Private Name');
  state.resolvePrefs[0]?.({data:{player_names:['Late A Name','Other'],settings:{touch:true}}});
  await waitFor(()=>expect(screen.getByRole('status').textContent).not.toContain('Late A Name'));
 });
 it('retains an explicitly started guest night on first sign-in',()=>{
  state.user=null;const r=render(<SessionProvider><View/></SessionProvider>);
  fireEvent.click(screen.getByText('Start'));fireEvent.click(screen.getByText('Remember'));
  state.user={id:'first'};r.rerender(<SessionProvider><View/></SessionProvider>);
  expect(screen.getByRole('status').textContent).toContain('private phrase from account A');
 });
});
