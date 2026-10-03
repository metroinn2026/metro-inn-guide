/* Published recommendations: curated first, then area/tags, with category variety. */
(function(){'use strict';
const tables={spots:['spot.html','景點'],foods:['food.html','美食'],trips:['trip.html','行程'],events:['activity.html','活動'],coupons:['coupon.html','優惠'],news:['news-detail.html','最新消息'],stories:['stories.html','遊記']};
const pageTypes=Object.fromEntries(Object.entries(tables).map(([type,value])=>[value[0],type]));
const key=x=>`${x.type}:${x.id}`;
const tags=x=>(Array.isArray(x)?x:String(x||'').split(/[、,，|；;]/)).map(v=>String(v).trim()).filter(Boolean);
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function eligible(x,date){return x.is_published===true&&x.id!=null&&(!['events','coupons'].includes(x.type)||!x.end_date||String(x.end_date).slice(0,10)>=date);}
function areas(x){const explicit=tags(x.area||x.region);if(explicit.length)return explicit;const text=[x.title,x.address,x.venue_name].filter(Boolean).join(' ');return ['新北投','北投','陽明山','士林','淡水'].filter(a=>text.includes(a)&&!(a==='北投'&&text.includes('新北投')));}
function score(current,x){const a=areas(current),b=areas(x);const t=tags(current.tags),u=tags(x.tags);return (a.some(v=>b.includes(v))?100:0)+t.filter(v=>u.includes(v)).length*20+(current.category&&current.category===x.category?10:0);}
function pick(current,rows,type,date=today()){
 const candidates=rows.filter(x=>eligible(x,date)&&!(x.type===type&&String(x.id)===String(current.id)));
 const chosen=[],seen=new Set();
 for(const ref of Array.isArray(current.related_items)?current.related_items:[]){const x=candidates.find(x=>key(x)===key(ref));if(x&&!seen.has(key(x))){chosen.push(x);seen.add(key(x));}if(chosen.length===3)break;}
 const sorted=candidates.filter(x=>!seen.has(key(x))).sort((a,b)=>score(current,b)-score(current,a)||String(a.id).localeCompare(String(b.id)));
 while(chosen.length<3&&sorted.length){const used=new Set(chosen.map(x=>x.type));const best=score(current,sorted[0]);let i=sorted.findIndex(x=>score(current,x)===best&&!used.has(x.type));if(i<0)i=0;chosen.push(sorted.splice(i,1)[0]);}
 return chosen;
}
const headers=()=>({apikey:SUPABASE_ANON_KEY,Authorization:`Bearer ${SUPABASE_ANON_KEY}`});
let pool;
async function fetchTable(type){const rows=[];for(let offset=0;;offset+=500){const q=new URLSearchParams({select:'*',is_published:'eq.true',order:'id.asc',limit:'500',offset:String(offset)});const r=await fetch(`${SUPABASE_URL}/rest/v1/${type}?${q}`,{headers:headers()});if(!r.ok)throw Error(type);const batch=await r.json();rows.push(...batch.map(x=>({...x,type})));if(batch.length<500)break;}return rows;}
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;}
function safeImage(url){try{const u=new URL(url,location.href);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}}
async function renderRelatedReading(record,container,type){
 if(!container)return;container.hidden=true;container.replaceChildren();
 try{
 type=type||pageTypes[location.pathname.split('/').pop()];
 pool=pool||Promise.allSettled(Object.keys(tables).filter(x=>x!=='stories').map(fetchTable)).then(results=>results.flatMap(r=>r.status==='fulfilled'?r.value:[]));
 const rows=(await pool).slice();
 if((record.related_items||[]).some(x=>x.type==='stories')){try{const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_published_travel_stories`,{headers:headers()});if(r.ok)rows.push(...(await r.json()).filter(x=>x.submission_type==='travel_story').map(x=>({...x,type:'stories',is_published:true})));}catch{}}
 const items=pick(record,rows,type);if(!items.length)return;
 const wrap=el('div','container');wrap.append(el('div','kicker','READ MORE'),el('h2','','延伸閱讀'));const grid=el('div','rel-grid auto-reading-grid');
 items.forEach(item=>{const a=el('a','rel');a.href=tables[item.type][0]+(item.type==='stories'?'#story-':'?id=')+encodeURIComponent(item.id);const photo=el('div','rel-img');const src=safeImage(item.cover_image);if(src){const img=el('img');img.src=src;img.alt='';img.loading='lazy';if(item.type==='events')photo.classList.add('poster');photo.append(img);}else photo.append(el('span','',tables[item.type][1]));a.append(photo,el('div','meta',tables[item.type][1]),el('h3','',item.title||'閱讀更多'));grid.append(a);});wrap.append(grid);container.append(wrap);container.hidden=false;
 }catch(error){console.warn('延伸閱讀暫時無法載入',error);}
}
window.renderRelatedReading=renderRelatedReading;
window.MetroRelatedReading={pick,score};
})();
