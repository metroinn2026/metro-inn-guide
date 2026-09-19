/* 北投旅圖：靜態捷運路網（紅線及新北投支線）。其他路線未建檔時不猜測轉乘。 */
(function(){
  'use strict';
  const red=['淡水','紅樹林','竹圍','關渡','忠義','復興崗','北投','奇岩','唭哩岸','石牌','明德','芝山','士林','劍潭','圓山','民權西路','雙連','中山','台北車站','台大醫院','中正紀念堂','東門','大安森林公園','大安','信義安和','台北101/世貿','象山'];
  const branches=[{name:'淡水信義線',color:'red',stations:red},{name:'新北投支線',color:'red',stations:['北投','新北投']}];
  const graph=new Map();
  for(const line of branches){line.stations.forEach((station,i)=>{if(!graph.has(station))graph.set(station,[]);for(const j of [i-1,i+1])if(line.stations[j])graph.get(station).push({to:line.stations[j],line:line.name});});}
  const aliases={'臺北車站':'台北車站','臺大醫院':'台大醫院','臺北101/世貿':'台北101/世貿','台北101世貿':'台北101/世貿'};
  function normalize(value){let s=String(value||'').trim().replace(/捷運|車站|站/g,'').replace(/\s+/g,'');return aliases[s]||s;}
  function route(destination){const end=normalize(destination),start='復興崗';if(!graph.has(end))return null;const queue=[{station:start,steps:[]}],visited=new Set([start]);while(queue.length){const current=queue.shift();if(current.station===end)return current.steps;for(const edge of graph.get(current.station)){if(!visited.has(edge.to)){visited.add(edge.to);queue.push({station:edge.to,steps:[...current.steps,{from:current.station,to:edge.to,line:edge.line}]});}}}return null;}
  function render(destination,container){const steps=route(destination);container.replaceChildren();if(!steps){container.textContent='目前尚未建置此站的完整捷運路線，請使用下方即時導航確認。';return false;}
    const heading=document.createElement('p');heading.className='metro-route-summary';heading.textContent=`復興崗站 → ${normalize(destination)}站｜搭乘 ${steps.length} 站${steps.some((step,i)=>i&&step.line!==steps[i-1].line)?'・需轉乘':''}`;container.append(heading);
    const nodes=[{station:'復興崗',detail:'起點｜請先從北捷行旅步行至車站（步行時間待確認）'}];
    steps.forEach((step,i)=>{const prev=steps[i-1];if(prev&&prev.line!==step.line){nodes[nodes.length-1].detail=`轉乘 ${step.line}（往${step.line==='新北投支線'?'新北投':'目的地方向'}）`;}nodes.push({station:step.to,detail:step.line+(i===steps.length-1?'｜抵達車站':'')});});
    const list=document.createElement('ol');list.className='metro-route-steps';nodes.forEach(node=>{const li=document.createElement('li'),name=document.createElement('strong'),detail=document.createElement('span');name.textContent=node.station+'站';detail.textContent=node.detail;li.append(name,detail);list.append(li);});container.append(list);
    const note=document.createElement('p');note.className='metro-route-note';note.textContent='本站數為靜態路網計算，不含步行、候車及行車時間；請依現場指標與營運公告搭乘。';container.append(note);return true;
  }
  window.MetroInnRoutes={render,route,normalize};
})();
