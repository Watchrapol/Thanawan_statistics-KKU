/* ========= Supabase config ========= */
const SUPABASE_URL = "https://uyhhxexhagbcwdtoanly.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5aGh4ZXhoYWdiY3dkdG9hbmx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MzEyODksImV4cCI6MjA3MzUwNzI4OX0.p0LeCTzk5T1LKqO7IGBmtH7jKwumy_0vxc-FXKZpRz8";
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ========= DOM helpers ========= */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

const ROSTER_PAGE_SIZE = 15;

function displayNameFromStudent(s) {
    const nm = [s.first_name, s.last_name].filter(Boolean).join(' ');
    return nm || s.email || s.kku_email || '';
}

function pickStudentCode(s) {
    // รองรับหลายชื่อคอลัมน์เท่าที่เจอบ่อย ๆ
    return s.code ?? s.student_no ?? s.std_code ?? s.studentid ?? s.student_id ?? '—';
}


/* ========= Page boot ========= */
boot();

async function boot() {
    // แสดงวันที่อัปเดต
    const ud = $('#app-updated');
    if (ud) ud.textContent = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: '2-digit' });

    // ปุ่มออกจากระบบ
    $('#btn-signout')?.addEventListener('click', async () => {
        await sb.auth.signOut();
        location.href = 'portal.html';
    });

    // สลับเมนูบนหัว
    $$('.header-actions [data-nav]').forEach(btn => {
        btn.addEventListener('click', () => showSection(btn.dataset.nav));
    });

    // ตรวจผู้ใช้และบทบาท
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
        showBlocker('ยังไม่ได้เข้าสู่ระบบ', 'กรุณาไปที่หน้า portal.html เพื่อเข้าสู่ระบบก่อน');
        return;
    }

    // ดึงโปรไฟล์
    const { data: prof, error } = await sb.from('profiles')
        .select('user_id, email, full_name, role')
        .eq('user_id', user.id).maybeSingle();

    if (error) {
        showBlocker('ยังไม่ได้ตั้งค่าฐานข้อมูลผู้ใช้ (profiles)',
            'กรุณารัน SQL สร้างตาราง profiles และ trigger ให้เรียบร้อยก่อนใช้งาน');
        return;
    }
    if (!prof || !['admin', 'instructor'].includes(prof.role)) {
        showBlocker('ไม่ได้รับสิทธิ์เข้าถึง', `บัญชี ${user.email} ไม่ใช่ผู้ดูแล/อาจารย์`);
        return;
    }

    // ผูกเครื่องมือรายวิชา
    $('#btn-add-course')?.addEventListener('click', () => createCourse(prof.user_id));
    $('#btn-refresh-courses')?.addEventListener('click', () => loadCourses(prof.user_id));
    $('#q')?.addEventListener('input', () => filterCourses());

    // โหลดรายวิชาของอาจารย์ (owner) ก่อน
    await loadCourses(prof.user_id);

    // เปิดแผงสิทธิ์ (ตั้ง global role แบบพื้นฐาน)
    wireAclGlobal();
}

/* ========= Section switching ========= */
function showSection(name) {
    const showCoursesShell = () => {
        $('#grid-courses').hidden = false;
        $('#acl').hidden = true;
        $('#pubs').hidden = true;
    };

    if (name === 'courses') {
        showCoursesShell();
        $('#course-detail').hidden = true;
    } else if (name === 'detail') {
        showCoursesShell();
        $('#course-detail').hidden = false; // แสดงกล่องรายละเอียด
    } else if (name === 'acl') {
        $('#grid-courses').hidden = true;
        $('#course-detail').hidden = true;
        $('#acl').hidden = false;
        $('#pubs').hidden = true;
        renderAclList();
    } else if (name === 'pubs') {
        $('#grid-courses').hidden = true;
        $('#course-detail').hidden = true;
        $('#acl').hidden = true;
        $('#pubs').hidden = false;
    }
}

/* ========= Courses list ========= */
let _allCourses = [];
async function loadCourses(ownerId) {
    const grid = $('#grid-courses');
    grid.innerHTML = '<div class="card">กำลังโหลดรายวิชา...</div>';

    const { data: courses, error } = await sb
        .from('courses')
        .select('id, code, title_th, title_en, section, semester')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });

    if (error) {
        grid.innerHTML = `<div class="card" style="color:#b91c1c">โหลดข้อมูลไม่สำเร็จ: ${esc(error.message)}</div>`;
        return;
    }

    _allCourses = courses || [];
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
        <div class="meta muted">${esc(c.semester || '—')} • Sec ${esc(c.section || '-')}</div>
      </div>
      <div class="title">${esc(c.title_th || c.title_en || '')}</div>
      <div class="actions">
        <button class="btn btn--sm" data-act="detail">จัดการ</button>
        <button class="btn btn--sm btn--outline" data-act="roster">รายชื่อ</button>
        <button class="btn btn--sm btn--outline" data-act="scores">คะแนน</button>
      </div>
    </article>
  `).join('');

    // คลิกในการ์ดครั้งเดียว ผูก handler เดียว
    grid.addEventListener('click', grid._h || (grid._h = (ev) => {
        const btn = ev.target.closest('button[data-act]');
        if (!btn) return;
        const card = btn.closest('.course');
        const id = card?.dataset.id;
        if (!id) return;
        openCourseDetail(id, btn.dataset.act);
    }));
}

function filterCourses() {
    const q = ($('#q')?.value || '').trim().toLowerCase();
    if (!q) return renderCourseGrid(_allCourses);
    const filtered = _allCourses.filter(c =>
        `${c.code} ${c.title_th || ''} ${c.title_en || ''} ${c.section || ''} ${c.semester || ''}`.toLowerCase().includes(q)
    );
    renderCourseGrid(filtered);
}

/* ========= Create course (prompt-based) ========= */
async function createCourse(ownerId) {
    const code = prompt('รหัสวิชา (เช่น STAT101)'); if (!code) return;
    const title = prompt('ชื่อวิชา (TH/EN อย่างใดอย่างหนึ่ง)') || '';
    const section = prompt('ตอนเรียน (Sec.) เช่น 1') || null;
    const semester = prompt('ภาคการศึกษา เช่น 1/2025') || null;

    const { data, error } = await sb.from('courses')
        .insert({ code, title_th: title, section, semester, owner_id: ownerId })
        .select().single();

    if (error) return alert('สร้างรายวิชาไม่สำเร็จ: ' + error.message);
    alert('สร้างรายวิชาแล้ว');
    _allCourses = [data, ..._allCourses];
    renderCourseGrid(_allCourses);
}

/* ========= Course detail shell ========= */
async function openCourseDetail(courseId, focusTab = 'detail') {
    const box = $('#course-detail');
    box.hidden = false;
    showSection('detail'); // สำคัญ: แสดงกล่อง detail (เดิมซ่อนไว้ในโหมด courses)

    // โหลดข้อมูลรายวิชา
    const { data: c, error } = await sb.from('courses')
        .select('id, code, title_th, title_en, section, semester')
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
        <div class="tabpanel" data-panel="roster">
            <div class="row" style="gap:.5rem;margin:.25rem 0 8px">
                <input class="input" id="roster-q" placeholder="ค้นหา ชื่อ/อีเมล/รหัส" style="max-width:300px">
                <span class="muted" id="roster-count"></span>
            </div>
            <div class="table-wrap"><table>
                 <thead><tr><th align="left">อีเมล</th><th>รหัสนักศึกษา</th><th class="right"></th></tr></thead>
                 <tbody id="tbody-roster"><tr><td colspan="3" class="muted">กำลังโหลด...</td></tr></tbody>
                </table></div>
            <div class="row mt-8"><button class="btn" id="btn-add-blank-student">เพิ่มแถวว่าง</button></div>
        </div>

      <div class="tabpanel" data-panel="scores" hidden>
        <div class="table-wrap"><table>
          <thead id="thead-scores"></thead>
          <tbody id="tbody-scores"><tr><td class="muted">ยังไม่โหลด</td></tr></tbody>
        </table></div>
      </div>
      

      <div class="tabpanel" data-panel="assess" hidden>
        <div class="table-wrap"><table>
          <thead><tr><th align="left">ชื่อรายการ</th><th class="right">สัดส่วน (%)</th><th class="right">เต็ม</th><th class="right"></th></tr></thead>
          <tbody id="tbody-assess"><tr><td colspan="4" class="muted">ยังไม่โหลด</td></tr></tbody>
        </table></div>
        <div class="row mt-8"><button class="btn" id="btn-add-assess">เพิ่มองค์ประกอบ</button></div>
      </div>

      <div class="tabpanel" data-panel="ann" hidden>
        <div id="list-ann" class="stack"><div class="muted">ยังไม่โหลด</div></div>
        <div class="row mt-8"><button class="btn" id="btn-new-ann">เพิ่มประกาศ</button></div>
      </div>
    </div>
  `;

    // wire tabs
    const tabs = $$('.tabs .tab', box);
    tabs.forEach(t => t.addEventListener('click', () => switchTab(box, t.dataset.tab, courseId)));
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

    // load default tab ตามปุ่มที่กด
    const startTab = (focusTab === 'roster' || focusTab === 'scores' || focusTab === 'assess' || focusTab === 'ann')
        ? focusTab : 'roster';
    switchTab(box, startTab, courseId);
}

function switchTab(container, tabName, courseId) {
    $$('.tabs .tab', container).forEach(b => b.classList.toggle('is-active', b.dataset.tab === tabName));
    $$('.tabpanel', container).forEach(p => p.hidden = (p.dataset.panel !== tabName));
    if (tabName === 'roster') loadRoster(courseId, container);
    else if (tabName === 'scores') loadScores(courseId, container);
    else if (tabName === 'assess') loadAssess(courseId, container);
    else if (tabName === 'ann') loadAnnouncements(courseId, container);
}

/* ========= Roster (read-only scaffold) ========= */
async function loadRoster(courseId, el) {
    const thead = $('#thead-scores', el); // ไม่ได้ใช้ใน roster แต่อยู่ใน DOM
    const tbody = $('#tbody-roster', el);
    tbody.innerHTML = `<tr><td colspan="5" class="muted">กำลังโหลด...</td></tr>`;

    // 1) ดึง student_id จาก enrollments
    const { data: enrolls, error: e1 } = await sb.from('enrollments')
        .select('student_id, course_id')
        .eq('course_id', courseId)
        .order('student_id', { ascending: true });

    if (e1) {
        tbody.innerHTML = `<tr><td colspan="5" class="muted">โหลดไม่สำเร็จ: ${esc(e1.message)}</td></tr>`;
        return;
    }
    if (!enrolls?.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="muted">ยังไม่มีรายชื่อ</td></tr>`;
        renderRosterPager(el, 0, 0, 0); // ซ่อนเพจเจอร์
        return;
    }

    // 2) ดึงข้อมูลนักศึกษาตาม id ที่ได้มา
    const ids = [...new Set(enrolls.map(r => r.student_id))];
    const { data: students, error: e2 } = await sb.from('students')
        // 🟢 เอา full_name ออก เหลือ first_name/last_name
        .select('id, email, kku_email, first_name, last_name, student_no, major')
        .in('id', ids);

    if (e2) {
        tbody.innerHTML = `<tr><td colspan="5" class="muted">โหลดนักศึกษาไม่สำเร็จ: ${esc(e2.message)}</td></tr>`;
        renderRosterPager(el, 0, 0, 0);
        return;
    }



    // 3) สร้าง map id -> student แล้วประกอบแถวที่ต้องแสดง
    const byId = Object.fromEntries((students || []).map(s => [String(s.id), s]));
    const rows = enrolls.map(r => {
        const s = byId[String(r.student_id)] || {};
        return {
            student_id: r.student_id,
            course_id: r.course_id,
            email: s.email || s.kku_email || r.student_email || '—',
            name: displayNameFromStudent(s),                 // ถ้าไม่มีชื่อ จะ fallback เป็นอีเมลในฟังก์ชัน
            code: pickStudentCode(s) || r.student_code || '—',
        };
    });

    // เก็บลง cache
    el._rosterRows = rows;
    el._rosterQuery = '';
    // ค้นหา
    const q = $('#roster-q', el);
    q?.removeEventListener('input', el._rosterSearchH);
    q?.addEventListener('input', (el._rosterSearchH = () => {
        el._rosterQuery = q.value.trim().toLowerCase();
        renderRosterPage(el, 1);
    }));


    // เก็บไว้ใน container เพื่อใช้ตอนเปลี่ยนหน้า
    el._rosterRows = rows;
    renderRosterPage(el, 1); // เปิดหน้าที่ 1
}


function renderRosterPage(el, page = 1) {
    const all = el._rosterRows || [];
    const q = (el._rosterQuery || '').toLowerCase();
    const rows = q
        ? all.filter(r => `${r.name} ${r.email} ${r.code}`.toLowerCase().includes(q))
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

    // หัวตาราง
    const theadEl = $('table thead', $('.tabpanel[data-panel="roster"]', el));
    if (theadEl) {
        theadEl.innerHTML = `
      <tr>
        <th class="right" style="width:72px">ลำดับ</th>
        <th align="left">ชื่อ–นามสกุล</th>
        <th align="left">อีเมล</th>
        <th>รหัสนักศึกษา</th>
        <th class="right"></th>
      </tr>
    `;
    }

    tbody.innerHTML = slice.map((r, i) => `
    <tr data-sid="${r.student_id}" data-cid="${r.course_id}">
      <td class="right muted">${start + i + 1}</td>
      <td>${esc(r.name)}</td>
      <td>${esc(r.email)}</td>
      <td><code>${esc(r.code)}</code></td>
      <td class="right">
        <button class="btn btn--outline btn--sm" data-act="edit">แก้รหัส</button>
        <button class="btn btn--outline btn--sm" data-act="del">ลบ</button>
      </td>
    </tr>
  `).join('');

    // handler
    tbody.removeEventListener('click', tbody._h);
    tbody.addEventListener('click', (tbody._h = async (ev) => {
        const btn = ev.target.closest('button[data-act]'); if (!btn) return;
        const tr = btn.closest('tr');
        const sid = Number(tr?.dataset.sid);
        const cid = Number(tr?.dataset.cid);
        if (!sid || !cid) return;

        if (btn.dataset.act === 'del') {
            if (!confirm('ลบรายชื่อแถวนี้?')) return;
            const { error } = await sb.from('enrollments').delete().match({ student_id: sid, course_id: cid });
            if (error) return alert('ลบไม่สำเร็จ: ' + error.message);
            el._rosterRows = (el._rosterRows || []).filter(x => !(x.student_id === sid && x.course_id === cid));
            renderRosterPage(el, el._rosterPage);
        }

        if (btn.dataset.act === 'edit') {
            const cur = slice.find(x => x.student_id === sid)?.code || '';
            const val = prompt('แก้ไขรหัสนักศึกษา', cur); if (val === null) return;
            const code = val.trim();
            const { error } = await sb.from('students').update({ student_no: code }).eq('id', sid);
            if (error) return alert('บันทึกไม่สำเร็จ: ' + error.message);

            // อัปเดต cache
            const idxAll = (el._rosterRows || []).findIndex(x => x.student_id === sid);
            if (idxAll >= 0) el._rosterRows[idxAll].code = code;
            renderRosterPage(el, el._rosterPage);
        }
    }));

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
            const dir = b.dataset.pg;
            const cur = el._rosterPage || 1;
            if (dir === 'prev') renderRosterPage(el, cur - 1);
            else if (dir === 'next') renderRosterPage(el, cur + 1);
        });
    }

    if (!pages || pages <= 1) {
        pager.innerHTML = ''; // ไม่มีหน้าให้เปลี่ยน – ซ่อน
        return;
    }
    pager.innerHTML = `
    <div class="row" style="gap:.5rem">
      <button class="btn btn--outline" data-pg="prev" ${page <= 1 ? 'disabled' : ''}>ก่อนหน้า</button>
      <span class="muted">หน้า ${page} / ${pages} • ทั้งหมด ${total} คน</span>
      <button class="btn btn--outline" data-pg="next" ${page >= pages ? 'disabled' : ''}>ถัดไป</button>
    </div>
  `;
}



/* ========= Scores / Assessments / Announcements (placeholder loaders) ========= */
async function loadScores(courseId, el) {
    $('#thead-scores', el).innerHTML = `<tr><th align="left">อีเมล</th><th>รหัส</th></tr>`;
    $('#tbody-scores', el).innerHTML = `<tr><td class="muted">จะเติมภายหลัง</td></tr>`;
}
async function loadAssess(courseId, el) {
    $('#tbody-assess', el).innerHTML = `<tr><td colspan="4" class="muted">จะเติมภายหลัง</td></tr>`;
}
async function loadAnnouncements(courseId, el) {
    $('#list-ann', el).innerHTML = `<div class="muted">จะเติมภายหลัง</div>`;
}

/* ========= ACL: ตั้ง global role พื้นฐาน ========= */
function wireAclGlobal() {
    $('#btn-set-global')?.addEventListener('click', async () => {
        const email = $('#acl-email')?.value?.trim();
        const role = $('#acl-global-role')?.value || 'student';
        if (!email) return alert('กรอกอีเมลก่อน');

        // หาโปรไฟล์ ถ้าไม่มีให้ insert แถว placeholder
        const { data: prof } = await sb.from('profiles').select('user_id').eq('email', email).maybeSingle();
        let user_id = prof?.user_id;
        if (!user_id) {
            user_id = crypto.randomUUID(); // ghost row
            const { error: e1 } = await sb.from('profiles').insert({ user_id, email, role: 'student' });
            if (e1) return alert('สร้างโปรไฟล์ไม่สำเร็จ: ' + e1.message);
        }
        const { error } = await sb.from('profiles').update({ role }).eq('user_id', user_id);
        if (error) return alert('อัปเดตบทบาทไม่สำเร็จ: ' + error.message);
        alert('ตั้งบทบาทเรียบร้อย');
        renderAclList();
    });
}

async function renderAclList() {
    const box = $('#acl-list');
    if (!box) return;
    const { data: admins } = await sb.from('profiles').select('email').eq('role', 'admin');
    box.innerHTML = `
    <div class="table-wrap"><table>
      <thead><tr><th>ผู้ดูแลระบบ (admin)</th></tr></thead>
      <tbody>
        ${(admins || []).map(a => `<tr><td>${esc(a.email)}</td></tr>`).join('') || `<tr><td class="muted">—</td></tr>`}
      </tbody>
    </table></div>
  `;
}

/* ========= Misc ========= */
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
