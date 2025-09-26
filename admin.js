/* ========= Supabase config ========= */
const SUPABASE_URL = "https://uyhhxexhagbcwdtoanly.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5aGh4ZXhoYWdiY3dkdG9hbmx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MzEyODksImV4cCI6MjA3MzUwNzI4OX0.p0LeCTzk5T1LKqO7IGBmtH7jKwumy_0vxc-FXKZpRz8";
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ========= Utils ========= */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const ROSTER_PAGE_SIZE = 15;

/* ========= Boot ========= */
boot();
async function boot() {
  // วันที่อัปเดต
  const ud = $('#app-updated');
  if (ud) ud.textContent = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: '2-digit' });

  // ออกระบบ
  $('#btn-signout')?.addEventListener('click', async () => {
    await sb.auth.signOut();
    location.href = 'portal.html';
  });

  // เมนูลัด
  $$('.header-actions [data-nav]').forEach(btn => {
    btn.addEventListener('click', () => showSection(btn.dataset.nav));
  });

  // ตรวจผู้ใช้ + role
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return showBlocker('ยังไม่ได้เข้าสู่ระบบ', 'กรุณาไปที่หน้า portal.html เพื่อเข้าสู่ระบบก่อน');

  //  ผูกโปรไฟล์กับบัญชี auth (ครั้งแรกที่ล็อกอิน)
  await linkProfileToAuth(user);

  const { prof, linked } = await getAndLinkProfile(user);
  if (!prof) {
    return showBlocker('ไม่ได้รับสิทธิ์เข้าถึง', `บัญชี ${user.email} ยังไม่ถูกตั้งค่าในระบบ`);
  }
  if (!['admin', 'instructor'].includes(prof.role)) {
    return showBlocker('ไม่ได้รับสิทธิ์เข้าถึง', `บัญชี ${user.email} ไม่ใช่ผู้ดูแล/อาจารย์`);
  }

  /* 👇 ใส่ตรงนี้ */
  window._me = prof; // เก็บ email / user_id ของผู้ใช้ไว้ใช้ตอนโหลดวิชาจาก ACL

  // เครื่องมือรายวิชา
  $('#btn-add-course')?.addEventListener('click', () => createCourse(prof.user_id));
  $('#btn-refresh-courses')?.addEventListener('click', () => loadCourses(prof.user_id));
  $('#q')?.addEventListener('input', () => filterCourses());

  // โหลดรายวิชา
  await loadCourses(prof.user_id);

  // ✅ เพิ่มสองบรรทัดนี้
  wireAclCourses(prof.user_id);   // เติมรายการวิชา + ผูกปุ่ม ให้สิทธิ์/ไม่สิทธิ์
  renderAclList();                // โหลดตารางสรุปสิทธิ์ครั้งแรก

  // หน้าสิทธิ์ผู้ใช้
  wireAclGlobal();
}

// สร้างหรืออัปเดตโปรไฟล์จากอีเมล (ไม่บังคับให้มี user_id)
// return: โปรไฟล์ที่บันทึกแล้ว
async function ensureProfileByEmail({ email, full_name = null, role }) {
  const em = String(email || '').trim().toLowerCase();
  if (!em) throw new Error('ต้องระบุอีเมล');

  let { data: prof, error: e1 } = await sb.from('profiles')
    .select('user_id, email, full_name, role')
    .eq('email', em).maybeSingle();
  if (e1) throw e1;

  if (prof) {
    const patch = {};
    if (full_name && full_name !== prof.full_name) patch.full_name = full_name;
    if (role != null && role !== prof.role) patch.role = role;
    if (Object.keys(patch).length) {
      const { data: upd, error: e2 } = await sb.from('profiles')
        .update(patch).eq('email', em).select().single();
      if (e2) throw e2;
      prof = upd;
    }
    return prof;
  }

  const insertRole = (role == null ? 'student' : role);
  const { data: created, error: e3 } = await sb.from('profiles')
    .insert({ email: em, full_name, role: insertRole })
    .select().single();
  if (e3) throw e3;
  return created;
}

// ผูก profiles.user_id ให้ตรงกับ auth.users.id เมื่อผู้ใช้ล็อกอินครั้งแรก
async function linkProfileToAuth(user) {
  const em = String(user?.email || '').trim().toLowerCase();
  const uid = user?.id;
  if (!em || !uid) return;

  // อัปเดตเฉพาะแถวที่ user_id ยังว่างอยู่เท่านั้น
  const { error } = await sb
    .from('profiles')
    .update({ user_id: uid })
    .is('user_id', null)
    .eq('email', em);

  // ไม่ต้อง alert ถ้า error เป็น RLS ปิดไว้ ค่อยไปดู policy ตามหมายเหตุท้ายสุด
}

// พยายามดึงโปรไฟล์ด้วย user_id ก่อน ถ้าไม่เจอให้หาด้วย email แล้วผูก user_id ให้เลย
async function getAndLinkProfile(user) {
  const em = String(user?.email || '').trim().toLowerCase();
  const uid = user?.id;
  if (!em || !uid) return { prof: null, linked: false };

  // 1) ลองหาแบบ user_id ก่อน
  let { data: prof } = await sb.from('profiles')
    .select('user_id, email, full_name, role')
    .eq('user_id', uid).maybeSingle();
  if (prof) return { prof, linked: true };

  // 2) ไม่เจอ → หาแบบ email
  const emailQ = await sb.from('profiles')
    .select('user_id, email, full_name, role')
    .eq('email', em).maybeSingle();
  prof = emailQ.data || null;

  // 3) ถ้าเจอแถวอีเมล แต่ user_id ยังว่าง → ผูกให้ (อาจล้มเหลวถ้า RLS ไม่อนุญาต)
  if (prof && !prof.user_id) {
    await sb.from('profiles')
      .update({ user_id: uid })
      .is('user_id', null)
      .eq('email', em);
    // ลองอ่านซ้ำแบบ user_id
    const again = await sb.from('profiles')
      .select('user_id, email, full_name, role')
      .eq('user_id', uid).maybeSingle();
    if (again.data) return { prof: again.data, linked: true };
  }

  // ถ้ายังไม่ได้ผูก สำรองคืนโปรไฟล์ที่หาได้จากอีเมล (ให้ระบบยังไปต่อได้)
  return { prof, linked: false };
}





/* ========= Section switching ========= */
function showSection(name) {
  const main = document.querySelector('main.admin');

  const showCoursesShell = () => {
    $('#grid-courses').hidden = false;
    $('#acl').hidden = true;
    $('#pubs').hidden = true;
  };

  if (name === 'courses') {
    showCoursesShell();
    $('#course-detail').hidden = true;
    main?.classList.remove('detail-mode');   // <— สำคัญ
  } else if (name === 'detail') {
    showCoursesShell();
    $('#course-detail').hidden = false;
    main?.classList.add('detail-mode');      // <— สำคัญ
  } else if (name === 'acl') {
    $('#grid-courses').hidden = true;
    $('#course-detail').hidden = true;
    $('#acl').hidden = false;
    $('#pubs').hidden = true;
    main?.classList.remove('detail-mode');   // <— สำคัญ
  } else if (name === 'pubs') {
    $('#grid-courses').hidden = true;
    $('#course-detail').hidden = true;
    $('#acl').hidden = true;
    $('#pubs').hidden = false;
    main?.classList.remove('detail-mode');   // <— สำคัญ
  }
}


/* ========= Courses grid ========= */
let _allCourses = [];
async function loadCourses(ownerId) {
  const grid = $('#grid-courses');
  grid.innerHTML = '<div class="card">กำลังโหลดรายวิชา...</div>';

  const meEmail = String(window._me?.email || '').toLowerCase();

  // 1) ของตัวเอง (owner)
  const ownQ = sb.from('courses')
    .select('id, code, title_th, title_en, section, term, year, semester_label')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });

  // 2) รายวิชาที่ถูกให้สิทธิ์ผ่าน course_acl ด้วยอีเมล
  const aclIdsQ = sb.from('course_acl')
    .select('course_id')
    .eq('email', meEmail);

  const [{ data: own = [], error: e1 }, { data: aclRows = [], error: e2 }] =
    await Promise.all([ownQ, aclIdsQ]);

  if (e1 || e2) {
    grid.innerHTML = `<div class="card" style="color:#b91c1c">โหลดข้อมูลไม่สำเร็จ: ${esc((e1 || e2).message)}</div>`;
    return;
  }

  const aclIds = [...new Set((aclRows || []).map(r => r.course_id))].filter(id => !!id);

  let aclCourses = [];
  if (aclIds.length) {
    const { data, error } = await sb.from('courses')
      .select('id, code, title_th, title_en, section, term, year, semester_label')
      .in('id', aclIds);
    if (error) {
      grid.innerHTML = `<div class="card" style="color:#b91c1c">โหลด ACL ไม่สำเร็จ: ${esc(error.message)}</div>`;
      return;
    }
    aclCourses = data || [];
  }

  // รวม+ตัดซ้ำ (กรณีเป็น owner เองด้วย)
  const byId = new Map();
  [...own, ...aclCourses].forEach(c => byId.set(c.id, c));
  _allCourses = Array.from(byId.values()).sort((a, b) => (b.id - a.id));

  renderCourseGrid(_allCourses);
}


function renderCourseGrid(items) {
  const grid = $('#grid-courses');
  if (!items.length) {
    grid.innerHTML = '<div class="card muted">ยังไม่มีรายวิชาที่ดูแล</div>';
    return;
  }
  grid.innerHTML = items.map(c => `
    <article class="course" data-id="${c.id}">
      <div class="course-head">
        <div class="code">${esc(c.code)}</div>
        <div class="meta muted">${esc(c.semester_label || (c.term && c.year ? `${c.term}/${c.year}` : '—'))}• Sec ${esc(c.section || '-')}</div>
      </div>
      <div class="title">${esc(c.title_th || c.title_en || '')}</div>
      <div class="actions">
        <button class="btn btn--sm" data-act="settings">จัดการ</button>
        <button class="btn btn--sm btn--outline" data-act="roster">รายชื่อ</button>
        <button class="btn btn--sm btn--outline" data-act="scores">คะแนน</button>
      </div>
    </article>
  `).join('');

  grid.addEventListener('click', grid._h || (grid._h = (ev) => {
    const btn = ev.target.closest('button[data-act]'); if (!btn) return;
    const card = btn.closest('.course'); const id = card?.dataset.id; if (!id) return;
    const act = btn.dataset.act;
    if (act === 'settings') openCourseSettings(id);
    else openCourseDetail(id, act);   // roster / scores ยังเหมือนเดิม
  }));

}

function filterCourses() {
  const q = ($('#q')?.value || '').trim().toLowerCase();
  if (!q) return renderCourseGrid(_allCourses);
  const filtered = _allCourses.filter(c =>
    `${c.code} ${c.title_th || ''} ${c.title_en || ''} ${c.section || ''} ${c.semester_label || ''} ${c.term || ''}/${c.year || ''}`.toLowerCase().includes(q)
  );
  renderCourseGrid(filtered);
}

function parseSemLabel(sem) {
  // "1/2025" -> {term:1, year:2025} หรือ {term:null, year:null}
  const m = String(sem || '').match(/^\s*(\d{1,2})\s*\/\s*(\d{4})\s*$/);
  return m ? { term: Number(m[1]), year: Number(m[2]) } : { term: null, year: null };
}

function rulesToInputs(rules) {
  const r = rules || {};
  return {
    'A': r['A'] ?? 80,
    'B+': r['B+'] ?? 75,
    'B': r['B'] ?? 70,
    'C+': r['C+'] ?? 65,
    'C': r['C'] ?? 60,
    'D+': r['D+'] ?? 55,
    'D': r['D'] ?? 50,
    'F': r['F'] ?? 0,
  };
}

function inputsToRules(form) {
  const keys = ['A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'];
  const out = {};
  for (const k of keys) out[k] = Number(form[`gr_${k}`].value) || 0;
  return out;
}

async function openCourseSettings(courseId) {
  // โหลดข้อมูลรายวิชา
  const { data: c, error } = await sb.from('courses')
    .select('id, code, title_th, title_en, section, term, year, semester_label, grade_rules, grade_published')
    .eq('id', courseId).maybeSingle();
  if (error || !c) { alert('โหลดรายวิชาไม่สำเร็จ'); return; }

  const semLabel = c.semester_label || (c.term && c.year ? `${c.term}/${c.year}` : '');
  const R = rulesToInputs(c.grade_rules);

  // ลบโมดาลเก่าและสร้างใหม่
  const mid = 'modal-course-settings';
  document.getElementById(mid)?.remove();
  document.body.insertAdjacentHTML('beforeend', `
  <div class="modal" id="${mid}" role="dialog" aria-modal="true">
    <div class="modal__backdrop" data-close></div>
    <div class="modal__panel" role="document">
      <header class="modal__head">
        <h3>ตั้งค่ารายวิชา</h3>
        <button class="modal__close" data-close aria-label="ปิด">×</button>
      </header>

      <form id="form-course-settings" class="stack">
        <fieldset class="stack">
          <legend><b>ข้อมูลทั่วไป</b></legend>
          <div class="row wrap" style="gap:.75rem">
            <label class="w-220">รหัสวิชา*
              <input class="input" name="code" required value="${esc(c.code)}">
            </label>
            <label class="w-220">Sec.
              <input class="input" name="section" value="${esc(c.section || '')}">
            </label>
            <label class="w-220">ภาคการศึกษา
              <input class="input" name="semester" placeholder="1/2025" value="${esc(semLabel)}">
            </label>
          </div>
          <label>ชื่อวิชา (TH)
            <input class="input" name="title_th" value="${esc(c.title_th || '')}">
          </label>
          <label>ชื่อวิชา (EN)
            <input class="input" name="title_en" value="${esc(c.title_en || '')}">
          </label>
        </fieldset>

        <fieldset class="stack">
          <legend><b>เกณฑ์ตัดเกรด (คะแนนขั้นต่ำแต่ละเกรด)</b></legend>
          <div class="row wrap" style="gap:.5rem">
            ${['A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'].map(k => `
              <label class="w-100">${k}
                <input class="input" type="number" step="1" min="0" max="100" name="gr_${k}" value="${R[k]}">
              </label>
            `).join('')}
          </div>
        </fieldset>

        <label class="row" style="align-items:center; gap:.5rem">
          <input type="checkbox" name="published" ${c.grade_published ? 'checked' : ''}>
          เผยแพร่เกรดให้ผู้เรียนเห็น
        </label>

        <footer class="row" style="justify-content:flex-end; gap:.5rem">
          <button type="button" class="btn btn--outline" data-close>ยกเลิก</button>
          <button type="submit" class="btn">บันทึก</button>
        </footer>
      </form>
    </div>
  </div>`);

  const modal = document.getElementById(mid);
  modal.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => modal.remove()));
  modal.addEventListener('keydown', e => { if (e.key === 'Escape') modal.remove(); });

  // บันทึก
  document.getElementById('form-course-settings').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);

    const code = String(f.get('code') || '').trim();
    const section = String(f.get('section') || '').trim() || null;
    const title_th = String(f.get('title_th') || '').trim() || null;
    const title_en = String(f.get('title_en') || '').trim() || null;
    const semRaw = String(f.get('semester') || '').trim();
    const { term, year } = parseSemLabel(semRaw);
    const grade_rules = inputsToRules(e.target);
    const grade_published = !!f.get('published');

    if (!code) { alert('ต้องกรอกรหัสวิชา'); return; }

    const payload = { code, section, title_th, title_en, term, year, grade_rules, grade_published };

    const { data, error: updErr } = await sb.from('courses').update(payload).eq('id', courseId).select().single();
    if (updErr) { alert('บันทึกไม่สำเร็จ: ' + updErr.message); return; }

    // อัปเดตการ์ดในกริดให้ทันสมัย
    _allCourses = _allCourses.map(x => x.id === courseId ? { ...x, ...data } : x);
    renderCourseGrid(_allCourses);

    alert('บันทึกแล้ว');
    modal.remove();
  });
}



/* ========= Create course ========= */
async function createCourse(ownerId) {
  const mid = 'modal-new-course';
  document.getElementById(mid)?.remove();
  document.body.insertAdjacentHTML('beforeend', `
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
  `);

  const modal = document.getElementById(mid);
  modal.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => modal.remove()));
  modal.addEventListener('keydown', (e) => { if (e.key === 'Escape') modal.remove(); });

  document.getElementById('form-new-course').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const code = String(fd.get('code') || '').trim();
    const title = String(fd.get('title') || '').trim();
    const section = String(fd.get('section') || '').trim() || null;
    const semRaw = String(fd.get('semester') || '').trim(); // เช่น "1/2025"

    if (!code) { alert('ต้องกรอกรหัสวิชา'); return; }

    // แปลง "1/2025" → term=1, year=2025, semester_label="1/2025"
    // แปลง "1/2025" → term, year
    let term = null, year = null;
    if (semRaw) {
      const m = semRaw.match(/^\s*(\d{1,2})\s*\/\s*(\d{4})\s*$/);
      if (!m) { alert('รูปแบบภาคการศึกษาควรเป็น 1/2025'); return; }
      term = Number(m[1]);
      year = Number(m[2]);
    }

    // ❌ ห้ามใส่ semester_label
    const payload = { code, title_th: title || null, section, term, year, owner_id: ownerId };

    const { data, error } = await sb.from('courses').insert(payload).select().single();
    if (error) { alert('เพิ่มรายวิชาไม่สำเร็จ: ' + error.message); return; }

    alert('เพิ่มรายวิชาแล้ว');
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
              <th class="right"></th>
            </tr>
          </thead>
          <tbody id="tbody-roster"><tr><td colspan="6" class="muted">กำลังโหลด...</td></tr></tbody>
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
  // ผูกปุ่มนำเข้า CSV หลังจาก DOM ของ detail ถูกสร้างแล้ว
  const fileEl = $('#file-import', box);
  if (fileEl) {
    fileEl.value = ''; // รีเซ็ตให้เลือกไฟล์เดิมซ้ำได้
    fileEl.addEventListener('change', (ev) => importRosterCSV(ev, courseId, box));
  }


  // tabs
  const tabs = $$('.tabs .tab', box);
  tabs.forEach(t => t.addEventListener('click', () => switchTab(box, t.dataset.tab, courseId)));

  // เปลี่ยนชื่อปุ่ม + ผูกให้เปิด modal เพิ่มรายชื่อ
  const addBtn = $('#btn-add-blank-student', box);
  if (addBtn) {
    addBtn.textContent = 'เพิ่มรายชื่อ';
    addBtn.onclick = () => openAddStudentModal(courseId, box);
  }


  // refresh / delete
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

  // โหมดแก้ไขหลายแถว
  $('#btn-roster-edit', box)?.addEventListener('click', () => { box._rosterEditMode = true; toggleRosterEditButtons(box, true); renderRosterPage(box, box._rosterPage || 1); });
  $('#btn-roster-cancel', box)?.addEventListener('click', () => { box._rosterEditMode = false; box._rosterEdits = {}; toggleRosterEditButtons(box, false); renderRosterPage(box, box._rosterPage || 1); });
  $('#btn-roster-save', box)?.addEventListener('click', () => saveRosterEdits(courseId, box));

  // เปิดแท็บเริ่มต้น
  const startTab = (focusTab === 'roster' || focusTab === 'scores' || focusTab === 'assess' || focusTab === 'ann') ? focusTab : 'roster';
  switchTab(box, startTab, courseId);
}

// แยก 1 บรรทัดของ CSV แบบรองรับเครื่องหมาย " และ "" (escape)
function parseCSVLine(line) {
  const out = [];
  let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else q = false;
      } else cur += ch;
    } else {
      if (ch === '"') q = true;
      else if (ch === ',') { out.push(cur); cur = ""; }
      else cur += ch;
    }
  }
  out.push(cur);
  return out;
}


function switchTab(container, tabName, courseId) {
  $$('.tabs .tab', container).forEach(b => b.classList.toggle('is-active', b.dataset.tab === tabName));
  $$('.tabpanel', container).forEach(p => p.hidden = (p.dataset.panel !== tabName));
  if (tabName === 'roster') loadRoster(courseId, container);
  else if (tabName === 'scores') loadScores(courseId, container);
  else if (tabName === 'assess') loadAssess(courseId, container);
  else if (tabName === 'ann') loadAnnouncements(courseId, container);
}

/* ========= Roster ========= */
async function loadRoster(courseId, el) {
  const tbody = $('#tbody-roster', el);
  tbody.innerHTML = `<tr><td colspan="6" class="muted">กำลังโหลด...</td></tr>`;

  // รายชื่อที่ลงทะเบียนในวิชานี้
  const { data: enrolls, error: e1 } = await sb.from('enrollments')
    .select('student_id, course_id')
    .eq('course_id', courseId)
    .order('student_id', { ascending: true });

  if (e1) { tbody.innerHTML = `<tr><td colspan="6" class="muted">โหลดไม่สำเร็จ: ${esc(e1.message)}</td></tr>`; return; }
  if (!enrolls?.length) { tbody.innerHTML = `<tr><td colspan="6" class="muted">ยังไม่มีรายชื่อ</td></tr>`; renderRosterPager(el, 0, 0, 0); return; }

  // ดึงข้อมูลนักศึกษาตาม id
  const ids = [...new Set(enrolls.map(r => r.student_id))];
  const { data: students, error: e2 } = await sb.from('students')
    .select('id, first_name, last_name, email, kku_email, student_no')
    .in('id', ids);

  if (e2) { tbody.innerHTML = `<tr><td colspan="6" class="muted">โหลดนักศึกษาไม่สำเร็จ: ${esc(e2.message)}</td></tr>`; renderRosterPager(el, 0, 0, 0); return; }

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
    };
  });

  // cache + search
  el._rosterRows = rows;
  el._rosterQuery = '';
  const q = $('#roster-q', el);
  q?.removeEventListener('input', el._rosterSearchH);
  q?.addEventListener('input', (el._rosterSearchH = () => {
    el._rosterQuery = q.value.trim().toLowerCase();
    renderRosterPage(el, 1);
  }));

  // สถานะแก้ไข
  el._rosterEditMode = el._rosterEditMode || false;
  el._rosterEdits = el._rosterEdits || {};
  toggleRosterEditButtons(el, el._rosterEditMode);

  renderRosterPage(el, 1);
}

async function importRosterCSV(ev, courseId, containerEl) {
  const file = ev.target.files?.[0];
  ev.target.value = ""; // เคลียร์ให้เลือกไฟล์เดิมซ้ำได้
  if (!file) return;

  const name = file.name.toLowerCase();
  if (!name.endsWith(".csv")) {
    alert('กรุณาอัปโหลดไฟล์ CSV (UTF-8). ไฟล์ .xlsx ยังไม่รองรับในหน้านี้');
    return;
  }

  let text = await file.text();
  // ตัดบรรทัดว่างหัว/ท้าย
  const lines = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  if (!lines.length) { alert('ไฟล์ว่าง'); return; }

  // header
  const header = parseCSVLine(lines.shift()).map(h => h.trim().toLowerCase());

  // map ชื่อคอลัมน์
  const idxEmail = header.findIndex(h => ["email", "kku_email"].includes(h));
  const idxFirst = header.findIndex(h => ["first_name", "ชื่อ"].includes(h));
  const idxLast = header.findIndex(h => ["last_name", "นามสกุล"].includes(h));
  const idxCode = header.findIndex(h => ["student_no", "student_code", "std_code", "studentid", "รหัส", "รหัสนักศึกษา"].includes(h));

  if (idxEmail < 0) {
    alert('ไฟล์ต้องมีคอลัมน์ "email"');
    return;
  }

  let ok = 0, skip = 0, fail = 0;

  // ทำทีละบรรทัด (ชัวร์สุด), ถ้าข้อมูลเยอะค่อยปรับเป็น batch
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
    };

    try {
      const done = await upsertStudentAndEnroll(student, courseId);
      if (done) ok++; else fail++;
    } catch {
      fail++;
    }
  }

  // รีเฟรชตาราง
  await loadRoster(courseId, containerEl);
  alert(`นำเข้าสำเร็จ: ${ok} แถว • ข้าม: ${skip} • ผิดพลาด: ${fail}`);
}


function renderRosterPage(el, page = 1) {
  const all = el._rosterRows || [];
  const q = (el._rosterQuery || '').toLowerCase();
  const rows = q
    ? all.filter(r => `${r.first_name} ${r.last_name} ${r.email} ${r.student_no}`.toLowerCase().includes(q))
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
          <td class="right">
            <button class="btn btn--outline btn--sm" data-act="del">ลบ</button>
          </td>
        </tr>
      `;
    }

    // edit mode: ใส่ input ทุกคอลัมน์
    return `
      <tr data-sid="${sid}" data-cid="${r.course_id}">
        <td class="right muted">${start + i + 1}</td>
        <td><input class="input input--sm" data-field="first_name" value="${esc(cur.first_name)}" /></td>
        <td><input class="input input--sm" data-field="last_name"  value="${esc(cur.last_name)}" /></td>
        <td><input class="input input--sm" data-field="email"      value="${esc(cur.email)}" /></td>
        <td><input class="input input--sm" data-field="student_no" value="${esc(cur.student_no)}" /></td>
        <td class="right"><span class="muted">แก้ไข</span></td>
      </tr>
    `;
  }).join('') || `<tr><td colspan="6" class="muted">ไม่พบข้อมูล</td></tr>`;

  // ลบ (เฉพาะโหมดดู)
  tbody.removeEventListener('click', tbody._clickH);
  if (!editMode) {
    tbody.addEventListener('click', (tbody._clickH = async (ev) => {
      const btn = ev.target.closest('button[data-act="del"]'); if (!btn) return;
      const tr = btn.closest('tr');
      const sid = Number(tr?.dataset.sid);
      const cid = Number(tr?.dataset.cid);
      if (!sid || !cid) return;

      // เด้งกล่องเลือกวิธีลบ (แทน confirm แบบเดิม)
      openDeleteStudentModal(sid, cid, el);
    }));
  }

  // เก็บค่าแก้ไข (เฉพาะโหมดแก้ไข)
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
  let pager = $('#roster-pager', panel);
  if (!pager) {
    pager = document.createElement('div');
    pager.id = 'roster-pager';
    pager.className = 'row mt-8';
    panel.appendChild(pager);
    pager.addEventListener('click', (ev) => {
      const b = ev.target.closest('button[data-pg]'); if (!b) return;
      const cur = el._rosterPage || 1;
      if (b.dataset.pg === 'prev') renderRosterPage(el, cur - 1);
      if (b.dataset.pg === 'next') renderRosterPage(el, cur + 1);
    });
  }
  pager.innerHTML = (!pages || pages <= 1) ? '' : `
    <div class="row" style="gap:.5rem">
      <button class="btn btn--outline" data-pg="prev" ${page <= 1 ? 'disabled' : ''}>ก่อนหน้า</button>
      <span class="muted">หน้า ${page} / ${pages} • ทั้งหมด ${total} คน</span>
      <button class="btn btn--outline" data-pg="next" ${page >= pages ? 'disabled' : ''}>ถัดไป</button>
    </div>
  `;
}

function openAddStudentModal(courseId, containerEl) {
  closeModal('modal-add-student'); // กันซ้ำ

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
  closeModal('modal-del-student'); // กันสร้างซ้ำ

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
  document.body.insertAdjacentHTML('beforeend', html);

  const modal = document.getElementById('modal-del-student');
  modal.querySelectorAll('[data-close]').forEach(b =>
    b.addEventListener('click', () => closeModal('modal-del-student'))
  );
  modal.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal('modal-del-student'); });

  // จัดการคลิกปุ่ม
  modal.querySelector('.modal__panel').addEventListener('click', async (ev) => {
    const btn = ev.target.closest('button[data-act]'); if (!btn) return;
    btn.disabled = true;
    try {
      if (btn.dataset.act === 'course') {
        // ลบเฉพาะวิชานี้
        const { error } = await sb.from('enrollments').delete().match({ student_id: sid, course_id: cid });
        if (error) throw error;
        el._rosterRows = (el._rosterRows || []).filter(x => !(x.student_id === sid && x.course_id === cid));
      } else if (btn.dataset.act === 'all') {
        // ลบทั้งคน (ต้องตั้ง FK เป็น ON DELETE CASCADE ไว้แล้ว)
        const { error } = await sb.from('students').delete().eq('id', sid);
        if (error) throw error;
        el._rosterRows = (el._rosterRows || []).filter(x => x.student_id !== sid);
      } else {
        // ยกเลิก
        closeModal('modal-del-student');
        return;
      }
      closeModal('modal-del-student');
      renderRosterPage(el, el._rosterPage || 1);
    } catch (err) {
      btn.disabled = false;
      alert('ลบไม่สำเร็จ: ' + (err?.message || err));
    }
  });
}


async function upsertStudentAndEnroll(student, courseId) {
  const { data: stu, error: u1 } = await sb
    .from('students')
    .upsert(student, { onConflict: 'email' })
    .select('id')
    .single();
  if (u1) { alert('บันทึกนักศึกษาไม่สำเร็จ: ' + u1.message); return false; }

  const { data: existed, error: chk } = await sb
    .from('enrollments')
    .select('student_id')
    .match({ student_id: stu.id, course_id: courseId })
    .maybeSingle();
  if (chk) { alert('ตรวจสอบรายชื่อไม่สำเร็จ: ' + chk.message); return false; }

  if (!existed) {
    const { error: ins } = await sb
      .from('enrollments')
      .insert({ student_id: stu.id, course_id: courseId });
    if (ins) { alert('เพิ่มรายชื่อเข้าวิชาไม่สำเร็จ: ' + ins.message); return false; }
  }
  alert('เพิ่มรายชื่อเรียบร้อย');
  return true;
}

function closeModal(id) { const m = document.getElementById(id); if (m) m.remove(); }


/* ========= Save multi-edits ========= */
function toggleRosterEditButtons(el, editing) {
  const panel = $('.tabpanel[data-panel="roster"]', el);
  $('#btn-roster-edit', panel).hidden = !!editing;
  $('#btn-roster-save', panel).hidden = !editing;
  $('#btn-roster-cancel', panel).hidden = !editing;
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

  // ตรวจว่ามี id เหล่านี้อยู่จริง (กันกรณีเผลอ insert)
  const { data: existing, error: e0 } = await sb
    .from('students')
    .select('id, email')
    .in('id', ids);
  if (e0) { alert('โหลดเพื่อยืนยันแถวที่จะแก้ไขไม่สำเร็จ: ' + e0.message); return; }
  const existingSet = new Set((existing || []).map(r => String(r.id)));

  // สร้างงานอัปเดตแบบ UPDATE ทีละแถว
  const jobs = [];
  for (const id of ids) {
    if (!existingSet.has(String(id))) continue; // ข้าม id ที่ไม่มีจริง (กัน insert)
    const e = editsMap[id];
    const update = {};

    if ('first_name' in e) update.first_name = e.first_name ?? '';
    if ('last_name' in e) update.last_name = e.last_name ?? '';
    if ('email' in e) update.email = (e.email ?? '').trim();
    if ('student_no' in e) update.student_no = (e.student_no ?? '').trim();

    // กันอีเมลว่างสำหรับแถวที่มีการแก้คอลัมน์ email
    if ('email' in e && update.email === '') {
      alert(`แถว id ${id}: อีเมลห้ามว่าง`);
      return;
    }

    if (Object.keys(update).length === 0) continue; // ไม่มีอะไรเปลี่ยนจริง ๆ
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

  // อัปเดต cache หน้าจอ
  el._rosterRows = (el._rosterRows || []).map(r => {
    const e = editsMap[r.student_id];
    return e ? {
      ...r,
      first_name: ('first_name' in e) ? e.first_name : r.first_name,
      last_name: ('last_name' in e) ? e.last_name : r.last_name,
      email: ('email' in e) ? e.email : r.email,
      student_no: ('student_no' in e) ? e.student_no : r.student_no,
    } : r;
  });

  el._rosterEdits = {};
  el._rosterEditMode = false;
  toggleRosterEditButtons(el, false);
  alert('บันทึกแล้ว');
  renderRosterPage(el, el._rosterPage || 1);
}

// เพิ่มนักศึกษาเข้ารายวิชา: ถ้ามีอยู่แล้วจะใช้คนเดิม, ถ้าไม่มีก็สร้างใหม่แล้ว enroll
async function addStudentToCourse(courseId, el) {
  // 1) ขออีเมล (จำเป็น เพราะ students.email เป็น NOT NULL)
  let email = prompt('อีเมลนักศึกษา (จำเป็น):');
  if (!email) return;
  email = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    alert('รูปแบบอีเมลไม่ถูกต้อง');
    return;
  }

  // 2) มีนักศึกษาคนนี้อยู่แล้วหรือยัง (เช็คทั้ง email และ kku_email)
  const { data: stu, error: eFind } = await sb
    .from('students')
    .select('id, email, kku_email, first_name, last_name, student_no')
    .or(`email.eq.${email},kku_email.eq.${email}`)
    .maybeSingle();

  if (eFind) {
    alert('ค้นหานักศึกษาไม่สำเร็จ: ' + eFind.message);
    return;
  }

  let student = stu;
  // 3) ถ้าไม่พบ – ขอข้อมูลเพิ่มเล็กน้อย แล้วสร้างนักศึกษาใหม่
  if (!student) {
    const first_name = prompt('ชื่อ (ไม่บังคับ):') || '';
    const last_name = prompt('นามสกุล (ไม่บังคับ):') || '';
    const student_no = prompt('รหัสนักศึกษา (ไม่บังคับ):') || '';

    const { data: created, error: eInsertStu } = await sb
      .from('students')
      .insert({
        email,                 // จำเป็น
        kku_email: email,      // จะตั้งให้เท่ากันก่อน
        first_name,
        last_name,
        student_no
      })
      .select()
      .single();

    if (eInsertStu) {
      alert('เพิ่มนักศึกษาไม่สำเร็จ: ' + eInsertStu.message);
      return;
    }
    student = created;
  }

  // 4) เช็คว่าลงทะเบียนรายวิชานี้แล้วหรือยัง
  const { data: dup } = await sb
    .from('enrollments')
    .select('student_id')
    .match({ student_id: student.id, course_id: courseId })
    .maybeSingle();

  if (dup) {
    alert('นักศึกษาคนนี้ลงทะเบียนในรายวิชานี้อยู่แล้ว');
    return;
  }

  // 5) ลงทะเบียนเข้ารายวิชา
  const { error: eEnroll } = await sb
    .from('enrollments')
    .insert({ student_id: student.id, course_id: courseId });

  if (eEnroll) {
    alert('เพิ่มรายชื่อไม่สำเร็จ: ' + eEnroll.message);
    return;
  }

  // 6) รีเฟรชรายชื่อ
  await loadRoster(courseId, el);
  alert('เพิ่มรายชื่อเรียบร้อย');
}


/* ========= Other tabs (placeholder) ========= */
// admin.js
async function loadScores(courseId, el) {
  // หา panel ของแท็บคะแนน
  const panel = $('.tabpanel[data-panel="scores"]', el);
  if (!panel) return;

  // เคลียร์ของเก่าแล้ว mount gradebook
  panel.innerHTML = `
    <div id="scores-root"></div>
  `;
  window.Scores.mount($('#scores-root', panel), courseId);
}

async function loadAssess(courseId, el) {
  $('#tbody-assess', el).innerHTML = `<tr><td colspan="4" class="muted">จะเติมภายหลัง</td></tr>`;
}
async function loadAnnouncements(courseId, el) {
  $('#list-ann', el).innerHTML = `<div class="muted">จะเติมภายหลัง</div>`;
}

/* ========= ACL: ตั้ง global role ========= */
function wireAclGlobal() {
  const btn = $('#btn-set-global');
  if (!btn) return;

  btn.addEventListener('click', () => openGlobalRoleModal());
}

// เปิดกล่องให้กรอกอีเมล/ชื่อ/บทบาท แล้วบันทึกลง profiles
function openGlobalRoleModal() {
  const mid = 'modal-global-role';
  document.getElementById(mid)?.remove();
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal" id="${mid}" role="dialog" aria-modal="true">
      <div class="modal__backdrop" data-close></div>
      <div class="modal__panel" role="document">
        <header class="modal__head">
          <h3>ตั้งค่าบทบาท (Global role)</h3>
          <button class="modal__close" data-close aria-label="ปิด">×</button>
        </header>
        <form id="form-global-role" class="stack">
          <label>อีเมล*
            <input class="input" name="email" type="email" required placeholder="user@example.com">
          </label>
          <div class="row wrap" style="gap:.75rem">
            <label class="w-260">ชื่อ–นามสกุล
              <input class="input" name="full_name" type="text" placeholder="ชื่อ–นามสกุล">
            </label>
            <label class="w-220">บทบาท (ทั้งระบบ)
              <select class="input" name="role">
                <option value="student">student</option>
                <option value="instructor">instructor</option>
                <option value="admin">admin</option>
              </select>
            </label>
          </div>
          <footer class="row" style="justify-content:flex-end; gap:.5rem; margin-top:12px">
            <button type="button" class="btn btn--outline" data-close>ยกเลิก</button>
            <button type="submit" class="btn">บันทึก</button>
          </footer>
        </form>
      </div>
    </div>
  `);

  const modal = document.getElementById(mid);
  modal.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => modal.remove()));
  modal.addEventListener('keydown', (e) => { if (e.key === 'Escape') modal.remove(); });

  const form = $('#form-global-role', modal);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    try {
      await ensureProfileByEmail({
        email: fd.get('email'),
        full_name: fd.get('full_name'),
        role: fd.get('role') || 'student'
      });
      alert('บันทึกบทบาทเรียบร้อย');
      modal.remove();
      renderAclList(); // รีเฟรชตารางสรุปสิทธิ์
    } catch (err) {
      alert('บันทึกไม่สำเร็จ: ' + (err?.message || err));
    }
  });
}



async function wireAclCourses(ownerId) {
  await fillAclCourseOptions(ownerId);

  // ค้นหาโปรไฟล์จากอีเมลแล้วแสดงผล (ชื่อ/บทบาทปัจจุบัน) ใต้ฟอร์ม
  $('#btn-find-user')?.addEventListener('click', async () => {
    const email = $('#acl-email')?.value?.trim().toLowerCase();
    if (!email) return alert('กรอกอีเมลก่อน');

    const box = $('#acl-user-info');
    box.innerHTML = '<div class="muted">กำลังค้นหา...</div>';
    const { data: prof } = await sb.from('profiles')
      .select('email, full_name, role')
      .eq('email', email).maybeSingle();

    if (!prof) {
      box.innerHTML = `<div class="card" style="padding:.5rem">ไม่พบในระบบ ระบบจะสร้างใหม่อัตโนมัติเมื่อกด “ให้สิทธิ์”</div>`;
    } else {
      box.innerHTML = `
        <div class="card" style="padding:.5rem">
          <div><b>${esc(prof.full_name || '(ไม่ระบุชื่อ)')}</b></div>
          <div class="muted">${esc(prof.email)} • Global role: <code>${esc(prof.role)}</code></div>
        </div>`;
    }
  });

  // ให้สิทธิ์ในรายวิชา
  $('#btn-grant-course')?.addEventListener('click', async () => {
    const email = $('#acl-email')?.value?.trim().toLowerCase();
    const courseId = Number($('#acl-course')?.value);
    const role = $('#acl-course-role')?.value || 'viewer';
    if (!email || !courseId) return alert('ระบุอีเมลและรายวิชาก่อน');

    try {
      // 1) ให้แน่ใจว่ามี profile แล้ว (ถ้าไม่มีจะสร้างให้ role เริ่มต้นเป็น student)
      await ensureProfileByEmail({ email }); // ถ้ามีอยู่แล้วจะไม่ยุ่ง role

      // 2) บันทึกสิทธิ์ในรายวิชา
      // ==== กรณีที่ schema ใช้ course_acl.user_email (แนะนำ) ====
      const { error: eACL } = await sb.from('course_acl')
        .upsert({ course_id: courseId, email, role },
          { onConflict: 'course_id,email' });
      if (eACL) throw eACL;

      alert('ให้สิทธิ์เรียบร้อย');
      renderAclList();

    } catch (err) {
      alert('ให้สิทธิ์ไม่สำเร็จ: ' + (err?.message || err));
    }
  });

  // ถอนสิทธิ์
  $('#btn-revoke-course')?.addEventListener('click', async () => {
    const email = $('#acl-email')?.value?.trim().toLowerCase();
    const courseId = Number($('#acl-course')?.value);
    if (!email || !courseId) return alert('ระบุอีเมลและรายวิชาก่อน');

    try {
      // ==== กรณี schema ใช้ user_email ====
      const { error } = await sb.from('course_acl')
        .delete().match({ course_id: courseId, email });
      if (error) throw error;

      alert('ลบสิทธิ์เรียบร้อย');
      renderAclList();
    } catch (err) {
      alert('ลบสิทธิ์ไม่สำเร็จ: ' + (err?.message || err));
    }
  });
}



// เติมตัวเลือกวิชา (ใช้รายการที่โหลดไว้แล้ว)
async function fillAclCourseOptions(ownerId) {
  const sel = $('#acl-course');
  let items = _allCourses;
  if (!items?.length) {
    const { data } = await sb.from('courses')
      .select('id, code, section, term, year, semester_label')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });
    items = data || [];
  }
  sel.innerHTML = items.map(c =>
    `<option value="${c.id}">
      ${esc(c.code)} • Sec ${esc(c.section || '-')} • ${esc(c.semester_label || (c.term && c.year ? `${c.term}/${c.year}` : ''))}
     </option>`
  ).join('');
}

// โชว์สรุปสิทธิ์ (admins + รายวิชา)
async function renderAclList() {
  const box = $('#acl-list');
  if (!box) return;

  const [adminsQ, aclQ, coursesQ] = await Promise.all([
    sb.from('profiles').select('email').eq('role', 'admin').order('email'),
    sb.from('course_acl').select('course_id, email, user_id, role'),
    sb.from('courses').select('id, code, section, term, year, semester_label')
  ]);

  const admins = adminsQ.data || [];
  const acl = aclQ.data || [];
  const courses = Object.fromEntries((coursesQ.data || []).map(c => [c.id, c]));

  box.innerHTML = `
    <div class="table-wrap"><table>
      <thead><tr><th>ผู้ดูแลระบบ (admin)</th></tr></thead>
      <tbody>
        ${admins.length ? admins.map(a => `<tr><td>${esc(a.email)}</td></tr>`).join('') : `<tr><td class="muted">—</td></tr>`}
      </tbody>
    </table></div>

    <div class="table-wrap mt-12"><table>
      <thead><tr><th>รายวิชา</th><th>ภาค</th><th>อีเมล</th><th>บทบาท</th></tr></thead>
      <tbody>
        ${acl.length ? acl.map(a => {
    const c = courses[a.course_id] || {};
    const label = c.semester_label || (c.term && c.year ? `${c.term}/${c.year}` : '');
    const email = a.email || a.user_email || ''; // รองรับทั้งชื่อคอลัมน์ใหม่/เก่า
    return `<tr>
            <td>${esc(c.code || a.course_id)}</td>
            <td>${esc(label)}</td>
            <td>${esc(email || '(schema เดิมใช้ user_id)')}</td>
            <td>${esc(a.role)}</td>
          </tr>`;
  }).join('') : `<tr><td colspan="4" class="muted">—</td></tr>`}
      </tbody>
    </table></div>
  `;
}



/* ========= Blocker ========= */
function showBlocker(title, msg) {
  const main = document.querySelector('main.admin');
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
