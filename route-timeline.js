/* 北投旅圖：推薦大眾運輸時間軸。只顯示管理員已填寫的資料，不推算班次或時間。 */
(function(global){'use strict';
const types={步行:'♙',捷運:'▣',公車:'▤',轉乘:'↔',抵達:'◎'};
function text(tag,value,className){const el=document.createElement(tag);if(className)el.className=className;el.textContent=value==null?'':String(value);return el;}
function render(root,data,options={}){
 if(!root)return;root.replaceChildren();let routes=data;
 if(typeof routes==='string'){try{routes=JSON.parse(routes);}catch{routes=[];}}
 if(!Array.isArray(routes))routes=[];
 const usable=routes.filter(r=>r&&r.enabled!==false&&Array.isArray(r.steps)&&r.steps.length);
 root.hidden=!usable.length;if(!usable.length)return;
 const title=text('h3','從北捷行旅出發｜大眾運輸推薦路線');root.append(title);
 usable.forEach((route,index)=>{
  const card=document.createElement('section');card.className='metro-route';
  card.append(text('h4',route.title||`推薦路線 ${index+1}`));
  if(route.description)card.append(text('p',route.description,'metro-route-description'));
  const list=document.createElement('ol');list.className='metro-route-steps';
  route.steps.forEach((step,i)=>{
   if(!step||typeof step!=='object')return;
   const li=document.createElement('li');li.className='metro-route-step';
   const mode=String(step.type||'步行');li.dataset.mode=mode;
   li.append(text('span',types[mode]||'•','metro-route-icon'));
   const body=document.createElement('div');body.className='metro-route-body';
   body.append(text('strong',step.name|| (i===0?'北捷行旅':mode),'metro-route-name'));
   if(step.line)body.append(text('span',step.line+(step.direction?'・'+step.direction:''),'metro-route-line'));
   if(step.duration!==''&&step.duration!=null)body.append(text('span',`約 ${step.duration} 分鐘`,'metro-route-time'));
   if(step.distance)body.append(text('span',String(step.distance),'metro-route-distance'));
   if(step.detail)body.append(text('p',step.detail,'metro-route-detail'));
   li.append(body);list.append(li);
  });card.append(list);root.append(card);
 });
 root.append(text('p','交通時間、班次與步行距離僅供參考，請以運輸業者及即時導航資訊為準。','metro-route-disclaimer'));
}
global.MetroRouteTimeline=Object.freeze({render});
})(window);
