import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { createSession, DEFAULT_SETTINGS, reducer } from '@/lib/game/engine';
import { nightShare } from '@/lib/game/share';
import { ShareNight } from '@/components/player/ShareNight';
function session(){
  let s=createSession('night-echo',['PRIVATE-ARI','PRIVATE-NOVA'],DEFAULT_SETTINGS,42);
  s=reducer(s,{type:'DONE',capture:{text:'A harmless selected memory',private:false}});
  s=reducer(s,{type:'DONE',capture:{text:'SECRET-DO-NOT-SHARE',private:true}});
  return {...s,tracklist:[{title:'PERSONAL-SONG',artist:'ARTIST',owner:0 as const,n:1,prompt:'PRIVATE-PROMPT',mode:'solo' as const}]};
}
describe('explicit night sharing',()=>{
  it('shares only the basic summary by default, never hidden context',()=>{
    const out=JSON.stringify(nightShare(session()));
    for(const text of ['PRIVATE-ARI','PRIVATE-NOVA','harmless','SECRET','PERSONAL-SONG','PRIVATE-PROMPT']) expect(out).not.toContain(text);
  });
  it('only selected normal-sensitivity moments, optional names and songs can enter the payload',()=>{
    const s=session();
    const out=JSON.stringify(nightShare(s,{names:true,songs:true,momentIds:s.anchors.map(a=>a.id)}));
    expect(out).toContain('PRIVATE-ARI');expect(out).toContain('harmless');expect(out).toContain('PERSONAL-SONG');
    expect(out).not.toContain('SECRET-DO-NOT-SHARE');expect(out).not.toContain('PRIVATE-PROMPT');
  });
  it('does not send anything on open; copies exactly the approved preview and resets choices on close',async()=>{
    const writeText=vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText}});
    render(<ShareNight state={session()}/>);
    fireEvent.click(screen.getByRole('button',{name:'Abend teilen · Vorschau'}));
    expect(writeText).not.toHaveBeenCalled();
    expect(screen.queryByLabelText(/SECRET/)).toBeNull();
    fireEvent.click(screen.getByLabelText('Unsere Namen ergänzen'));
    const text=screen.getByTestId('share-preview').textContent;
    fireEvent.click(screen.getByRole('button',{name:'Text kopieren'}));
    expect(writeText).toHaveBeenCalledWith(text);
    expect(await screen.findByText('In die Zwischenablage kopiert.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button',{name:'Schließen'}));
    fireEvent.click(screen.getByRole('button',{name:'Abend teilen · Vorschau'}));
    expect(screen.getByTestId('share-preview').textContent).not.toContain('PRIVATE-ARI');
  });
});
