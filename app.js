const SB_URL='https://qiejgpvawhxzqmxdjmbd.supabase.co';
const SB_KEY='sb_publishable_rc10-toTkzah_8IN-JA0uQ_RrA2TFiv';
if(!window.supabase){document.getElementById('app').innerHTML='<div class="splash"><p class="err">تعذر تحميل مكتبة الاتصال. تحقق من الإنترنت.</p><button class="btn" data-reload="1">إعادة المحاولة</button></div>';throw new Error('supabase-js not loaded')}
const sb=window.supabase.createClient(SB_URL,SB_KEY);
const ADMIN_APP=false;
const LET=['A','B','C','D','E','F'];
const COLORS=['#1F5FBF','#3B82C4','#5B6FD6','#1E8FB0','#4F5FA8','#2D6A9F','#0E4A8A','#7A98D8'];
/* ---------- جدولة FSRS (التكرار المتباعد) ---------- */
const FW=[0.4872,1.4003,3.7145,13.8206,5.1618,1.2298,0.8975,0.031,1.6474,0.1367,1.0461,2.1072,0.0793,0.3246,1.587,0.2272,2.8755];
const FDECAY=-0.5,FFACTOR=19/81,FRET=0.9,FMAXI=365;
const fclamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const fR=(t,st)=>Math.pow(1+FFACTOR*t/st,FDECAY);                       // احتمال التذكر بعد t يوم
const fI=st=>fclamp(st/FFACTOR*(Math.pow(FRET,1/FDECAY)-1),0.01,FMAXI);  // أيام حتى ينزل الاحتمال إلى 90%
function fsrsNext(c,g,now){
  let S0,D;
  if(!c||!c.sb){S0=FW[g-1];D=fclamp(FW[4]-(g-3)*FW[5],1,10)}
  else{
    const R=fR(Math.max(0,(now-c.lr)/864e5),c.sb);
    D=fclamp(FW[7]*FW[4]+(1-FW[7])*(c.df-FW[6]*(g-3)),1,10);
    if(g===1){
      S0=FW[11]*Math.pow(D,-FW[12])*(Math.pow(c.sb+1,FW[13])-1)*Math.exp(FW[14]*(1-R));
      S0=Math.min(S0,c.sb);
    }else{
      const hp=g===2?FW[15]:1,eb=g===4?FW[16]:1;
      S0=c.sb*(1+Math.exp(FW[8])*(11-D)*Math.pow(c.sb,-FW[9])*(Math.exp(FW[10]*(1-R))-1)*hp*eb);
    }
  }
  return {sb:fclamp(S0,0.01,36500),df:D};
}
// يحدّث حالة البطاقة بعد تقييم g (1 نسيتها، 2 صعب، 3 جيد، 4 سهل جداً)
function fsrsApply(c,g,now){
  if(!c.sb&&c.box>0){c.sb=[0.5,1,3,7,21][c.box]||1;c.df=5;c.lr=now-c.sb*864e5}   // بطاقات قديمة من النظام السابق
  const nx=fsrsNext(c,g,now);
  c.sb=nx.sb;c.df=nx.df;c.lr=now;c.rp=(c.rp||0)+1;if(g===1)c.lp=(c.lp||0)+1;c.g=g;
  c.due=now+(g===1?10/1440:Math.max(fI(c.sb),0.25))*864e5;
  c.box=g===1?0:(c.sb>=21?4:c.sb>=7?3:c.sb>=3?2:1);
  return c;
}

const newLimit=()=>20;   // حد يومي ثابت للأسئلة الجديدة (لا يتحكم به الطالب)؛ المراجعات المستحقة غير محدودة
function newDayRec(){const k=dk(new Date());if(!S.newDay||S.newDay.d!==k)S.newDay={d:k,n:0,x:0};return S.newDay}
const newRemain=()=>{const L=newLimit();if(!L)return Infinity;const r=newDayRec();return Math.max(0,L+(r.x||0)-r.n)};
const isSusp=id=>!!(S.susp&&S.susp[id]>0);
const isDueC=(id,now)=>{const e=S.cards[id];return !e||e.due==null||e.due<=now};   // جديدة أو حان موعدها
const ar=n=>esc(String(n).replace(/\d/g,d=>'0123456789'[d]));   // الناتج يدخل HTML مباشرة، فيُهرَّب دائماً
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dirOf=t=>{const m=String(t==null?'':t).match(/[A-Za-z\u0600-\u06FF]/);return m&&/[\u0600-\u06FF]/.test(m[0])?'rtl':'ltr'};
const EXL={Competitive:'تنافسي',Board:'بورد'};const exL=v=>EXL[v]||v;
const fmt=s=>esc(s).replace(/\n/g,'<br>');
const safeC=c=>/^#[0-9a-fA-F]{6}$/.test(c)?c:'#5A6B77';
const $=id=>document.getElementById(id);
const brandHtml=()=>`<span class="brandrow"><img class="bmark" src="logo-mark.png" alt="" data-fb="s"><bdi>Boardcard</bdi></span>`;
const logoPlate=w=>`<div class="logoplate"><img src="logo.png" alt="Boardcard - بوردكارد" style="width:${w}px;max-width:100%;height:auto" data-fb="p"></div>`;


/* ---------- أيقونات خطية موحدة ---------- */
const ICP={
  set:'<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2.2"/><circle cx="9" cy="17" r="2.2"/>',
  search:'<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  chart:'<path d="M5 20V12M12 20V5M19 20v-6"/>',
  exam:'<rect x="5" y="4.5" width="14" height="16" rx="2.5"/><path d="M9 3.5h6v3H9zM9 12.5l2 2 4-4"/>',
  trophy:'<path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M8 6H5.5a2.5 2.5 0 0 0 3 3.6M16 6h2.5a2.5 2.5 0 0 1-3 3.6M12 13v4M8.5 20h7M10 17h4"/>',
  bolt:'<path d="M13 3L5 14h6l-1 7 8-11h-6l1-7z"/>',
  people:'<circle cx="9" cy="8" r="3"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="9" r="2.4"/><path d="M15.8 14a4.6 4.6 0 0 1 4.7 5"/>',
  gift:'<rect x="4" y="9" width="16" height="11" rx="2"/><path d="M3 9h18M12 9v11M12 9C10.5 5 6.5 5 6.5 7.3S10 9 12 9zm0 0c1.5-4 5.5-4 5.5-1.7S14 9 12 9z"/>',
  flag:'<path d="M5.5 21V4M5.5 4.5h11l-2.2 4 2.2 4h-11"/>',
  star:'<path d="M12 3.6l2.6 5.2 5.8.9-4.2 4.1 1 5.7L12 16.8l-5.2 2.7 1-5.7-4.2-4.1 5.8-.9z"/>',
  hl:'<path d="M15 4l5 5-9 9H6v-5z"/><path d="M4 21h9"/>',
  note:'<path d="M4.5 19.5h4L19 9l-4-4L4.5 15.5z"/><path d="M13 7l4 4"/>',
  share:'<path d="M12 15V4M8 8l4-4 4 4"/><path d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>',
  chat:'<path d="M4.5 5h15v10.5H10l-5.5 4z"/>',chev:'<path d="M15 5l-7 7 7 7" stroke-width="2.6"/>',
  map:'<path d="M9 4.5L3.5 6.5v13l5.5-2 6 2 5.5-2v-13l-5.5 2-6-2zM9 4.5v13M15 6.5v13"/>',
  folder:'<path d="M3.5 7a2 2 0 0 1 2-2h4l2 2.2h7a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>'
};
const initialOf=n=>{let t=String(n||'').trim();if(/^ال./.test(t))t=t.slice(2);return (Array.from(t)[0]||'').toUpperCase()};
const ico=n=>`<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICP[n]||''}</svg>`;
const fdate=d=>{d=new Date(d);return ar(d.getFullYear()+'/'+(d.getMonth()+1)+'/'+d.getDate())};

/* ---------- طبقة البيانات (Supabase) ---------- */
const Store={ann:[],specialties:[],subjects:[],systems:[],counts:[],qmap:{},idx:{},idxS:{},loadedS:{},freeLoaded:false,user:null,profile:null,premium:false,subs:{},isAdmin:false,ready:false,err:false};
const NONE={id:'_none',n:'مواد بدون اختصاص',c:'#5A6B77'};
const subjOf=id=>Store.subjects.find(s=>s.id===id)||{id:id,n:'مادة محذوفة',c:'#5A6B77'};
const spOfSubj=s=>Store.specialties.some(p=>p.id===s.sp)?s.sp:'_none';
const spById=id=>id==='_none'?NONE:(Store.specialties.find(p=>p.id===id)||NONE);
const qSp=q=>spOfSubj(subjOf(q.s));
const subjectsOf=id=>Store.subjects.filter(s=>spOfSubj(s)===id);
const systemsOf=id=>Store.systems.filter(x=>x.sj===id);
function spList(){const l=Store.specialties.slice();if(Store.subjects.some(s=>spOfSubj(s)==='_none'))l.push(NONE);return l}
const mw=n=>ar(n)+' '+(n===1?'مادة':n===2?'مادتين':'مواد');
function sortStore(){
  const byOrd=(a,b)=>(a.ord||0)-(b.ord||0)||String(a.id).localeCompare(String(b.id));
  Store.specialties.sort(byOrd);Store.subjects.sort(byOrd);Store.systems.sort(byOrd);
  const byT=(a,b)=>(Number(a.t)||0)-(Number(b.t)||0)||String(a.id).localeCompare(String(b.id));
}
const newId=p=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
async function fetchAll(mk){
  const out=[];
  for(let from=0;;from+=1000){
    const r=await mk().range(from,from+999);
    if(r.error)throw r.error;
    out.push.apply(out,r.data);
    if(r.data.length<1000)break;
  }
  return out;
}
async function loadCounts(){
  const r=await sb.rpc('question_counts');
  if(r.error)throw r.error;
  Store.counts=r.data.map(g=>({s:g.s,sy:g.sy,ex:g.ex,free:g.free,n:Number(g.n)}));
}
async function loadAll(){
  const t=await Promise.all([
    fetchAll(()=>sb.from('specialties').select('*').order('id')),
    fetchAll(()=>sb.from('subjects').select('*').order('id')),
    fetchAll(()=>sb.from('systems').select('*').order('id')),
    loadCounts()]);
  Store.specialties=t[0];Store.subjects=t[1];Store.systems=t[2];
  Store.qmap={};Store.idx={};Store.idxS={};Store.loadedS={};Store.freeLoaded=false;
  sortStore();
}
const cntS=id=>Store.counts.filter(g=>g.s===id).reduce((t,g)=>t+g.n,0);
const cntSy=id=>Store.counts.filter(g=>g.sy===id).reduce((t,g)=>t+g.n,0);
const cntTotal=()=>Store.counts.reduce((t,g)=>t+g.n,0);
/* ---------- الأسئلة: فهرس خفيف لكل مادة، ونص السؤال يُجلب عند الحاجة فقط ----------
   السيرفر لا يسلّم إلا أسئلة الجلسة (q_fetch) وبحد يومي للأسئلة الجديدة لكل حساب،
   والجواب والشرح لا يصلان إلا بعد أن يجيب الطالب (q_answer). الأجوبة لا تُخزَّن على الجهاز. */
const CACHE_V=2;
const MEMC=new Map();
let idbP=null;
function idbOpen(){
  if(idbP)return idbP;
  idbP=new Promise(res=>{try{
    if(typeof indexedDB==='undefined'){res(null);return}
    const r=indexedDB.open('boardcard-cache',2);
    r.onupgradeneeded=()=>{
      const db=r.result;
      try{if(db.objectStoreNames.contains('q'))db.deleteObjectStore('q')}catch(e){}   // النسخة السابقة كانت تحفظ المادة كاملة مع أجوبتها على الجهاز: تُمسح
      if(!db.objectStoreNames.contains('ix'))db.createObjectStore('ix',{keyPath:'k'});
      if(!db.objectStoreNames.contains('qc'))db.createObjectStore('qc',{keyPath:'k'});
    };
    r.onsuccess=()=>{const db=r.result;db.onversionchange=()=>{try{db.close()}catch(e){}idbP=null};res(db)};
    r.onerror=()=>res(null);r.onblocked=()=>res(null);
  }catch(e){res(null)}});
  return idbP;
}
async function cacheGetMany(st,keys){
  const db=await idbOpen();
  if(!db)return keys.map(k=>MEMC.get(st+'/'+k)||null);
  return new Promise(res=>{
    const out=keys.map(()=>null);
    try{
      if(!keys.length){res(out);return}
      const t=db.transaction(st),os=t.objectStore(st);
      keys.forEach((k,i)=>{const g=os.get(k);g.onsuccess=()=>{out[i]=g.result||null}});
      t.oncomplete=()=>res(out);t.onerror=()=>res(out);t.onabort=()=>res(out);
    }catch(e){res(out)}
  });
}
async function cachePutMany(st,recs){
  if(!recs.length)return;
  const db=await idbOpen();
  if(!db){recs.forEach(r=>MEMC.set(st+'/'+r.k,r));return}
  return new Promise(res=>{try{const t=db.transaction(st,'readwrite'),os=t.objectStore(st);recs.forEach(r=>os.put(r));t.oncomplete=()=>res();t.onerror=()=>res();t.onabort=()=>res()}catch(e){res()}});
}
async function cacheDropOwner(owner){
  if(!owner)return;
  const pre=owner+'|';
  Array.from(MEMC.keys()).forEach(k=>{if(k.indexOf('/'+pre)>=0)MEMC.delete(k)});
  const db=await idbOpen();if(!db)return;
  return new Promise(res=>{try{const t=db.transaction(['ix','qc'],'readwrite');['ix','qc'].forEach(s=>t.objectStore(s).delete(IDBKeyRange.bound(pre,pre+'\uffff')));t.oncomplete=()=>res();t.onerror=()=>res();t.onabort=()=>res()}catch(e){res()}});
}
async function pack(rows){
  const s=JSON.stringify(rows);
  try{
    if(typeof CompressionStream!=='undefined'){
      const buf=await new Response(new Blob([s]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer();
      return {gz:true,d:new Uint8Array(buf)};
    }
  }catch(e){}
  return {gz:false,d:s};
}
async function unpack(p){
  if(!p.gz)return JSON.parse(p.d);
  const txt=await new Response(new Blob([p.d]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  return JSON.parse(txt);
}
const ownerKey=()=>Store.user?Store.user.id:'guest';
const accOf=id=>(Store.isAdmin||Store.subs[spOfSubj(subjOf(id))])?'full':'free';
const QUOTA_MSG='وصلت اليوم إلى الحد الأقصى من الأسئلة الجديدة. أسئلة المراجعة تبقى مفتوحة، والحد يتجدد غداً.';
const NET_MSG='عرض الجواب يحتاج اتصالاً بالإنترنت. تأكد من الشبكة وجرّب مرة ثانية.';
const isKick=e=>!!e&&/session_replaced/.test(String(e.message||''));
function srvErr(e){if(isKick(e)){kick();return true}return false}
let _fsC=null,_fsV=[];
const freeSubjects=()=>{if(_fsC!==Store.counts){_fsC=Store.counts;_fsV=Array.from(new Set(Store.counts.filter(g=>g.free).map(g=>g.s)))}return _fsV};
// فهرس المواد: معرّفات الأسئلة فقط بدون أي نص. يُحفظ على الجهاز، والسيرفر لا يعيد إرساله إلا إذا تغيّرت المادة
async function ensureIndex(ids,onFetch){
  const miss=Array.from(new Set(ids)).filter(id=>!Store.idxS[id]);
  if(!miss.length)return;
  let mv=false;
  const owner=ownerKey();
  const recs=await cacheGetMany('ix',miss.map(id=>owner+'|'+id));
  const have={};
  miss.forEach((id,i)=>{const c=recs[i];if(c&&c.v===CACHE_V&&c.access===accOf(id)&&c.ver)have[id]=c});
  if(onFetch&&miss.some(id=>!have[id]))onFetch();
  for(let i=0;i<miss.length;i+=200){
    const chunk=miss.slice(i,i+200),hv={};
    chunk.forEach(id=>{if(have[id])hv[id]=have[id].ver});
    const r=await sb.rpc('q_index',{p_subjects:chunk,p_have:hv});
    if(r.error){srvErr(r.error);throw r.error}
    const d=r.data||{},puts=[];
    for(const id of chunk){
      const x=d[id];let rows=[];
      if(x&&Array.isArray(x.r)){rows=x.r;puts.push({k:owner+'|'+id,v:CACHE_V,access:accOf(id),ver:x.v,p:await pack(rows)})}
      else if(x&&have[id]){try{rows=await unpack(have[id].p)}catch(e){rows=[]}}
      rows.forEach(a=>{
        Store.idx[a[0]]={id:a[0],s:id,sy:a[1]||null,t:a[2],y:a[3],free:!!a[4],u:a[5]};
        // سؤال نُقل إلى مادة أخرى: نحدّث مادته في تقدّمك ومحفوظاتك حتى تبقى الأعداد متطابقة
        const ce=S&&S.cards&&S.cards[a[0]];if(ce&&ce.s&&ce.s!==id){ce.s=id;ce.sy=a[1]||null;mv=true}
        const se=S&&S.starred&&S.starred[a[0]];if(se&&se.s&&se.s!==id){se.s=id;se.sy=a[1]||null;mv=true}
      });
      Store.idxS[id]=true;
    }
    cachePutMany('ix',puts);
  }
  if(mv)try{save()}catch(e){}
}
const ensureFree=onFetch=>ensureIndex(freeSubjects(),onFetch);
// نص الأسئلة المطلوبة فقط: من ذاكرة الجهاز إن كان محفوظاً ولم يتغيّر، وإلا من السيرفر (وهو الذي يحسب الحد اليومي للأسئلة الجديدة)
const HY={denied:0,left:null};
async function hydrate(ents,onFetch){
  HY.denied=0;
  const owner=ownerKey();
  const uOf=e=>e.u||(Store.idx[e.id]||{}).u||0;
  const good=(c,e)=>!!c&&Array.isArray(c.o)&&(!uOf(e)||!c.u||c.u===uOf(e));
  let need=ents.filter(e=>!good(Store.qmap[e.id],e));
  if(need.length){
    if(onFetch)onFetch();
    const recs=await cacheGetMany('qc',need.map(e=>owner+'|'+e.id));
    need=need.filter((e,i)=>{const c=recs[i]&&recs[i].q;if(good(c,e)){Store.qmap[c.id]=c;return false}return true});
  }
  const ids=Array.from(new Set(need.map(e=>e.id)));
  for(let i=0;i<ids.length;i+=60){
    const r=await sb.rpc('q_fetch',{p_ids:ids.slice(i,i+60)});
    if(r.error){srvErr(r.error);throw r.error}
    const d=r.data||{},rows=d.rows||[];
    cachePutMany('qc',rows.map(q=>({k:owner+'|'+q.id,q:Object.assign({},q)})));   // نسخة بلا جواب ولا شرح
    rows.forEach(q=>{Store.qmap[q.id]=q});
    HY.denied+=(+d.denied||0);if(d.left!=null)HY.left=d.left;
  }
  return ents.map(e=>Store.qmap[e.id]).filter(c=>c&&Array.isArray(c.o));
}
// سؤال وصل من دالة أخرى (تحدي اليوم، تحدي زميل): نستعمل نسخة الذاكرة إن وُجدت، ولا نُبقي معه جواباً
const IMG_BASE='https://img.boardcard.net/';
const imgHtml=c=>c&&typeof c.img==='string'&&/^q\/\d{6}\/[a-f0-9]{16}\.(webp|jpg)$/.test(c.img)?`<img class="qimg" src="${IMG_BASE+c.img}" alt="صورة السؤال" loading="lazy" decoding="async">`:'';
document.addEventListener('click',e=>{const t=e.target;if(!t||!t.classList||!t.classList.contains('qimg'))return;const v=document.createElement('div');v.className='zoomv';v.innerHTML='<img alt="">';v.firstChild.src=t.src;v.onclick=()=>v.remove();document.body.appendChild(v)});
const memQ=q=>{const m=Store.qmap[q.id];if(m&&Array.isArray(m.o))return m;const x=Object.assign({},q);delete x.a;delete x.e;return x};
const canQ=c=>!!(Store.isAdmin||c.free||(Store.user&&Store.subs[qSp(c)]));
// الجواب والشرح: يطلبهما التطبيق من السيرفر بعد أن يجيب الطالب، ويبقيان في الذاكرة المؤقتة فقط
async function qReveal(c,opt,first,ctx){
  if(typeof c.a==='number'&&!first)return c;
  const args={p_id:c.id,p_opt:(opt==null||opt<0)?null:opt,p_first:!!first,p_ctx:ctx||null};
  let r=await sb.rpc('q_answer',args);
  if(r.error&&/not_delivered/.test(String(r.error.message||''))){   // النص من ذاكرة الجهاز والسيرفر لم يسجّل تسليمه لهذا الحساب
    const f=await sb.rpc('q_fetch',{p_ids:[c.id]});
    if(!f.error&&f.data&&(f.data.rows||[]).length)r=await sb.rpc('q_answer',args);
    else if(!f.error&&f.data&&f.data.denied){const e=new Error('quota');e.quota=true;throw e}
  }
  if(r.error){srvErr(r.error);throw r.error}
  const d=r.data||{};
  if(typeof d.a!=='number')throw new Error('bad_answer');
  c.a=d.a;c.e=d.e||'';c._ch=d.ch||null;
  return c;
}

async function loadAnn(){
  try{const r=await sb.from('announcements').select('id,message,created_at,kind,sponsor_name,link_url,image_url,cta').order('created_at',{ascending:false}).limit(5);Store.ann=r.error?[]:(r.data||[])}catch(e){Store.ann=[]}
}
async function loadMe(){
  const uid=Store.user.id;
  const r=await Promise.all([sb.from('profiles').select('*').eq('id',uid).single(),sb.from('subscriptions').select('specialty_id,expires_at').eq('user_id',uid)]);
  if(r[0].error)throw r[0].error;
  Store.profile=r[0].data;
  Store.isAdmin=Store.profile.role==='admin'&&!Store.profile.blocked;
  Store.subs={};
  (r[1].data||[]).forEach(x=>{if(new Date(x.expires_at)>new Date())Store.subs[x.specialty_id]=x.expires_at});
  Store.premium=Object.keys(Store.subs).length>0;
  Store.lastExp=(r[1].data||[]).reduce((m,x)=>Math.max(m,new Date(x.expires_at).getTime()||0),0);
  setTimeout(expWarn,2500);
}
/* تنبيه قبل حذف بيانات الطالب (ملاحظاته وأسئلته الخاصة) بعد سنة من انتهاء اشتراكه: فور الانتهاء، ثم كل 30 يوماً، وكل 7 أيام في آخر 30 يوماً */
function expWarn(){
  try{
    if(!Store.user||Store.isAdmin||Store.premium||!Store.lastExp)return;
    const days=(Date.now()-Store.lastExp)/864e5;
    if(days<0||days>=365)return;
    const hasData=Object.keys((N&&N.q)||{}).some(k=>N.q[k]&&!N.q[k].x)||pqLive().length>0;
    if(!hasData)return;
    const k='bc_expw_'+Store.user.id,last=+localStorage.getItem(k)||0,gap=(days>=335?7:30)*864e5;
    if(last&&Date.now()-last<gap)return;localStorage.setItem(k,String(Date.now()));
    const del=Store.lastExp+365*864e5;
    showModal(`<h2>تنبيه قبل حذف بياناتك</h2><p>انتهى اشتراكك، وبياناتك (ملاحظاتك وتظليلك وأسئلتك الخاصة) محفوظة حالياً، لكنها ستُحذف بتاريخ <bdi>${fdate(del)}</bdi> إذا لم تجدد اشتراكك قبله.</p><p class="hint">حسابك وتقدمك في الأسئلة الرسمية لا يتأثران. للتجديد تواصل معنا.</p><button class="btn block" id="expok">حسناً</button>`);
    $('expok').onclick=closeModal;
  }catch(e){}
}
function errMsg(e){
  const c=e&&(e.code||'');const m=(e&&e.message)||'';
  if(c==='42501'||/row-level security|permission denied/i.test(m))return 'ما عندك صلاحية لهذا الإجراء.';
  if(/invalid_code/.test(m))return 'الكود غير صحيح أو مستخدم من قبل.';
  if(/session_replaced/.test(m))return 'أُغلقت هذه الجلسة لأن الحساب فُتح من جهاز آخر.';
  if(/blocked/.test(m))return 'هذا الحساب موقوف.';
  return 'تعذر تنفيذ العملية. جرب مرة ثانية.';
}
function refresh(){if(view==='home')home()}
function toast(m){const t=$('toast');t.innerHTML=`<div class="toast" role="status">${esc(m)}</div>`;clearTimeout(toast.t);toast.t=setTimeout(()=>{t.innerHTML=''},Math.min(8000,Math.max(2600,String(m).length*70)))}

/* ---------- حساب الطالب والجلسة الواحدة ---------- */
let S={cards:{},log:[],timer:false,days:{},starred:{},exams:[],flash:false,goal:20,badges:{},freezes:1,frozen:{},fzMs:0,annSeen:{},total:0,lbPend:0,resume:null,resumeExam:null,dq:{},exd:{}},SKEY='tibcards_v3';
function freshS(){return {cards:{},susp:{},starDel:{},log:[],timer:false,days:{},starred:{},exams:[],flash:false,goal:20,badges:{},freezes:1,frozen:{},fzMs:0,annSeen:{},total:0,lbPend:0,resume:null,resumeExam:null,dq:{},exd:{}}}
/* ---------- تخزين بيانات الطالب على الجهاز في IndexedDB ----------
   التقدم والملاحظات والأسئلة الخاصة كانت في localStorage (حدّه نحو 5 ميغابايت وكتابته تجمّد الصفحة).
   الآن تُحفظ في IndexedDB بلا حد عملي، وتُنقل النسخة القديمة تلقائياً عند أول فتح ثم تُحذف.
   إذا لم يتوفر IndexedDB في المتصفح يستمر العمل على localStorage كما كان. */
let kvP=null;
function kvOpen(){
  if(kvP)return kvP;
  kvP=new Promise(res=>{
    let done=false;const fin=v=>{if(!done){done=true;res(v)}};
    try{
      if(typeof indexedDB==='undefined'||!indexedDB){fin(null);return}
      const r=indexedDB.open('boardcard-user',1);
      r.onupgradeneeded=()=>{try{if(!r.result.objectStoreNames.contains('kv'))r.result.createObjectStore('kv')}catch(e){}};
      r.onsuccess=()=>{
        const db=r.result;
        if(done){try{db.close()}catch(e){}return}   // وصل بعد انتهاء المهلة: نبقى على localStorage لهذه الجلسة
        db.onversionchange=()=>{try{db.close()}catch(e){}kvP=null};
        db.onclose=()=>{kvP=null};
        fin(db);
      };
      r.onerror=()=>fin(null);r.onblocked=()=>fin(null);
      setTimeout(()=>fin(null),4000);   // بعض المتصفحات تعلّق عند الفتح: لا ننتظر أكثر من 4 ثوانٍ
    }catch(e){fin(null)}
  });
  return kvP;
}
async function kvGet(key){
  const db=await kvOpen();if(!db)return null;
  return new Promise(res=>{try{const t=db.transaction('kv'),g=t.objectStore('kv').get(key);g.onsuccess=()=>res(g.result==null?null:g.result);g.onerror=()=>res(null);t.onabort=()=>res(null)}catch(e){res(null)}});
}
async function kvSet(key,val){
  const db=await kvOpen();if(!db)return false;
  return new Promise(res=>{try{const t=db.transaction('kv','readwrite');t.objectStore('kv').put(val,key);t.oncomplete=()=>res(true);t.onabort=()=>res(false)}catch(e){res(false)}});
}
// يقرأ النسختين: [نسخة IndexedDB، النسخة القديمة في localStorage]
async function uLoad(key){
  let a=null,b=null;
  try{a=await kvGet(key)}catch(e){}
  try{const r=localStorage.getItem(key);if(r)b=JSON.parse(r)}catch(e){}
  return [a,b];
}
// بعد الدمج: تُكتب النتيجة في IndexedDB، ولا تُحذف النسخة القديمة إلا بعد نجاح الكتابة
function uAdopt(key,val){kvSet(key,val).then(ok=>{if(ok){try{localStorage.removeItem(key)}catch(e){}}})}
// الحفظ: عدة استدعاءات في نفس اللحظة تُكتب مرة واحدة
const _uq=new Map();let _uqT=false;
function uSave(key,val){_uq.set(key,val);if(!_uqT){_uqT=true;Promise.resolve().then(uFlush)}}
async function uFlush(){
  _uqT=false;const items=Array.from(_uq);_uq.clear();
  for(const [k,v] of items){
    if(await kvSet(k,v))continue;
    try{localStorage.setItem(k,JSON.stringify(v))}catch(e){lsFull()}   // لا IndexedDB أو فشلت الكتابة
  }
}
const mergeQ=(a,b)=>{const q={};let d=false;[a,b].forEach(r=>{if(!r||!r.q)return;d=d||!!r.d;Object.keys(r.q).forEach(id=>{const x=r.q[id];if(x&&(!q[id]||(x.u||0)>(q[id].u||0)))q[id]=x})});return {q:q,d:d}};
// نطلب من المتصفح ألا يمسح البيانات تلقائياً (للتطبيق المثبّت فقط حتى لا تظهر نافذة إذن)
function askPersist(){try{if(navigator.storage&&navigator.storage.persist&&isStandalone())navigator.storage.persist().catch(()=>{})}catch(e){}}
function normS(){if(!S.susp)S.susp={};if(!S.days)S.days={};if(!S.cards)S.cards={};if(!S.log)S.log=[];if(!S.starred)S.starred={};if(!S.starDel)S.starDel={};if(!S.exams)S.exams=[];if(!S.goal)S.goal=20;if(!S.dq)S.dq={};if(!S.exd)S.exd={};if(!S.badges)S.badges={};if(S.freezes==null)S.freezes=1;if(!S.frozen)S.frozen={};if(!S.fzMs)S.fzMs=0;if(!S.annSeen)S.annSeen={};if(S.lbPend==null)S.lbPend=0;if(S.total==null)S.total=Object.keys(S.days).reduce((t,k)=>t+(S.days[k].n||0),0)}
let _sTok=0;
async function initS(uid){
  const key='tibcards_v3_'+uid,tok=++_sTok;
  const [a,b]=await uLoad(key);
  if(tok!==_sTok)return;
  const obj=x=>x&&typeof x==='object'&&!Array.isArray(x)?x:null,A=obj(a),B=obj(b);
  SKEY=key;
  if(A&&B){   // نسختان (مثلاً جلسة سابقة عملت بدون IndexedDB): الأحدث أساساً ويُدمج فيه الآخر بلا فقدان
    const nb=(B.pu||0)>(A.pu||0);S=nb?B:A;normS();
    try{mergeProgress(nb?A:B)}catch(e){}
  }else S=A||B||freshS();
  normS();
  if(B)uAdopt(key,S);
}
let _lsWarned=false,_lsT=null;
function save(){S.pu=Date.now();_stA=null;uSave(SKEY,S);markP();pushSyncSoon()}
// تعذر الحفظ على الجهاز (المساحة ممتلئة): نرفع التقدم إلى الحساب خلال ثوانٍ بدل الانتظار، وننبه الطالب مرة واحدة
function lsFull(){
  if(PU&&!_lsT)_lsT=setTimeout(()=>{_lsT=null;PD=true;pushProgress()},15000);
  if(_lsWarned)return;_lsWarned=true;
  toast(PU?'ذاكرة المتصفح ممتلئة، فتقدمك يُحفظ على حسابك مباشرة. لا تغلق الصفحة قبل أن يتصل الإنترنت.':'ذاكرة المتصفح ممتلئة ولم يُحفظ تقدمك على هذا الجهاز.');
}
let gT=null;
let _gAt=0;
function startGuard(){stopGuard();_gAt=Date.now();gT=setInterval(()=>{if(document.hidden)return;lbFlush();ptFlush();if(Date.now()-_gAt>=300000)guard()},30000)}
function stopGuard(){if(gT){clearInterval(gT);gT=null}}
async function guard(force){
  if(!Store.user)return;
  if(!force&&Date.now()-_gAt<60000)return;   // الفحص كل 5 دقائق، وعند العودة للتبويب بعد أكثر من دقيقة
  _gAt=Date.now();
  try{const r=await sb.rpc('session_ok');if(!r.error&&r.data===false)await kick()}catch(e){}
}
document.addEventListener('visibilitychange',()=>{if(document.hidden){lbFlush();ptFlush()}else guard()});
if(window.addEventListener)window.addEventListener('pagehide',()=>{lbFlush()});
function resetStore(){Object.keys(AIC).forEach(k=>{delete AIC[k]});Store.user=null;Store.profile=null;Store.ready=false;Store.err=false;Store.premium=false;Store.subs={};Store.isAdmin=false;Store.specialties=[];Store.subjects=[];Store.systems=[];Store.counts=[];Store.qmap={};Store.idx={};Store.idxS={};Store.loadedS={};Store.freeLoaded=false}
const accountGone=e=>!!e&&(e.code==='PGRST116'||e.status===401||e.status===403||e.status===404||/does not exist|sub claim|invalid jwt|user not found/i.test(String(e.message||'')));
async function goneLogout(){
  const uid=Store.user&&Store.user.id;
  stopGuard();stopExamTimer();resetStore();
  try{await cacheDropOwner(uid)}catch(e){}
  try{await sb.auth.signOut({scope:'local'})}catch(e){}
  closeModal();
  await startGuest('تم حذف هذا الحساب أو لم يعد صالحاً. سجّل الدخول بحساب آخر.');
}
async function kick(){
  const uid=Store.user&&Store.user.id;
  stopGuard();stopExamTimer();resetStore();await cacheDropOwner(uid);
  try{await sb.auth.signOut({scope:'local'})}catch(e){}
  closeModal();
  await startGuest('تم تسجيل الدخول بهذا الحساب من جهاز آخر، لذلك أُغلقت هذه الجلسة. الحساب مخصص لشخص واحد.');
}
async function logout(){
  const uid=Store.user&&Store.user.id;
  // قبل الخروج: نرفع ما لم يُرفع بعد (التقدم والملاحظات والأسئلة الخاصة) حتى يجده الطالب على أي جهاز آخر، بمهلة 5 ثوانٍ
  try{PD=PD||!!PU;await Promise.race([Promise.all([pushProgress(),pushNotes(),pushPQ()]),new Promise(r=>setTimeout(r,5000))])}catch(e){}
  try{await pushDisable()}catch(e){}
  stopGuard();stopExamTimer();resetStore();await cacheDropOwner(uid);
  try{await sb.auth.signOut({scope:'local'})}catch(e){}
  await startGuest();
}
sb.auth.onAuthStateChange(ev=>{if(ev==='SIGNED_OUT'&&Store.user){const uid=Store.user.id;stopGuard();resetStore();cacheDropOwner(uid);startGuest('انتهت الجلسة، سجّل الدخول من جديد.')}});
const TERMS=`<ul class="terms">
<li>الاشتراك شخصي ولصاحب الحساب فقط.</li>
<li>يُسمح بالدخول من جهاز واحد في الوقت نفسه. أي دخول جديد يُنهي الجلسة السابقة تلقائياً.</li>
<li>يُمنع مشاركة الحساب أو كود التفعيل، ويُمنع نسخ الأسئلة أو تصويرها أو نشرها.</li>
<li>مخالفة هذه الشروط تؤدي إلى إيقاف الحساب بدون استرجاع المبلغ.</li></ul>`;
function showTerms(){showModal(`<button class="x" id="cl" aria-label="إغلاق">✕</button><h2>شروط الاستخدام</h2>${TERMS}<button class="btn block" id="ok">حسناً</button>`);$('cl').onclick=closeModal;$('ok').onclick=closeModal}
const uemail=u=>String(u).trim().toLowerCase().replace(/\s+/g,'')+'@boardcard.example';
function subscribeModal(notice){
  showModal(`<button class="x" id="cl" aria-label="إغلاق">✕</button>
    ${logoPlate(120)}
    <h2>طلب اشتراك</h2>
    ${notice?`<div class="banner">${esc(notice)}</div>`:''}
    <p>للاشتراك تواصل معنا على <b>واتساب</b>، المعرّف: <b dir="ltr" class="mono">l93r</b> أو رقم الهاتف: <b dir="ltr" class="mono">07764563070</b>، لطلب الاشتراك وتزويدك بحساب.</p>
    <a class="btn block wa-btn" id="wabtn" href="https://wa.me/9647764563070?text=${encodeURIComponent('السلام عليكم، أريد الاشتراك في Boardcard')}" target="_blank" rel="noopener">راسلنا على واتساب</a>
    <p class="hint">كل اشتراك يفتح اختصاصاً واحداً، وتقدر تضيف اختصاصاً ثانياً بكود جديد.</p>
    <details class="bnf"><summary>ماذا يفتح لك الاشتراك؟</summary><ul>
      <li>كل أسئلة الاختصاص مع الشرح، بنظام المراجعة الذكي الذي يعيد لك السؤال قبل أن تنساه.</li>
      <li>شرح ومحادثة بالذكاء الاصطناعي على كل سؤال.</li>
      <li>مؤشر جاهزيتك للامتحان، وخريطة النشاط، وخريطة الإتقان.</li>
      <li>امتحانات تجريبية، وامتحان حي كل جمعة، وتحدي يومي.</li>
      <li>ملاحظاتك وتظليلك وأسئلتك الخاصة محفوظة على حسابك.</li>
      <li>الدوري الأسبوعي، وشريك المذاكرة، وتحدي الزملاء.</li></ul></details>
    <h3 class="sec">عندك حساب؟</h3>
    <label class="fld"><span>اسم المستخدم</span><input class="in" id="lg-u" autocomplete="username" autocapitalize="none" spellcheck="false" style="direction:ltr;text-align:left"></label>
    <label class="fld"><span>كلمة السر</span><input class="in" id="lg-p" type="password" autocomplete="current-password" style="direction:ltr;text-align:left"></label>
    <button type="button" class="lnk" id="lg-sh" style="display:block;font-size:13px;margin:-6px 0 12px">إظهار كلمة السر</button>
    <label class="fld"><span>رمز التفعيل</span><input class="in" id="lg-c" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX-XXXX" style="direction:ltr;text-align:left;text-transform:uppercase"></label>
    <p class="hint">رمز التفعيل مطلوب عند أول دخول أو عند التجديد. إذا اشتراكك ساري تقدر تتركه فارغاً.</p>
    <p class="err" id="er" role="alert"></p>
    <button class="btn block" id="ac">دخول وتفعيل</button>`);
  $('cl').onclick=closeModal;
  $('lg-sh').onclick=()=>{const pw=$('lg-p'),on=pw.type==='password';pw.type=on?'text':'password';$('lg-sh').textContent=on?'إخفاء كلمة السر':'إظهار كلمة السر'};
  ['lg-u','lg-p','lg-c'].forEach(id=>{$(id).onkeydown=e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();$('ac').click()}}});
  $('ac').onclick=async()=>{
    const u=$('lg-u').value,p=$('lg-p').value,c=$('lg-c').value.trim();
    if(!u.trim()||!p){$('er').textContent='اكتب اسم المستخدم وكلمة السر.';return}
    $('ac').disabled=true;
    let msg=null;
    try{msg=await doLogin(u,p,c)}catch(e){msg='تعذر الاتصال. تأكد من الإنترنت وجرب مرة ثانية.'}
    if(msg){$('er').textContent=msg;$('ac').disabled=false;return}
    closeModal();startApp();
  };
}
async function doLogin(username,password,code){
  const r=await sb.auth.signInWithPassword({email:uemail(username),password:password});
  if(r.error)return 'اسم المستخدم أو كلمة السر غير صحيحة.';
  const out=async m=>{try{await sb.auth.signOut({scope:'local'})}catch(e){}return m};
  if(code){
    // نتحقق من الرمز قبل أخذ الجلسة، حتى لا يُطرد جهازك الآخر بسبب رمز خاطئ
    const ck=await sb.rpc('code_ok',{p_code:code});
    if(ck.error)return out(errMsg(ck.error));
    if(ck.data!==true)return out('رمز التفعيل غير صحيح أو مستخدم من قبل.');
  }
  const cs=await sb.rpc('claim_session');
  if(cs.error)return out('تعذر بدء الجلسة. جرب مرة ثانية.');
  if(code){
    const x=await sb.rpc('redeem_code',{p_code:code});
    if(x.error){
      if(/blocked/.test(x.error.message)){return null}
      return out(/invalid_code/.test(x.error.message)?'رمز التفعيل غير صحيح أو مستخدم من قبل.':errMsg(x.error));
    }
  }
  // بدون رمز: المشترك المنتهي اشتراكه يدخل أيضاً، ويرى شاشة التجديد داخل التطبيق
  return null;
}
async function adoptGuest(){
  try{
    const uid=Store.user&&Store.user.id;if(!uid||lsGet('bc_gmig_'+uid))return;
    const [a,b]=await uLoad('tibcards_v3_guest');
    const ok=x=>x&&typeof x==='object'&&!Array.isArray(x)&&x.cards&&Object.keys(x.cards).length;
    const gs=[a,b].filter(ok);
    lsSet('bc_gmig_'+uid,'1');
    if(!gs.length)return;
    gs.forEach(g=>{try{mergeProgress(g)}catch(e){}});
    normS();save();
    uSave('tibcards_v3_guest',freshS());
    toast('نُقل تقدّمك كزائر إلى حسابك');
  }catch(e){}
}
async function startGuest(notice){
  stopGuard();
  Store.user=null;Store.profile=null;Store.premium=false;Store.subs={};Store.isAdmin=false;
  await initS('guest');await initN(null);initP(null);
  try{
    await loadAll();await loadAnn();
    Store.ready=true;Store.err=false;
    home();
    if(notice)subscribeModal(notice);
  }catch(e){Store.err=true;Store.ready=false;home()}
}
function paywall(){subscribeModal()}
function termsGate(){
  view='terms';
  app.innerHTML=`<div class="top"><div class="brand">${brandHtml()}<small>شروط الاستخدام</small></div></div>
  <div class="auth">${TERMS}<p class="err" id="er" role="alert"></p><button class="btn block" id="ok">أوافق وأكمل</button><button class="btn line block" id="no" style="margin-top:8px">خروج</button></div>`;
  $('no').onclick=logout;
  $('ok').onclick=async()=>{const r=await sb.rpc('accept_terms');if(r.error){$('er').textContent=errMsg(r.error);return}startApp()};
}
function blockedScreen(){
  view='blocked';
  app.innerHTML=`<div class="top"><div class="brand">${brandHtml()}</div></div>
  <div class="auth"><div class="banner">تم إيقاف هذا الحساب بسبب مخالفة شروط الاستخدام. للاستفسار تواصل مع الدعم.</div><button class="btn line block" id="no">خروج</button></div>`;
  $('no').onclick=logout;
}
async function startApp(){
  boot();
  try{
    const g=await Promise.race([sb.auth.getSession(),new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),10000))]);
    if(!g.data.session){await startGuest();autoResume();return}
    Store.user=g.data.session.user;
    try{const gu=await sb.auth.getUser();if(gu.error&&accountGone(gu.error)){await goneLogout();return}}catch(e){}
    const ok=await sb.rpc('session_ok');
    if(ok.data===false){await kick();return}
    await loadMe();
    if(Store.profile.blocked){stopGuard();await cacheDropOwner(Store.user.id);blockedScreen();return}
    await Promise.all([initS(Store.user.id),initN(Store.user.id)]);await adoptGuest();initP(Store.user.id);askPersist();
    if(!Store.profile.accepted_terms_at){termsGate();return}
    await loadAll();await loadAnn();
    Store.ready=true;Store.err=false;
    home();startGuard();autoResume();
  }catch(e){if(accountGone(e)){await goneLogout();return}Store.err=true;Store.ready=false;home()}
}
/* ---------- واجهة الطالب ---------- */
let F={exam:'all',sp:null,sj:null,mode:'smart'},view='boot';
/* العودة لنفس المكان بعد مغادرة التطبيق: المتصفح قد يُفرغ الصفحة من الذاكرة ثم يعيد تحميلها */
const LIVE0=(()=>{try{return +localStorage.getItem('bc_live')||0}catch(e){return 0}})();
try{const nv=JSON.parse(localStorage.getItem('bc_nav')||'null');if(nv){F.sp=nv.sp||null;F.sj=nv.sj||null}}catch(e){}
const liveMark=on=>{try{if(on)localStorage.setItem('bc_live',String(Date.now()));else localStorage.removeItem('bc_live')}catch(e){}};
function autoResume(){
  try{
    if(Store.ready&&view==='home'&&dqDeep())return;
    if(!LIVE0||Date.now()-LIVE0>6*36e5||!Store.ready||view!=='home')return;
    if(resumeInfo())resumeNow();
  }catch(e){}
}
const app=$('app'),modal=$('modal');
let _sy=0,_locked=false;
function lockScroll(){
  if(_locked)return;_locked=true;
  _sy=window.scrollY||(document.documentElement&&document.documentElement.scrollTop)||0;
  const b=document.body.style;b.position='fixed';b.top=(-_sy)+'px';b.left='0';b.right='0';b.width='100%';
}
function unlockScroll(){
  if(!_locked)return;_locked=false;
  const b=document.body.style;b.position='';b.top='';b.left='';b.right='';b.width='';
  window.scrollTo(0,_sy);
}
let _mClose=null;
function showModal(html){_mClose=null;modal.innerHTML=`<div class="ov" id="ov"><div class="sheet" role="dialog" aria-modal="true">${html}</div></div>`;lockScroll();$('ov').onclick=e=>{if(e.target.id==='ov')closeModal()}}
function closeModal(){const h=_mClose;_mClose=null;modal.innerHTML='';unlockScroll();if(h)h()}
function askConfirm(title,msg,ok){
  return new Promise(res=>{
    showModal(`<h2>${esc(title)}</h2><p>${esc(msg)}</p><div class="r2"><button class="btn line" id="cn">إلغاء</button><button class="btn bad" id="cy">${esc(ok)}</button></div>`);
    let fin=false;const end=v=>{if(fin)return;fin=true;_mClose=null;closeModal();res(v)};
    _mClose=()=>{if(!fin){fin=true;res(false)}};
    $('cn').onclick=()=>end(false);
    $('cy').onclick=()=>end(true);
  });
}

/* ---------- الرئيسية ---------- */
function boot(){view='home';_hRdy=false;app.innerHTML=`<div class="splash">${logoPlate(190)}<p class="hint">جارٍ تحميل الأسئلة…</p></div>`}
/* ---------- الرئيسية ---------- */
const covUrl=u=>/^https:\/\//.test(u||'')?u:'';
function rowHtml(attr,id,color,name,sub,st,subscribed,img){
  const cu=covUrl(img);
  return `<button class="row" style="--sc:${safeC(color)}" ${attr}="${esc(id)}">
    ${cu?`<span class="bk"><img class="cov pt" src="${esc(cu)}" alt="" loading="lazy" decoding="async"></span>`:`<span class="cov ph" aria-hidden="true">${esc(initialOf(name))}</span>`}<div class="grow"><div class="nm">${esc(name)}</div>
    <div class="sub">${sub}${ar(st.total)} سؤال، أتقنت ${ar(st.mastered)}</div>
    <div class="bar"><i style="width:${Math.round(100*st.mastered/st.total)}%"></i></div></div>
    ${subscribed?'<span class="lock ok">مشترك</span>':(st.locked?`<span class="lock">${ar(st.locked)} للمشتركين</span>`:'')}
  </button>`;
}
const inSys=(c,y)=>y==='_none'?(!c.sy||!systemsOf(c.s).some(z=>z.id===c.sy)):c.sy===y;
const hasSys=sid=>Store.counts.some(g=>g.s===sid&&g.sy&&systemsOf(sid).some(z=>z.id===g.sy));
function grpIn(g,sc){
  if(sc.ex&&sc.ex!=='all'&&g.ex!==sc.ex)return false;
  if(sc.s&&g.s!==sc.s)return false;
  if(sc.sp&&qSp(g)!==sc.sp)return false;
  if(sc.sy!==undefined&&sc.sy!==null&&!inSys(g,sc.sy))return false;
  return true;
}
let _stA=null,_stT=0;
function stAgg(){
  const now=Date.now();
  if(_stA&&now-_stT<1500)return _stA;
  const T=new Map();
  const ent=(ex,sj,sp)=>{const k=ex+'|'+sj+'|'+sp;let o=T.get(k);if(!o){o={ex:ex,s:sj,sp:sp,total:0,open:0,mastered:0,pending:0,ans:0};T.set(k,o)}return o};
  Store.counts.forEach(g=>{const sp=qSp(g),o=ent(g.ex,g.s,sp);o.total+=g.n;if(g.free||Store.subs[sp])o.open+=g.n});
  Object.keys(S.cards).forEach(id=>{const e=S.cards[id];if(!e||!e.s||goneQ(id,e))return;const o=ent(e.ex,e.s,qSp(e));o.ans++;if(e.box>=3)o.mastered++;if(e.due>now)o.pending++});
  _stA=Array.from(T.values());_stT=now;return _stA;
}
function stats(sc){
  if(sc.sy===undefined||sc.sy===null){
    let total=0,open=0,mastered=0,pending=0,ans=0;
    stAgg().forEach(o=>{
      if(sc.ex&&sc.ex!=='all'&&o.ex!==sc.ex)return;
      if(sc.s&&o.s!==sc.s)return;
      if(sc.sp&&o.sp!==sc.sp)return;
      total+=o.total;open+=o.open;mastered+=o.mastered;pending+=o.pending;ans+=o.ans;
    });
    return {total:total,open:open,locked:total-open,mastered:mastered,due:Math.max(0,open-pending),ans:ans};
  }
  let total=0,open=0;
  Store.counts.forEach(g=>{if(!grpIn(g,sc))return;total+=g.n;if(g.free||Store.subs[qSp(g)])open+=g.n});
  const now=Date.now();let mastered=0,pending=0;
  Object.keys(S.cards).forEach(id=>{const e=S.cards[id];if(!e.s||!grpIn(e,sc)||goneQ(id,e))return;if(e.box>=3)mastered++;if(e.due>now)pending++});
  return {total:total,open:open,locked:total-open,mastered:mastered,due:Math.max(0,open-pending)};
}
const newIn=sc=>{const st=stats(sc);let ans=st.ans;if(ans===undefined){ans=0;Object.keys(S.cards).forEach(id=>{const e=S.cards[id];if(e.s&&grpIn(e,sc)&&!goneQ(id,e))ans++})}return Math.max(0,st.open-ans)};
// هل السؤال قابل للتقديم فعلاً؟ (غير محذوف أو منقول أو مقفول) حتى لا يظهر عدّاد لأسئلة لن تظهر في الجلسة
const liveQ=(id,e)=>{
  if(!e||!e.s||Store.idx[id])return true;
  if(Store.idxS[e.s])return false;
  return accOf(e.s)==='full'||freeSubjects().includes(e.s);
};
// سؤال في تقدّمك لم يعد موجوداً في مادته (حُذف): لا يُحسب في الأعداد. يعمل فقط إذا تحمّل فهرس المادة وكان دخولك كاملاً (الفهرس المجاني ناقص عن قصد)
const goneQ=(id,e)=>!!(e&&e.s&&Store.idxS[e.s]&&!Store.idx[id]&&accOf(e.s)==='full');
function modeCounts(){
  const base={s:F.sj||undefined,sp:F.sp||undefined,ex:F.exam},subIds=Object.keys(Store.subs);
  const nw=(!F.sp&&!F.sj&&subIds.length)?subIds.reduce((t,id)=>t+newIn({sp:id,ex:F.exam}),0):newIn(base);
  const nowT=Date.now();
  const ms=Object.keys(S.cards).filter(id=>{const e=S.cards[id];return e.s&&e.box===0&&grpIn(e,base)&&isDueC(id,nowT)&&liveQ(id,e)}).length;
  const sv=Object.keys(S.starred).filter(id=>{const e=S.starred[id];return grpIn(e,base)&&isDueC(id,nowT)&&liveQ(id,e)}).length;
  return {new:Math.min(nw,newRemain()),missed:ms,saved:sv};
}
function weakSubject(){
  const now=new Date(),agg={};
  for(let i=0;i<30;i++){const d=S.days[dk(new Date(now.getFullYear(),now.getMonth(),now.getDate()-i))];if(!d)continue;Object.keys(d.subj||{}).forEach(id=>{const a=agg[id]||(agg[id]={n:0,ok:0});a.n+=d.subj[id].n;a.ok+=d.subj[id].ok})}
  let best=null;
  Object.keys(agg).forEach(id=>{if(agg[id].n<3||!Store.subjects.some(x=>x.id===id))return;const p=Math.round(100*agg[id].ok/agg[id].n);if(!best||p<best.p)best={id:id,p:p,n:agg[id].n}});
  return best;
}
/* ---------- عدّاد الأرقام وحركات الظهور ---------- */
const cm=n=>Number(n).toLocaleString('en');
const noMotion=()=>window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function animNum(el,to,o){
  o=o||{};const dur=o.dur||1200,dl=o.delay||0,suf=o.suf||'',f=o.cm?cm:String;
  if(!el)return;
  const fin=()=>{el.textContent=ar(f(to))+suf};
  if(noMotion()||!(to>0)){fin();return}
  el.textContent=ar(f(0))+suf;
  const t0=performance.now()+dl;
  const step=t=>{
    if(!el.isConnected)return;
    const p=Math.min(1,Math.max(0,(t-t0)/dur)),e=1-Math.pow(1-p,3);
    el.textContent=ar(f(Math.round(to*e)))+suf;
    if(p<1)requestAnimationFrame(step);else fin();
  };
  requestAnimationFrame(step);
}
function countUp(){
  const a=document.getElementById('app');if(!a)return;
  if(a.querySelector(':scope>.hm:not(.an)')){scrollReveal(a);return}   // إعادة رسم الرئيسية بدون حركة
  const sk=_hSkip;_hSkip=0;
  if(sk>0)try{(a.getAnimations?a.getAnimations({subtree:true}):[]).forEach(an=>{try{an.currentTime=sk}catch(e){}})}catch(e){}
  a.querySelectorAll('[data-cnt]:not([data-cd])').forEach(el=>{
    el.dataset.cd='1';
    animNum(el,+el.dataset.cnt,{suf:el.dataset.suf,cm:!!el.dataset.cm,delay:(+el.dataset.dl||0)-sk});
  });
  a.querySelectorAll('.row,.fold,.reqb').forEach((el,i)=>el.style.setProperty('--i',Math.min(i,12)));
  stagger(a);autoCount(a);scrollReveal(a);
}
// الصفوف الواقعة أسفل الشاشة لا تتحرك إلا حين يصل إليها المستخدم بالتمرير
// تثبيت موضع التمرير: إذا تغيّر محتوى الرئيسية بإعادة رسم والمستخدم نازل نُبقي العنصر الذي أمامه في مكانه بدل أن يقفز المحتوى
const _home0=home;
home=function(){
  const a=document.getElementById('app'),sy=window.scrollY||0;
  let key=null,y0=0;
  const docTop=e=>{let y=0;while(e){y+=e.offsetTop;e=e.offsetParent}return y};
  const sel='.row,.fold,.reqb,.item,.sech';
  const kOf=e=>e.tagName+'|'+(e.textContent||'').replace(/\s+/g,' ').trim().slice(0,60);
  if(a&&sy>40&&view==='home'&&a.querySelector(':scope>.hm')){
    try{
      const el=[...a.querySelectorAll(sel)].find(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.top<window.innerHeight*0.85});
      if(el){key=kOf(el);y0=docTop(el)}
    }catch(e){key=null}
  }
  const r=_home0.apply(this,arguments);
  if(key!==null){
    try{
      const el2=[...a.querySelectorAll(sel)].find(e=>kOf(e)===key);
      if(el2){const d=docTop(el2)-y0;if(Math.abs(d)>1)window.scrollBy(0,d)}
    }catch(e){}
  }
  return r;
};
let _rvIO=null;
function scrollReveal(a){
  if(_rvIO){_rvIO.disconnect();_rvIO=null}
  if(!('IntersectionObserver' in window))return;
  const vh=window.innerHeight||document.documentElement.clientHeight||0;
  const late=[...a.querySelectorAll('.hm~.row,.hm~.folds .fold,.hm~.reqb')].filter(el=>el.getBoundingClientRect().top>vh+4);
  if(!late.length)return;
  late.forEach(el=>el.classList.add('sr'));
  _rvIO=new IntersectionObserver(es=>{
    let k=0;
    es.filter(e=>e.isIntersecting).sort((x,y)=>x.boundingClientRect.top-y.boundingClientRect.top).forEach(e=>{
      _rvIO.unobserve(e.target);
      e.target.style.setProperty('--sd',(k++*150)+'ms');
      e.target.classList.add('sr-in');
    });
  },{threshold:0,rootMargin:'0px 0px -3% 0px'});
  late.forEach(el=>_rvIO.observe(el));
}
// ترتيب ظهور العناصر المتشابهة داخل نفس الحاوية (الخريطة، الدوري، البحث، النتائج...)
function stagger(root,sel,cap){
  const cnt=new Map();
  root.querySelectorAll(sel||'.item,.panel,.sec,.auth,.empty,.note,.banner,.rep,.pal button').forEach(el=>{
    if(el.dataset.an)return;el.dataset.an='1';
    const n=cnt.get(el.parentNode)||0;cnt.set(el.parentNode,n+1);
    el.style.setProperty('--i',Math.min(n,cap||12));
  });
}
// الأرقام الكبيرة النصية مثل 72% تعدّ من الصفر
function autoCount(root){
  root.querySelectorAll('.sum .big').forEach(el=>{
    if(el.dataset.cd||el.children.length)return;el.dataset.cd='1';
    const m=el.textContent.trim().match(/^(\d[\d,]*)(\D.*)?$/);if(!m)return;
    animNum(el,+m[1].replace(/,/g,''),{suf:m[2]||'',cm:m[1].includes(','),delay:250});
  });
}
new MutationObserver(countUp).observe(document.getElementById('app'),{childList:true});
// النوافذ: محتوى النافذة يظهر بالتتابع
new MutationObserver(()=>{const m=document.getElementById('modal');if(!m)return;stagger(m,'.sheet>*:not(.x)',10);autoCount(m)}).observe(document.getElementById('modal'),{childList:true});
let _hNav=null,_hAt=0,_hSkip=0,_hDefer=0,_hRdy=false;
function home(){
  // أول دخول تستدعي عدة عمليات مزامنة إعادة رسم الرئيسية بعد الرسمة الأولى، فكانت تمسح الحركة: نبقي الحركة مفعّلة لمدة قصيرة بعد الدخول أو التنقّل
  const _arr=view!=='home',_nav=F.sp+'|'+F.sj,_fresh=_arr||_nav!==_hNav||(!!Store.ready&&!_hRdy);
  if(_fresh)_hAt=Date.now();
  if(Store.ready)_hRdy=true;   // أول رسمة بعد جاهزية البيانات تتحرك دائماً حتى لو سبقتها رسمة أثناء التحميل
  // إعادات الرسم التي تأتي من الخلفية (مزامنة، تحديث بيانات) أثناء حركة الدخول تُؤجّل إلى بعد انتهائها حتى تظهر الحركة كاملة بدون قطع أو وميض
  if(!_fresh&&!window.event&&(Date.now()-_hAt)<3200){
    if(!_hDefer)_hDefer=setTimeout(()=>{_hDefer=0;if(view==='home')home()},3250-(Date.now()-_hAt));
    return;
  }
  const _anim=_fresh||(Date.now()-_hAt)<3200;_hNav=_nav;
  _hSkip=0;if(_anim&&!_fresh&&typeof CSSAnimation!=='undefined'){try{const ps=(app.getAnimations?app.getAnimations({subtree:true}):[]).filter(x=>x.animationName==='bcIn').map(x=>+x.currentTime||0);_hSkip=ps.length?Math.max.apply(null,ps):9999}catch(e){_hSkip=0}};   // إعادة رسم أثناء الحركة: تكمل من نفس النقطة بدل أن تعيدها من البداية
  view='home';stopTimer();stopExamTimer();liveMark(false);
  try{localStorage.setItem('bc_nav',JSON.stringify({sp:F.sp,sj:F.sj}))}catch(e){}
  if(!Store.ready){
    app.innerHTML=`<div class="top"><div class="brand">${brandHtml()}</div></div><p class="empty">${Store.err?'تعذر الوصول إلى قاعدة البيانات الآن. تأكد من الاتصال وأعد فتح الصفحة.':'جارٍ تحميل الأسئلة…'}</p>${Store.err?'<button class="btn block" data-reload="1">إعادة المحاولة</button>':''}`;
    return;
  }
  if(F.sp&&!spList().some(p=>p.id===F.sp)){F.sp=null;F.sj=null}
  if(F.sj&&!Store.subjects.some(x=>x.id===F.sj))F.sj=null;
  const sp=F.sp?spById(F.sp):null;
  const sj=F.sj?subjOf(F.sj):null;
  applyFreezes();
  const today=new Date().toDateString();
  const todayN=(S.days[dk(new Date())]||{n:0}).n;
  const last=S.log.slice(-50);
  const acc=last.length?Math.round(100*last.filter(l=>l.ok).length/last.length):null;
  const subIds=Object.keys(Store.subs);
  let dueN;
  if(F.sj)dueN=stats({s:F.sj,ex:F.exam}).due;
  else if(F.sp)dueN=stats({sp:F.sp,ex:F.exam}).due;
  else if(subIds.length)dueN=subIds.reduce((t,id)=>t+stats({sp:id,ex:F.exam}).due,0);
  else dueN=stats({ex:F.exam}).due;
  {let newN;
   if(F.sj)newN=newIn({s:F.sj,ex:F.exam});
   else if(F.sp)newN=newIn({sp:F.sp,ex:F.exam});
   else if(subIds.length)newN=subIds.reduce((t,id)=>t+newIn({sp:id,ex:F.exam}),0);
   else newN=newIn({ex:F.exam});
   const rem=newRemain();if(rem<newN)dueN=Math.max(0,dueN-(newN-rem));}

  let rows='';
  if(!F.sp){
    spList().forEach(p=>{
      const st=stats({sp:p.id,ex:F.exam});
      if(!st.total)return;
      const ns=new Set(Store.counts.filter(g=>grpIn(g,{sp:p.id,ex:F.exam})).map(g=>g.s)).size;
      rows+=rowHtml('data-sp',p.id,p.c,p.n,mw(ns)+'، ',st,!!Store.subs[p.id],p.img);
    });
  }else if(!F.sj){
    {
      const nowS=Date.now(),sc0={sp:F.sp,ex:F.exam},ids=Object.keys(S.starred).filter(id=>grpIn(S.starred[id],sc0)&&liveQ(id,S.starred[id])),dueS=ids.filter(id=>isDueC(id,nowS)).length;
      const nIds=notedIds(F.sp);
      rows+=`<div class="folds"><button class="fold" style="--sc:#D99A00" data-saved="1"><span class="ic2">${ico('star')}</span><div class="nm">الأسئلة المحفوظة</div><div class="sub">${ar(ids.length)} سؤال${ids.length?'، '+ar(dueS)+' مستحق':''}</div></button><button class="fold" style="--sc:#1F5FBF" data-notes="1"><span class="ic2">${ico('note')}</span><div class="nm">الملاحظات</div><div class="sub">${ar(nIds.length)} سؤال بملاحظة أو تظليل</div></button></div><button class="reqb" data-pq="1" style="border-style:solid;margin-top:10px"><span class="ic">✍️</span><div><div class="nm">أسئلتي الخاصة</div><div class="sub">قم بإنشاء ومراجعة أسئلة خاصة بك</div></div></button>`;
    }
    subjectsOf(F.sp).forEach(x=>{
      const st=stats({s:x.id,ex:F.exam});
      if(!st.total)return;
      const nsy=new Set(Store.counts.filter(g=>g.s===x.id&&g.sy&&systemsOf(x.id).some(z=>z.id===g.sy)&&(F.exam==='all'||g.ex===F.exam)).map(g=>g.sy)).size;
      rows+=rowHtml('data-s',x.id,x.c,x.n,nsy?ar(nsy)+' '+(nsy===1?'نظام':nsy===2?'نظامين':'أنظمة')+'، ':'',st,false,x.img);
    });
    rows+=`<button class="reqb" id="reqSub"><span class="ic">📎</span><div><div class="nm">طلب إضافة مادة</div><div class="sub">ارسل لنا ملف مادة معينة لنضيفها للبرنامج حتى تتمكن من دراستها</div></div></button>`;
  }else{
    systemsOf(F.sj).forEach(y=>{
      const st=stats({s:F.sj,sy:y.id,ex:F.exam});
      if(!st.total)return;
      rows+=rowHtml('data-sy',y.id,y.c,y.n,'',st);
    });
    const gst=stats({s:F.sj,sy:'_none',ex:F.exam});
    if(gst.total)rows+=rowHtml('data-sy','_none',sj.c,'أسئلة عامة','',gst);
  }
  if(!rows){
    rows=`<div class="empty">${Store.counts.length?'لا توجد أسئلة بهذا الاختيار.':'لا توجد أسئلة بعد.'}</div>`;
  }
  const title=sj?esc(sj.n):(sp?esc(sp.n):brandHtml());
  const subt=sj?'اختر النظام':(sp?'اختر المادة':(Store.user?[esc((Store.profile&&Store.profile.full_name)||''),(S.total||0)>=LEVELS[1][0]?'🎖 '+levelInfo().name:''].filter(Boolean).join(' · '):'تجربة مجانية'));
  const top=!sp;
  const weak=top?weakSubject():null,mAll=top?masteredAll():0;
  app.innerHTML=`<i class="hm${_anim?' an':''}" hidden></i>
  <div class="top">
    <div class="brand">${title}<small>${subt}</small></div>
    <div class="grp">
      ${sj?'<button class="pill" id="bkSj">رجوع</button>':(sp?'<button class="pill wi" id="bkSp"><span>الصفحة الرئيسية</span>'+ico('chev')+'</button>':'')}
      ${top?`<button class="pill icn" id="setb" aria-label="الإعدادات" title="الإعدادات">${ico('set')}</button>`:''}
      ${top&&Store.user?`<button class="pill icn" id="srch" aria-label="بحث" title="بحث">${ico('search')}</button>`:''}
      ${top?`<button class="pill wi" id="prg">${ico('chart')}التقدم</button>`:''}
      ${top&&!Store.premium?'<button class="btn" id="sub" style="min-height:44px;padding:6px 16px">اشترك</button>':''}
    </div>
  </div>
  ${top?resumeHtml()+expWarnHtml():''}
  ${top?`<section class="hero" aria-label="اليوم">${goalHtml()}<div class="stats tap" id="stbtn" role="button" tabindex="0" aria-label="تقرير التقدم">
    <div class="stat"><b data-cnt="${dueN}" data-cm="1" data-dl="280">${ar(cm(dueN))}</b><span>مستحق للمراجعة</span></div>
    <div class="stat"><b ${acc===null?'':`data-cnt="${acc}" data-suf="%" data-dl="360"`}>${acc===null?'—':ar(acc)+'%'}</b><span>نسبة الصح</span></div>
    <div class="stat"><b data-cnt="${mAll}" data-cm="1" data-dl="440">${ar(cm(mAll))}</b><span>سؤال أتقنته</span></div>
  </div><button class="btn block" id="go">ابدأ مراجعة اليوم</button></section>`
  :`<button class="btn block" id="go">${sj?'ابدأ مراجعة '+esc(sj.n):'ابدأ مراجعة '+esc(sp.n)}${dueN?' ('+ar(dueN)+' مستحق)':''}</button>`}
  ${weak&&weak.p<80?`<button class="btn line block" id="weak" style="margin-top:8px">راجع أضعف مادة: ${esc(subjOf(weak.id).n)} (${ar(weak.p)}%)</button>`:''}
  ${top?annHtml()+installHtml():''}
  ${top?(multiSubs()?todayHtml():dqHtml()+exHtml()+liveHtml())+ptHtml()+readyHtml():''}
  ${top?`<div class="quick">
    <button class="qa" id="mock"><span class="ib2">${ico('exam')}</span>امتحان تجريبي</button>
    <button class="qa" id="lbbtn"><span class="ib2">${ico('trophy')}</span>الدوري</button>
    <button class="qa" id="chbtn"><span class="ib2">${ico('bolt')}</span>تحدّ زميلك</button>
    <button class="qa" id="ptbtn"><span class="ib2">${ico('people')}</span>شريك المذاكرة</button>
  </div>
  ${Store.user&&Store.premium?`<button class="btn line block wi" id="refbtn" style="margin-top:8px">${ico('gift')}ادعُ زميلك واحصل على 7 أيام</button>`:''}
  ${ambHtml()}
  ${rows&&Store.counts.length?'<h3 class="sech">الاختصاصات</h3>':''}`:(sp&&!sj&&Store.counts.length?`<div class="r2" style="margin-top:8px;margin-bottom:14px"><button class="btn line wi" id="mock">${ico('exam')}امتحان تجريبي</button><button class="btn line wi" id="mapb">${ico('map')}خريطة الإتقان</button></div>`:`<button class="btn line block wi" id="mock" style="margin:8px 0 14px">${ico('exam')}امتحان تجريبي</button>`)}
  ${rows}
  ${top&&!Store.user?'<p class="note">أنت تتصفح كزائر: الأسئلة المفتوحة للتجربة فقط، واشترك لفتح الباقي.</p>':''}`;

  const up=()=>{home();window.scrollTo(0,0)};
  app.querySelectorAll('[data-sp]').forEach(b=>b.onclick=()=>{F.sp=b.dataset.sp;F.sj=null;up()});
  app.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{
    const id=b.dataset.s;
    if(hasSys(id)){F.sj=id;up()}else start(id,F.sp);
  });
  app.querySelectorAll('[data-sy]').forEach(b=>b.onclick=()=>start(F.sj,F.sp,b.dataset.sy));
  const svb=app.querySelector('[data-saved]');if(svb)svb.onclick=()=>start(null,F.sp,undefined,{mode:'saved'});
  const nvb=app.querySelector('[data-notes]');if(nvb)nvb.onclick=()=>{if(!(Store.user&&Store.subs[F.sp])){toast('ميزة الملاحظات والتظليل متاحة للمشتركين بهذا الاختصاص.');return}start(null,F.sp,undefined,{mode:'notes'})};
  const pqc=app.querySelector('[data-pq]');if(pqc)pqc.onclick=()=>{
    if(!(Store.user&&Store.subs[F.sp])){toast('ميزة أسئلتي الخاصة متاحة للمشتركين بهذا الاختصاص.');return}
    if(!GZ){toast('حدّث المتصفح لاستعمال هذه الميزة.');return}
    const sp0=F.sp,uid0=PQU;pqScreen(sp0);
    if(!PQL)loadPQRemote().then(()=>{if(PQL&&view==='pq'&&PQU===uid0&&!document.getElementById('cl'))pqScreen(sp0)});
  };
  const rqb=$('reqSub');if(rqb)rqb.onclick=()=>requestModal(F.sp);
  $('go').onclick=modeChooser;
  app.querySelectorAll('[data-dq]').forEach(b=>{const f=()=>{const id=b.dataset.dq;id?dqStart(id):dqChooser()};b.onclick=f;b.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();f()}}});
  const stg=$('setb');if(stg)stg.onclick=settingsModal;
  $('mock').onclick=examSetup;
  const rfb=$('refbtn');if(rfb)rfb.onclick=referralModal;
  const lgb=$('lbbtn');if(lgb)lgb.onclick=()=>league();
  app.querySelectorAll('[data-lv]').forEach(b=>{const f=()=>{const id=b.dataset.lv;id?liveScreen(id):pickSpec('امتحان الجمعة الحي 🔴',spList().filter(p=>dqOk(p.id)).map(p=>p.id),liveScreen)};b.onclick=f;b.onkeydown=kb(f)});
  app.querySelectorAll('[data-ex]').forEach(b=>{b.onclick=()=>exModal(b.dataset.ex);b.onkeydown=kb(()=>exModal(b.dataset.ex))});
  app.querySelectorAll('[data-pt]').forEach(b=>{b.onclick=ptModal;b.onkeydown=kb(ptModal)});
  const chb=$('chbtn');if(chb)chb.onclick=chStart;
  const ptb=$('ptbtn');if(ptb)ptb.onclick=ptModal;
  const mpb=$('mapb');if(mpb)mpb.onclick=()=>mapScreen(F.sp);
  app.querySelectorAll('[data-today]').forEach(b=>{b.onclick=todayModal;b.onkeydown=kb(todayModal)});
  app.querySelectorAll('[data-rd]').forEach(b=>{const f=()=>readyModal();b.onclick=f;b.onkeydown=kb(f)});
  const ax=$('ambx');if(ax)ax.onclick=()=>{lsSet('bc_amb_hide',String(Date.now()+7*864e5));home()};
  homeAsync();
  const rm=$('rsm');if(rm)rm.onclick=resumeNow;
  const rx=$('rsx');if(rx)rx.onclick=()=>{S.resume=null;S.resumeExam=null;save();home()};
  const sg=$('shgoal');if(sg)sg.onclick=e=>{if(e&&e.stopPropagation)e.stopPropagation();shareCard('goal')};
  app.querySelectorAll('[data-ann]').forEach(b=>b.onclick=()=>{S.annSeen[b.dataset.ann]=1;save();home()});
  adTrack();
  const exx=app.querySelector('[data-expx]');if(exx)exx.onclick=()=>{lsSet('bc_exp_hide',dk(new Date()));home()};
  const gb=$('goalbtn');if(gb){gb.onclick=goalSetup;gb.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();goalSetup()}}}
  const ig=$('instgo');if(ig)ig.onclick=async()=>{try{deferredInstall.prompt();await deferredInstall.userChoice}catch(e){}deferredInstall=null;home()};
  const ix=$('instx');if(ix)ix.onclick=()=>{lsSet('bc_inst_hide','1');home()};
  const wk=$('weak');if(wk)wk.onclick=()=>start(weak.id,spOfSubj(subjOf(weak.id)),undefined,{mode:'smart'});
  const pgb=$('prg');if(pgb)pgb.onclick=progress;
  const srb=$('srch');if(srb)srb.onclick=searchScreen;
  const stb=$('stbtn');if(stb){stb.onclick=progress;stb.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();progress()}}}
  const sb2=$('sub');if(sb2)sb2.onclick=paywall;
  const b1=$('bkSp');if(b1)b1.onclick=()=>{F.sp=null;F.sj=null;up()};
  const b2=$('bkSj');if(b2)b2.onclick=()=>{F.sj=null;up()};
}


/* ---------- الإعدادات (نافذة من زر الإعدادات في الرئيسية) ---------- */
const masteredAll=()=>Object.keys(S.cards).filter(id=>{const e=S.cards[id];return e&&e.s&&e.box>=3&&!goneQ(id,e)}).length;
const suspCount=()=>Object.keys(S.susp||{}).filter(id=>S.susp[id]>0).length;
function redeemModal(){
  showModal(`<button class="x" id="cl" aria-label="إغلاق">✕</button><h2>تفعيل رمز اشتراك</h2>
    <p class="hint">أدخل رمز التفعيل لتمديد اشتراكك أو الاشتراك باختصاص جديد.</p>
    <label class="fld"><input class="in" id="rc" maxlength="20" dir="ltr" autocapitalize="characters" style="text-align:left" placeholder="XXXX-XXXX-XXXX"></label>
    <p class="err" id="er" role="alert"></p><button class="btn block" id="rgo">تفعيل</button>`);
  $('cl').onclick=closeModal;
  $('rgo').onclick=async()=>{
    const code=$('rc').value.trim();
    if(code.length<6){$('er').textContent='اكتب الرمز.';return}
    $('rgo').disabled=true;$('er').textContent='';
    const r=await sb.rpc('redeem_code',{p_code:code});
    if(r.error){
      if(isKick(r.error)){await kick();return}
      $('er').textContent=/invalid_code/.test(String(r.error.message||''))?'رمز التفعيل غير صحيح أو مستخدم من قبل.':errMsg(r.error);
      $('rgo').disabled=false;return;
    }
    closeModal();toast('تم تفعيل الاشتراك');startApp();
  };
}
function passModal(){
  const f=(id,l,ac)=>`<label class="fld"><span>${l}</span><input class="in" id="${id}" type="password" autocomplete="${ac}" style="direction:ltr;text-align:left"></label>`;
  showModal(`<button class="x" id="cl" aria-label="إغلاق">✕</button><h2>تغيير كلمة السر</h2>
    ${f('p0','كلمة السر الحالية','current-password')}${f('p1','كلمة السر الجديدة (8 أحرف على الأقل)','new-password')}${f('p2','أعد كتابة الجديدة','new-password')}
    <p class="err" id="er" role="alert"></p><button class="btn block" id="pgo">تغيير</button>`);
  $('cl').onclick=closeModal;
  $('pgo').onclick=async()=>{
    const a=$('p0').value,b=$('p1').value,c=$('p2').value,er=$('er');
    if(!a){er.textContent='اكتب كلمة السر الحالية.';return}
    if(b.length<8||b.length>72){er.textContent='كلمة السر الجديدة من 8 إلى 72 حرفاً.';return}
    if(b!==c){er.textContent='كلمتا السر الجديدتان غير متطابقتين.';return}
    if(b===a){er.textContent='اختر كلمة سر مختلفة عن الحالية.';return}
    $('pgo').disabled=true;er.textContent='';
    try{
      const em=Store.user&&Store.user.email;
      const v=await sb.auth.signInWithPassword({email:em,password:a});
      if(v.error){er.textContent='كلمة السر الحالية غير صحيحة.';$('pgo').disabled=false;return}
      await sb.rpc('claim_session');   // التحقق أنشأ جلسة جديدة لهذا الجهاز، فنثبّتها كجلسة الحساب
      const u=await sb.auth.updateUser({password:b});
      if(u.error){er.textContent='تعذر تغيير كلمة السر. جرب مرة ثانية.';$('pgo').disabled=false;return}
      closeModal();toast('تم تغيير كلمة السر');
    }catch(e){er.textContent='تعذر الاتصال. جرب مرة ثانية.';$('pgo').disabled=false}
  };
}
function settingsModal(){
  showModal(`<button class="x" id="cl" aria-label="إغلاق">✕</button><h2>الإعدادات</h2><div id="setbody"></div>`);
  $('cl').onclick=closeModal;
  const paint=()=>{
    const box=$('setbody');if(!box)return;
    box.innerHTML=`<div class="setting"><div><b>وضع الوقت</b><div style="font-size:13px;color:var(--muted)">60 ثانية لكل سؤال</div></div>
      <button class="sw" id="tm" role="switch" aria-checked="${S.timer}" aria-label="وضع الوقت"></button></div>
    <div class="setting col"><b>المظهر</b><div class="seg" role="group" aria-label="المظهر">${[['auto','تلقائي'],['light','فاتح'],['dark','داكن']].map(([v,t])=>`<button data-th="${v}" aria-pressed="${themePref()===v}">${t}</button>`).join('')}</div></div>
    <div class="setting col"><b>حجم خط الأسئلة</b><div class="seg" role="group" aria-label="حجم الخط">${[['s','صغير'],['m','عادي'],['l','كبير'],['xl','كبير جداً']].map(([v,t])=>`<button data-fs="${v}" aria-pressed="${fsPref()===v}">${t}</button>`).join('')}</div></div>
    ${pushRowHtml()}${kbHintHtml()}
    <div class="acct">${Store.user?`<b>${esc((Store.profile&&(Store.profile.full_name||Store.profile.username))||'حسابك')}</b><br>${Store.premium?'اشتراكك: '+Object.keys(Store.subs).map(id=>esc(spById(id).n)+' حتى '+fdate(Store.subs[id])).join('، '):'لا يوجد اشتراك فعّال'}.<button class="btn line block" id="rdm" style="margin-top:10px">تفعيل رمز اشتراك</button><button class="btn line block" id="chpw" style="margin-top:8px">تغيير كلمة السر</button>${suspCount()?`<button class="btn line block" id="susp" style="margin-top:8px">إعادة الأسئلة المعلّقة (${ar(suspCount())})</button>`:''}<button class="btn line block" id="lo" style="margin-top:8px">تسجيل الخروج</button>`:'أنت تتصفح كزائر: الأسئلة المفتوحة للتجربة فقط، واشترك لفتح الباقي.'}</div>`;
    $('tm').onclick=()=>{S.timer=!S.timer;save();paint()};
    box.querySelectorAll('[data-th]').forEach(b=>b.onclick=()=>{setTheme(b.dataset.th);paint()});
    box.querySelectorAll('[data-fs]').forEach(b=>b.onclick=()=>{setFs(b.dataset.fs);paint()});
    const pn=$('pn');if(pn)pn.onclick=async()=>{await pushToggle();paint()};
    const lo=$('lo');if(lo)lo.onclick=()=>{closeModal();logout()};
    const rd=$('rdm');if(rd)rd.onclick=redeemModal;
    const cpw=$('chpw');if(cpw)cpw.onclick=passModal;
    const su=$('susp');if(su)su.onclick=async()=>{
      if(!(await askConfirm('إعادة الأسئلة المعلّقة','ستعود كل الأسئلة التي علّقتها إلى المراجعة.','أعدها')))return;
      Object.keys(S.susp||{}).forEach(id=>{if(S.susp[id]>0)S.susp[id]=-Date.now()});save();settingsModal();
    };
  };
  paint();
}
/* ---------- مزامنة التقدم مع Supabase Storage ---------- */
let PU=null,PD=false,PT=null,PBusy=false,PLast=null,PCONF=0,_pruneWarned=false;
const PROG_GZ_MAX=3000000;
const PSYNC=['cards','susp','starred','starDel','days','exams','badges','goal','freezes','frozen','fzMs','total','newLimit','newDay','ep','pu','dq','exd'];
/* ضغط حجم ملف التقدم: الأرقام العشرية تُقرَّب لثلاث خانات، ومواعيد المراجعة تُخزَّن بالدقائق بدل الملّي ثانية.
   يُطبَّق عند الحفظ فقط (cv:1) ويُعكس عند القراءة، فلا يتغير أي شيء في الجدولة (فرق أقل من دقيقة). */
const r3=x=>typeof x==='number'?Math.round(x*1000)/1000:x;
const toMin=x=>typeof x==='number'?Math.round(x/60000):x;
const fromMin=x=>typeof x==='number'?x*60000:x;
function packCards(cards){
  const out={};
  Object.keys(cards||{}).forEach(id=>{const c=cards[id];if(!c||typeof c!=='object'){out[id]=c;return}
    const p=Object.assign({},c);
    if('sb' in p)p.sb=r3(p.sb);if('df' in p)p.df=r3(p.df);
    if('lr' in p)p.lr=toMin(p.lr);if('due' in p)p.due=toMin(p.due);
    out[id]=p});
  return out;
}
function unpackProgress(R){
  if(!R||R.cv!==1||!R.cards)return R;
  const out={};
  Object.keys(R.cards).forEach(id=>{const c=R.cards[id];if(!c||typeof c!=='object'){out[id]=c;return}
    const p=Object.assign({},c);
    if('lr' in p)p.lr=fromMin(p.lr);if('due' in p)p.due=fromMin(p.due);
    out[id]=p});
  R.cards=out;delete R.cv;return R;
}
function pBody(withPu,obj){
  const src=obj||S,o={v:1};
  PSYNC.forEach(k=>{if(k==='pu'&&!withPu)return;if(src[k]!==undefined)o[k]=src[k]});
  if(o.cards){o.cards=packCards(o.cards);o.cv=1}
  return JSON.stringify(o);
}
const gzip=async str=>{if(typeof CompressionStream==='undefined')return null;return await new Response(new Blob([str]).stream().pipeThrough(new CompressionStream('gzip'))).blob()};
const gunzip=async blob=>await new Response(blob.stream().pipeThrough(new DecompressionStream('gzip'))).text();
function schedP(){if(!PT)PT=setTimeout(pushProgress,240000)}   // 4 دقائق؛ ويُرفع فوراً عند الخروج من الصفحة
function markP(){if(PU){PD=true;schedP()}}
function localRaw(){uSave(SKEY,S)}
function initP(uid){
  clearTimeout(PT);PT=null;PD=false;PLast=null;PBusy=false;PU=uid||null;
  if(PU)loadProgressRemote();
}
// يحذف أقدم البطاقات مراجعةً من النسخة المرفوعة فقط حتى يتسع الملف
async function pruneProgress(){
  const ids=Object.keys(S.cards||{}).sort((a,b)=>((S.cards[a]&&S.cards[a].lr)||0)-((S.cards[b]&&S.cards[b].lr)||0));
  let drop=Math.max(1,Math.ceil(ids.length*0.1));
  for(let k=0;k<8&&drop<ids.length;k++){
    const keep=Object.assign({},S.cards);
    for(let i=0;i<drop;i++)delete keep[ids[i]];
    const z=await gzBlob(pBody(true,Object.assign({},S,{cards:keep})));
    if(z.size<=PROG_GZ_MAX)return z;
    drop=Math.ceil(drop*1.6);
  }
  return null;
}
async function pushProgress(){
  clearTimeout(PT);PT=null;
  if(!PU||!PD||PBusy)return;
  const key=pBody(false);
  if(key===PLast){PD=false;return}
  PBusy=true;const uid=PU,str=pBody(true);
  try{
    let ok=false;
    if(GZ){   // الملف على R2 عبر الـ Worker
      let z=await gzBlob(str);
      if(z.size>PROG_GZ_MAX){   // الملف كبير: تبقى المزامنة مستمرة بحذف أقدم البطاقات من النسخة السحابية فقط (نسخة جهازك كاملة)
        z=await pruneProgress();
        if(!z){PBusy=false;return}
        if(!_pruneWarned){_pruneWarned=true;toast('تقدمك كبير جداً، فتُحفظ على حسابك الأحدث منه فقط. جهازك يحتفظ بكل شيء.')}
      }
      ok=await dataPut('progress',z,true,true);
      if(ok==='conflict'){   // جهاز آخر كتب نسخة أحدث: ندمجها مع نسختنا ثم نرفع من جديد
        PBusy=false;
        if(PCONF<3){PCONF++;await loadProgressRemote()}
        else{PCONF=0;PD=true;schedP()}
        return;
      }
      if(ok==='replaced'){PBusy=false;guard(true);return}
      if(ok)PCONF=0;
    }else{    // متصفح بلا gzip: المسار القديم على Supabase
      const st=sb.storage.from('user-progress'),z=await gzip(str);
      const r=z?await st.upload(uid+'/progress.json.gz',z,{upsert:true,contentType:'application/gzip'})
               :await st.upload(uid+'/progress.json',new Blob([str],{type:'application/json'}),{upsert:true,contentType:'application/json'});
      ok=!r.error;
    }
    if(PU===uid&&ok){PLast=key;if(pBody(false)===key)PD=false;else schedP()}
  }catch(e){}
  PBusy=false;
}
function mergeProgress(R){
  const L=S,le=L.ep||0,re=R.ep||0;
  if(re>le){PSYNC.forEach(k=>{if(R[k]!==undefined)L[k]=R[k]})}          // تم تصفير التقدم من جهاز آخر
  else if(le>re){/* التصفير المحلي أحدث: نتجاهل النسخة السحابية */}
  else{
    const rc=R.cards||{},cards=Object.assign({},L.cards);
    Object.keys(rc).forEach(id=>{const a=cards[id],b=rc[id];if(!a||(b.lr||0)>(a.lr||0)||((b.lr||0)===(a.lr||0)&&(b.rp||0)>(a.rp||0)))cards[id]=b});
    const sd=Object.assign({},L.starDel||{});Object.keys(R.starDel||{}).forEach(id=>{sd[id]=Math.max(sd[id]||0,R.starDel[id])});
    const st=Object.assign({},L.starred),rs=R.starred||{};
    Object.keys(rs).forEach(id=>{if(!st[id]||(rs[id].t||0)>(st[id].t||0))st[id]=rs[id]});
    Object.keys(st).forEach(id=>{if((sd[id]||0)>(st[id].t||0))delete st[id];else delete sd[id]});
    const days=Object.assign({},L.days);
    Object.keys(R.days||{}).forEach(k=>{const a=days[k],b=R.days[k];if(!a||(b.n||0)>(a.n||0))days[k]=b});
    const em={};(L.exams||[]).concat(R.exams||[]).forEach(e=>{em[e.t]=e});
    const exams=Object.values(em).sort((a,b)=>b.t-a.t).slice(0,50);
    const su=Object.assign({},L.susp);Object.keys(R.susp||{}).forEach(id=>{if(!su[id]||Math.abs(R.susp[id])>Math.abs(su[id]))su[id]=R.susp[id]});L.susp=su;
    const badges=Object.assign({},L.badges);
    Object.keys(R.badges||{}).forEach(k=>{if(!badges[k]||R.badges[k]<badges[k])badges[k]=R.badges[k]});
    const newer=(R.pu||0)>(L.pu||0);
    ['goal','freezes','fzMs','newLimit'].forEach(k=>{if(newer&&R[k]!==undefined)L[k]=R[k]});
    L.frozen=Object.assign({},L.frozen,R.frozen);
    const a=L.newDay,b=R.newDay;
    if(b&&(!a||b.d>a.d||(b.d===a.d&&(b.n>a.n||b.x>a.x))))L.newDay=a&&a.d===b.d?{d:b.d,n:Math.max(a.n,b.n),x:Math.max(a.x||0,b.x||0)}:b;
    L.total=Math.max(L.total||0,R.total||0);
    const dq=Object.assign({},L.dq);Object.keys(R.dq||{}).forEach(k=>{const a=dq[k],b=R.dq[k];if(!b)return;if(!a||(b.done&&!a.done)||(!!b.done===!!a.done&&(b.r||[]).length>(a.r||[]).length))dq[k]=b});
    const exd=newer?Object.assign({},L.exd,R.exd):Object.assign({},R.exd,L.exd);
    L.cards=cards;L.starred=st;L.starDel=sd;L.days=days;L.exams=exams;L.badges=badges;L.dq=dq;L.exd=exd;
  }
  if(!S.cards)S.cards={};if(!S.susp)S.susp={};if(!S.starred)S.starred={};if(!S.starDel)S.starDel={};if(!S.days)S.days={};if(!S.exams)S.exams=[];if(!S.badges)S.badges={};if(!S.frozen)S.frozen={};if(!S.dq)S.dq={};if(!S.exd)S.exd={};
  S.pu=Math.max(L.pu||0,R.pu||0);
}
async function loadProgressRemote(){
  const uid=PU;if(!uid)return;
  let text=null,R=null,migrate=false;
  try{
    if(GZ){
      let j=null;
      try{j=await dataGet('progress')}catch(e){return}   // تعذر الوصول: نكتفي بالنسخة المحلية
      if(PU!==uid)return;
      if(j)R=unpackProgress(j);
    }
    if(!R){   // لا نسخة على R2 بعد (أو المتصفح بلا gzip): نقرأ النسخة القديمة من Supabase وننقلها
      const st=sb.storage.from('user-progress');
      const r=await st.download(uid+'/progress.json.gz');
      if(!r.error&&r.data)text=await gunzip(r.data);
      else{const r2=await st.download(uid+'/progress.json');if(!r2.error&&r2.data)text=await r2.data.text()}
      if(text){try{R=unpackProgress(JSON.parse(text))}catch(e){return}if(GZ)migrate=true}
    }
  }catch(e){return}
  if(PU!==uid)return;
  if(R)mergeProgress(R);
  localRaw();
  const remoteKey=(R&&!migrate)?pBody(false,R):null;
  if(migrate||pBody(false)!==remoteKey){PD=true;PLast=null;pushProgress()}else PLast=remoteKey;
  if(view==='home')home();
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')pushProgress()});
window.addEventListener('pagehide',()=>{pushProgress()});
/* ---------- ملاحظات المشترك وتظليلاته (تُحفظ على R2 مضغوطة gzip عبر /api/data) ---------- */
let N={q:{}},NU=null,ND=false,NT=null,NV=0,hlPend=null;
const GZ=typeof CompressionStream!=='undefined'&&typeof DecompressionStream!=='undefined';
const NOTES_GZ_MAX=1800000;
async function gzBlob(str){return await new Response(new Blob([str]).stream().pipeThrough(new CompressionStream('gzip'))).blob()}
async function gunzipStr(buf){return await new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).text()}
async function apiHeaders(){const g=await sb.auth.getSession();const x=g&&g.data&&g.data.session;return x?{Authorization:'Bearer '+x.access_token}:null}
/* يرجع الكائن، أو null إذا لا توجد نسخة بعد، ويرمي خطأ إذا تعذر الوصول */
const DETAG={};   // آخر نسخة قرأناها من كل ملف، لنكتشف أن جهازاً آخر كتب فوقها
async function dataGet(kind){
  const h=await apiHeaders();if(!h)throw new Error('no_session');
  const r=await fetch('/api/data/'+kind,{headers:h,cache:'no-store'});
  if(r.ok){DETAG[kind]=r.headers.get('X-Data-Etag')||'';return JSON.parse(await gunzipStr(await r.arrayBuffer()))}
  if(r.status===404){let j=null;try{j=await r.json()}catch(e){}if(j&&j.error==='none'){DETAG[kind]='';return null}}
  throw new Error('data_'+r.status);
}
// يرجع true/false. ومع useEtag: 'conflict' إذا تغيّر الملف من جهاز آخر، و'replaced' إذا أُغلقت جلسة هذا الجهاز
async function dataPut(kind,gz,keep,useEtag){
  const h=await apiHeaders();if(!h)return false;
  if(useEtag&&DETAG[kind])h['X-If-Etag']=DETAG[kind];
  const r=await fetch('/api/data/'+kind,{method:'PUT',headers:Object.assign({'Content-Type':'application/gzip'},h),body:gz,keepalive:!!keep&&gz.size<60000});
  if(r.ok){const t=r.headers.get('X-Data-Etag');if(t)DETAG[kind]=t;return true}
  if(useEtag){
    if(r.status===412)return 'conflict';
    if(r.status===409){let j=null;try{j=await r.json()}catch(e){}if(j&&j.error==='session_replaced')return 'replaced'}
  }
  return false;
}
const noteOk=c=>!!(Store.user&&Store.subs[qSp(c)]);
function nKey(){return 'bc_notes_'+NU}
function nCache(){if(!NU)return;uSave(nKey(),{d:ND,q:N.q})}
async function initN(uid){
  clearTimeout(NT);N={q:{}};NU=uid||null;ND=false;
  const pqP=initPQ(uid);
  if(NU){
    const key=nKey(),[a,b]=await uLoad(key);
    if(NU===uid){
      const m=mergeQ(a,b);N.q=m.q;ND=m.d;
      if(b)uAdopt(key,{d:ND,q:N.q});
      loadNotesRemote();
    }
  }
  await pqP;
}
function mergeN(rem){
  Object.keys(rem).forEach(id=>{const a=N.q[id],b=rem[id];if(!b)return;if(!a||(b.u||0)>(a.u||0))N.q[id]=b});
  nCache();
}
async function loadNotesRemote(){
  const uid=NU;if(!uid)return;
  try{
    let j=null;
    if(GZ){
      try{j=await dataGet('notes')}catch(e){return}   // تعذر الوصول: نكتفي بالنسخة المحلية ونحاول لاحقاً
      if(NU!==uid)return;
      if(j){mergeN(j.q||{});if(ND)pushNotes();return}
    }
    /* لا توجد نسخة على R2 بعد (أو المتصفح لا يدعم gzip): نقرأ النسخة القديمة من Supabase وننقلها */
    const r=await sb.storage.from('user-notes').download(uid+'/notes.json');
    if(NU!==uid)return;
    if(!r.error&&r.data){
      const o=JSON.parse(await r.data.text()),q=(o&&o.q)||{};
      mergeN(q);
      if(GZ&&Object.keys(q).length)ND=true;
    }
    if(ND)pushNotes();
  }catch(e){}
}
function touchN(){ND=true;NV++;nCache();clearTimeout(NT);NT=setTimeout(pushNotes,GZ?240000:2000)}
/* تحذير مبكر: عند وصول حجم الملف إلى 80% من الحد يظهر تنبيه مرة واحدة كل يوم */
function limitWarn(kind,size,max,label){
  if(size<max*0.8||size>max)return;
  const k='bc_lw_'+kind+'_'+(NU||PQU||''),day=new Date().toISOString().slice(0,10);
  try{if(localStorage.getItem(k)===day)return;localStorage.setItem(k,day)}catch(e){}
  toast('اقتربت من حد '+label+' ('+ar(Math.round(size/max*100))+'% ممتلئ). احذف القديم الذي لا تحتاجه قبل أن يتوقف الحفظ.');
}
async function pushNotes(){
  clearTimeout(NT);
  if(!NU||!ND)return;
  const uid=NU,v=NV,body=JSON.stringify({v:1,q:N.q});
  if(!GZ){
    if(body.length>1800000){toast('ملاحظاتك وصلت للحد الأقصى، احذف بعضها.');return}
    try{
      const r=await sb.storage.from('user-notes').upload(uid+'/notes.json',new Blob([body],{type:'application/json'}),{upsert:true,contentType:'application/json'});
      if(NU===uid&&!r.error&&NV===v){ND=false;nCache()}
    }catch(e){}
    return;
  }
  let gz;try{gz=await gzBlob(body)}catch(e){return}
  if(gz.size>NOTES_GZ_MAX){toast('ملاحظاتك وصلت للحد الأقصى، احذف بعضها.');return}
  limitWarn('n',gz.size,NOTES_GZ_MAX,'الملاحظات');
  try{
    const ok=await dataPut('notes',gz,true);
    if(NU===uid&&ok&&NV===v){ND=false;nCache()}
  }catch(e){}
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')pushNotes()});
window.addEventListener('pagehide',()=>{pushNotes()});
/* ---------- أسئلتي الخاصة: نص فقط، تُحفظ على R2 مضغوطة (users/<uid>/questions.json.gz) ---------- */
const PQ_GZ_MAX=1500000,PQ_QL=1500,PQ_OL=300,PQ_EL=1500;
let PQ={q:{}},PQU=null,PQD=false,PQT=null,PQV=0,PS=null,PQL=false,PQP=null;
const pqKey=()=>'bc_pq_'+PQU;
function pqCache(){if(!PQU)return;uSave(pqKey(),{d:PQD,q:PQ.q})}
function pqPurge(){const lim=Date.now()-30*864e5;Object.keys(PQ.q).forEach(id=>{const e=PQ.q[id];if(e&&e.x&&(e.u||0)<lim)delete PQ.q[id]})}
async function initPQ(uid){
  clearTimeout(PQT);PQ={q:{}};PQU=uid||null;PQD=false;PS=null;PQL=false;PQP=null;
  if(!PQU)return;
  const key=pqKey(),[a,b]=await uLoad(key);
  if(PQU!==uid)return;
  const m=mergeQ(a,b);PQ.q=m.q;PQD=m.d;
  if(b)uAdopt(key,{d:PQD,q:PQ.q});
}
function pqMerge(rem){
  Object.keys(rem).forEach(id=>{const a=PQ.q[id],b=rem[id];if(!b)return;if(!a||(b.u||0)>(a.u||0))PQ.q[id]=b});
  pqPurge();pqCache();
}
/* تحميل الأسئلة الخاصة من السيرفر عند الحاجة فقط (فتح الصفحة أو قبل أول رفع) لتقليل الطلبات */
function loadPQRemote(){
  const uid=PQU;if(!uid||!GZ)return Promise.resolve();
  if(PQL)return Promise.resolve();
  if(PQP)return PQP;
  const p=(async()=>{
    try{
      const j=await dataGet('pq');
      if(PQU!==uid)return;
      if(j)pqMerge(j.q||{});
      PQL=true;
    }catch(e){}
  })().finally(()=>{if(PQP===p)PQP=null});
  PQP=p;return p;
}
function touchPQ(){PQD=true;PQV++;pqCache();clearTimeout(PQT);PQT=setTimeout(pushPQ,240000)}
async function pushPQ(){
  clearTimeout(PQT);
  if(!PQU||!PQD||!GZ)return;
  if(!PQL){await loadPQRemote();if(!PQL||!PQD)return}
  const uid=PQU,v=PQV;let gz;
  try{gz=await gzBlob(JSON.stringify({v:1,q:PQ.q}))}catch(e){return}
  if(gz.size>PQ_GZ_MAX){toast('وصلت للحد الأقصى من أسئلتك الخاصة، احذف بعضها.');return}
  limitWarn('p',gz.size,PQ_GZ_MAX,'أسئلتك الخاصة');
  try{const ok=await dataPut('pq',gz,true);if(PQU===uid&&ok&&PQV===v){PQD=false;pqCache()}}catch(e){}
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')pushPQ()});
window.addEventListener('pagehide',()=>{pushPQ()});
const pqLive=()=>Object.values(PQ.q).filter(e=>e&&!e.x);
const pqList=sp=>pqLive().filter(e=>e.sp===sp).sort((a,b)=>(b.t||0)-(a.t||0));
const pqDue=(e,now)=>!e.st||e.st.due==null||e.st.due<=now;
const pqCut=(t,n)=>{t=String(t||'').replace(/\s+/g,' ').trim();return t.length>n?t.slice(0,n)+'…':t};
function pqScreen(sp){
  view='pq';stopTimer();PS=null;
  const spn=spById(sp).n,list=pqList(sp),now=Date.now(),due=list.filter(e=>pqDue(e,now)).length;
  app.innerHTML=`<div class="top"><div class="brand">✍️ أسئلتي الخاصة<small>${esc(spn)}</small></div><button class="pill" id="pqb">رجوع</button></div>
  <div class="sum"><p>${list.length?ar(list.length)+' سؤال خاص بك في '+esc(spn)+'، منها '+ar(due)+' مستحق للمراجعة.':'لا توجد أسئلة خاصة بك في '+esc(spn)+' بعد.'}</p>
    <div class="r2"><button class="btn" id="pqgo"${due?'':' disabled'}>ابدأ المراجعة</button><button class="btn line" id="pqadd">+ سؤال جديد</button><button class="btn line" id="pqaddf">+ بطاقة جديدة <bdi dir="ltr">(flashcard)</bdi></button></div></div>
  <h3 class="sec">أسئلتك</h3>
  ${list.length?list.map(e=>`<div class="item" style="--sc:#1F5FBF"><div class="grow"><div class="qt" dir="${dirOf(e.q)}">${esc(pqCut(e.q,140))}</div><div class="sub">${e.k==='f'?'بطاقة · ':'سؤال · '}${pqDue(e,now)?'مستحق للمراجعة':'مراجعتها '+fdate(e.st.due)}</div></div><div style="display:flex;gap:6px;flex:none"><button class="ib" data-pe="${esc(e.id)}">تعديل</button><button class="ib del" data-pd="${esc(e.id)}">حذف</button></div></div>`).join(''):'<div class="empty">اضغط «سؤال جديد» أو «بطاقة جديدة» لتبدأ.</div>'}
  <p class="note">أسئلتك خاصة بك وحدك ومحفوظة على حسابك. نص فقط بدون صور (بطاقة أمامية وخلفية أو سؤال اختيارات).</p>`;
  $('pqb').onclick=home;
  $('pqadd').onclick=()=>pqForm(sp,null);
  $('pqaddf').onclick=()=>pqForm(sp,null,'f');
  $('pqgo').onclick=()=>pqStart(sp);
  app.querySelectorAll('[data-pe]').forEach(b=>b.onclick=()=>pqForm(sp,b.dataset.pe));
  app.querySelectorAll('[data-pd]').forEach(b=>b.onclick=async()=>{
    const id=b.dataset.pd,e=PQ.q[id];if(!e)return;
    if(!(await askConfirm('حذف السؤال','سيُحذف هذا السؤال من أسئلتك الخاصة.','احذف')))return;
    PQ.q[id]={id:id,sp:e.sp,x:1,u:Date.now()};touchPQ();pqScreen(sp);toast('تم حذف السؤال');
  });
  window.scrollTo(0,0);
}
function pqForm(sp,id,kind){
  const e=id?PQ.q[id]:null;const isF=e?e.k==='f':kind==='f';
    const o=e&&e.o?e.o.slice():['','','',''];while(o.length<4)o.push('');
  const orow=i=>`<div class="orow" id="pqr${i}"><input type="radio" name="pqa" value="${i}" aria-label="الجواب الصحيح ${LET[i]}" ${(e?e.a:0)===i?'checked':''}><span class="l">${LET[i]}</span><input class="in" id="pqo${i}" dir="auto" maxlength="${PQ_OL}" value="${esc(o[i])}"></div>`;
  showModal(`<button class="x" id="cl" aria-label="إغلاق">✕</button><h2>${isF?(e?'تعديل البطاقة':'بطاقة جديدة'):(e?'تعديل السؤال':'سؤال جديد')}</h2>
    <label class="fld"><span>${isF?'الوجه الأمامي (السؤال)':'نص السؤال'}</span><textarea class="in" id="pqq" dir="auto" maxlength="${PQ_QL}" style="min-height:110px">${esc(e?e.q:'')}</textarea></label>
    ${isF?`<label class="fld"><span>الوجه الخلفي (الجواب)</span><textarea class="in" id="pqb2" dir="auto" maxlength="${PQ_EL}" style="min-height:110px">${esc(e?e.b:'')}</textarea></label>`:`<div class="fld"><span>الخيارات، واختر الجواب الصحيح بالدائرة</span><div id="pqos">${[0,1,2,3].map(orow).join('')}${o.length>4?[4,5].filter(i=>i<o.length).map(orow).join(''):''}</div>
      <button class="btn line block" type="button" id="pqmore" style="${o.length>=6?'display:none':''}">+ خيار إضافي</button></div>`}
    <label class="fld"><span>${isF?'ملاحظة (اختياري)':'الشرح (اختياري)'}</span><textarea class="in" id="pqe" dir="auto" maxlength="${PQ_EL}" style="min-height:90px">${esc(e?e.e:'')}</textarea></label>
    <p class="err" id="er" role="alert"></p>
    <div class="r2"><button class="btn" id="pqsv">حفظ</button>${e?'':'<button class="btn line" id="pqsv2">حفظ وإضافة آخر</button>'}</div>`);
  $('cl').onclick=closeModal;
  let n=Math.max(4,o.length);
  if(!isF)$('pqmore').onclick=()=>{
    if(n>=6)return;
    $('pqos').insertAdjacentHTML('beforeend',orow(n));n++;
    if(n>=6)$('pqmore').style.display='none';
  };
  const submit=again=>{
    const text=$('pqq').value.trim();
    if(!text){$('er').textContent='اكتب نص السؤال.';return}
    if(isF){
      const back=$('pqb2').value.trim();
      if(!back){$('er').textContent='اكتب الوجه الخلفي (الجواب).';return}
        const now=Date.now(),nid=e?e.id:'p'+now.toString(36)+Math.random().toString(36).slice(2,7);
      const it={id:nid,sp:sp,k:'f',q:text,b:back,e:$('pqe').value.trim(),t:e?e.t:now,u:now};
      if(e&&e.st&&e.q===text&&e.b===back)it.st=e.st;   // تغيّر نص البطاقة: تبدأ جدولتها من جديد
      PQ.q[nid]=it;touchPQ();toast('تم حفظ البطاقة');
      if(again){pqScreen(sp);pqForm(sp,null,'f')}else{closeModal();pqScreen(sp)}
      return;
    }
    const picked=+(document.querySelector('input[name=pqa]:checked')||{value:0}).value;
    const opts=[];let a=-1;
    for(let i=0;i<n;i++){const t=$('pqo'+i).value.trim();if(t){if(i===picked)a=opts.length;opts.push(t)}}
    if(opts.length<2){$('er').textContent='اكتب خيارين على الأقل.';return}
    if(a<0){$('er').textContent='الخيار المحدد كجواب صحيح فارغ. حدد خياراً مكتوباً.';return}
    const now=Date.now(),nid=e?e.id:'p'+now.toString(36)+Math.random().toString(36).slice(2,7);
    const changed=!e||e.q!==text||e.a!==a||JSON.stringify(e.o)!==JSON.stringify(opts);
    PQ.q[nid]={id:nid,sp:sp,q:text,o:opts,a:a,e:$('pqe').value.trim(),t:e?e.t:now,u:now,st:(e&&!changed)?e.st:undefined};
    if(!PQ.q[nid].st)delete PQ.q[nid].st;
    touchPQ();toast('تم حفظ السؤال');
    if(again){pqScreen(sp);pqForm(sp,null)}else{closeModal();pqScreen(sp)}
  };
  $('pqsv').onclick=()=>submit(false);
  const s2=$('pqsv2');if(s2)s2.onclick=()=>submit(true);
  $('pqq').focus();
}
/* مراجعة الأسئلة الخاصة: جلسة مستقلة تستعمل نفس خوارزمية الجدولة ولا تدخل في إحصائيات الأسئلة الرسمية ولا لوحة الصدارة */
function pqStart(sp){
  const now=Date.now();
  const pool=pqList(sp).filter(e=>pqDue(e,now)).sort((a,b)=>((a.st&&a.st.due)||0)-((b.st&&b.st.due)||0));
  const ids=pool.slice(0,20).map(e=>e.id);
  if(!ids.length){toast('لا توجد أسئلة مستحقة للمراجعة الآن.');return}
  PS={sp:sp,Q:ids,i:0,ok:0,n:0,rq:{},t0:0};
  pqCard();
}
function pqCard(){
  view='pqstudy';stopTimer();
  while(PS.i<PS.Q.length&&(!PQ.q[PS.Q[PS.i]]||PQ.q[PS.Q[PS.i]].x))PS.i++;
  if(PS.i>=PS.Q.length){pqSummary();return}
  const e=PQ.q[PS.Q[PS.i]];PS.t0=Date.now();
  app.innerHTML=`<div class="sbar"><button class="back" id="pqx" aria-label="رجوع"><span>تراجع</span><span class="ba">${ico('chev')}</span></button>
    <div class="prog"><div class="bar"><i style="width:${Math.round(100*PS.i/PS.Q.length)}%"></i></div></div>
    <span class="pill"><bdi dir="ltr">${ar(PS.i+1)} / ${ar(PS.Q.length)}</bdi></span></div>
  <div class="scene" style="--sc:#1F5FBF"><div class="card"><section class="face front" aria-label="السؤال">
    <div class="tags"><span class="tag s">أسئلتي الخاصة</span><span class="tag">${esc(spById(PS.sp).n)}</span></div>
    <p class="q" dir="${dirOf(e.q)}">${fmt(e.q)}</p>
    ${e.k==='f'?'<button class="btn block" id="pqshow">إظهار الجواب</button>':`<ul class="opts">${e.o.map((t,i)=>`<li><button class="opt" dir="${dirOf(t)}" data-i="${i}"><span class="l">${LET[i]}</span><span class="t">${esc(t)}</span></button></li>`).join('')}</ul>`}
  </section></div></div>`;
  $('pqx').onclick=()=>pqScreen(PS.sp);
  app.querySelectorAll('.opt').forEach(b=>b.onclick=()=>pqPick(+b.dataset.i));
  const sh=$('pqshow');if(sh)sh.onclick=()=>pqFlip(e);
  window.scrollTo(0,0);
}
function pqFlip(e){
  app.querySelector('.face').innerHTML=`<div class="tags"><span class="tag s">أسئلتي الخاصة</span><span class="tag">${esc(spById(PS.sp).n)}</span></div>
    <p class="q" dir="${dirOf(e.q)}">${fmt(e.q)}</p>
    <div class="exp" dir="${dirOf(e.b)}"><b>الجواب</b>${fmt(e.b)}</div>
    ${e.e?`<div class="exp" dir="${dirOf(e.e)}"><b>ملاحظة</b>${fmt(e.e)}</div>`:''}
    <div class="r2"><button class="btn line" data-g="1">نسيتها</button><button class="btn line" data-g="2">صعبة</button></div>
    <div class="r2"><button class="btn" data-g="3">جيدة</button><button class="btn" data-g="4">سهلة</button></div>`;
  app.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>pqGrade(e,+b.dataset.g));
}
function pqGrade(e,g){
  if(PS.done===e.id+PS.i)return;PS.done=e.id+PS.i;
  const now=Date.now(),ok=g>=3;
  e.st=fsrsApply(Object.assign({},e.st||{}),g,now);e.u=now;touchPQ();
  PS.n++;if(ok)PS.ok++;
  if(!ok&&!PS.rq[e.id]){PS.rq[e.id]=1;PS.Q.push(e.id)}
  PS.i++;pqCard();
}
function pqPick(i){
  const e=PQ.q[PS.Q[PS.i]];if(!e||PS.done===e.id+PS.i)return;
  PS.done=e.id+PS.i;
  const ok=i===e.a,now=Date.now(),last=PS.i+1>=PS.Q.length&&(ok||PS.rq[e.id]);
  const st=fsrsApply(Object.assign({},e.st||{}),ok?3:1,now);
  e.st=st;e.u=now;touchPQ();
  PS.n++;if(ok)PS.ok++;
  if(!ok&&!PS.rq[e.id]){PS.rq[e.id]=1;PS.Q.push(e.id)}
  const isLast=PS.i+1>=PS.Q.length;
  app.querySelector('.face').innerHTML=`<div class="tags"><span class="tag s">أسئلتي الخاصة</span><span class="tag">${esc(spById(PS.sp).n)}</span></div>
    <p class="q" dir="${dirOf(e.q)}">${fmt(e.q)}</p>
    <p class="res ${ok?'ok':'no'}">${ok?'جوابك صحيح':'الجواب خاطئ'}</p>
    <ul class="opts">${e.o.map((t,k)=>`<li><div class="opt${k===e.a?' good':(k===i?' bad':'')}" dir="${dirOf(t)}"><span class="l">${LET[k]}</span><span class="t">${esc(t)}</span></div></li>`).join('')}</ul>
    ${e.e?`<div class="exp" dir="${dirOf(e.e)}"><b>الشرح</b>${fmt(e.e)}</div>`:''}
    <button class="btn block" id="pqn">${isLast?'عرض النتيجة':'السؤال التالي'}</button>`;
  $('pqn').onclick=()=>{PS.i++;pqCard()};
  $('pqn').focus({preventScroll:true});
}
function pqSummary(){
  view='pqsum';
  const n=PS.n,ok=PS.ok,sp=PS.sp,pct=n?Math.round(100*ok/n):0;
  app.innerHTML=`<div class="top"><div class="brand">✍️ أسئلتي الخاصة<small>${esc(spById(sp).n)}</small></div></div>
  <div class="sum"><div class="big">${ar(pct)}%</div><p>أجبت ${ar(ok)} من ${ar(n)} إجابة صحيحة.</p><div class="bar"><i style="width:${pct}%"></i></div>
    <button class="btn block" id="pqback">رجوع لأسئلتي</button></div>`;
  $('pqback').onclick=()=>pqScreen(sp);
}
const noteGet=id=>(N.q[id]&&N.q[id].n)||'';
const hasNoteC=id=>{const e=N.q[id];return !!e&&(!!e.n||Object.keys(e.h||{}).some(f=>(e.h[f]||[]).length>0))};
const noteSubj=id=>(N.q[id]&&N.q[id].s)||((Store.qmap[id]||{}).s)||null;
function notedIds(sp){return Object.keys(N.q).filter(id=>{if(!hasNoteC(id))return false;const sj=noteSubj(id);if(!sj||!Store.subjects.some(x=>x.id===sj))return false;if(Store.idxS[sj]&&!Store.idx[id])return false;return spOfSubj(subjOf(sj))===sp})}
function noteSet(id,txt){const e=N.q[id]||(N.q[id]={});if(Store.qmap[id])e.s=Store.qmap[id].s;e.n=txt;e.u=Date.now();touchN()}
/* التظليل */
function hlRanges(c,f,text){
  const arr=((N.q[c.id]||{}).h||{})[f]||[],ok=[];
  arr.forEach((r,i)=>{let a=r[0],b=r[1];const sn=r[2];if(!sn)return;if(text.slice(a,b)!==sn){const j=text.indexOf(sn);if(j<0)return;a=j;b=j+sn.length}ok.push([a,b,sn,i])});
  ok.sort((x,y)=>x[0]-y[0]);
  const out=[];ok.forEach(r=>{const l=out[out.length-1];if(l&&r[0]<l[1])return;out.push(r)});
  return out;
}
function hlInner(text,rs){
  let out='',p=0;
  rs.forEach(r=>{out+=esc(text.slice(p,r[0]))+'<mark class="hl" data-hi="'+r[3]+'">'+esc(text.slice(r[0],r[1]))+'</mark>';p=r[1]});
  return out+esc(text.slice(p));
}
const hlHtml=(c,f)=>{
  const text=String((f==='q'?c.q:c.e)||'');
  if(!noteOk(c))return fmt(text);
  return `<span class="hlt" data-hf="${f}" data-hid="${esc(c.id)}">${hlInner(text,hlRanges(c,f,text))}</span>`;
};
function hlRefresh(id,f){
  const c=Store.qmap[id];if(!c)return;
  const text=String((f==='q'?c.q:c.e)||'');
  document.querySelectorAll('.hlt').forEach(el=>{if(el.dataset.hid===id&&el.dataset.hf===f)el.innerHTML=hlInner(text,hlRanges(c,f,text))});
}
function hlAdd(id,f,a,b){
  const c=Store.qmap[id];if(!c)return;
  const text=String((f==='q'?c.q:c.e)||'');
  const e=N.q[id]||(N.q[id]={}),h=e.h||(e.h={});e.s=c.s;const cur=(h[f]||[]).map(r=>[r[0],r[1],r[2]]);
  const keep=[];
  cur.forEach(r=>{if(r[1]<a||r[0]>b)keep.push(r);else{a=Math.min(a,r[0]);b=Math.max(b,r[1])}});
  keep.push([a,b,text.slice(a,b)]);
  if(keep.length>60)return toast('وصلت للحد الأقصى من التظليلات بهذا السؤال.');
  h[f]=keep;e.u=Date.now();touchN();hlRefresh(id,f);
}
function hlRemove(id,f,i){
  const e=N.q[id];if(!e||!e.h||!e.h[f])return;
  e.h[f].splice(i,1);e.u=Date.now();touchN();hlRefresh(id,f);
}
let hlSnap=null;
function hlUpdateBtn(){
  const rm=!!(hlPend&&hlPend.rm);
  document.querySelectorAll('.qtools [data-tb="hl"]').forEach(b=>{b.classList.toggle('on',!!hlPend);const l=b.querySelector('.l');if(l)l.textContent=rm?'إزالة':'تظليل'});
}
document.addEventListener('selectionchange',()=>{
  const sel=window.getSelection();
  const drop=()=>{if(hlPend&&!hlPend.rm){hlPend=null;hlUpdateBtn()}};
  if(!sel||sel.rangeCount===0||sel.isCollapsed||!sel.toString().trim()){drop();return}
  const rg=sel.getRangeAt(0);
  let n=rg.commonAncestorContainer;if(n&&n.nodeType!==1)n=n.parentElement;
  const box=n&&n.closest?n.closest('.hlt'):null;
  if(!box){drop();return}
  const r0=document.createRange();r0.selectNodeContents(box);r0.setEnd(rg.startContainer,rg.startOffset);
  let a=r0.toString().length,txt=rg.toString();
  const lead=txt.length-txt.replace(/^\s+/,'').length;a+=lead;txt=txt.trim();
  if(!txt)return;
  hlPend={rm:false,id:box.dataset.hid,f:box.dataset.hf,a:a,b:a+txt.length};
  hlUpdateBtn();
});
document.addEventListener('click',e=>{
  const t=e.target;if(!t||!t.closest)return;
  if(t.closest('.qtools'))return;
  const sel=window.getSelection();
  if(sel&&!sel.isCollapsed)return;
  const m=t.closest('mark.hl'),box=t.closest('.hlt');
  if(m&&box){hlPend={rm:true,id:box.dataset.hid,f:box.dataset.hf,i:+m.dataset.hi};hlUpdateBtn();return}
  if(hlPend){hlPend=null;hlUpdateBtn()}
});
function hlTool(id){
  const c=Store.qmap[id];if(!c)return;
  if(!noteOk(c)){noteModal(id);return}
  const p=hlSnap||hlPend;hlSnap=null;
  if(!p||p.id!==id){toast('حدّد جزءاً من السؤال أو الشرح، ثم اضغط تظليل.');return}
  if(p.rm)hlRemove(p.id,p.f,p.i);else hlAdd(p.id,p.f,p.a,p.b);
  hlPend=null;hlUpdateBtn();
  try{window.getSelection().removeAllRanges()}catch(e){}
}
/* شريط الأدوات تحت السؤال: إبلاغ، حفظ، تظليل، قلم */
const toolsHtml=c=>{
  const id=esc(c.id),on=!!S.starred[c.id],hasN=noteOk(c)&&!!noteGet(c.id);
  const b=(k,ico,lab,cls)=>`<button type="button" class="tb${cls?' on':''}" data-tb="${k}" data-id="${id}"><span class="i">${ico}</span><span class="l">${lab}</span></button>`;
  return `<div class="qtools" role="toolbar" aria-label="أدوات السؤال">${b('rep',ico('flag'),'إبلاغ',false)}${b('star',ico('star'),'حفظ',on)}${b('hl',ico('hl'),'تظليل',false)}${b('note',ico('note'),'ملاحظة',hasN)}${b('share',ico('share'),'مشاركة',false)}${b('disc',ico('chat')+ccBadge(c.id),'تعليقات',false)}</div>`;
};
function bindTools(){
  app.querySelectorAll('.qtools .tb').forEach(b=>{
    b.addEventListener('pointerdown',()=>{hlSnap=hlPend});
    b.addEventListener('mousedown',e=>e.preventDefault());
    b.onclick=()=>{
      const id=b.dataset.id,t=b.dataset.tb;
      if(t==='rep')reportModal(id);
      else if(t==='star')toggleStar(id);
      else if(t==='note')noteModal(id);
      else if(t==='hl')hlTool(id);
      else if(t==='share')shareQ(id);
      else if(t==='disc')discModal(id);
    };
  });
}
async function shareQ(id){
  const c=Store.qmap[id];if(!c)return;
  const url=((window.location&&location.origin)||'')+(((window.location&&location.pathname)||'').replace(/[^/]*$/,''));
  const text='سؤال من Boardcard\n\n'+c.q+'\n'+c.o.map((t,i)=>LET[i]+') '+t).join('\n')+'\n\nحلّ أسئلة البورد على المنصة: '+url;
  try{
    if(navigator.share){await navigator.share({text:text});return}
  }catch(e){if(e&&e.name==='AbortError')return}
  try{await navigator.clipboard.writeText(text);toast('تم نسخ السؤال مع رابط المنصة')}
  catch(e){showModal(`<button class="x" id="cl" aria-label="إغلاق">✕</button><h2>مشاركة السؤال</h2><textarea class="in" id="shx" dir="auto" readonly style="min-height:200px">${esc(text)}</textarea><p class="hint">حدد النص وانسخه.</p>`);$('cl').onclick=closeModal;const t=$('shx');if(t)t.select()}
}
const STAT_MIN=5,NOSTAT='لا توجد إحصائية حالياً.';
async function statModal(id){
  const c=Store.qmap[id],e=S.cards[id],now=Date.now();if(!c)return;
  let mine='';
  if(e&&e.rp){
    const R=e.sb&&e.lr?Math.round(100*fR(Math.max(0,(now-e.lr)/864e5),e.sb)):null;
    const nx=e.due>now?'بعد '+fmtIv((e.due-now)/864e5):'حان موعده الآن';
    const ago=e.lr?fmtIv(Math.max(0,(now-e.lr)/864e5)):'—';
    const rows=[['مرات المراجعة',ar(e.rp)],['مرات النسيان أو الخطأ',ar(e.lp||0)],['آخر تقييم',RLAB[e.g]||'—'],['آخر مراجعة','قبل '+ago],['موعد المراجعة القادمة',nx]];
    if(R!==null)rows.push(['احتمال تذكّرك له الآن',ar(R)+'%']);
    mine='<h3 class="sec" style="margin:14px 0 4px">إحصائيتك</h3>'+rows.map(r=>`<div class="setting" style="margin:8px 0"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('');
  }
  showModal(`<button class="x" id="cl" aria-label="إغلاق">✕</button><h2>إحصائية السؤال</h2><div id="stc"><p class="hint">جارٍ التحميل…</p></div><div id="stm">${mine}</div>`);
  $('cl').onclick=closeModal;
  let n=0,ok=0;
  try{const r=await sb.rpc('get_question_stats',{p_question:id});const d=r.data&&(Array.isArray(r.data)?r.data[0]:r.data);if(d){n=+d.n||0;ok=+d.ok||0}}catch(x){}
  const box=$('stc');if(!box)return;
  if(n>=STAT_MIN){
    box.innerHTML=`<h3 class="sec" style="margin:6px 0 4px">إحصائية الطلاب</h3><div class="setting" style="margin:8px 0"><span>نسبة من أجابوا صح</span><b>${ar(Math.round(100*ok/n))}%</b></div><div class="setting" style="margin:8px 0"><span>عدد الإجابات</span><b>${ar(n)}</b></div>`;
  }else if(!mine){
    box.innerHTML=`<p>${NOSTAT}</p>`;
  }else{
    box.innerHTML=`<h3 class="sec" style="margin:6px 0 4px">إحصائية الطلاب</h3><p class="hint">${NOSTAT}</p>`;
  }
}
/* الملاحظات */
function noteInner(c){
  const note=noteOk(c)?noteGet(c.id):'';
  return note?`<div class="ntbox" dir="${dirOf(note)}"><b>ملاحظتي</b>${fmt(note)}</div>`:'';
}
const noteHtml=c=>`<div class="nt" id="nt-${esc(c.id)}">${noteInner(c)}</div>`;
function noteModal(id){
  const c=Store.qmap[id];if(!c)return;
  if(!noteOk(c)){
    showModal(`<button class="x" id="cl" aria-label="إغلاق">✕</button><h2>ملاحظاتي وتظليلاتي</h2>
      <p>${Store.user&&Store.premium?'هذا السؤال ضمن اختصاص لست مشتركاً به.':'ميزة تسجيل الملاحظات وتظليل النصوص متاحة للمشتركين.'} تُحفظ ملاحظاتك الخاصة على كل سؤال وتظهر لك على أي جهاز.</p>
      <button class="btn block" id="nsub">${Store.user&&Store.premium?'طلب اشتراك باختصاص آخر':'اشترك لفتح الميزة'}</button>`);
    $('cl').onclick=closeModal;$('nsub').onclick=()=>{closeModal();paywall()};
    return;
  }
  showModal(`<button class="x" id="cl" aria-label="إغلاق">✕</button><h2>ملاحظتي</h2>
    <textarea class="in" id="ntx" dir="auto" maxlength="1500" style="min-height:150px" placeholder="اكتب ملاحظتك على هذا السؤال">${esc(noteGet(id))}</textarea>
    <div class="r2" style="margin-top:10px"><button class="btn" id="nts">حفظ</button><button class="btn line" id="ntd">حذف الملاحظة</button></div>`);
  $('cl').onclick=closeModal;
  const done=()=>{closeModal();const el=document.getElementById('nt-'+id);if(el)el.innerHTML=noteInner(c);document.querySelectorAll('.qtools [data-tb="note"]').forEach(b=>{if(b.dataset.id===id)b.classList.toggle('on',!!noteGet(id))})};
  $('nts').onclick=()=>{noteSet(id,$('ntx').value.trim());done()};
  $('ntd').onclick=()=>{noteSet(id,'');done()};
  $('ntx').focus();
}
/* ---------- رابط الإحالة والمكافآت ---------- */
async function referralModal(){
  showModal(`<button class="x" id="cl" aria-label="إغلاق">✕</button><h2>ادعُ زميلك</h2><p class="hint">جارٍ التحميل…</p>`);
  $('cl').onclick=closeModal;
  let d=null;
  try{const r=await sb.rpc('my_referral');d=r.data&&(Array.isArray(r.data)?r.data[0]:r.data)}catch(e){}
  if(!$('cl'))return;
  if(!d||!d.code){
    showModal(`<button class="x" id="cl" aria-label="إغلاق">✕</button><h2>ادعُ زميلك</h2><p class="err">تعذر تحميل كود الدعوة الآن. جرّب مرة ثانية.</p>`);
    $('cl').onclick=closeModal;return;
  }
  const url=((window.location&&location.origin)||'')+(((window.location&&location.pathname)||'').replace(/[^/]*$/,''));
  const amb=!!d.amb;
  const text=amb?'اشترك في Boardcard لأسئلة البورد الطبية بنظام المراجعة الذكي، واذكر كود سفير دفعتك '+d.code+' عند طلب الاشتراك لتحصل على خصم 30% على اشتراكك الأول مع 3 أيام مجانية.\n'+url:'اشترك في Boardcard لأسئلة البورد الطبية بنظام المراجعة الذكي، واذكر كود دعوتي '+d.code+' عند طلب الاشتراك لتحصل على 3 أيام مجانية إضافية.\n'+url;
  showModal(`<button class="x" id="cl" aria-label="إغلاق">✕</button><h2>ادعُ زميلك</h2>
    ${amb?'<div class="banner" style="background:var(--good-bg);color:var(--accent)">🎓 أنت سفير دفعة</div><p>كل زميل يشترك بكودك: <b>تحصل أنت على 10 أيام مجانية + 3,000 دينار</b>، <b>وهو يحصل على خصم 30%</b> على اشتراكه الأول (يطبقه الدعم عند الدفع) <b>مع 3 أيام مجانية</b>. تُضاف أيامك تلقائياً عند بدء اشتراكه، والنقد يُسلَّم لك من الدعم.</p>':'<p>كل زميل يشترك بكودك: <b>تحصل أنت على 7 أيام مجانية</b>، <b>وهو يحصل على 3 أيام</b>. تُضاف الأيام تلقائياً عند بدء اشتراكه، بدون حد.</p>'}
    <div class="fld"><span>كود دعوتك</span><div class="in" dir="ltr" style="text-align:center;font-family:ui-monospace,Menlo,monospace;font-size:26px;letter-spacing:3px;user-select:all">${esc(d.code)}</div></div>
    <a class="btn block wa-btn" id="refwa" href="https://wa.me/?text=${encodeURIComponent(text)}" target="_blank" rel="noopener">شارك عبر واتساب</a>
    <button class="btn line block" id="refcp" style="margin-top:8px">نسخ رسالة الدعوة</button>
    <div class="setting" style="margin-top:12px"><span>اشتراكات نجحت</span><b>${ar(d.rewarded)}</b></div>
    <div class="setting" style="margin:8px 0"><span>أيام حصلت عليها</span><b>${ar(d.days)}</b></div>
    ${d.pending?`<p class="hint">${ar(d.pending)} من المدعوين بانتظار بدء اشتراكهم.</p>`:''}
    <p class="hint">يجب على زميلك ذكر كودك عند طلب الاشتراك، ولا تُحتسب الدعوة إلا بعد أن يبدأ اشتراكه فعلاً.</p>
    ${amb?'':'<a class="btn line block" target="_blank" rel="noopener" href="'+ambLink()+'" style="margin-top:8px">🎓 تريد مكافأة أكبر؟ كن سفير دفعتك</a>'}`);
  $('cl').onclick=closeModal;
  $('refcp').onclick=async()=>{try{await navigator.clipboard.writeText(text);toast('تم نسخ رسالة الدعوة')}catch(e){toast('حدد الكود وانسخه يدوياً')}};
}
/* ---------- اختيار نوع المراجعة (يظهر بعد الضغط على ابدأ) ---------- */
function modeChooser(){
  const mc=modeCounts();
  const opts=[['smart','تلقائي','المستحق للمراجعة مع الأسئلة الجديدة',''],['new','جديدة','أسئلة لم تجب عنها من قبل',mc.new],['missed','الأخطاء','الأسئلة التي أخطأت بها وحان موعدها',mc.missed],['saved','المحفوظة','الأسئلة التي حفظتها بالنجمة وحان موعدها',mc.saved],['custom','اختبار مخصص','اختر المواد والأنظمة والعدد، وأخطائي فقط أو غير المحلولة','']];
  showModal(`<button class="x" id="mcx" aria-label="إغلاق">✕</button><h2>ماذا تريد أن تراجع؟</h2>
    ${opts.map(([v,t,d,n])=>`<button class="btn${v==='smart'?'':' line'} block" data-mc="${v}"${(v==='missed'||v==='saved')&&n===0?' disabled':''} style="margin-top:8px;text-align:start;display:flex;justify-content:space-between;align-items:center;gap:10px"><span><b>${t}</b><br><small style="opacity:.75">${d}</small></span>${n!==''?`<b>${ar(n)}</b>`:''}</button>`).join('')}`);
  $('mcx').onclick=closeModal;
  modal.querySelectorAll('[data-mc]').forEach(b=>b.onclick=()=>{const m=b.dataset.mc;closeModal();if(m==='custom'){customTest();return}start(F.sj||null,F.sp,undefined,{mode:m})});
}
/* ---------- تحدي اليوم: 5 أسئلة ثابتة لكل اختصاص، نفسها لكل الطلاب ---------- */
const DQ_N=5,DQ_MIN=5,DQ_SLOW=45;
let D=null,dqBusy=false;
const dqDay=()=>new Date(Date.now()+3*36e5).toISOString().slice(0,10);   // اليوم بتوقيت العراق ليكون موحداً للجميع
const dqSqr=g=>g==='g'?'🟩':g==='y'?'🟨':'🟥';
const dqDate=d=>{const p=d.split('-');return ar(+p[2])+'/'+ar(+p[1])};
const dqOk=sp=>!!sp&&sp!=='_none'&&Store.counts.filter(g=>qSp(g)===sp).reduce((t,g)=>t+g.n,0)>=DQ_MIN;
const dqLeft=()=>864e5-((Date.now()+3*36e5)%864e5);
function dqUrl(sp){return ((window.location&&location.origin)||'')+(((window.location&&location.pathname)||'').replace(/[^/]*$/,''))+'#dq-'+sp}
function dqHash(str){let h=2166136261>>>0;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)>>>0}h^=h>>>13;h=Math.imul(h,0x5bd1e995)>>>0;h^=h>>>15;return h>>>0}
// احتياطي إذا لم تُضف دالة السيرفر: يسحب من الأسئلة المجانية فقط، بترتيب ثابت يعتمد على التاريخ والاختصاص
function dqPick(sp,day){
  const pool=Object.values(Store.qmap).filter(c=>c.free&&qSp(c)===sp&&Array.isArray(c.o)&&c.o.length>1);
  if(pool.length<DQ_MIN)return null;
  const ranked=pool.map(c=>({c:c,h:dqHash(day+'|'+sp+'|'+c.id)})).sort((a,b)=>a.h-b.h||String(a.c.id).localeCompare(String(b.c.id)));
  const out=[],used={};
  ranked.forEach(r=>{if(out.length<DQ_N&&!used[r.c.s]){used[r.c.s]=1;out.push(r.c)}});
  ranked.forEach(r=>{if(out.length<DQ_N&&!out.includes(r.c))out.push(r.c)});
  return out;
}
// أسئلة تحدي اليوم يحددها السيرفر (واليوم بتوقيته هو)، وتصل بدون أجوبة
async function dqLoad(sp){
  try{
    const r=await sb.rpc('dq_get',{p_sp:sp});
    const d=r.data;
    if(!r.error&&d&&Array.isArray(d.questions)&&d.questions.length>=DQ_MIN)return {day:d.day||null,qs:d.questions.slice(0,DQ_N).map(memQ)};
  }catch(e){}
  return null;
}
function dqStreak(){
  const done={};Object.keys(S.dq||{}).forEach(k=>{if(S.dq[k]&&S.dq[k].done)done[k.split('|')[0]]=1});
  const kk=x=>x.toISOString().slice(0,10);
  let d=new Date(Date.now()+3*36e5),n=0;
  if(!done[kk(d)])d=new Date(d.getTime()-864e5);
  while(done[kk(d)]){n++;d=new Date(d.getTime()-864e5)}
  return n;
}
function dqSpecs(){
  if(F.sj)return [];
  if(F.sp)return dqOk(F.sp)?[F.sp]:[];
  return Object.keys(Store.subs).filter(dqOk);
}
function dqCard(sp){
  const day=dqDay(),e=sp&&S.dq&&S.dq[day+'|'+sp],st=dqStreak();
  const done=!!(e&&e.done),part=e&&!e.done&&e.r?e.r.length:0;
  let line,small;
  if(done){const ok=e.r.filter(g=>g!=='r').length;line=e.r.map(dqSqr).join('')+' '+ar(ok)+'/'+ar(e.r.length);small='اضغط لمشاركة نتيجتك'}
  else if(part){line='أكمل تحديك: '+ar(part)+' من '+ar(DQ_N);small='تحدٍّ واحد في اليوم'}
  else{line=ar(DQ_N)+' أسئلة، نفسها لكل الطلاب';small=sp?'تحدٍّ خاص بهذا الاختصاص':'اختر اختصاصك وابدأ'}
  if(st>=2)small+=' · 🔥 '+ar(st)+' أيام'+(done?'':' متتالية');
  return `<div class="dq" data-dq="${esc(sp)}" role="button" tabindex="0" aria-label="تحدي اليوم"><div class="dqi">🎯</div><div class="gt"><b>تحدي اليوم${sp?' · '+esc(spById(sp).n):''}</b><span>${line}</span><small>${small}</small></div><span class="pill">${done?'شارك':'ابدأ'}</span></div>`;
}
function dqHtml(){
  const sps=dqSpecs();
  if(sps.length)return sps.map(dqCard).join('');
  if(!F.sp&&!F.sj&&spList().some(p=>dqOk(p.id)))return dqCard('');
  return '';
}
function dqChooser(){
  const day=dqDay(),list=spList().filter(p=>dqOk(p.id));
  if(!list.length){toast('لا يوجد تحدٍّ متاح حالياً.');return}
  if(list.length===1){dqStart(list[0].id);return}
  showModal(`<button class="x" id="cl" aria-label="إغلاق">✕</button><h2>تحدي اليوم 🎯</h2><p class="hint">اختر اختصاصك. لكل اختصاص تحدٍّ مختلف كل يوم.</p>`+
    list.map(p=>{const e=S.dq&&S.dq[day+'|'+p.id];return `<button class="btn line block" data-dqp="${esc(p.id)}" style="margin-top:8px;display:flex;justify-content:space-between;align-items:center;gap:10px"><b>${esc(p.n)}</b><span>${e&&e.done?e.r.map(dqSqr).join(''):'ابدأ'}</span></button>`}).join(''));
  $('cl').onclick=closeModal;
  modal.querySelectorAll('[data-dqp]').forEach(b=>b.onclick=()=>{const id=b.dataset.dqp;closeModal();dqStart(id)});
}
function dqDeep(){
  let h='';try{h=location.hash||''}catch(e){}
  if(!/^#(dq|ch-|pt-|live-)/.test(h))return false;
  try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}
  let m;
  if(m=/^#ch-([A-Za-z0-9]+)$/.exec(h)){chOpen(m[1],false);return true}
  if(m=/^#pt-([A-Za-z0-9]+)$/.exec(h)){ptDeep(m[1],true);return true}
  if(m=/^#live-(.+)$/.exec(h)){let id='';try{id=decodeURIComponent(m[1])}catch(e){}if(dqOk(id)){liveScreen(id);return true}return false}
  m=/^#dq(?:-(.+))?$/.exec(h);if(!m)return false;
  let id='';try{id=m[1]?decodeURIComponent(m[1]):''}catch(e){}
  if(id&&dqOk(id)){dqStart(id);return true}
  dqChooser();return true;
}
async function dqStart(sp){
  if(dqBusy)return;
  let day=dqDay(),e=S.dq&&S.dq[day+'|'+sp];
  if(e&&e.done){dqResult(sp,day);return}
  dqBusy=true;closeModal();stopTimer();
  app.innerHTML=`<div class="top"><div class="brand">${brandHtml()}</div></div><p class="empty">جارٍ تحميل تحدي اليوم…</p>`;
  let ld=null;
  try{ld=await dqLoad(sp)}catch(x){}
  dqBusy=false;
  const qs=ld&&ld.qs;
  if(!qs||qs.length<DQ_MIN){toast('تحدي هذا الاختصاص غير متوفر حالياً.');home();return}
  if(ld.day&&ld.day!==day){day=ld.day;e=S.dq&&S.dq[day+'|'+sp];if(e&&e.done){dqResult(sp,day);return}}   // ساعة الجهاز تختلف عن توقيت العراق
  const r=e&&e.r?e.r.slice():[];
  D={kind:'dq',label:'🎯 تحدي اليوم',done:dqFinish,sp:sp,day:day,qs:qs,i:r.length,r:r,s:e&&e.s?e.s.slice():[]};
  if(D.i>=qs.length){dqFinish();return}
  dqShow();
}
function dqShow(){
  view='dq';stopTimer();liveMark(false);
  const c=D.qs[D.i],n=D.qs.length;cur=c;answered=false;D.qT=Date.now();
  const sub=subjOf(c.s);
  app.innerHTML=`
  <div class="sbar"><button class="back" id="dqx" aria-label="رجوع"><span>تراجع</span><span class="ba">${ico('chev')}</span></button>
    <div class="prog"><div class="bar"><i style="width:${Math.round(100*D.i/n)}%"></i></div></div>
    <span class="pill"><bdi dir="ltr">${ar(D.i+1)} / ${ar(n)}</bdi></span></div>
  <div class="scene" style="--sc:${safeC(sub.c)}"><div class="card"><section class="face front" aria-label="السؤال">
    <div class="tags"><span class="tag s">${esc(D.label||'🎯 تحدي اليوم')}</span><span class="tag">${esc(sub.n)}</span></div>
    <p class="q" dir="${dirOf(c.q)}">${fmt(c.q)}</p>${imgHtml(c)}${optsHtml('front')}${aiPreHtml(c)}
  </section></div></div>`;
  bindAiPre(c);
  $('dqx').onclick=home;
  app.querySelectorAll('.opt').forEach(b=>b.onclick=()=>dqAns(+b.dataset.i));
  window.scrollTo(0,0);
}
const dqExp=(c,acc)=>acc?expHtml():(c.e?`<div class="exp" dir="${dirOf(c.e)}"><b>الشرح</b>${fmt(c.e)}</div>`:'');
async function dqAns(i){
  if(answered||revBusy)return;
  const c=D.qs[D.i],d0=D;cur=c;
  const sec=Math.min(180,Math.round((Date.now()-D.qT)/1000)),first=!S.cards[c.id];
  const btn=app.querySelectorAll('.opt')[i];
  revBusy=true;if(btn)btn.classList.add('sel','wait');revLoading(true);
  try{await qReveal(c,i,first,D.kind==='ch'?'ch:'+D.cid:'dq')}
  catch(e){
    revBusy=false;revLoading(false);
    if(isKick(e)||D!==d0||cur!==c||view!=='dq')return;
    if(btn)btn.classList.remove('sel','wait');
    toast(revMsg(e));
    return;
  }
  revBusy=false;
  if(D!==d0||cur!==c||view!=='dq')return;   // غادر الطالب السؤال أثناء انتظار الجواب
  answered=true;
  const ok=i===c.a;
  D.r.push(ok?(sec>DQ_SLOW?'y':'g'):'r');D.s.push(sec);(D.pa||(D.pa=[])).push(i);
  ChF={id:c.id,first:first,opt:i};
  dqRecord(c,ok,sec);if(D.kind==='dq')dqSave(false);
  const last=D.i+1>=D.qs.length,acc=canQ(c),face=app.querySelector('.face');
  if(acc&&!Store.qmap[c.id])Store.qmap[c.id]=c;   // لتعمل أدوات السؤال (حفظ، ملاحظة، إبلاغ، شرح)
  face.innerHTML=tagsHtml(1)+`<p class="q" dir="${dirOf(c.q)}">${acc?hlHtml(c,'q'):fmt(c.q)}</p>${imgHtml(c)}`+(acc?toolsHtml(c):'')+
    `<p class="res ${ok?'ok':'no'}">${ok?'جوابك صحيح':'الجواب خاطئ'}</p>`+optsHtml('back',i)+dqExp(c,acc)+
    `<button class="btn block" id="dqn">${last?'عرض النتيجة':'السؤال التالي'}</button>`;
  bindStars();bindAi();bindTools();bindReports();choiceFill(c);
  window.scrollTo(0,0);
  $('dqn').onclick=()=>{D.i++;last?D.done():dqShow()};
  $('dqn').focus({preventScroll:true});
}
function dqRecord(c,ok,sec){
  const now=Date.now();
  const st=fsrsApply(Object.assign({},S.cards[c.id]||{}),ok?(sec>DQ_SLOW?2:3):1,now);
  st.s=c.s;st.sy=c.sy||null;st.ex=c.ex;
  addStat(c,ok,sec);
  S.cards[c.id]=st;
  S.log.push({t:now,ok:ok});if(S.log.length>300)S.log=S.log.slice(-300);
  save();
}
function dqSave(done){
  if(!S.dq)S.dq={};
  S.dq[D.day+'|'+D.sp]={r:D.r.slice(),s:D.s.slice(),t:Date.now(),done:done?1:0};
  const ks=Object.keys(S.dq).sort();if(ks.length>120)ks.slice(0,ks.length-120).forEach(k=>{delete S.dq[k]});
  save();
}
function dqFinish(){dqSave(true);dqResult(D.sp,D.day)}
function dqResult(sp,day){
  view='dqres';stopTimer();liveMark(false);
  const e=S.dq&&S.dq[day+'|'+sp];if(!e||!e.r){home();return}
  const spn=spById(sp).n,n=e.r.length,ok=e.r.filter(g=>g!=='r').length,sec=e.s.reduce((t,x)=>t+x,0);
  const sq=e.r.map(dqSqr).join(''),st=dqStreak(),url=dqUrl(sp);
  const body='Boardcard 🎯 تحدي '+spn+'\n'+dqDate(day)+'\n'+sq+'\n'+ar(ok)+'/'+ar(n)+' ⏱ '+ar(mmss(sec))+(st>=2?'\n🔥 '+ar(st)+' أيام متتالية':'');
  const txt=body+'\n'+url;
  const subd=!!(Store.user&&Store.subs[sp]);
  app.innerHTML=`
  <div class="top"><div class="brand">تحدي اليوم<small>${esc(spn)}</small></div><button class="pill" id="dqh">رجوع</button></div>
  <div class="sum">
    <div class="dqsq" aria-label="نتيجة التحدي">${sq}</div>
    <div class="big"><bdi dir="ltr">${ar(ok)} / ${ar(n)}</bdi></div>
    <p>الوقت ${fmtT(sec)}${st>=2?'، وسلسلتك ' + ar(st) + ' أيام متتالية في التحدي 🔥':''}</p>
    <div class="dqtext" dir="auto">${esc(txt)}</div>
    <div class="r2"><button class="btn" id="dqsh">مشاركة</button><button class="btn line" id="dqcp">نسخ</button></div>
    <div class="r2" style="margin-top:8px"><button class="btn line" id="dqwa">واتساب</button><button class="btn line" id="dqtg">تيليجرام</button></div>
    <p class="hint" style="margin-top:12px">🟩 صحيحة، 🟨 صحيحة بعد تردد، 🟥 خاطئة. النتيجة لا تكشف الأسئلة ولا الأجوبة.<br>التحدي القادم بعد ${fmtIv(dqLeft()/864e5)}.</p>
    ${subd?'':'<button class="btn block" id="dqsub" style="margin-top:8px">اشترك لفتح بقية أسئلة '+esc(spn)+'</button>'}
  </div>`;
  $('dqh').onclick=home;
  const sb2=$('dqsub');if(sb2)sb2.onclick=paywall;
  $('dqsh').onclick=async()=>{
    try{if(navigator.share){await navigator.share({text:txt});return}}catch(x){if(x&&x.name==='AbortError')return}
    dqCopy(txt);
  };
  $('dqcp').onclick=()=>dqCopy(txt);
  $('dqwa').onclick=()=>window.open('https://wa.me/?text='+encodeURIComponent(txt),'_blank','noopener');
  $('dqtg').onclick=()=>window.open('https://t.me/share/url?url='+encodeURIComponent(url)+'&text='+encodeURIComponent(body),'_blank','noopener');
  window.scrollTo(0,0);
}
async function dqCopy(txt){
  try{await navigator.clipboard.writeText(txt);toast('تم نسخ النتيجة، الصقها في الكروب');return}catch(e){}
  showModal(`<button class="x" id="cl" aria-label="إغلاق">✕</button><h2>انسخ النتيجة</h2><textarea class="in" id="dqta" dir="auto" readonly style="min-height:160px">${esc(txt)}</textarea>`);
  $('cl').onclick=closeModal;const t=$('dqta');if(t){t.focus();t.select()}
}
/* ======== ميزات اجتماعية: تحدي زميل، امتحان حي، شريك مذاكرة، دوريات، خريطة الإتقان، موعد الامتحان، ملخص الشهر ======== */
const rpc=(n,a)=>sb.rpc(n,a);
const pkey=()=>{let k=lsGet('bc_pk');if(!k){k=Math.random().toString(36).slice(2)+Date.now().toString(36);lsSet('bc_pk',k)}return k};
const loadingScreen=m=>{app.innerHTML=`<div class="top"><div class="brand">${brandHtml()}</div></div><p class="empty">${m}</p>`};
const cdTxt=ms=>{const t=Math.max(0,Math.floor(ms/1000)),d=Math.floor(t/86400),h=Math.floor(t%86400/3600),m=Math.floor(t%3600/60);return (d?ar(d)+' يوم ':'')+ar(pad2(h)+':'+pad2(m)+':'+pad2(t%60))};
const dataRow=d=>Array.isArray(d)?d[0]:d;
const kb=f=>e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();f()}};
const baseUrl=()=>((window.location&&location.origin)||'')+(((window.location&&location.pathname)||'').replace(/[^/]*$/,''));
function pickSpec(title,list,cb){
  if(!list.length)return false;
  if(list.length===1){cb(list[0]);return true}
  showModal(`<button class="x" id="cl" aria-label="إغلاق">✕</button><h2>${esc(title)}</h2>`+list.map(id=>`<button class="btn line block" data-pk="${esc(id)}" style="margin-top:8px"><b>${esc(spById(id).n)}</b></button>`).join(''));
  $('cl').onclick=closeModal;
  modal.querySelectorAll('[data-pk]').forEach(b=>b.onclick=()=>{const id=b.dataset.pk;closeModal();cb(id)});
  return true;
}
const shareRow=id=>`<div class="r2" style="margin-top:8px"><button class="btn" id="${id}sh">مشاركة</button><button class="btn line" id="${id}wa">واتساب</button><button class="btn line" id="${id}tg">تيليجرام</button></div>`;
function bindShareRow(id,txt,url,body){
  $(id+'sh').onclick=async()=>{try{if(navigator.share){await navigator.share({text:txt});return}}catch(x){if(x&&x.name==='AbortError')return}dqCopy(txt)};
  $(id+'wa').onclick=()=>window.open('https://wa.me/?text='+encodeURIComponent(txt),'_blank','noopener');
  $(id+'tg').onclick=()=>window.open('https://t.me/share/url?url='+encodeURIComponent(url)+'&text='+encodeURIComponent(body),'_blank','noopener');
}
const msgOf=(e,map)=>{const m=(e&&e.message)||'';for(const k of Object.keys(map))if(m.indexOf(k)>=0)return map[k];return 'تعذر تنفيذ العملية. جرب مرة ثانية.'};

/* ---------- تحدي زميل (1 ضد 1، والزميل يلعب بدون حساب) ---------- */
function chStart(){
  if(!Store.user){toast('ميزة تحدي الزميل لمشتركي Boardcard. سجّل دخولك بحسابك.');return}
  const list=F.sp&&Store.subs[F.sp]?[F.sp]:Object.keys(Store.subs);
  if(!pickSpec('اختر اختصاص التحدي ⚔️',list,chMake))toast('ميزة التحدي متاحة للمشتركين.');
}
async function chMake(sp){
  loadingScreen('جارٍ تجهيز التحدي…');
  let r;try{r=await rpc('ch_create',{p_sp:sp,p_name:''})}catch(e){r={error:{}}}
  if(r.error||!r.data){toast(msgOf(r.error,{limit:'وصلت للحد اليومي من التحديات.',not_enough:'لا توجد أسئلة كافية لهذا الاختصاص.'}));home();return}
  chOpen(r.data,true);
}
async function chOpen(id,mine){
  stopTimer();loadingScreen('جارٍ تحميل التحدي…');
  let r;try{r=await rpc('ch_get',{p_id:id})}catch(e){r={error:{}}}
  const ch=r.data;
  if(r.error||!ch||!ch.questions||!ch.questions.length){toast('رابط التحدي غير صالح.');home();return}
  if(lsGet('bc_ch_'+ch.id)){chResult(ch);return}
  view='chintro';
  const spn=spById(ch.sp).n,best=(ch.results||[])[0],n=ch.questions.length;
  app.innerHTML=`<div class="top"><div class="brand">⚔️ تحدي زميل<small>${esc(spn)}</small></div><button class="pill" id="chh">رجوع</button></div>
  <div class="sum"><div class="big">⚔️</div>
  <p>${mine?'جهّز نفسك! حل الأسئلة ال'+ar(n)+' أولاً، ثم أرسل الرابط لزملائك ليتفوقوا عليك. زميلك يلعب بدون حساب.':'<b>'+esc(ch.creator_name)+'</b> تحداك بـ'+ar(n)+' أسئلة في '+esc(spn)+'.'+(best?' أعلى نتيجة حتى الآن: '+esc(best.name)+' '+ar(best.score)+'/'+ar(best.n)+'.':'')+' هل تقدر تتفوق عليه؟'}</p>
  ${Store.user?'':`<label class="fld"><span>اسمك</span><input class="in" id="chn" maxlength="20" dir="auto" value="${esc(lsGet('bc_pname')||'')}"></label>`}
  <button class="btn block" id="chgo">ابدأ التحدي</button></div>`;
  $('chh').onclick=home;
  $('chgo').onclick=()=>{
    let nm='';
    if(!Store.user){nm=($('chn').value||'').trim();if(nm.length<2){toast('اكتب اسمك (حرفان على الأقل).');return}lsSet('bc_pname',nm)}
    D={kind:'ch',label:'⚔️ تحدي زميل',sp:ch.sp,day:'',qs:ch.questions.map(memQ),cid:ch.id,i:0,r:[],s:[],pa:[],done:()=>chFinish(ch,nm)};
    dqShow();
  };
}
async function chFinish(ch,nm){
  const score=D.r.filter(g=>g!=='r').length,secs=D.s.reduce((t,x)=>t+x,0);
  lsSet('bc_ch_'+ch.id,JSON.stringify({score:score,secs:secs,name:nm||(Store.profile&&Store.profile.full_name?String(Store.profile.full_name).trim().split(' ')[0].slice(0,20):'')}));
  loadingScreen('جارٍ حفظ نتيجتك…');
  try{await rpc('ch_submit',{p_id:ch.id,p_player:pkey(),p_name:nm||'',p_answers:(D&&D.pa)||[],p_secs:secs})}catch(e){}
  ptFlush();
  chOpen(ch.id,false);
}
function chResult(ch){
  view='chres';stopTimer();
  let my={};try{my=JSON.parse(lsGet('bc_ch_'+ch.id)||'{}')||{}}catch(e){}
  const spn=spById(ch.sp).n,n=ch.questions.length,rows=ch.results||[];
  const isMe=r=>r.score===my.score&&r.secs===my.secs&&(!my.name||r.name===my.name);
  const cr=rows.find(r=>r.name===ch.creator_name&&!isMe(r))||rows.find(r=>!isMe(r));
  const url=baseUrl()+'#ch-'+ch.id;
  const body='⚔️ تحدّيتك في '+spn+' على Boardcard!\nحصلت على '+ar(my.score||0)+'/'+ar(n)+' خلال '+fmtT(my.secs||0)+'\nهل تقدر تتفوق عليّ؟';
  const verdict=cr?(my.score>cr.score?'🎉 تفوقت عليه!':my.score===cr.score?'تعادلتما، والوقت يحسم!':'قريب! جرب تحدياً آخر.'):'';
  app.innerHTML=`<div class="top"><div class="brand">⚔️ نتيجة التحدي<small>${esc(spn)}</small></div><button class="pill" id="chh">رجوع</button></div>
  <div class="sum"><div class="big"><bdi dir="ltr">${ar(my.score||0)} / ${ar(n)}</bdi></div>
  ${cr?`<p><b>${esc(cr.name)} ${ar(cr.score)}، أنت ${ar(my.score||0)}</b><br>${verdict}</p>`:'<p>أرسل الرابط لزملائك. حين يلعبون تظهر نتائجهم هنا.</p>'}
  ${rows.map((r,i)=>`<div class="item lbr${isMe(r)?' me':''}" style="--sc:${i===0?'#E0A100':'#5A6B77'}"><b class="rk">${ar(i+1)}</b><div class="grow"><div class="nm" dir="auto">${esc(r.name)}${isMe(r)?' (أنت)':''}</div><div class="sub">${fmtT(r.secs)}</div></div><b>${ar(r.score)}/${ar(r.n)}</b></div>`).join('')}
  ${shareRow('ch')}
  <button class="btn line block" id="chrf" style="margin-top:8px">تحديث النتائج</button>
  ${Store.user?'':'<button class="btn block" id="chtry" style="margin-top:8px">جرّب تحدي اليوم مجاناً</button>'}
  </div>`;
  $('chh').onclick=home;$('chrf').onclick=()=>chOpen(ch.id,false);
  const tr=$('chtry');if(tr)tr.onclick=()=>{home();dqChooser()};
  bindShareRow('ch',body+'\n'+url,url,body);
}

/* ---------- الامتحان الحي كل جمعة 8 مساءً (بتوقيت العراق) ---------- */
const LV={};
let LR=null,liveTick=null;
async function liveLoad(sp,force){
  const c=LV[sp];if(!force&&c&&Date.now()-c.at<60000)return c.info;
  try{const r=await rpc('live_info',{p_sp:sp,p_player:Store.user?null:pkey()});LV[sp]={info:r.data||null,at:Date.now(),off:r.data?Date.parse(r.data.now)-Date.now():0}}
  catch(e){LV[sp]={info:null,at:Date.now(),off:0}}
  return LV[sp].info;
}
const lvNow=sp=>Date.now()+((LV[sp]&&LV[sp].off)||0);
function liveCard(sp){
  const c=LV[sp],i=c&&c.info;if(!i)return '';
  const now=lvNow(sp),st=Date.parse(i.starts_at),je=st+i.join_mins*6e4;
  if(!F.sp&&!(now>=st-48*36e5&&now<st+4*36e5))return '';
  let line,btn;
  if(i.done){line='أنهيت الامتحان ✓';btn='النتيجة'}
  else if(i.begun&&now<je+i.minutes*6e4){line='امتحانك جارٍ، أكمله';btn='أكمل'}
  else if(now<st){line='يبدأ بعد '+fmtIv((st-now)/864e5)+' · الجمعة 8 مساءً';btn='تفاصيل'}
  else if(now<=je){line='بدأ الآن! ادخل قبل أن يُغلق الباب';btn='ادخل'}
  else{line='انتهى هذا الأسبوع. التالي الجمعة القادمة';btn='النتائج'}
  return `<div class="dq" data-lv="${esc(sp)}" role="button" tabindex="0"><div class="dqi">🔴</div><div class="gt"><b>امتحان الجمعة الحي · ${esc(spById(sp).n)}</b><span>${line}</span><small>${ar(i.n)} سؤالاً، ${ar(i.minutes)} دقيقة، ${ar(i.participants)} مشارك</small></div><span class="pill">${btn}</span></div>`;
}
function liveHtml(){
  if(F.sj)return '';
  const sps=F.sp?(Store.subs[F.sp]&&dqOk(F.sp)?[F.sp]:[]):Object.keys(Store.subs).filter(dqOk);
  if(sps.length)return sps.map(liveCard).join('');
  if(!F.sp&&!Store.user){const dw=new Date(Date.now()+3*36e5).getUTCDay();
    if(dw>=3&&dw<=5&&spList().some(p=>dqOk(p.id)))return `<div class="dq" data-lv="" role="button" tabindex="0"><div class="dqi">🔴</div><div class="gt"><b>امتحان الجمعة الحي</b><span>الجمعة 8 مساءً، الكل بنفس الوقت</span><small>مشاركتك الأولى مجانية</small></div><span class="pill">شارك</span></div>`}
  return '';
}
async function liveScreen(sp){
  view='live';stopTimer();clearInterval(liveTick);loadingScreen('جارٍ التحميل…');
  const info=await liveLoad(sp,true);
  if(!info){toast('لا يوجد امتحان حي لهذا الاختصاص حالياً.');home();return}
  renderLive(sp);
}
function renderLive(sp){
  view='live';clearInterval(liveTick);
  const i=LV[sp].info,now=lvNow(sp),st=Date.parse(i.starts_at),je=st+i.join_mins*6e4,spn=spById(sp).n;
  const head=`<div class="top"><div class="brand">🔴 امتحان الجمعة الحي<small>${esc(spn)}</small></div><button class="pill" id="lvb">رجوع</button></div>`;
  const rules=`<p class="hint">${ar(i.n)} سؤالاً، مدتها ${ar(i.minutes)} دقيقة. الدخول متاح ${ar(i.join_mins)} دقيقة من لحظة البدء، والكل بنفس الأسئلة والوقت. النتيجة والأجوبة والترتيب تظهر بعد انتهاء الامتحان للجميع.</p>`;
  const nameBox=Store.user?'':`<label class="fld"><span>اسمك في الترتيب</span><input class="in" id="lvn" maxlength="20" dir="auto" value="${esc(lsGet('bc_pname')||'')}"></label>`;
  let body='',after=null;
  const ea=i.ends_at?Date.parse(i.ends_at):je+(i.minutes+1)*6e4;
  if(i.done){
    if(now>=ea){body='<p>أنهيت هذا الامتحان.</p><button class="btn block" id="lvmine">عرض نتيجتي وأجوبتي</button><div id="lvboard" style="margin-top:10px"><p class="hint">جارٍ التحميل…</p></div>';after='board'}
    else{body='<p>أنهيت هذا الامتحان ✓</p><p class="hint">النتيجة والأجوبة والترتيب تظهر بعد انتهاء الامتحان لجميع المشاركين (بعد '+cdTxt(ea-now)+').</p>'}
  }
  else if(i.begun&&now<je+i.minutes*6e4){body=`<p>لديك امتحان قيد التنفيذ.</p><button class="btn block" id="lvgo">أكمل الامتحان</button>`}
  else if(now<st){body=`<div class="big" style="font-size:40px" id="lvcd">${cdTxt(st-now)}</div><p>يبدأ الجمعة 8 مساءً بتوقيت العراق</p>${rules}${Store.subs[sp]?'':'<p class="hint">مشاركتك الأولى مجانية، ثم يلزم اشتراك الاختصاص.</p>'}`;after='tick'}
  else if(now<=je){body=`<p>بدأ الامتحان! الباب يُغلق بعد <b id="lvcd">${cdTxt(je-now)}</b></p>${rules}${nameBox}<button class="btn block" id="lvgo">ابدأ الامتحان</button>`;after='tick'}
  else if(now<ea){body='<p>أُغلق باب الدخول، والامتحان ما زال جارياً لبعض المشاركين. تظهر النتائج والترتيب بعد انتهائه.</p>'}
  else{body='<p>انتهى امتحان هذا الأسبوع. الامتحان القادم الجمعة القادمة 8 مساءً.</p><div id="lvboard"><p class="hint">جارٍ تحميل النتائج…</p></div>';after='board'}
  app.innerHTML=head+`<div class="sum">${body}</div>`;
  $('lvb').onclick=home;
  const lm=$('lvmine');if(lm)lm.onclick=()=>liveMine(sp);
  const go=$('lvgo');if(go)go.onclick=()=>{let nm='';if(!Store.user){nm=($('lvn')?$('lvn').value:lsGet('bc_pname')||'').trim();if(!i.begun&&nm.length<2){toast('اكتب اسمك (حرفان على الأقل).');return}if(nm)lsSet('bc_pname',nm)}liveGo(sp,nm)};
  if(after==='board')liveBoard(sp,i.id,'lvboard');
  if(after==='tick'){const target=now<st?st:je;liveTick=setInterval(()=>{const el=$('lvcd');if(!el||view!=='live'){clearInterval(liveTick);return}const left=target-lvNow(sp);if(left<=0){clearInterval(liveTick);liveLoad(sp,true).then(()=>{if(view==='live')renderLive(sp)});return}el.textContent=cdTxt(left)},1000)}
}
async function liveBoard(sp,id,boxId,mine){
  let r;try{r=await rpc('live_board',{p_id:id,p_player:Store.user?null:pkey()})}catch(e){r={error:{}}}
  const box=$(boxId);if(!box)return;
  const d=r.data;
  if(d&&d.pending){box.innerHTML='<p class="hint">الترتيب يظهر بعد انتهاء الامتحان للجميع.</p>';return}
  if(r.error||!d){box.innerHTML='<p class="hint">تعذر تحميل الترتيب.</p>';return}
  const rows=d.rows||[],my=d.my;
  box.innerHTML=(my?`<p><b>ترتيبك ${ar(my.rnk)} من ${ar(d.total)}</b>${d.total>1?'، أفضل من '+ar(Math.round(100*(d.total-my.rnk)/d.total))+'% من المشاركين':''}</p>`:'')+
    (rows.length?rows.map(x=>`<div class="item lbr${x.me?' me':''}" style="--sc:${x.rnk<=3?['#E0A100','#9AA7B4','#B9783A'][x.rnk-1]:'#5A6B77'}"><b class="rk">${ar(x.rnk)}</b><div class="grow"><div class="nm" dir="auto">${esc(x.name)}${x.me?' (أنت)':''}</div><div class="sub">${fmtT(x.secs)}</div></div><b>${ar(x.score)}</b></div>`).join(''):'<p class="hint">لا توجد نتائج بعد.</p>')+
    '<button class="btn line block" id="lvrf" style="margin-top:8px">تحديث الترتيب</button>';
  const rf=$('lvrf');if(rf)rf.onclick=()=>liveBoard(sp,id,boxId,mine);
  if(mine)mine(my,d.total);
}
async function liveGo(sp,nm){
  const i=LV[sp].info;loadingScreen('جارٍ تجهيز الامتحان…');
  let r;try{r=await rpc('live_start',{p_id:i.id,p_player:pkey(),p_name:nm||''})}catch(e){r={error:{}}}
  if(r.error||!r.data){
    const m=(r.error&&r.error.message)||'';
    if(/subscribers_only/.test(m)){await liveLoad(sp,true);renderLive(sp);subscribeModal('استعملت مشاركتك المجانية. اشترك لتشارك في كل امتحانات الجمعة.');return}
    toast(msgOf(r.error,{closed:'أُغلق باب الدخول لهذا الأسبوع.',already_done:'شاركت بهذا الامتحان مسبقاً.',not_open:'لم يبدأ الامتحان بعد.',expired:'انتهى وقت امتحانك.'}));
    await liveLoad(sp,true);renderLive(sp);return;
  }
  const d=r.data,off=Date.parse(d.now)-Date.now();
  let ans=[];try{ans=JSON.parse(lsGet('bc_lv_'+i.id)||'[]')||[]}catch(e){}
  LR={sp:sp,i:i,qs:d.questions,ans:ans,k:0,end:Date.parse(d.begun_at)+d.minutes*6e4-off};
  liveShow();
}
function liveShow(){
  view='liverun';stopTimer();clearInterval(liveTick);
  const c=LR.qs[LR.k],n=LR.qs.length,sub=subjOf(c.s),left=Math.max(0,Math.round((LR.end-Date.now())/1000));
  app.innerHTML=`<div class="sbar"><span class="pill"><bdi dir="ltr">${ar(LR.k+1)} / ${ar(n)}</bdi></span><span class="pill xtm${left<=60?' low':''}" id="lvt">${mmss(left)}</span><button class="btn xfin" id="lvf">إنهاء</button></div>
  <div class="scene" style="--sc:${safeC(sub.c)}"><div class="card"><section class="face front" aria-label="السؤال">
    <div class="tags"><span class="tag s">🔴 امتحان حي</span><span class="tag">${esc(sub.n)}</span></div>
    <p class="q" dir="${dirOf(c.q)}">${fmt(c.q)}</p>${imgHtml(c)}
    <ul class="opts">${c.o.map((t,i)=>`<li><button class="opt${LR.ans[LR.k]===i?' sel':''}${skCls(c,i)}" dir="${dirOf(t)}" data-i="${i}"><span class="l">${LET[i]}</span><span class="t">${esc(t)}</span></button></li>`).join('')}</ul>
    <div class="r2"><button class="btn line" id="lvp"${LR.k?'':' disabled'}>السابق</button><button class="btn line" id="lvn2"${LR.k+1<n?'':' disabled'}>التالي</button></div>
  </section></div></div>`;
  app.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{LR.ans[LR.k]=+b.dataset.i;lsSet('bc_lv_'+LR.i.id,JSON.stringify(LR.ans));app.querySelectorAll('.opt').forEach(x=>x.classList.toggle('sel',x===b))});
  $('lvp').onclick=()=>{LR.k--;liveShow()};$('lvn2').onclick=()=>{LR.k++;liveShow()};
  $('lvf').onclick=async()=>{const un=n-LR.ans.filter(x=>x!=null).length;if(await askConfirm('إنهاء الامتحان',un?'لديك '+ar(un)+' سؤالاً بدون إجابة. تنهي الامتحان؟':'هل تريد تسليم الامتحان؟','سلّم'))liveSubmit()};
  tId=setInterval(()=>{const l=Math.max(0,Math.round((LR.end-Date.now())/1000)),el=$('lvt');if(el){el.textContent=mmss(l);el.classList.toggle('low',l<=60)}if(l<=0){stopTimer();liveSubmit()}},1000);
}
async function liveSubmit(){
  stopTimer();const L=LR;if(!L||L.sending)return;
  L.sending=true;if(modal.innerHTML.trim())closeModal();
  loadingScreen('جارٍ تسليم الامتحان…');
  const ans=L.qs.map((q,k)=>L.ans[k]==null?-1:L.ans[k]);
  let r;try{r=await rpc('live_submit',{p_id:L.i.id,p_player:pkey(),p_answers:ans})}catch(e){r={error:{}}}
  if(r.error||!r.data){L.sending=false;toast(msgOf(r.error,{already_done:'سُلّم هذا الامتحان مسبقاً.',not_started:'لم يبدأ امتحانك.'}));await liveLoad(L.sp,true);renderLive(L.sp);return}
  const d=r.data;lsSet('bc_lv_'+L.i.id,'[]');lsSet('bc_lvans_'+L.i.id,JSON.stringify(ans));
  if(d.pending){await liveLoad(L.sp,true);liveWait(L,d);return}
  try{L.qs.forEach((q,k)=>{const rv=d.review.find(x=>x.id===q.id);dqRecord({id:q.id,s:q.s,sy:q.sy,ex:undefined},!!rv&&rv.a===ans[k],0)})}catch(e){}
  ptFlush();
  await liveLoad(L.sp,true);
  liveResult(L,d);
}
function liveWait(L,d){
  view='livewait';stopTimer();
  const spn=spById(L.sp).n,left=Math.max(0,Date.parse(d.ends_at)-lvNow(L.sp));
  app.innerHTML=`<div class="top"><div class="brand">🔴 تم تسليم امتحانك<small>${esc(spn)}</small></div><button class="pill" id="lvb">رجوع</button></div>
  <div class="sum"><div class="big">✅</div><p>سلّمت امتحانك خلال ${fmtT(d.secs)}.</p>
  <p class="hint">النتيجة والأجوبة والترتيب تظهر بعد انتهاء الامتحان لجميع المشاركين (بعد حوالي ${cdTxt(left)})، حتى تبقى المنافسة عادلة. ارجع إلى هنا بعدها.</p></div>`;
  $('lvb').onclick=home;
}
async function liveMine(sp){
  const i=LV[sp].info;loadingScreen('جارٍ تحميل نتيجتك…');
  let r;try{r=await rpc('live_result',{p_id:i.id,p_player:Store.user?null:pkey()})}catch(e){r={error:{}}}
  if(r.error||!r.data){toast(msgOf(r.error,{not_ended:'لم ينتهِ الامتحان بعد.',not_done:'لم تسلّم هذا الامتحان.'}));await liveLoad(sp,true);renderLive(sp);return}
  const d=r.data;let ans=[];try{ans=JSON.parse(lsGet('bc_lvans_'+i.id)||'[]')||[]}catch(e){}
  const L={sp:sp,i:i,qs:d.questions,ans:ans.length===d.questions.length?ans:null};
  if(L.ans&&!lsGet('bc_lvrec_'+i.id)){
    lsSet('bc_lvrec_'+i.id,'1');
    try{L.qs.forEach((q,k)=>{const rv=d.review.find(x=>x.id===q.id);dqRecord({id:q.id,s:q.s,sy:q.sy,ex:undefined},!!rv&&rv.a===L.ans[k],0)})}catch(e){}
    ptFlush();
  }
  liveResult(L,d);
}
function liveResult(L,d){
  view='liveres';stopTimer();
  const spn=spById(L.sp).n,url=baseUrl()+'#live-'+encodeURIComponent(L.sp);
  const has=Array.isArray(L.ans);
  const wrong=d.review.map((rv,k)=>({q:L.qs[k],rv:rv,mine:has?L.ans[k]:undefined})).filter(x=>!has||x.mine!==x.rv.a);
  app.innerHTML=`<div class="top"><div class="brand">🔴 نتيجة الامتحان الحي<small>${esc(spn)}</small></div><button class="pill" id="lvb">رجوع</button></div>
  <div class="sum"><div class="big"><bdi dir="ltr">${ar(d.score)} / ${ar(d.n)}</bdi></div><p>الوقت ${fmtT(d.secs)}</p><div id="lvboard"><p class="hint">جارٍ حساب ترتيبك…</p></div><div id="lvshare"></div></div>
  <h3 class="sec">${has?'الأسئلة التي أخطأت بها':'الأسئلة وأجوبتها'} (${ar(wrong.length)})</h3>
  ${wrong.map(x=>`<details class="panel" style="margin-bottom:8px"><summary dir="${dirOf(x.q.q)}" style="font-weight:600">${esc(x.q.q.length>120?x.q.q.slice(0,120)+'…':x.q.q)}</summary>${imgHtml(x.q)}<p dir="${dirOf(x.q.o[x.rv.a])}"><b>الصحيح:</b> ${LET[x.rv.a]}) ${esc(x.q.o[x.rv.a])}</p>${x.rv.e?`<div class="exp" dir="${dirOf(x.rv.e)}"><b>الشرح</b>${fmt(x.rv.e)}</div>`:''}</details>`).join('')||'<div class="empty">لا أخطاء، ممتاز!</div>'}`;
  $('lvb').onclick=home;
  liveBoard(L.sp,L.i.id,'lvboard',(my,total)=>{
    const body='🔴 امتحان Boardcard الحي ('+spn+')\nحصلت على '+ar(d.score)+'/'+ar(d.n)+(my?'، المركز '+ar(my.rnk)+' من '+ar(total):'')+'\n⏱ '+fmtT(d.secs)+'\nهل تقدر تتفوق عليّ؟ الجمعة القادمة 8 مساءً';
    const box=$('lvshare');if(!box)return;box.innerHTML=shareRow('lv');bindShareRow('lv',body+'\n'+url,url,body);
  });
}

/* ---------- شريك المذاكرة ---------- */
let PTN=null,PTat=0,ptBusy=false;
async function ptFlush(){
  if(!Store.user||ptBusy||!(S.ptPend>0))return;
  ptBusy=true;const n=Math.min(S.ptPend,200);
  try{const r=await rpc('mark_active',{p_n:n});if(!r.error){S.ptPend=Math.max(0,S.ptPend-n);save()}}catch(e){}
  ptBusy=false;
}
async function ptLoad(force){
  if(!Store.user)return;
  if(!force&&Date.now()-PTat<120000)return;
  PTat=Date.now();
  try{await ptFlush();const r=await rpc('partner_status');const d=dataRow(r.data)||null,old=JSON.stringify(PTN);PTN=d;if(JSON.stringify(PTN)!==old&&view==='home')home()}catch(e){}
}
function ptHtml(){
  if(F.sp||!Store.user||!PTN||PTN.state==='none')return '';
  if(PTN.state==='pending')return `<div class="dq" data-pt="1" role="button" tabindex="0"><div class="dqi">🤝</div><div class="gt"><b>دعوة شريك المذاكرة</b><span>بانتظار انضمام زميلك</span><small>اضغط لمشاركة الرمز</small></div><span class="pill">فتح</span></div>`;
  const p=PTN,TH=10;
  return `<div class="dq" data-pt="1" role="button" tabindex="0"><div class="dqi">🤝</div><div class="gt"><b>شريكك ${esc(p.partner_name)}</b><span>🔥 ${ar(p.streak)} ${p.streak===1?'يوم':'أيام'} مشتركة</span><small>أنت ${p.my_n>=TH?'✓':ar(p.my_n)+'/'+ar(TH)} · ${esc(p.partner_name)} ${p.partner_n>=TH?'✓':ar(p.partner_n)+'/'+ar(TH)}</small></div><span class="pill">فتح</span></div>`;
}
async function ptModal(){
  if(!Store.user){toast('شريك المذاكرة متاح للطلاب المسجلين.');paywall();return}
  PTat=0;await ptLoad(true);
  const p=PTN||{state:'none'};
  const X0=`<button class="x" id="cl" aria-label="إغلاق">✕</button><h2>🤝 شريك المذاكرة</h2>`;
  if(p.state==='active'){
    const rest=Math.max(0,10-p.my_n);
    showModal(X0+`<div class="sum"><div class="big">🔥 ${ar(p.streak)}</div><p>${p.streak===1?'يوم':'يوماً'} متتالياً مع <b>${esc(p.partner_name)}</b></p></div>
      <p class="hint" style="margin-top:12px">الشرط: يحل كل واحد منكما ${ar(10)} أسئلة على الأقل كل يوم. إذا قصّر أحدكما تنكسر السلسلة على الاثنين.</p>
      <div class="setting"><span>أنت اليوم</span><b><bdi dir="ltr">${ar(p.my_n)} / ${ar(10)}</bdi> ${p.my_n>=10?'✓':''}</b></div>
      <div class="setting"><span>${esc(p.partner_name)} اليوم</span><b><bdi dir="ltr">${ar(p.partner_n)} / ${ar(10)}</bdi> ${p.partner_n>=10?'✓':''}</b></div>
      <button class="btn block" id="ptr" style="margin-top:8px">ذكّر شريكك</button>
      <button class="btn line block" id="ptl" style="margin-top:8px">إنهاء الشراكة</button>`);
    $('cl').onclick=closeModal;
    $('ptr').onclick=()=>window.open('https://wa.me/?text='+encodeURIComponent('🔥 سلسلتنا '+ar(p.streak)+' '+(p.streak===1?'يوم':'أيام')+' على Boardcard! لا تكسرها، حل '+ar(Math.max(0,10-p.partner_n))+' أسئلة اليوم.\n'+baseUrl()),'_blank','noopener');
    $('ptl').onclick=async()=>{if(!(await askConfirm('إنهاء الشراكة','ستنتهي السلسلة المشتركة نهائياً.','إنهاء')))return;await rpc('partner_leave');PTN=null;PTat=0;toast('تم إنهاء الشراكة');ptLoad(true);home()};
    return;
  }
  if(p.state==='pending'){
    const url=baseUrl()+'#pt-'+p.code,body='🤝 كن شريك مذاكرتي على Boardcard! إذا قصّر أحدنا تنكسر السلسلة على الاثنين.\nالرمز: '+p.code;
    showModal(X0+`<p>أرسل هذا الرمز لزميلك (يحتاج حساباً في Boardcard):</p><div class="dqtext" dir="ltr" style="font-size:26px;font-weight:700;letter-spacing:3px">${esc(p.code)}</div>${shareRow('pt')}<button class="btn line block" id="ptl" style="margin-top:8px">إلغاء الدعوة</button>`);
    $('cl').onclick=closeModal;bindShareRow('pt',body+'\n'+url,url,body);
    $('ptl').onclick=async()=>{await rpc('partner_leave');PTN=null;PTat=0;closeModal();ptLoad(true)};
    return;
  }
  showModal(X0+`<p>اختر زميلاً تذاكران معاً. تتكوّن سلسلة مشتركة، وإذا قصّر أحدكما تنكسر على الاثنين، فكل واحد يذكّر الثاني.</p>
    <button class="btn block" id="pti">دعوة زميل</button>
    <h3 class="sec">عندك رمز دعوة؟</h3>
    <label class="fld"><input class="in" id="ptc" maxlength="12" dir="ltr" autocapitalize="characters" style="text-align:left" placeholder="مثال: 4916E036"></label>
    <button class="btn line block" id="ptj">انضم</button>`);
  $('cl').onclick=closeModal;
  $('pti').onclick=async()=>{const r=await rpc('partner_invite');if(r.error){toast(msgOf(r.error,{already_partnered:'لديك شريك مذاكرة حالياً.'}));return}PTat=0;await ptLoad(true);ptModal()};
  $('ptj').onclick=()=>{const v=($('ptc').value||'').trim();if(v.length<4){toast('اكتب الرمز.');return}closeModal();ptDeep(v)};
}
async function ptDeep(code,ask){
  if(!Store.user){toast('سجّل دخولك بحسابك لتصبح شريك مذاكرة.');paywall();return}
  if(ask&&!(await askConfirm('دعوة شريك مذاكرة','وصلتك دعوة لتصبح شريك مذاكرة بالرمز '+code+'. عند الموافقة ترتبط سلسلتك بسلسلة صاحب الدعوة. هل تريد الانضمام؟','انضم')))return;
  const r=await rpc('partner_join',{p_code:code});
  if(r.error){toast(msgOf(r.error,{bad_code:'الرمز غير صحيح أو مستعمل.',own_code:'هذا رمزك أنت. أرسله لزميلك.',already_partnered:'لديك شريك مذاكرة حالياً.'}));return}
  toast('أصبحت شريك مذاكرة '+r.data+' 🤝');PTat=0;ptLoad(true);
}

/* ---------- الدوريات الأسبوعية + دوري المحافظات ---------- */
const GOVS=['بغداد','نينوى','البصرة','النجف','كربلاء','ذي قار','ديالى','الأنبار','كركوك','صلاح الدين','واسط','ميسان','بابل','القادسية','المثنى','دهوك','أربيل','السليمانية'];
const TIERS=[null,{n:'البرونزي',i:'🥉',c:'#B9783A'},{n:'الفضي',i:'🥈',c:'#7F8FA0'},{n:'الذهبي',i:'🥇',c:'#D99A00'}];
let LG={tab:'league',pickGov:false};
const weekLeft=()=>{const t=Date.now()+3*36e5,d=new Date(t),add=((6-d.getUTCDay())+7)%7||7;return Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate())+add*864e5-t};
async function league(tab){
  if(tab)LG.tab=tab;
  view='lg';stopTimer();
  const head=`<div class="top"><div class="brand">الدوري الأسبوعي<small>ينتهي بعد ${fmtIv(weekLeft()/864e5)}</small></div><button class="pill" id="lgb">رجوع</button></div>
  <div class="seg" role="group" aria-label="الأقسام" style="margin-top:0">${[['league','دوريتي'],['gov','المحافظات'],['lb','لوحة الشرف']].map(([v,t])=>`<button data-lt="${v}" aria-pressed="${LG.tab===v}">${t}</button>`).join('')}</div>`;
  const bind=()=>{$('lgb').onclick=home;app.querySelectorAll('[data-lt]').forEach(b=>b.onclick=()=>{if(b.dataset.lt==='lb'){LB.back=null;leaderboard()}else league(b.dataset.lt)})};
  if(!Store.user){app.innerHTML=head+`<div class="auth"><p>الدوريات متاحة للطلاب المسجلين. سجّل دخولك لتنافس زملاءك وتصعد من البرونزي إلى الذهبي.</p><button class="btn block" id="lsub">اشترك أو سجّل الدخول</button></div>`;bind();$('lsub').onclick=paywall;return}
  if(LG.tab==='gov'){govTab(head,bind);return}
  const nick=Store.profile&&Store.profile.lb_name;
  if(!nick){LB.back=league;leaderboard();return}
  app.innerHTML=head+'<p class="empty">جارٍ تحميل دوريتك…</p>';bind();
  let r,b;
  try{r=await rpc('league_me');if(r.error)throw r.error;b=await rpc('league_board')}catch(e){if(view==='lg'){app.innerHTML=head+'<p class="err">تعذر تحميل الدوري. جرب مرة ثانية.</p>';bind()}return}
  if(view!=='lg'||LG.tab!=='league')return;
  const me=dataRow(r.data),T=TIERS[me.l_tier]||TIERS[1],rows=b.data||[],n=rows.length,cut=Math.max(1,Math.ceil(n*0.2)),act=n>=10;
  const mine=rows.find(x=>x.me),rk=mine?mine.rnk:0;
  const up=act&&rk&&rk<=cut,dn=act&&rk&&rk>n-cut&&me.l_tier>0;
  let note='';
  if(!act)note=`الصعود والهبوط يبدأ عندما يصل عدد دورتك إلى ${ar(10)} طلاب (الآن ${ar(n)}). ادعُ زملاءك!`;
  else if(up)note=me.l_tier<3?`🟢 أنت في منطقة الصعود إلى الدوري ${TIERS[me.l_tier+1].n}. حافظ على مكانك!`:'🟢 أنت في القمة. حافظ على مكانك في الدوري الذهبي!';
  else if(dn){const safe=rows[n-cut-1],gap=safe?Math.max(1,safe.answered-(mine?mine.answered:0)+1):1;note=me.l_tier>1?`🔴 أنت في منطقة الهبوط! حل ${ar(gap)} سؤالاً إضافياً لتنجو من النزول.`:'🔴 أنت في آخر الدورة. حل المزيد لتتقدم.'}
  else note='أنت في المنتصف. الخمس الأوائل يصعدون، والخمس الأواخر ينزلون.';
  const mv=me.l_moved==='up'?'🎉 ترقّيت هذا الأسبوع إلى '+T.n+'!':me.l_moved==='down'?'نزلت إلى '+T.n+' الأسبوع الماضي. ارجع بقوة!':'';
  app.innerHTML=head+`<div class="sum" style="margin-top:12px"><div class="big" style="font-size:64px">${T.i}</div><p><b style="color:${T.c}">الدوري ${T.n}</b>${n?' · المركز '+ar(rk)+' من '+ar(n):''}</p>${mv?`<div class="banner">${mv}</div>`:''}<p class="hint">${note}</p></div>
  ${rows.map(x=>{const z=act&&x.rnk<=cut?'up':(act&&x.rnk>n-cut&&me.l_tier>1?'dn':'');return `<div class="item lbr${x.me?' me':''}" style="--sc:${z==='up'?'#2E9E5B':z==='dn'?'#D04A3F':'#5A6B77'}"><b class="rk">${ar(x.rnk)}</b><div class="grow"><div class="nm" dir="auto">${esc(x.nickname)}${x.me?' (أنت)':''}</div></div><b>${ar(x.answered)}</b><span class="sub">سؤال</span></div>`}).join('')}
  <p class="note">يبدأ الأسبوع كل سبت. من لا يحل أي سؤال خلال الأسبوع ينزل دوراً. الأسئلة تُحسب بعد انضمامك للوحة الشرف.</p>`;
  bind();
}
async function govTab(head,bind){
  const gov=Store.profile&&Store.profile.gov;
  if(!gov||LG.pickGov){
    app.innerHTML=head+`<div class="auth"><p>اختر محافظتك لتدخل <b>دوري المحافظات</b>: مجموع أسئلة طلاب كل محافظة هذا الأسبوع.</p><div class="r2" style="flex-wrap:wrap">${GOVS.map(g=>`<button class="btn line" data-g="${esc(g)}" style="flex:1 1 30%;min-height:44px;padding:8px">${esc(g)}</button>`).join('')}</div></div>`;
    bind();
    app.querySelectorAll('[data-g]').forEach(b=>b.onclick=async()=>{const v=b.dataset.g;const r=await rpc('set_gov',{p_gov:v});if(r.error){toast('تعذر الحفظ. جرب مرة ثانية.');return}Store.profile.gov=v;LG.pickGov=false;toast('تم اختيار محافظة '+v);league('gov')});
    return;
  }
  app.innerHTML=head+'<p class="empty">جارٍ تحميل الترتيب…</p>';bind();
  let r;try{r=await rpc('gov_board');if(r.error)throw r.error}catch(e){if(view==='lg'){app.innerHTML=head+'<p class="err">تعذر تحميل الترتيب.</p>';bind()}return}
  if(view!=='lg'||LG.tab!=='gov')return;
  const got={};(r.data||[]).forEach(x=>{got[x.gov]=x});
  const all=GOVS.map(g=>got[g]||{gov:g,total:0,members:0}).sort((a,b)=>b.total-a.total||b.members-a.members);
  const nick=Store.profile&&Store.profile.lb_name;
  const url=baseUrl(),body='🏆 ادعم محافظة '+gov+' في دوري المحافظات على Boardcard! كل سؤال تحله يرفع ترتيبها.';
  app.innerHTML=head+`<p class="hint" style="margin-top:12px">محافظتك: <b>${esc(gov)}</b>. <button id="gch" class="rlink">تغيير</button></p>${nick?'':'<div class="banner">لتُحسب أسئلتك لمحافظتك انضم للوحة الشرف أولاً.<br><button class="pill" id="gj" style="margin-top:6px">انضم الآن</button></div>'}
  ${all.map((x,i)=>`<div class="item lbr${x.gov===gov?' me':''}" style="--sc:${x.total&&i<3?['#E0A100','#9AA7B4','#B9783A'][i]:'#5A6B77'}"><b class="rk">${ar(i+1)}</b><div class="grow"><div class="nm">${esc(x.gov)}${x.gov===gov?' (محافظتك)':''}</div><div class="sub">${ar(x.members)} طالب</div></div><b>${ar(x.total)}</b><span class="sub">سؤال</span></div>`).join('')}
  ${shareRow('gv')}<p class="note">الترتيب بمجموع الأسئلة هذا الأسبوع، فادعُ زملاءك من محافظتك ليرتفع ترتيبها.</p>`;
  bind();bindShareRow('gv',body+'\n'+url,url,body);
  $('gch').onclick=()=>{LG.pickGov=true;league('gov')};
  const gj=$('gj');if(gj)gj.onclick=()=>{LB.back=()=>league('gov');leaderboard()};
}

/* ---------- خريطة الإتقان لكل اختصاص ---------- */
function mapScreen(sp){
  view='map';stopTimer();
  const spn=spById(sp).n;
  let T=0,M=0,done=0,cnt=0,near=null;
  const row=(attr,name,st,c,indent)=>{
    const d=st.open,m=st.mastered,p=d?Math.min(100,Math.round(100*m/d)):0,fin=d>0&&m>=d;
    cnt++;if(fin)done++;
    if(d>0&&!fin&&(!near||d-m<near.left))near={name:name,left:d-m};
    return `<button class="item" ${attr} style="--sc:${safeC(c)};${indent?'margin-inline-start:16px;width:calc(100% - 16px)':''}"><div class="grow"><div class="nm">${esc(name)}${fin?' ✅':''}</div><div class="sub">${d?ar(m)+' من '+ar(d)+' · '+ar(p)+'%'+(fin?' · ختمتها!':' · باقي '+ar(d-m)):'🔒 للمشتركين'}</div><div class="bar"><i style="width:${p}%"></i></div></div></button>`;
  };
  const html=subjectsOf(sp).map(x=>{
    const st=stats({s:x.id});if(!st.total)return '';
    T+=st.open;M+=st.mastered;
    const sys=systemsOf(x.id).map(y=>({y:y,st:stats({s:x.id,sy:y.id})})).filter(z=>z.st.total);
    const g=stats({s:x.id,sy:'_none'});if(sys.length&&g.total)sys.push({y:{id:'_none',n:'أسئلة عامة',c:x.c},st:g});
    return row(`data-mp="${esc(x.id)}|"`,x.n,st,x.c,false)+sys.map(z=>row(`data-mp="${esc(x.id)}|${esc(z.y.id)}"`,z.y.n,z.st,z.y.c,true)).join('');
  }).join('');
  const P0=T?Math.round(100*M/T):0;
  app.innerHTML=`<div class="top"><div class="brand">🗺 خريطة الإتقان<small>${esc(spn)}</small></div><button class="pill" id="mpb">رجوع</button></div>
  <div class="sum"><div class="big">${ar(P0)}%</div><p>أتقنت ${ar(M)} من ${ar(T)} سؤالاً في ${esc(spn)}</p><div class="bar"><i style="width:${P0}%"></i></div>${near?`<p class="hint" style="margin-top:10px">الأقرب للختم: <b>${esc(near.name)}</b>، باقي ${ar(near.left)} سؤالاً فقط.</p>`:''}${Store.user&&Store.subs[sp]?'<button class="btn line block" id="mprd">📈 مؤشر الجاهزية للامتحان</button>':''}</div>
  <h3 class="sec">المواد والأنظمة</h3>${html||'<div class="empty">لا توجد أسئلة بعد.</div>'}
  <p class="note">«أتقنت» تعني أن السؤال وصل لمرحلة التثبيت الطويل في جدول المراجعة. اضغط على أي مادة أو نظام لتراجعه.</p>`;
  $('mpb').onclick=home;
  {const rb=$('mprd');if(rb)rb.onclick=()=>readyModal(sp)}
  app.querySelectorAll('[data-mp]').forEach(b=>b.onclick=()=>{const [sid,sy]=b.dataset.mp.split('|');start(sid,sp,sy||undefined)});
}

/* ---------- عدّاد موعد الامتحان ---------- */
const exDays=d=>{const t=new Date(d+'T00:00:00'),n=new Date();n.setHours(0,0,0,0);return Math.round((t-n)/864e5)};
function exHtml(){
  if(F.sj)return '';
  const list=(F.sp?[F.sp]:Object.keys(Store.subs)).filter(id=>id&&id!=='_none'&&Store.subs[id]);
  return list.map(sp=>{
    const d=S.exd&&S.exd[sp],spn=spById(sp).n;
    if(!d)return list.length===1?`<div class="dq" data-ex="${esc(sp)}" role="button" tabindex="0"><div class="dqi">⏳</div><div class="gt"><b>حدد موعد امتحانك</b><span>نحسب لك كم سؤالاً تحتاج يومياً</span><small>${esc(spn)}</small></div><span class="pill">حدد</span></div>`:'';
    const days=exDays(d);
    if(days<0)return `<div class="dq" data-ex="${esc(sp)}" role="button" tabindex="0"><div class="dqi">⏳</div><div class="gt"><b>انتهى موعد امتحان ${esc(spn)}</b><span>حدد موعداً جديداً إن وُجد</span></div><span class="pill">تغيير</span></div>`;
    if(days===0)return `<div class="dq" data-ex="${esc(sp)}" role="button" tabindex="0"><div class="dqi">⏳</div><div class="gt"><b>امتحان ${esc(spn)} اليوم!</b><span>بالتوفيق، أنت جاهز 💪</span></div><span class="pill">تغيير</span></div>`;
    const st=stats({sp:sp}),left=Math.max(0,st.open-st.mastered),per=Math.ceil(left/days),today=(S.days[dk(new Date())]||{n:0}).n;
    return `<div class="dq" data-ex="${esc(sp)}" role="button" tabindex="0"><div class="dqi">⏳</div><div class="gt"><b>باقي ${ar(days)} ${days===1?'يوم':days===2?'يومان':'يوماً'} على امتحان ${esc(spn)}</b><span>${left?'باقي لك '+ar(left)+' سؤالاً لم تتقنه، يعني '+ar(per)+' باليوم':'أتقنت كل الأسئلة 👏'}</span><small>${left?'اليوم: '+ar(today)+' من '+ar(per)+(today>=per?' ✓':''):''}</small></div><span class="pill">تغيير</span></div>`;
  }).join('');
}
function exModal(sp){
  const d=(S.exd&&S.exd[sp])||'',today=dk(new Date());
  showModal(`<button class="x" id="cl" aria-label="إغلاق">✕</button><h2>موعد امتحان ${esc(spById(sp).n)}</h2><p class="hint">نحسب لك كم سؤالاً تحتاج يومياً لتتقن الأسئلة قبل الامتحان.</p>
    <label class="fld"><span>تاريخ الامتحان</span><input class="in" type="date" id="exd" value="${esc(d)}" min="${today}" style="direction:ltr;text-align:left"></label>
    <button class="btn block" id="exs">حفظ</button>${d?'<button class="btn line block" id="exr" style="margin-top:8px">إزالة الموعد</button>':''}`);
  $('cl').onclick=closeModal;
  $('exs').onclick=()=>{const v=$('exd').value;if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||exDays(v)<0){toast('اختر تاريخاً صحيحاً.');return}if(!S.exd)S.exd={};S.exd[sp]=v;save();closeModal();home()};
  const rm=$('exr');if(rm)rm.onclick=()=>{if(!S.exd)S.exd={};S.exd[sp]='';save();closeModal();home()};
}

/* ---------- ملخص آخر 30 يوماً (قابل للمشاركة) ---------- */
let MS=null;
async function monthSummary(){
  const now=new Date(),agg={},tot={n:0,ok:0,sec:0};let act=0;
  for(let i=0;i<30;i++){
    const d=S.days[dk(new Date(now.getFullYear(),now.getMonth(),now.getDate()-i))];if(!d||!d.n)continue;
    act++;tot.n+=d.n;tot.ok+=d.ok;tot.sec+=d.sec;
    Object.keys(d.subj||{}).forEach(id=>{const a=agg[id]||(agg[id]={n:0,ok:0});a.n+=d.subj[id].n;a.ok+=d.subj[id].ok});
  }
  if(tot.n<10){toast('حل 10 أسئلة على الأقل خلال آخر 30 يوماً ليظهر ملخصك.');return}
  const best=Object.keys(agg).filter(id=>agg[id].n>=10&&Store.subjects.some(x=>x.id===id)).map(id=>({id:id,p:agg[id].ok/agg[id].n})).sort((a,b)=>b.p-a.p)[0];
  let pct=null;
  try{if(Store.user&&Store.profile&&Store.profile.lb_name){const r=await rpc('lb_month');const d=dataRow(r.data);if(d&&d.pct!=null)pct=d.pct}}catch(e){}
  MS={total:tot.n,acc:Math.round(100*tot.ok/tot.n),days:act,sec:tot.sec,best:best?subjOf(best.id).n:'',pct:pct};
  shareCard('month');
}

/* ---------- تحميل خلفي للرئيسية (الامتحان الحي والشريك) ---------- */
let RK={t:0,d:null};
async function rankLoad(){
  if(!Store.user)return null;
  if(RK.d&&Date.now()-RK.t<6e5)return RK.d;
  try{const r=await sb.rpc('subject_ranks');if(!r.error&&r.data&&typeof r.data==='object')RK={t:Date.now(),d:r.data}}catch(e){}
  return RK.d;
}
// ترتيبك بين زملائك في كل مادة (حسب عدد الأسئلة التي أجبتها)، ويظهر عندما يكون في المادة 5 طلاب على الأقل
function rankPaint(){
  if(!RK.d||view!=='home'||!F.sp||F.sj)return;
  app.querySelectorAll('[data-s]').forEach(b=>{
    const x=RK.d[b.dataset.s];if(!x||x.tot<5||b.querySelector('.rk'))return;
    const sub=b.querySelector('.sub');
    if(sub)sub.insertAdjacentHTML('beforeend','<span class="rk"> · ترتيبك '+ar(x.ahead+1)+' من '+ar(x.tot)+'</span>');
  });
}
async function homeAsync(){
  if(Store.user)ptLoad();
  if(F.sp&&Store.user&&Store.subs[F.sp]){rankPaint();rankLoad().then(rankPaint)}
  const list=(F.sp?[F.sp]:Object.keys(Store.subs)).filter(id=>Store.subs[id]&&dqOk(id));
  let changed=false;
  await Promise.all(list.map(async sp=>{const old=JSON.stringify(LV[sp]&&LV[sp].info);await liveLoad(sp);if(JSON.stringify(LV[sp]&&LV[sp].info)!==old)changed=true}));
  if(changed&&view==='home')home();
}
/* ---------- بطاقة «اليوم» الموحدة لمن اشترك بأكثر من اختصاص ---------- */
const multiSubs=()=>!F.sp&&!F.sj&&Object.keys(Store.subs).filter(dqOk).length>=2;
function liveLine(sp){
  const c=LV[sp],i=c&&c.info;if(!i)return null;
  const now=lvNow(sp),st=Date.parse(i.starts_at),je=st+i.join_mins*6e4;
  if(i.done)return {t:'أنهيته ✓',hot:false};
  if(i.begun&&now<je+i.minutes*6e4)return {t:'جارٍ، أكمله',hot:true};
  if(now<st)return {t:'يبدأ بعد '+fmtIv((st-now)/864e5),hot:st-now<48*36e5};
  if(now<=je)return {t:'بدأ الآن! ادخل',hot:true};
  return {t:'انتهى هذا الأسبوع',hot:false};
}
function todayHtml(){
  const ids=Object.keys(Store.subs).filter(dqOk),day=dqDay();
  const done=ids.filter(id=>{const e=S.dq&&S.dq[day+'|'+id];return e&&e.done}).length;
  const hot=ids.filter(id=>{const l=liveLine(id);return l&&l.hot}).length;
  const ex=ids.map(id=>S.exd&&S.exd[id]?exDays(S.exd[id]):null).filter(d=>d!=null&&d>=0).sort((a,b)=>a-b)[0];
  const parts=[];
  if(hot)parts.push('🔴 امتحان حي قريب');
  if(ex!=null)parts.push('⏳ أقرب امتحان بعد '+ar(ex)+' يوم');
  return `<div class="dq" data-today="1" role="button" tabindex="0"><div class="dqi">📅</div><div class="gt"><b>اليوم</b><span>🎯 تحدي اليوم: ${ar(done)} من ${ar(ids.length)} اختصاصات</span><small>${parts.join(' · ')||'تحديات واختبارات اختصاصاتك في مكان واحد'}</small></div><span class="pill">فتح</span></div>`;
}
function todayModal(){
  const ids=Object.keys(Store.subs).filter(dqOk),day=dqDay();
  showModal(`<button class="x" id="cl" aria-label="إغلاق">✕</button><h2>📅 اليوم</h2>`+ids.map(id=>{
    const e=S.dq&&S.dq[day+'|'+id],l=liveLine(id),d=S.exd&&S.exd[id],dd=d?exDays(d):null;
    return `<h3 class="sec">${esc(spById(id).n)}</h3>
    <button class="btn line block" data-t="dq|${esc(id)}" style="display:flex;justify-content:space-between;gap:10px;margin-top:6px"><b>🎯 تحدي اليوم</b><span>${e&&e.done?e.r.map(dqSqr).join(''):e&&e.r&&e.r.length?'أكمل':'ابدأ'}</span></button>
    ${l?`<button class="btn line block" data-t="lv|${esc(id)}" style="display:flex;justify-content:space-between;gap:10px;margin-top:6px"><b>🔴 الامتحان الحي</b><span>${l.t}</span></button>`:''}
    <button class="btn line block" data-t="ex|${esc(id)}" style="display:flex;justify-content:space-between;gap:10px;margin-top:6px"><b>⏳ موعد الامتحان</b><span>${dd==null||dd<0?'حدد':ar(dd)+' يوم'}</span></button>`;
  }).join(''));
  $('cl').onclick=closeModal;
  modal.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{const [k,id]=b.dataset.t.split('|');closeModal();if(k==='dq')dqStart(id);else if(k==='lv')liveScreen(id);else exModal(id)});
}
/* ---------- بانر التسجيل كسفير دفعة ---------- */
function ambLink(){
  const nm=(Store.profile&&(Store.profile.full_name||Store.profile.username))||'';
  return 'https://wa.me/9647764563070?text='+encodeURIComponent('السلام عليكم، أريد أن أصبح سفير دفعتي في Boardcard'+(nm?'. اسمي: '+nm:''));
}
function ambHtml(){
  if(!Store.user||!Store.premium||(Store.profile&&Store.profile.is_ambassador))return '';
  if(+(lsGet('bc_amb_hide')||0)>Date.now())return '';
  if((S.total||0)<30)return '';   // يكفي أن يكون الطالب نشطاً قليلاً
  return `<div class="amb"><div class="dqi">🎓</div><div class="gt"><b>كن سفير دفعتك في Boardcard</b><p>عن كل زميل يشترك بكودك: <b>10 أيام مجانية + 3,000 دينار</b>، وزميلك يحصل على <b>خصم 30% + 3 أيام مجانية</b> على اشتراكه الأول. المكافأة على الاشتراك الأول لكل زميل.</p><div class="ambb"><a class="btn" target="_blank" rel="noopener" href="${ambLink()}" style="min-height:40px;padding:6px 16px;margin:0">أريد أن أصبح سفيراً</a><button class="pill" id="ambx">لاحقاً</button></div></div></div>`;
}
/* ---------- نسبة اختيار الطلاب لكل خيار (تظهر تلقائياً بعد الجواب) ---------- */
let ChF=null;
// التوزيع يصل مع الجواب من السيرفر (q_answer)، فلا يحتاج طلباً إضافياً
function choiceFill(c){
  ChF=null;
  if(!Store.user||!c||!Array.isArray(c._ch)||!c._ch.length)return;
  if(!cur||cur.id!==c.id)return;
  const box=$('chs');if(!box)return;
  const cnt={};let tot=0;c._ch.forEach(x=>{cnt[x[0]]=x[1];tot+=x[1]});
  if(tot<STAT_MIN)return;
  const ul=box.previousElementSibling;
  if(ul)ul.querySelectorAll('.opt').forEach((el,i)=>{
    const pc=Math.round(100*(cnt[i]||0)/tot);
    el.classList.add('hasp');
    if(!el.querySelector('.pc'))el.insertAdjacentHTML('beforeend','<span class="pc">'+ar(noMotion()?pc:0)+'%</span>');
    const pe=el.querySelector('.pc');
    if(noMotion()){el.style.setProperty('--pw',pc+'%');return}
    el.style.setProperty('--pw','0%');
    setTimeout(()=>{if(!el.isConnected)return;el.style.setProperty('--pw',pc+'%');animNum(pe,pc,{dur:900,suf:'%'})},520+i*70);
  });
  const ok=Math.round(100*(cnt[c.a]||0)/tot),e=S.cards[c.id];
  box.textContent='📊 '+ar(ok)+'% أجابوا صح ('+(ok>=75?'سهل':ok>=45?'متوسط':'صعب')+')، من '+ar(tot)+' إجابة'+(e&&e.rp>=2?' · راجعتها '+ar(e.rp)+' مرات'+(e.lp?'، ونسيتها '+ar(e.lp):''):'');
}

/* ---------- جلسة من قائمة أسئلة جاهزة (البحث والاختبار المخصص) ---------- */
function runSession(list,mode){
  Q=list;sess={ok:0,n:0,sec:0,rq:{},locked:0,subj:undefined,sp:F.sp||undefined,sy:undefined,mode:mode,next:0,lim:false};qi=0;
  Q.length?showCard():summary();
}

/* ---------- بحث نصي في الأسئلة ---------- */
let SQ={q:'',sp:''};
const hiTxt=(t,toks)=>{
  t=String(t);const ks=toks.map(k=>String(k).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).filter(Boolean);
  if(!ks.length)return esc(t);
  let re;try{re=new RegExp('('+ks.join('|')+')','gi')}catch(e){return esc(t)}
  return t.split(re).map((x,i)=>i%2?'<mark>'+esc(x)+'</mark>':esc(x)).join('');   // التظليل على النص الأصلي حتى لا تنكسر رموز مثل &amp;
};
function searchScreen(){
  if(!Store.user){toast('البحث متاح للمشتركين. سجّل دخولك بحسابك.');return}
  const sps=Store.isAdmin?spList().map(x=>x.id).filter(x=>x!=='_none'):Object.keys(Store.subs);
  if(!sps.length){toast('البحث متاح لمشتركي Boardcard.');paywall();return}
  view='search';stopTimer();
  if(!SQ.sp&&F.sp&&sps.includes(F.sp))SQ.sp=F.sp;
  app.innerHTML=`<div class="top"><div class="brand">🔎 بحث في الأسئلة</div><button class="pill" id="sqb">رجوع</button></div>
  <label class="fld"><input class="in" id="sqi" type="search" dir="auto" maxlength="80" placeholder="كلمة أو أكثر من نص السؤال أو الخيارات" value="${esc(SQ.q)}"></label>
  ${sps.length>1?`<label class="fld"><select class="in" id="sqs"><option value="">كل اختصاصاتي</option>${sps.map(id=>`<option value="${esc(id)}"${SQ.sp===id?' selected':''}>${esc(spById(id).n)}</option>`).join('')}</select></label>`:''}
  <button class="btn block" id="sqg">بحث</button><div id="sqr" style="margin-top:12px"></div>`;
  $('sqb').onclick=home;
  // النتائج مقتطفات قصيرة فقط؛ نص السؤال الكامل وخياراته يُجلبان عند فتحه (ويدخلان في الحد اليومي إن كان جديداً)
  const openRes=async ents=>{
    loadingScreen('جارٍ تحميل الأسئلة…');
    let list;
    try{list=await hydrate(ents)}catch(e){if(!isKick(e)){toast('تعذر تحميل الأسئلة. جرب مرة ثانية.');searchScreen()}return}
    if(!list.length){toast(HY.denied?QUOTA_MSG:'تعذر فتح السؤال. جرب مرة ثانية.');searchScreen();return}
    if(HY.denied)toast('وصلت للحد اليومي من الأسئلة الجديدة، ففُتح '+ar(list.length)+' فقط.');
    runSession(list,'search');
  };
  const go=async()=>{
    const q=($('sqi').value||'').trim();SQ.q=q;SQ.sp=$('sqs')?$('sqs').value:(sps.length===1?sps[0]:'');
    if(q.length<2){toast('اكتب حرفين على الأقل.');return}
    const box=$('sqr');box.innerHTML='<p class="hint">جارٍ البحث…</p>';
    let r;try{r=await rpc('q_search',{p_q:q,p_sp:SQ.sp||null,p_limit:30})}catch(e){r={error:{}}}
    if(!$('sqr'))return;
    if(r.error){
      if(srvErr(r.error))return;
      box.innerHTML='<p class="err">'+(/search_limit/.test(String(r.error.message||''))?'وصلت للحد اليومي من عمليات البحث. جرّب غداً.':'تعذر البحث الآن. جرب مرة ثانية.')+'</p>';return;
    }
    const rows=Array.isArray(r.data)?r.data:[],toks=q.toLowerCase().split(/\s+/).filter(Boolean).slice(0,6);
    if(!rows.length){box.innerHTML='<div class="empty">لا توجد نتائج. جرّب كلمة أخرى.</div>';return}
    box.innerHTML=`<p class="hint">${ar(rows.length)}${rows.length>=30?' نتيجة أو أكثر (أول 30)':' نتيجة'}</p>
      <button class="btn line block" id="sqa" style="margin-bottom:10px">حل كل النتائج</button>`+
      rows.map((x,i)=>`<button class="item" data-sr="${i}" style="--sc:${safeC(subjOf(x.s).c)};align-items:flex-start"><div class="grow"><div class="sub">${esc(subjOf(x.s).n)}</div><div class="nm" dir="${dirOf(x.snip)}" style="font-weight:500;font-size:15px">${hiTxt(String(x.snip||''),toks)}</div></div></button>`).join('');
    box.querySelectorAll('[data-sr]').forEach(b=>b.onclick=()=>openRes([{id:rows[+b.dataset.sr].id}]));
    $('sqa').onclick=()=>openRes(rows.map(x=>({id:x.id})));
  };
  $('sqg').onclick=go;$('sqi').onkeydown=e=>{if(e.key==='Enter')go()};
  if(SQ.q)go();else $('sqi').focus();
}

/* ---------- اختبار مخصص: مواد وأنظمة وعدد وفلتر ---------- */
let CT=null;
function customTest(){
  const subIds=Object.keys(Store.subs);
  const sps=(F.sp?[F.sp]:(subIds.length?subIds:spList().map(p=>p.id))).filter(id=>id&&id!=='_none');
  const groups=sps.map(sp=>({sp:sp,subs:subjectsOf(sp).filter(x=>(!F.sj||x.id===F.sj)&&stats({s:x.id}).open>0)})).filter(g=>g.subs.length);
  if(!groups.length){toast('لا توجد أسئلة مفتوحة للاختبار المخصص.');return}
  CT={subj:{},sys:{},n:20,f:'all'};
  const seg=(attr,list,cur)=>`<div class="seg" role="group" style="margin:0 0 12px">${list.map(([v,t])=>`<button data-${attr}="${v}" aria-pressed="${String(cur)===String(v)}">${t}</button>`).join('')}</div>`;
  showModal(`<button class="x" id="cl" aria-label="إغلاق">✕</button><h2>اختبار مخصص</h2>
    <p class="hint">حدد المواد والأنظمة. إن لم تحدد شيئاً تُؤخذ كل المواد. وإن حددت مادة بدون أنظمة تُؤخذ كل أنظمتها.</p>
    ${groups.map(g=>`${groups.length>1?`<h3 class="sec">${esc(spById(g.sp).n)}</h3>`:''}`+g.subs.map(x=>{
      const sys=systemsOf(x.id).filter(y=>stats({s:x.id,sy:y.id}).open>0),gn=stats({s:x.id,sy:'_none'}).open;
      return `<label class="chk" style="margin-bottom:4px"><input type="checkbox" data-cs="${esc(x.id)}"><span>${esc(x.n)} <small style="color:var(--muted)">(${ar(stats({s:x.id}).open)})</small></span></label>`+
        (sys.length?sys.map(y=>`<label class="chk" style="margin:0 22px 2px 0;font-weight:500;font-size:14px"><input type="checkbox" data-cy="${esc(x.id)}|${esc(y.id)}"><span>${esc(y.n)}</span></label>`).join('')+(gn?`<label class="chk" style="margin:0 22px 2px 0;font-weight:500;font-size:14px"><input type="checkbox" data-cy="${esc(x.id)}|_none"><span>أسئلة عامة</span></label>`:''):'');
    }).join('')).join('')}
    <h3 class="sec">عدد الأسئلة</h3>${seg('cn',[[10,'10'],[20,'20'],[30,'30'],[50,'50'],[100,'100']],20)}
    <h3 class="sec">نوع الأسئلة</h3>${seg('cf',[['all','الكل'],['new','غير المحلولة'],['missed','أخطائي فقط']],'all')}
    <button class="btn block" id="ctgo">ابدأ الاختبار</button>`);
  $('cl').onclick=closeModal;
  modal.querySelectorAll('[data-cs]').forEach(b=>b.onchange=()=>{CT.subj[b.dataset.cs]=b.checked});
  modal.querySelectorAll('[data-cy]').forEach(b=>b.onchange=()=>{CT.sys[b.dataset.cy]=b.checked});
  modal.querySelectorAll('[data-cn]').forEach(b=>b.onclick=()=>{CT.n=+b.dataset.cn;modal.querySelectorAll('[data-cn]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)))});
  modal.querySelectorAll('[data-cf]').forEach(b=>b.onclick=()=>{CT.f=b.dataset.cf;modal.querySelectorAll('[data-cf]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)))});
  $('ctgo').onclick=()=>customRun(groups);
}
async function customRun(groups){
  const all=[];groups.forEach(g=>g.subs.forEach(x=>all.push(x.id)));
  // مادة مؤشر عليها، أو مادة فيها نظام مؤشر عليه، تُعتبر مختارة
  const picked=new Set(all.filter(id=>CT.subj[id]||Object.keys(CT.sys).some(k=>CT.sys[k]&&k.split('|')[0]===id)));
  const ids=picked.size?Array.from(picked):all;
  closeModal();
  loadingScreen('جارٍ تحميل الأسئلة…');
  try{await ensureIndex(ids)}catch(e){if(!isKick(e)){toast('تعذر تحميل الأسئلة. جرب مرة ثانية.');home()}return}
  const ySel=sid=>Object.keys(CT.sys).filter(k=>CT.sys[k]&&k.split('|')[0]===sid).map(k=>k.split('|')[1]);
  let pool=Object.values(Store.idx).filter(c=>{
    if(!ids.includes(c.s))return false;
    if(!(c.free||Store.subs[qSp(c)]||Store.isAdmin))return false;
    const ys=ySel(c.s);if(ys.length&&!ys.some(y=>inSys(c,y)))return false;
    const e=S.cards[c.id];
    if(CT.f==='new')return !e;
    if(CT.f==='missed')return !!e&&e.box===0;
    return true;
  });
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=pool[i];pool[i]=pool[j];pool[j]=t}
  pool=pool.slice(0,CT.n);
  if(!pool.length){toast(CT.f==='missed'?'ما عندك أسئلة خاطئة بهذا الاختيار. أحسنت!':CT.f==='new'?'حللت كل الأسئلة بهذا الاختيار.':'لا توجد أسئلة بهذا الاختيار.');home();return}
  let list;
  try{list=await hydrate(pool)}catch(e){if(!isKick(e)){toast('تعذر تحميل الأسئلة. جرب مرة ثانية.');home()}return}
  if(!list.length){toast(HY.denied?QUOTA_MSG:'تعذر تحميل الأسئلة. جرب مرة ثانية.');home();return}
  if(HY.denied)toast('وصلت للحد اليومي من الأسئلة الجديدة، فالاختبار '+ar(list.length)+' سؤالاً فقط.');
  runSession(list,'custom');
}

/* عدّاد التعليقات على زر «تعليقات»: دالة قاعدة بيانات خفيفة، تُجمَّع طلباتها وتُخزَّن لخمس دقائق */
const CC={};let ccQ=new Set(),ccT=null;
const ccN=id=>(CC[id]&&CC[id].n)||0;
const ccBadge=id=>{if(Store.user)ccWant(id);const n=ccN(id);return n?`<i class="cnt">${n>99?'99+':ar(n)}</i>`:''};
function ccWant(id){
  const e=CC[id];if(e&&Date.now()-e.t<300000)return;
  ccQ.add(id);clearTimeout(ccT);ccT=setTimeout(ccFlush,200);
}
async function ccFlush(){
  if(!Store.user||!ccQ.size)return;
  const all=[...ccQ],ids=all.slice(0,200);ccQ=new Set(all.slice(200));
  try{
    const r=await sb.rpc('q_comment_counts',{p_ids:ids});
    if(r.error)return;
    const m=r.data||{},now=Date.now();
    ids.forEach(id=>{CC[id]={n:+m[id]||0,t:now};ccPaint(id)});
  }catch(e){}
  if(ccQ.size)ccT=setTimeout(ccFlush,200);
}
function ccPaint(id){
  document.querySelectorAll('.qtools .tb[data-tb="disc"]').forEach(b=>{
    if(b.dataset.id!==id)return;
    const i=b.querySelector('.i');if(!i)return;
    const old=i.querySelector('.cnt');if(old)old.remove();
    const n=ccN(id);if(n)i.insertAdjacentHTML('beforeend',`<i class="cnt">${n>99?'99+':ar(n)}</i>`);
  });
}
/* ---------- نقاش تحت كل سؤال (يُحفظ في Supabase Storage عبر دالة q-comments) ---------- */
const agoTxt=ts=>{const m=Math.max(0,Math.floor((Date.now()-ts)/6e4));return m<1?'الآن':m<60?'قبل '+ar(m)+' د':m<1440?'قبل '+ar(Math.floor(m/60))+' ساعة':'قبل '+ar(Math.floor(m/1440))+' يوم'};
const DISCERR={cooldown:'انتظر قليلاً قبل التعليق مرة أخرى.',too_many:'وصلت للحد الأقصى من تعليقاتك على هذا السؤال.',bad_text:'اكتب تعليقاً من 1 إلى 150 حرفاً.',daily_limit:'وصلت للحد اليومي (10 تعليقات). جرب غداً.',disabled:'إضافة التعليقات متوقفة مؤقتاً.',subscribers_only:'النقاش لمشتركي هذا الاختصاص فقط.',blocked:'حسابك موقوف.'};
async function discModal(id){
  if(!Store.user){toast('النقاش متاح للمشتركين.');return}
  const c=Store.qmap[id];if(!c)return;
  if(!(Store.isAdmin||Store.subs[qSp(c)])){
    showModal(`<button class="x" id="cl" aria-label="إغلاق">✕</button><h2>💬 تعليقات السؤال</h2><p>النقاش بين مشتركي هذا الاختصاص فقط. ${Store.premium?'هذا السؤال ضمن اختصاص لست مشتركاً به.':''}</p><button class="btn block" id="dsub">${Store.premium?'طلب اشتراك باختصاص آخر':'اشترك لفتح النقاش'}</button>`);
    $('cl').onclick=closeModal;$('dsub').onclick=()=>{closeModal();paywall()};return;
  }
  showModal(`<button class="x" id="cl" aria-label="إغلاق">✕</button><h2>💬 تعليقات السؤال</h2>
    <p class="hint">نقاش بين مشتركي هذا الاختصاص. كن محترماً ولا تنشر معلومات طبية غير موثوقة.</p>
    <div id="dsl" style="max-height:38vh;overflow:auto"><p class="hint">جارٍ التحميل…</p></div>
    <label class="fld" style="margin-top:10px"><textarea class="in" id="dst" maxlength="150" dir="auto" placeholder="اكتب تعليقك أو سؤالك…" style="min-height:70px"></textarea></label>
    <p class="err" id="er" role="alert"></p><button class="btn block" id="dss">إرسال</button>`);
  $('cl').onclick=closeModal;
  const call=async body=>{let r;try{r=await sb.functions.invoke('q-comments',{body:Object.assign({qid:id},body)})}catch(e){r={error:{}}}const err=await fnCode(r);return {err:err,list:r.data&&r.data.comments,enabled:r.data&&r.data.enabled}};
  const render=list=>{
    const box=$('dsl');if(!box)return;
    box.innerHTML=list.length?list.map(m=>`<div class="item" style="--sc:${m.mine?'#1F5FBF':'#5A6B77'};align-items:flex-start;margin-bottom:8px"><div class="grow"><div class="nm" dir="auto" style="font-size:14px">${esc(m.n)} <small style="color:var(--muted);font-weight:400">· ${agoTxt(m.ts)}</small></div><div dir="auto" style="white-space:pre-wrap;word-break:break-word;font-size:15px">${esc(m.t)}</div></div>${m.can_del?`<button class="pill" data-dd="${esc(m.i)}">حذف</button>`:''}</div>`).join(''):'<p class="hint">لا توجد تعليقات بعد. كن أول من يعلّق.</p>';
    box.scrollTop=box.scrollHeight;
    CC[id]={n:list.length,t:Date.now()};ccPaint(id);
    box.querySelectorAll('[data-dd]').forEach(b=>b.onclick=async()=>{
      if(!(await askConfirm('حذف التعليق','سيُحذف هذا التعليق نهائياً.','احذف')))return;
      const r=await call({action:'delete',cid:b.dataset.dd});
      if(r.err||!r.list){toast('تعذر الحذف.');return}
      render(r.list);
    });
  };
  const lockAdd=()=>{const t=$('dst'),b=$('dss');if(t&&t.parentNode)t.parentNode.style.display='none';if(b){b.outerHTML='<p class="hint">إضافة التعليقات متوقفة مؤقتاً. يمكنك قراءة النقاش فقط.</p>'}};
  const r0=await call({action:'list'});
  if(!$('dsl'))return;
  if(r0.err||!r0.list){$('dsl').innerHTML=`<p class="err">${DISCERR[r0.err]||'تعذر تحميل النقاش. جرب مرة ثانية.'}</p>`}else render(r0.list);
  if(r0.enabled===false)lockAdd();
  if($('dss'))$('dss').onclick=async()=>{
    const t=($('dst').value||'').trim();if(!t){return}
    $('dss').disabled=true;$('er').textContent='';
    const r=await call({action:'add',text:t});
    if($('dss'))$('dss').disabled=false;
    if(r.err||!r.list){if($('er'))$('er').textContent=DISCERR[r.err]||'تعذر الإرسال. جرب مرة ثانية.';return}
    if($('dst'))$('dst').value='';render(r.list);
  };
}
/* ---------- طلب إضافة مادة ---------- */
function requestModal(spId){
  if(!Store.user){toast('سجّل دخولك أولاً لإرسال طلب.');return}
  const sp=spById(spId);
  showModal(`<button class="x" id="cl" aria-label="إغلاق">✕</button><h2>طلب إضافة مادة</h2>
    <p>ارسل لنا ملف المادة التي تريد دراستها (PDF أو صور) وسنضيفها للبرنامج ضمن اختصاص «${esc(sp.n)}».</p>
    <label class="fld"><span>اسم المادة</span><input class="in" id="rqn" maxlength="80" placeholder="مثال: أمراض الكلى"></label>
    <label class="fld"><span>ملاحظات (اختياري)</span><textarea class="in" id="rqt" dir="auto" maxlength="500" placeholder="أي تفاصيل تفيدنا"></textarea></label>
    <label class="fld"><span>الملف (PDF أو صور، حتى 50 ميغابايت)</span><input class="in" type="file" id="rqf" accept="application/pdf,image/*"></label>
    <p class="hint" style="margin-top:-4px">إذا كان الملف أكبر من 50 ميغابايت فأرسله لنا على تليكرام، على الرقم <b dir="ltr" class="mono">07764563070</b>.</p>
    <p class="err" id="rqe" role="alert"></p><button class="btn block" id="rqs">إرسال الطلب</button>`);
  $('cl').onclick=closeModal;
  $('rqs').onclick=async()=>{
    const f=$('rqf').files[0],nm=$('rqn').value.trim(),er=$('rqe');
    if(!nm){er.textContent='اكتب اسم المادة.';return}
    if(!f){er.textContent='اختر الملف أولاً.';return}
    if(!/^(application\/pdf|image\/(jpeg|png|webp|gif|heic|heif))$/.test(f.type||'')){er.textContent='يُقبل ملف PDF أو صورة فقط.';return}
    if(f.size>50*1024*1024){er.textContent='حجم الملف أكبر من 50 ميغابايت، أرسله لنا على تليكرام على الرقم 07764563070.';return}
    $('rqs').disabled=true;er.textContent='';$('rqs').textContent='جارٍ الرفع…';
    const ext=((f.name.match(/\.([A-Za-z0-9]{1,8})$/)||[])[1]||'bin').toLowerCase();
    const path=Store.user.id+'/'+Date.now()+'-'+Math.random().toString(36).slice(2,7)+'.'+ext;
    try{
      const u=await sb.storage.from('request-files').upload(path,f,{contentType:f.type||'application/octet-stream'});
      if(u.error)throw u.error;
      const r=await sb.from('subject_requests').insert({specialty_id:spId,subject_name:nm,note:$('rqt').value.trim()||null,file_path:path,file_name:f.name});
      if(r.error){try{await sb.storage.from('request-files').remove([path])}catch(x){}throw r.error}
      closeModal();toast('وصل طلبك، شكراً لك.');
    }catch(x){er.textContent='تعذر إرسال الطلب. تأكد من الاتصال وجرب مرة ثانية.';$('rqs').disabled=false;$('rqs').textContent='إرسال الطلب'}
  };
}
/* ---------- جلسة المراجعة ---------- */
let Q=[],qi=0,cur=null,answered=false,sess={},tId=null,tEnd=0,cardT=0,recT=0;
async function start(subj,sp,sy,o){
  const mode=(o&&o.mode)||F.mode||'smart';
  const subIds=Object.keys(Store.subs);
  const scoped=!subj&&!sp&&sy===undefined&&subIds.length>0&&(mode==='smart'||mode==='new');
  const showLoading=()=>{app.innerHTML=`<div class="top"><div class="brand">${brandHtml()}</div></div><p class="empty">جارٍ تحميل الأسئلة…</p>`};
  const mine=()=>{
    if(mode==='notes'){const set={};notedIds(sp).forEach(id=>{set[noteSubj(id)]=1});return Object.keys(set)}
    const src=mode==='saved'?S.starred:S.cards,set={};
    Object.keys(src).forEach(id=>{const e=src[id];if(e.s&&(mode==='saved'||e.box===0))set[e.s]=1});
    return Object.keys(set).filter(id=>Store.subjects.some(x=>x.id===id));
  };
  try{
    let ids=null;
    if(subj)ids=[subj];
    else if(sp)ids=subjectsOf(sp).map(x=>x.id);
    else if(scoped)ids=Store.subjects.filter(x=>subIds.includes(spOfSubj(x))).map(x=>x.id);
    else if(mode==='saved'||mode==='missed'||mode==='notes')ids=mine();
    if(ids)await ensureIndex(ids,showLoading);else await ensureFree(showLoading);
  }catch(e){if(!isKick(e)){toast('تعذر تحميل الأسئلة. جرب مرة ثانية.');home()}return}
  // أسئلة منقولة إلى مادة أخرى: نحمّل فهارس المواد المتاحة للعثور عليها بدل أن تبدو الجلسة فارغة
  if(mode==='missed'||mode==='saved'){
    try{
      const src=mode==='saved'?S.starred:S.cards,sc1={ex:F.exam,s:subj||undefined,sp:sp||undefined};
      const lost=Object.keys(src).some(id=>{const e=src[id];return e&&e.s&&(mode==='saved'||e.box===0)&&grpIn(e,sc1)&&!Store.idx[id]});
      if(lost){
        const fr=freeSubjects();
        await ensureIndex(Store.subjects.filter(x=>Store.isAdmin||Store.subs[spOfSubj(x)]||fr.includes(x.id)).map(x=>x.id),showLoading);
      }
    }catch(e){if(!isKick(e)){toast('تعذر تحميل الأسئلة. جرب مرة ثانية.');home()}return}
  }
  const now=Date.now();
  const inScope=Object.values(Store.idx).filter(c=>{
    if(scoped&&!subIds.includes(qSp(c)))return false;
    if(subj&&c.s!==subj)return false;
    if(sp&&qSp(c)!==sp)return false;
    if(sy!==undefined&&!inSys(c,sy))return false;
    if(F.exam!=='all'&&c.ex!==F.exam)return false;
    if(mode!=='notes'&&isSusp(c.id))return false;
    if(mode==='new')return !S.cards[c.id];
    if(mode==='missed'){const e=S.cards[c.id];return !!e&&e.box===0}
    if(mode==='saved')return !!S.starred[c.id];
    if(mode==='notes')return hasNoteC(c.id);
    return true;
  });
  // التكرار المتباعد: لا يظهر إلا السؤال الجديد أو الذي حان موعد مراجعته
  let pool=mode==='notes'?inScope.slice():inScope.filter(c=>isDueC(c.id,now));
  // حد الأسئلة الجديدة اليومي: المراجعات المستحقة لا تتأثر
  const remNew=newRemain();let limHit=false;
  if(mode!=='notes'){const olds=[],news=[];pool.forEach(c=>(S.cards[c.id]?olds:news).push(c));
   if(news.length>remNew){news.sort((a,b)=>(Number(a.t)||0)-(Number(b.t)||0));limHit=remNew===0;pool=olds.concat(news.slice(0,remNew))}}
  let nextDue=0;
  if(!pool.length)inScope.forEach(c=>{const e=S.cards[c.id];if(e&&e.due>now&&(!nextDue||e.due<nextDue))nextDue=e.due});
  const rank=c=>{const st=S.cards[c.id];if(!st)return 1;if(st.box===0)return 0;const R=st.sb?fR(Math.max(0,(now-st.lr)/864e5),st.sb):0.5;return 2+R};
  const byT=(a,b)=>(Number(a.t)||0)-(Number(b.t)||0);
  const sorted=mode==='notes'?pool.slice().sort((a,b)=>((N.q[b.id]||{}).u||0)-((N.q[a.id]||{}).u||0)):pool.slice().sort((a,b)=>mode==='new'?byT(a,b):(rank(a)-rank(b)||byT(a,b)));
  const capQ=mode==='notes'?50:10;
  // المراجعة التلقائية من الرئيسية: توزيع متساوٍ على الاختصاصات ثم على المواد داخل كل اختصاص، مع الحفاظ على أولوية الترتيب
  const balance=scoped&&(mode==='smart'||mode==='new');
  const balancedPick=list=>{
    const sps=[],spMap={};
    list.forEach(c=>{const k=qSp(c);let g=spMap[k];if(!g){g=spMap[k]={subs:[],m:{},i:0};sps.push(g)}let q=g.m[c.s];if(!q){q=g.m[c.s]=[];g.subs.push(q)}q.push(c)});
    const out=[];
    while(out.length<capQ){
      let any=false;
      for(const g of sps){
        if(out.length>=capQ)break;
        for(let t=0;t<g.subs.length;t++){
          const q=g.subs[(g.i+t)%g.subs.length];
          if(q.length){out.push(q.shift());g.i=(g.i+t+1)%g.subs.length;any=true;break}
        }
      }
      if(!any)break;
    }
    return out;
  };
  const pickQ=list=>balance?balancedPick(list):list.slice(0,capQ);
  // نص أسئلة هذه الجلسة فقط يُطلب من السيرفر
  let quota=false;
  Q=pickQ(sorted);
  if(Q.length){
    try{
      Q=await hydrate(Q,showLoading);
      if(HY.denied>0){   // انتهى حد اليوم من الأسئلة الجديدة عند السيرفر: تكمل الجلسة بالمراجعات المستحقة
        quota=true;
        Q=await hydrate(pickQ(sorted.filter(c=>S.cards[c.id]||Store.qmap[c.id])),showLoading);
      }
    }catch(e){if(!isKick(e)){toast('تعذر تحميل الأسئلة. جرب مرة ثانية.');home()}return}
  }
  const st=stats({s:subj||undefined,sp:sp||undefined,sy:sy,ex:F.exam});
  sess={ok:0,n:0,sec:0,rq:{},locked:(scoped||mode==='saved'||mode==='missed'||mode==='notes')?0:st.locked,subj:subj,sp:sp,sy:sy,mode:mode,next:nextDue,lim:!Q.length&&limHit&&!quota,quota:!Q.length&&quota};
  qi=0;
  Q.length?showCard():summary();
}
const starBtn=c=>`<button class="star${S.starred[c.id]?' on':''}" data-star="${esc(c.id)}" aria-label="حفظ السؤال">${S.starred[c.id]?'★':'☆'}</button>`;
function toggleStar(id){
  const c=Store.qmap[id];if(!c)return;
  if(S.starred[id]){delete S.starred[id];S.starDel[id]=Date.now()}else{S.starred[id]={s:c.s,sy:c.sy||null,ex:c.ex,t:Date.now()};delete S.starDel[id]}
  save();
  const on=!!S.starred[id];
  app.querySelectorAll('[data-star]').forEach(b=>{if(b.dataset.star===id){b.className='star'+(on?' on':'');b.textContent=on?'★':'☆'}});
  app.querySelectorAll('.qtools [data-tb="star"]').forEach(b=>{if(b.dataset.id===id){b.classList.toggle('on',on)}});
}
function bindStars(){app.querySelectorAll('[data-star]').forEach(b=>{b.onclick=e=>{if(e&&e.stopPropagation)e.stopPropagation();toggleStar(b.dataset.star)}})}
function tagsHtml(ns){
  const sub=subjOf(cur.s);
  return `<div class="tags"><span class="tag s">${esc(sub.n)}</span>${(()=>{const y=cur.sy?Store.systems.find(z=>z.id===cur.sy):null;return y?`<span class="tag">${esc(y.n)}</span>`:''})()}${cur.y?`<span class="tag">${ar(cur.y)}</span>`:''}${ns?'':starBtn(cur)}</div>`;
}
function optsHtml(mode,picked){
  return `<ul class="opts">`+cur.o.map((t,i)=>{
    let cls='opt';
    if(mode==='back'){if(i===cur.a)cls+=' good';else if(i===picked)cls+=' bad'}
    const dr=dirOf(t),inner=`<span class="l">${LET[i]}</span><span class="t">${esc(t)}</span>`;
    return mode==='front'
      ?`<li><button class="${cls}${skCls(cur,i)}" dir="${dr}" data-i="${i}">${inner}</button></li>`
      :`<li><div class="${cls}" dir="${dr}">${inner}</div></li>`;
  }).join('')+`</ul>`+(mode==='back'?'<div class="chs" id="chs"></div>':(lsGet('bc_sk_tip')?'':'<p class="hint sktip">💡 اضغط مطولاً على أي خيار لاستبعاده قبل أن تجيب.</p>'));
}
function showCard(){
  view='study';
  cur=Q[qi];answered=false;rated=false;cardT=Date.now();saveResume(qi);
  const sub=subjOf(cur.s);
  app.innerHTML=`
  <div class="sbar"><button class="back" id="bk" aria-label="رجوع"><span>تراجع</span><span class="ba">${ico('chev')}</span></button>
    <div class="prog"><div class="bar"><i style="width:${Math.round(100*qi/Q.length)}%"></i></div></div>
    <span class="pill"><bdi dir="ltr">${ar(Math.min(qi+1,Q.length))} / ${ar(Q.length)}</bdi></span></div>
  <div class="tbar" id="tb" ${S.timer?'':'hidden'}><i id="ti"></i></div>
  <div class="scene" style="--sc:${safeC(sub.c)}"><div class="card" id="card">
    <section class="face front" aria-label="السؤال">${tagsHtml(1)}${undoHtml()}
      <p class="q" dir="${dirOf(cur.q)}">${hlHtml(cur,'q')}</p>${imgHtml(cur)}${toolsHtml(cur)}${optsHtml('front')}
      <button class="btn line block" id="rv">اعرض الجواب</button>${aiPreHtml(cur)}
    </section>
    <section class="face back" aria-live="polite" id="backf"></section>
  </div></div>`;
  $('bk').onclick=home;
  {const pi=app.querySelector('.prog .bar i');if(pi&&!noMotion()){const to=pi.style.width;pi.style.width=Math.round(100*Math.max(0,qi-1)/Q.length)+'%';void pi.offsetWidth;requestAnimationFrame(()=>{pi.style.width=to})}}
  bindStars();bindTools();bindAiPre(cur);
  {const ub=$('undo');if(ub)ub.onclick=undoLast}
  app.querySelectorAll('.opt').forEach(b=>b.onclick=()=>pick(+b.dataset.i));
  $('rv').onclick=()=>reveal();
  if(S.timer)startTimer();
}
const suspHtml=c=>`<button class="rlink" type="button" data-susp="${esc(c.id)}">${isSusp(c.id)?'✓ السؤال معلّق، اضغط لإعادته للمراجعة':'تعليق هذا السؤال (لن يظهر في المراجعة)'}</button>`;
function toggleSusp(id){
  if(!S.susp)S.susp={};
  const was=isSusp(id);
  S.susp[id]=was?-Date.now():Date.now();
  save();
  document.querySelectorAll('[data-susp]').forEach(b=>{if(b.dataset.susp===id)b.textContent=was?'تعليق هذا السؤال (لن يظهر في المراجعة)':'✓ السؤال معلّق، اضغط لإعادته للمراجعة'});
  toast(was?'أُعيد السؤال إلى المراجعة':'عُلّق السؤال ولن يظهر في المراجعة');
}
document.addEventListener('click',e=>{const b=e.target&&e.target.closest&&e.target.closest('[data-susp]');if(b)toggleSusp(b.dataset.susp)});
function flip(html){
  flipAt=Date.now();
  $('backf').innerHTML=tagsHtml(1)+`<p class="q" dir="${dirOf(cur.q)}">${hlHtml(cur,'q')}</p>${imgHtml(cur)}`+toolsHtml(cur)+html+suspHtml(cur);
  $('card').classList.add('flipped');
  bindStars();bindReports();bindAi();bindTools();
  choiceFill(cur);
}
function answerHtml(){
  const t=cur.o[cur.a];
  return `<div class="ans"><b>الجواب الصحيح</b><ul class="opts"><li><div class="opt good" dir="${dirOf(t)}"><span class="l">${LET[cur.a]}</span><span class="t">${esc(t)}</span></div></li></ul></div>`;
}
const backOpts=picked=>optsHtml('back',picked);
const RREASONS=[['wrong_answer','الجواب الصحيح غير صحيح'],['explanation','الشرح خاطئ أو ناقص'],['typo','خطأ إملائي أو لغوي'],['unclear','السؤال أو الخيارات غير واضحة'],['other','سبب آخر']];
const reportLinkHtml=c=>`<button class="rlink" type="button" data-report="${esc(c.id)}">بلّغ عن خطأ بهذا السؤال</button>`;
function bindReports(){app.querySelectorAll('[data-report]').forEach(b=>{b.onclick=()=>reportModal(b.dataset.report)})}
function reportModal(id){
  const c=Store.qmap[id];if(!c)return;
  if(!Store.user){toast('سجّل دخولك بحسابك لإرسال تبليغ');return}
  showModal(`<button class="x" id="cl" aria-label="إغلاق">✕</button><h2>بلّغ عن خطأ</h2>
    <p class="hint" dir="${dirOf(c.q)}">${esc(c.q.length>110?c.q.slice(0,110)+'…':c.q)}</p>
    <label class="fld"><span>نوع المشكلة</span><select class="in" id="rr">${RREASONS.map(r=>`<option value="${r[0]}">${r[1]}</option>`).join('')}</select></label>
    <label class="fld"><span>ملاحظات (اختياري)</span><textarea class="in" id="rn" dir="auto" maxlength="500" placeholder="اكتب ما الخطأ وما الصحيح برأيك"></textarea></label>
    <p class="err" id="er" role="alert"></p>
    <button class="btn block" id="rs">إرسال التبليغ</button>`);
  $('cl').onclick=closeModal;
  $('rs').onclick=async()=>{
    $('rs').disabled=true;
    const r=await sb.rpc('report_question',{p_question:id,p_reason:$('rr').value,p_note:$('rn').value.trim()});
    if(r.error){
      if(/session_replaced/.test(r.error.message)){await kick();return}
      $('er').textContent=/rate_limited/.test(r.error.message)?'أرسلت تبليغات كثيرة اليوم. جرب غداً.':'تعذر إرسال التبليغ. جرب مرة ثانية.';
      $('rs').disabled=false;return;
    }
    closeModal();toast('شكراً، وصل تبليغك وسنراجع السؤال');
  };
}
function expHtml(){return (cur.e?`<div class="exp" dir="${dirOf(cur.e)}"><b>الشرح</b>${hlHtml(cur,'e')}</div>`:'')+noteHtml(cur)+aiHtml(cur)}
let pendSec=0,rated=false;
const RLAB={1:'نسيتها',2:'صعب',3:'جيد',4:'سهل جداً'};
function fmtIv(days){
  const m=days*1440;
  if(m<60){const n=Math.max(1,Math.round(m));return n===1?'دقيقة':n===2?'دقيقتان':ar(n)+' '+(n<=10?'دقائق':'دقيقة')}
  const h=m/60;
  if(h<24){const n=Math.round(h);return n===1?'ساعة':n===2?'ساعتان':ar(n)+' '+(n<=10?'ساعات':'ساعة')}
  const d=Math.round(days);
  if(d<30)return d===1?'يوم':d===2?'يومان':ar(d)+' '+(d<=10?'أيام':'يوماً');
  const mo=Math.round(d/30);
  if(mo<12)return mo===1?'شهر':mo===2?'شهران':ar(mo)+' '+(mo<=10?'أشهر':'شهراً');
  return ar(Math.round(d/36.5)/10)+' سنة';
}
function ivFor(c,g){const now=Date.now(),t=fsrsApply(Object.assign({},S.cards[c.id]||{}),g,now);return fmtIv((t.due-now)/864e5)}
function rateHtml(gs){
  return `<p class="hint" style="margin:8px 0 6px">كيف كان السؤال؟ تقييمك يحدد موعد عودته إليك.</p><div class="rate">`+gs.map(g=>`<button class="btn rb g${g}" data-g="${g}"><b>${RLAB[g]}</b><small>${ivFor(cur,g)}</small></button>`).join('')+`</div>`;
}
function bindRate(){app.querySelectorAll('[data-g]').forEach(b=>{b.onclick=()=>rate(+b.dataset.g)})}
function rate(g){if(rated)return;rated=true;record(g>1,g,pendSec);next()}
let revBusy=false;
const revMsg=e=>e&&e.quota?QUOTA_MSG:NET_MSG;
// الجواب يُطلب من السيرفر لحظة الإجابة، فالاختيار ينتظر الرد قبل أن تنقلب البطاقة
async function pick(i){
  if(answered||revBusy)return;
  const c=cur,first=!S.cards[c.id],sec=Math.min(180,Math.round((Date.now()-cardT)/1000));
  const btn=app.querySelectorAll('.front .opt')[i];
  revBusy=true;stopTimer();if(btn)btn.classList.add('sel','wait');revLoading(true);
  try{await qReveal(c,i,first)}
  catch(e){
    revBusy=false;revLoading(false);
    if(isKick(e)||cur!==c||view!=='study')return;
    if(btn)btn.classList.remove('sel','wait');
    toast(revMsg(e));if(S.timer)startTimer();
    return;
  }
  revBusy=false;
  if(cur!==c||view!=='study')return;   // غادر الطالب السؤال أثناء انتظار الجواب
  answered=true;rated=false;
  ChF={id:c.id,first:first,opt:i};
  const ok=i===c.a;pendSec=sec;
  if(!ok){
    rated=true;record(false,1,pendSec);
    flip(`<p class="res no">الجواب خاطئ</p>${optsHtml('back',i)}${expHtml()}
    <button class="btn block" id="nx">${qi+1<Q.length?'السؤال التالي':'نهاية الجلسة'}</button>`);
    $('nx').onclick=next;
    $('nx').focus({preventScroll:true});
    return;
  }
  flip(`<p class="res ok">جوابك صحيح</p>${optsHtml('back',i)}${expHtml()}${rateHtml([2,3,4])}`);
  bindRate();
}
async function reveal(timeout){
  if(answered||revBusy)return;
  const c=cur,sec=Math.min(180,Math.round((Date.now()-cardT)/1000));
  const rv=$('rv');
  revBusy=true;stopTimer();if(rv)rv.disabled=true;revLoading(true);
  try{await qReveal(c,null,false)}
  catch(e){
    revBusy=false;revLoading(false);
    if(isKick(e)||cur!==c||view!=='study')return;
    if(rv)rv.disabled=false;
    toast(revMsg(e));
    return;
  }
  revBusy=false;
  if(cur!==c||view!=='study')return;
  answered=true;rated=false;pendSec=sec;
  if(timeout){
    rated=true;record(false,1,pendSec);
    flip(`<p class="res no">انتهى الوقت</p>${backOpts(-1)}${expHtml()}
      <button class="btn block" id="nx">${qi+1<Q.length?'السؤال التالي':'نهاية الجلسة'}</button>`);
    $('nx').onclick=next;
  }else{
    flip(`<p class="res mid">كيف كان تذكّرك؟</p>${backOpts(-1)}${expHtml()}${rateHtml([1,2,3,4])}`);
    bindRate();
  }
}
let UNDO=null;
function undoHtml(){return UNDO&&sess&&UNDO.qi===qi-1&&UNDO.sess===sess?'<button class="rlink" type="button" id="undo">↩ تراجع عن تقييم السؤال السابق</button>':''}
function undoLast(){
  const u=UNDO;if(!u||!sess||u.sess!==sess||u.qi!==qi-1||view!=='study')return;
  UNDO=null;
  if(u.prev)S.cards[u.id]=u.prev;else delete S.cards[u.id];
  if(S.log.length&&S.log[S.log.length-1].t===u.t)S.log.pop();
  const d=S.days[u.day];
  if(d){d.n=Math.max(0,d.n-1);if(u.ok)d.ok=Math.max(0,d.ok-1);d.sec=Math.max(0,d.sec-u.sec);const sj=d.subj&&d.subj[u.s];if(sj){sj.n=Math.max(0,sj.n-1);if(u.ok)sj.ok=Math.max(0,sj.ok-1)}}
  S.total=Math.max(0,(S.total||0)-1);
  sess.n=Math.max(0,sess.n-1);if(u.ok)sess.ok=Math.max(0,sess.ok-1);sess.sec=Math.max(0,(sess.sec||0)-u.sec);
  if(u.wasNew&&S.newDay&&S.newDay.d===dk(new Date()))S.newDay.n=Math.max(0,S.newDay.n-1);
  if(u.rq&&Q.length-1>u.qi&&Q[Q.length-1].id===u.id){Q.pop();delete sess.rq[u.id]}
  qi=u.qi;save();showCard();
}
function record(ok,grade,sec){
  const now=Date.now();
  UNDO={id:cur.id,prev:S.cards[cur.id]?Object.assign({},S.cards[cur.id]):null,ok:!!ok,sec:sec,t:now,day:dk(new Date()),s:cur.s,qi:qi,sess:sess,wasNew:!S.cards[cur.id],rq:grade===1&&!sess.rq[cur.id]};
  const st=fsrsApply(Object.assign({},S.cards[cur.id]||{}),grade,now);
  st.s=cur.s;st.sy=cur.sy||null;st.ex=cur.ex;
  addStat(cur,ok,sec);recT=now;
  if(!S.cards[cur.id])newDayRec().n++;
  S.cards[cur.id]=st;
  S.log.push({t:now,ok});if(S.log.length>300)S.log=S.log.slice(-300);
  sess.n++;if(ok)sess.ok++;
  if(grade===1&&!sess.rq[cur.id]){sess.rq[cur.id]=1;Q.push(cur)}
  saveResume(qi+1);
}
function next(){
  if(recT){addSec(Math.min(120,Math.round((Date.now()-recT)/1000)));recT=0}
  qi++;qi<Q.length?showCard():summary();
}
function startTimer(){
  stopTimer();tEnd=Date.now()+60000;
  const ti=$('ti');
  tId=setInterval(()=>{
    const left=tEnd-Date.now();
    if(ti)ti.style.transform=`scaleX(${Math.max(0,left/60000)})`;
    if(left<=0)reveal(true);
  },100);
}
function stopTimer(){if(tId){clearInterval(tId);tId=null}}
function summary(){
  view='summary';stopTimer();S.resume=null;liveMark(false);save();lbFlush();ptFlush();
  const pct=sess.n?Math.round(100*sess.ok/sess.n):0;
  app.innerHTML=`
  <div class="top"><div class="brand">نهاية الجلسة</div></div>
  <div class="sum">
    ${sess.n?`<div class="big"><bdi dir="ltr"><span data-cnt="${sess.ok}" data-dl="250">${ar(sess.ok)}</span> / ${ar(sess.n)}</bdi></div><p>إجابات صحيحة، نسبة ${ar(pct)}%، والوقت ${fmtT(sess.sec||0)}. الأسئلة التي أخطأت بها تعود لك أول بأول.</p>`
    :sess.quota?`<p>${QUOTA_MSG}</p>`
    :sess.lim?`<p>أنجزت هدفك من الأسئلة الجديدة اليوم (${ar(newDayRec().n)} من ${ar(newLimit()+(newDayRec().x||0))}). المراجعات المستحقة ستظهر لك عند حلول موعدها.</p>`
    :sess.next?`<p>ما عندك أسئلة مستحقة للمراجعة الآن بهذا الاختيار. أقرب موعد بعد ${fmtIv((sess.next-Date.now())/864e5)}.</p>`
    :`<p>${({new:'لا توجد أسئلة جديدة بهذا الاختيار.',missed:'ما عندك أسئلة خاطئة بهذا الاختيار. أحسنت!',saved:'ما حفظت أي سؤال بهذا الاختيار بعد. اضغط على النجمة ☆ على أي سؤال لحفظه.',notes:'لا توجد ملاحظات أو تظليلات بهذا الاختصاص بعد. اضغط على ✎ أو 🖍 أثناء أي سؤال.'})[sess.mode]||'لا توجد أسئلة مفتوحة بهذا الاختيار.'}</p>`}
    ${sess.locked?`<div class="gate">${ar(sess.locked)} سؤال إضافي بهذا الاختيار متاح للمشتركين فقط.</div><button class="btn block" id="sub">اشترك وافتح كل الأسئلة</button>`:''}
    ${sess.lim||sess.quota?'<button class="btn block" id="more">أضف 10 أسئلة جديدة اليوم</button>':''}
    <button class="btn ${sess.locked?'line':''} block" id="again">جلسة جديدة</button>
    <button class="btn line block" id="pg">تقريري</button>
    <button class="btn line block" id="hm">الرئيسية</button>
  </div>`;
  $('pg').onclick=progress;
  $('again').onclick=()=>sess.mode==='custom'?customTest():sess.mode==='search'?searchScreen():start(sess.subj,sess.sp,sess.sy,{mode:sess.mode});
  const mre=$('more');if(mre)mre.onclick=async()=>{mre.disabled=true;let r;try{r=await sb.rpc('q_more')}catch(e){r={error:{}}}if(r.error){mre.disabled=false;if(/bonus_limit/.test(String(r.error.message||''))){toast('وصلت للحد الأقصى من الأسئلة الإضافية لليوم. جرب غداً.');return}srvErr(r.error);toast(NET_MSG);return}newDayRec().x=(newDayRec().x||0)+10;save();start(sess.subj,sess.sp,sess.sy,{mode:sess.mode})};
  $('hm').onclick=home;
  const sbb=$('sub');if(sbb)sbb.onclick=paywall;
}

/* ---------- الامتحان التجريبي ---------- */
let X=null;
function stopExamTimer(){if(X&&X.tid){clearInterval(X.tid);X.tid=null}}
const mmss=sec=>{sec=Math.max(0,Math.floor(sec));const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;return (h?h+':'+pad2(m):m)+':'+pad2(s)};
function examAvail(){
  const subIds=Object.keys(Store.subs);
  if(F.sj)return stats({s:F.sj,ex:F.exam}).open;
  if(F.sp)return stats({sp:F.sp,ex:F.exam}).open;
  if(subIds.length)return subIds.reduce((t,id)=>t+stats({sp:id,ex:F.exam}).open,0);
  return stats({ex:F.exam}).open;
}
function examLabel(){return F.sj?subjOf(F.sj).n:(F.sp?spById(F.sp).n:(Object.keys(Store.subs).length?'اختصاصاتي':'الأسئلة المفتوحة'))}
function examSetup(){
  const avail=examAvail();
  const sizes=[10,20,30,40,60].filter(n=>n<=Math.max(avail,10));
  showModal(`<button class="x" id="cl" aria-label="إغلاق">✕</button><h2>امتحان تجريبي</h2>
    <p>من: <b>${esc(examLabel())}</b>. المتاح: ${ar(avail)} سؤال.</p>
    <p class="hint">لا يظهر الجواب ولا الشرح حتى تنهي الامتحان، ثم تحصل على النتيجة والتحليل.</p>
    <label class="fld"><span>عدد الأسئلة</span><select class="in" id="xn">${sizes.map(n=>`<option value="${n}" ${n===20?'selected':''}>${ar(n)}</option>`).join('')}</select></label>
    <label class="fld"><span>الوقت لكل سؤال</span><select class="in" id="xt"><option value="60" selected>دقيقة</option><option value="90">دقيقة ونصف</option><option value="120">دقيقتان</option></select></label>
    <p class="err" id="er" role="alert"></p>
    <button class="btn block" id="xgo">ابدأ الامتحان</button>`);
  $('cl').onclick=closeModal;
  $('xgo').onclick=()=>{
    const n=parseInt($('xn').value,10),per=parseInt($('xt').value,10);
    closeModal();examStart(n||20,per||60);
  };
}
async function examStart(n,per){
  const subIds=Object.keys(Store.subs);
  const scoped=!F.sj&&!F.sp&&subIds.length>0;
  const showLoading=()=>{app.innerHTML=`<div class="top"><div class="brand">${brandHtml()}</div></div><p class="empty">جارٍ تحميل الأسئلة…</p>`};
  try{
    if(F.sj)await ensureIndex([F.sj],showLoading);
    else if(F.sp)await ensureIndex(subjectsOf(F.sp).map(x=>x.id),showLoading);
    else if(scoped)await ensureIndex(Store.subjects.filter(x=>subIds.includes(spOfSubj(x))).map(x=>x.id),showLoading);
    else await ensureFree(showLoading);
  }catch(e){if(!isKick(e)){toast('تعذر تحميل الأسئلة. جرب مرة ثانية.');home()}return}
  const pool=Object.values(Store.idx).filter(c=>(!scoped||subIds.includes(qSp(c)))&&(!F.sj||c.s===F.sj)&&(!F.sp||qSp(c)===F.sp)&&(F.exam==='all'||c.ex===F.exam)&&!isSusp(c.id));
  if(!pool.length){toast('لا توجد أسئلة مفتوحة بهذا الاختيار.');home();return}
  const a=pool.slice();
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=a[i];a[i]=a[j];a[j]=t}
  const ents=a.slice(0,Math.min(n,a.length));
  // نص أسئلة هذا الامتحان فقط يُطلب من السيرفر، بدون أجوبة
  let qs;
  try{
    qs=await hydrate(ents,showLoading);
    if(HY.denied>0&&qs.length<ents.length){   // انتهى حد اليوم من الأسئلة الجديدة: يُكمَل الامتحان من أسئلة سبق أن حللتها
      const got=new Set(qs.map(q=>q.id));
      const extra=a.filter(c=>!got.has(c.id)&&S.cards[c.id]).slice(0,ents.length-qs.length);
      if(extra.length)qs=qs.concat(await hydrate(extra,showLoading));
      if(qs.length<ents.length)toast(qs.length?'وصلت للحد اليومي من الأسئلة الجديدة، فالامتحان '+ar(qs.length)+' سؤالاً فقط.':QUOTA_MSG);
    }
  }catch(e){if(!isKick(e)){toast('تعذر تحميل الأسئلة. جرب مرة ثانية.');home()}return}
  if(!qs.length){if(!HY.denied)toast('لا توجد أسئلة مفتوحة بهذا الاختيار.');home();return}
  X={qs:qs,ans:qs.map(()=>-1),i:0,t0:Date.now(),per:per,limit:qs.length*per,label:examLabel(),tid:null,res:null,flag:{}};
  examShow();
  X.tid=setInterval(examTick,1000);
}
function examTick(){
  if(!X||X.res)return;
  const left=X.limit-Math.floor((Date.now()-X.t0)/1000);
  const el=$('xtm');
  if(el){el.textContent=mmss(left);el.className='pill xtm'+(left<=60?' low':'')}
  if(left<=0)examFinish(true);
}
function palHtml(){return X.qs.map((q,i)=>`<button data-p="${i}" class="${X.ans[i]>=0?'done':''}${i===X.i?' curr':''}${X.flag[i]?' flag':''}" aria-label="سؤال ${i+1}">${ar(i+1)}</button>`).join('')}
function examShow(){
  view='exam';stopTimer();saveExamResume();
  const c=X.qs[X.i];cur=c;
  const sub=subjOf(c.s),left=X.limit-Math.floor((Date.now()-X.t0)/1000),n=X.qs.length;
  const opts=`<ul class="opts">`+c.o.map((t,i)=>`<li><button class="opt${X.ans[X.i]===i?' sel':''}${skCls(c,i)}" dir="${dirOf(t)}" data-i="${i}"><span class="l">${LET[i]}</span><span class="t">${esc(t)}</span></button></li>`).join('')+`</ul>`;
  app.innerHTML=`
  <div class="sbar"><button class="back" id="xq" aria-label="خروج"><span>تراجع</span><span class="ba">${ico('chev')}</span></button>
    <span class="pill"><bdi dir="ltr">${ar(X.i+1)} / ${ar(n)}</bdi></span><span class="pill xtm${left<=60?' low':''}" id="xtm">${mmss(left)}</span>
    <button class="btn xfin" id="xf">إنهاء</button></div>
  <div class="scene" style="--sc:${safeC(sub.c)}"><div class="card"><section class="face front" aria-label="السؤال">${tagsHtml()}
    <p class="q" dir="${dirOf(c.q)}">${fmt(c.q)}</p>${imgHtml(c)}${opts}</section></div></div>
  <div class="acts" style="margin-top:12px"><button class="btn line" id="xp" ${X.i===0?'disabled':''}>السابق</button><button class="btn line${X.flag[X.i]?' flagon':''}" id="xfl" aria-pressed="${!!X.flag[X.i]}" style="flex:0 0 auto;padding:12px 14px">${X.flag[X.i]?'🚩 معلَّم':'🚩 علّم'}</button><button class="btn" id="xnx">${X.i===n-1?'مراجعة الإجابات':'التالي'}</button></div>
  <div class="pal" id="pal">${palHtml()}</div>`;
  bindStars();
  app.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{
    const i=+b.dataset.i;X.ans[X.i]=(X.ans[X.i]===i)?-1:i;saveExamResume();
    app.querySelectorAll('.opt').forEach(o=>{o.className='opt'+(X.ans[X.i]===+o.dataset.i?' sel':'')+skCls(c,+o.dataset.i)});
    $('pal').innerHTML=palHtml();bindPal();
  });
  $('xp').onclick=()=>{if(X.i>0){X.i--;examShow()}};
  $('xnx').onclick=()=>{if(X.i<n-1){X.i++;examShow()}else examFinishAsk()};
  $('xf').onclick=examFinishAsk;
  {const fl=$('xfl');fl.onclick=()=>{if(X.flag[X.i])delete X.flag[X.i];else X.flag[X.i]=1;saveExamResume();const on=!!X.flag[X.i];fl.classList.toggle('flagon',on);fl.setAttribute('aria-pressed',on);fl.textContent=on?'🚩 معلَّم':'🚩 علّم';$('pal').innerHTML=palHtml();bindPal()}}
  $('xq').onclick=async()=>{if(await askConfirm('الخروج من الامتحان','ستخسر إجاباتك في هذا الامتحان ولن تُحتسب.','اخرج')){stopExamTimer();X=null;S.resumeExam=null;save();home()}};
  bindPal();
}
function bindPal(){app.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{X.i=+b.dataset.p;examShow()})}
async function examFinishAsk(){
  const un=X.ans.filter(a=>a<0).length,fl=Object.keys(X.flag||{}).length,pp=[];
  if(un)pp.push(ar(un)+' '+(un===1?'سؤال':'أسئلة')+' بدون إجابة');
  if(fl)pp.push(ar(fl)+' '+(fl===1?'سؤال معلَّم':'أسئلة معلَّمة')+' للمراجعة');
  const ok=await askConfirm('إنهاء الامتحان',pp.length?'عندك '+pp.join('، و')+'. هل تريد الإنهاء؟':'هل تريد إنهاء الامتحان وعرض النتيجة؟','أنهِ');
  if(ok)examFinish(false);
}
// الأجوبة والشروح تصل من السيرفر دفعة واحدة عند إنهاء الامتحان
async function examFinish(timeout){
  if(!X||X.res||X.busy)return;
  if(timeout&&modal.innerHTML.trim())closeModal();   // انتهى الوقت ونافذة التأكيد مفتوحة
  stopExamTimer();
  const x=X;
  if(!x.fin)x.fin={timeout:!!timeout,elapsed:Math.min(x.limit,Math.floor((Date.now()-x.t0)/1000))};
  x.busy=true;view='examwait';
  app.innerHTML=`<div class="top"><div class="brand">${brandHtml()}</div></div><p class="empty">جارٍ تصحيح الامتحان…</p>`;
  const firsts=x.qs.map(q=>!S.cards[q.id]);
  try{
    for(let i=0;i<x.qs.length;i+=50){
      const part=x.qs.slice(i,i+50);
      const r=await sb.rpc('q_answer_many',{p_ids:part.map(q=>q.id),p_opts:x.ans.slice(i,i+50).map(a=>a>=0?a:-1),p_first:firsts.slice(i,i+50)});
      if(r.error){srvErr(r.error);throw r.error}
      (Array.isArray(r.data)?r.data:[]).forEach(d=>{
        const k=x.qs.findIndex(q=>q.id===d.id);if(k<0||typeof d.a!=='number')return;
        const q=x.qs[k];q.a=d.a;q.e=d.e||'';
      });
    }
  }catch(e){
    x.busy=false;
    if(isKick(e)||X!==x)return;
    app.innerHTML=`<div class="top"><div class="brand">الامتحان التجريبي</div></div>
    <div class="sum"><p>تعذر الاتصال بالسيرفر لتصحيح الامتحان. إجاباتك محفوظة على جهازك، تأكد من الإنترنت ثم أعد المحاولة.</p>
    <button class="btn block" id="xrt">أعد المحاولة</button><button class="btn line block" id="xhm">الرئيسية</button></div>`;
    $('xrt').onclick=()=>examFinish(x.fin.timeout);
    $('xhm').onclick=home;
    return;
  }
  x.busy=false;
  if(X!==x)return;
  // سؤال لم يُرجع السيرفر جوابه (حُذف أثناء الامتحان مثلاً) يُستبعد من النتيجة
  const keep=x.qs.map((q,i)=>typeof q.a==='number'?i:-1).filter(i=>i>=0);
  if(keep.length!==x.qs.length){x.ans=keep.map(i=>x.ans[i]);x.qs=keep.map(i=>x.qs[i]);x.i=0}
  if(!x.qs.length){X=null;S.resumeExam=null;save();toast('تعذر تصحيح هذا الامتحان.');home();return}
  timeout=x.fin.timeout;
  const n=X.qs.length,elapsed=x.fin.elapsed;
  const answered=X.ans.filter(a=>a>=0).length,each=answered?Math.min(180,Math.round(elapsed/answered)):0;
  let ok=0,wrong=0,skip=0;const by={};
  X.qs.forEach((q,i)=>{
    const a=X.ans[i],b=by[q.s]||(by[q.s]={n:0,ok:0,skip:0});b.n++;
    if(a<0){skip++;b.skip++;return}
    const good=a===q.a;
    if(good){ok++;b.ok++}else wrong++;
    const st=fsrsApply(Object.assign({},S.cards[q.id]||{}),good?3:1,Date.now());
    st.s=q.s;st.sy=q.sy||null;st.ex=q.ex;
    S.cards[q.id]=st;
    S.log.push({t:Date.now(),ok:good});
    addStat(q,good,each);
  });
  if(S.log.length>300)S.log=S.log.slice(-300);
  X.res={ok:ok,wrong:wrong,skip:skip,sec:elapsed,by:by,timeout:!!timeout};
  S.resumeExam=null;
  S.exams.unshift({t:Date.now(),n:n,ok:ok,wrong:wrong,skip:skip,sec:elapsed,label:X.label,ids:X.qs.map(q=>q.id),ans:X.ans.map(a=>a<0?'x':String(a)).join(''),fl:Object.keys(X.flag||{}).map(Number)});
  S.exams=S.exams.slice(0,20);
  checkBadges();
  save();
  lbFlush();
  examResult();
}
function examResult(){
  XBack=null;view='examres';
  const r=X.res,n=X.qs.length,pctv=Math.round(100*r.ok/n);
  const subs=Object.keys(r.by).map(id=>({id:id,n:r.by[id].n,ok:r.by[id].ok,p:Math.round(100*r.by[id].ok/r.by[id].n)})).sort((a,b)=>a.p-b.p);
  app.innerHTML=`
  <div class="top"><div class="brand">نتيجة الامتحان<small>${esc(X.label)}</small></div></div>
  <div class="sum">
    ${r.timeout?'<div class="banner">انتهى الوقت وتم إنهاء الامتحان تلقائياً.</div>':''}
    <div class="big"><span data-cnt="${pctv}" data-suf="%" data-dl="250">${ar(pctv)}%</span></div>
    <p>${ar(r.ok)} صحيحة من ${ar(n)}، و${ar(r.wrong)} خاطئة، و${ar(r.skip)} بدون إجابة. الوقت: ${fmtT(r.sec)} من ${fmtT(X.limit)}.</p>
    <button class="btn block" id="xshare">شارك نتيجتك</button>
    ${(r.wrong+r.skip)?`<button class="btn line block" id="rvw">مراجعة الأخطاء</button>`:''}
    <button class="btn line block" id="rva">مراجعة كل الأسئلة</button>
    <button class="btn line block" id="xnew">امتحان جديد</button>
    <button class="btn line block" id="hm">الرئيسية</button>
  </div>
  <h3 class="sec">حسب المادة</h3>
  ${subs.map(x=>{const sj=subjOf(x.id);return `<div class="item" style="--sc:${safeC(sj.c)}"><div class="grow"><div class="nm">${esc(sj.n)}</div><div class="sub">${ar(x.ok)} من ${ar(x.n)}، ${ar(x.p)}% صح</div><div class="bar"><i style="width:${x.p}%"></i></div></div></div>`}).join('')}`;
  $('xshare').onclick=()=>shareCard('exam');
  const w=$('rvw');if(w)w.onclick=()=>examReview('bad');
  $('rva').onclick=()=>examReview('all');
  $('xnew').onclick=()=>{X=null;examSetup()};
  $('hm').onclick=()=>{X=null;home()};
  window.scrollTo(0,0);
}
let XR='bad',XBack=null;
// يعيد فتح مراجعة امتحان سابق من التقرير: الأسئلة والأجوبة تُجلب من السيرفر ثانية، واختياراتك محفوظة عندك
async function examReopen(t){
  const ex=(S.exams||[]).find(e=>e.t===t);
  if(!ex||!ex.ids||!ex.ids.length){toast('تفاصيل هذا الامتحان غير محفوظة (امتحان قديم).');return}
  if(X&&!X.res&&X.tid){toast('أنهِ امتحانك الحالي أولاً.');return}
  const showLoading=()=>{app.innerHTML=`<div class="top"><div class="brand">${brandHtml()}</div></div><p class="empty">جارٍ تحميل الامتحان…</p>`};
  showLoading();
  let got;
  try{
    got=await hydrate(ex.ids.map(id=>Store.idx[id]||{id:id}),showLoading);
    const by={};got.forEach(q=>{by[q.id]=q});
    const ids=ex.ids.filter(id=>by[id]);
    for(let i=0;i<ids.length;i+=50){
      const part=ids.slice(i,i+50);
      const r=await sb.rpc('q_answer_many',{p_ids:part,p_opts:part.map(()=>-1),p_first:part.map(()=>false)});
      if(r.error){srvErr(r.error);throw r.error}
      (Array.isArray(r.data)?r.data:[]).forEach(d=>{const q=by[d.id];if(q&&typeof d.a==='number'){q.a=d.a;q.e=d.e||''}});
    }
    const qs=[],ans=[],flag={};
    ex.ids.forEach((id,i)=>{
      const q=by[id];if(!q||typeof q.a!=='number')return;
      const ch=(ex.ans||'').charAt(i);
      if((ex.fl||[]).indexOf(i)>=0)flag[qs.length]=1;
      qs.push(q);ans.push(ch===''||ch==='x'?-1:+ch);
    });
    if(!qs.length)throw new Error('empty');
    X={qs:qs,ans:ans,i:0,t0:ex.t,per:0,limit:0,label:ex.label||'امتحان سابق',tid:null,res:null,flag:flag};
  }catch(e){
    if(!isKick(e)){toast('تعذر فتح هذا الامتحان. جرب مرة ثانية.');progress()}
    return;
  }
  XBack=()=>{XBack=null;X=null;progress()};
  examReview(Object.keys(X.flag).length&&!X.ans.some((a,i)=>a<0||a!==X.qs[i].a)?'flag':'bad');
}
function examReview(f){
  XR=f||XR;view='examrev';
  const hasFl=Object.keys(X.flag||{}).length>0;
  if(XR==='flag'&&!hasFl)XR='bad';
  const items=X.qs.map((q,i)=>({q:q,i:i,a:X.ans[i]})).filter(it=>XR==='all'||(XR==='flag'?!!(X.flag&&X.flag[it.i]):(it.a<0||it.a!==it.q.a)));
  const card=it=>{
    const q=it.q,miss=it.a<0;
    const opts=`<ul class="opts">`+q.o.map((t,k)=>{let cls='opt';if(k===q.a)cls+=' good';else if(k===it.a)cls+=' bad';return `<li><div class="${cls}" dir="${dirOf(t)}"><span class="l">${LET[k]}</span><span class="t">${esc(t)}</span></div></li>`}).join('')+`</ul>`;
    return `<div class="panel rv"><h4>سؤال ${ar(it.i+1)}${starBtn(q)}</h4>${miss?'<p class="miss">لم تجب عن هذا السؤال</p>':''}<p class="q" dir="${dirOf(q.q)}" style="font-size:18px">${fmt(q.q)}</p>${imgHtml(q)}${opts}${q.e?`<div class="exp" dir="${dirOf(q.e)}"><b>الشرح</b>${fmt(q.e)}</div>`:''}${aiHtml(q)}${reportLinkHtml(q)}</div>`;
  };
  app.innerHTML=`
  <div class="top"><div class="brand">مراجعة الامتحان<small>${esc(X.label)}</small></div><button class="pill" id="bkR">رجوع</button></div>
  <div class="seg" role="group" aria-label="التصفية">
    <button data-rf="bad" aria-pressed="${XR==='bad'}">الأخطاء</button>
    ${hasFl?`<button data-rf="flag" aria-pressed="${XR==='flag'}">المعلَّمة</button>`:''}
    <button data-rf="all" aria-pressed="${XR==='all'}">كل الأسئلة</button></div>
  ${items.length?items.map(card).join(''):'<div class="empty">'+(XR==='flag'?'لا توجد أسئلة معلَّمة.':'ما عندك أخطاء بهذا الامتحان. أحسنت!')+'</div>'}`;
  $('bkR').onclick=XBack||examResult;
  app.querySelectorAll('[data-rf]').forEach(b=>b.onclick=()=>examReview(b.dataset.rf));
  bindStars();bindReports();bindAi();
  window.scrollTo(0,0);
}

/* ---------- هدف اليوم ---------- */
const dayKeyAgo=i=>{const n=new Date();return dk(new Date(n.getFullYear(),n.getMonth(),n.getDate()-i))};
const dayActive=k=>!!(S.days[k]&&S.days[k].n>0);
function calcStreak(){
  let streak=0,i=dayActive(dayKeyAgo(0))?0:1;
  for(;i<400;i++){const k=dayKeyAgo(i);if(dayActive(k))streak++;else if(S.frozen[k])continue;else break}
  return streak;
}
// a missed day is covered automatically by a vacation day (freeze) if you have one
function applyFreezes(){
  let i=1;const miss=[];
  while(i<=60&&!dayActive(dayKeyAgo(i))){if(!S.frozen[dayKeyAgo(i)])miss.push(i);i++;if(miss.length>3)return}
  if(!miss.length||i>60||!dayActive(dayKeyAgo(i))||(S.freezes||0)<miss.length)return;
  miss.forEach(j=>{S.frozen[dayKeyAgo(j)]=1});
  S.freezes-=miss.length;save();
  toast('استُعمل '+ar(miss.length)+' من أيام الإجازة للحفاظ على سلسلتك');
}
// one vacation day for every 7 days in a row (up to 3 stored)
function earnFreezes(){
  const ms=Math.floor(calcStreak()/7);
  if(ms>(S.fzMs||0)){S.freezes=Math.min(3,(S.freezes||0)+(ms-(S.fzMs||0)));S.fzMs=ms;toast('حصلت على يوم إجازة جديد لسلسلتك')}
  else if(ms<(S.fzMs||0))S.fzMs=ms;
}
const BADGES=[
  {id:'q100',g:'100',t:'100 سؤال',d:'حللت 100 سؤال'},
  {id:'q500',g:'500',t:'500 سؤال',d:'حللت 500 سؤال'},
  {id:'q1000',g:'1000',t:'1000 سؤال',d:'حللت 1000 سؤال'},
  {id:'streak7',g:'7',t:'7 أيام متتالية',d:'درست 7 أيام متتالية'},
  {id:'streak30',g:'30',t:'30 يوماً متتالياً',d:'درست 30 يوماً متتالياً'},
  {id:'exam1',g:'✓',t:'أول امتحان',d:'أنهيت أول امتحان تجريبي'},
  {id:'exam90',g:'★',t:'امتحان ممتاز',d:'نسبة 90% فأكثر بامتحان من 10 أسئلة أو أكثر'},
  {id:'goal1',g:'◎',t:'أنجزت هدف اليوم',d:'وصلت إلى هدفك اليومي'}
];
function checkBadges(){
  const got=[],aw=id=>{if(!S.badges[id]){S.badges[id]=Date.now();got.push(id)}};
  const t=S.total||0;
  if(t>=100)aw('q100');if(t>=500)aw('q500');if(t>=1000)aw('q1000');
  const st=calcStreak();if(st>=7)aw('streak7');if(st>=30)aw('streak30');
  if((S.exams||[]).length)aw('exam1');
  if((S.exams||[]).some(x=>x.n>=10&&x.ok/x.n>=0.9))aw('exam90');
  if(((S.days[dk(new Date())]||{n:0}).n)>=(S.goal||20))aw('goal1');
  if(got.length){save();toast('شارة جديدة: '+got.map(id=>BADGES.find(b=>b.id===id).t).join('، '))}
}
function expWarnHtml(){
  if(!Store.user)return '';
  try{if(localStorage.getItem('bc_exp_hide')===dk(new Date()))return ''}catch(e){}
  const now=Date.now();
  const soon=Object.keys(Store.subs).map(id=>({id:id,left:(new Date(Store.subs[id]).getTime()-now)/864e5})).filter(x=>x.left>0&&x.left<=7).sort((a,b)=>a.left-b.left);
  if(!soon.length)return '';
  const t=soon.map(x=>'«'+spById(x.id).n+'» '+(x.left<1?'ينتهي اليوم':'ينتهي بعد '+fmtIv(x.left))).join('، ');
  const wa='https://wa.me/9647764563070?text='+encodeURIComponent('السلام عليكم، أريد تجديد اشتراكي في Boardcard');
  return `<div class="ann"><span>اشتراكك ${esc(t)}. جدّد قبل الانتهاء حتى لا ينقطع وصولك. <a href="${wa}" target="_blank" rel="noopener" style="font-weight:700;text-decoration:underline">تجديد عبر واتساب</a></span><button class="annx" data-expx="1" aria-label="إخفاء التنبيه">✕</button></div>`;
}
function annHtml(){
  return (Store.ann||[]).filter(a=>!S.annSeen[a.id]).map(a=>{
    if(a.kind==='sponsor'&&/^https?:\/\//i.test(a.link_url||'')){
      const im=covUrl(a.image_url);
      return `<div class="ann sp" data-adv="${esc(a.id)}"><div class="adrow">${im?`<img class="adimg" src="${esc(im)}" alt="" loading="lazy" decoding="async">`:''}<div class="adtx"><small class="adlbl">إعلان ممول · ${esc(a.sponsor_name||'')}</small><span dir="${dirOf(a.message)}">${fmt(a.message)}</span><button type="button" class="btn adgo" data-adgo="${esc(a.id)}">${esc(a.cta||'انتقل الآن')}</button></div></div><button class="annx" data-ann="${esc(a.id)}" aria-label="إخفاء الإعلان">✕</button></div>`;
    }
    return `<div class="ann" dir="${dirOf(a.message)}"><span>${fmt(a.message)}</span><button class="annx" data-ann="${esc(a.id)}" aria-label="إخفاء الإعلان">✕</button></div>`;
  }).join('');
}
/* الإعلانات الممولة: مشاهدة واحدة لكل جهاز في اليوم، وكل ضغطة تُحسب */
function adDev(){let d=lsGet('bc_dev');if(!/^[A-Za-z0-9_-]{8,64}$/.test(d||'')){try{const u=new Uint8Array(16);crypto.getRandomValues(u);d=Array.from(u,x=>x.toString(36).padStart(2,'0')).join('')}catch(e){d='d'+Date.now().toString(36)+Math.random().toString(36).slice(2,10)}lsSet('bc_dev',d)}return d}
function adEvent(id,kind){try{sb.rpc('ad_event',{p_id:id,p_kind:kind,p_dev:adDev()}).then(()=>{},()=>{})}catch(e){}}
function adTrack(){
  const day=dqDay();
  app.querySelectorAll('[data-adv]').forEach(el=>{
    const id=el.dataset.adv,k='bc_adv_'+id;
    if(lsGet(k)===day)return;
    lsSet(k,day);adEvent(id,'v');
  });
  app.querySelectorAll('[data-adgo]').forEach(b=>b.onclick=()=>{
    const a=(Store.ann||[]).find(x=>x.id===b.dataset.adgo);
    if(!a||!/^https?:\/\//i.test(a.link_url||''))return;
    adEvent(a.id,'c');
    try{window.open(a.link_url,'_blank','noopener,noreferrer')}catch(e){}
  });
}
function goalHtml(){
  const g=S.goal||20,n=(S.days[dk(new Date())]||{n:0}).n,p=Math.min(1,n/g),C=163.4,st=calcStreak();
  return `<div class="goal" id="goalbtn" role="button" tabindex="0" aria-label="هدف اليوم">
    <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true"><circle cx="32" cy="32" r="26" fill="none" stroke="var(--chip)" stroke-width="7"/><circle cx="32" cy="32" r="26" fill="none" stroke="${n>=g?'var(--gold)':'var(--accent)'}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${(C*(1-p)).toFixed(1)}" transform="rotate(-90 32 32)"/></svg>
    <div class="gt"><b>هدف اليوم</b><span><bdi data-cnt="${n}" data-dl="350">${ar(n)}</bdi> من ${ar(g)} سؤال${n>=g?' ✓':''}</span><small>${st?'🔥 '+ar(st)+' '+(st===1?'يوم متتالٍ':'أيام متتالية'):'ابدأ اليوم لتبدأ سلسلتك'}، أيام الإجازة: ${ar(S.freezes||0)}</small>${n>=g?'<button class="pill" id="shgoal" style="margin-top:6px">شارك إنجازك</button>':''}</div></div>`;
}
function goalSetup(){
  const g=S.goal||20;
  showModal(`<button class="x" id="cl" aria-label="إغلاق">✕</button><h2>هدف اليوم</h2>
    <p class="hint">كم سؤالاً تريد أن تحل كل يوم؟ يتتبع التطبيق التقدم ويحسب أيامك المتتالية.</p>
    <p class="hint">تحصل على يوم إجازة مع كل 7 أيام متتالية (حتى 3). إذا فاتك يوم يُستعمل يوم إجازة تلقائياً حتى لا تنقطع سلسلتك.</p>
    <label class="fld"><span>عدد الأسئلة يومياً</span><select class="in" id="gl">${[10,20,30,50,100,150].map(n=>`<option value="${n}" ${n===g?'selected':''}>${ar(n)}</option>`).join('')}</select></label>
    <button class="btn block" id="gs">حفظ</button>`);
  $('cl').onclick=closeModal;
  $('gs').onclick=()=>{S.goal=parseInt($('gl').value,10)||20;save();closeModal();home()};
}

/* ---------- تثبيت التطبيق (PWA) ---------- */
let deferredInstall=null;
const lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
const isStandalone=()=>{try{return (window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true}catch(e){return false}};
const isIOS=()=>/iphone|ipad|ipod/i.test((navigator&&navigator.userAgent)||'');
function installHtml(){
  if(isStandalone()||lsGet('bc_inst_hide'))return '';
  if(deferredInstall)return `<div class="inst"><span>ثبّت Boardcard على شاشتك الرئيسية لفتحه كتطبيق.</span><div><button class="btn" id="instgo" style="min-height:40px;padding:6px 16px">تثبيت</button><button class="pill" id="instx">لاحقاً</button></div></div>`;
  if(isIOS())return `<div class="inst"><span>لتثبيت التطبيق: اضغط زر المشاركة في المتصفح ثم «إضافة إلى الشاشة الرئيسية».</span><div><button class="pill" id="instx">إخفاء</button></div></div>`;
  return '';
}
if(window.addEventListener){
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;if(view==='home')home()});
  window.addEventListener('appinstalled',()=>{deferredInstall=null;lsSet('bc_inst_hide','1');if(view==='home')home()});
}
if('serviceWorker' in (navigator||{})&&navigator.serviceWorker.addEventListener){
  navigator.serviceWorker.addEventListener('message',e=>{
    try{const h=e.data&&e.data.type==='open'&&String(e.data.hash||'');
      if(!h||!/^#(dq|ch-|pt-|live-)/.test(h)||!Store.ready||view!=='home')return;
      location.hash=h;dqDeep()}catch(x){}
  });
}
if('serviceWorker' in (navigator||{})&&window.addEventListener){
  window.addEventListener('load',()=>{try{navigator.serviceWorker.register('sw.js').catch(()=>{})}catch(e){}});
}

/* ---------- إصدار الموقع + تسجيل الأخطاء + إشعار التحديث ---------- */
const BUILD='2026-11-17.2';
const ERR={n:0,seen:{}};
function errHash(s){let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return (h>>>0).toString(36)}
/* يرسل الخطأ إلى قاعدة البيانات: نفس الخطأ مرة واحدة لكل جلسة وبحد أقصى 5 أخطاء، وأخطاء الشبكة لا تُحسب */
function reportErr(msg,src,stack){
  try{
    msg=String(msg==null?'':msg).replace(/^Uncaught\s+/,'').slice(0,300);
    if(!msg||/^Script error\.?$|ResizeObserver loop|Failed to fetch|Load failed|NetworkError|network request failed|AbortError|aborted/i.test(msg))return;
    const fp=errHash(msg+'|'+String(src||''));
    if(ERR.seen[fp]||ERR.n>=5)return;
    ERR.seen[fp]=1;ERR.n++;
    sb.rpc('log_client_error',{p_fp:fp,p_msg:msg,p_src:String(src||'').slice(0,200),p_stack:String(stack||'').slice(0,1200),
      p_view:String(typeof view==='string'?view:'').slice(0,30),p_ua:String(navigator.userAgent||'').slice(0,200),p_ver:BUILD}).then(()=>{},()=>{});
  }catch(e){}
}
if(window.addEventListener){
  window.addEventListener('error',e=>{if(e&&e.message)reportErr(e.message,(e.filename||'').split('/').pop()+':'+(e.lineno||0),e.error&&e.error.stack)});
  window.addEventListener('unhandledrejection',e=>{const r=e&&e.reason;reportErr((r&&r.message)||r,'promise',r&&r.stack)});
}
/* إشعار «يوجد تحديث»: نقارن بصمة الصفحة (ETag) عند الفتح بما على السيرفر لاحقاً. لا نزعج الطالب أثناء امتحان أو اختبار مباشر. */
let updKey=null,updShown=false,updLast=0;
async function updKeyNow(){
  const r=await fetch(location.pathname,{cache:'no-cache'});
  if(!r.ok)return null;
  const k=r.headers.get('etag')||r.headers.get('last-modified');
  if(k)return k;
  const t=await r.text();return 'l'+t.length+':'+errHash(t);
}
function showUpd(){
  if(document.getElementById('updbar'))return;
  const d=document.createElement('div');d.id='updbar';d.setAttribute('role','status');
  d.style.cssText='position:fixed;z-index:9999;left:12px;right:12px;bottom:calc(14px + env(safe-area-inset-bottom,0px));max-width:460px;margin:0 auto;display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:16px;background:rgba(12,40,96,.96);color:#fff;box-shadow:0 10px 30px rgba(10,30,80,.35);font:600 14px/1.4 inherit;direction:rtl';
  d.innerHTML='<span style="flex:1">يوجد تحديث جديد للموقع</span><button id="updgo" class="btn" style="min-width:0;padding:8px 14px">تحديث</button><button id="updno" aria-label="إغلاق" style="background:none;border:0;color:#fff;font-size:20px;line-height:1;padding:4px 8px;cursor:pointer">×</button>';
  document.body.appendChild(d);
  document.getElementById('updgo').onclick=()=>{try{location.reload()}catch(e){}};
  document.getElementById('updno').onclick=()=>{d.remove()};
}
async function updCheck(){
  if(updShown||!navigator.onLine)return;
  updLast=Date.now();
  try{
    const k=await updKeyNow();if(!k)return;
    if(updKey===null){updKey=k;return}
    if(k!==updKey&&view!=='exam'&&view!=='liverun'){updShown=true;showUpd()}
  }catch(e){}
}
if(window.addEventListener){
  window.addEventListener('load',()=>{setTimeout(updCheck,8000)});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-updLast>600000)updCheck()});
  setInterval(()=>{if(!document.hidden&&Date.now()-updLast>1800000)updCheck()},300000);
}

/* ---------- تنبيهات المراجعة (Web Push) ---------- */
const VAPID_PUB='BOqweVopa9vABQIhOMgUjfGa9-73NEW7LmSRzkCQ459Qh1pzV38XordMiJojotpSvydSGlb_dQ_QSkoWWtdh-CE';
const pushOk=()=>!!(window.isSecureContext&&'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window);
const u8=b=>{const p='='.repeat((4-b.length%4)%4),r=atob((b+p).replace(/-/g,'+').replace(/_/g,'/')),o=new Uint8Array(r.length);for(let i=0;i<r.length;i++)o[i]=r.charCodeAt(i);return o};
const swReady=()=>Promise.race([navigator.serviceWorker.ready,new Promise((_,rej)=>setTimeout(()=>rej(new Error('sw_timeout')),6000))]);
// عدد الأسئلة المستحقة خلال 24 ساعة، وأقرب موعد قادم (لاشتراكات الطالب فقط)
function pushDue(){
  const now=Date.now(),ids=Object.keys(Store.subs);let n=0,next=null;
  Object.keys(S.cards).forEach(id=>{
    const e=S.cards[id];if(!e||!e.s||e.due==null||goneQ(id,e))return;
    if(!ids.includes(spOfSubj(subjOf(e.s))))return;
    if(e.due<=now+864e5)n++;
    if(e.due>now&&(next==null||e.due<next))next=e.due;
  });
  return {n:n,next:next?new Date(next).toISOString():null};
}
async function pushEnable(){
  if(isIOS()&&!isStandalone())return 'ios_install';
  if(!pushOk())return 'unsupported';
  let perm=Notification.permission;
  if(perm==='default')perm=await Notification.requestPermission();
  if(perm!=='granted')return 'denied';
  const reg=await swReady();
  let sub=await reg.pushManager.getSubscription();
  if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:u8(VAPID_PUB)});
  const j=sub.toJSON(),d=pushDue();
  const r=await sb.rpc('push_save',{p_endpoint:j.endpoint,p_p256dh:j.keys.p256dh,p_auth:j.keys.auth,p_due:d.n,p_next:d.next});
  if(r.error)return 'error';
  lsSet('bc_push','1');
  return 'ok';
}
async function pushDisable(){
  try{
    if(pushOk()){const reg=await swReady(),sub=await reg.pushManager.getSubscription();
      if(sub){try{await sb.rpc('push_remove',{p_endpoint:sub.endpoint})}catch(e){}await sub.unsubscribe()}}
  }catch(e){}
  lsSet('bc_push','0');
}
let pushT=null;
function pushSyncSoon(){if(lsGet('bc_push')!=='1'||!Store.user)return;clearTimeout(pushT);pushT=setTimeout(pushSyncNow,15000)}
async function pushSyncNow(){
  try{
    if(lsGet('bc_push')!=='1'||!Store.user||!pushOk())return;
    const reg=await swReady(),sub=await reg.pushManager.getSubscription();
    if(!sub){lsSet('bc_push','0');return}
    const d=pushDue();
    await sb.rpc('push_update',{p_endpoint:sub.endpoint,p_due:d.n,p_next:d.next});
  }catch(e){}
}
if(window.addEventListener)document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')pushSyncNow()});
const PUSHMSG={ok:'تم تفعيل تنبيهات المراجعة',denied:'الإشعارات محظورة لهذا الموقع. فعّلها من إعدادات المتصفح ثم جرّب مرة ثانية.',ios_install:'على الآيفون: ثبّت التطبيق على الشاشة الرئيسية أولاً ثم فعّل التنبيهات.',unsupported:'متصفحك لا يدعم الإشعارات.',error:'تعذر تفعيل التنبيهات. جرّب مرة ثانية.'};
function pushRowHtml(){
  if(!Store.user||!Store.premium)return '';
  if(!pushOk()&&!(isIOS()&&!isStandalone()))return '';
  const on=lsGet('bc_push')==='1'&&pushOk()&&Notification.permission==='granted';
  return `<div class="setting"><div><b>تنبيهات المراجعة</b><div style="font-size:13px;color:var(--muted)">إشعار يومي بالأسئلة المستحقة حتى لو التطبيق مغلق</div></div>
    <button class="sw" id="pn" role="switch" aria-checked="${on}" aria-label="تنبيهات المراجعة"></button></div>`;
}
async function pushToggle(){
  const b=$('pn');if(!b||b.disabled)return;
  b.disabled=true;
  try{
    if(b.getAttribute('aria-checked')==='true'){await pushDisable();toast('تم إيقاف التنبيهات')}
    else toast(PUSHMSG[await pushEnable()]||PUSHMSG.error);
  }catch(e){toast(PUSHMSG.error)}
  if(view==='home')home();
}

/* ---------- المظهر وحجم الخط ---------- */
const themePref=()=>lsGet('bc_theme')||'auto';
const fsPref=()=>lsGet('bc_fs')||'m';
const prefersDark=()=>{try{return !!(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)}catch(e){return false}};
const effectiveDark=()=>{const p=themePref();return p==='dark'||(p!=='light'&&prefersDark())};
function applyTheme(){
  try{
    const p=themePref(),el=document.documentElement;
    if(p==='dark'||p==='light')el.setAttribute('data-theme',p);else el.removeAttribute('data-theme');
    const m=document.querySelector&&document.querySelector('meta[name="theme-color"]');
    if(m)m.setAttribute('content',effectiveDark()?'#0C1A23':'#1F5FBF');
  }catch(e){}
}
function setTheme(v){lsSet('bc_theme',v);applyTheme();if(view==='home')home()}
function setFs(v){
  lsSet('bc_fs',v);
  try{if(v==='m')document.documentElement.removeAttribute('data-fs');else document.documentElement.setAttribute('data-fs',v)}catch(e){}
  if(view==='home')home();
}

/* ---------- متابعة الجلسة بعد إغلاق المتصفح ---------- */
function saveResume(nextQi){
  liveMark(true);
  try{
    if(!Q||!Q.length||!sess)return;
    S.resume={ids:Q.map(q=>q.id),ss:Array.from(new Set(Q.map(q=>q.s))),qi:nextQi,
      sess:{ok:sess.ok,n:sess.n,sec:sess.sec,locked:sess.locked,subj:sess.subj,sp:sess.sp,sy:sess.sy,mode:sess.mode,rq:sess.rq},at:Date.now()};
    save();
  }catch(e){}
}
function saveExamResume(){
  liveMark(true);
  try{
    if(!X||X.res)return;
    S.resumeExam={ids:X.qs.map(q=>q.id),ss:Array.from(new Set(X.qs.map(q=>q.s))),ans:X.ans.slice(),flag:X.flag||{},i:X.i,t0:X.t0,per:X.per,limit:X.limit,label:X.label,at:Date.now()};
    save();
  }catch(e){}
}
function resumeInfo(){
  const r=S.resume;
  if(r&&r.ids&&Date.now()-r.at<864e5&&r.qi<r.ids.length)return {kind:'study',r:r};
  const x=S.resumeExam;
  if(x&&x.ids&&Date.now()-x.at<864e5)return {kind:'exam',r:x};
  return null;
}
function resumeHtml(){
  const i=resumeInfo();if(!i)return '';
  if(i.kind==='study')return `<div class="resume"><span>لديك جلسة مراجعة غير مكتملة (${ar(i.r.qi)} من ${ar(i.r.ids.length)}). تكملها؟</span><div><button class="btn" id="rsm" style="min-height:40px;padding:6px 16px">إكمال</button><button class="pill" id="rsx">تجاهل</button></div></div>`;
  const left=i.r.limit-Math.floor((Date.now()-i.r.t0)/1000);
  return `<div class="resume"><span>${left>0?'لديك امتحان تجريبي غير مكتمل، المتبقي '+mmss(left)+'.':'انتهى وقت امتحانك التجريبي ولم تعرض نتيجته.'}</span><div><button class="btn" id="rsm" style="min-height:40px;padding:6px 16px">${left>0?'إكمال':'عرض النتيجة'}</button><button class="pill" id="rsx">تجاهل</button></div></div>`;
}
async function resumeNow(){
  const i=resumeInfo();if(!i)return;
  const showLoading=()=>{app.innerHTML=`<div class="top"><div class="brand">${brandHtml()}</div></div><p class="empty">جارٍ تحميل الأسئلة…</p>`};
  let got;
  try{got=await hydrate(i.r.ids.map(id=>Store.idx[id]||{id:id}),showLoading)}
  catch(e){if(!isKick(e)){toast('تعذر تحميل الأسئلة. جرب مرة ثانية.');home()}return}
  if(i.kind==='study'){
    const r=i.r;
    Q=got;
    if(!Q.length||r.qi>=Q.length){S.resume=null;save();home();return}
    sess=Object.assign({ok:0,n:0,sec:0},r.sess,{rq:(r.sess&&r.sess.rq)||{}});
    qi=r.qi;showCard();
  }else{
    const x=i.r,qs=got;
    if(qs.length!==x.ids.length){S.resumeExam=null;save();toast('تعذر استئناف الامتحان.');home();return}
    X={qs:qs,ans:x.ans.slice(),i:Math.min(x.i,qs.length-1),t0:x.t0,per:x.per,limit:x.limit,label:x.label,tid:null,res:null,flag:x.flag||{}};
    if(Math.floor((Date.now()-x.t0)/1000)>=x.limit){examFinish(true);return}
    examShow();X.tid=setInterval(examTick,1000);
  }
}

/* ---------- مشاركة الإنجازات ---------- */
function rrect(x,X0,Y0,W0,H0,R){x.beginPath();x.moveTo(X0+R,Y0);x.arcTo(X0+W0,Y0,X0+W0,Y0+H0,R);x.arcTo(X0+W0,Y0+H0,X0,Y0+H0,R);x.arcTo(X0,Y0+H0,X0,Y0,R);x.arcTo(X0,Y0,X0+W0,Y0,R);x.closePath()}
function loadImg(src){
  return new Promise(res=>{
    if(typeof Image==='undefined'){res(null);return}
    const im=new Image(),t=setTimeout(()=>res(null),2500);
    im.onload=()=>{clearTimeout(t);res(im)};im.onerror=()=>{clearTimeout(t);res(null)};im.src=src;
  });
}
async function drawCard(o){
  const W=1080,H=1350,c=document.createElement('canvas');c.width=W;c.height=H;
  const x=c.getContext('2d');
  try{await document.fonts.load('700 60px "IBM Plex Sans Arabic"');await document.fonts.load('700 60px "IBM Plex Sans"')}catch(e){}
  const F='"IBM Plex Sans","IBM Plex Sans Arabic",sans-serif';
  const bg=x.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#3B7DE8');bg.addColorStop(1,'#123F8C');
  x.fillStyle=bg;x.fillRect(0,0,W,H);
  const glow=(cx,cy,r,a)=>{const g=x.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,'rgba(255,255,255,'+a+')');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,W,H)};
  glow(160,140,560,.30);glow(950,1200,640,.22);
  const PH=(o.kind==='exam'||o.stats)?900:830;
  x.fillStyle='rgba(255,255,255,.14)';rrect(x,80,250,920,PH,64);x.fill();
  x.strokeStyle='rgba(255,255,255,.38)';x.lineWidth=3;rrect(x,80,250,920,PH,64);x.stroke();
  x.textAlign='center';x.direction='rtl';x.fillStyle='#fff';
  const lg=await loadImg('logo-mark.png');
  if(lg&&lg.width){
    x.fillStyle='#fff';x.beginPath();x.arc(W/2,128,86,0,Math.PI*2);x.fill();
    const hh=120,ww=lg.width*hh/lg.height;x.drawImage(lg,W/2-ww/2,128-hh/2,ww,hh);x.fillStyle='#fff';
  }else{x.font='700 58px '+F;x.fillText('Boardcard',W/2,170)}
  x.font='700 72px '+F;x.fillText(o.title,W/2,410);
  if(o.kind==='exam'){
    const cx=W/2,cy=656,r=186,p=Math.max(0,Math.min(1,(o.pct||0)/100));
    x.lineCap='round';x.lineWidth=40;
    x.strokeStyle='rgba(255,255,255,.22)';x.beginPath();x.arc(cx,cy,r,0,Math.PI*2);x.stroke();
    if(p>0){x.strokeStyle=(o.pct>=90?'#FFD66B':'#FFFFFF');x.beginPath();x.arc(cx,cy,r,-Math.PI/2,-Math.PI/2+Math.PI*2*p);x.stroke()}
    x.fillStyle='#fff';x.font='700 100px '+F;x.fillText(String(o.big),cx,cy+36);
    x.font='600 54px '+F;x.fillStyle='rgba(255,255,255,.95)';x.fillText(o.sub,cx,905);
    if(o.line){x.font='500 42px '+F;x.fillStyle='rgba(255,255,255,.82)';x.fillText(o.line,cx,962)}
    const st=o.stats||[],bw=196,gap=16,tot=st.length*bw+(st.length-1)*gap;let bx=cx-tot/2;
    st.forEach(t=>{
      x.fillStyle='rgba(255,255,255,.18)';rrect(x,bx,1000,bw,128,28);x.fill();
      x.fillStyle='#fff';x.font='700 50px '+F;x.fillText(String(t.v),bx+bw/2,1062);
      x.font='500 28px '+F;x.fillStyle='rgba(255,255,255,.85)';x.fillText(t.l,bx+bw/2,1106);
      bx+=bw+gap;
    });
  }else{
    x.font='700 '+(String(o.big).length>3?230:300)+'px '+F;x.fillText(String(o.big),W/2,740);
    x.font='500 62px '+F;x.fillStyle='rgba(255,255,255,.94)';x.fillText(o.sub,W/2,860);
    if(o.line){x.font='600 50px '+F;x.fillStyle='rgba(255,255,255,.88)';x.fillText(o.line,W/2,975)}
    if(o.stats){
      const st=o.stats,bw=250,gap=16,tot=st.length*bw+(st.length-1)*gap;let bx=W/2-tot/2;
      st.forEach(t=>{
        x.fillStyle='rgba(255,255,255,.18)';rrect(x,bx,1005,bw,128,28);x.fill();
        x.fillStyle='#fff';x.font='700 50px '+F;x.fillText(String(t.v),bx+bw/2,1067);
        x.font='500 28px '+F;x.fillStyle='rgba(255,255,255,.85)';x.fillText(t.l,bx+bw/2,1111);
        bx+=bw+gap;
      });
    }
  }
  if(o.name){
    x.font='700 54px '+F;
    const w=Math.min(860,x.measureText(o.name).width+110),ny=(o.kind==='exam'||o.stats)?1168:1135;
    x.fillStyle='rgba(255,255,255,.95)';rrect(x,W/2-w/2,ny,w,96,48);x.fill();
    x.fillStyle='#1A56B0';x.fillText(o.name,W/2,ny+67);
  }
  x.font='500 40px '+F;x.fillStyle='rgba(255,255,255,.85)';x.direction='ltr';x.fillText(o.url,W/2,1300);
  return c;
}
function cardData(kind,id,showName){
  const name=showName&&Store.profile&&Store.profile.full_name?Store.profile.full_name:'';
  const url=((window.location&&location.origin)||'')+(((window.location&&location.pathname)||'').replace(/[^/]*$/,''));
  const st=calcStreak(),total=S.total||0,n=(S.days[dk(new Date())]||{n:0}).n;
  const stk=st?'سلسلتي '+st+' '+(st===1?'يوم':'أيام')+' متتالية':'';
  if(kind==='exam'&&X&&X.res){
    const r=X.res,nq=X.qs.length,pc=Math.round(100*r.ok/nq);
    return {kind:'exam',title:'نتيجة امتحاني التجريبي',big:pc+'%',pct:pc,sub:r.ok+' صحيحة من '+nq,line:X.label,
      stats:[{v:r.ok,l:'صحيحة'},{v:r.wrong,l:'خاطئة'},{v:r.skip,l:'بدون إجابة'},{v:fmtT(r.sec),l:'الوقت'}],name:name,url:url,
      text:'أنهيت امتحاناً تجريبياً على Boardcard وحصلت على '+pc+'% ('+r.ok+' من '+nq+') خلال '+fmtT(r.sec)+'. '+url};
  }
  if(kind==='month'&&MS){const m=MS;return {kind:'month',title:'ملخصي لآخر 30 يوماً',big:m.total.toLocaleString('en'),sub:'سؤالاً حللته',line:m.best?'أقوى مادة: '+m.best:'',
    stats:[{v:m.acc+'%',l:'نسبة الصح'},{v:String(m.days),l:'أيام نشاط'},m.pct!=null?{v:m.pct+'%',l:'أفضل من الطلاب'}:{v:fmtT(m.sec),l:'وقت الدراسة'}],name:name,url:url,
    text:'حليت '+m.total.toLocaleString('en')+' سؤالاً خلال 30 يوماً على Boardcard'+(m.best?'، وأقوى مادة عندي '+m.best:'')+(m.pct!=null?'، وأفضل من '+m.pct+'% من الطلاب':'')+'. '+url}}
  if(kind==='ready'&&RD){const spn=spById(RD.sp).n;return {title:'جاهزيتي للامتحان',big:RD.score+'%',sub:spn,line:'التغطية ⁦'+RD.cov+'%⁩ · التذكّر ⁦'+RD.ret+'%⁩',name:name,url:url,
    text:'مؤشر جاهزيتي لامتحان '+spn+' على Boardcard: '+RD.score+'%. اعرف جاهزيتك أنت: '+url}}
  if(kind==='badge'){const b=BADGES.find(z=>z.id===id)||BADGES[0];return {title:'حصلت على شارة',big:b.g,sub:b.t,line:b.d,name:name,url:url,text:'حصلت على شارة «'+b.t+'» في Boardcard! '+url}}
  if(kind==='goal')return {title:'أنجزت هدف اليوم',big:String(n),sub:'سؤالاً اليوم',line:stk,name:name,url:url,text:'أنجزت هدفي اليوم على Boardcard: '+n+' سؤالاً'+(st?'، وسلسلتي '+st+' '+(st===1?'يوم':'أيام'):'')+'. '+url};
  return {title:'إنجازاتي على Boardcard',big:String(total),sub:'سؤالاً حللته',line:stk,name:name,url:url,text:'حللت '+total+' سؤالاً على Boardcard. '+url};
}
let SH={kind:'stats',id:null,canvas:null,d:null};
function saveShareImage(){
  const a=document.createElement('a');a.href=SH.canvas.toDataURL('image/png');a.download='boardcard.png';
  document.body.appendChild(a);a.click();a.remove();
}
async function shareNative(){
  try{
    const blob=await new Promise(r=>SH.canvas.toBlob(r,'image/png'));
    const f=new File([blob],'boardcard.png',{type:'image/png'});
    if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],text:SH.d.text});return}
    if(navigator.share){await navigator.share({text:SH.d.text,url:SH.d.url});return}
  }catch(e){if(e&&e.name==='AbortError')return}
  saveShareImage();toast('تم حفظ الصورة، شاركها يدوياً');
}
async function shareCard(kind,id){
  SH={kind:kind,id:id||null,canvas:null,d:null};
  const hasName=!!(Store.profile&&Store.profile.full_name);
  showModal(`<button class="x" id="cl" aria-label="إغلاق">✕</button><h2>شارك إنجازك</h2>
    <img id="shimg" alt="بطاقة الإنجاز" style="width:100%;border-radius:18px;display:block;margin-bottom:12px;background:var(--chip);min-height:180px">
    ${hasName?'<label class="chk"><input type="checkbox" id="shname" checked>إظهار اسمي على البطاقة</label>':''}
    <div class="r2"><button class="btn" id="shgo">مشاركة</button><button class="btn line" id="shsv">حفظ الصورة</button></div>
    <button class="btn line block" id="shtg" style="margin-top:8px">إرسال عبر تيليجرام</button>
    <p class="hint" style="margin-top:8px">زر «مشاركة» يفتح قائمة هاتفك لتختار تيليجرام أو إنستغرام أو غيرهما.</p>`);
  $('cl').onclick=closeModal;
  const render=async()=>{
    const nm=$('shname')?$('shname').checked:false;
    SH.d=cardData(SH.kind,SH.id,nm);
    SH.canvas=await drawCard(SH.d);
    try{$('shimg').src=SH.canvas.toDataURL('image/png')}catch(e){}
  };
  $('shgo').onclick=()=>{if(SH.canvas)shareNative()};
  $('shsv').onclick=()=>{if(SH.canvas)saveShareImage()};
  $('shtg').onclick=()=>{if(SH.d)window.open('https://t.me/share/url?url='+encodeURIComponent(SH.d.url)+'&text='+encodeURIComponent(SH.d.text),'_blank','noopener')};
  const sn=$('shname');if(sn)sn.onchange=render;
  await render();
}

/* ---------- لوحة الشرف الأسبوعية (اختيارية) ---------- */
let LB={kind:'answered'},lbFlushing=false;
async function lbFlush(){
  if(!Store.user||lbFlushing||!(S.lbPend>0)||!(Store.profile&&Store.profile.lb_name))return;
  lbFlushing=true;
  const n=Math.min(S.lbPend,100);
  try{const r=await sb.rpc('lb_report',{p_n:n,p_streak:calcStreak()});if(!r.error){S.lbPend=Math.max(0,S.lbPend-n);save()}}catch(e){}
  lbFlushing=false;
}
function lbErr(e){
  const m=(e&&e.message)||'';
  if(/bad_nick/.test(m))return 'الاسم غير مقبول. استعمل من 3 إلى 20 حرفاً (عربي أو إنكليزي أو أرقام أو مسافة).';
  if(/nick_taken/.test(m))return 'هذا الاسم مستخدم. اختر اسماً آخر.';
  return 'تعذر تنفيذ العملية. جرب مرة ثانية.';
}
async function leaderboard(){
  view='lb';stopTimer();
  const head=sub=>`<div class="top"><div class="brand">لوحة الشرف<small>${sub}</small></div><button class="pill" id="bkL">رجوع</button></div>`;
  if(!Store.user){
    app.innerHTML=head('هذا الأسبوع')+`<div class="auth"><p>لوحة الشرف متاحة للطلاب المسجلين. سجّل دخولك بحسابك لتنضم وتنافس زملاءك.</p><button class="btn block" id="lsub">اشترك أو سجّل الدخول</button></div>`;
    $('bkL').onclick=home;$('lsub').onclick=paywall;return;
  }
  const nick=Store.profile&&Store.profile.lb_name;
  if(!nick){
    app.innerHTML=head('هذا الأسبوع')+`<div class="auth">
      <p>لوحة شرف أسبوعية اختيارية تبدأ كل سبت. تظهر باسم مستعار تختاره أنت، <b>واسمك الحقيقي لا يظهر لأحد</b>، ويمكنك الانسحاب بأي وقت.</p>
      <label class="fld"><span>الاسم المستعار</span><input class="in" id="lbn" maxlength="20" autocomplete="off" dir="auto"></label>
      <p class="hint">من 3 إلى 20 حرفاً (عربي أو إنكليزي أو أرقام أو مسافة).</p>
      <p class="err" id="er" role="alert"></p>
      <button class="btn block" id="lbj">انضم إلى لوحة الشرف</button></div>`;
    $('bkL').onclick=home;
    $('lbj').onclick=async()=>{
      const v=$('lbn').value.trim();
      if(v.length<3){$('er').textContent='اكتب اسماً من 3 أحرف على الأقل.';return}
      $('lbj').disabled=true;
      const r=await sb.rpc('lb_join',{p_nick:v});
      if(r.error){
        if(/session_replaced/.test(r.error.message)){await kick();return}
        $('er').textContent=lbErr(r.error);$('lbj').disabled=false;return;
      }
      Store.profile.lb_name=v;toast('تم انضمامك إلى لوحة الشرف');const bk=LB.back;LB.back=null;(bk||leaderboard)();
    };
    return;
  }
  app.innerHTML=head('جارٍ التحميل…')+'<p class="empty">جارٍ تحميل الترتيب…</p>';
  $('bkL').onclick=home;
  const [t,me]=await Promise.all([sb.rpc('lb_top',{p_kind:LB.kind}),sb.rpc('lb_me',{p_kind:LB.kind})]);
  if(view!=='lb')return;
  if(t.error){app.innerHTML=head('')+'<p class="err">تعذر تحميل الترتيب. جرب مرة ثانية.</p>';$('bkL').onclick=home;return}
  const rows=t.data||[],mine=(me.data&&me.data[0])||null;
  const val=r=>LB.kind==='streak'?r.streak:r.answered,unit=LB.kind==='streak'?'يوم':'سؤال';
  const medal=['#E0A100','#9AA7B4','#B9783A'];
  app.innerHTML=head('هذا الأسبوع، يبدأ كل سبت')+`
    <div class="seg" role="group" aria-label="الترتيب" style="margin-top:0">
      <button data-lk="answered" aria-pressed="${LB.kind==='answered'}">الأكثر حلاً</button>
      <button data-lk="streak" aria-pressed="${LB.kind==='streak'}">أطول سلسلة</button></div>
    ${rows.length?rows.map(r=>`<div class="item lbr${r.me?' me':''}" style="--sc:${r.rnk<=3?medal[r.rnk-1]:'#5A6B77'}"><b class="rk">${ar(r.rnk)}</b><div class="grow"><div class="nm" dir="auto">${esc(r.nickname)}${r.me?' (أنت)':''}</div></div><b>${ar(val(r))}</b><span class="sub">${unit}</span></div>`).join(''):'<div class="empty">لا يوجد مشاركون بعد هذا الأسبوع. ابدأ بحل الأسئلة لتتصدر القائمة.</div>'}
    ${mine&&!rows.some(r=>r.me)?`<div class="item lbr me" style="--sc:#1F5FBF"><b class="rk">${ar(mine.rnk)}</b><div class="grow"><div class="nm">ترتيبك (${esc(nick)})</div></div><b>${ar(mine.val)}</b><span class="sub">${unit}</span></div>`:''}
    <p class="note">اسمك المستعار: <b dir="auto">${esc(nick)}</b>. <button id="lbl">الانسحاب من لوحة الشرف</button></p>`;
  $('bkL').onclick=home;
  app.querySelectorAll('[data-lk]').forEach(b=>b.onclick=()=>{LB.kind=b.dataset.lk;leaderboard()});
  $('lbl').onclick=async()=>{
    if(!(await askConfirm('الانسحاب من لوحة الشرف','سيُحذف اسمك المستعار ونتيجتك من لوحة الشرف.','انسحب')))return;
    const r=await sb.rpc('lb_leave');
    if(r.error){toast(lbErr(r.error));return}
    Store.profile.lb_name=null;S.lbPend=0;save();toast('تم انسحابك من لوحة الشرف');home();
  };
}

/* ---------- شرح الذكاء الاصطناعي (للمشتركين) ---------- */
const AIC={},AIA={};
const aiOk=c=>!!(Store.user&&Store.subs[qSp(c)]);
const aiHtml=c=>{const lk=aiOk(c)?'':' 🔒',id=esc(c.id);return `<div class="r2 aibtns"><button class="btn line block aibtn" type="button" data-ai="${id}">✦ شرح${lk}</button><button class="btn line block aibtn" type="button" data-aichat="${id}">💬 اسأل الذكاء الاصطناعي${lk}</button></div><div class="aibox" id="aib-${id}" hidden></div>`};
function bindAi(){app.querySelectorAll('[data-ai]').forEach(b=>{b.onclick=()=>aiExplain(b.dataset.ai,b)});app.querySelectorAll('[data-aichat]').forEach(b=>{b.onclick=()=>aiChat(b.dataset.aichat)})}
/* أزرار الذكاء الاصطناعي قبل الجواب: ظاهرة، لكنها تطلب من الطالب أن يجيب أولاً */
function aiPreHtml(c){const lk=aiOk(c)?'':' 🔒';return `<div class="r2 aibtns aipre"><button class="btn line block aibtn" type="button" data-aipre="1">✦ شرح${lk}</button><button class="btn line block aibtn" type="button" data-aipre="1">💬 اسأل الذكاء الاصطناعي${lk}</button></div>`}
function bindAiPre(c){app.querySelectorAll('[data-aipre]').forEach(b=>{b.onclick=()=>{if(c&&!aiOk(c)){aiLocked();return}toast('أجب عن السؤال أولاً، ثم اسأل الذكاء الاصطناعي.')}})}
function revLoading(on){
  const f=app.querySelector('.front');if(!f)return;
  const el=f.querySelector('#revload');
  if(on&&!el)f.insertAdjacentHTML('beforeend','<p class="revload" id="revload" role="status" aria-live="polite">جارٍ تحميل الشرح…</p>');
  else if(!on&&el)el.remove();
}
function aiLocked(){
  showModal(`<button class="x" id="cl" aria-label="إغلاق">✕</button><h2>شرح الذكاء الاصطناعي</h2>
    <p>${Store.user&&Store.premium?'هذا السؤال ضمن اختصاص لست مشتركاً به.':'ميزة «اشرح لي بالذكاء الاصطناعي» متاحة للمشتركين.'} يشرح لك لماذا الجواب الصحيح صحيح، ولماذا بقية الخيارات خاطئة، مع نقطة للحفظ.</p>
    <button class="btn block" id="aisub">${Store.user&&Store.premium?'طلب اشتراك باختصاص آخر':'اشترك لفتح الميزة'}</button>`);
  $('cl').onclick=closeModal;$('aisub').onclick=()=>{closeModal();paywall()};
}
function showAi(box,text,alt){
  box.innerHTML=`<div class="aihead">✦ شرح الذكاء الاصطناعي${alt?' <small style="font-weight:400">(نموذج بديل مجاني)</small>':''}</div><div dir="${dirOf(text)}">${fmt(text)}</div><p class="hint" style="margin:8px 0 0">مولّد بالذكاء الاصطناعي لمساعدتك على الفهم، فتأكد منه من مصادرك الطبية. إذا وجدت خطأً استعمل «بلّغ عن خطأ».</p>`;
  box.hidden=false;
}
let aiDetail=null;
async function fnCode(r){
  aiDetail=null;
  if(!r.error)return (r.data&&r.data.error)||null;
  try{const j=await r.error.context.json();aiDetail=j.detail||null;return j.error||'ai_failed'}catch(e){return 'ai_failed'}
}
const AIMSG={answer_first:'أجب عن السؤال أولاً.',limit:'وصلت إلى الحد اليومي للشروحات بالذكاء الاصطناعي. جرّب غداً.',busy:'الخدمة مزدحمة الآن. جرّب بعد قليل.',not_configured:'ميزة الذكاء الاصطناعي لم تُفعَّل بعد.',blocked:'تعذر توليد شرح لهذا السؤال.',ai_failed:'تعذر توليد الشرح الآن. جرّب مرة ثانية.',not_found:'تعذر العثور على السؤال.'};
async function aiExplain(id,btn){
  const c=Store.qmap[id];if(!c)return;
  const box=$('aib-'+id);if(!box)return;
  if(!aiOk(c)){aiLocked();return}
  if(AIC[id]){if(box.hidden)showAi(box,AIC[id],AIA[id]);else box.hidden=true;return}
  box.hidden=false;box.innerHTML='<p class="hint" style="margin:0">جارٍ إعداد الشرح…</p>';
  if(btn)btn.disabled=true;
  let r;
  try{r=await sb.functions.invoke('ai-explain',{body:{question_id:id}})}catch(e){r={error:{}}}
  if(btn)btn.disabled=false;
  const err=await fnCode(r);
  if(err){
    if(err==='subscribers_only'){box.hidden=true;aiLocked();return}
    if(err==='unauthorized'){await kick();return}
    box.innerHTML=`<p class="err" style="margin:0">${esc(AIMSG[err]||AIMSG.ai_failed)}</p>`+(aiDetail?`<p class="hint" dir="ltr" style="margin:6px 0 0;text-align:left;word-break:break-word">${esc(aiDetail.map(a=>a.model+': '+a.status+' '+(a.msg||'')).join(' | '))}</p>`:'');return;
  }
  AIC[id]=r.data.text;AIA[id]=!!r.data.alt;showAi(box,r.data.text,!!r.data.alt);
}

/* ---------- محادثة الذكاء الاصطناعي حول السؤال ---------- */
const AICH={};
const CHMSG=Object.assign({},AIMSG,{limit:'وصلت إلى الحد اليومي لرسائل المحادثة. جرّب غداً.',ai_failed:'تعذر الرد الآن. جرّب مرة ثانية.',blocked:'تعذر الرد على هذه الرسالة.'});
function chRender(id){
  const box=$('chl');if(!box)return;
  const h=AICH[id]||[];
  box.innerHTML=h.length?h.map(m=>`<div class="chb ${m.role==='user'?'u':'m'}" dir="${dirOf(m.text)}">${esc(m.text)}${m.alt?'<br><small style="opacity:.7">— رد من نموذج بديل مجاني</small>':''}</div>`).join(''):
    `<p class="hint" style="margin:0">اسأل عن أي شيء يخص موضوع هذا السؤال، أو اختر اقتراحاً:</p><div class="chips">${['اشرح لي الفكرة الأساسية بالسؤال','ما الفرق بين الخيارات؟','أعطني معلومة مهمة للحفظ عن هذا الموضوع'].map(t=>`<button type="button" class="pill" data-chq="${esc(t)}">${t}</button>`).join('')}</div>`;
  box.querySelectorAll('[data-chq]').forEach(b=>{b.onclick=()=>chSend(id,b.dataset.chq)});
  box.scrollTop=box.scrollHeight;
}
function aiChat(id){
  const c=Store.qmap[id];if(!c)return;
  if(!aiOk(c)){aiLocked();return}
  if(!AICH[id])AICH[id]=[];
  const qs=String(c.q).replace(/\s+/g,' ').trim();
  showModal(`<button class="x" id="cl" aria-label="إغلاق">✕</button><h2>اسأل الذكاء الاصطناعي</h2>
    <p class="hint" dir="${dirOf(qs)}" style="margin:0 0 8px">${esc(qs.length>130?qs.slice(0,130)+'…':qs)}</p>
    <div id="chl" class="chl"></div>
    <p class="err" id="cher" role="alert"></p>
    <div class="chin"><textarea class="in" id="chi" dir="auto" maxlength="600" rows="2" placeholder="اكتب سؤالك هنا…"></textarea><button class="btn" id="aichs" type="button">إرسال</button></div>
    <p class="hint" style="margin:8px 0 0">الردود مولّدة بالذكاء الاصطناعي لمساعدتك على الفهم، فتأكد منها من مصادرك الطبية.</p>`);
  $('cl').onclick=closeModal;
  chRender(id);
  const go=()=>{const t=$('chi').value.trim();if(t)chSend(id,t)};
  $('aichs').onclick=go;
  $('chi').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();go()}};
}
async function chSend(id,txt){
  const h=AICH[id];if(!h||!$('chl'))return;
  const inp=$('chi'),btn=$('aichs');
  if(btn&&btn.disabled)return;
  $('cher').textContent='';
  h.push({role:'user',text:txt});
  if(inp)inp.value='';
  chRender(id);
  const box=$('chl');
  box.insertAdjacentHTML('beforeend','<div class="chb m" id="chw"><span class="hint">جارٍ الكتابة…</span></div>');box.scrollTop=box.scrollHeight;
  if(btn)btn.disabled=true;
  let r;
  try{r=await sb.functions.invoke('ai-chat',{body:{question_id:id,messages:h.slice(-10)}})}catch(e){r={error:{}}}
  const err=await fnCode(r);
  if(!$('chl'))return;                       // أُغلقت النافذة أثناء الانتظار
  if($('aichs'))$('aichs').disabled=false;
  if(err){
    h.pop();                                  // لا نبقي رسالة بلا رد
    chRender(id);
    if(err==='subscribers_only'){closeModal();aiLocked();return}
    if(err==='unauthorized'){await kick();return}
    $('cher').textContent=CHMSG[err]||CHMSG.ai_failed;
    if($('chi')&&!$('chi').value)$('chi').value=txt;
    return;
  }
  h.push({role:'model',text:r.data.text,alt:!!r.data.alt});
  while(h.length>20)h.shift();
  chRender(id);
  if($('chi'))$('chi').focus();
}

/* ---------- التقدم والتقارير ---------- */
const pad2=n=>(n<10?'0':'')+n;
const dk=d=>d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate());
const dfk=k=>{const p=k.split('-');return new Date(+p[0],+p[1]-1,+p[2])};
const WDS=['أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'];
const WDL=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
function fmtT(sec){
  sec=Math.round(sec||0);
  if(sec<60)return ar(sec)+' ث';
  const m=Math.round(sec/60);
  if(m<60)return ar(m)+' د';
  const h=Math.floor(m/60),r=m%60;
  return ar(h)+' س'+(r?' و'+ar(r)+' د':'');
}
function dayRec(k){return S.days[k]||(S.days[k]={n:0,ok:0,sec:0,subj:{}})}
function addStat(c,ok,sec){
  const d=dayRec(dk(new Date()));
  d.n++;if(ok)d.ok++;d.sec+=sec;
  const sj=d.subj[c.s]||(d.subj[c.s]={n:0,ok:0});
  sj.n++;if(ok)sj.ok++;
  sess.sec=(sess.sec||0)+sec;
  S.total=(S.total||0)+1;
  {const lv=LEVELS.find(l=>l[0]>0&&l[0]===S.total);if(lv)setTimeout(()=>toast('🎖 ترقّيت إلى مستوى «'+lv[1]+'». واصل!'),2900)}
  if(Store.user){S.ptPend=(S.ptPend||0)+1;if(S.ptPend>=5)ptFlush()}
  if(Store.user&&Store.profile&&Store.profile.lb_name){S.lbPend=(S.lbPend||0)+1;if(S.lbPend>=10)lbFlush()}
  if(d.n===(S.goal||20)&&S.badges.goal1){toast('أحسنت! أنجزت هدف اليوم')}
  earnFreezes();checkBadges();
  const keys=Object.keys(S.days);
  if(keys.length>400){keys.sort();keys.slice(0,keys.length-400).forEach(k=>delete S.days[k])}
  save();
}
function addSec(sec){
  if(!(sec>0))return;
  const d=dayRec(dk(new Date()));d.sec+=sec;sess.sec=(sess.sec||0)+sec;save();
}
let P={range:7};
function progress(){
  view='progress';stopTimer();
  const now=new Date(),keys=[];
  for(let i=P.range-1;i>=0;i--)keys.push(dk(new Date(now.getFullYear(),now.getMonth(),now.getDate()-i)));
  const days=keys.map(k=>Object.assign({k:k,n:0,ok:0,sec:0,subj:{}},S.days[k]||{}));
  const tot=days.reduce((a,d)=>({n:a.n+d.n,ok:a.ok+d.ok,sec:a.sec+d.sec}),{n:0,ok:0,sec:0});
  const active=days.filter(d=>d.n>0).length;
  const td=S.days[dk(now)]||{n:0,ok:0,sec:0};
  const streak=calcStreak();
  const allN=Object.keys(S.days).reduce((t,k)=>t+(S.days[k].n||0),0);
  const pct=(a,b)=>b?Math.round(100*a/b):0;

  const chart=(vals,show)=>{
    const mx=Math.max(1,...vals);
    return `<div class="chart ${P.range>7?'dense':''}">`+days.map((d,i)=>{
      const dt=dfk(d.k),v=vals[i];
      const lab=P.range<=7?WDS[dt.getDay()]:((i%5===4||i===days.length-1)?ar(dt.getDate()):'');
      return `<div class="col${i===days.length-1?' today':''}"><span class="val">${P.range<=7&&v?show(v):''}</span><div class="bw"><i style="height:${Math.max(v?4:2,Math.round(100*v/mx))}%"></i></div><em>${lab}</em></div>`;
    }).join('')+`</div>`;
  };

  const agg={};
  days.forEach(d=>Object.keys(d.subj).forEach(id=>{const a=agg[id]||(agg[id]={n:0,ok:0});a.n+=d.subj[id].n;a.ok+=d.subj[id].ok}));
  const subs=Object.keys(agg).map(id=>({id:id,n:agg[id].n,ok:agg[id].ok,p:pct(agg[id].ok,agg[id].n)})).sort((a,b)=>b.n-a.n);
  const weak=subs.filter(x=>x.n>=3).sort((a,b)=>a.p-b.p)[0];
  const live=Object.keys(S.cards).filter(id=>!goneQ(id,S.cards[id])),mastered=live.filter(id=>S.cards[id].box>=3).length,seen=live.length;
  // المراجعات القادمة: كم سؤالاً يحين موعده كل يوم خلال أسبوع (المتأخر يُحسب على اليوم)
  const fc=[0,0,0,0,0,0,0];
  {const d0=new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime(),nowT=Date.now();
   live.forEach(id=>{const e=S.cards[id];if(!e||e.due==null)return;if(e.due<=nowT){fc[0]++;return}const d=Math.floor((e.due-d0)/864e5);if(d>=0&&d<7)fc[d]++})}
  const fmx=Math.max(1,...fc);
  const fcHtml=seen?`<h3 class="sec">المراجعات القادمة</h3><div class="panel"><div class="chart">`+fc.map((v,i)=>{const dt=new Date(now.getFullYear(),now.getMonth(),now.getDate()+i);return `<div class="col${i===0?' today':''}"><span class="val">${v?ar(v):''}</span><div class="bw"><i style="height:${Math.max(v?4:2,Math.round(100*v/fmx))}%"></i></div><em>${i===0?'اليوم':WDS[dt.getDay()]}</em></div>`}).join('')+`</div></div><p class="hint" style="margin:6px 2px 0">عدد الأسئلة التي يحين موعد مراجعتها كل يوم خلال أسبوع، حتى توزّع وقتك.</p>`:'';

  const rows=days.slice().reverse().filter(d=>d.n>0).map(d=>{
    const dt=dfk(d.k);
    return `<div class="rep"><span>${WDL[dt.getDay()]} ${ar(dt.getDate()+'/'+(dt.getMonth()+1))}</span><span>${ar(d.n)} سؤال</span><span>${ar(pct(d.ok,d.n))}% صح</span><span>${fmtT(d.sec)}</span></div>`;
  }).join('');

  app.innerHTML=`
  <div class="top"><div class="brand">التقدم<small>${Store.user?esc((Store.profile&&Store.profile.full_name)||''):'تجربة مجانية'}</small></div>
    <button class="pill" id="bkP">رجوع</button></div>
  <div class="kpis">
    <div class="kpi"><b data-cnt="${td.n}">${ar(td.n)}</b><span>سؤال اليوم</span><small>${fmtT(td.sec)}${td.n?'، '+ar(pct(td.ok,td.n))+'% صح':''}</small></div>
    <div class="kpi"><b data-cnt="${streak}" data-dl="100">${ar(streak)}</b><span>${streak===1?'يوم متتالٍ':'أيام متتالية'}</span><small>إجمالي ${ar(allN)} سؤال</small></div>
  </div>
  ${levelHtml()}
  <div class="seg" role="group" aria-label="الفترة">
    <button data-r="7" aria-pressed="${P.range===7}">آخر 7 أيام</button>
    <button data-r="30" aria-pressed="${P.range===30}">آخر 30 يوماً</button></div>
  <div class="kpis">
    <div class="kpi"><b data-cnt="${pct(tot.ok,tot.n)}" data-suf="%">${ar(pct(tot.ok,tot.n))}%</b><span>نسبة الصح</span><small>${ar(tot.ok)} من ${ar(tot.n)}</small></div>
    <div class="kpi"><b>${fmtT(tot.sec)}</b><span>وقت الدراسة</span><small>${active?'بمعدل '+fmtT(tot.sec/active)+' باليوم':'لا نشاط بعد'}</small></div>
  </div>
  <h3 class="sec">الأسئلة يومياً</h3>
  <div class="panel">${chart(days.map(d=>d.n),v=>ar(v))}</div>
  <h3 class="sec">وقت الدراسة يومياً (بالدقائق)</h3>
  <div class="panel">${chart(days.map(d=>Math.round(d.sec/60)),v=>ar(v))}</div>
  ${fcHtml}
  ${heatHtml()}
  ${weak&&weak.p<70?`<div class="banner" style="margin-top:12px">أضعف مادة: ${esc(subjOf(weak.id).n)} (${ar(weak.p)}% صح). راجعها أكثر.</div>`:''}
  ${Store.user&&Object.keys(Store.subs).length?'<button class="btn line block" id="rdyb" style="margin-top:12px">📈 مؤشر الجاهزية للامتحان</button>':''}
  <button class="btn line block" id="msb" style="margin:12px 0">📤 ملخص آخر 30 يوماً للمشاركة</button>
  <h3 class="sec">حسب المادة</h3>
  ${subs.length?subs.map(x=>{const sj=subjOf(x.id);return `<div class="item" style="--sc:${safeC(sj.c)}"><div class="grow"><div class="nm">${esc(sj.n)}</div><div class="sub">${ar(x.n)} سؤال، ${ar(x.p)}% صح</div><div class="bar"><i style="width:${x.p}%"></i></div></div></div>`}).join(''):'<div class="empty">ما عندك نشاط بهذه الفترة. ابدأ مراجعة حتى تظهر إحصائياتك.</div>'}
  <h3 class="sec">تقرير الأيام</h3>
  ${rows?`<div class="panel">${rows}</div>`:'<div class="empty">لا توجد أيام نشطة بهذه الفترة.</div>'}
  <button class="btn line block" id="shprog" style="margin-top:12px">شارك إنجازي</button>
  <h3 class="sec">الشارات</h3>
  <div class="badges">${BADGES.map(b=>`<div class="bd${S.badges[b.id]?' on':''}"${S.badges[b.id]?` data-bsh="${b.id}" role="button" tabindex="0"`:''}><div class="bg">${b.g}</div><b>${b.t}</b><small>${S.badges[b.id]?fdate(S.badges[b.id]):b.d}</small></div>`).join('')}</div>
  <h3 class="sec">الامتحانات التجريبية</h3>
  ${S.exams.length?`<div class="panel">${S.exams.slice(0,5).map(x=>{const d=new Date(x.t);return `<div class="rep${x.ids?' rx':''}"><span>${ar(d.getDate()+'/'+(d.getMonth()+1))}</span><span>${ar(Math.round(100*x.ok/x.n))}%</span><span><bdi dir="ltr">${ar(x.ok)} / ${ar(x.n)}</bdi></span><span>${fmtT(x.sec)}</span>${x.ids?`<button class="ib" data-exr="${esc(x.t)}">مراجعة</button>`:''}</div>`}).join('')}</div>`:'<div class="empty">ما أجريت امتحاناً تجريبياً بعد.</div>'}
  <p class="note">أتقنت ${ar(mastered)} من ${ar(seen)} سؤال تعاملت معه. ${Store.user?'تقدمك محفوظ على حسابك ويظهر على أي جهاز تدخل منه.':'الإحصائيات محفوظة على هذا الجهاز فقط.'}</p>`;
  $('bkP').onclick=home;
  app.querySelectorAll('[data-exr]').forEach(b=>b.onclick=()=>examReopen(+b.dataset.exr));
  $('msb').onclick=monthSummary;
  {const rb=$('rdyb');if(rb)rb.onclick=()=>readyModal()}
  $('shprog').onclick=()=>shareCard('stats');
  app.querySelectorAll('[data-bsh]').forEach(b=>{b.onclick=()=>shareCard('badge',b.dataset.bsh)});
  app.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{P.range=+b.dataset.r;progress()});
  window.scrollTo(0,0);
}

/* ---------- الاشتراك ---------- */

document.addEventListener('pointerdown',function(e){
  var t=e.target.closest&&e.target.closest('.btn,.row,.fold,.reqb,.opt,.ib,.pill,.seg button,.back,.x,.cl');
  if(!t||t.disabled)return;
  var r=t.getBoundingClientRect(),d=Math.max(r.width,r.height)*2,sp=document.createElement('span');
  sp.className='rp';
  sp.style.cssText='width:'+d+'px;height:'+d+'px;left:'+(e.clientX-r.left-d/2)+'px;top:'+(e.clientY-r.top-d/2)+'px';
  t.appendChild(sp);setTimeout(function(){sp.remove()},700);
  try{if(navigator.vibrate)navigator.vibrate(6)}catch(x){}
},{passive:true});

/* ---------- زر الرجوع في الهاتف: يرجع للشاشة السابقة بدل الخروج من الموقع ---------- */
const NAV={last:null,pop:false};
const navKey=()=>{if(view==='boot'||view==='examwait')return null;return view+(view==='home'?'|'+(F.sp||'')+'|'+(F.sj||''):'')};
const navPush=()=>{try{history.pushState({bc:1},'')}catch(e){}};
function navBack(){
  {const z=document.querySelector('.zoomv');if(z){z.remove();return}}
  if(modal.innerHTML.trim()){closeModal();return}
  if(view==='home'){if(F.sj){F.sj=null;home();return}if(F.sp){F.sp=null;home();return}return}
  for(const id of ['bk','dqx','xq','chh','lvb','sqb','dqh','bkR','pqx','pqb','pqback']){const el=$(id);if(el){el.click();return}}
  home();
}
try{history.replaceState({bc:0},'')}catch(e){}
try{
  new MutationObserver(()=>{
    const k=navKey();if(k==null||k===NAV.last)return;
    const first=NAV.last==null;NAV.last=k;
    if(!first&&!NAV.pop)navPush();
  }).observe(app,{childList:true});
  window.addEventListener('popstate',()=>{
    if(view==='liverun'){toast('أنت داخل امتحان حي، اضغط «إنهاء» للخروج.');navPush();return}
    const before=navKey(),hadModal=!!modal.innerHTML.trim();
    NAV.pop=true;
    try{navBack()}catch(e){}
    const after=navKey();if(after!=null)NAV.last=after;
    NAV.pop=false;
    const atRoot=view==='home'&&!F.sp&&!F.sj;
    if(hadModal||(after===before&&!atRoot))navPush();
  });
}catch(e){}

/* ---------- تنبيه انقطاع الإنترنت وعودته ---------- */
if(window.addEventListener){
  window.addEventListener('offline',()=>toast('انقطع الاتصال بالإنترنت. عرض الأجوبة يحتاج اتصالاً.'));
  window.addEventListener('online',()=>{
    if(Store.err&&!Store.ready){location.reload();return}
    toast('عاد الاتصال بالإنترنت.');
    try{pushProgress();pushNotes();pushPQ()}catch(e){}
  });
}

/* ================= ميزات جديدة ================= */
/* ---------- استبعاد الخيارات: ضغطة مطوّلة (أو زر الفأرة الأيمن، أو Shift مع الحرف) تشطب الخيار قبل الإجابة ---------- */
const STRK={};
const skCls=(c,i)=>c&&STRK[c.id]&&STRK[c.id][i]?' strk':'';
function skQid(){
  if(view==='liverun')return LR&&LR.qs[LR.k]?LR.qs[LR.k].id:null;
  if(view==='pqstudy')return PS?PS.Q[PS.i]:null;
  if(view==='exam')return X&&X.qs[X.i]?X.qs[X.i].id:null;
  return cur?cur.id:null;
}
function skToggle(b){
  const id=skQid(),i=+b.dataset.i;
  if(id==null||!(i>=0))return;
  const m=STRK[id]||(STRK[id]={});
  if(m[i])delete m[i];else m[i]=1;
  b.classList.toggle('strk',!!m[i]);
  try{if(navigator.vibrate)navigator.vibrate(18)}catch(e){}
  if(!lsGet('bc_sk_tip')){lsSet('bc_sk_tip','1');document.querySelectorAll('.sktip').forEach(x=>x.remove())}
}
let skT=null,skSup=0,skAt=0,skXY=null,skPT='',skLast=null;
const skStop=()=>{if(skT){clearTimeout(skT);skT=null}};
const skBtn=e=>e.target&&e.target.closest?e.target.closest('button.opt'):null;
try{
  app.addEventListener('pointerdown',e=>{
    skStop();
    const b=skBtn(e);skPT=e.pointerType||'';
    if(!b||b.disabled||b.classList.contains('wait')||(e.pointerType==='mouse'&&e.button!==0))return;
    skXY=[e.clientX,e.clientY];
    skT=setTimeout(()=>{skT=null;if(!b.isConnected||(skLast===b&&Date.now()-skAt<900))return;skAt=skSup=Date.now();skLast=b;skToggle(b)},450);
  });
  app.addEventListener('pointermove',e=>{if(skT&&skXY&&(Math.abs(e.clientX-skXY[0])>10||Math.abs(e.clientY-skXY[1])>10))skStop()});
  ['pointerup','pointercancel'].forEach(t=>document.addEventListener(t,skStop));
  app.addEventListener('contextmenu',e=>{
    const b=skBtn(e);if(!b)return;
    e.preventDefault();
    if(skLast===b&&Date.now()-skAt<900)return;          // الضغطة المطوّلة نفسها سبق أن شطبت هذا الخيار
    skStop();skAt=Date.now();skLast=b;if(skPT!=='mouse')skSup=skAt;
    skToggle(b);
  });
  // رفع الإصبع بعد الضغطة المطوّلة لا يُحسب إجابة
  document.addEventListener('click',e=>{
    if(!skSup)return;
    const fresh=Date.now()-skSup<900;skSup=0;
    if(fresh&&skBtn(e)){e.stopPropagation();e.preventDefault()}
  },true);
}catch(e){}

/* ---------- المستويات ---------- */
const LEVELS=[[0,'طالب جديد'],[50,'متدرّب'],[200,'مقيم دوري'],[500,'مقيم أقدم'],[1000,'اختصاصي'],[2500,'استشاري'],[5000,'بروفيسور']];
function levelInfo(){
  const t=S.total||0;let i=0;
  while(i+1<LEVELS.length&&t>=LEVELS[i+1][0])i++;
  const nx=LEVELS[i+1]||null,lo=LEVELS[i][0];
  return {i:i,name:LEVELS[i][1],next:nx,left:nx?nx[0]-t:0,p:nx?Math.round(100*(t-lo)/(nx[0]-lo)):100};
}
function levelHtml(){
  const l=levelInfo();
  return `<div class="item" style="--sc:#D99A00"><div class="grow"><div class="nm">🎖 المستوى ${ar(l.i+1)}: ${l.name}</div><div class="sub">${l.next?'باقي '+ar(l.left)+' سؤالاً لتصل إلى «'+l.next[1]+'»':'وصلت إلى أعلى مستوى. أحسنت!'}</div><div class="bar"><i style="width:${l.p}%"></i></div></div></div>`;
}

/* ---------- خريطة النشاط: آخر 15 أسبوعاً، كل عمود أسبوع يبدأ بالسبت ---------- */
function heatHtml(){
  const now=new Date(),g=S.goal||20,ix=(now.getDay()+1)%7,total=14*7+ix+1;let cells='',act=0;
  for(let k=total-1;k>=0;k--){
    const dt=new Date(now.getFullYear(),now.getMonth(),now.getDate()-k),key=dk(dt),n=(S.days[key]&&S.days[key].n)||0;
    if(n)act++;
    cells+=`<i class="${!n?'':n>=g?'h3':n>=g/2?'h2':'h1'}${S.frozen&&S.frozen[key]?' hz':''}" title="${dt.getDate()}/${dt.getMonth()+1}: ${n} سؤال"></i>`;
  }
  return `<h3 class="sec">خريطة نشاطك</h3><div class="panel" style="padding-bottom:12px"><div class="heat" role="img" aria-label="نشاطك اليومي خلال آخر 15 أسبوعاً">${cells}</div></div><p class="hint" style="margin:6px 2px 0">كل مربع يوم، وكل عمود أسبوع يبدأ بالسبت. الأغمق يعني أنك أنجزت هدفك اليومي (${ar(g)} سؤالاً)، والإطار الذهبي يوم إجازة. درست ${ar(act)} يوماً من آخر ${ar(total)}.</p>`;
}

/* ---------- مؤشر الجاهزية للامتحان ----------
   النتيجة المتوقعة لو امتحن الطالب اليوم بكل أسئلة الاختصاص:
   الأسئلة التي مرّ عليها تُحسب باحتمال تذكّره لها الآن (من جدولة FSRS)، والتي لم يمرّ عليها تُحسب بدقته العامة مخفّضة. يُحسب كله على الجهاز. */
let RD=null;
const RD_MIN=30;
const rdVerdict=s=>s>=80?'جاهز للامتحان 💪':s>=65?'قريب من الجاهزية':s>=50?'في منتصف الطريق':'تحتاج مذاكرة أكثر';
const rdColor=s=>s>=80?'#2E9E5B':s>=65?'var(--accent)':s>=50?'#D99A00':'var(--bad)';
function readiness(sp){
  const st=stats({sp:sp});if(!st.open)return null;
  const now=Date.now();let seen=0,sumR=0;
  Object.keys(S.cards).forEach(id=>{
    const e=S.cards[id];if(!e||!e.s||qSp(e)!==sp||goneQ(id,e))return;
    let R=e.sb&&e.lr?fR(Math.max(0,(now-e.lr)/864e5),e.sb):(e.box>0?0.7:0.4);
    if(e.box===0)R=Math.min(R,0.5);
    seen++;sumR+=R;
  });
  const n=Math.min(seen,st.open),ret=seen?sumR/seen:0;
  const d0=new Date();let an=0,aok=0;
  for(let i=0;i<60;i++){
    const d=S.days[dk(new Date(d0.getFullYear(),d0.getMonth(),d0.getDate()-i))];if(!d)continue;
    Object.keys(d.subj||{}).forEach(sid=>{if(spOfSubj(subjOf(sid))!==sp)return;an+=d.subj[sid].n||0;aok+=d.subj[sid].ok||0});
  }
  const acc=an>=10?aok/an:null;
  const pU=fclamp((acc==null?0.5:acc)*0.8,0.2,0.75);
  const score=(n*ret+(st.open-n)*pU)/st.open;
  return {score:Math.round(100*score),cov:Math.round(100*n/st.open),ret:Math.round(100*ret),acc:acc==null?null:Math.round(100*acc),seen:seen,open:st.open,mast:Math.min(st.mastered,st.open),enough:seen>=RD_MIN};
}
function readyHtml(){
  if(F.sp||F.sj||!Store.user)return '';
  const list=Object.keys(Store.subs).filter(id=>id!=='_none').map(id=>({id:id,r:readiness(id)})).filter(x=>x.r&&x.r.enough);
  if(!list.length)return '';
  const one=list.length===1?list[0]:null;
  return `<div class="dq" data-rd="1" role="button" tabindex="0" aria-label="مؤشر الجاهزية"><div class="dqi">📈</div><div class="gt"><b>${one?'جاهزيتك في '+esc(spById(one.id).n)+': <bdi dir="ltr">'+ar(one.r.score)+'%</bdi>':'مؤشر الجاهزية للامتحان'}</b><span>${one?rdVerdict(one.r.score):list.map(x=>esc(spById(x.id).n)+' <bdi dir="ltr">'+ar(x.r.score)+'%</bdi>').join(' · ')}</span><small>نتيجتك المتوقعة لو امتحنت اليوم</small></div><span class="pill">تفاصيل</span></div>`;
}
function readyModal(sp){
  const ids=(sp?[sp]:Object.keys(Store.subs)).filter(id=>id&&id!=='_none'),C=163.4;
  const body=ids.map(id=>{
    const r=readiness(id),spn=esc(spById(id).n);
    if(!r)return '';
    if(!r.enough)return `<h3 class="sec">${spn}</h3><div class="empty" style="margin-top:0">حل ${ar(RD_MIN-r.seen)} سؤالاً إضافياً في هذا الاختصاص ليظهر مؤشر جاهزيتك.</div>`;
    const d=S.exd&&S.exd[id]?exDays(S.exd[id]):null;
    let tip;
    if(r.cov<60)tip='الأولوية الآن للأسئلة الجديدة: لم تمرّ بعد على '+ar(100-r.cov)+'% من أسئلة الاختصاص.';
    else if(r.ret<80)tip='الأولوية الآن للمراجعات المستحقة: احتمال تذكّرك الحالي '+ar(r.ret)+'%، فلا تدع المستحق يتراكم.';
    else tip='وتيرتك ممتازة. أكمل الأسئلة الباقية وحافظ على مراجعاتك اليومية.';
    if(d!=null&&d>0){const left=Math.max(0,r.open-r.mast);tip+=' باقي '+ar(d)+' يوماً على امتحانك'+(left?'، وتحتاج '+ar(Math.ceil(left/d))+' سؤالاً يومياً لتتقن الباقي.':'.')}
    return `<h3 class="sec">${spn}</h3>
      <div class="rdy"><svg viewBox="0 0 64 64" width="78" height="78" role="img" aria-label="${r.score}%"><circle cx="32" cy="32" r="26" fill="none" stroke="var(--chip)" stroke-width="7"/><circle cx="32" cy="32" r="26" fill="none" stroke="${rdColor(r.score)}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${(C*(1-r.score/100)).toFixed(1)}" transform="rotate(-90 32 32)"/><text x="32" y="37.5" text-anchor="middle" direction="ltr" font-size="15" font-weight="700" fill="currentColor">${r.score}%</text></svg>
      <div class="gt"><b>${rdVerdict(r.score)}</b><span>نتيجتك المتوقعة لو امتحنت اليوم بكل أسئلة الاختصاص</span></div></div>
      <div class="rdy3"><div><b>${ar(r.cov)}%</b><span>التغطية</span></div><div><b>${ar(r.ret)}%</b><span>التذكّر الآن</span></div><div><b>${r.acc==null?'—':ar(r.acc)+'%'}</b><span>دقة آخر 60 يوماً</span></div></div>
      <p class="hint">${tip}</p>
      <div class="r2" style="margin-bottom:6px"><button class="btn" data-rdgo="${esc(id)}">ابدأ المراجعة</button><button class="btn line" data-rdsh="${esc(id)}">شارك</button></div>`;
  }).join('');
  showModal(`<button class="x" id="cl" aria-label="إغلاق">✕</button><h2>📈 مؤشر الجاهزية</h2>${body||'<div class="empty">المؤشر متاح للاختصاصات التي اشتركت بها.</div>'}<p class="hint" style="margin-top:10px">تقدير تقريبي مبني على نسبة ما غطّيته من الأسئلة واحتمال تذكّرك له الآن، وليس ضماناً لنتيجة الامتحان.</p>`);
  $('cl').onclick=closeModal;
  modal.querySelectorAll('[data-rdgo]').forEach(b=>b.onclick=()=>{const id=b.dataset.rdgo;closeModal();start(null,id,undefined,{mode:'smart'})});
  modal.querySelectorAll('[data-rdsh]').forEach(b=>b.onclick=()=>{const id=b.dataset.rdsh,r=readiness(id);if(!r)return;RD={sp:id,score:r.score,cov:r.cov,ret:r.ret};closeModal();shareCard('ready')});
}

/* ---------- اختصارات لوحة المفاتيح (للحاسوب) ----------
   A-F أو 1-6: اختيار الجواب · المسافة/Enter: عرض الجواب أو التالي · 1-4: التقييم بعد الجواب · الأسهم: التنقل في الامتحان · Esc: إغلاق النافذة */
let flipAt=0;
const kbHintHtml=()=>{try{return window.matchMedia&&matchMedia('(hover:hover) and (pointer:fine)').matches?'<p class="hint" style="margin:12px 2px 0">اختصارات لوحة المفاتيح: <bdi dir="ltr">A-F</bdi> أو <bdi dir="ltr">1-6</bdi> لاختيار الجواب، المسافة لعرض الجواب أو السؤال التالي، <bdi dir="ltr">1-4</bdi> للتقييم، والأسهم للتنقل في الامتحان، و<bdi dir="ltr">Shift</bdi> مع الحرف لاستبعاد خيار.</p>':''}catch(e){return ''}};
document.addEventListener('keydown',e=>{
  if(e.defaultPrevented||e.ctrlKey||e.metaKey||e.altKey||e.isComposing)return;
  const t=e.target,tg=(t&&t.tagName)||'';
  if(e.key==='Escape'){
    const z=document.querySelector('.zoomv');if(z){z.remove();return}
    if(modal.innerHTML.trim())closeModal();
    return;
  }
  if(e.repeat||tg==='INPUT'||tg==='TEXTAREA'||tg==='SELECT'||(t&&t.isContentEditable)||modal.innerHTML.trim()||document.querySelector('.zoomv'))return;
  // نعتمد موضع المفتاح (code) حتى تعمل الاختصارات والكيبورد على العربية
  const code=e.code||'',mL=/^Key([A-F])$/.exec(code),mD=/^(?:Digit|Numpad)([1-6])$/.exec(code);
  const li=mL?mL[1].charCodeAt(0)-65:-1,di=mD?+mD[1]-1:(/^[1-6]$/.test(e.key)?+e.key-1:-1);
  const pickI=li>=0?li:di,go=e.key===' '||e.key==='Enter';
  if(go&&(tg==='BUTTON'||tg==='A'||tg==='SUMMARY'))return;   // العنصر المحدَّد يستجيب وحده
  const hit=el=>{if(!el||el.disabled)return false;e.preventDefault();el.click();return true};
  const opt=i=>hit(app.querySelectorAll('button.opt')[i]);
  if(e.shiftKey&&li>=0&&(((view==='study'||view==='dq')&&!answered)||view==='exam'||view==='liverun')){   // Shift مع الحرف: استبعاد الخيار
    const kb2=app.querySelectorAll('button.opt')[li];if(kb2){e.preventDefault();skToggle(kb2)}
    return;
  }
  if(view==='study'){
    if(!answered){if(pickI>=0)opt(pickI);else if(go)hit($('rv'));return}
    if(Date.now()-flipAt<500)return;   // حتى لا تُحسب ضغطة الاختيار نفسها تقييماً
    if(di>=0&&di<4){hit(app.querySelector('.back [data-g="'+(di+1)+'"]'));return}
    if(go)hit($('nx')||app.querySelector('.back [data-g="3"]'));
    return;
  }
  if(view==='dq'){if(!answered){if(pickI>=0)opt(pickI)}else if(go)hit($('dqn'));return}
  if(view==='exam'){
    if(pickI>=0){opt(pickI);return}
    if(e.key==='ArrowLeft'){if(X&&X.i<X.qs.length-1)hit($('xnx'));return}
    if(e.key==='ArrowRight')hit($('xp'));
    return;
  }
  if(view==='liverun'){
    if(pickI>=0){opt(pickI);return}
    if(e.key==='ArrowLeft')hit($('lvn2'));else if(e.key==='ArrowRight')hit($('lvp'));
    return;
  }
  if(view==='pqstudy'){
    if(app.querySelector('button.opt')){if(pickI>=0)opt(pickI);return}
    if(di>=0&&di<4&&hit(app.querySelector('[data-g="'+(di+1)+'"]')))return;
    if(go)hit($('pqshow')||$('pqn'));
  }
});

startApp();
