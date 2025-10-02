// ===== Supabase config =====
const SUPABASE_URL = "https://uyhhxexhagbcwdtoanly.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5aGh4ZXhoYWdiY3dkdG9hbmx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MzEyODksImV4cCI6MjA3MzUwNzI4OX0.p0LeCTzk5T1LKqO7IGBmtH7jKwumy_0vxc-FXKZpRz8";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== Local helpers =====
const MONTH_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const MONTH_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getLang() { return localStorage.getItem("lang") || "th"; }

function fmtDate(iso, lang) {
    if (!iso) return "—";
    const d = new Date(`${iso}T00:00:00`);
    if (isNaN(d)) return "—";
    const day = d.getDate();
    const month = (lang === "th" ? MONTH_TH : MONTH_EN)[d.getMonth()];
    const year = d.getFullYear() + (lang === "th" ? 543 : 0);
    return `${day} ${month} ${year}`;
}

function sortList(list, mode) {
    const byDateDesc = (a, b) => new Date(b.announce_date || b.posted_at || 0) - new Date(a.announce_date || a.posted_at || 0);
    if (mode === "latest") return [...list].sort(byDateDesc);
    if (mode === "pinnedThenDate") {
        return [...list].sort((a, b) => {
            const pinDiff = (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
            return pinDiff !== 0 ? pinDiff : byDateDesc(a, b);
        });
    }
    return [...list].sort(byDateDesc);
}

function getQuery(name) { return new URLSearchParams(location.search).get(name); }

// ===== Load from Supabase =====
async function loadAnnouncements() {
    // เลือกคอลัมน์ที่มีอยู่จริงในตารางของคุณ
    // แนะนำสคีมา: id (uuid), course_id (int / text), title_th, title_en, detail_th, detail_en, announce_date (date), posted_at (timestamptz), pinned (bool)
    const { data, error } = await sb
        .from("announcements")
        .select("id, course_id, title_th, title_en, detail_th, detail_en, announce_date, posted_at, pinned")
        .order("pinned", { ascending: false })
        .order("posted_at", { ascending: false });

    if (error) throw error;
    return data || [];
}

// ===== Render =====
function renderInto(ul, raw) {
    const lang = getLang();
    const sortMode = ul.dataset.sort || "pinnedThenDate";
    const limit = parseInt(ul.dataset.limit || "0", 10);
    const newDays = parseInt(ul.dataset.newDays || "7", 10);

    // กรองวิชาถ้ามี (ทั้งจาก ?course= และ data-course)
    const pageCourse = (getQuery("course") || "").toString().trim().toUpperCase();
    const dataCourse = (ul.dataset.course || "").toString().trim().toUpperCase();
    const courseKey = pageCourse || dataCourse;

    let list = raw.filter(it => {
        if (!courseKey) return true;
        const c = (it.course_id == null ? "" : String(it.course_id)).toUpperCase();
        return c === courseKey;
    });

    list = sortList(list, sortMode);
    if (limit > 0) list = list.slice(0, limit);

    if (!list.length) {
        ul.innerHTML = `<li><div class="time">—</div><div class="event"><i>${lang === 'th' ? 'ยังไม่มีประกาศ' : 'No announcements yet'}</i></div></li>`;
        return;
    }

    const now = Date.now();
    ul.innerHTML = list.map(item => {
        const title = lang === "th" ? (item.title_th || "") : (item.title_en || item.title_th || "");
        const detail = lang === "th" ? (item.detail_th || "") : (item.detail_en || item.detail_th || "");
        const dateStr = fmtDate(item.announce_date || (item.posted_at ? item.posted_at.slice(0, 10) : ""), lang);

        const basis = item.posted_at || item.announce_date;
        const d = basis ? new Date(basis) : null;
        const days = d ? ((now - d.getTime()) / 86400000) : Infinity;
        const isNew = days >= 0 && days <= newDays;

        return `
      <li>
        <div class="time"><span>${dateStr}</span></div>
        <div class="event">
          <div class="event-main"><b>${title || "—"}</b> — <span>${detail || ""}</span></div>
          <div class="event-badges">
            ${item.pinned ? `<span class="pill pinned">${lang === 'th' ? 'ปักหมุด' : 'Pinned'}</span>` : ""}
            ${isNew ? `<span class="pill new">${lang === 'th' ? 'ใหม่' : 'NEW'}</span>` : ""}
          </div>
        </div>
      </li>`;
    }).join("");
}

// ===== Boot =====
(async function boot() {
    const ulList = document.querySelectorAll("#news-list, .js-news");
    // สถานะระหว่างโหลด
    ulList.forEach(ul => ul.innerHTML = `<li><div class="time">—</div><div class="event"><i>${getLang() === 'th' ? 'กำลังโหลด…' : 'Loading…'}</i></div></li>`);

    try {
        const data = await loadAnnouncements();
        ulList.forEach(ul => renderInto(ul, data));

        // รีเรนเดอร์เมื่อสลับภาษา
        document.querySelectorAll(".lang-btn").forEach(btn => {
            btn.addEventListener("click", () => ulList.forEach(ul => renderInto(ul, data)));
        });
    } catch (err) {
        console.error(err);
        const msg = getLang() === 'th' ? 'โหลดประกาศไม่สำเร็จ' : 'Failed to load announcements';
        ulList.forEach(ul => ul.innerHTML = `<li><div class="time">—</div><div class="event"><i>${msg}</i></div></li>`);
    }
})();
