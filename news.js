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

    // --- ช่วยอ่าน query param ---
    function getQuery(name) { return new URLSearchParams(location.search).get(name); }

    // --- เรนเดอร์เข้าแต่ละรายการ ---
    function renderInto(ul, raw) {
        const lang = localStorage.getItem("lang") || "th";
        const sortMode = ul.dataset.sort || "pinnedThenDate";
        const limit = parseInt(ul.dataset.limit || "0", 10);
        const newDays = parseInt(ul.dataset.newDays || "7", 10);
        const courseKey = (ul.dataset.course || "").toUpperCase(); // ถ้ามี = กรองตามวิชา

        // กรองตามวิชา (รองรับทั้ง item.course = "SC602001" หรือ item.courses = ["SC602001", ...])
        let base = raw.filter(it => {
            if (!courseKey) return true;
            const c1 = (it.course || "").toString().toUpperCase();
            const cL = Array.isArray(it.courses) ? it.courses.map(x => String(x).toUpperCase()) : [];
            return c1 === courseKey || cL.includes(courseKey);
        });

        // เรียง + ตัดจำนวน
        base = sortList(base, sortMode);
        if (limit > 0) base = base.slice(0, limit);

        // ว่างเปล่า
        if (!base.length) {
            ul.innerHTML = `<li><div class="time">—</div><div class="event"><i>${lang === 'th' ? 'ยังไม่มีประกาศ' : 'No announcements yet'}</i></div></li>`;
            return;
        }

        const now = Date.now();
        ul.innerHTML = base.map(item => {
            // คิด NEW จาก postedAt/updatedAt/date (เลือกที่มี)
            const basisStr = item.postedAt || item.updatedAt || item.date;
            const d = new Date(basisStr + "T00:00:00");
            const days = isNaN(d) ? Infinity : (now - d.getTime()) / 86400000;
            const isNew = days >= 0 && days <= newDays || item.new === true;

            const dateStr = fmtDate(item.date, lang); // ซ้ายยังโชว์ 'date' (วันเหตุการณ์)
            const title = (item.title?.[lang]) || "";
            const detail = (item.detail?.[lang]) || "";
            const titleHtml = item.url ? `<a href="${item.url}" target="_blank" rel="noopener">${title}</a>` : title;

            return `
      <li>
        <div class="time"><span>${dateStr}</span></div>
        <div class="event">
          <div class="event-main"><b>${titleHtml}</b> — <span>${detail}</span></div>
          <div class="event-badges">
            ${item.pinned ? `<span class="pill pinned">${lang === 'th' ? 'ปักหมุด' : 'Pinned'}</span>` : ""}
            ${isNew ? `<span class="pill new">${lang === 'th' ? 'ใหม่' : 'NEW'}</span>` : ""}
          </div>
        </div>
      </li>`;
        }).join("");
    }

    // --- โหลด + ผูกกับทุก list ---
    // กันแคชทุกครั้งที่โหลดหน้า (ทางเลือก A ที่คุยกัน)
    const res = await fetch(`announcements.json?ts=${Date.now()}`, { cache: 'no-store' });
    let CACHE = [];
    try { CACHE = await res.json(); } catch (e) { console.error(e); }

    const pageCourse = (getQuery('course') || "").toUpperCase();
    // รองรับทั้ง id เดิม (#news-list) และของใหม่ (.js-news)
    const lists = document.querySelectorAll("#news-list, .js-news");
    lists.forEach(ul => {
        if (pageCourse && !ul.dataset.course) ul.dataset.course = pageCourse; // ถ้าเปิดหน้าประกาศด้วย ?course=
        renderInto(ul, CACHE);
    });

    // สลับภาษาแล้วเรนเดอร์ใหม่
    document.querySelectorAll(".lang-btn").forEach(btn => {
        btn.addEventListener("click", () => lists.forEach(ul => renderInto(ul, CACHE)));
    });

})();
