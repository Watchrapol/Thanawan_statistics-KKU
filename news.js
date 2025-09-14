// news.js — ดึงประกาศจาก announcements.json แล้วเรนเดอร์
(async function () {
    const MONTH_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    const MONTH_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    function fmtDate(iso, lang) {
        // ป้อนรูปแบบ YYYY-MM-DD
        const d = new Date(iso + "T00:00:00");
        const day = d.getDate();
        const month = (lang === "th" ? MONTH_TH : MONTH_EN)[d.getMonth()];
        const year = d.getFullYear() + (lang === "th" ? 543 : 0);
        return `${day} ${month} ${year}`;
    }

    function sortList(list, mode) {
        const byDateDesc = (a, b) => new Date(b.date) - new Date(a.date);
        if (mode === "latest") return [...list].sort(byDateDesc);
        if (mode === "pinnedThenDate") {
            return [...list].sort((a, b) => {
                const pinDiff = (b.pinned | 0) - (a.pinned | 0);
                return pinDiff !== 0 ? pinDiff : byDateDesc(a, b);
            });
        }
        return [...list].sort(byDateDesc);
    }

    async function loadData() {
        // กันแคชแบบง่าย (เปลี่ยน v เมื่อแก้ JSON บ่อย ๆ)
        const res = await fetch(`announcements.json?ts=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) throw new Error("โหลดประกาศไม่สำเร็จ");
        return res.json();
    }

    function renderInto(ul, raw) {
        const lang = localStorage.getItem("lang") || "th";
        const sortMode = ul.dataset.sort || "pinnedThenDate";
        const limit = parseInt(ul.dataset.limit || "0", 10);

        let list = sortList(raw, sortMode);
        if (limit > 0) list = list.slice(0, limit);

        if (!list.length) {
            ul.innerHTML = `<li><div class="time">—</div><div class="event"><i>${lang === 'th' ? 'ยังไม่มีประกาศ' : 'No announcements yet'}</i></div></li>`;
            return;
        }

        ul.innerHTML = list.map(item => {
            const dateStr = fmtDate(item.date, lang);
            const title = (item.title?.[lang]) || "";
            const detail = (item.detail?.[lang]) || "";
            const badge = item.pinned ? `<span class="pill" style="margin-left:8px" data-i18n="news.pinned">${lang === 'th' ? 'ปักหมุด' : 'Pinned'}</span>` : "";
            const titleHtml = item.url
                ? `<a href="${item.url}" target="_blank" rel="noopener">${title}</a>`
                : title;

            return `
  <li>
    <div class="time"><span>${dateStr}</span></div>
    <div class="event">
      <div class="event-main">
        <b>${titleHtml}</b> — <span>${detail}</span>
      </div>
      ${item.pinned ? `<span class="pill pinned" aria-label="${lang === 'th' ? 'ปักหมุด' : 'Pinned'}"> ${lang === 'th' ? 'ปักหมุด' : 'Pinned'}</span>` : ""}
    </div>
  </li>`;

        }).join("");
    }

    let CACHE = [];
    try {
        CACHE = await loadData();
    } catch (e) {
        console.error(e);
        CACHE = [];
    }

    // รองรับหลายรายการในหน้าเดียว (เช่น home + sidebar อื่น)
    const lists = document.querySelectorAll("#news-list");
    lists.forEach(ul => renderInto(ul, CACHE));

    // เมื่อสลับภาษา ให้เรนเดอร์ใหม่
    document.querySelectorAll(".lang-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            lists.forEach(ul => renderInto(ul, CACHE));
        });
    });
})();
