/* 共用表單元件：僅產生表單及讀取值，不自行寫入資料庫。 */
(function(global){'use strict';
// 舊版交通文字欄位不再出現在共用編輯器；原始值仍保留於 record，避免覆寫既有資料。
const excluded=new Set(['id','is_published','review_status','review_note','reviewed_at','reviewed_by','source_urls','transport_metro','transport_bus','transport_car']);
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
  const wrap=document.createElement('div');wrap.className='cms-route-text-editor';
  const heading=document.createElement('label');heading.textContent='交通指南（每行一個站點或交通方式）';heading.style.cssText='display:block;font-weight:700;margin:0 0 8px';wrap.append(heading);
  const hint=document.createElement('p');hint.textContent='每行填站點或交通方式；步行、捷運、公車、轉乘及候車都可填「約X分鐘」，系統自動加總；未填時間會提示。';hint.style.cssText='font-size:13px;color:#64748b;margin:0 0 8px';wrap.append(hint);
  const editor=document.createElement('textarea');editor.rows=12;editor.style.cssText='display:block;width:100%;box-sizing:border-box;line-height:1.9;min-height:230px';editor.setAttribute('aria-label','交通指南文字');wrap.append(editor);
  const status=document.createElement('p');status.style.cssText='font-size:12px;color:#64748b;margin:7px 0';wrap.append(status);
  const modes=new Set(['步行','捷運','公車','轉乘','自行車','候車','接駁']);
  function stringify(routes){if(!Array.isArray(routes))return '';
   const route=routes.find(r=>r&&r.enabled!==false&&Array.isArray(r.steps));if(!route)return '';
   return route.steps.map(st=>{if(st.type==='站點'||st.type==='抵達')return st.name||'';
    const name=String(st.name||'');const legacy=name.includes('→')?name.split('→').map(x=>x.trim()):null;
    const parts=[st.type||'步行'];if(st.type==='步行'||st.type==='自行車'||st.type==='候車'){if(st.duration)parts.push(String(st.duration).replace(/\s*分鐘$/,'')+'分鐘');if(st.distance)parts.push(st.distance);}
    else {if(st.line)parts.push(st.line);if(st.direction)parts.push(st.direction);if(st.duration)parts.push(String(st.duration).replace(/\s*分鐘$/,'')+'分鐘');}
    if(st.detail&&!/起點|目的地/.test(st.detail))parts.push(st.detail);
    return parts.join('｜');}).filter(Boolean).join('\n');
  }
  function parse(value){const lines=value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);if(!lines.length)return [];let total='';if(/^全程\s*約?\s*\d+(?:\.\d+)?\s*分鐘$/.test(lines[0]))total=lines.shift().replace(/\s/g,'');if(!lines.length)throw Error('請輸入起點、交通方式與目的地');
   const steps=lines.map((line,index)=>{const parts=line.split(/[｜|]/).map(x=>x.trim());const type=parts[0];if(!modes.has(type))return {type:'站點',name:line};
    const step={type,name:'',line:'',direction:'',duration:'',distance:'',detail:''};
    if(type==='步行'||type==='自行車'||type==='候車'){for(const part of parts.slice(1)){if(/^(?:約\s*)?\d+(?:\.\d+)?\s*分鐘$/.test(part))step.duration=part.replace(/約\s*|\s*分鐘/g,'');else if(/公尺|公里|km|m$/.test(part))step.distance=part;else step.detail=[step.detail,part].filter(Boolean).join('；');}}
    else {const extras=[];for(const part of parts.slice(1)){const mins=global.MetroTransitDuration?.minutes(part);if(mins!==null&&mins!==undefined&&/分鐘|小時/.test(part))step.duration=String(mins);else extras.push(part);}step.line=extras.shift()||'';step.direction=extras.shift()||'';if(extras.length)step.detail=extras.join('；');}return step;});
   if(modes.has(steps[0].type)||modes.has(steps[steps.length-1].type))throw Error('第一行與最後一行請填寫起點及目的地名稱');
   return [{title:'大眾運輸推薦路線',enabled:true,steps}];
  }
  const existing=record[key];if(existing==null||(typeof existing==='object'&&!Array.isArray(existing)&&!Object.keys(existing).length))record[key]=[];
  if(!Array.isArray(record[key])){invalid.add(key);status.textContent='原有交通資料不是路線清單，請先備份確認後再編輯。';status.style.color='#b91c1c';return wrap;}
  editor.value=stringify(record[key]);const totalStatus=document.createElement('p');totalStatus.setAttribute('aria-live','polite');totalStatus.style.cssText='font-size:14px;font-weight:600;margin:8px 0;color:#444';wrap.append(totalStatus);function refreshTotal(){const route=record[key]?.find(r=>r?.enabled!==false);totalStatus.textContent=global.MetroTransitDuration?.label(global.MetroTransitDuration.calculate(route))||'請重新載入分鐘計算元件';}refreshTotal();
  if(record[key].filter(r=>r?.enabled!==false).length>1){status.textContent='原資料有多條路線：文字框僅顯示第一條。為避免遺失其他路線，請先備份並確認。';status.style.color='#b91c1c';invalid.add(key);return wrap;}
  editor.oninput=()=>{try{record[key]=parse(editor.value);refreshTotal();invalid.delete(key);status.textContent='已更新草稿預覽；按「儲存草稿」或「儲存並上架」才會寫入資料庫。';status.style.color='#64748b';options.onChange?.(key);}catch(err){invalid.add(key);status.textContent=err.message;status.style.color='#b91c1c';options.onInvalid?.(key);}};
  return wrap;
 }
 function makeImage(key,label,rule){
  const isContentCover=['spots','foods','trips'].includes(type)&&key==='cover_image';
  const isLogo=key==='logo_url';
  const wrap=document.createElement('div');wrap.className='image-field-box cms-shared-image'+(isContentCover?' cms-image-3x2':'');
  const heading=document.createElement('label');heading.textContent=label;heading.htmlFor='cms_image_'+key;wrap.append(heading);
  const input=document.createElement('input');input.id='cms_image_'+key;input.type='url';input.dataset.field=key;input.placeholder='貼上圖片網址，或上傳本機圖片';input.value=record[key]??'';if(rule==='required')input.required=true;wrap.append(input);
  const actions=document.createElement('div');actions.className='image-field-actions';
  const file=document.createElement('input');file.type='file';file.accept=isLogo?'image/svg+xml,image/png,image/webp':'image/jpeg,image/png,image/webp,image/gif';file.hidden=true;
  const upload=document.createElement('button');upload.type='button';upload.textContent='上傳照片';upload.onclick=()=>file.click();
  const clear=document.createElement('button');clear.type='button';clear.textContent='清除圖片';clear.onclick=()=>{input.value='';record[key]='';renderPreview();options.onChange?.(key);};
  actions.append(upload,clear,file);wrap.append(actions);
  const hint=document.createElement('div');hint.className='source-hint';hint.textContent=isContentCover?'建議使用 3:2 圖片（1500×1000）；可貼入圖片網址，或直接上傳 JPG、PNG、WEBP、GIF。':isLogo?'可貼入圖片網址，或上傳 SVG、PNG、WEBP。':'可貼入圖片網址，或直接上傳 JPG、PNG、WEBP、GIF。';wrap.append(hint);
  const preview=document.createElement('div');preview.className='image-thumb';wrap.append(preview);
  function renderPreview(){const url=input.value.trim();preview.replaceChildren();preview.style.display=url?'flex':'none';if(!url)return;const img=document.createElement('img');img.src=url;img.alt='封面圖片預覽';const info=document.createElement('small');info.textContent=url;preview.append(img,info);}
  input.oninput=()=>{record[key]=input.value;renderPreview();options.onChange?.(key);};input.onchange=input.oninput;
  file.onchange=async()=>{const selected=file.files?.[0];if(!selected)return;if(typeof options.uploadImage!=='function'){window.alert('目前未啟用圖片上傳，請改貼圖片網址。');file.value='';return;}const oldText=upload.textContent;upload.disabled=true;upload.textContent='上傳中…';try{const url=await options.uploadImage(key,selected);if(!url)throw Error('圖片上傳失敗');input.value=url;record[key]=url;renderPreview();options.onChange?.(key);}catch(error){window.alert(error?.message||'圖片上傳失敗');}finally{upload.disabled=false;upload.textContent=oldText;file.value='';}};
  renderPreview();inputs.set(key,input);return wrap;
 }
 function make(tab,append=false){if(!append){inputs.clear();panel.replaceChildren();}for(const name of groups[tab]){if(excluded.has(name))continue;const spec=definitions.get(name);if(!spec)continue;const [key,label,kind,rule]=spec;if(key==='transport_routes'){panel.append(makeRoutes(key,label));continue;}if(kind==='sections'){panel.append(makeSections(key,label));continue;}if(kind==='image'){panel.append(makeImage(key,label,rule));continue;}const wrap=document.createElement('label');wrap.textContent=label+' ';let el;if(kind==='textarea'||kind==='json'||kind==='sections'){el=document.createElement('textarea');el.rows=(kind==='json'||kind==='sections')?10:4;}else{el=document.createElement('input');el.type=kind==='number'?'number':kind==='boolean'?'checkbox':'text';}el.dataset.field=key;if(kind==='boolean')el.checked=!!record[key];else if(kind==='json'||kind==='sections')el.value=JSON.stringify(record[key]??(key==='trip_sections'?[]:{}),null,2);else el.value=record[key]??'';if(rule==='required')el.required=true;el.oninput=()=>{if(kind==='json'||kind==='sections'){try{const parsed=JSON.parse(el.value);if(kind==='sections'&&!Array.isArray(parsed))throw Error('行程分段必須是陣列');record[key]=parsed;invalid.delete(key);}catch{invalid.add(key);options.onInvalid?.(key);return;}}else record[key]=parse(el,kind);options.onChange?.(key);};el.onchange=el.oninput;wrap.append(el);panel.append(wrap);inputs.set(key,el);}}
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
