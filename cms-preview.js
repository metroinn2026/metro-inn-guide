/* 共用草稿預覽：使用網站 style.css 的版面類別；僅渲染本機表單資料，不讀取資料庫。 */
(function(global){'use strict';
function render(frame,type,data,dirty){
 const doc=document.implementation.createHTMLDocument('北投旅圖｜草稿預覽');
 const base=doc.createElement('base');base.href=location.href;doc.head.append(base);
 const css=doc.createElement('link');css.rel='stylesheet';css.href='style.css';doc.head.append(css);
 const style=doc.createElement('style');style.textContent='.draft-alert{position:sticky;top:0;z-index:999;background:#fff3d9;color:#48351d;padding:12px 18px;border-bottom:2px solid #d7a24a;font:600 14px system-ui}.draft-hero{min-height:230px;background:#e7eee8;display:flex;align-items:end;padding:30px 20px}.draft-hero h1{margin:8px 0;font-size:clamp(26px,5vw,44px)}.draft-hero img{max-height:260px;max-width:100%;object-fit:cover}.draft-content{max-width:960px;margin:24px auto;padding:0 20px;line-height:1.8}.draft-content section{padding:18px 0;border-bottom:1px solid #ddd}.draft-content p{white-space:pre-wrap}.draft-content img{max-width:100%;height:auto}.draft-grid{display:grid;grid-template-columns:2fr 1fr;gap:24px}@media(max-width:650px){.draft-grid{grid-template-columns:1fr}}';doc.head.append(style);
 const el=(tag,cls,text)=>{const node=doc.createElement(tag);if(cls)node.className=cls;if(text!==undefined&&text!==null)node.textContent=String(text);return node;};
 const alert=el('div','draft-alert',dirty?'草稿預覽｜含尚未儲存的修改，不代表網站已上架':'草稿預覽｜目前已載入內容，非正式發布頁');doc.body.append(alert);
 const hero=el('header','draft-hero');const wrap=el('div','container');wrap.append(el('div','kicker',({spots:'SPOT DETAIL',foods:'FOOD DETAIL',trips:'ROUTE DETAIL'})[type]||'METRO INN GUIDE'),el('h1','',data.title||'未命名'),el('p','',data.summary||''));hero.append(wrap);doc.body.append(hero);
 const main=el('main','draft-content container');doc.body.append(main);
 function section(label,value){if(value===null||value===undefined||value==='')return;const sec=el('section','story');sec.append(el('h2','',label),el('p','',typeof value==='string'?value:JSON.stringify(value,null,2)));main.append(sec);}
 function image(url,alt){if(typeof url!=='string'||!/^https?:\/\//i.test(url))return;const img=el('img','',undefined);img.src=url;img.alt=alt||'';img.loading='lazy';main.append(img);}
 image(data.cover_image,data.title);
 section('介紹',data.content);section('地址',data.address);section('營業時間',data.business_hours);section('建議停留',data.stay_time);section('最近捷運站',data.station);
 if(type==='trips'&&Array.isArray(data.trip_sections)){data.trip_sections.forEach((s,i)=>{const sec=el('section','story numbered-story');sec.append(el('h2','',String(i+1).padStart(2,'0')+'｜'+[s.time,s.title].filter(Boolean).join(' ')),el('p','',s.text||s.description||''));if(typeof s.image==='string'&&/^https?:\/\//i.test(s.image)){const img=el('img');img.src=s.image;img.alt=s.title||'';sec.append(img);}if(s.image_source)sec.append(el('small','',`圖片來源：${s.image_source}`));main.append(sec);});}
 else{section('捷運交通',data.transport_metro);section('公車及轉乘',data.transport_bus);section('開車資訊',data.transport_car);if(data.transport_routes)section('交通路線',data.transport_routes);}
 if(data.google_map){const a=el('a','button outline','查看 Google Maps ↗');if(/^https:\/\//i.test(data.google_map)){a.href=data.google_map;a.target='_blank';a.rel='noopener noreferrer';main.append(a);}}
 const footer=el('footer','draft-content','METRO INN GUIDE｜僅供後台審稿預覽');doc.body.append(footer);
 frame.removeAttribute('src');frame.srcdoc='<!doctype html>'+doc.documentElement.outerHTML;
}
global.MetroCmsPreview={render};
})(window);
