import {THINK_MS,BUZZ_ANSWER_MS,VOWELS,CONSONANTS,createPool,drawOne,chooseNumbers,shuffle,validWord,lettersFrom,calculate,numberPoints,longestWords,prepareConundrums,numbersExpert} from './rules.mjs';
const $=id=>document.getElementById(id); const screen=$('screen'), clockAudio=$('clock-audio'),winAudio=$('win-audio');
const OFFLINE_CACHE='roger-solo-pocket-0.6.0';
const OFFLINE_ASSETS=['./','./index.html','./style.css','./app.mjs','./rules.mjs','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/favicon.svg','./data/words.txt','./data/additions.txt','./data/conundrums.txt','./festive/tree.svg','./festive/reindeer.svg','./festive/snowglobe.svg','./festive/santa.svg','./festive/star.svg','./audio/victory_original.wav','./audio/victory_christmas_original.wav'];const savedName=(()=>{try{return localStorage.getItem('roger-pocket-name')}catch{return null}})();const savedTheme=(()=>{try{return localStorage.getItem('roger-pocket-theme')}catch{return null}})();let words=new Set(),conundrums=[],soundURL=null;
const HISTORY_KEY='roger-pocket-history-v1',CUSTOM_WORDS_KEY='roger-pocket-approved-words-v1';
const LENGTH_NAMES={3:'Quick',6:'Short',9:'Medium',12:'Standard'};
const MAX_GAMES_PER_VARIANT=50;
function readHistory(){try{const found=JSON.parse(localStorage.getItem(HISTORY_KEY)||'{}');return found&&typeof found==='object'&&!Array.isArray(found)?found:{}}catch{return {}}}
function readCustomWords(){try{const found=JSON.parse(localStorage.getItem(CUSTOM_WORDS_KEY)||'[]');return Array.isArray(found)?found.filter(w=>typeof w==='string'&&/^[a-z]{2,9}$/.test(w)).slice(0,300):[]}catch{return []}}
let completedGames=readHistory(), approvedWords=new Set(readCustomWords());
const historyKey=(theme,length)=>`${theme}:${length}`;
const getGames=(theme,length)=>{const games=completedGames[historyKey(theme,length)];return Array.isArray(games)?games.filter(g=>g&&Number.isFinite(g.score)&&typeof g.date==='string'):[]};
function saveCompletedGame(){
 if(state.recorded)return;state.recorded=true;
 const key=historyKey(state.theme,state.length);
 const entry={date:new Date().toISOString(),name:state.name,score:state.score,rounds:state.history.map(({type,answer,points})=>({type,answer,points}))};
 completedGames[key]=[entry,...getGames(state.theme,state.length)].slice(0,MAX_GAMES_PER_VARIANT);
 try{localStorage.setItem(HISTORY_KEY,JSON.stringify(completedGames));state.savedResult=true}catch{state.savedResult=false}
}
function rememberApprovedWord(word){approvedWords.add(word);words.add(word);try{localStorage.setItem(CUSTOM_WORDS_KEY,JSON.stringify([...approvedWords].slice(-300)))}catch{setNotice('Word accepted for this game, but local storage is unavailable.')}}
const state={name:savedName||'Player',theme:savedTheme==='christmas'?'christmas':'classic',length:3,round:0,phase:'lobby',type:'',tiles:[],target:null,score:0,history:[],pools:{},answer:'',original:'',result:null,expert:null,conundrum:'',scramble:'',seconds:31,deadline:null,buzzUsed:false,responseDeadline:null,clockLeft:THINK_MS,clockStarted:false,celebration:false,notice:'',ready:false,recorded:false,savedResult:null,awaitingApproval:false,cacheStatus:'Checking offline files…'};
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const setNotice=m=>{state.notice=m;const n=$('notice');if(n)n.textContent=m||'';};
const isFinal=()=>state.round===state.length+1;
const fmt=x=>String(x).padStart(2,'0');
const typeFor=round=>round>state.length?'Conundrum':round%3===0?'Numbers':'Letters';
const festiveArt=()=>state.theme==='christmas'?({lobby:'tree',Letters:'snowglobe',Numbers:'reindeer',Conundrum:'santa',finished:'star'}[state.type||'lobby']):null;
const art=()=>{const k=festiveArt();return k?`<img src="festive/${k}.svg" class="hero-badge" alt="" aria-hidden="true">`:''};
const box=(body,kind='')=>`<section class="frame ${kind}">${art()}${body}</section>`;
const heading=(ey,title)=>`<span class="eyebrow">${ey}</span><h1 class="headline">${title}</h1>`;
const button=(action,text,cl='secondary')=>`<button type="button" data-action="${action}" class="${cl}">${text}</button>`;
const dots=()=>`<div id="notice" role="status">${safe(state.notice)}</div>`;
const controls=(items)=>`<div class="controls">${items.join('')}</div>`;
const localDate=iso=>{try{return new Date(iso).toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}catch{return iso}};
function historyPanel(){
 const games=getGames(state.theme,state.length),best=games.length?Math.max(...games.map(g=>g.score)):null;
 const recent=games.slice(0,12).map(g=>`<div class="history-entry"><span>${safe(localDate(g.date))}<small>${safe(g.name||'Player')}</small></span><strong>${g.score} pts</strong></div>`).join('');
 const variants=['classic','christmas'].flatMap(theme=>[3,6,9,12].map(length=>{const gs=getGames(theme,length),top=gs.length?Math.max(...gs.map(g=>g.score)):'—';return `<div class="history-entry"><span>${theme==='classic'?'Classic':'Christmas'} · ${LENGTH_NAMES[length]}</span><strong>${gs.length} played · Best ${top}</strong></div>`})).join('');
 return `<details class="details history-panel"><summary>Solo history · ${state.theme==='christmas'?'Christmas':'Classic'} ${LENGTH_NAMES[state.length]}</summary>
 <p class="hint">Saved on this device only; nothing is uploaded. ${games.length?`${games.length} completed · Personal best ${best} · Latest ${games[0].score}`:'No completed games in this category yet.'}</p>
 ${recent||'<p class="hint">Complete a game to record your first score.</p>'}
 <details class="details"><summary>All 8 variants (4 lengths × 2 themes)</summary>${variants}</details></details>`;
}
function cachePanel(){return `<details class="details"><summary>Offline installation status</summary><p class="hint" id="cache-status">${safe(state.cacheStatus)}</p></details>`}
function updateVerdict(next){
 const previous=state.result.points;
 state.result=next;
 state.score+=next.points-previous;
 const last=state.history[state.history.length-1];
 if(last){last.answer=next.answer;last.points=next.points;}
 state.expert=null;state.awaitingApproval=false;draw();
}
function manualScore(){if(state.phase!=='results')return;
 const points=Number($('manual-points')?.value);
 const available=state.type==='Numbers'?[0,5,7,10]:state.type==='Conundrum'?[0,10]:[0,state.result?.answer?.length===9?18:state.result?.answer?.length||0];
 if(!available.includes(points))throw Error('Choose an available score for this round.');
 if(!window.confirm(`Overwrite this ${state.type} verdict with ${points} points? This updates your total.`))return;
 const original=state.result.original||state.result.answer;
 updateVerdict({...state.result,points,valid:points>0,original,reason:'Player-approved score override (Solo mode)',manual:true});
}
function approveWord(){if(state.phase!=='results'||state.type!=='Letters')return;
 const word=String(state.result?.answer||'').trim().toLowerCase();
 if(!/^[a-z]{2,9}$/.test(word)||!lettersFrom(word,state.tiles)){setNotice('You can only approve a word using the nine available letters.');return;}
 if(!state.awaitingApproval){state.awaitingApproval=true;draw();return;}
 rememberApprovedWord(word);
 const original=state.result.original||state.result.answer;
 updateVerdict({answer:word.toUpperCase(),original,valid:true,points:word.length===9?18:word.length,reason:'Accepted by player after dictionary check',manual:true});
}

function saveName(){try{localStorage.setItem('roger-pocket-name',state.name)}catch{}}
function saveTheme(){try{localStorage.setItem('roger-pocket-theme',state.theme)}catch{}}
function loadMedia(filename){const a=winAudio;a.src=filename; a.volume=.85}
const audioChoice=()=>`<details class="details"><summary>Add Countdown music privately (optional)</summary><p class="hint">After adding this game to the Home Screen, open it from there and choose your own MP3 from Files. It is saved on this device only, never uploaded to GitHub or another server, and should not need importing again unless app data is cleared.</p><label class="file-button">Choose MP3 from Files <input id="song-input" type="file" accept="audio/mpeg,audio/mp3,audio/*"></label><p class="hint" id="song-info">${soundURL?'Personal music loaded':'No music imported — the clock runs silently'}</p></details>`;
function draw(){document.body.classList.toggle('christmas',state.theme==='christmas');const themeText=state.theme==='christmas'?'Christmas':'Classic';const h=`<span class="pill">${themeText} · ${state.length===3?'Quick':state.length===6?'Short':state.length===9?'Medium':'Standard'}</span>`;
 if(!state.ready){screen.innerHTML=box('<p class="loading">Loading the offline word list…</p>');return}
 if(state.phase==='lobby'){
 screen.innerHTML=box(`${heading('YOUR OWN COUNTDOWN STUDIO','Solo Challenge')}
 <p class="lead">No MacBook, TV or other players needed once installed. Play for your own score, then visit Dictionary Corner or the Numbers expert.</p>
 <div class="settings"><div class="full"><label for="your-name">Your name</label><input type="text" id="your-name" maxlength="24" value="${safe(state.name)}" autocomplete="nickname"></div>
 <div><label for="length">Game length</label><select id="length"><option value="3" ${state.length===3?'selected':''}>Quick — 3 + Conundrum</option><option value="6" ${state.length===6?'selected':''}>Short — 6 + Conundrum</option><option value="9" ${state.length===9?'selected':''}>Medium — 9 + Conundrum</option><option value="12" ${state.length===12?'selected':''}>Standard — 12 + Conundrum</option></select></div>
 <div><label for="theme">Studio theme</label><select id="theme"><option value="classic" ${state.theme==='classic'?'selected':''}>Classic</option><option value="christmas" ${state.theme==='christmas'?'selected':''}>Christmas</option></select></div></div>
 ${controls([button('start','Start Solo Challenge','primary')])}${historyPanel()}${audioChoice()}${cachePanel()}${dots()}`);
 return;
 }
 const eyebrow=`ROUND ${state.round} OF ${state.length+1} · ${state.type.toUpperCase()}`;
 const score=`<span class="pill">${safe(state.name)} · ${state.score} points</span>`;
 const tiles=state.type==='Letters'?`<div class="tiles">${Array.from({length:9},(_,i)=>state.tiles[i]?`<span class="tile">${safe(state.tiles[i])}</span>`:'<span class="tile blank">?</span>').join('')}</div>`:state.type==='Numbers'?`<div class="tiles numbers">${state.tiles.map(n=>`<span class="tile">${n}</span>`).join('')}</div><div class="target">${state.target}</div>`:`<div class="tiles">${[...state.scramble].map(c=>`<span class="tile">${safe(c)}</span>`).join('')}</div>`;
 const stageTop=`<div class="row between"><span class="eyebrow">${eyebrow}</span>${score}</div>`;
 if(state.phase==='select'){
 let selector=state.type==='Letters'?`${tiles}<p class="hint">Select nine letters, one vowel or consonant at a time.</p>${controls([button('vowel','Vowel','primary'),button('consonant','Consonant','primary')])}`:`<p class="lead">How many big numbers would you like? The remaining tiles will be small numbers.</p><div class="controls">${Array.from({length:5},(_,i)=>button('big-'+i,`${i} big · ${6-i} small`,i===2?'primary':'secondary')).join('')}</div>`;
 screen.innerHTML=box(`${stageTop}<h1 class="headline">${state.type}</h1>${selector}${dots()}`);return;
 }
 if(state.phase==='thinking'||state.phase==='conundrum_buzz'||state.phase==='conundrum_answer'){
 const respond=state.phase==='conundrum_answer';const title=state.type==='Conundrum'?respond?'Enter your Conundrum answer':'Solve the nine-letter Conundrum':state.type==='Letters'?'Find your longest word':'Find the target';
 const clockSection=`<div class="clockline"><div class="clock"><span id="clock-count">${fmt(Math.ceil((respond?BUZZ_ANSWER_MS:state.clockLeft)/1000))}</span><small>SECONDS</small></div><span class="clocktext">${respond?'Your 15-second answer window':state.type==='Conundrum'?'Buzz when you know the answer':'Thinking time — 31 seconds'}</span></div>`;
 let action=respond?`<label for="conundrum-answer">Your solution</label><input type="text" id="conundrum-answer" maxlength="9" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" autofocus>${controls([button('conundrum-submit','Submit answer','primary')])}`:state.phase==='conundrum_buzz'?(state.buzzUsed?'<p class="hint">Your one Conundrum attempt has been used. The remaining clock is running.</p>':controls([button('buzz','BUZZ! I know it','primary')])):'<p class="hint">Wait for the music to finish. Answer entry opens when the clock reaches zero.</p>';
 screen.innerHTML=box(`${stageTop}<h1 class="headline">${title}</h1>${tiles}${clockSection}${action}${dots()}`);updateClock();return;
 }
 if(state.phase==='answers'){
 screen.innerHTML=box(`${stageTop}${heading('CLOCK COMPLETE','Please enter your answer now.')}${tiles}
 <label for="your-answer">${state.type==='Letters'?'Your longest word':'Your calculation (use brackets where needed)'}</label><input type="text" id="your-answer" maxlength="120" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" value="${safe(state.answer)}" placeholder="${state.type==='Letters'?'E.g. SHATTERS':'E.g. (25+3)*10-7-1'}">
 ${controls([button('lock-answer','Check and lock in','primary')])}<p class="hint">No further solving time is intended after the clock. Check spelling, brackets and autocorrect before locking in.</p>${dots()}`);return;
 }
 if(state.phase==='confirm'){
 screen.innerHTML=box(`${stageTop}${heading('CONFIRM YOUR ENTRY','Is this what you meant?')}<div class="result"><div class="answer">${safe(state.answer||'(No answer)')}</div></div>${controls([button('edit-answer','Edit answer'),button('submit-final','Lock in and see verdict','primary')])}${dots()}`);return;
 }
 if(state.phase==='results'){
 const good=state.result?.valid,points=state.result?.points||0;
 const status=state.result?.manual?state.result.reason:(state.type==='Conundrum'?state.result?.reason:(good?state.type==='Letters'?'Valid word':'Valid calculation':state.result?.reason||'Not accepted'));
 let answerBlock=`<div class="result"><div class="row between"><span class="answer">${safe(state.result?.answer||'No answer')}</span><strong>+${points}</strong></div><p class="hint">${safe(status)}</p>${state.type==='Numbers'&&good?`<p class="hint">Result: ${state.result.value} · ${Math.abs(state.result.value-state.target)} away from ${state.target}</p>`:''}${state.result.original?`<p class="hint">Originally entered: ${safe(state.result.original)}</p>`:''}</div>`;
 const expert=state.expert?(state.type==='Letters'?`<div class="expert"><h3>Dictionary Corner · best available</h3><div class="big">${safe(state.expert.words.join(' · ')||'No valid suggestion')}</div><p class="hint">${state.expert.length} letters, according to this offline dictionary.</p></div>`:state.type==='Numbers'?`<div class="expert"><h3>Numbers expert · ${state.expert.exact?'exact solution':'closest result found'}</h3><div class="big">${safe(state.expert.expression)} = ${state.expert.value}</div><p class="hint">${state.expert.distance} away from target ${state.target}. Your score is unchanged.</p></div>`:''):' ';
 const extra=state.type==='Conundrum'?`<div class="expert"><h3>The Conundrum answer</h3><div class="big">${safe(state.conundrum.toUpperCase())}</div></div>`:'';
 const next=isFinal()?'See final score':'Next round';
 const missingWord=state.type==='Letters'&&!good&&state.result?.reason==='Not recognised by this offline dictionary'&&/^[A-Z]{2,9}$/.test(state.result.answer)&&lettersFrom(state.result.answer,state.tiles);
 const approval=missingWord?`<p class="hint">This word uses the available tiles but is missing from the offline dictionary. If you have checked it in a reliable dictionary, you may approve it for this device.</p>${controls([button('approve-word',state.awaitingApproval?'Confirm: approve this word':'Approve checked word',state.awaitingApproval?'primary':'secondary')])}${state.awaitingApproval?'<p class="hint">Confirm only after checking its spelling and legitimacy.</p>':''}`:'';
 const overrides=state.type==='Numbers'?[0,5,7,10]:state.type==='Conundrum'?[0,10]:[0,state.result?.answer?.length===9?18:state.result?.answer?.length||0];
 const manualOptions=[...new Set(overrides)].map(p=>`<option value="${p}" ${p===points?'selected':''}>${p} points</option>`).join('');
 const manualControls=`<label for="manual-points">Correct a scoring error (solo honour system)</label><select id="manual-points">${manualOptions}</select>${controls([button('manual-score','Override score')])}<p class="hint">Review the answer and award only the correct points. This adjusts your total and the round summary.</p>`;
 const buttons=[state.type!=='Conundrum'&&!state.expert?button('show-expert',state.type==='Letters'?'Ask Dictionary Corner':'Ask the Numbers expert'):'',button(isFinal()?'finish':'next',next,'primary')].filter(Boolean);
 screen.innerHTML=box(`${stageTop}${heading('THE VERDICT IS IN!',state.type)}${tiles}${answerBlock}${expert}${extra}${controls(buttons)}<details class="details" ${state.awaitingApproval?'open':''}><summary>Review or correct this verdict</summary>${state.type==='Conundrum'?'':`<label for="correction">Corrected answer</label><input type="text" id="correction" autocomplete="off" autocorrect="off" spellcheck="false" value="${safe(state.result?.answer||'')}">${controls([button('apply-correction','Recheck answer')])}`}${approval}${manualControls}</details>${dots()}`);return;
 }
 if(state.phase==='finished'){
 if(state.celebration){screen.innerHTML=box(`<div class="celebrate"><div class="confetti"></div>${heading('SOLO CHALLENGE COMPLETE','A brilliant effort!')}<div class="medal">🏅</div><div class="podium">${safe(state.name)}</div><div class="total">${state.score} points</div><p class="lead">Every round counted. Enjoy your moment! ✨</p>${controls([button('replay','Replay celebration','primary'),button('back-score','Final score'),button('new-game','Play again')])}</div>`);return;}
 const summary=state.history.map((r,i)=>`<div class="result"><div class="row between"><div><strong style="font-size:15px;color:#f6f7ff">${i+1}. ${r.type}</strong><br><small>${safe(r.answer||'No answer')}</small></div><strong>+${r.points}</strong></div></div>`).join('');
 screen.innerHTML=box(`${heading('CHALLENGE COMPLETE',`${safe(state.name)} scored ${state.score} points!`)}<p class="lead">${state.savedResult?'Result saved to your on-device history.':'Your result could not be saved locally; check Safari storage permissions.'} Review your rounds or celebrate.</p>${controls([button('celebrate','Reveal celebration','primary'),button('new-game','Play another challenge')])}<details class="details"><summary>Show ${state.history.length} round results</summary>${summary}</details>${historyPanel()}${dots()}`);return;
 }
}
function resetPhase(){state.answer='';state.original='';state.result=null;state.expert=null;state.deadline=null;state.responseDeadline=null;state.clockLeft=THINK_MS;state.buzzUsed=false;state.notice='';state.celebration=false;state.awaitingApproval=false;}
function startGame(){const input=$('your-name');state.name=(input?.value||'Sarah').trim().slice(0,24)||'Sarah';state.length=Number($('length')?.value||3);state.theme=$('theme')?.value||'classic';saveName();saveTheme();state.score=0;state.round=0;state.history=[];state.type='';state.recorded=false;state.savedResult=null;startRound();}
function startRound(){resetPhase();state.round++;state.type=typeFor(state.round);if(state.type==='Letters'){state.phase='select';state.tiles=[];state.pools={vowel:createPool(VOWELS),consonant:createPool(CONSONANTS)};}
 else if(state.type==='Numbers'){state.tiles=[];state.target=null;state.phase='select'}else{state.conundrum=conundrums[Math.floor(Math.random()*conundrums.length)];state.scramble=shuffle([...state.conundrum.toUpperCase()]).join('');if(state.scramble.toLowerCase()===state.conundrum)state.scramble=state.scramble.split('').reverse().join('');state.phase='conundrum_buzz';startCountdown()}
 draw();}
function startCountdown(){clockAudio.pause();clockAudio.currentTime=0;state.clockLeft=THINK_MS;state.deadline=performance.now()+THINK_MS;state.clockStarted=true;
 if(soundURL){clockAudio.src=soundURL;clockAudio.play().catch(()=>{setNotice('Music is blocked; use the sound selector in the lobby and enable playback. The timer continues.')})}
}
function closeThinking(){state.deadline=null; if(state.type==='Conundrum'){finishConundrum(false,'Time is up — Conundrum unsolved.');return;}state.phase='answers';draw();}
function buzz(){if(state.phase!=='conundrum_buzz')return;state.clockLeft=Math.max(0,state.deadline-performance.now());state.deadline=null;state.phase='conundrum_answer';state.responseDeadline=performance.now()+BUZZ_ANSWER_MS;clockAudio.pause();draw();}
function finishConundrum(correct,reason){clockAudio.pause();state.deadline=null;state.responseDeadline=null;state.phase='results';state.result={answer:correct?state.conundrum.toUpperCase():(state.answer||'(No answer)'),valid:correct,points:correct?10:0,reason};state.score+=state.result.points;state.history.push({type:'Conundrum',answer:state.result.answer,points:state.result.points});draw();}
function wrongConundrum(reason){state.buzzUsed=true;state.responseDeadline=null;clockAudio.pause();if(state.clockLeft<=0){finishConundrum(false,reason);return;} // Only one attempt in solo mode: wait out the clock before revealing answer.
 state.phase='conundrum_buzz';state.deadline=performance.now()+state.clockLeft;state.buzzUsed=true;if(soundURL)clockAudio.play().catch(()=>{});draw();}
function updateClock(){const el=$('clock-count');if(!el)return;let rem=state.phase==='conundrum_answer'?Math.max(0,(state.responseDeadline||0)-performance.now()):Math.max(0,(state.deadline||0)-performance.now());el.textContent=fmt(Math.ceil(rem/1000));}
function timerTick(){if(state.phase==='thinking'||state.phase==='conundrum_buzz'){if(state.deadline&&performance.now()>=state.deadline){closeThinking();return;}updateClock()}
 if(state.phase==='conundrum_answer'){if(state.responseDeadline&&performance.now()>=state.responseDeadline){wrongConundrum('No answer submitted within 15 seconds.');return;}updateClock()}}
function checkRegular(){const expr=state.answer.trim();if(state.type==='Letters') {const v=validWord(expr,state.tiles,words);return {...v,answer:expr.toUpperCase(),points:v.valid?v.points:0}}
 try{const value=calculate(expr,state.tiles);return {answer:expr,valid:true,value,points:numberPoints(value,state.target),reason:'Valid calculation'}}catch(e){return {answer:expr,valid:false,points:0,reason:e.message}}}
function commit(){state.result=checkRegular();state.phase='results';state.score+=state.result.points;state.history.push({type:state.type,answer:state.result.answer,points:state.result.points});draw()}
function correction(){if(state.phase!=='results'||state.type==='Conundrum')return;let text=$('correction')?.value||'';const original=state.result.original||state.result.answer;
 state.answer=text;let r=checkRegular();r.original=original;updateVerdict(r)}
function expert(){if(state.phase!=='results')return;state.expert=state.type==='Letters'?longestWords(state.tiles,words):numbersExpert(state.tiles,state.target);draw();}
function winSound(){winAudio.src=state.theme==='christmas'?'audio/victory_christmas_original.wav':'audio/victory_original.wav';winAudio.currentTime=0;winAudio.play().catch(()=>{});}
async function db(){return new Promise((resolve,reject)=>{const request=indexedDB.open('roger-solo-pocket-audio',1);request.onupgradeneeded=()=>request.result.createObjectStore('media');request.onerror=()=>reject(request.error);request.onsuccess=()=>resolve(request.result)})}
async function loadSavedSong(){try{const database=await db();const blob=await new Promise((resolve,reject)=>{const req=database.transaction('media').objectStore('media').get('clock');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});database.close();if(blob)soundURL=URL.createObjectURL(blob);}catch(e){console.warn('Personal audio storage unavailable',e)}}
async function saveSong(blob){const database=await db();await new Promise((resolve,reject)=>{const tx=database.transaction('media','readwrite');tx.objectStore('media').put(blob,'clock');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});database.close();if(soundURL)URL.revokeObjectURL(soundURL);soundURL=URL.createObjectURL(blob);clockAudio.src=soundURL;clockAudio.load()}
screen.addEventListener('change',async e=>{
 if(e.target.id==='theme'||e.target.id==='length'){
  // Apply the visual theme in the lobby immediately; preserve unfinished form input.
  state.name=$('your-name')?.value||state.name;
  state.length=Number($('length')?.value||state.length);
  state.theme=$('theme')?.value==='christmas'?'christmas':'classic';
  saveTheme();draw();return;
 }
 if(e.target.id==='song-input'){const file=e.target.files?.[0];if(file){try{await saveSong(file);const info=$('song-info');if(info)info.textContent=`Saved locally: ${file.name}`;}catch(err){setNotice('Could not save audio on this device: '+err.message)}}}});
screen.addEventListener('click',e=>{const btn=e.target.closest('[data-action]');if(!btn)return;let action=btn.dataset.action;try{
 switch(action){case 'start':startGame();break;case 'vowel':case 'consonant':state.tiles.push(drawOne(state.pools[action]));if(state.tiles.length===9){state.phase='thinking';startCountdown()}draw();break;
 case 'big-0':case 'big-1':case 'big-2':case 'big-3':case 'big-4':state.tiles=chooseNumbers(Number(action.split('-')[1]));state.target=100+Math.floor(Math.random()*900);state.phase='thinking';startCountdown();draw();break;
 case 'lock-answer':state.answer=$('your-answer')?.value||'';state.phase='confirm';draw();break;case 'edit-answer':state.phase='answers';draw();break;case 'submit-final':commit();break;
 case 'next':startRound();break;case 'show-expert':expert();break;case 'apply-correction':correction();break;case 'approve-word':approveWord();break;case 'manual-score':manualScore();break;
 case 'buzz':if(!state.buzzUsed)buzz();break;
 case 'conundrum-submit':state.answer=($('conundrum-answer')?.value||'').trim();if(state.answer.toLowerCase()===state.conundrum)finishConundrum(true,'Correct Conundrum!');else wrongConundrum('Incorrect answer — no further solo buzz is allowed.');break;
 case 'finish':state.phase='finished';saveCompletedGame();draw();break;case 'celebrate':case 'replay':state.celebration=true;draw();winSound();break;case 'back-score':state.celebration=false;draw();break;case 'new-game':clockAudio.pause();winAudio.pause();state.phase='lobby';state.round=0;state.score=0;state.type='';state.celebration=false;draw();break;
 }}catch(err){setNotice(err.message||'Something went wrong')}});
async function init(){try{let [w,a,c]=await Promise.all(['data/words.txt','data/additions.txt','data/conundrums.txt'].map(x=>fetch(x).then(r=>{if(!r.ok)throw Error('Could not load '+x);return r.text()})));
 words=new Set((w+'\n'+a).split(/\r?\n/).map(x=>x.trim().toLowerCase()).filter(x=>/^[a-z]{2,9}$/.test(x)));for(const word of approvedWords)words.add(word);let candidates=c.split(/\r?\n/).map(x=>x.trim().toLowerCase()).filter(Boolean);conundrums=prepareConundrums(candidates,words);if(!conundrums.length)throw Error('No verified Conundrum words');state.ready=true;await loadSavedSong();draw();
 if('serviceWorker' in navigator&&window.isSecureContext){
  try{
   await navigator.serviceWorker.register('./sw.js');
   await navigator.serviceWorker.ready;
   const names=await caches.keys();
   const cache=names.includes(OFFLINE_CACHE)?await caches.open(OFFLINE_CACHE):null;
   const hits=cache?await Promise.all(OFFLINE_ASSETS.map(asset=>cache.match(new URL(asset,location.href)))):[];
   const complete=cache&&hits.length===OFFLINE_ASSETS.length&&hits.every(Boolean);
   state.cacheStatus=complete?'Offline files verified — ready to test':'Offline files incomplete — stay online, reload and check again';const c=$('cache-status');if(c)c.textContent=state.cacheStatus;
  }catch(error){state.cacheStatus='Offline setup failed — check your connection and reload';const c=$('cache-status');if(c)c.textContent=state.cacheStatus;console.warn('Offline setup',error)}
 }else{state.cacheStatus='Offline installation requires a secure HTTPS website';const c=$('cache-status');if(c)c.textContent=state.cacheStatus}
 }catch(e){screen.innerHTML=box(`<h2>Could not prepare the game</h2><p>${safe(e.message)}</p><p>Please use the installed Home Screen version or reload the HTTPS address while online.</p>`)} }
setInterval(timerTick,120);loadMedia('audio/victory_original.wav');init();
