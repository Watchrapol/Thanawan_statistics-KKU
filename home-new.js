/* ===== Supabase config ===== */
const SUPABASE_URL = "https://uyhhxexhagbcwdtoanly.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5aGh4ZXhoYWdiY3dkdG9hbmx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MzEyODksImV4cCI6MjA3MzUwNzI4OX0.p0LeCTzk5T1LKqO7IGBmtH7jKwumy_0vxc-FXKZpRz8";
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ===== Helpers ===== */
const MONTH_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const MONTH_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];

function fmtDate(iso, lang) {
    if (!iso) return "—";
    const d = new Date(iso + "T00:00:00");
    const day = d.getDate();
    const month = (lang === "th" ? MONTH_TH : MONTH_EN)[d.getMonth()];
    const year = d.getFullYear() + (lang === "th" ? 543 : 0);
    return `${day} ${month} ${year}`;
}

/* ===== Render ===== */
async function renderHomeNews() {
    const ul = document.getElementById("home-news");
    if (!ul) return;

    const lang = (localStorage.getItem("lang") || document.documentElement.lang || "th").toLowerCase();
    const limit = parseInt(ul.dataset.limit || "3", 10);
    const newDays = parseInt(ul.dataset.newDays || "3", 10);

    // เงื่อนไข RLS ฝั่ง DB เปิดอ่านสาธารณะแล้ว แต่กันฝั่ง client อีกชั้นก็ได้
    const nowIso = new Date().toISOString();

    const { data, error } = await sb
        .from("announcements")
        .select("id, title_th, title_en, detail_th, detail_en, announce_date, posted_at, pinned")
        .or(`posted_at.is.null,posted_at.lte.${nowIso}`) // เผยแพร่แล้วหรือไม่กำหนดเวลา
        .order("pinned", { ascending: false })
        .order("announce_date", { ascending: false })
        .order("posted_at", { ascending: false })
        .limit(limit);

    if (error) {
        ul.innerHTML = `<li><div class="time">—</div><div class="event"><i>โหลดประกาศไม่สำเร็จ</i></div></li>`;
        return;
    }

    if (!data?.length) {
        ul.innerHTML = `<li><div class="time">—</div><div class="event"><i>ยังไม่มีประกาศ</i></div></li>`;
        return;
    }

    const now = Date.now();
    ul.innerHTML = data.map(it => {
        const title = (lang === "th" ? it.title_th : it.title_en) || it.title_th || it.title_en || "";
        const detail = (lang === "th" ? it.detail_th : it.detail_en) || it.detail_th || it.detail_en || "";
        const dateStr = fmtDate(it.announce_date || (it.posted_at || "").slice(0, 10), lang);

        // NEW? นับจาก posted_at (ถ้าไม่มีให้ถือว่าไม่ใหม่)
        let isNew = false;
        if (it.posted_at) {
            const d = new Date(it.posted_at);
            const days = (now - d.getTime()) / 86400000;
            isNew = days >= 0 && days <= newDays;
        }

        return `
      <li>
        <div class="time"><span>${dateStr}</span></div>
        <div class="event">
          <div class="event-main"><b>${title}</b> — <span>${detail}</span></div>
          <div class="event-badges">
            ${it.pinned ? `<span class="pill pinned">${lang === 'th' ? 'ปักหมุด' : 'Pinned'}</span>` : ""}
            ${isNew ? `<span class="pill new">${lang === 'th' ? 'ใหม่' : 'NEW'}</span>` : ""}
          </div>
        </div>
      </li>
    `;
    }).join("");
}

renderHomeNews();

// ถ้าหน้าใช้ปุ่มสลับภาษาแบบเดียวกับเว็บ ให้เรนเดอร์ใหม่เมื่อกด
document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.addEventListener("click", () => setTimeout(renderHomeNews, 0));
});
