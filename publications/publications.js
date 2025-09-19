// publications.js — โหลด/เรนเดอร์ JSON + ค้นหา/กรอง + คัดลอก BibTeX (พร้อม keywords/synonyms)
(function () {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  const root = $('#pubs-root');
  const filterBar = $('#filters');
  const qInput = $('#q');
  const resultCount = $('#resultCount');

  let items = [];
  let currentTag = 'all';

  // แท็กมาตรฐานที่ระบบรองรับ
  const VALID_TAGS = new Set(['all', 'rfa', 'evt', 'hydro', 'ai']);

  // คำพ้องความหมายตามแท็ก (ให้ค้นหาประโยคยาว ๆ แล้วเจอ)
  const TAG_SYNONYMS = {
    rfa: [
      "RFA", "regional frequency analysis", "L-moments", "return period",
      "การวิเคราะห์ความถี่ภูมิภาค", "แอล-โมเมนต์", "ช่วงเวลาการเกิดซ้ำ"
    ],
    evt: [
      "EVT", "extreme value", "extreme events", "GEV", "GPD",
      "ค่าสุดขั้ว", "แบบจำลองค่าสุดขั้ว",
      "Statistical Meteorology including Extreme Events and Climate Change"
    ],
    hydro: [
      "hydrology", "watershed", "rainfall", "flood", "drought",
      "ไฮโดรลอจี", "ลุ่มน้ำ", "ฝน", "น้ำท่วม", "ภัยแล้ง"
    ],
    ai: [
      "AI", "machine learning", "ensemble learning", "statistical computing",
      "ปัญญาประดิษฐ์", "แมชชีนเลิร์นนิง",
      "Design and Analysis of Computer Experiments"
    ]
  };

  async function loadData() {
    const resp = await fetch('/publications/publications.json', { cache: 'no-cache' });
    const data = await resp.json();
    return data.items || [];
  }

  function groupYears(arr) {
    const ys = [...new Set(arr.map(i => i.year))].sort((a, b) => b - a);
    return ys.map(y => [y, arr.filter(i => i.year === y)]);
  }

  function buildIndexStr(it, lang) {
    const kw = (it.keywords || []).join(' ');
    const tagSyn = (it.tags || []).flatMap(t => TAG_SYNONYMS[t] || [t]).join(' ');
    return [
      it.title || '',
      (it.authors || []).join(', '),
      it.venue || '',
      it.i18n?.[lang]?.desc || '',
      kw,
      tagSyn
    ].join(' ').toLowerCase();
  }

  function renderList(data) {
    root.innerHTML = '';
    const lang = document.documentElement.lang || 'th';

    groupYears(data).forEach(([year, arr]) => {
      const h2 = document.createElement('h2');
      h2.className = 'year-heading';
      h2.id = `year-${year}`;
      h2.textContent = String(year);

      const list = document.createElement('div');
      list.className = 'cards pubs-onecol';
      list.id = `list-${year}`;
      list.setAttribute('role', 'list');
      list.setAttribute('aria-describedby', h2.id);

      arr.forEach(it => {
        const art = document.createElement('article');
        art.className = 'card pub-item';
        art.setAttribute('role', 'listitem');
        art.dataset.tags = (it.tags || []).join(' ');
        art.dataset.title = it.title || '';
        art.dataset.authors = (it.authors || []).join(', ');
        art.dataset.year = String(it.year || '');
        art.dataset.index = buildIndexStr(it, lang); // ✅ อินเด็กซ์สำหรับค้นหา

        art.innerHTML = `
          <h3 class="pub__title">${it.title}</h3>
          <p class="pub__meta">${it.venue}${it.venue?.includes(String(it.year)) ? '' : ` (${it.year}).`}</p>
          <p class="pub__desc">${(it.i18n?.[lang]?.desc) || ''}</p>

          <div class="actions" role="group" aria-label="ลิงก์ผลงาน">
            ${it.url_pdf ? `<a class="btn btn--primary" href="${it.url_pdf}" target="_blank" rel="noopener" data-i18n="pubs.read">อ่านเปเปอร์</a>` : ''}
            ${it.url_code ? `<a class="btn btn--outline" href="${it.url_code}" target="_blank" rel="noopener" data-i18n="pubs.code">โค้ด &amp; ข้อมูล</a>` : ''}
            ${it.doi ? `<a class="btn btn--ghost btn--sm" href="https://doi.org/${it.doi}" target="_blank" rel="noopener" data-i18n="pubs.btn.doi">DOI</a>` : ''}
            ${it.bibtex ? `<button class="btn btn--ghost btn--sm" data-i18n="pubs.btn.bibtex" data-bibtex="${it.bibtex.replace(/"/g, '&quot;')}">BibTeX</button>` : ''}
          </div>

          <ul class="meta" aria-label="สถานะและสาขา">
            ${(it.tags || []).map(t => `<li class="pill">${t.toUpperCase()}</li>`).join('')}
          </ul>
        `;
        list.appendChild(art);
      });

      root.appendChild(h2);
      root.appendChild(list);
    });
  }

  function applyFilterSearch() {
    const q = (qInput?.value || '').trim().toLowerCase();
    let visible = 0;

    $$('.pub-item').forEach(el => {
      const tags = (el.dataset.tags || '').split(/\s+/);
      const index = el.dataset.index || '';
      const hitTag = currentTag === 'all' || tags.includes(currentTag);
      const hitText = !q || index.includes(q);
      const show = hitTag && hitText;
      el.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    // ซ่อนปีที่ไม่มีรายการ
    $$('.cards.pubs-onecol').forEach(group => {
      const any = $$('.pub-item', group).some(el => el.style.display !== 'none');
      const h2 = document.getElementById(group.getAttribute('aria-describedby') || '');
      group.style.display = any ? '' : 'none';
      if (h2) h2.style.display = any ? '' : 'none';
    });

    const total = $$('.pub-item').length;
    if (resultCount) {
      const lang = document.documentElement.lang || 'th';
      const base = lang.startsWith('th') ? 'ผลลัพธ์' : 'results';
      resultCount.textContent = (visible === total) ? `${total} ${base}` : `${visible} / ${total} ${base}`;
    }
  }

  // ✅ ปรับ logic ของปุ่มชิป: ถ้าไม่ใช่แท็กที่รู้จัก ให้ถือเป็น "คำค้นหา"
  filterBar?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-filter], button[data-query]');
    if (!btn) return;

    const val = (btn.dataset.filter || btn.dataset.query || '').trim();

    if (VALID_TAGS.has(val)) {
      currentTag = val;
    } else {
      currentTag = 'all';
      if (qInput) qInput.value = val; // ใส่คำชิปยาวลงช่องค้นหา
    }

    // toggle pressed state
    $$('.chip', filterBar).forEach(b => {
      const active = (b === btn);
      b.setAttribute('aria-pressed', String(active));
      b.classList.toggle('is-active', active);
    });

    applyFilterSearch();
  });

  // search
  qInput?.addEventListener('input', applyFilterSearch);

  // copy BibTeX
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-bibtex]');
    if (!btn) return;
    const bib = btn.getAttribute('data-bibtex') || '';
    if (bib && navigator.clipboard?.writeText) navigator.clipboard.writeText(bib);
    const lang = document.documentElement.lang || 'th';
    const dict = (typeof I18N !== 'undefined' && (I18N[lang] || I18N.th)) || {};
    const copied = dict['pubs.copied'] || (lang.startsWith('th') ? 'คัดลอกแล้ว' : 'Copied');
    const old = btn.textContent?.trim() || 'BibTeX';
    btn.textContent = copied;
    setTimeout(() => (btn.textContent = old), 1200);
  });

  // re-render เมื่อเปลี่ยนภาษา (อาศัย window.dispatchEvent('langchange') จาก lang.js)
  window.addEventListener('langchange', () => {
    renderList(items);
    applyFilterSearch();
  });

  // init
  (async () => {
    items = await loadData();
    items.sort((a, b) => (b.year - a.year));
    renderList(items);
    applyFilterSearch();
  })();
})();
