/* 北投旅圖｜字級調整：預設 / 放大 / 特大；只調整文字，不縮放圖片及版面。 */
(function () {
  'use strict';
  if (window.__metroFontControlsLoaded) return;
  window.__metroFontControlsLoaded = true;
  var KEY = 'metro-inn-reading-font-level';
  var FACTORS = [1, 1.15, 1.3];
  var selector = 'h1,h2,h3,h4,h5,h6,p,a,span,small,strong,em,b,i,li,dt,dd,td,th,label,button,input,textarea,select,time,figcaption,blockquote';
  var level = 0, observer;
  try { level = Math.max(0, Math.min(2, Number(localStorage.getItem(KEY)) || 0)); } catch (_) {}
  function eligible(el) { return el instanceof HTMLElement && !el.closest('#metro-font-controls,svg,[data-font-no-scale]'); }
  function register(root) {
    if (!root || root.nodeType !== 1) return;
    var nodes = [];
    if (root.matches && root.matches(selector)) nodes.push(root);
    if (root.querySelectorAll) nodes.push.apply(nodes, root.querySelectorAll(selector));
    nodes.forEach(function(el) {
      if (!eligible(el) || el.hasAttribute('data-metro-font-base')) return;
      var size = parseFloat(getComputedStyle(el).fontSize);
      if (!Number.isFinite(size) || size <= 0) return;
      // Elements inserted after scaling may inherit a scaled font size.
      var inherited = el.parentElement && el.parentElement.closest('[data-metro-font-base]');
      if (inherited && getComputedStyle(el).fontSize === getComputedStyle(el.parentElement).fontSize && level) size /= FACTORS[level];
      el.style.setProperty('--metro-font-base', size + 'px');
      el.setAttribute('data-metro-font-base', '');
    });
  }
  function apply(next) {
    level = next;
    document.documentElement.style.setProperty('--metro-font-factor', FACTORS[level]);
    document.documentElement.setAttribute('data-metro-font-level', String(level));
    document.querySelectorAll('#metro-font-controls button').forEach(function(button) {
      var selected = Number(button.dataset.level) === level;
      button.setAttribute('aria-pressed', String(selected));
      button.classList.toggle('active', selected);
    });
    try { localStorage.setItem(KEY, String(level)); } catch (_) {}
  }
  function init() {
    if (document.getElementById('metro-font-controls')) return;
    var css = document.createElement('style');
    css.textContent = '[data-metro-font-base]{font-size:calc(var(--metro-font-base) * var(--metro-font-factor, 1))!important}' +
      '#metro-font-controls{display:inline-flex;align-items:center;gap:2px;flex:0 0 auto;margin-left:12px;padding:2px;background:transparent;border:0;box-shadow:none;font-family:Arial,"Noto Sans TC",sans-serif;color:#333;white-space:nowrap}' +
      '#metro-font-controls .metro-font-label{display:none}' +
      '#metro-font-controls button{font-size:13px!important;line-height:1.3!important;padding:5px 7px;border:1px solid transparent;background:transparent;color:#555;cursor:pointer;white-space:nowrap;border-radius:2px}' +
      '#metro-font-controls button.active{border-color:#d7d7d7;background:#f4f4f4;font-weight:700}' +
      '#metro-font-controls button:focus-visible{outline:2px solid #e96842;outline-offset:2px}' +
      '.topbar .nav{display:flex;align-items:center} .topbar .top-actions{display:flex;align-items:center;gap:8px} #metro-font-controls button:hover{background:#f4f4f4} @media(max-width:700px){#metro-font-controls{margin-left:5px}#metro-font-controls button{padding:5px 4px;font-size:12px!important}}';
    document.head.appendChild(css);
    var box = document.createElement('div');
    box.id = 'metro-font-controls';
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', '調整網站字級');
    box.innerHTML = '<button type="button" data-level="0" aria-label="標準字級" title="標準字級">A</button><button type="button" data-level="1" aria-label="放大字級" title="放大字級">A+</button><button type="button" data-level="2" aria-label="特大字級" title="特大字級">A++</button>';
    var target = document.querySelector('.main > .topbar .top-actions') || document.querySelector('#header .topbar .nav') || document.querySelector('header.topbar .nav') || document.querySelector('header .top-actions');
    if (target) target.appendChild(box); else document.body.appendChild(box);
    register(document.body);
    box.addEventListener('click', function(event) {
      var button = event.target.closest('button[data-level]');
      if (button) apply(Number(button.dataset.level));
    });
    apply(level);
    observer = new MutationObserver(function(records) {
      records.forEach(function(record) { record.addedNodes.forEach(register); });
    });
    observer.observe(document.body, {childList:true,subtree:true});
    // 前台頁首由 data.js 非同步建立，出現後才將控制器移入頁首。
    var headerObserver = new MutationObserver(function(){
      var target = document.querySelector('.main > .topbar .top-actions') || document.querySelector('#header .topbar .nav') || document.querySelector('header.topbar .nav');
      if (target && box.parentElement !== target) target.appendChild(box);
      if (target) headerObserver.disconnect();
    });
    if (box.parentElement === document.body) headerObserver.observe(document.body, {childList:true,subtree:true});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
