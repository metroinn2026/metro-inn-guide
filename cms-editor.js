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
    if(section.show_image===undefined)section.show_image=true;
    const card=document.createElement('fieldset');card.style.cssText='border:1px solid #ccc;padding:12px;margin:10px 0;min-width:0';
    const legend=document.createElement('legend');legend.textContent='第 '+(index+1)+' 段';card.append(legend);
    for(const [field,title,multiline] of [['time','時間',false],['title','段落標題',false],['text','段落說明',true],['image','圖片網址',false],['image_source','圖片來源',false]]){
      const labelEl=document.createElement('label');labelEl.textContent=title+' ';const el=document.createElement(multiline?'textarea':'input');if(multiline)el.rows=4;else el.type='text';el.value=section[field]??(field==='text'?section.description??'':'');el.oninput=()=>{section[field]=el.value;commit();};labelEl.append(el);card.append(labelEl);
    }
    const imageToggle=document.createElement('label');imageToggle.className='trip-section-image-toggle';const imageToggleText=document.createElement('span');imageToggleText.textContent='顯示此段圖片';imageToggle.append(imageToggleText);
    const imageToggleInput=document.createElement('input');imageToggleInput.type='checkbox';imageToggleInput.checked=section.show_image!==false;imageToggleInput.onchange=()=>{section.show_image=imageToggleInput.checked;commit();};imageToggle.prepend(imageToggleInput);card.append(imageToggle);
    const actions=document.createElement('div');actions.className='row';
    const sectionFile=document.createElement('input');sectionFile.type='file';sectionFile.accept='image/jpeg,image/png,image/webp,image/gif';sectionFile.hidden=true;
    const sectionUpload=document.createElement('button');sectionUpload.type='button';sectionUpload.textContent='上傳段落圖片';sectionUpload.onclick=()=>sectionFile.click();
    sectionFile.onchange=async()=>{const selected=sectionFile.files?.[0];if(!selected)return;sectionUpload.disabled=true;sectionUpload.textContent='上傳中…';try{if(typeof options.uploadImage!=='function')throw Error('圖片上傳服務未連接，請更新後台程式並重新整理。');const url=await options.uploadImage('trip_section_'+index,selected);if(!url)throw Error('圖片上傳未取得網址');section.image=url;section.show_image=true;commit();render();}catch(error){alert(error?.message||'段落圖片上傳失敗');}finally{sectionUpload.disabled=false;sectionUpload.textContent='上傳段落圖片';sectionFile.value='';}};
    actions.append(sectionUpload,sectionFile);
    for(const [text,delta] of [['↑ 上移',-1],['↓ 下移',1]]){const button=document.createElement('button');button.type='button';button.textContent=text;button.disabled=index+delta<0||index+delta>=record[key].length;button.onclick=()=>{const other=index+delta;[record[key][index],record[key][other]]=[record[key][other],record[key][index]];commit();render();};actions.append(button);}
    const remove=document.createElement('button');remove.type='button';remove.textContent='刪除此段';remove.onclick=()=>{if(!confirm('確定刪除此行程段落？'))return;record[key].splice(index,1);commit();render();};actions.append(remove);card.append(actions);list.append(card);
  });}
  if(!Array.isArray(record[key])){record[key]=[];}
  const add=document.createElement('button');add.type='button';add.textContent='＋新增行程段落';add.onclick=()=>{record[key].push({time:'',title:'',text:'',image:'',image_source:'',show_image:false,order:record[key].length+1});commit();render();};wrap.append(add);render();return wrap;
 }
 function makeGoogleMap(key,label){
  const wrap=document.createElement('div');wrap.className='cms-google-map-helper';
  const heading=document.createElement('label');heading.textContent=label;heading.style.cssText='display:block;font-weight:700;margin:0 0 8px';wrap.append(heading);
  const input=document.createElement('input');input.type='url';input.dataset.field=key;input.placeholder='產生網址後，也可貼上 Google Maps 分享連結';input.value=record[key]||'';input.style.cssText='width:100%;box-sizing:border-box';wrap.append(input);
  const actions=document.createElement('div');actions.className='image-field-actions';actions.style.marginTop='8px';
  const generate=document.createElement('button');generate.type='button';generate.textContent='依名稱與地址產生地圖網址';
  const open=document.createElement('a');open.className='button';open.target='_blank';open.rel='noopener noreferrer';open.textContent='開啟地圖確認';open.href=input.value;open.hidden=!input.value;
  const hint=document.createElement('p');hint.className='source-hint';hint.textContent='此網址供前台「在 Google Maps 查看」按鈕使用。內嵌地圖會依名稱與地址自動顯示，不需貼 iframe 網頁碼。';wrap.append(actions,hint);
  function placeQuery(){return (type==='events'?[record.venue_name,record.address,record.title]:[record.title,record.address]).filter(Boolean).join(' ').trim();}
  function update(){record[key]=input.value.trim();open.href=record[key];open.hidden=!record[key];options.onChange?.(key);}
  generate.onclick=()=>{const query=placeQuery();if(!query){window.alert('請先填寫名稱與地址，再產生地圖網址。');return;}const url=new URL('https://www.google.com/maps/search/');url.searchParams.set('api','1');url.searchParams.set('query',query);input.value=url.href;update();};
  input.oninput=update;input.onchange=update;actions.append(generate,open);inputs.set(key,input);return wrap;
 }
 function makeRoutes(key,label){
  const wrap=document.createElement('div');wrap.className='cms-route-text-editor';
  const heading=document.createElement('label');heading.textContent='交通指南（每行一個站點或交通方式）';heading.style.cssText='display:block;font-weight:700;margin:0 0 8px';wrap.append(heading);
  const hint=document.createElement('p');hint.textContent='每行填站點或交通方式；步行、捷運、公車、轉乘及候車都可填「約X分鐘」，系統自動加總；未填時間會提示。';hint.style.cssText='font-size:13px;color:#64748b;margin:0 0 8px';wrap.append(hint);
  const editor=document.createElement('textarea');editor.rows=12;editor.style.cssText='display:block;width:100%;box-sizing:border-box;line-height:1.9;min-height:230px';editor.setAttribute('aria-label','交通指南文字');wrap.append(editor);
  const status=document.createElement('p');status.style.cssText='font-size:12px;color:#64748b;margin:7px 0';wrap.append(status);
  const helper=document.createElement('div');helper.style.cssText='border:1px solid #dbe4ef;background:#f8fafc;padding:12px;margin:12px 0';
  const helperTitle=document.createElement('strong');helperTitle.textContent='交通填寫小幫手';
  const helperText=document.createElement('p');helperText.style.cssText='font-size:13px;line-height:1.7;margin:6px 0';helperText.textContent='固定起點：北捷行旅（臺北市北投區大業路527巷88號）。常用路段：步行至復興崗站約6分鐘、550公尺。其餘捷運／公車站數、時間與目的地步行，請用 Google Maps 大眾運輸路線核對後再填。';
  const helperActions=document.createElement('div');helperActions.className='image-field-actions';const insertStart=document.createElement('button');insertStart.type='button';insertStart.textContent='插入常用起點範本';const makeDirections=document.createElement('button');makeDirections.type='button';makeDirections.textContent='開啟 Google Maps 查路線';
  const draftBox=document.createElement('div');draftBox.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;margin-top:12px';
  function draftInput(label,placeholder){const field=document.createElement('label');field.textContent=label;field.style.cssText='display:block;font-size:12px;font-weight:600';const input=document.createElement('input');input.type='text';input.placeholder=placeholder;input.style.cssText='display:block;width:100%;box-sizing:border-box;margin-top:4px';field.append(input);draftBox.append(field);return input;}
  const segments=[];
  function addSegment(){
   const box=document.createElement('fieldset');box.style.cssText='grid-column:1/-1;padding:10px;border:1px solid #ddd';
   const legend=document.createElement('legend');legend.textContent='交通路段';box.append(legend);
   const mode=document.createElement('select');for(const value of ['捷運','公車','步行','轉乘','候車','接駁']){const option=document.createElement('option');option.value=option.textContent=value;mode.append(option);}box.append(mode);
   function field(label,placeholder){const input=draftInput(label,placeholder);box.append(input.parentElement);return input;}
   const line=field('路線','例如：淡水信義線／230');const direction=field('方向','例如：陽明山(紗帽)方向');const minutes=field('時間（分鐘）','例如：13');const detail=field('站數／距離／說明','例如：14站／550公尺／出站轉乘');const stop=field('抵達站點','例如：北投文物館站');
   const segment={box,mode,line,direction,minutes,detail,stop};segments.push(segment);
   const remove=document.createElement('button');remove.type='button';remove.textContent='移除此路段';remove.onclick=()=>{segments.splice(segments.indexOf(segment),1);box.remove();};box.append(remove);draftBox.append(box);
  }
  addSegment();const addLeg=document.createElement('button');addLeg.type='button';addLeg.textContent='＋新增交通／步行路段';addLeg.onclick=addSegment;
  const buildDraft=document.createElement('button');buildDraft.type='button';buildDraft.textContent='產生交通文字草稿';buildDraft.style.marginTop='10px';const draftNotice=document.createElement('p');draftNotice.style.cssText='font-size:12px;line-height:1.6;color:#64748b;margin:8px 0 0';draftNotice.textContent='系統會只帶入已確認的固定起點步行資料；捷運、公車站名、方向、時間與距離請先從地圖查詢後填入，避免產生未核實資訊。';helper.append(helperTitle,helperText,helperActions,draftBox,addLeg,buildDraft,draftNotice);const toolbar=document.createElement('div');toolbar.className='image-field-actions';toolbar.style.cssText='margin:8px 0 12px';
  const openHelper=document.createElement('button');openHelper.type='button';openHelper.textContent='開啟交通填寫小幫手';openHelper.setAttribute('aria-haspopup','dialog');toolbar.append(insertStart,openHelper);wrap.append(toolbar);
  const dialog=document.createElement('dialog');dialog.className='cms-transport-helper-dialog';dialog.setAttribute('aria-label','交通填寫小幫手');dialog.style.cssText='width:min(760px,calc(100vw - 32px));max-height:85vh;box-sizing:border-box;overflow:auto;border:1px solid #dbe4ef;border-radius:12px;padding:16px;background:#fff;color:#1e293b';
  const dialogStyle=document.createElement('style');dialogStyle.textContent='.cms-transport-helper-dialog::backdrop{background:rgba(15,23,42,.45)}';wrap.append(dialogStyle);
  const dialogBar=document.createElement('div');dialogBar.style.cssText='display:flex;justify-content:space-between;align-items:center;gap:12px;position:sticky;top:-16px;background:#fff;padding:8px 0;z-index:1';
  const dialogTitle=document.createElement('strong');dialogTitle.textContent='交通填寫小幫手';const closeHelper=document.createElement('button');closeHelper.type='button';closeHelper.textContent='關閉';dialogBar.append(dialogTitle,closeHelper);helperTitle.remove();helper.style.margin='0';dialog.append(dialogBar,helper);wrap.append(dialog);
  openHelper.onclick=()=>dialog.showModal();closeHelper.onclick=()=>dialog.close();dialog.onclose=()=>openHelper.focus();dialog.onclick=event=>{if(event.target!==dialog)return;const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();};
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
  // 與交通路線一起存於既有 JSONB；三類內容皆可獨立指定導航終點。
  const navigationLabel=document.createElement('label');navigationLabel.textContent='導航目的地網址（Google Maps）';navigationLabel.style.cssText='display:block;font-weight:700;margin:16px 0 8px';wrap.append(navigationLabel);
  const navigationInput=document.createElement('input');navigationInput.type='url';navigationInput.placeholder='貼上 Google Maps 導航連結；留空則依交通路線終點導航';navigationInput.style.cssText='width:100%;box-sizing:border-box';navigationLabel.append(navigationInput);
  const navigationHint=document.createElement('p');navigationHint.textContent='只影響交通指南的「在 Google Maps 查看即時路線」按鈕，不影響行程地圖。';navigationHint.style.cssText='font-size:12px;color:#64748b;margin:6px 0 12px';wrap.append(navigationHint);
  function navigationValue(){return Array.isArray(record[key]) ? record[key].find(r=>r&&typeof r.navigation_url==='string'&&r.navigation_url)?.navigation_url||'' : '';}
  navigationInput.value=navigationValue();
  navigationInput.oninput=()=>{const value=navigationInput.value.trim();if(value){try{const url=new URL(value);if(url.protocol!=='https:'||!/(^|\.)google\.[a-z.]+$|(^|\.)goo\.gl$|(^|\.)maps\.app\.goo\.gl$/.test(url.hostname.toLowerCase()))throw Error();navigationInput.setCustomValidity('');}catch{navigationInput.setCustomValidity('請輸入有效的 Google Maps HTTPS 網址');invalid.add('導航目的地網址');options.onInvalid?.(key);return;}}navigationInput.setCustomValidity('');invalid.delete('導航目的地網址');if(!Array.isArray(record[key]))return;if(!record[key].length&&value)record[key].push({title:'大眾運輸推薦路線',enabled:true,steps:[]});for(const route of record[key]){if(!route||typeof route!=='object')continue;if(value)route.navigation_url=value;else delete route.navigation_url;}options.onChange?.(key);};
  insertStart.onclick=()=>{if(editor.value.trim()&&!window.confirm('這會以北捷行旅起點範本取代目前交通文字，確定繼續？'))return;editor.value='北捷行旅\n步行｜6分鐘｜550公尺\n復興崗站';editor.dispatchEvent(new Event('input',{bubbles:true}));status.textContent='已帶入固定起點；請查詢並補上後續路段，再確認目的地。';};
  function destinationText(){return (type==='events'?[record.venue_name,record.address,record.title]:[record.title,record.address]).filter(Boolean).join(' ').trim();}
  makeDirections.onclick=()=>{const destination=destinationText();if(!destination){window.alert('請先填寫名稱與地址，再查詢導航路線。');return;}const url=new URL('https://www.google.com/maps/dir/');url.searchParams.set('api','1');url.searchParams.set('origin','北捷行旅 北投會館 台北市北投區大業路527巷88號');url.searchParams.set('destination',destination);url.searchParams.set('travelmode','transit');window.open(url.href,'_blank','noopener,noreferrer');};
  buildDraft.onclick=()=>{
   const destination=(type==='events'?record.venue_name:record.title)||record.title||'';
   if(!destination){window.alert('請先填寫名稱或活動場地。');return;}
   const lines=['北捷行旅','步行｜6分鐘｜550公尺','復興崗站'];let count=0;
   for(const segment of segments){
    const {mode,line,direction,minutes,detail,stop}=segment;
    if(![line,direction,minutes,detail,stop].some(input=>input.value.trim()))continue;
    const time=minutes.value.trim();if(time&&!/^(?:約\s*)?\d+(?:\.\d+)?(?:\s*分鐘)?$/.test(time)){window.alert('時間請填寫分鐘數，例如：13 或 約13分鐘。');return;}
    const parts=[mode.value];if(line.value.trim())parts.push(line.value.trim());if(direction.value.trim())parts.push(direction.value.trim());if(time)parts.push(time.replace(/分鐘$/,'').trim()+'分鐘');if(detail.value.trim())parts.push(detail.value.trim());lines.push(parts.join('｜'));if(stop.value.trim())lines.push(stop.value.trim());count++;
   }
   if(!count){window.alert('請先查詢路線並填寫至少一個路段。');return;}
   if(lines[lines.length-1]!==destination)lines.push(destination);
   if(editor.value.trim()&&!window.confirm('以這份交通文字草稿取代目前內容？'))return;
   editor.value=lines.join('\n');editor.dispatchEvent(new Event('input',{bubbles:true}));draftNotice.textContent='已產生可串接大眾運輸指南的逐行文字。請核對路線後儲存。';if(!invalid.has(key))dialog.close();
  };
  helperActions.append(makeDirections);
  if(type==='events'&&key==='transport'){
   navigationLabel.remove();navigationHint.remove();
   editor.dataset.field=key;editor.value=typeof options.fieldValue==='function'?options.fieldValue(key)??record[key]??'':record[key]||'';inputs.set(key,editor);
   function syncEventTransport(){record[key]=editor.value;invalid.delete(key);try{const routes=parse(editor.value);const route=routes[0];status.textContent=route?(global.MetroTransitDuration?.label(global.MetroTransitDuration.calculate(route))||'已更新交通指南文字'):'尚未填寫交通指南';status.style.color='#64748b';if(route?.steps?.some(step=>step.type==='站點'&&/。/.test(step.name))){status.textContent='目前為敘述文字；請用下方小幫手產生逐行站點與交通方式。';}}catch(error){status.textContent=error.message;status.style.color='#b91c1c';invalid.add(key);}options.onChange?.(key);}
   editor.oninput=syncEventTransport;syncEventTransport();return wrap;
  }
  const existing=record[key];if(existing==null||(typeof existing==='object'&&!Array.isArray(existing)&&!Object.keys(existing).length))record[key]=[];
  if(!Array.isArray(record[key])){invalid.add(key);status.textContent='原有交通資料不是路線清單，請先備份確認後再編輯。';status.style.color='#b91c1c';return wrap;}
  editor.value=stringify(record[key]);const totalStatus=document.createElement('p');totalStatus.setAttribute('aria-live','polite');totalStatus.style.cssText='font-size:14px;font-weight:600;margin:8px 0;color:#444';wrap.append(totalStatus);function refreshTotal(){const route=record[key]?.find(r=>r?.enabled!==false);totalStatus.textContent=global.MetroTransitDuration?.label(global.MetroTransitDuration.calculate(route))||'請重新載入分鐘計算元件';}refreshTotal();
  if(record[key].filter(r=>r?.enabled!==false).length>1){status.textContent='原資料有多條路線：文字框僅顯示第一條。為避免遺失其他路線，請先備份並確認。';status.style.color='#b91c1c';invalid.add(key);return wrap;}
  editor.oninput=()=>{try{const previousNavigation=navigationInput.value.trim();record[key]=parse(editor.value);if(previousNavigation){if(!record[key].length)record[key].push({title:'大眾運輸推薦路線',enabled:true,steps:[]});record[key][0].navigation_url=previousNavigation;}refreshTotal();invalid.delete(key);status.textContent='已更新草稿預覽；按「儲存草稿」或「儲存並上架」才會寫入資料庫。';status.style.color='#64748b';options.onChange?.(key);}catch(err){invalid.add(key);status.textContent=err.message;status.style.color='#b91c1c';options.onInvalid?.(key);}};
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
  file.onchange=async()=>{const selected=file.files?.[0];if(!selected)return;if(typeof options.uploadImage!=='function'){window.alert('圖片上傳服務未連接，請確認 admin.html 與 cms-editor.js 已一起更新，並強制重新整理頁面。');file.value='';return;}const oldText=upload.textContent;upload.disabled=true;upload.textContent='上傳中…';try{const url=await options.uploadImage(key,selected);if(!url)throw Error('圖片上傳失敗');input.value=url;record[key]=url;renderPreview();options.onChange?.(key);}catch(error){window.alert(error?.message||'圖片上傳失敗');}finally{upload.disabled=false;upload.textContent=oldText;file.value='';}};
  renderPreview();inputs.set(key,input);return wrap;
 }
 function make(tab,append=false){if(!append){inputs.clear();panel.replaceChildren();}for(const name of groups[tab]){if(excluded.has(name))continue;const spec=definitions.get(name);if(!spec)continue;const [key,label,kind,rule]=spec;if(key==='transport_routes'||(type==='events'&&key==='transport')){panel.append(makeRoutes(key,label));continue;}if(key==='google_map'){panel.append(makeGoogleMap(key,label));continue;}if(kind==='sections'){panel.append(makeSections(key,label));continue;}if(kind==='image'){panel.append(makeImage(key,label,rule));continue;}const wrap=document.createElement('label');wrap.textContent=label+' ';let el;if(kind==='textarea'||kind==='json'||kind==='sections'){el=document.createElement('textarea');el.rows=(kind==='json'||kind==='sections')?10:4;}else{el=document.createElement('input');el.type=kind==='number'?'number':kind==='boolean'?'checkbox':kind==='date'?'date':'text';}if(kind==='eventCategory'||kind==='eventEndBehavior'||kind==='eventFeatured'){el=document.createElement('select');const options=kind==='eventCategory'?[['展覽','展覽'],['節慶','節慶'],['市集','市集'],['親子','親子'],['表演','表演'],['其他','其他']]:kind==='eventEndBehavior'?[['hide_after_end','結束後自動隱藏'],['show_ended','保留並顯示「已結束」']]:[['false','否，依排序數字顯示'],['true','是，優先推薦於首頁']];for(const [value,text] of options){const option=document.createElement('option');option.value=value;option.textContent=text;el.append(option);}}el.dataset.field=key;if(kind==='boolean')el.checked=!!record[key];else if(kind==='json'||kind==='sections')el.value=JSON.stringify(record[key]??(key==='trip_sections'?[]:{}),null,2);else if(typeof options.fieldValue==='function'&&(kind==='eventFeatured'||kind==='eventEndBehavior'||key==='google_map'||key==='official_url'||key==='transport'))el.value=options.fieldValue(key)??record[key]??'';else el.value=record[key]??'';if(rule==='required')el.required=true;el.oninput=()=>{if(kind==='json'||kind==='sections'){try{const parsed=JSON.parse(el.value);if(kind==='sections'&&!Array.isArray(parsed))throw Error('行程分段必須是陣列');record[key]=parsed;invalid.delete(key);}catch{invalid.add(key);options.onInvalid?.(key);return;}}else record[key]=parse(el,kind);options.onChange?.(key);};el.onchange=el.oninput;wrap.append(el);panel.append(wrap);inputs.set(key,el);}}
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
