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
  function render(destination,container){
    const steps=route(destination);container.replaceChildren();
    if(!steps){container.textContent='此景點的捷運轉乘路線尚待確認，請使用下方 Google Maps 即時導航。';return false;}
    const list=document.createElement('ol');list.className='metro-route-steps';
    function add(name,detail){const li=document.createElement('li'),strong=document.createElement('strong'),span=document.createElement('span');strong.textContent=name;span.textContent=detail;li.append(strong,span);list.append(li);}
    add('北捷行旅','步行前往復興崗站｜步行時間待確認');
    if(steps.length){
      let segmentStart='復興崗',segmentLine=steps[0].line,count=0;
      for(let i=0;i<steps.length;i++){
        const step=steps[i];
        if(step.line!==segmentLine){add(segmentStart+'站','轉乘'+segmentLine+'，搭乘 '+count+' 站 → '+steps[i-1].to+'站');segmentStart=steps[i-1].to;segmentLine=step.line;count=0;}
        count++;
        if(i===steps.length-1){add(segmentStart+'站','搭乘'+segmentLine+' '+count+' 站 → '+step.to+'站');}
      }
    }
    const end=normalize(destination);
    add(end+'站','出站後步行前往景點｜步行時間待確認');
    add('抵達景點','請依現場指標前往目的地');
    container.append(list);
    const note=document.createElement('p');note.className='metro-route-note';note.textContent='站數依已建置的靜態捷運路網計算；步行、候車及行車時間尚未納入。';container.append(note);return true;
  }
  window.MetroInnRoutes={render,route,normalize};
})();
