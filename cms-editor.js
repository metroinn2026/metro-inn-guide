/* 共用表單元件：僅產生表單及讀取值，不自行寫入資料庫。 */
(function(global){'use strict';
const excluded=new Set(['id','is_published','review_status','review_note','reviewed_at','reviewed_by','source_urls']);
function mount(root,type,record,options={}){
 if(!global.MetroCmsSchema?.hasType(type))throw Error('不支援的內容類型');
 root.replaceChildren();const schema=global.MetroCmsSchema,groups=schema.groups(type),definitions=new Map(schema.fields(type).map(f=>[f[0],f]));const inputs=new Map();const invalid=new Set();const bar=document.createElement('div'),panel=document.createElement('div');bar.className='row';root.append(bar,panel);
 function makeSections(key,label){
  const wrap=document.createElement('div');wrap.className='cms-sections';
  const heading=document.createElement('h3');heading.textContent=label+'（視覺化編輯）';wrap.append(heading);
  const list=document.createElement('div');wrap.append(list);
  function commit(){record[key].forEach((item,i)=>{item.order=i+1;});options.onChange?.(key);}
  function render(){list.replaceChildren();record[key].forEach((section,index)=>{
    const card=document.createElement('fieldset');card.style.cssText='border:1px solid #ccc;padding:12px;margin:10px 0;min-width:0';
    const legend=document.createElement('legend');legend.textContent='第 '+(index+1)+' 段';card.append(legend);
    for(const [field,title,multiline] of [['time','時間',false],['title','段落標題',false],['text','段落說明',true],['image','圖片網址',false],['image_source','圖片來源',false]]){
      const labelEl=document.createElement('label');labelEl.textContent=title+' ';const el=document.createElement(multiline?'textarea':'input');if(multiline)el.rows=4;else el.type='text';el.value=section[field]??(field==='text'?section.description??'':'');el.oninput=()=>{section[field]=el.value;commit();};labelEl.append(el);card.append(labelEl);
    }
    const actions=document.createElement('div');actions.className='row';
    for(const [text,delta] of [['↑ 上移',-1],['↓ 下移',1]]){const button=document.createElement('button');button.type='button';button.textContent=text;button.disabled=index+delta<0||index+delta>=record[key].length;button.onclick=()=>{const other=index+delta;[record[key][index],record[key][other]]=[record[key][other],record[key][index]];commit();render();};actions.append(button);}
    const remove=document.createElement('button');remove.type='button';remove.textContent='刪除此段';remove.onclick=()=>{if(!confirm('確定刪除此行程段落？'))return;record[key].splice(index,1);commit();render();};actions.append(remove);card.append(actions);list.append(card);
  });}
  if(!Array.isArray(record[key])){record[key]=[];}
  const add=document.createElement('button');add.type='button';add.textContent='＋新增行程段落';add.onclick=()=>{record[key].push({time:'',title:'',text:'',image:'',image_source:'',order:record[key].length+1});commit();render();};wrap.append(add);render();return wrap;
 }
 function makeRoutes(key,label){
  const wrap=document.createElement('div');wrap.className='cms-route-builder';
  const title=document.createElement('label');title.textContent='交通路線';title.style.cssText='display:block;font-weight:700;margin-bottom:6px';wrap.append(title);
  const help=document.createElement('p');help.textContent='依照旅客實際行進順序新增步驟，例如：步行 → 捷運 → 步行。可新增多條推薦路線。';help.style.cssText='color:#64748b;font-size:13px;margin:0 0 12px';wrap.append(help);
  const list=document.createElement('div');wrap.append(list);
  const importBox=document.createElement('div');importBox.style.cssText='margin:0 0 12px;padding:10px;border:1px solid #d8e2f0';
  const importLabel=document.createElement('label');importLabel.textContent='匯入已整理的交通路線 JSON（僅更新本筆交通資料）';importLabel.style.cssText='display:block;font-size:13px;font-weight:600;margin-bottom:6px';
  const importInput=document.createElement('input');importInput.type='file';importInput.accept='.json,application/json';importInput.setAttribute('aria-label','選擇交通路線 JSON 檔案');
  const importMessage=document.createElement('p');importMessage.style.cssText='font-size:12px;color:#64748b;margin:6px 0 0';importMessage.textContent='匯入後可逐步微調；按儲存草稿前不會寫入資料庫。';
  importBox.append(importLabel,importInput,importMessage);wrap.append(importBox);
  importInput.addEventListener('change',async()=>{
    const file=importInput.files?.[0];if(!file)return;
    try{
      const parsed=JSON.parse(await file.text());
      const routes=Array.isArray(parsed)?parsed:parsed.transport_routes;
      if(!Array.isArray(routes)||!routes.every(r=>r&&typeof r==='object'&&Array.isArray(r.steps)&&r.steps.every(st=>st&&typeof st==='object'&&typeof st.type==='string'))){throw Error('檔案必須包含 transport_routes 路線陣列及每條路線的 steps 步驟');}
      if(!Array.isArray(parsed)&&parsed.id&&record.id&&String(parsed.id)!==String(record.id))throw Error('檔案資料編號與目前編輯項目不符，已阻止匯入');
      if(!confirm('將以匯入路線取代本筆現有交通路線（其他欄位不變）。確定繼續？'))return;
      record[key]=structuredClone(routes);invalid.delete(key);render();changed();importMessage.textContent='已匯入 '+routes.length+' 條路線，請核對步行時間與站名，再儲存草稿。';
    }catch(err){importMessage.textContent='匯入失敗：'+err.message;}
    finally{importInput.value='';}
  });
  const original=record[key];
  if(original==null||(typeof original==='object'&&!Array.isArray(original)&&!Object.keys(original).length))record[key]=[];
  if(!Array.isArray(record[key])){
    const warning=document.createElement('p');warning.textContent='原有交通資料格式不是路線清單，為避免覆蓋，請先檢查原始資料。';warning.style.color='#b91c1c';wrap.append(warning);invalid.add(key);return wrap;
  }
  function changed(){invalid.delete(key);options.onChange?.(key);}
  function field(label,value,handler,multi=false){
    const holder=document.createElement('label');holder.style.cssText='display:block;flex:1;min-width:130px;font-size:13px;font-weight:600;margin:5px 0';holder.textContent=label;
    const input=document.createElement(multi?'textarea':'input');if(!multi)input.type='text';else input.rows=2;
    input.value=value??'';input.style.cssText='display:block;width:100%;box-sizing:border-box;margin-top:5px';input.oninput=()=>{handler(input.value);changed();};holder.append(input);return holder;
  }
  function button(label,action){const el=document.createElement('button');el.type='button';el.textContent=label;el.onclick=action;return el;}
  function render(){list.replaceChildren();record[key].forEach((route,ri)=>{
    const card=document.createElement('fieldset');card.style.cssText='border:1px solid #d8e2f0;border-radius:8px;padding:12px;margin:0 0 14px;min-width:0';
    const legend=document.createElement('legend');legend.textContent='推薦路線 '+(ri+1);card.append(legend);
    card.append(field('路線名稱',route.title,v=>route.title=v));
    const enabled=document.createElement('label');enabled.style.cssText='display:block;font-size:13px;margin:8px 0';const check=document.createElement('input');check.type='checkbox';check.checked=route.enabled!==false;check.onchange=()=>{route.enabled=check.checked;changed();};enabled.append(check,document.createTextNode(' 啟用這條路線'));card.append(enabled);
    (route.steps||[]).forEach((step,si)=>{
      const line=document.createElement('div');line.style.cssText='border:1px solid #e3eaf4;border-radius:6px;padding:10px;margin:8px 0';
      const head=document.createElement('div');head.style.cssText='display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap';const label=document.createElement('strong');label.textContent='步驟 '+(si+1);head.append(label);
      const controls=document.createElement('span');for(const [text,delta] of [['↑',-1],['↓',1]]){const b=button(text,()=>{const other=si+delta;[route.steps[si],route.steps[other]]=[route.steps[other],route.steps[si]];changed();render();});b.disabled=si+delta<0||si+delta>=route.steps.length;b.setAttribute('aria-label',text==='↑'?'步驟上移':'步驟下移');controls.append(b);}controls.append(button('刪除',()=>{route.steps.splice(si,1);changed();render();}));head.append(controls);line.append(head);
      const typeLabel=document.createElement('label');typeLabel.textContent='交通方式';typeLabel.style.cssText='display:block;font-size:13px;font-weight:600;margin-top:8px';const select=document.createElement('select');select.style.cssText='display:block;width:100%;margin-top:5px';for(const type of ['步行','捷運','公車','轉乘','抵達']){const option=document.createElement('option');option.value=type;option.textContent=type;select.append(option);}if(!['步行','捷運','公車','轉乘','抵達'].includes(step.type)){const option=document.createElement('option');option.value=step.type||'';option.textContent=(step.type||'未設定')+'（原資料）';select.append(option);}select.value=step.type||'步行';select.onchange=()=>{step.type=select.value;changed();render();};typeLabel.append(select);line.append(typeLabel);
      line.append(field('地點／站名',step.name,v=>step.name=v));
      if(step.type==='捷運'||step.type==='公車'){
        line.append(field('路線名稱／公車號碼',step.line,v=>step.line=v),field('搭乘方向',step.direction,v=>step.direction=v));
      }
      line.append(field('預估時間（分鐘，選填）',step.duration,v=>step.duration=v),field('距離（選填，例如 500 公尺）',step.distance,v=>step.distance=v),field('補充說明（選填）',step.detail,v=>step.detail=v,true));card.append(line);
    });
    const actions=document.createElement('div');actions.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-top:10px';actions.append(button('＋ 新增步驟',()=>{route.steps=route.steps||[];route.steps.push({type:'步行',name:'',line:'',direction:'',duration:'',distance:'',detail:''});changed();render();}),button('刪除整條路線',()=>{if(!confirm('確定刪除這條推薦路線？'))return;record[key].splice(ri,1);changed();render();}));card.append(actions);list.append(card);
  });}
  const add=button('＋ 新增推薦路線',()=>{record[key].push({title:'從北捷行旅出發',enabled:true,steps:[{type:'步行',name:'北捷行旅',detail:'起點'}]});changed();render();});wrap.append(add);render();return wrap;
 }
 function make(tab,append=false){if(!append){inputs.clear();panel.replaceChildren();}for(const name of groups[tab]){if(excluded.has(name))continue;const spec=definitions.get(name);if(!spec)continue;const [key,label,kind,rule]=spec;if(key==='transport_routes'){panel.append(makeRoutes(key,label));continue;}if(kind==='sections'){panel.append(makeSections(key,label));continue;}const wrap=document.createElement('label');wrap.textContent=label+' ';let el;if(kind==='textarea'||kind==='json'||kind==='sections'){el=document.createElement('textarea');el.rows=(kind==='json'||kind==='sections')?10:4;}else{el=document.createElement('input');el.type=kind==='number'?'number':kind==='boolean'?'checkbox':'text';}el.dataset.field=key;if(kind==='boolean')el.checked=!!record[key];else if(kind==='json'||kind==='sections')el.value=JSON.stringify(record[key]??(key==='trip_sections'?[]:{}),null,2);else el.value=record[key]??'';if(rule==='required')el.required=true;el.oninput=()=>{if(kind==='json'||kind==='sections'){try{const parsed=JSON.parse(el.value);if(kind==='sections'&&!Array.isArray(parsed))throw Error('行程分段必須是陣列');record[key]=parsed;invalid.delete(key);}catch{invalid.add(key);options.onInvalid?.(key);return;}}else record[key]=parse(el,kind);options.onChange?.(key);};el.onchange=el.oninput;wrap.append(el);panel.append(wrap);inputs.set(key,el);}}
 function parse(el,kind){if(kind==='boolean')return el.checked;if(kind==='number')return el.value===''?null:Number(el.value);if(kind==='json'){try{return JSON.parse(el.value);}catch{return el.value;}}return el.value;}
 function values(){if(invalid.size)throw Error('請先修正格式錯誤的欄位：'+Array.from(invalid).join('、'));const out={...record};if(type==='trips'&&!Array.isArray(out.trip_sections))throw Error('行程分段必須是陣列');if((type==='spots'||type==='foods')&&!Array.isArray(out.transport_routes))throw Error('交通路線必須是路線清單，請先檢查原始資料');for(const [key,el] of inputs){const kind=definitions.get(key)[2];if(kind==='json'||kind==='sections'){try{out[key]=JSON.parse(el.value);if(kind==='sections'&&!Array.isArray(out[key]))throw Error('行程分段必須是陣列');invalid.delete(key);}catch{invalid.add(key);throw Error(definitions.get(key)[1]+' 必須是合法 JSON'+(kind==='sections'?' 陣列':''));}}else out[key]=parse(el,kind);}return out;}
 if(options.layout==='all'){
  // Admin-only single-page mode: keep all inputs mounted so saving reads every section.
  // The review screen continues using the original tabbed mode below.
  bar.remove();panel.classList.add('cms-editor-all');
  for(const [key,label] of Object.entries(schema.tabs)){
    if(!groups[key]?.some(name=>!excluded.has(name)&&definitions.has(name)))continue;
    const section=document.createElement('section');section.className='cms-editor-section';
    if(key==='basic'){const heading=document.createElement('h3');heading.textContent=label;section.append(heading);}
    panel.append(section);
    // make() appends to panel; move just-created controls under their section.
    const previous=Array.from(panel.children);
    make(key,true);
    for(const node of Array.from(panel.children))if(!previous.includes(node))section.append(node);
  }
  return {values,showTab:key=>{const section=Array.from(panel.querySelectorAll('.cms-editor-section')).find(el=>el.firstElementChild?.textContent===schema.tabs[key]);section?.scrollIntoView({behavior:'smooth',block:'start'});}};
 }
 for(const [key,label] of Object.entries(schema.tabs)){const btn=document.createElement('button');btn.type='button';btn.textContent=label;btn.onclick=()=>{try{values();}catch(error){window.alert(error.message+'；請修正後再切換分頁。');return;}for(const b of bar.children)b.setAttribute('aria-pressed',String(b===btn));make(key);};bar.append(btn);}bar.firstChild.click();return {values,showTab:key=>{const i=Object.keys(schema.tabs).indexOf(key);if(i>=0)bar.children[i].click();}};
}
global.MetroCmsEditor=Object.freeze({mount});
})(window);
