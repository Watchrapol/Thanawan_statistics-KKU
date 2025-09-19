/* ===== Supabase config ===== */
const SUPABASE_URL = "https://uyhhxexhagbcwdtoanly.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5aGh4ZXhoYWdiY3dkdG9hbmx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MzEyODksImV4cCI6MjA3MzUwNzI4OX0.p0LeCTzk5T1LKqO7IGBmtH7jKwumy_0vxc-FXKZpRz8";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ตั้งเวลา (วินาที) */
const RESEND_WINDOW = 60;
const OTP_WINDOW = 120;

/* ===== DOM ===== */
const $ = s => document.querySelector(s);
const portalEl = $('.portal');
const fEmail = $('#f-email');
const fOtp = $('#f-otp');
const app = $('#app');

const btnSend = $('#btn-send');
const btnConfirm = $('#btn-confirm');
const btnBack = $('#btn-back');
const btnBackCourses = $('#btn-back-courses');

const msgEmail = $('#msg-email');
const msgOtp = $('#msg-otp');
const otpCount = $('#otp-count');

let loginEmail = "";
let resendTimer = null;
let otpTimer = null;

/* ===== Mode switching ===== */
function toDashboardMode() { portalEl?.classList.remove('portal--compact'); portalEl?.classList.add('is-dashboard'); }
function toCompactMode() { portalEl?.classList.remove('is-dashboard', 'has-score'); portalEl?.classList.add('portal--compact'); }

/* ===== Boot ===== */
boot();
async function boot() {
  const { data: { user } } = await sb.auth.getUser();
  if (user) { showDashboard(user); return; }
  toCompactMode(); fEmail.hidden = false; fOtp.hidden = true; app.hidden = true;
}

/* ===== ปุ่มย้อนกลับไปหน้ารายวิชา ===== */
btnBackCourses?.addEventListener('click', () => {
  try {
    // ถ้ามี referrer จากหน้าเดิม และเป็น origin เดียวกัน ให้ย้อนจริง ๆ
    const ref = document.referrer ? new URL(document.referrer) : null;
    if (ref && ref.origin === location.origin && ref.href !== location.href) {
      history.back();
      return;
    }
  } catch { }

  // ไม่มี/ใช้ referrer ไม่ได้ → ไปไฟล์ subjects.html ที่อยู่ข้าง ๆ portal.html
  const u = new URL(location.href);
  u.pathname = u.pathname.replace(/[^/]+$/, 'subjects.html');  // แทนชื่อไฟล์ท้าย path
  location.href = u.toString();
});


/* ===== ส่ง OTP ===== */
fEmail?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = new FormData(fEmail).get('email')?.trim();
  if (!email) return;
  loginEmail = email;

  btnSend.classList.add('is-loading');
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: location.origin + location.pathname }
  });
  btnSend.classList.remove('is-loading');

  if (error) { showMsg(msgEmail, 'ส่งรหัสไม่สำเร็จ: ' + error.message, 'err'); return; }
  showMsg(msgEmail, 'ส่งรหัส 6 หลักไปที่อีเมลแล้ว กรุณาตรวจสอบ', 'ok');
  fEmail.hidden = true; fOtp.hidden = false;
  startResendCountdown(); startOtpCountdown();
});

/* ===== ยืนยัน OTP ===== */
fOtp?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const code = new FormData(fOtp).get('code')?.trim();
  if (!/^\d{6}$/.test(code)) { showMsg(msgOtp, 'กรุณากรอกรหัส 6 หลักให้ถูกต้อง', 'err'); return; }

  btnConfirm.classList.add('is-loading');
  const { error } = await sb.auth.verifyOtp({ email: loginEmail, token: code, type: 'email' });
  btnConfirm.classList.remove('is-loading');

  if (error) { showMsg(msgOtp, 'รหัสไม่ถูกต้องหรือหมดอายุ', 'err'); return; }
  stopOtpCountdown();
  const { data: { user } } = await sb.auth.getUser();
  showDashboard(user);
});

/* ===== ย้อนกลับจาก OTP ===== */
btnBack?.addEventListener('click', () => {
  fOtp.hidden = true; fEmail.hidden = false;
  stopResendCountdown(); stopOtpCountdown();
  msgEmail.hidden = true; msgOtp.hidden = true;
  btnConfirm.textContent = 'ยืนยัน';
});

/* ===== Sign out ===== */
async function doSignOut() { await sb.auth.signOut(); toCompactMode(); location.reload(); }

/* ===== Dashboard ===== */
async function showDashboard(user) {
  toDashboardMode();
  fEmail.hidden = true; fOtp.hidden = true; app.hidden = false;
  portalEl.classList.remove('has-score');

  const $who = $('#card-who'), $courses = $('#card-courses'), $score = $('#card-score');

  // 1) ข้อมูลนักศึกษา
  const { data: me } = await sb
    .from('students')
    .select(`id, student_no, first_name, last_name, email,
             year_level, program, major, section, entry_year, kku_email`)
    .eq('email', user.email).maybeSingle();

  if (!me) {
    $who.innerHTML = `
      <div class="card">
        <h3 style="margin:0 0 6px">ไม่พบข้อมูลของอีเมลนี้</h3>
        <p class="muted">กรุณาติดต่ออาจารย์ • <span class="code">${user.email}</span></p>
        <div class="row" style="margin-top:10px"><button class="btn btn--outline" id="logout-alone">ออกจากระบบ</button></div>
      </div>`;
    $('#logout-alone')?.addEventListener('click', doSignOut);
    $courses.innerHTML = ''; $score.innerHTML = '';
    return;
  }

  renderWhoCard(me);

  // 2) รายวิชาที่ลงทะเบียน
  const { data: enrolls } = await sb.from('enrollments').select('course_id').eq('student_id', me.id);
  const courseIds = (enrolls || []).map(x => x.course_id);

  if (!courseIds.length) {
    $courses.innerHTML = `<div class="card"><h3 style="margin:0 0 8px">รายวิชาที่ลงทะเบียน</h3><div class="muted">ยังไม่มีรายวิชา</div></div>`;
    $score.innerHTML = ''; return;
  }

  const { data: courses } = await sb
    .from('courses')
    .select('id, code, title_th, title_en')
    .in('id', courseIds);

  // แสดงเป็นแถวแนวนอนเต็มกว้าง
  $courses.innerHTML = `
    <div class="card">
      <h3 style="margin:0 0 8px">รายวิชาที่ลงทะเบียน</h3>
      <div id="courses-list" class="courses-list">
        ${(courses || []).map(c => `
          <article class="course-item">
            <div class="course-code">${c.code}</div>
            <div class="course-main">
              <div class="course-title">${c.title_th || c.title_en || ''}</div>
              <div class="course-sub">${c.title_en || ''}</div>
              <div class="course-meta">
                ${me?.section ? `<span class="pill pill--muted">Section ${me.section}</span>` : ``}
                ${me?.year_level ? `<span class="pill pill--muted">ชั้นปี ${me.year_level}</span>` : ``}
              </div>
            </div>
            <div class="course-actions">
              <button class="btn btn--outline btn--sm"
                data-open-course
                data-course-id="${c.id}"
                data-course-code="${c.code}"
                data-student-id="${me.id}">
                ดูคะแนน
              </button>
            </div>
          </article>
        `).join('')}
      </div>
    </div>`;

  // event delegation
  $courses.querySelector('#courses-list')?.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-open-course]');
    if (!btn) return;
    openCourse(+btn.dataset.courseId, String(btn.dataset.courseCode), +btn.dataset.studentId);
  });

  // ซ่อนการ์ดคะแนน (ยังไม่เปิด)
  $score.innerHTML = ''; portalEl.classList.remove('has-score');
}
window.showDashboard = showDashboard;

/* ===== การ์ดข้อมูลนักศึกษา ===== */
function renderWhoCard(me) {
  const $who = $('#card-who');
  const emailTxt = me?.kku_email || me?.email || '—';
  const yearTxt = me?.year_level ? `ชั้นปี ${me.year_level}` : 'ชั้นปี —';

  $who.innerHTML = `
    <div class="card">
      <h3 style="margin:0 0 8px">ข้อมูลนักศึกษา</h3>
      <div>
        <div><b>${me.first_name} ${me.last_name}</b> <span class="muted">(${me.student_no || '—'})</span></div>
        <div class="muted">${emailTxt}</div>
        <div class="who-meta" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">
          <span class="pill pill--muted">${yearTxt}</span>
          ${me?.program ? `<span class="pill pill--muted">${me.program}</span>` : ''}
          ${me?.major ? `<span class="pill pill--muted">${me.major}</span>` : ''}
          ${me?.section ? `<span class="pill pill--muted">Section ${me.section}</span>` : ''}
        </div>
      </div>
      <div class="row" style="margin-top:10px">
        <button class="btn btn--outline" id="btn-signout">ออกจากระบบ</button>
        <a class="btn btn--primary" id="btn-mail-teacher"
           href="mailto:thanpra@kku.ac.th?subject=[รายวิชา.....รหัสวิชา...... section......] สอบถามผลการเรียน&amp;body=ชื่อนักศึกษา:%0Aรหัสนักศึกษา:%0Aรายละเอียด:">ติดต่ออาจารย์
        </a>
      </div>
    </div>`;
  $('#btn-signout')?.addEventListener('click', doSignOut);
}

/* ===== กลับไปรายวิชา ===== */
function backToCourses() {
  const $score = $('#card-score');
  $score.innerHTML = '';
  portalEl.classList.remove('has-score'); // ซ่อนแถวล่าง
}

/* ===== เปิดการ์ดคะแนน: แสดงแถวล่างสุดเต็มกว้าง ===== */
async function openCourse(courseId, code, studentId) {
  const { data: assess } = await sb
    .from('assessments')
    .select('id, name, weight, max_score')
    .eq('course_id', courseId)
    .order('id', { ascending: true });

  const assessIds = (assess || []).map(a => a.id);

  const { data: scores } = await sb
    .from('scores')
    .select('assessment_id, score')
    .eq('student_id', studentId)
    .in('assessment_id', assessIds);

  const byAid = Object.fromEntries((scores || []).map(s => [s.assessment_id, s.score]));

  let totalPct = 0;
  const rows = (assess || []).map(a => {
    const sc = Number(byAid[a.id] ?? 0);
    const max = Number(a.max_score ?? 0);
    const w = Number(a.weight ?? 0);
    const pct = max > 0 ? sc / max : 0;
    totalPct += w * pct;

    const barWidth = Math.max(0, Math.min(100, pct * 100));
    const pctText = (pct * 100).toFixed(1) + '%';

    return `<tr>
      <td>${a.name}</td>
      <td class="right">${w.toFixed(1)}%</td>
      <td class="right">${sc} / ${max}</td>
      <td class="right">
        <div style="display:flex;gap:10px;align-items:center;">
          <div class="progress" style="flex:1 1 140px;"><span style="width:${barWidth}%"></span></div>
          <div style="min-width:60px;" class="right">${pctText}</div>
        </div>
      </td>
    </tr>`;
  }).join('');

  const missingCount = (assess || []).filter(a => byAid[a.id] == null).length;

  const { data: course } = await sb
    .from('courses')
    .select('grade_rules, grade_published')
    .eq('id', courseId).single();

  let letter = '-';
  if (course?.grade_rules) {
    try {
      const rulesObj = typeof course.grade_rules === 'string'
        ? JSON.parse(course.grade_rules)
        : course.grade_rules;
      const pairs = Object.entries(rulesObj)
        .map(([g, v]) => [g, Number(v) <= 1 ? Number(v) * 100 : Number(v)])
        .sort((a, b) => b[1] - a[1]);
      const found = pairs.find(([g, cut]) => totalPct >= cut);
      letter = found ? found[0] : '-';
    } catch { }
  }

  const published = ('grade_published' in (course || {})) ? !!course.grade_published : false;
  const canShowGrade = !!course?.grade_rules && published && missingCount === 0;

  const gradeRow = canShowGrade
    ? `<tr class="grade-row"><td colspan="3" align="right"><b>เกรด</b></td><td class="right"><span class="pill pill--grade">${letter}</span></td></tr>`
    : '';

  const noteRow = !canShowGrade
    ? `<tr><td colspan="4" class="muted right"><small>ยังไม่ประกาศเกรด (คะแนนยังไม่ครบ / ยังไม่เผยแพร่)</small></td></tr>`
    : '';

  // แสดงในแถวล่างสุด (score score)
  $('#card-score').innerHTML = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
        <h3 style="margin:0 0 8px">${code} — คะแนนรวม</h3>
        <button class="btn btn--outline btn--sm" id="btn-back-to-courses">ย้อนกลับไปรายวิชา</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th align="left">รายการ</th>
              <th class="right">สัดส่วน</th>
              <th class="right">ได้/เต็ม</th>
              <th class="right">% ย่อย</th>
            </tr>
          </thead>
          <tbody>${rows || `<tr><td colspan="4" class="center muted">ยังไม่มีองค์ประกอบการประเมิน</td></tr>`}</tbody>
          <tfoot>
            <tr class="total-row"><td colspan="3" align="right"><b>รวม</b></td><td class="right"><b>${totalPct.toFixed(2)}%</b></td></tr>
            ${gradeRow}
            ${noteRow}
          </tfoot>
        </table>
      </div>
    </div>`;
  portalEl.classList.add('has-score'); // ทำให้แถวล่างแสดง

  $('#btn-back-to-courses')?.addEventListener('click', backToCourses);
}
window.openCourse = openCourse;

/* ===== Helpers ===== */
function showMsg(el, text, type = 'ok') {
  el.textContent = text;
  el.className = 'notice notice--' + (type === 'err' ? 'err' : 'ok');
  el.hidden = false;
}
function startResendCountdown() {
  let left = RESEND_WINDOW; btnSend.textContent = `ส่งใหม่ใน ${left}s`; btnSend.disabled = true; clearInterval(resendTimer);
  resendTimer = setInterval(() => {
    left -= 1;
    btnSend.textContent = left > 0 ? `ส่งใหม่ใน ${left}s` : 'ส่งรหัส OTP';
    if (left <= 0) { clearInterval(resendTimer); btnSend.disabled = false; }
  }, 1000);
}
function stopResendCountdown() { clearInterval(resendTimer); btnSend.textContent = 'ส่งรหัส OTP'; btnSend.disabled = false; }
function startOtpCountdown() {
  let left = OTP_WINDOW; otpCount.textContent = left; btnConfirm.textContent = `ยืนยัน (${left}s)`; btnConfirm.disabled = false; clearInterval(otpTimer);
  otpTimer = setInterval(() => {
    left -= 1;
    otpCount.textContent = left;
    btnConfirm.textContent = `ยืนยัน (${left}s)`;
    if (left <= 0) {
      clearInterval(otpTimer);
      btnConfirm.textContent = 'หมดเวลา';
      btnConfirm.disabled = true;
      showMsg(msgOtp, 'รหัสหมดอายุ กรุณากดย้อนกลับเพื่อขอรหัสใหม่', 'err');
    }
  }, 1000);
}
function stopOtpCountdown() {
  clearInterval(otpTimer);
  otpCount.textContent = '--';
  btnConfirm.textContent = 'ยืนยัน';
  btnConfirm.disabled = false;
}

/* อัปเดตวันที่ในการ์ดข้อ 3 */
(function setUpdatedDate() {
  const el = document.querySelector('#app-updated');
  if (el) el.textContent = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: '2-digit' });
})();
