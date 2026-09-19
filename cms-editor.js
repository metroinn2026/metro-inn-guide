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
 function make(tab){inputs.clear();panel.replaceChildren();for(const name of groups[tab]){if(excluded.has(name))continue;const spec=definitions.get(name);if(!spec)continue;const [key,label,kind,rule]=spec;if(kind==='sections'){panel.append(makeSections(key,label));continue;}const wrap=document.createElement('label');wrap.textContent=label+' ';let el;if(kind==='textarea'||kind==='json'||kind==='sections'){el=document.createElement('textarea');el.rows=(kind==='json'||kind==='sections')?10:4;}else{el=document.createElement('input');el.type=kind==='number'?'number':kind==='boolean'?'checkbox':'text';}el.dataset.field=key;if(kind==='boolean')el.checked=!!record[key];else if(kind==='json'||kind==='sections')el.value=JSON.stringify(record[key]??(key==='trip_sections'?[]:{}),null,2);else el.value=record[key]??'';if(rule==='required')el.required=true;el.oninput=()=>{if(kind==='json'||kind==='sections'){try{const parsed=JSON.parse(el.value);if(kind==='sections'&&!Array.isArray(parsed))throw Error('行程分段必須是陣列');record[key]=parsed;invalid.delete(key);}catch{invalid.add(key);options.onInvalid?.(key);return;}}else record[key]=parse(el,kind);options.onChange?.(key);};el.onchange=el.oninput;wrap.append(el);panel.append(wrap);inputs.set(key,el);}}
 function parse(el,kind){if(kind==='boolean')return el.checked;if(kind==='number')return el.value===''?null:Number(el.value);if(kind==='json'){try{return JSON.parse(el.value);}catch{return el.value;}}return el.value;}
 function values(){if(invalid.size)throw Error('請先修正格式錯誤的欄位：'+Array.from(invalid).join('、'));const out={...record};if(type==='trips'&&!Array.isArray(out.trip_sections))throw Error('行程分段必須是陣列');for(const [key,el] of inputs){const kind=definitions.get(key)[2];if(kind==='json'||kind==='sections'){try{out[key]=JSON.parse(el.value);if(kind==='sections'&&!Array.isArray(out[key]))throw Error('行程分段必須是陣列');invalid.delete(key);}catch{invalid.add(key);throw Error(definitions.get(key)[1]+' 必須是合法 JSON'+(kind==='sections'?' 陣列':''));}}else out[key]=parse(el,kind);}return out;}
 for(const [key,label] of Object.entries(schema.tabs)){const btn=document.createElement('button');btn.type='button';btn.textContent=label;btn.onclick=()=>{try{values();}catch(error){window.alert(error.message+'；請修正後再切換分頁。');return;}for(const b of bar.children)b.setAttribute('aria-pressed',String(b===btn));make(key);};bar.append(btn);}bar.firstChild.click();return {values,showTab:key=>{const i=Object.keys(schema.tabs).indexOf(key);if(i>=0)bar.children[i].click();}};
}
global.MetroCmsEditor=Object.freeze({mount});
})(window);
