/* 前台目錄共用分頁：先篩選，再以每頁 20 筆顯示。 */
(function () {
  window.createDirectoryPager = function (container, renderPage) {
    const size = 20;
    let page = 1;
    let records = [];
    const bar = container.querySelector('.pagination');
    function draw() {
      const pages = Math.ceil(records.length / size);
      page = Math.max(1, Math.min(page, Math.max(1, pages)));
      renderPage(records.slice((page - 1) * size, page * size));
      bar.replaceChildren();
      bar.hidden = pages <= 1;
      if (pages <= 1) return;
      function button(label, target, disabled, active) {
        const el = document.createElement('button');
        el.type = 'button';
        el.textContent = label;
        el.disabled = disabled;
        el.className = active ? 'active' : '';
        if (active) el.setAttribute('aria-current', 'page');
        el.addEventListener('click', function () {
          if (disabled || target === page) return;
          page = target;
          draw();
          container.querySelector('.filter-row')?.scrollIntoView({behavior: 'smooth', block: 'start'});
        });
        bar.appendChild(el);
      }
      button('上一頁', page - 1, page === 1, false);
      for (let i = 1; i <= pages; i++) button(String(i), i, false, i === page);
      button('下一頁', page + 1, page === pages, false);
      const summary = document.createElement('span');
      summary.className = 'pagination-summary';
      summary.textContent = `共 ${records.length} 筆・第 ${page} / ${pages} 頁`;
      bar.appendChild(summary);
    }
    return {
      setRecords: function (items) { records = Array.isArray(items) ? items : []; page = 1; draw(); }
    };
  };
}());
