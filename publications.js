// publications.js — logic สำหรับหน้า publications.html เท่านั้น
(function () {
  const filterBar = document.getElementById('filters');
  const qInput = document.getElementById('q');
  const items = Array.from(document.querySelectorAll('.pub-item'));
  let currentTag = 'all';

  function apply() {
    const q = (qInput?.value || '').trim().toLowerCase();

    items.forEach((el) => {
      const tags = el.dataset.tags || '';
      const title = (el.dataset.title || '').toLowerCase();
      const authors = (el.dataset.authors || '').toLowerCase();

      const textHit = !q || title.includes(q) || authors.includes(q);
      const tagHit = currentTag === 'all' || tags.split(/\s+/).includes(currentTag);

      el.style.display = textHit && tagHit ? '' : 'none';
    });
  }

  // filter chips
  filterBar?.addEventListener('click', (e) => {
    if (!(e.target instanceof Element)) return;
    const btn = e.target.closest('button[data-filter]');
    if (!btn) return;
    currentTag = btn.dataset.filter;
    filterBar
      .querySelectorAll('button[data-filter]')
      .forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    apply();
  });

  // search
  qInput?.addEventListener('input', apply);

  // copy BibTeX (แปลข้อความตามภาษา)
  document.addEventListener('click', (e) => {
    const btn = e.target instanceof Element ? e.target.closest('button[data-bibtex]') : null;
    if (!btn) return;
    const bib = btn.getAttribute('data-bibtex') || '';
    navigator.clipboard?.writeText(bib);

    // อ่านข้อความจาก I18N ตามภาษา
    const lang = document.documentElement.lang || 'th';
    const dict = (typeof I18N !== 'undefined' && (I18N[lang] || I18N.th)) || { "pubs.copied": "Copied" };

    const old = btn.textContent;
    btn.textContent = dict['pubs.copied'] || 'Copied';
    setTimeout(() => {
      btn.textContent = old || 'BibTeX';
    }, 1200);
  });

  apply();
})();
