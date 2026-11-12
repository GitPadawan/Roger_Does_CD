// Standalone Solo Countdown game logic: no server, no network lookups, no eval.
export const THINK_MS = 30900;
export const BUZZ_ANSWER_MS = 15000;
export const VOWELS = {A:15,E:21,I:13,O:13,U:5};
export const CONSONANTS = {B:2,C:3,D:6,F:2,G:3,H:2,J:1,K:1,L:5,M:4,N:8,P:4,Q:1,R:9,S:9,T:9,V:1,W:1,X:1,Y:1,Z:1};
export const BIG=[25,50,75,100];
export const SMALL=Array.from({length:20},(_,i)=>i%10+1);
export const intRandom=(max)=>Math.floor(Math.random()*max);
export function createPool(weights){return Object.entries(weights).flatMap(([k,count])=>Array(count).fill(k));}
export function drawOne(pool){if(!pool.length)throw Error('No tiles remain in this bag.');return pool.splice(intRandom(pool.length),1)[0];}
export function shuffle(xs){const a=[...xs];for(let i=a.length-1;i>0;i--){let j=intRandom(i+1);[a[i],a[j]]=[a[j],a[i]]}return a;}
export function chooseNumbers(bigCount){if(!Number.isInteger(bigCount)||bigCount<0||bigCount>4)throw Error('Choose 0 to 4 big numbers.');return [...shuffle(BIG).slice(0,bigCount),...shuffle(SMALL).slice(0,6-bigCount)];}
export const lettersFrom=(word,letters)=>{
  const counts=new Map();for(let l of letters)counts.set(l.toLowerCase(),(counts.get(l.toLowerCase())||0)+1);
  for(let l of word.toLowerCase()){const n=counts.get(l)||0;if(!n)return false;counts.set(l,n-1)}return true;
};
export function validWord(text,letters,words){const word=text.trim().toLowerCase();if(!word)return {valid:false,reason:'No word entered'};
 if(!/^[a-z]{1,9}$/.test(word))return {valid:false,reason:'Use up to nine English letters, without spaces or hyphens'};
 if(!lettersFrom(word,letters))return {valid:false,reason:'That word uses unavailable letters'};
 if(!words.has(word))return {valid:false,reason:'Not recognised by this offline dictionary'};
 return {valid:true,reason:'Valid word',points:word.length===9?18:word.length};
}
// Hand-written grammar. Each literal must correspond to a selected tile; positive integer results at every step.
export function calculate(expression,tiles){if(!expression||expression.length>120)throw Error('Enter a calculation (maximum 120 characters).');
 const s=expression.replaceAll('×','*').replaceAll('÷','/'); if(!/^[\d\s()+*/\-]+$/.test(s))throw Error('Use the number tiles, +, -, ×, ÷ and brackets only.');
 const tokens=s.match(/\d+|[()+*/\-]/g)||[];let i=0,steps=0;const used=new Map(),allowed=new Map();for(const n of tiles)allowed.set(n,(allowed.get(n)||0)+1);
 function check(n){if(!Number.isSafeInteger(n)||n<=0||n>1e12)throw Error('Every intermediate result must be a positive whole number.');return n;}
 function atom(){if(++steps>100)throw Error('Calculation is too complex.'); const t=tokens[i++];if(t==='('){const n=sum();if(tokens[i++]!==')')throw Error('Missing closing bracket.');return n;}
 if(!t||!/^[0-9]+$/.test(t))throw Error('Invalid calculation syntax.');const n=Number(t); if(!allowed.has(n))throw Error('The number '+n+' is not a selected tile.');used.set(n,(used.get(n)||0)+1);if(used.get(n)>allowed.get(n))throw Error('The tile '+n+' was used too many times.');return n;}
 function product(){let n=atom();while(tokens[i]==='*'||tokens[i]==='/'){const op=tokens[i++],r=atom();if(op==='/'&&(!r||n%r!==0))throw Error('Division must yield a whole number at every step.');n=check(op==='*'?n*r:n/r);}return n;}
 function sum(){let n=product();while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++],r=product();n=check(op==='+'?n+r:n-r);}return n;}
 const result=sum();if(i!==tokens.length)throw Error('Calculation has unexpected symbols.');return result;
}
export function numberPoints(result,target){const delta=Math.abs(result-target);return delta===0?10:delta<=5?7:delta<=10?5:0;}
export function longestWords(letters,words,limit=4){let best=0,found=[];for(const w of words){if(w.length<best||w.length>letters.length)continue;if(!lettersFrom(w,letters))continue;if(w.length>best){best=w.length;found=[]}if(w.length===best)found.push(w.toUpperCase())}return {length:best,words:found.sort().slice(0,limit)};}
export function prepareConundrums(candidates,words){const signatures=new Map();for(const w of words){if(w.length!==9)continue;const sig=[...w].sort().join('');if(!signatures.has(sig))signatures.set(sig,[]);signatures.get(sig).push(w)}return [...new Set(candidates)].filter(w=>w.length===9&&words.has(w)&&signatures.get([...w].sort().join(''))?.length===1);}
// Exhaustive memoised subset DP. All expressions use the same legal arithmetic as calculate().
export function numbersExpert(tiles,target){if(tiles.length!==6||target<100||target>999)throw Error('Invalid numbers board');
 const dp=Array.from({length:64},()=>new Map());let best={value:tiles[0],expression:String(tiles[0]),distance:Math.abs(tiles[0]-target)};
 const maybe=(map,value,expression)=>{if(!Number.isSafeInteger(value)||value<=0||value>1e12)return;const old=map.get(value);if(old===undefined||expression.length<old.length)map.set(value,expression)};
 for(let i=0;i<6;i++)dp[1<<i].set(tiles[i],String(tiles[i]));
 for(let mask=1;mask<64;mask++){
 if((mask&(mask-1))!==0){for(let part=(mask-1)&mask;part;part=(part-1)&mask){const other=mask^part;if(part>=other)continue;
 for(const [a,ae] of dp[part])for(const [b,be] of dp[other]){let m=dp[mask];maybe(m,a+b,`(${ae}+${be})`);maybe(m,a*b,`(${ae}*${be})`);if(a>b)maybe(m,a-b,`(${ae}-${be})`);if(b>a)maybe(m,b-a,`(${be}-${ae})`);if(a%b===0)maybe(m,a/b,`(${ae}/${be})`);if(b%a===0)maybe(m,b/a,`(${be}/${ae})`);}
 }}for(let [value,expression]of dp[mask]){const distance=Math.abs(value-target);if(distance<best.distance||(distance===best.distance&&expression.length<best.expression.length))best={value,expression,distance};}
 if(best.distance===0 && best.expression.length<=7)break;
 }return {...best,exact:best.distance===0};
}
