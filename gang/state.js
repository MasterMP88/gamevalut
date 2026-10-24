import {GANG_GAMES,buildDirectorPlan,createGangRuntime,getGangGame,getGangPlaybook,privateGangView,publicGangView,requiredPlayerIds,submitGangAction,canAdvanceGangStage,advanceGangStage} from "../packages/gang-core/dist/index.js";
export {GANG_GAMES,buildDirectorPlan,createGangRuntime,privateGangView,publicGangView,requiredPlayerIds,submitGangAction,canAdvanceGangStage,advanceGangStage};
export const READY_GAMES=GANG_GAMES.filter(g=>g.status==="ready");
export const app=document.querySelector("#app");
export const S={screen:"home",mix:false,chosen:[],overlay:null,setup:null,director:null,players:[],playlist:[],pi:0,rt:null,stage:{},history:[]};
const H={"the-majority":96,"whos-that":28,"undercover":258,"secret-missions":326,"bad-answers-only":64,"bluff":198,"the-line":146,"hot-seat":18,"team-chaos":42,"photo-hunt":178,"draw-this":82,"music-drop":300,"chain-reaction":118,"one-of-you":238,"panic-button":26,"after-dark":346};
export const ENERGY={Chill:2,Funny:3,Wild:4,Spicy:4,Chaos:5};
export const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export const game=id=>getGangGame(id);
export const book=id=>getGangPlaybook(id);
export const hue=id=>"--g:oklch(.78 .13 "+(H[id]||90)+");";
export const avg=x=>Math.round((x.durationMinutes[0]+x.durationMinutes[1])/2);
export const names=n=>Array.from({length:n},(_,i)=>({id:"p"+(i+1),name:(S.setup?.names?.[i]||S.director?.names?.[i]||"Spieler "+(i+1)).trim()}));
export const range=ids=>({min:Math.max(...ids.map(id=>game(id).minPlayers)),max:Math.min(...ids.map(id=>game(id).maxPlayers))});
export const person=id=>S.rt.players.find(p=>p.id===id)?.name||id;
export function btn(label,a,extra=""){return '<button class="btn '+extra+'" data-a="'+a+'">'+label+'</button>'}
