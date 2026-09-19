/* 北投旅圖：單線式站點與交通區間，保留既有 transport_routes JSONB 結構。 */
(function(global){'use strict';
function text(tag,value,cls){const e=document.createElement(tag);if(cls)e.className=cls;e.textContent=value==null?'':String(value);return e;}
function format(st){const type=st.type||'步行';const bits=[];
 if(st.line)bits.push(st.line);if(st.direction)bits.push(st.direction);
 if(st.duration!==''&&st.duration!=null)bits.push('約 '+String(st.duration).replace(/\s*分鐘$/,'')+' 分鐘');if(st.distance)bits.push(st.distance);
 const summary=type+(bits.length?'（'+bits.join('，')+'）':'');return summary;
}
function render(root,data){if(!root)return;root.replaceChildren();let routes=data;if(typeof routes==='string'){try{routes=JSON.parse(routes);}catch{routes=[];}}if(!Array.isArray(routes))routes=[];
 const usable=routes.filter(r=>r&&r.enabled!==false&&Array.isArray(r.steps)&&r.steps.length);root.hidden=!usable.length;if(!usable.length)return;
 root.append(text('h3','大眾運輸交通指南'));
 usable.forEach((route,index)=>{const card=document.createElement('section');card.className='metro-route';if(usable.length>1)card.append(text('h4',route.title||'推薦路線 '+(index+1)));
 const list=document.createElement('ol');list.className='metro-route-steps';
 route.steps.forEach((st,i)=>{if(!st||typeof st!=='object')return;const mode=st.type||'步行';const isStation=mode==='站點'||mode==='抵達';const li=document.createElement('li');li.className='metro-route-step '+(isStation?'metro-route-station':'metro-route-leg');
 const marker=text('span',isStation?'':'','metro-route-marker');marker.setAttribute('aria-hidden','true');li.append(marker);
 const body=document.createElement('div');body.className='metro-route-body';
 if(isStation){body.append(text('strong',st.name||'未命名站點','metro-route-name'));}
 else{body.append(text('span',format(st),'metro-route-mode'));if(st.detail)body.append(text('span',st.detail,'metro-route-detail'));}
 li.append(body);list.append(li);});card.append(list);root.append(card);});
 root.append(text('p','路線、時間及距離請以現場與運輸業者資訊為準。','metro-route-disclaimer'));
}
global.MetroRouteTimeline=Object.freeze({render});
})(window);
