/* ========= Supabase config ========= */
const SUPABASE_URL = "https://uyhhxexhagbcwdtoanly.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5aGh4ZXhoYWdiY3dkdG9hbmx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MzEyODksImV4cCI6MjA3MzUwNzI4OX0.p0LeCTzk5T1LKqO7IGBmtH7jKwumy_0vxc-FXKZpRz8";
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ========= Utils ========= */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
const ROSTER_PAGE_SIZE = 10;

window.openCourseDetail = openCourseDetail;
window.switchTab = switchTab;
window.sb = sb; // (อันนี้คุณใส่แล้ว)

/* ========= Boot ========= */
boot();
async function boot() {
  // วันที่อัปเดต
  const ud = $("#app-updated");
  if (ud) ud.textContent = new Date().toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "2-digit" });

  // ออกระบบ
  $("#btn-signout")?.addEventListener("click", async () => {
    await sb.auth.signOut();
    location.href = "portal.html";
  });

  // เมนูลัด
  $$(".header-actions [data-nav]").forEach((btn) => {
    btn.addEventListener("click", () => showSection(btn.dataset.nav));
  });

  // ตรวจผู้ใช้ + role
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return showBlocker("ยังไม่ได้เข้าสู่ระบบ", "กรุณาไปที่หน้า portal.html เพื่อเข้าสู่ระบบก่อน");

  // ผูกโปรไฟล์กับบัญชี auth (ครั้งแรกที่ล็อกอิน)
  await linkProfileToAuth(user);

  const { prof } = await getAndLinkProfile(user);
  if (!prof) return showBlocker("ไม่ได้รับสิทธิ์เข้าถึง", `บัญชี ${user.email} ยังไม่ถูกตั้งค่าในระบบ`);
  if (!["admin", "instructor"].includes(prof.role)) {
    return showBlocker("ไม่ได้รับสิทธิ์เข้าถึง", `บัญชี ${user.email} ไม่ใช่ผู้ดูแล/อาจารย์`);
  }

  // เก็บโปรไฟล์ผู้ใช้ไว้ใช้งาน
  window._me = prof;

  // เครื่องมือรายวิชา
  $("#btn-add-course")?.addEventListener("click", () => createCourse(prof.user_id));
  $("#btn-refresh-courses")?.addEventListener("click", () => loadCourses(prof.user_id));
  $("#q")?.addEventListener("input", () => filterCourses());

  // โหลดรายวิชา
  await loadCourses(prof.user_id);
}

// สร้างหรืออัปเดตโปรไฟล์จากอีเมล (ไม่บังคับให้มี user_id)
async function ensureProfileByEmail({ email, full_name = null, role }) {
  const em = String(email || "").trim().toLowerCase();
  if (!em) throw new Error("ต้องระบุอีเมล");

  let { data: prof, error: e1 } = await sb
    .from("profiles")
    .select("user_id, email, full_name, role")
    .eq("email", em)
    .maybeSingle();
  if (e1) throw e1;

  if (prof) {
    const patch = {};
    if (full_name && full_name !== prof.full_name) patch.full_name = full_name;
    if (role != null && role !== prof.role) patch.role = role;
    if (Object.keys(patch).length) {
      const { data: upd, error: e2 } = await sb.from("profiles").update(patch).eq("email", em).select().single();
      if (e2) throw e2;
      prof = upd;
    }
    return prof;
  }

  const insertRole = role == null ? "student" : role;
  const { data: created, error: e3 } = await sb.from("profiles").insert({ email: em, full_name, role: insertRole }).select().single();
  if (e3) throw e3;
  return created;
}

// ผูก profiles.user_id ให้ตรงกับ auth.users.id เมื่อผู้ใช้ล็อกอินครั้งแรก
async function linkProfileToAuth(user) {
  const em = String(user?.email || "").trim().toLowerCase();
  const uid = user?.id;
  if (!em || !uid) return;

  await sb.from("profiles").update({ user_id: uid }).is("user_id", null).eq("email", em);
}

// พยายามดึงโปรไฟล์ด้วย user_id ก่อน ถ้าไม่เจอให้หาด้วย email แล้วผูก user_id ให้เลย
async function getAndLinkProfile(user) {
  const em = String(user?.email || "").trim().toLowerCase();
  const uid = user?.id;
  if (!em || !uid) return { prof: null, linked: false };

  // 1) หาแบบ user_id ก่อน
  let { data: prof } = await sb.from("profiles").select("user_id, email, full_name, role").eq("user_id", uid).maybeSingle();
  if (prof) return { prof, linked: true };

  // 2) หาแบบ email
  const emailQ = await sb.from("profiles").select("user_id, email, full_name, role").eq("email", em).maybeSingle();
  prof = emailQ.data || null;

  // 3) ถ้ามีแต่ยังไม่ผูก user_id → ผูกให้
  if (prof && !prof.user_id) {
    await sb.from("profiles").update({ user_id: uid }).is("user_id", null).eq("email", em);
    const again = await sb.from("profiles").select("user_id, email, full_name, role").eq("user_id", uid).maybeSingle();
    if (again.data) return { prof: again.data, linked: true };
  }
  return { prof, linked: false };
}

/* ========= Section switching ========= */
function showSection(name) {
  const main = document.querySelector("main.admin");

  const showCoursesShell = () => {
    $("#grid-courses").hidden = false;
    $("#pubs").hidden = true;
  };

  if (name === "courses") {
    showCoursesShell();
    $("#course-detail").hidden = true;
    main?.classList.remove("detail-mode");
  } else if (name === "detail") {
    showCoursesShell();
    $("#course-detail").hidden = false;
    main?.classList.add("detail-mode");
  } else if (name === "pubs") {
    $("#grid-courses").hidden = true;
    $("#course-detail").hidden = true;
    $("#pubs").hidden = false;
    main?.classList.remove("detail-mode");
  } else {
    // กรณีปุ่ม/ค่าไม่รู้จัก (เช่น ปุ่ม "สิทธิ์ผู้ใช้" เดิม) → กลับไปหน้า รายวิชา
    showCoursesShell();
    $("#course-detail").hidden = true;
    main?.classList.remove("detail-mode");
  }
}

/* ========= Courses grid ========= */
let _allCourses = [];
async function loadCourses(ownerId) {
  const grid = $("#grid-courses");
  grid.innerHTML = '<div class="card">กำลังโหลดรายวิชา...</div>';

  const me = window._me;
  let rows = [];
  if (me?.role === "admin") {
    const { data, error } = await sb
      .from("courses")
      .select("id, code, title_th, title_en, section, term, year, semester_label")
      .order("created_at", { ascending: false });
    if (error) {
      grid.innerHTML = `<div class="card" style="color:#b91c1c">โหลดไม่สำเร็จ: ${error.message}</div>`;
      return;
    }
    rows = data || [];
  } else {
    const { data, error } = await sb
      .from("courses")
      .select("id, code, title_th, title_en, section, term, year, semester_label")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });
    if (error) {
      grid.innerHTML = `<div class="card" style="color:#b91c1c">โหลดไม่สำเร็จ: ${error.message}</div>`;
      return;
    }
    rows = data || [];
  }

  _allCourses = rows;
  renderCourseGrid(rows);
}

function renderCourseGrid(items) {
  const grid = $("#grid-courses");
  if (!items.length) {
    grid.innerHTML = '<div class="card muted">ยังไม่มีรายวิชาที่ดูแล</div>';
    return;
  }
  grid.innerHTML = items
    .map(
      (c) => `
    <article class="course" data-id="${c.id}">
      <div class="course-head">
        <div class="code">${esc(c.code)}</div>
        <div class="meta muted">${esc(c.semester_label || (c.term && c.year ? `${c.term}/${c.year}` : "—"))}• Sec ${esc(
        c.section || "-"
      )}</div>
      </div>
      <div class="title">${esc(c.title_th || c.title_en || "")}</div>
      <div class="actions">
        <button class="btn btn--sm" data-act="grading">📊 เกรด</button>
        <button class="btn btn--sm btn--outline" data-act="roster">รายชื่อ</button>
        <button class="btn btn--sm btn--outline" data-act="scores">คะแนน</button>
      </div>
    </article>
  `
    )
    .join("");

  grid.addEventListener(
    "click",
    (grid._h ||= (ev) => {
      const btn = ev.target.closest("button[data-act]");
      if (!btn) return;
      const card = btn.closest(".course");
      const id = card?.dataset.id;
      if (!id) return;
      const act = btn.dataset.act;
      if (act === "grading") openGradeSettings(id);          // ← เปลี่ยนให้เปิดเกณฑ์ตัดเกรด
      else openCourseDetail(id, act); // roster / scores
    })
  );
}

function filterCourses() {
  const q = ($("#q")?.value || "").trim().toLowerCase();
  if (!q) return renderCourseGrid(_allCourses);
  const filtered = _allCourses.filter((c) =>
    `${c.code} ${c.title_th || ""} ${c.title_en || ""} ${c.section || ""} ${c.semester_label || ""} ${c.term || ""}/${c.year || ""
      }`
      .toLowerCase()
      .includes(q)
  );
  renderCourseGrid(filtered);
}

function parseSemLabel(sem) {
  const m = String(sem || "").match(/^\s*(\d{1,2})\s*\/\s*(\d{4})\s*$/);
  return m ? { term: Number(m[1]), year: Number(m[2]) } : { term: null, year: null };
}

function rulesToInputs(rules) {
  const r = rules || {};
  return {
    A: r["A"] ?? 80,
    "B+": r["B+"] ?? 75,
    B: r["B"] ?? 70,
    "C+": r["C+"] ?? 65,
    C: r["C"] ?? 60,
    "D+": r["D+"] ?? 55,
    D: r["D"] ?? 50,
    F: r["F"] ?? 0,
  };
}

function inputsToRules(form) {
  const keys = ["A", "B+", "B", "C+", "C", "D+", "D", "F"];
  const out = {};
  for (const k of keys) out[k] = Number(form[`gr_${k}`].value) || 0;
  return out;
}

/* ========= Grade Settings (ONLY) ========= */
async function openGradeSettings(courseId) {
  const { data: c, error } = await sb
    .from("courses")
    .select("id, code, title_th, title_en, section, term, year, semester_label, grade_rules, grade_published")
    .eq("id", courseId)
    .maybeSingle();
  if (error || !c) {
    alert("โหลดรายวิชาไม่สำเร็จ");
    return;
  }

  const semLabel = c.semester_label || (c.term && c.year ? `${c.term}/${c.year}` : "");
  const R = rulesToInputs(c.grade_rules);

  const mid = "modal-grade-settings";
  document.getElementById(mid)?.remove();
  document.body.insertAdjacentHTML(
    "beforeend",
    `
  <div class="modal" id="${mid}" role="dialog" aria-modal="true">
    <div class="modal__backdrop" data-close></div>
    <div class="modal__panel" role="document">
      <header class="modal__head">
        <h3>เกณฑ์ตัดเกรด</h3>
        <button class="modal__close" data-close aria-label="ปิด">×</button>
      </header>

      <form id="form-grade-settings" class="stack">
        <div class="muted" style="margin-top:-4px">
          ${esc(c.code)} • ${esc(c.title_th || c.title_en || "")} • Sec ${esc(c.section || "-")} • ${esc(semLabel || "—")}
        </div>

        <fieldset class="stack">
          <legend><b>คะแนนขั้นต่ำของแต่ละเกรด</b></legend>
          <div class="row wrap" style="gap:.5rem">
            ${["A", "B+", "B", "C+", "C", "D+", "D", "F"]
      .map(
        (k) => `
              <label class="w-100">${k}
                <input class="input" type="number" step="1" min="0" max="100" name="gr_${k}" value="${R[k]}">
              </label>
            `
      )
      .join("")}
          </div>
        </fieldset>

        <label class="row" style="align-items:center; gap:.5rem">
          <input type="checkbox" name="published" ${c.grade_published ? "checked" : ""}>
          เผยแพร่เกรดให้ผู้เรียนเห็น
        </label>

        <footer class="row" style="justify-content:flex-end; gap:.5rem">
          <button type="button" class="btn btn--outline" data-close>ยกเลิก</button>
          <button type="submit" class="btn">บันทึก</button>
        </footer>
      </form>
    </div>
  </div>`
  );

  const modal = document.getElementById(mid);
  modal.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => modal.remove()));
  modal.addEventListener("keydown", (e) => { if (e.key === "Escape") modal.remove(); });

  document.getElementById("form-grade-settings").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;

    const grade_rules = inputsToRules(f);
    const grade_published = !!f.querySelector('input[name="published"]').checked;

    const payload = { grade_rules, grade_published };

    const { data, error: updErr } = await sb.from("courses").update(payload).eq("id", courseId).select().single();
    if (updErr) {
      alert("บันทึกไม่สำเร็จ: " + updErr.message);
      return;
    }

    // อัปเดตกริด (ข้อมูลโชว์บางส่วน เช่น เผยแพร่ ไม่แสดง แต่เผื่ออนาคต)
    _allCourses = _allCourses.map((x) => (x.id === courseId ? { ...x, ...data } : x));
    renderCourseGrid(_allCourses);

    alert("บันทึกแล้ว");
    modal.remove();
  });
}

/* ========= Create course ========= */
async function createCourse(ownerId) {
  const mid = "modal-new-course";
  document.getElementById(mid)?.remove();
  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <div class="modal" id="${mid}" role="dialog" aria-modal="true">
      <div class="modal__backdrop" data-close></div>
      <div class="modal__panel" role="document">
        <header class="modal__head">
          <h3>เพิ่มรายวิชา</h3>
          <button class="modal__close" data-close aria-label="ปิด">×</button>
        </header>
        <form id="form-new-course" class="stack">
          <label>รหัสวิชา* <input class="input" name="code" required placeholder="STAT101"></label>
          <label>ชื่อวิชา (TH/EN อย่างใดอย่างหนึ่ง)
            <input class="input" name="title" placeholder="Introduction to Statistics">
          </label>
          <div class="row wrap" style="gap:.75rem">
            <label class="w-220">Sec.
              <input class="input" name="section" type="text" placeholder="1">
            </label>
            <label class="w-220">ภาคการศึกษา
              <input class="input" name="semester" type="text" placeholder="1/2025">
            </label>
          </div>
          <footer class="row" style="justify-content:flex-end; gap:.5rem; margin-top:12px">
            <button type="button" class="btn btn--outline" data-close>ยกเลิก</button>
            <button type="submit" class="btn">บันทึก</button>
          </footer>
        </form>
      </div>
    </div>
  `
  );

  const modal = document.getElementById(mid);
  modal.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => modal.remove()));
  modal.addEventListener("keydown", (e) => {
    if (e.key === "Escape") modal.remove();
  });

  document.getElementById("form-new-course").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const code = String(fd.get("code") || "").trim();
    const title = String(fd.get("title") || "").trim();
    const section = String(fd.get("section") || "").trim() || null;
    const semRaw = String(fd.get("semester") || "").trim();

    if (!code) {
      alert("ต้องกรอกรหัสวิชา");
      return;
    }

    let term = null,
      year = null;
    if (semRaw) {
      const m = semRaw.match(/^\s*(\d{1,2})\s*\/\s*(\d{4})\s*$/);
      if (!m) {
        alert("รูปแบบภาคการศึกษาควรเป็น 1/2025");
        return;
      }
      term = Number(m[1]);
      year = Number(m[2]);
    }

    const payload = { code, title_th: title || null, section, term, year, owner_id: ownerId };
    const { data, error } = await sb.from("courses").insert(payload).select().single();
    if (error) {
      alert("เพิ่มรายวิชาไม่สำเร็จ: " + error.message);
      return;
    }

    alert("เพิ่มรายวิชาแล้ว");
    _allCourses = [data, ..._allCourses];
    renderCourseGrid(_allCourses);
    modal.remove();
  });

  modal.querySelector('input[name="code"]').focus();
}

/* ========= Course detail ========= */
async function openCourseDetail(courseId, focusTab = 'detail') {
  const box = $('#course-detail');
  box.hidden = false;
  const main = document.querySelector('main.admin');
  main?.classList.add('detail-mode');
  document.getElementById('course-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  showSection('detail');

  const { data: c, error } = await sb.from('courses')
    .select('id, code, title_th, title_en, section, term, year, semester_label')
    .eq('id', courseId).maybeSingle();

  if (error || !c) {
    box.innerHTML = `<div class="card" style="color:#b91c1c">ไม่พบรายวิชา/โหลดไม่ได้</div>`;
    return;
  }

  box.innerHTML = `
    <header class="detail-head">
      <h3 id="detail-title">${esc(c.code)} — ${esc(c.title_th || c.title_en || '')}</h3>
      <div class="row">
        <label class="file">
          <input type="file" id="file-import" accept=".csv,.xlsx,.xls" />
          <span>นำเข้า Excel/CSV</span>
        </label>
        <button class="btn btn--outline" id="btn-detail-refresh">รีเฟรช</button>
        <button class="btn btn--danger" id="btn-delete-course">ลบรายวิชา</button>
      </div>
    </header>

    <nav class="tabs" role="tablist">
      <button class="tab is-active" data-tab="roster">รายชื่อ</button>
      <button class="tab" data-tab="scores">คะแนน</button>
      <button class="tab" data-tab="assess">องค์ประกอบคะแนน</button>
      <button class="tab" data-tab="ann">ประกาศ</button>
    </nav>

    <div class="tabpanels">
      <!-- รายชื่อ -->
      <div class="tabpanel" data-panel="roster">
        <div class="row" style="gap:.5rem;margin:.25rem 0 8px">
          <input class="input" id="roster-q" placeholder="ค้นหา ชื่อ/อีเมล/รหัส" style="max-width:320px">
          <span class="muted" id="roster-count"></span>
          <span style="flex:1"></span>
          <button class="btn btn--outline" id="btn-roster-edit">แก้ไขหลายรายการ</button>
          <button class="btn" id="btn-roster-save" hidden>บันทึกทั้งหมด</button>
          <button class="btn btn--outline" id="btn-roster-cancel" hidden>ยกเลิก</button>
        </div>
        <div class="table-wrap"><table>
          <thead>
            <tr>
              <th class="right" style="width:72px">ลำดับ</th>
              <th align="left">ชื่อ</th>
              <th align="left">นามสกุล</th>
              <th align="left">อีเมล</th>
              <th>รหัสนักศึกษา</th>
              <th>ชั้นปี</th>
              <th align="left">สาขา/major</th>
              <th class="right"></th>
            </tr>
          </thead>
          <tbody id="tbody-roster"><tr><td colspan="8" class="muted">กำลังโหลด...</td></tr></tbody>
        </table></div>
        <div class="row mt-8">
          <button class="btn" id="btn-add-blank-student">เพิ่มรายชื่อ</button>
        </div>
      </div>

      <!-- คะแนน -->
      <div class="tabpanel" data-panel="scores" hidden>
        <div class="table-wrap"><table>
          <thead id="thead-scores"></thead>
          <tbody id="tbody-scores"><tr><td class="muted">ยังไม่โหลด</td></tr></tbody>
        </table></div>
      </div>

      <!-- องค์ประกอบคะแนน -->
      <div class="tabpanel" data-panel="assess" hidden>
        <div class="table-wrap"><table>
          <thead><tr><th align="left">ชื่อรายการ</th><th class="right">สัดส่วน (%)</th><th class="right">เต็ม</th><th class="right"></th></tr></thead>
          <tbody id="tbody-assess"><tr><td colspan="4" class="muted">ยังไม่โหลด</td></tr></tbody>
        </table></div>
      </div>

      <!-- ประกาศ -->
      <div class="tabpanel" data-panel="ann" hidden>
        <div id="list-ann" class="stack"><div class="muted">ยังไม่โหลด</div></div>
        <div class="row mt-8"><button class="btn" id="btn-new-ann">เพิ่มประกาศ</button></div>
      </div>
    </div>
  `;

  const fileEl = $('#file-import', box);
  if (fileEl) {
    fileEl.value = '';
    fileEl.addEventListener('change', (ev) => importRosterCSV(ev, courseId, box));
  }

  const tabs = $$('.tabs .tab', box);
  tabs.forEach(t => t.addEventListener('click', () => switchTab(box, t.dataset.tab, courseId)));

  const addBtn = $('#btn-add-blank-student', box);
  if (addBtn) {
    addBtn.textContent = 'เพิ่มรายชื่อ';
    addBtn.onclick = () => openAddStudentModal(courseId, box);
  }

  $('#btn-detail-refresh', box)?.addEventListener('click', () => {
    const active = $('.tabs .tab.is-active', box)?.dataset.tab || 'roster';
    switchTab(box, active, courseId);
  });
  $('#btn-delete-course', box)?.addEventListener('click', async () => {
    if (!confirm('ลบรายวิชานี้?')) return;
    const { error } = await sb.from('courses').delete().eq('id', courseId);
    if (error) return alert('ลบไม่สำเร็จ: ' + error.message);
    alert('ลบแล้ว');
    box.hidden = true;
    _allCourses = _allCourses.filter(x => x.id !== courseId);
    renderCourseGrid(_allCourses);
  });

  $('#btn-roster-edit', box)?.addEventListener('click', () => { box._rosterEditMode = true; toggleRosterEditButtons(box, true); renderRosterPage(box, box._rosterPage || 1); });
  $('#btn-roster-cancel', box)?.addEventListener('click', () => { box._rosterEditMode = false; box._rosterEdits = {}; toggleRosterEditButtons(box, false); renderRosterPage(box, box._rosterPage || 1); });
  $('#btn-roster-save', box)?.addEventListener('click', () => saveRosterEdits(courseId, box));

  const startTab = (focusTab === 'roster' || focusTab === 'scores' || focusTab === 'assess' || focusTab === 'ann') ? focusTab : 'roster';
  switchTab(box, startTab, courseId);
}

// แยก 1 บรรทัดของ CSV (รองรับ " และ "")
function parseCSVLine(line) {
  const out = [];
  let cur = "",
    q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else q = false;
      } else cur += ch;
    } else {
      if (ch === '"') q = true;
      else if (ch === ",") {
        out.push(cur);
        cur = "";
      } else cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function switchTab(container, tabName, courseId) {
  $$(".tabs .tab", container).forEach((b) => b.classList.toggle("is-active", b.dataset.tab === tabName));
  $$(".tabpanel", container).forEach((p) => (p.hidden = p.dataset.panel !== tabName));
  if (tabName === "roster") loadRoster(courseId, container);
  else if (tabName === "scores") loadScores(courseId, container);
  else if (tabName === "assess") loadAssess(courseId, container);
  else if (tabName === "ann") {
    const panel = $('.tabpanel[data-panel="ann"]', container);
    if (panel) window.Announcements.mount(panel, courseId);
  }
}

/* ========= Roster ========= */
async function loadRoster(courseId, el) {
  const tbody = $('#tbody-roster', el);
  tbody.innerHTML = `<tr><td colspan="8" class="muted">กำลังโหลด...</td></tr>`;

  const { data: enrolls, error: e1 } = await sb.from('enrollments')
    .select('student_id, course_id')
    .eq('course_id', courseId)
    .order('student_id', { ascending: true });

  if (e1) { tbody.innerHTML = `<tr><td colspan="8" class="muted">โหลดไม่สำเร็จ: ${esc(e1.message)}</td></tr>`; return; }
  if (!enrolls?.length) { tbody.innerHTML = `<tr><td colspan="8" class="muted">ยังไม่มีรายชื่อ</td></tr>`; renderRosterPager(el, 0, 0, 0); return; }

  const ids = [...new Set(enrolls.map(r => r.student_id))];
  const { data: students, error: e2 } = await sb.from('students')
    .select('id, first_name, last_name, email, kku_email, student_no, year_level, major')
    .in('id', ids);

  if (e2) { tbody.innerHTML = `<tr><td colspan="8" class="muted">โหลดนักศึกษาไม่สำเร็จ: ${esc(e2.message)}</td></tr>`; renderRosterPager(el, 0, 0, 0); return; }

  const byId = Object.fromEntries((students || []).map(s => [String(s.id), s]));
  const rows = enrolls.map(r => {
    const s = byId[String(r.student_id)] || {};
    return {
      student_id: r.student_id,
      course_id: r.course_id,
      first_name: s.first_name || '',
      last_name: s.last_name || '',
      email: s.email || s.kku_email || '',
      student_no: s.student_no || '',
      year_level: s.year_level ?? null,
      major: s.major || '',
    };
  });

  el._rosterRows = rows;
  el._rosterQuery = '';
  const q = $('#roster-q', el);
  q?.removeEventListener('input', el._rosterSearchH);
  q?.addEventListener('input', (el._rosterSearchH = () => {
    el._rosterQuery = q.value.trim().toLowerCase();
    renderRosterPage(el, 1);
  }));

  el._rosterEditMode = el._rosterEditMode || false;
  el._rosterEdits = el._rosterEdits || {};
  toggleRosterEditButtons(el, el._rosterEditMode);

  renderRosterPage(el, 1);
}

async function importRosterCSV(ev, courseId, containerEl) {
  const file = ev.target.files?.[0];
  ev.target.value = "";
  if (!file) return;

  const name = file.name.toLowerCase();
  if (!name.endsWith(".csv")) {
    alert('กรุณาอัปโหลดไฟล์ CSV (UTF-8). ไฟล์ .xlsx ยังไม่รองรับในหน้านี้');
    return;
  }

  let text = await file.text();
  const lines = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  if (!lines.length) { alert('ไฟล์ว่าง'); return; }

  const header = parseCSVLine(lines.shift()).map(h => h.trim().toLowerCase());
  const idxEmail = header.findIndex(h => ["email", "kku_email"].includes(h));
  const idxFirst = header.findIndex(h => ["first_name", "ชื่อ"].includes(h));
  const idxLast = header.findIndex(h => ["last_name", "นามสกุล"].includes(h));
  const idxCode = header.findIndex(h => ["student_no", "student_code", "std_code", "studentid", "รหัส", "รหัสนักศึกษา"].includes(h));
  const idxYear = header.findIndex(h => ["year_level", "ชั้นปี", "year"].includes(h));
  const idxMajor = header.findIndex(h => ["major", "สาขา", "สาขาวิชา"].includes(h));

  if (idxEmail < 0) { alert('ไฟล์ต้องมีคอลัมน์ "email"'); return; }

  let ok = 0, skip = 0, fail = 0;

  for (const ln of lines) {
    const cols = parseCSVLine(ln);
    if (!cols.length) { skip++; continue; }

    const email = (cols[idxEmail] || "").trim().toLowerCase();
    if (!email) { skip++; continue; }

    const student = {
      email,
      first_name: idxFirst >= 0 ? (cols[idxFirst] || "").trim() : "",
      last_name: idxLast >= 0 ? (cols[idxLast] || "").trim() : "",
      student_no: idxCode >= 0 ? (cols[idxCode] || "").trim() : "",
      year_level: idxYear >= 0 ? (cols[idxYear] || "").trim() : "",
      major: idxMajor >= 0 ? (cols[idxMajor] || "").trim() : "",
    };

    try {
      const done = await upsertStudentAndEnroll(student, courseId);
      if (done) ok++; else fail++;
    } catch {
      fail++;
    }
  }

  await loadRoster(courseId, containerEl);
  alert(`นำเข้าสำเร็จ: ${ok} แถว • ข้าม: ${skip} • ผิดพลาด: ${fail}`);
}

function renderRosterPage(el, page = 1) {
  const all = el._rosterRows || [];
  const q = (el._rosterQuery || '').toLowerCase();
  const rows = q
    ? all.filter(r => `${r.first_name} ${r.last_name} ${r.email} ${r.student_no} ${r.major} ${r.year_level ?? ''}`.toLowerCase().includes(q))
    : all;

  const total = rows.length;
  const pageSize = ROSTER_PAGE_SIZE;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  page = Math.min(Math.max(1, page), pages);
  el._rosterPage = page;

  const cnt = $('#roster-count', el);
  if (cnt) cnt.textContent = total ? `ทั้งหมด ${total} คน` : '';

  const tbody = $('#tbody-roster', el);
  const start = (page - 1) * pageSize;
  const slice = rows.slice(start, start + pageSize);

  const editMode = !!el._rosterEditMode;
  const edits = el._rosterEdits || {};

  tbody.innerHTML = slice.map((r, i) => {
    const sid = r.student_id;
    const cur = edits[sid] ? { ...r, ...edits[sid] } : r;

    if (!editMode) {
      return `
        <tr data-sid="${sid}" data-cid="${r.course_id}">
          <td class="right muted">${start + i + 1}</td>
          <td>${esc(cur.first_name)}</td>
          <td>${esc(cur.last_name)}</td>
          <td>${esc(cur.email)}</td>
          <td><code>${esc(cur.student_no || '—')}</code></td>
          <td>${cur.year_level ?? '—'}</td>
          <td>${esc(cur.major || '—')}</td>
          <td class="right">
            <button class="btn btn--outline btn--sm" data-act="del">ลบ</button>
          </td>
        </tr>
      `;
    }

    return `
      <tr data-sid="${sid}" data-cid="${r.course_id}">
        <td class="right muted">${start + i + 1}</td>
        <td><input class="input input--sm" data-field="first_name" value="${esc(cur.first_name)}" /></td>
        <td><input class="input input--sm" data-field="last_name"  value="${esc(cur.last_name)}" /></td>
        <td><input class="input input--sm" data-field="email"      value="${esc(cur.email)}" /></td>
        <td><input class="input input--sm" data-field="student_no" value="${esc(cur.student_no)}" /></td>
        <td><input class="input input--sm" data-field="year_level" type="number" min="1" max="10" value="${cur.year_level ?? ''}" /></td>
        <td><input class="input input--sm" data-field="major"      value="${esc(cur.major || '')}" /></td>
        <td class="right"><span class="muted">แก้ไข</span></td>
      </tr>
    `;
  }).join('') || `<tr><td colspan="8" class="muted">ไม่พบข้อมูล</td></tr>`;

  tbody.removeEventListener('click', tbody._clickH);
  if (!editMode) {
    tbody.addEventListener('click', (tbody._clickH = async (ev) => {
      const btn = ev.target.closest('button[data-act="del"]'); if (!btn) return;
      const tr = btn.closest('tr');
      const sid = Number(tr?.dataset.sid);
      const cid = Number(tr?.dataset.cid);
      if (!sid || !cid) return;
      openDeleteStudentModal(sid, cid, el);
    }));
  }

  tbody.removeEventListener('input', tbody._inputH);
  if (editMode) {
    tbody.addEventListener('input', (tbody._inputH = (ev) => {
      const inp = ev.target.closest('input[data-field]'); if (!inp) return;
      const tr = inp.closest('tr');
      const sid = Number(tr?.dataset.sid);
      const field = inp.dataset.field;
      const val = inp.value;
      const cur = el._rosterEdits[sid] || { id: sid };
      cur[field] = val;
      el._rosterEdits[sid] = cur;
    }));
  }

  renderRosterPager(el, page, pages, total);
}

function renderRosterPager(el, page, pages, total) {
  const panel = $('.tabpanel[data-panel="roster"]', el);
  let pager = $("#roster-pager", panel);
  if (!pager) {
    pager = document.createElement("div");
    pager.id = "roster-pager";
    pager.className = "row mt-8";
    panel.appendChild(pager);
    pager.addEventListener("click", (ev) => {
      const b = ev.target.closest("button[data-pg]");
      if (!b) return;
      const cur = el._rosterPage || 1;
      if (b.dataset.pg === "prev") renderRosterPage(el, cur - 1);
      if (b.dataset.pg === "next") renderRosterPage(el, cur + 1);
    });
  }
  pager.innerHTML = !pages || pages <= 1 ? "" : `
    <div class="row" style="gap:.5rem">
      <button class="btn btn--outline" data-pg="prev" ${page <= 1 ? "disabled" : ""}>ก่อนหน้า</button>
      <span class="muted">หน้า ${page} / ${pages} • ทั้งหมด ${total} คน</span>
      <button class="btn btn--outline" data-pg="next" ${page >= pages ? "disabled" : ""}>ถัดไป</button>
    </div>
  `;
}

function openAddStudentModal(courseId, containerEl) {
  closeModal('modal-add-student');

  const html = `
  <div class="modal" id="modal-add-student" role="dialog" aria-modal="true">
    <div class="modal__backdrop" data-close></div>
    <div class="modal__panel" role="document">
      <header class="modal__head">
        <h3>เพิ่มรายชื่อนักศึกษา</h3>
        <button class="modal__close" data-close aria-label="ปิด">×</button>
      </header>

      <form id="form-add-student" class="stack">
        <label>อีเมล* (ต้องไม่ว่าง)
          <input class="input" name="email" type="email" required placeholder="student@kkumail.com">
        </label>

        <div class="row wrap" style="gap:.75rem">
          <label class="w-260">ชื่อจริง
            <input class="input" name="first_name" type="text">
          </label>
          <label class="w-260">นามสกุล
            <input class="input" name="last_name" type="text">
          </label>
        </div>

        <label>รหัสนักศึกษา
          <input class="input" name="student_no" type="text" placeholder="66xxxxxxxx">
        </label>

        <div class="row wrap" style="gap:.75rem">
          <label class="w-160">ชั้นปี
            <input class="input" name="year_level" type="number" min="1" max="10" placeholder="1-8">
          </label>
          <label class="w-260">สาขา/major
            <input class="input" name="major" type="text" placeholder="เช่น สถิติประยุกต์">
          </label>
        </div>

        <footer class="row" style="justify-content:flex-end; gap:.5rem; margin-top:12px">
          <button type="button" class="btn btn--outline" data-close>ยกเลิก</button>
          <button type="submit" class="btn">บันทึก</button>
        </footer>
      </form>
    </div>
  </div>`;

  document.body.insertAdjacentHTML('beforeend', html);

  const modal = document.getElementById('modal-add-student');
  modal.querySelectorAll('[data-close]').forEach(b =>
    b.addEventListener('click', () => closeModal('modal-add-student'))
  );
  modal.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal('modal-add-student'); });

  const form = document.getElementById('form-add-student');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const student = {
      email: (fd.get('email') || '').trim(),
      first_name: (fd.get('first_name') || '').trim(),
      last_name: (fd.get('last_name') || '').trim(),
      student_no: (fd.get('student_no') || '').trim(),
      year_level: (fd.get('year_level') || '').toString().trim(),
      major: (fd.get('major') || '').trim(),
    };
    if (!student.email) { alert('ต้องกรอกอีเมล'); return; }

    const ok = await upsertStudentAndEnroll(student, courseId);
    if (!ok) return;

    closeModal('modal-add-student');
    await loadRoster(courseId, containerEl);
  });

  modal.querySelector('input[name="email"]').focus();
}

function openDeleteStudentModal(sid, cid, el) {
  closeModal("modal-del-student");

  const html = `
  <div class="modal" id="modal-del-student" role="dialog" aria-modal="true">
    <div class="modal__backdrop" data-close></div>
    <div class="modal__panel" role="document">
      <header class="modal__head">
        <h3>ลบนักศึกษา</h3>
        <button class="modal__close" data-close aria-label="ปิด">×</button>
      </header>

      <div class="stack">
        <p>คุณต้องการทำอะไรกับนักศึกษาคนนี้?</p>
        <ol class="muted" style="margin:0 0 8px 1.25rem">
          <li>ลบเฉพาะวิชานี้ — เอาออกจากรายวิชานี้เท่านั้น</li>
          <li>ลบทั้งหมด — ลบข้อมูลนักศึกษาคนนี้ออกจากระบบ (รวมถึงรายวิชา/คะแนนที่เกี่ยวข้อง)</li>
        </ol>

        <footer class="row" style="justify-content:flex-end; gap:.5rem">
          <button class="btn btn--outline" data-act="course"> ลบเฉพาะวิชานี้</button>
          <button class="btn btn--danger"  data-act="all"> ลบทั้งหมด</button>
          <button class="btn" data-close> ยกเลิก</button>
        </footer>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML("beforeend", html);

  const modal = document.getElementById("modal-del-student");
  modal.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => closeModal("modal-del-student")));
  modal.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal("modal-del-student");
  });

  modal.querySelector(".modal__panel").addEventListener("click", async (ev) => {
    const btn = ev.target.closest("button[data-act]");
    if (!btn) return;
    btn.disabled = true;
    try {
      if (btn.dataset.act === "course") {
        const { error } = await sb.from("enrollments").delete().match({ student_id: sid, course_id: cid });
        if (error) throw error;
        el._rosterRows = (el._rosterRows || []).filter((x) => !(x.student_id === sid && x.course_id === cid));
      } else if (btn.dataset.act === "all") {
        const { error } = await sb.from("students").delete().eq("id", sid);
        if (error) throw error;
        el._rosterRows = (el._rosterRows || []).filter((x) => x.student_id !== sid);
      } else {
        closeModal("modal-del-student");
        return;
      }
      closeModal("modal-del-student");
      renderRosterPage(el, el._rosterPage || 1);
    } catch (err) {
      btn.disabled = false;
      alert("ลบไม่สำเร็จ: " + (err?.message || err));
    }
  });
}

async function upsertStudentAndEnroll(student, courseId) {
  try {
    const email = String(student.email || '').trim().toLowerCase();
    if (!email) { alert('ต้องกรอกอีเมล'); return false; }

    const yearLevelRaw = student.year_level;
    const year_level = (yearLevelRaw === undefined || String(yearLevelRaw).trim() === '') ? null : Number(yearLevelRaw);

    const payload = {
      email,
      kku_email: email,
      first_name: student.first_name?.trim() || '',
      last_name: student.last_name?.trim() || '',
      student_no: student.student_no?.trim() || '',
      year_level,
      major: (student.major?.trim() || '') || null
    };

    let stuId = null;
    let ins = await sb.from('students').insert(payload).select('id').single();

    if (ins.error) {
      if (ins.error.code === '23505') {
        const found = await sb.from('students').select('id').eq('email', email).maybeSingle();
        if (!found.data) { alert('หาแถวเดิมไม่พบ'); return false; }
        stuId = found.data.id;

        const upd = await sb.from('students').update({
          first_name: payload.first_name,
          last_name: payload.last_name,
          student_no: payload.student_no,
          kku_email: payload.kku_email,
          year_level: payload.year_level,
          major: payload.major
        }).eq('id', stuId);
        if (upd.error) { alert('อัปเดตนักศึกษาไม่สำเร็จ: ' + upd.error.message); return false; }
      } else {
        alert('เพิ่มนักศึกษาไม่สำเร็จ: ' + ins.error.message);
        return false;
      }
    } else {
      stuId = ins.data.id;
    }

    const cr = await sb.from('courses').select('owner_id').eq('id', courseId).single();
    if (cr.error || !cr.data) { alert('โหลด owner_id ของรายวิชาไม่สำเร็จ'); return false; }

    const existed = await sb.from('enrollments')
      .select('student_id')
      .match({ student_id: stuId, course_id: courseId })
      .maybeSingle();
    if (existed.error) { alert('ตรวจสอบรายชื่อไม่สำเร็จ: ' + existed.error.message); return false; }

    if (!existed.data) {
      const insEnr = await sb.from('enrollments').insert({
        student_id: stuId,
        course_id: courseId,
        owner_id: cr.data.owner_id ?? null
      });
      if (insEnr.error && insEnr.error.code !== '23505') {
        alert('เพิ่มรายชื่อเข้าวิชาไม่สำเร็จ: ' + insEnr.error.message);
        return false;
      }
    }

    alert('เพิ่มรายชื่อเรียบร้อย');
    return true;
  } catch (err) {
    alert('ผิดพลาด: ' + (err?.message || err));
    return false;
  }
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.remove();
}

/* ========= Save multi-edits ========= */
function toggleRosterEditButtons(el, editing) {
  const panel = $('.tabpanel[data-panel="roster"]', el);
  $("#btn-roster-edit", panel).hidden = !!editing;
  $("#btn-roster-save", panel).hidden = !editing;
  $("#btn-roster-cancel", panel).hidden = !editing;
}

async function saveRosterEdits(courseId, el) {
  const editsMap = el._rosterEdits || {};
  const ids = Object.keys(editsMap).map(n => Number(n)).filter(Boolean);

  if (!ids.length) {
    alert('ไม่มีการแก้ไข');
    el._rosterEditMode = false;
    toggleRosterEditButtons(el, false);
    renderRosterPage(el, el._rosterPage || 1);
    return;
  }

  const { data: existing, error: e0 } = await sb
    .from('students')
    .select('id, email')
    .in('id', ids);
  if (e0) { alert('โหลดเพื่อยืนยันแถวที่จะแก้ไขไม่สำเร็จ: ' + e0.message); return; }
  const existingSet = new Set((existing || []).map(r => String(r.id)));

  const jobs = [];
  for (const id of ids) {
    if (!existingSet.has(String(id))) continue;
    const e = editsMap[id];
    const update = {};

    if ('first_name' in e) update.first_name = e.first_name ?? '';
    if ('last_name' in e) update.last_name = e.last_name ?? '';
    if ('email' in e) update.email = (e.email ?? '').trim();
    if ('student_no' in e) update.student_no = (e.student_no ?? '').trim();

    if ('year_level' in e) {
      const v = String(e.year_level ?? '').trim();
      update.year_level = v === '' ? null : Number(v);
    }
    if ('major' in e) {
      const v = (e.major ?? '').trim();
      update.major = v === '' ? null : v;
    }

    if ('email' in e && update.email === '') {
      alert(`แถว id ${id}: อีเมลห้ามว่าง`);
      return;
    }
    if (Object.keys(update).length === 0) continue;
    jobs.push(sb.from('students').update(update).eq('id', id));
  }

  try {
    const results = await Promise.all(jobs);
    const bad = results.find(r => r.error);
    if (bad) throw bad.error;
  } catch (err) {
    alert('บันทึกไม่สำเร็จ: ' + err.message);
    return;
  }

  el._rosterRows = (el._rosterRows || []).map(r => {
    const e = editsMap[r.student_id];
    return e ? {
      ...r,
      first_name: ('first_name' in e) ? e.first_name : r.first_name,
      last_name: ('last_name' in e) ? e.last_name : r.last_name,
      email: ('email' in e) ? e.email : r.email,
      student_no: ('student_no' in e) ? e.student_no : r.student_no,
      year_level: ('year_level' in e) ? (String(e.year_level || '').trim() === '' ? null : Number(e.year_level)) : r.year_level,
      major: ('major' in e) ? e.major : r.major,
    } : r;
  });

  el._rosterEdits = {};
  el._rosterEditMode = false;
  toggleRosterEditButtons(el, false);
  alert('บันทึกแล้ว');
  renderRosterPage(el, el._rosterPage || 1);
}

/* ========= Other tabs (placeholder) ========= */
async function loadScores(courseId, el) {
  const panel = $('.tabpanel[data-panel="scores"]', el);
  if (!panel) return;
  panel.innerHTML = `<div id="scores-root"></div>`;
  window.Scores.mount($("#scores-root", panel), courseId);
}
async function loadAssess(courseId, el) {
  $("#tbody-assess", el).innerHTML = `<tr><td colspan="4" class="muted">จะเติมภายหลัง</td></tr>`;
}

/* ========= Blocker ========= */
function showBlocker(title, msg) {
  const main = document.querySelector("main.admin");
  main.innerHTML = `
    <section class="card">
      <h3 style="margin:0 0 8px">${esc(title)}</h3>
      <p class="muted">${esc(msg)}</p>
      <div class="row mt-8">
        <a class="btn btn--outline" href="portal.html">ไปหน้าเข้าสู่ระบบ</a>
      </div>
    </section>
  `;
}
