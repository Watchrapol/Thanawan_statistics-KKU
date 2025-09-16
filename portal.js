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

/* ===== ปุ่มย้อนกลับไปหน้ารายวิชา (เฉพาะหน้าแรก) ===== */
btnBackCourses?.addEventListener('click', () => {
    // ถ้ามี referrer ให้ถอยกลับไป
    if (document.referrer && document.referrer !== location.href) {
        history.back();
        return;
    }
    // ถ้าไม่มี referrer ให้กลับไป root ของไซต์ (โฟลเดอร์โปรเจกต์)
    location.href = './';
});

/* ===== ส่ง OTP ===== */
fEmail.addEventListener('submit', async (e) => {
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
fOtp.addEventListener('submit', async (e) => {
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

/* ===== ย้อนกลับไปขอรหัสใหม่ในขั้น OTP ===== */
btnBack?.addEventListener('click', () => {
    fOtp.hidden = true; fEmail.hidden = false;
    stopResendCountdown(); stopOtpCountdown();
    msgEmail.hidden = true; msgOtp.hidden = true;
    btnConfirm.textContent = 'ยืนยัน';
});

/* ===== Dashboard ===== */
async function showDashboard(user) {
    toDashboardMode();
    fEmail.hidden = true; fOtp.hidden = true; app.hidden = false;
    portalEl.classList.remove('has-score');

    const $who = $('#card-who'), $courses = $('#card-courses'), $score = $('#card-score');

    // 1) ข้อมูลนักศึกษา
    const { data: me } = await sb
        .from('students')
        .select(`
      id, student_no, first_name, last_name, email,
      year_level, program, major, section, entry_year, kku_email
    `)
        .eq('email', user.email)
        .maybeSingle();

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

    const { data: courses } = await sb.from('courses').select('id, code, title_th, title_en').in('id', courseIds);

    $courses.innerHTML = `
    <div class="card">
      <h3 style="margin:0 0 8px">รายวิชาที่ลงทะเบียน</h3>
      <div class="courses-list">
        ${(courses || []).map(c => `
          <article class="card">
            <div style="font-weight:700;margin-bottom:4px">${c.code}</div>
            <div class="muted" style="margin-bottom:8px">${c.title_th || c.title_en || ''}</div>
            <button class="btn btn--outline btn--sm" data-open-course data-course-id="${c.id}" data-course-code="${c.code}" data-student-id="${me.id}">
              ดูคะแนน
            </button>
          </article>
        `).join('')}
      </div>
    </div>`;

    $courses.querySelectorAll('[data-open-course]').forEach(btn => {
        btn.addEventListener('click', () => {
            openCourse(+btn.dataset.courseId, String(btn.dataset.courseCode), +btn.dataset.studentId);
        });
    });

    $score.innerHTML = ''; portalEl.classList.remove('has-score');
}
window.showDashboard = showDashboard;

/* ===== การ์ดข้อมูลนักศึกษา (ไม่มีรูป/ไม่มีอาจารย์ที่ปรึกษา) ===== */
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
          ${me?.section ? `<span class="pill pill--muted">ตอน ${me.section}</span>` : ''}
        </div>
      </div>
      <div class="row" style="margin-top:10px">
        <button class="btn btn--outline" id="btn-signout">ออกจากระบบ</button>
      </div>
    </div>`;
    $('#btn-signout')?.addEventListener('click', doSignOut);
}

/* ===== เปิดการ์ดคะแนน ===== */
async function openCourse(courseId, code, studentId) {
    const { data: assess } = await sb
        .from('assessments').select('id, name, weight, max_score')
        .eq('course_id', courseId).order('id', { ascending: true });
    const assessIds = (assess || []).map(a => a.id);
    const { data: scores } = await sb
        .from('scores').select('assessment_id, score')
        .eq('student_id', studentId).in('assessment_id', assessIds);

    const byAid = Object.fromEntries((scores || []).map(s => [s.assessment_id, s.score]));
    let totalPct = 0;
    const rows = (assess || []).map(a => {
        const sc = Number(byAid[a.id] ?? 0);
        const max = Number(a.max_score ?? 0) || 0;
        const weight = Number(a.weight ?? 0);
        const pct = max > 0 ? (sc / max) : 0;
        totalPct += weight * pct;
        const pctText = (pct * 100).toFixed(1) + '%';
        const barWidth = Math.max(0, Math.min(100, pct * 100));
        return `<tr>
      <td>${a.name}</td>
      <td class="right">${weight.toFixed(1)}%</td>
      <td class="right">${sc} / ${max}</td>
      <td class="right">
        <div style="display:flex;gap:10px;align-items:center;">
          <div class="progress" style="flex:1 1 140px;"><span style="width:${barWidth}%"></span></div>
          <div style="min-width:60px;" class="right">${pctText}</div>
        </div>
      </td>
    </tr>`;
    }).join('');

    const { data: course } = await sb.from('courses').select('grade_rules').eq('id', courseId).single();
    const fallbackRules = { "A": 80, "B+": 75, "B": 70, "C+": 65, "C": 60, "D+": 55, "D": 50, "F": 0 };
    let pairs;
    try {
        const rules = course?.grade_rules ? JSON.parse(course.grade_rules) : null;
        if (rules && typeof rules === 'object' && Object.keys(rules).length) {
            pairs = Object.entries(rules);
            const maxCut = Math.max(...pairs.map(([, v]) => Number(v)));
            pairs = pairs.map(([g, v]) => [g, (maxCut <= 1.001) ? Number(v) * 100 : Number(v)]);
        } else { pairs = Object.entries(fallbackRules); }
    } catch { pairs = Object.entries(fallbackRules); }
    pairs.sort((a, b) => b[1] - a[1]);
    const found = pairs.find(([g, cut]) => totalPct >= cut);
    const letter = found ? found[0] : '-';

    $('#card-score').innerHTML = `
    <div class="card">
      <h3 style="margin:0 0 8px">${code} — คะแนนรวม</h3>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th align="left">รายการ</th>
            <th class="right">สัดส่วน</th>
            <th class="right">ได้/เต็ม</th>
            <th class="right">% ย่อย</th>
          </tr></thead>
          <tbody>${rows || `<tr><td colspan="4" class="center muted">ยังไม่มีองค์ประกอบการประเมิน</td></tr>`}</tbody>
          <tfoot>
            <tr class="total-row"><td colspan="3" align="right"><b>รวม</b></td><td class="right"><b>${totalPct.toFixed(2)}%</b></td></tr>
            <tr class="grade-row"><td colspan="3" align="right"><b>เกรด</b></td><td class="right"><span class="pill pill--grade">${letter}</span></td></tr>
          </tfoot>
        </table>
      </div>
    </div>`;
    portalEl.classList.add('has-score');
}

/* ===== Sign out ===== */
async function doSignOut() { await sb.auth.signOut(); toCompactMode(); location.reload(); }

/* ===== Helpers ===== */
function showMsg(el, text, type = 'ok') { el.textContent = text; el.className = 'notice notice--' + (type === 'err' ? 'err' : 'ok'); el.hidden = false; }
function startResendCountdown() {
    let left = RESEND_WINDOW; btnSend.textContent = `ส่งใหม่ใน ${left}s`; btnSend.disabled = true; clearInterval(resendTimer);
    resendTimer = setInterval(() => { left -= 1; btnSend.textContent = left > 0 ? `ส่งใหม่ใน ${left}s` : 'ส่งรหัส OTP'; if (left <= 0) { clearInterval(resendTimer); btnSend.disabled = false; } }, 1000);
}
function stopResendCountdown() { clearInterval(resendTimer); btnSend.textContent = 'ส่งรหัส OTP'; btnSend.disabled = false; }
function startOtpCountdown() {
    let left = OTP_WINDOW; otpCount.textContent = left; btnConfirm.textContent = `ยืนยัน (${left}s)`; btnConfirm.disabled = false; clearInterval(otpTimer);
    otpTimer = setInterval(() => { left -= 1; otpCount.textContent = left; btnConfirm.textContent = `ยืนยัน (${left}s)`; if (left <= 0) { clearInterval(otpTimer); btnConfirm.textContent = 'หมดเวลา'; btnConfirm.disabled = true; showMsg(msgOtp, 'รหัสหมดอายุ กรุณากดย้อนกลับเพื่อขอรหัสใหม่', 'err'); } }, 1000);
}
function stopOtpCountdown() { clearInterval(otpTimer); otpCount.textContent = '--'; btnConfirm.textContent = 'ยืนยัน'; btnConfirm.disabled = false; }
