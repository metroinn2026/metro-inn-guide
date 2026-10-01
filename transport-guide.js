/* Shared Transport Guide component and parser used by spot and event detail pages. */
(function(global){
  'use strict';
  const HOTEL_MAP_ORIGIN='北捷行旅 北投會館 台北市北投區大業路527巷88號';
  function parseJson(value){if(typeof value==='string'){try{return JSON.parse(value)}catch(_){return null}}return value}
  function trustedGoogleUrl(value){
    try{const parsed=new URL(value);return parsed.protocol==='https:'&&/(^|\.)google\.[a-z.]+$|(^|\.)goo\.gl$|(^|\.)maps\.app\.goo\.gl$/.test(parsed.hostname.toLowerCase())?parsed.href:''}catch(_){return ''}
  }
  function render(container,item,options={}){
    if(!container)return;
    const destination=options.destination||[item.title,item.venue_name,item.address].filter(Boolean).join(' ')||item.title||'北投';
    const directions=new URL('https://www.google.com/maps/dir/');
    directions.searchParams.set('api','1');directions.searchParams.set('origin',HOTEL_MAP_ORIGIN);directions.searchParams.set('destination',destination);directions.searchParams.set('travelmode','transit');
    const root=document.createElement('section');root.className='sidebox compact metro-transit compact-transit';root.setAttribute('aria-labelledby','transportGuideTitle');
    const kicker=document.createElement('div');kicker.className='compact-transit-kicker';kicker.textContent='TRANSPORT GUIDE';
    const head=document.createElement('div');head.className='compact-transit-head';const title=document.createElement('h2');title.id='transportGuideTitle';title.textContent='大眾運輸交通指南';const total=document.createElement('span');total.className='compact-transit-total';total.hidden=true;head.append(title,total);
    const list=document.createElement('ol');list.className='compact-transit-steps';
    const note=document.createElement('p');note.className='compact-transit-note';note.textContent='路線、時間及距離請以現場與運輸業者資訊為準。';
    const map=document.createElement('a');map.className='compact-transit-map';map.href=directions.href;map.target='_blank';map.rel='noopener noreferrer';map.textContent='在 Google Maps 查看即時路線 ↗';
    root.append(kicker,head,list,note,map);container.replaceChildren(root);

    let raw=parseJson(item.transport_routes);
    const routes=Array.isArray(raw)?raw:(raw&&Array.isArray(raw.routes)?raw.routes:[]);
    const route=routes.find(candidate=>candidate&&candidate.enabled!==false&&Array.isArray(candidate.steps)&&candidate.steps.length);
    const steps=[];
    if(route){
      for(let index=0;index<route.steps.length;index++){
        const step=route.steps[index];if(!step)continue;
        const mode=step.type||step.mode||'';const name=step.name||step.station||'';
        if(name&&(['站點','抵達'].includes(mode)||!mode)){steps.push({station:name});continue;}
        const next=route.steps[index+1];
        if(mode==='轉乘'&&next&&(next.type==='捷運'||next.mode==='捷運')){
          const stations=String(next.detail||'').match(/\d+\s*站/)?.[0]?.replace(/\s+/g,'')||'';
          const duration=next.duration?`約${String(next.duration).replace(/\s*分鐘$/,'')}分`:'';
          const directionName=String(next.direction||'').replace(/^往/,'').replace(/方向$/,'');
          steps.push({leg:`站內轉乘${next.line||'捷運'}${directionName?`（${directionName}方向）`:''}｜${[stations,duration].filter(Boolean).join('・')}`});index++;continue;
        }
        const duration=step.duration?`約${String(step.duration).replace(/\s*分鐘$/,'')}分`:'';
        const stations=String(step.detail||'').match(/\d+\s*站/)?.[0]?.replace(/\s+/g,'')||'';
        const directionName=String(step.direction||'').replace(/^往/,'').replace(/方向$/,'');
        const direction=directionName?`（${directionName}方向）`:'';
        const description=mode==='步行'?`步行｜${[step.distance,duration].filter(Boolean).join('・')}`:mode==='捷運'?`${step.line||'捷運'}${direction}｜${[stations,duration].filter(Boolean).join('・')}`:mode==='公車'?`${step.line||''}公車${direction}｜${[stations,duration].filter(Boolean).join('・')}`:`${mode}｜${[stations,duration].filter(Boolean).join('・')}`;
        if(description)steps.push({leg:description});
      }
    }
    const source=String(item.transport_text||item.transport_guide||item.transport_metro||item.transport||'').trim();
    if(!steps.length){
      for(const line of source.split(/\r?\n/).map(value=>value.trim()).filter(Boolean)){
        if(/^(全程|總時間|參考總時間)/.test(line)){total.textContent=line.replace(/^(參考)?總時間[：:]?/,'全程');total.hidden=false;}
        else if(/^(步行|捷運|轉乘|公車|搭乘|騎乘|接駁)/.test(line))steps.push({leg:line.replace(/\s*[｜|]\s*/g,' · ')});
        else steps.push({station:line});
      }
    }
    if(total.hidden){const match=source.match(/(?:^|\n)\s*(?:全程|總時間|參考總時間)\s*[：:]?\s*(?:約\s*)?(\d+(?:\.\d+)?\s*(?:小時|分鐘)(?:\s*\d+\s*分鐘)?)/);if(match){total.textContent=`全程約 ${match[1].replace(/\s+/g,' ').trim()}`;total.hidden=false;}}
    if(route&&(route.total_duration||route.total_time||route.duration)){const duration=String(route.total_duration||route.total_time||route.duration);total.textContent=/全程/.test(duration)?duration:`全程約 ${duration}${/分鐘|小時/.test(duration)?'':' 分鐘'}`;total.hidden=false;}
    if(route&&global.MetroTransitDuration){const result=global.MetroTransitDuration.calculate(route);total.textContent=global.MetroTransitDuration.label(result);total.hidden=!result.count;}
    const customRoute=routes.find(candidate=>candidate&&typeof candidate.navigation_url==='string'&&candidate.navigation_url.trim());const custom=customRoute?trustedGoogleUrl(customRoute.navigation_url):'';if(custom)map.href=custom;
    if(!steps.length){const empty=document.createElement('li');empty.className='transit-empty';empty.textContent='交通路線尚待補充，請使用下方即時導航。';list.append(empty);return;}
    for(const step of steps){const li=document.createElement('li');li.className=step.station?'transit-station':'transit-leg';const text=document.createElement(step.station?'strong':'span');text.textContent=step.station||step.leg;li.append(text);list.append(li);}
  }
  global.MetroTransportGuide=Object.freeze({render});
})(window);
