'use strict';
/* Concert Buddy – vanilla JS, data in localStorage. Amounts are stored in IDR (base) and converted for display. */
const $=s=>document.querySelector(s),K='concertbuddy.v1',uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const CATS=['Ticket','Travel','Hotel','Transportation','Food & Drinks','Merchandise','Outfit','Fan Project','Other'];
const RATES={IDR:1,USD:6.2e-5,KRW:.085,JPY:.0095,SGD:8.4e-5,MYR:2.7e-4,EUR:5.7e-5,GBP:4.8e-5};
const LOC={IDR:'id-ID',USD:'en-US',KRW:'ko-KR',JPY:'ja-JP',SGD:'en-SG',MYR:'ms-MY',EUR:'de-DE',GBP:'en-GB'};
const TASKS=['Buy concert ticket','Book transportation','Book hotel','Prepare ID/passport','Prepare lightstick','Prepare powerbank','Prepare outfit','Prepare concert bag','Check venue rules','Download ticket','Check gate opening time','Prepare cash','Prepare payment method','Charge devices','Check weather','Plan meeting point'];
const PACK=['Phone','Powerbank','Charging cable','Lightstick','Lightstick batteries','Wallet','ID','Ticket','Portable fan','Tissues','Hand sanitizer','Water','Medicine','Small bag','Raincoat','Camera'];
const GROUPS=['Before Concert','Concert Day','After Concert'];
const NAV=[['home','🏠','Home'],['concert','🎤','Concert'],['budget','💜','Budget'],['savings','🐷','Savings'],['expenses','🧾','Expenses'],['wish','🛍️','Wishlist'],['check','✅','Checklist'],['day','🗓️','Concert Day'],['mem','📸','Memories'],['settings','⚙️','Settings']];
const MOBILE=['home','budget','wish','check'];
const today=(n=0)=>new Date(Date.now()+n*864e5).toISOString().slice(0,10);
const mk=o=>({id:uid(),artist:'',name:'',date:'',venue:'',budget:Object.fromEntries(CATS.map(c=>[c,0])),expenses:[],goal:0,target:'',sav:[],wish:[],check:TASKS.map((t,i)=>({id:uid(),t,g:GROUPS[i<10?0:1],done:false})),sched:[],pack:PACK.map(t=>({id:uid(),t,done:false})),day:{},mem:{photos:[]},aff:{},...o});
const valid=d=>d&&typeof d==='object'&&Array.isArray(d.concerts)&&d.concerts.every(c=>c&&typeof c==='object'&&typeof c.id==='string');
/* norm(): fills safe defaults so old, partial or hand-edited data never breaks rendering */
const norm=d=>{const s=d.settings||{},r={...RATES};for(const k in RATES){const v=s.rates&&+s.rates[k];if(v>0&&isFinite(v))r[k]=v}
 d.settings={cur:RATES[s.cur]?s.cur:'IDR',theme:s.theme==='dark'?'dark':'light',rates:r};
 d.concerts=d.concerts.map(c=>{const b=mk();c={...b,...c};c.budget={...b.budget,...c.budget};c.mem={photos:[],...c.mem};if(!Array.isArray(c.mem.photos))c.mem.photos=[];
  ['expenses','sav','wish','check','sched','pack'].forEach(k=>{if(!Array.isArray(c[k]))c[k]=b[k];c[k]=c[k].filter(x=>x&&typeof x==='object')});
  if(!c.day||typeof c.day!=='object')c.day={};if(!c.aff||typeof c.aff!=='object')c.aff={};c.goal=+c.goal||0;return c});
 if(!d.concerts.some(c=>c.id===d.active))d.active=d.concerts[0]?.id||'';return d};
function load(){try{const d=JSON.parse(localStorage.getItem(K));if(valid(d))return norm(d)}catch(e){}return norm({concerts:[]})}
let S=load(),view='home',pending=null;
const save=()=>{try{localStorage.setItem(K,JSON.stringify(S));return true}catch(e){toast('Storage is full. Export a backup, then remove photos or old concerts.');return false}};
const C=()=>S.concerts.find(c=>c.id===S.active)||S.concerts[0];
const cur=()=>S.settings.cur,rate=()=>S.settings.rates[cur()]||1,conv=v=>v*rate();
const money=v=>new Intl.NumberFormat(LOC[cur()],{style:'currency',currency:cur(),maximumFractionDigits:['IDR','KRW','JPY'].includes(cur())?0:2}).format(conv(+v||0));
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const sum=(a,f)=>a.reduce((t,x)=>t+(+f(x)||0),0),pct=(a,b)=>b>0?Math.min(100,Math.round(a/b*100)):0;
const fmtD=d=>d?new Date(d+'T00:00').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}):'No date';
const days=d=>d?Math.ceil((new Date(d+'T00:00')-new Date().setHours(0,0,0,0))/864e5):null;
const months=d=>{const n=days(d);return n===null?null:Math.max(1,Math.ceil(n/30.44))};
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('on'),2200)};
/* ---------- UI helpers ---------- */
const stat=(l,v,c='')=>`<div class="card stat ${c}"><small>${l}</small><b>${v}</b></div>`;
const card=(t,b,x='')=>`<section class="card"><div class="ch"><h2>${t}</h2>${x}</div>${b}</section>`;
const btn=(a,l,id='',c='',k='')=>`<button class="btn ${c}" data-a="${a}" data-id="${id}" data-k="${k}"${l.trim()==='✕'?' aria-label="Delete"':''}>${l}</button>`;
const bar=p=>`<div class="bar" role="progressbar" aria-label="Progress" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100"><i style="width:${p}%"></i></div><small>${p}%</small>`;
const empty=(i,t,s,b)=>`<div class="empty"><div>${i}</div><h3>${t}</h3><p>${s}</p>${b||''}</div>`;
const head=(t,x='')=>`<div class="ch"><h1>${t}</h1>${x}</div>`;
function form(title,fs,v,cb){
 const d=$('#dlg');
 d.innerHTML=`<form id="f" novalidate><h2>${title}</h2>${fs.map(f=>{const x=v[f.k]??'',id='f_'+f.k;
 const i=f.t==='select'?`<select id="${id}">${f.o.map(o=>`<option${o==x?' selected':''}>${o}</option>`).join('')}</select>`
 :f.t==='textarea'?`<textarea id="${id}" rows="3">${esc(x)}</textarea>`
 :f.t==='check'?`<input type="checkbox" id="${id}"${x?' checked':''}>`
 :`<input id="${id}" type="${f.t||'text'}" value="${esc(f.m&&x!==''?+conv(x).toFixed(2):x)}"${f.t==='number'?' min="0" step="any" inputmode="decimal"':''}>`;
 return `<label for="${id}">${f.l}${f.r?' *':''}</label>${i}`}).join('')}<p id="err" role="alert"></p><div class="row"><button type="button" class="btn ghost" data-a="close">Cancel</button><button class="btn">Save</button></div></form>`;
 d.setAttribute('aria-label',title);d.showModal();
 $('#f').onsubmit=e=>{e.preventDefault();const o={};
  for(const f of fs){const el=$('#f_'+f.k);let x=f.t==='check'?el.checked:el.value.trim();
   if(f.r&&!x)return $('#err').textContent=f.l+' is required.';
   if(f.t==='number'){x=x===''?0:parseFloat(x);if(!isFinite(x)||x<0||x>1e12)return $('#err').textContent=f.l+' must be a number from 0 to 1,000,000,000,000.';if(f.m)x/=rate()}
   o[f.k]=x}
  cb(o);d.close();save();render()};
}
function ask(msg,fn,label='Delete'){pending=fn;$('#dlg').innerHTML=`<div class="dp"><h2>Are you sure?</h2><p>${msg}</p><div class="row"><button class="btn ghost" data-a="close">Cancel</button><button class="btn danger" data-a="yes">${label}</button></div></div>`;$('#dlg').setAttribute('aria-label','Confirm');$('#dlg').showModal()}
/* ---------- Data-driven lists (add / edit / delete share one path) ---------- */
const EF=[{k:'desc',l:'Description',r:1},{k:'cat',l:'Category',t:'select',o:CATS},{k:'amt',l:'Amount ('+'display currency)',t:'number',m:1,r:1},{k:'date',l:'Date',t:'date',r:1},{k:'note',l:'Notes',t:'textarea'}];
const T={
 exp:{k:'expenses',n:'expense',f:EF,d:()=>({date:today(),cat:CATS[0]})},
 wish:{k:'wish',n:'wishlist item',f:[{k:'name',l:'Item name',r:1},{k:'cat',l:'Category'},{k:'est',l:'Estimated price',t:'number',m:1},{k:'act',l:'Actual price',t:'number',m:1},{k:'pri',l:'Priority',t:'select',o:['Must Have','Want','Maybe']},{k:'done',l:'Purchased',t:'check'}],d:()=>({pri:'Want'})},
 sched:{k:'sched',n:'schedule item',f:[{k:'time',l:'Time',t:'time',r:1},{k:'t',l:'Activity',r:1}],d:()=>({})},
 sav:{k:'sav',n:'savings entry',f:[{k:'date',l:'Date',t:'date',r:1},{k:'amt',l:'Amount',t:'number',m:1,r:1},{k:'note',l:'Note'}],d:()=>({date:today()})},
 check:{k:'check',n:'task',f:[{k:'t',l:'Task',r:1},{k:'g',l:'Category',t:'select',o:GROUPS}],d:()=>({g:GROUPS[0]})},
 pack:{k:'pack',n:'packing item',f:[{k:'t',l:'Item',r:1}],d:()=>({})}};
const cap=s=>s[0].toUpperCase()+s.slice(1);
const A={
 go(e){view=e.dataset.id;try{history.pushState({v:view},'')}catch(x){}render();scrollTo(0,0)},close(){$('#dlg').close()},yes(){$('#dlg').close();pending&&pending();pending=null;save();render()},
 add(e){const t=T[e.dataset.k];form('Add '+t.n,t.f,t.d(),o=>{C()[t.k].push({id:uid(),...o});toast(cap(t.n)+' added')})},
 edit(e){const t=T[e.dataset.k],it=C()[t.k].find(x=>x.id===e.dataset.id);if(!it)return;form('Edit '+t.n,t.f,it,o=>{Object.assign(it,o);toast(cap(t.n)+' updated')})},
 del(e){const t=T[e.dataset.k];ask('Delete this '+t.n+'?',()=>{const c=C();c[t.k]=c[t.k].filter(x=>x.id!==e.dataset.id);toast(cap(t.n)+' deleted')})},
 tog(e){const it=C()[e.dataset.k].find(x=>x.id===e.dataset.id);if(!it)return;it.done=!it.done;save();render()},
 buy(e){const it=C().wish.find(x=>x.id===e.dataset.id);if(!it)return;it.done=!it.done;toast('Wishlist updated');save();render()},
 newC(){cForm('Create concert',{},o=>{const c=mk(o);S.concerts.push(c);S.active=c.id;view='home';toast('Concert created')})},
 editC(){cForm('Edit concert',C(),o=>{Object.assign(C(),o);toast('Changes saved')})},
 pick(e){S.active=e.dataset.id;view='home';save();render()},
 dup(e){const c=JSON.parse(JSON.stringify(S.concerts.find(x=>x.id===e.dataset.id)));c.id=uid();c.name+=' (copy)';c.demo=0;S.concerts.push(c);save();render();toast('Concert duplicated')},
 renC(e){const c=S.concerts.find(x=>x.id===e.dataset.id);form('Rename concert',[{k:'artist',l:'Artist',r:1},{k:'name',l:'Concert name',r:1}],c,o=>{Object.assign(c,o);toast('Concert renamed')})},
 delC(e){ask('Delete this concert and all its data?',()=>{S.concerts=S.concerts.filter(x=>x.id!==e.dataset.id);S.active=S.concerts[0]?.id||'';toast('Concert deleted')})},
 goal(){const c=C();form('Savings goal',[{k:'goal',l:'Concert savings goal',t:'number',m:1},{k:'target',l:'Target date',t:'date'}],c,o=>{Object.assign(c,o);toast('Changes saved')})},
 day(){form('Concert day details',[['gate','Gate opening','time'],['soundcheck','Soundcheck','time'],['start','Show start','time'],['end','Expected end','time'],['meet','Meeting point'],['transport','Transport'],['hotel','Hotel'],['notes','Notes','textarea']].map(a=>({k:a[0],l:a[1],t:a[2]})),C().day,o=>{Object.assign(C().day,o);toast('Changes saved')})},
 memSave(){const m=C().mem;['song','moment','best','who','exp','notes'].forEach(k=>m[k]=$('#m_'+k).value);save();toast('Memory saved')},
 photo(){$('#ph').click()},delPh(e){C().mem.photos.splice(+e.dataset.id,1);save();render()},
 theme(e){S.settings.theme=e.dataset.id;save();render()},
 /* Export: touch devices (iOS/Android) get the native share sheet ("Save to Files"); others get a normal download. */
 async export(){const name='concert-buddy-backup-'+today()+'.json',blob=new Blob([JSON.stringify(S,null,2)],{type:'application/json'});
  try{const f=new File([blob],name,{type:'application/json'});if(matchMedia('(pointer:coarse)').matches&&navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:'Concert Buddy backup'});return toast('Backup exported')}}catch(e){if(e&&e.name==='AbortError')return}
  try{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.rel='noopener';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000);toast('Backup exported')}catch(e){toast('Export failed. Try opening Concert Buddy in your browser.')}},
 import(){$('#imp').click()},print(){try{print();if(navigator.standalone||matchMedia('(display-mode:standalone)').matches)toast('No print dialog? Open Concert Buddy in Safari and use Share → Print.')}catch(x){toast('Printing is not available in this browser.')}},
 reset(){ask('This erases every concert and setting in this browser. Export a backup first if unsure.',()=>{localStorage.removeItem(K);S=load();view='home';toast('All data reset')},'Reset everything')},
 demo(){const c=mk({demo:1,artist:'Your Favorite Artist',name:'World Tour 2026',venue:'Main Arena',date:today(42),goal:8e6,target:today(150),
  budget:{Ticket:2.5e6,Travel:1.5e6,Hotel:1e6,Transportation:5e5,'Food & Drinks':4e5,Merchandise:1.5e6,Outfit:5e5,'Fan Project':1e5,Other:0},
  expenses:[['Concert ticket','Ticket',2.35e6,-30],['Train tickets','Travel',1.2e6,-10],['Hotel deposit','Hotel',7e5,-5]].map(a=>({id:uid(),desc:a[0],cat:a[1],amt:a[2],date:today(a[3]),note:''})),
  sav:[{id:uid(),date:today(-60),amt:3e6,note:'Starting fund'},{id:uid(),date:today(-20),amt:1.5e6,note:'Bonus'}],
  wish:[{id:uid(),name:'Official lightstick',cat:'Merchandise',est:8e5,act:0,pri:'Must Have',done:false},{id:uid(),name:'Tour T-shirt',cat:'Merchandise',est:4e5,act:4.2e5,pri:'Want',done:true}],
  sched:[['10:00','Leave hotel'],['12:00','Lunch'],['15:00','Merchandise queue'],['17:00','Gate opens'],['19:00','Concert starts']].map(a=>({id:uid(),time:a[0],t:a[1]}))});
  c.check.slice(0,8).forEach(x=>x.done=true);S.concerts.push(c);S.active=c.id;view='home';save();render();toast('Demo data added')},
 rmDemo(){S.concerts=S.concerts.filter(c=>!c.demo);S.active=S.concerts[0]?.id||'';save();render();toast('Demo data removed')}};
const cForm=(t,v,cb)=>form(t,[{k:'artist',l:'Artist',r:1},{k:'name',l:'Concert name',r:1},{k:'date',l:'Date',t:'date',r:1},{k:'venue',l:'Venue'}],v,cb);
/* ---------- Views ---------- */
const spent=c=>sum(c.expenses,e=>e.amt),planned=c=>sum(CATS,k=>c.budget[k]),saved=c=>sum(c.sav,s=>s.amt);
const cd=n=>n===null?'Set a date':n>0?n+' DAYS TO GO':n===0?'TODAY IS CONCERT DAY':'CONCERT DAY HAS PASSED';
const trueCost=c=>{const t=spent(c);return `<div class="hero"><small class="muted">Your True Concert Cost</small><div class="big">${money(t)}</div>${CATS.map(k=>{const v=sum(c.expenses.filter(e=>e.cat===k),e=>e.amt);return v?`<span class="pill">${k}: ${money(v)}</span> `:''}).join('')||'<p>Add expenses to see the full picture.</p>'}<p>Your concert experience cost more than just the ticket. 💜</p></div>`};
const list=(c,k,g)=>{const l=c[k].filter(x=>!g||x.g===g);return l.map(x=>`<div class="item ${x.done?'done':''}"><input type="checkbox" aria-label="Done: ${esc(x.t)}" ${x.done?'checked':''} data-a="tog" data-id="${x.id}" data-k="${k}"><div><b>${esc(x.t)}</b></div>${btn('del','✕',x.id,'ghost sm',k)}</div>`).join('')};
const pg=l=>`${l.filter(x=>x.done).length} / ${l.length} completed`+bar(pct(l.filter(x=>x.done).length,l.length));
const V={
home(c){const sp=spent(c),pl=planned(c),sv=saved(c),ck=c.check;
 return `<section class="hero"><small class="muted">Your K-Pop Concert Companion</small><h1>${esc(c.artist)}</h1><p>${esc(c.name)}${c.venue?' · '+esc(c.venue):''}</p><p>${fmtD(c.date)}</p><span class="count">${cd(days(c.date))}</span></section>
 <div class="grid4">${stat('Total budget',money(pl))}${stat('Spent',money(sp))}${stat('Remaining',sp>pl?'Over budget by '+money(sp-pl):money(pl-sp),sp>pl?'bad':'')}${stat('Saved',money(sv))}</div>
 <div class="g2">${card('Savings progress',bar(pct(sv,c.goal))+`<small>${money(sv)} of ${money(c.goal)}</small>`,btn('go','Savings','savings','ghost sm'))}${card('Checklist',pg(ck),btn('go','Open','check','ghost sm'))}</div>${trueCost(c)}`},
concert(c){return head('My Concerts',btn('newC','+ New Concert'))+`<div class="card"><div class="ch"><h2>${esc(c.artist)} – ${esc(c.name)}</h2>${btn('editC','Edit details','','ghost sm')}</div><p>${esc(c.venue)||'No venue'} · ${fmtD(c.date)}</p></div>`+S.concerts.map(x=>`<div class="card item"><div><b>${esc(x.artist)}</b><small>${esc(x.name)} · ${fmtD(x.date)}${x.id===c.id?' · Active':''}</small></div>${btn('pick','Select',x.id,'sm')}${btn('renC','Rename',x.id,'ghost sm')}${btn('dup','Duplicate',x.id,'ghost sm')}${btn('delC','Delete',x.id,'ghost sm')}</div>`).join('')},
budget(c){const sp=spent(c),pl=planned(c);
 return head('Budget')+card('Categories',`<div class="tw"><table><tr><th>Category</th><th>Planned</th><th>Actual</th><th>Difference</th></tr>${CATS.map(k=>{const a=sum(c.expenses.filter(e=>e.cat===k),e=>e.amt),d=c.budget[k]-a;return `<tr><td>${k}</td><td><input aria-label="Planned ${k}" type="number" min="0" step="any" data-cat="${k}" value="${+conv(c.budget[k]).toFixed(2)}"></td><td>${money(a)}</td><td class="${d<0?'bad':''}">${d<0?'Over ':''}${money(Math.abs(d))}</td></tr>`}).join('')}<tr><th>Total</th><th>${money(pl)}</th><th>${money(sp)}</th><th class="${sp>pl?'bad':''}">${sp>pl?'Over budget: ':'Remaining: '}${money(Math.abs(pl-sp))}</th></tr></table></div>`)+trueCost(c)},
expenses(c){return head('Expenses',btn('add','+ Add Expense','','','exp'))+`<div class="card"><div class="tb"><input id="q" type="search" placeholder="Search description" aria-label="Search expenses"><select id="fc" aria-label="Filter category"><option>All</option>${CATS.map(k=>`<option>${k}</option>`).join('')}</select></div><div id="list">${expList()}</div></div>`},
savings(c){const sv=saved(c),rem=Math.max(0,c.goal-sv),m=months(c.target),a=c.aff||{},d={inc:a.inc||0,ess:a.ess||0,sav:sv,cost:Math.max(planned(c),spent(c)),mo:months(c.date)||1};
 const inp=(id,l,v,m)=>`<label for="${id}">${l}</label><input id="${id}" type="number" min="0" step="any" data-aff="${id}" value="${m?+conv(v).toFixed(2):v}">`;
 return head('Savings',btn('goal','Edit goal','','ghost sm'))+`<div class="grid4">${stat('Goal',money(c.goal))}${stat('Saved',money(sv))}${stat('Remaining',money(rem))}${stat('Monthly needed',m?money(rem/m):'Set target date')}</div>`+
 card('Progress',bar(pct(sv,c.goal))+`<small>${m?m+' months remaining':'No target date'}</small>`)+
 card('Savings history',c.sav.length?[...c.sav].sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map(s=>`<div class="item"><div><b>${money(s.amt)}</b><small>${fmtD(s.date)} ${esc(s.note)}</small></div>${btn('del','Delete',s.id,'ghost sm','sav')}</div>`).join(''):empty('🐷','Start your concert fund.','Log a deposit to track your progress.',btn('add','+ Add Savings','','','sav')),btn('add','+ Add Savings','','sm','sav'))+
 card('Can I Afford This?',`<div class="g2"><div>${inp('inc','Monthly income',d.inc,1)}${inp('ess','Monthly essential expenses',d.ess,1)}${inp('sav','Current savings',d.sav,1)}${inp('cost','Concert total cost',d.cost,1)}${inp('mo','Months until concert',d.mo,0)}</div><div id="aff"></div></div>`)},
wish(c){const w=c.wish,est=sum(w,x=>x.est),act=sum(w,x=>x.act);
 return head('Wishlist',btn('add','+ Add Item','','','wish'))+`<div class="grid4">${stat('Estimated total',money(est))}${stat('Actual total',money(act))}${stat('Potential difference',money(sum(w,x=>x.act?x.act-x.est:0)))}</div>`+(w.length?`<div class="g2">${w.map(x=>`<div class="card"><div class="ch"><h2>${esc(x.name)}</h2><span class="pill">${x.pri}</span></div><small>${esc(x.cat)}</small><p>Estimated: ${money(x.est)}<br>Actual: ${x.act?money(x.act):'—'}<br>${x.done?'✅ Purchased':'🕓 Not purchased'}</p><div class="tb">${btn('buy',x.done?'Mark unpurchased':'Mark purchased',x.id,'sm')}${btn('edit','Edit',x.id,'ghost sm','wish')}${btn('del','Delete',x.id,'ghost sm','wish')}</div></div>`).join('')}</div>`:card('',empty('✨','Start building your merch wishlist.',"Add something you've been eyeing.",btn('add','+ Add Item','','','wish'))))},
check(c){return head('Checklist',btn('add','+ Add Task','','','check'))+card('Progress',pg(c.check))+(GROUPS.map(g=>{const l=list(c,'check',g);return l?card(g,l):''}).join('')||card('Tasks',empty('✅','Your checklist is empty.','Add the first thing to prepare.',btn('add','+ Add Task','','','check'))))+head('Packing',btn('add','+ Add Item','','','pack'))+card('Packing progress',pg(c.pack)+(list(c,'pack')||empty('🎒','No packing items.','Add what you will bring.')))},
day(c){const d=c.day,L=[['gate','Gate opening'],['soundcheck','Soundcheck'],['start','Show start'],['end','Expected end'],['meet','Meeting point'],['transport','Transport'],['hotel','Hotel'],['notes','Notes']].filter(a=>d[a[0]]);
 return head('Concert Day',btn('day','Edit details','','ghost sm'))+card(fmtD(c.date)+' · '+(esc(c.venue)||'Venue'),L.length?`<div class="g2">${L.map(a=>`<div class="dt"><small>${a[1]}</small><b>${esc(d[a[0]])}</b></div>`).join('')}</div>`:empty('🎟️','Add your gate time and meeting point.','Everything for the day, in one glance.',btn('day','Add details')))+
 card('Schedule',c.sched.length?`<div class="tl">${[...c.sched].sort((a,b)=>(a.time||'').localeCompare(b.time||'')).map(s=>`<div><b class="tm">${esc(s.time)}</b> ${esc(s.t)} ${btn('edit','Edit',s.id,'ghost sm','sched')}${btn('del','✕',s.id,'ghost sm','sched')}</div>`).join('')}</div>`:empty('🗓️','No schedule yet.','Plan your day hour by hour.',btn('add','+ Add Item','','','sched')),btn('add','+ Add Item','','sm','sched'))},
mem(c){const m=c.mem,f=(k,l,t)=>`<label for="m_${k}">${l}</label>${t==='s'?`<select id="m_${k}">${['','⭐','⭐⭐','⭐⭐⭐','⭐⭐⭐⭐','⭐⭐⭐⭐⭐'].map(o=>`<option${o===m[k]?' selected':''}>${o}</option>`).join('')}</select>`:t==='t'?`<textarea id="m_${k}" rows="4">${esc(m[k])}</textarea>`:`<input id="m_${k}" value="${esc(m[k])}">`}`;
 return head('Memories')+card('Concert memory',f('song','Favorite song')+f('moment','Favorite moment')+f('best','Best performance')+f('who','Who did you go with?')+f('exp','Overall experience','s')+f('notes','Personal notes','t')+`<div class="row">${btn('memSave','Save Memory')}</div>`)+
 card('Photos (kept on this device)',(m.photos.length?`<div class="ph">${m.photos.map((p,i)=>`<div><img src="${p}" alt="Concert photo ${i+1}">${btn('delPh',' ✕',i,'ghost sm')}</div>`).join('')}</div>`:empty('📸','Your concert memories will live here.','Add photos from your night.',btn('photo','+ Add Photos'))),btn('photo','+ Add Photos','','sm'))},
more(){return head('More')+`<div class="g2">${NAV.filter(n=>!MOBILE.includes(n[0])&&n[0]!=='home').map(n=>btn('go',n[1]+' '+n[2],n[0],'ghost')).join('')}</div>`},
settings(){const s=S.settings;return head('Settings')+card('Currency',`<label for="cur">Display currency</label><select id="cur" data-ch="cur">${Object.keys(RATES).map(k=>`<option${k===s.cur?' selected':''}>${k}</option>`).join('')}</select><p class="muted">Exchange rates are approximate and manual — edit them below (no live rates). Amounts per 1,000,000 IDR:</p><div class="g2">${Object.keys(RATES).filter(k=>k!=='IDR').map(k=>`<div><label for="r_${k}">${k}</label><input id="r_${k}" type="number" min="0" step="any" data-rate="${k}" value="${+(s.rates[k]*1e6).toFixed(2)}"></div>`).join('')}</div>`)+
 card('Theme',`<div class="tb">${btn('theme','☀️ Light','light',s.theme==='light'?'':'ghost')}${btn('theme','🌙 Dark','dark',s.theme==='dark'?'':'ghost')}</div>`)+
 card('Your data',`<div class="tb">${btn('export','Export My Data')}${btn('import','Import Data','','ghost')}${btn('print','Print Planner','','ghost')}${btn('demo','Try Demo Data','','ghost')}${S.concerts.some(c=>c.demo)?btn('rmDemo','Remove Demo Data','','ghost'):''}${btn('reset','Reset All Data','','danger')}</div><p class="muted">Your planner data is stored locally in this browser. Nothing is sent anywhere.</p>`)}};
function expList(){const c=C(),q=($('#q')?.value||'').toLowerCase(),f=$('#fc')?.value||'All',l=c.expenses.filter(e=>(f==='All'||e.cat===f)&&(e.desc||'').toLowerCase().includes(q)).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
 return l.length?l.map(e=>`<div class="item"><div><b>${esc(e.desc)}</b><small>${esc(e.cat)} · ${fmtD(e.date)}${e.note?' · '+esc(e.note):''}</small></div><b>${money(e.amt)}</b>${btn('edit','Edit',e.id,'ghost sm','exp')}${btn('del','Delete',e.id,'ghost sm','exp')}</div>`).join('')+`<p class="tot">Total shown: ${money(sum(l,e=>e.amt))}</p>`:empty('🧾','Your concert spending will appear here.','Log tickets, travel, food and merch as you go.',btn('add','+ Add Expense','','','exp'))}
function affOut(p){const g=id=>Math.min(1e12,Math.max(0,parseFloat($('#'+id).value)||0)),c=C(),r=rate(),v={inc:g('inc'),ess:g('ess'),sav:g('sav'),cost:g('cost')},mo=Math.max(1,g('mo')),gap=Math.max(0,v.cost-v.sav),av=v.inc-v.ess,f=x=>money(x/r);
 if(p){c.aff={inc:v.inc/r,ess:v.ess/r};save()}
 $('#aff').innerHTML=[['Available monthly money',f(av)],['Current funding gap',f(gap)],['Months remaining',mo],['Required monthly saving',f(gap/mo)],['Projected savings by concert',f(v.sav+av*mo)]].map(a=>`<div class="item"><div>${a[0]}</div><b>${a[1]}</b></div>`).join('')+'<small>These are calculations only, not financial advice.</small>'}
function render(){document.documentElement.dataset.theme=S.settings.theme;const tc=document.querySelector('meta[name=theme-color]');if(tc)tc.content=S.settings.theme==='dark'?'#15131f':'#F8F7FC';const c=C();
 const ae=document.activeElement,D=ae&&ae.dataset||{},fk=!ae||ae===document.body||$('#dlg').open?'':D.a?`[data-a="${D.a}"][data-id="${D.id}"][data-k="${D.k}"]`:ae.id?'#'+ae.id:D.cat?`[data-cat="${D.cat}"]`:'';
 $('#side').innerHTML='<div class="logo">🎫 CONCERT BUDDY</div>'+NAV.map(n=>`<button class="${view===n[0]?'on':''}"${view===n[0]?' aria-current="page"':''} data-a="go" data-id="${n[0]}"><span>${n[1]}</span>${n[2]}</button>`).join('');
 $('#bot').innerHTML=NAV.filter(n=>MOBILE.includes(n[0])).map(n=>`<button class="${view===n[0]?'on':''}"${view===n[0]?' aria-current="page"':''} data-a="go" data-id="${n[0]}"><span>${n[1]}</span>${n[2]}</button>`).join('')+`<button class="${!MOBILE.includes(view)?'on':''}" data-a="go" data-id="more"><span>⋯</span>More</button>`;
 const top=S.concerts.length?`<div class="top tb"><label for="sel" hidden>My Concerts</label><select id="sel" data-ch="sel" aria-label="My Concerts">${S.concerts.map(x=>`<option value="${x.id}"${x.id===c.id?' selected':''}>${esc(x.artist)} – ${esc(x.name)}</option>`).join('')}</select></div>`:'';
 $('#main').innerHTML=c||view==='settings'||view==='more'?top+(V[view]||V.home)(c):`<div class="hero"><small class="muted">CONCERT BUDDY · Your K-Pop Concert Companion</small><h1>Ready for your next concert?</h1><p>Plan your budget, track every expense, and make the most of your concert experience.</p><div class="tb">${btn('newC','Create My Concert')}${btn('demo','Try Demo','','ghost')}</div></div>${view==='more'?'':''}`;
 if($('#aff'))affOut();if(fk)([...document.querySelectorAll(fk)].find(x=>x.offsetParent)||$('#main')).focus({preventScroll:true})}
/* ---------- Events ---------- */
document.addEventListener('click',e=>{const el=e.target.closest('[data-a]');if(el&&A[el.dataset.a])A[el.dataset.a](el)});
$('#dlg').addEventListener('click',e=>{if(e.target===$('#dlg'))$('#dlg').close()});
document.addEventListener('change',e=>{const t=e.target;
 if(t.dataset.ch==='cur'){S.settings.cur=t.value;save();render()}
 else if(t.dataset.ch==='sel'){S.active=t.value;save();render()}
 else if(t.dataset.rate){const v=parseFloat(t.value);if(v>0){S.settings.rates[t.dataset.rate]=v/1e6;save();toast('Changes saved')}else toast('Rate must be above 0')}
 else if(t.dataset.cat){const v=parseFloat(t.value);if(v>=0&&v<=1e12){C().budget[t.dataset.cat]=v/rate();save();toast('Budget updated')}else toast('Enter a budget of 0 or more');setTimeout(render)}
 else if(t.id==='q'||t.id==='fc')$('#list').innerHTML=expList()});
document.addEventListener('input',e=>{if(e.target.id==='q')$('#list').innerHTML=expList();if(e.target.dataset.aff)affOut(1)});
$('#imp').onchange=e=>{const f=e.target.files[0];e.target.value='';if(!f)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!valid(d))throw 0;ask('Replace all current data with this backup?',()=>{S=norm(d);toast('Backup imported')},'Import')}catch(x){toast('That file is not a valid Concert Buddy backup.')}};r.readAsText(f)};
$('#ph').onchange=e=>{const c=C(),fs=[...e.target.files].filter(f=>f.type.startsWith('image/')&&f.size<2e7);e.target.value='';if(!fs.length)return toast('Choose image files under 20 MB.');
 fs.forEach(f=>{const r=new FileReader();r.onerror=()=>toast('Could not read that photo.');r.onload=()=>{const im=new Image();im.onerror=()=>toast('That photo could not be opened.');im.onload=()=>{const s=Math.min(1,800/Math.max(im.width,im.height)),cv=document.createElement('canvas');cv.width=Math.max(1,Math.round(im.width*s));cv.height=Math.max(1,Math.round(im.height*s));cv.getContext('2d').drawImage(im,0,0,cv.width,cv.height);
 const p=c.mem.photos;p.push(cv.toDataURL('image/jpeg',.7));if(save())toast('Photo added');else p.pop();render()};im.src=r.result};r.readAsDataURL(f)})};
addEventListener('popstate',e=>{view=e.state?.v||'home';render()});try{history.replaceState({v:view},'')}catch(x){}
/* Print Planner: temporarily builds a full multi-section printout, then clears it */
addEventListener('beforeprint',()=>{const c=C();if(c)$('#pa').innerHTML=['home','budget','savings','expenses','wish','check','day'].map(v=>V[v](c)).join('')});
addEventListener('afterprint',()=>$('#pa').innerHTML='');
render();
/* PWA: works on http(s) hosting only (service workers are not available on file://). Ask the browser to keep local data. */
if(/^https?:$/.test(location.protocol)){if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist().catch(()=>{})}catch(e){}}
