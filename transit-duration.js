/* 交通分鐘計算：只加總已明確填寫的路段；不猜測候車或轉乘時間。 */
(function(global){'use strict';
function minutes(value){if(value===null||value===undefined||value==='')return null;if(typeof value==='number')return Number.isFinite(value)&&value>=0?value:null;const s=String(value).trim().replace(/約/g,'');if(/^\d+(?:\.\d+)?$/.test(s))return Number(s);const h=s.match(/^(?:(\d+(?:\.\d+)?)\s*小時)?\s*(?:(\d+(?:\.\d+)?)\s*分鐘)?$/);return h&&(h[1]||h[2])?Number(h[1]||0)*60+Number(h[2]||0):null;}
function calculate(route){const steps=Array.isArray(route)?route:route?.steps;if(!Array.isArray(steps))return {total:0,missing:0,count:0,complete:false};let total=0,missing=0,count=0;for(const step of steps){if(!step||['站點','抵達'].includes(step.type||step.mode))continue;count++;const duration=minutes(step.duration);if(duration===null)missing++;else total+=duration;}return {total:Math.round(total*10)/10,missing,count,complete:count>0&&missing===0};}
function label(result){if(!result.count)return '尚未填寫交通路段';if(result.missing)return `已填路段合計約 ${result.total} 分鐘（${result.missing} 段未填時間）`;return `全程約 ${result.total} 分鐘`;}
global.MetroTransitDuration=Object.freeze({minutes,calculate,label});
})(window);
