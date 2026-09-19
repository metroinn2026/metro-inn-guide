/* Curated reading for published content only. */
(function(){'use strict';
const tables={spots:['spot.html','景點'],foods:['food.html','美食'],trips:['trip.html','行程'],stories:['stories.html','遊記']};
function el(tag,cls,text){const node=document.createElement(tag);if(cls)node.className=cls;if(text!=null)node.textContent=text;return node;}
async function renderRelatedReading(record,container){
  if(!container)return;
  container.hidden=true;container.replaceChildren();
  const selected=Array.isArray(record?.related_items)?record.related_items.slice(0,4):[];
  const valid=selected.filter(x=>x&&tables[x.type]&&typeof x.id==='string'&&x.id);
  if(!valid.length)return;
  const fetched=await Promise.all(valid.map(async ref=>{
    try{
      const url=ref.type==='stories'?`${SUPABASE_URL}/rest/v1/rpc/get_published_travel_stories`:`${SUPABASE_URL}/rest/v1/${ref.type}?id=eq.${encodeURIComponent(ref.id)}&is_published=eq.true&select=id,title,summary,cover_image`;
      const res=await fetch(url,{headers:{apikey:SUPABASE_ANON_KEY,Authorization:`Bearer ${SUPABASE_ANON_KEY}`}});
      if(!res.ok)return null;
      const rows=await res.json();const row=ref.type==='stories'?rows.find(x=>String(x.id)===String(ref.id)&&x.submission_type==='travel_story'):rows[0];return row?{...row,type:ref.type}:null;
    }catch{return null;}
  }));
  const items=fetched.filter(Boolean);if(!items.length)return;
  const wrap=el('div','container');wrap.append(el('div','kicker','MORE STORIES'),el('h2','','延伸閱讀'));
  const grid=el('div','rel-grid');
  items.forEach(item=>{
    const link=el('a','rel');link.href=tables[item.type][0]+(item.type==='stories'?'#story-':'?id=')+encodeURIComponent(item.id);
    const photo=el('div','rel-img');if(item.cover_image){const img=el('img');img.src=item.cover_image;img.alt='';img.loading='lazy';photo.append(img);}
    link.append(photo,el('div','meta',tables[item.type][1]),el('h3','',item.title||'閱讀更多'));grid.append(link);
  });wrap.append(grid);container.append(wrap);container.hidden=false;
}
window.renderRelatedReading=renderRelatedReading;
})();
