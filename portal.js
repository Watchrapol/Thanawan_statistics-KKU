/* ===== Supabase config =====
 * ใส่ค่าโปรเจกต์ของอุ้ยเองตรงนี้
 * เช่น:
 *  const SUPABASE_URL = "https://xxxxxx.supabase.co";
 *  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....";
 */
const SUPABASE_URL = "https://uyhhxexhagbcwdtoanly.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5aGh4ZXhoYWdiY3dkdG9hbmx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MzEyODksImV4cCI6MjA3MzUwNzI4OX0.p0LeCTzk5T1LKqO7IGBmtH7jKwumy_0vxc-FXKZpRz8";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ตั้งเวลา (วินาที) */
const RESEND_WINDOW = 60;   // ส่ง OTP ใหม่ได้ในกี่วินาที
const OTP_WINDOW = 120;  // ต้องใส่รหัสภายในกี่วินาที

/* ===== DOM ===== */
const $ = s => document.querySelector(s);
const portalEl = $('.portal');
const fEmail = $('#f-email');
const fOtp = $('#f-otp');
const app = $('#app');

const btnSend = $('#btn-send');
const btnConfirm = $('#btn-confirm');
const btnBack = $('#btn-back');
const btnOut = $('#signout');

const msgEmail = $('#msg-email');
const msgOtp = $('#msg-otp');
const otpCount = $('#otp-count');

let loginEmail = "";
let resendTimer = null;
let otpTimer = null;

/* ===== Mode switching ===== */
function toDashboardMode() {
    if (!portalEl) return;
    portalEl.classList.remove('portal--compact');
    portalEl.classList.add('is-dashboard');
}
function toCompactMode() {
    if (!portalEl) return;
    portalEl.classList.remove('is-dashboard');
    portalEl.classList.add('portal--compact');
}

/* ===== Boot ===== */
boot();
async function boot() {
    const { data: { user } } = await sb.auth.getUser();
    if (user) { showDashboard(user); return; }
    // ยังไม่ล็อกอิน
    toCompactMode();
    fEmail.hidden = false; fOtp.hidden = true; app.hidden = true;
}

/* ===== ส่ง OTP ===== */
fEmail.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = new FormData(fEmail).get('email').trim();
    if (!email) { return; }
    loginEmail = email;

    btnSend.classList.add('is-loading');

    const { error } = await sb.auth.signInWithOtp({
        email,
        options: {
            shouldCreateUser: true,
            emailRedirectTo: location.origin + location.pathname
        }
    });

    btnSend.classList.remove('is-loading');

    if (error) {
        showMsg(msgEmail, 'ส่งรหัสไม่สำเร็จ: ' + error.message, 'err');
        return;
    }
    showMsg(msgEmail, 'ส่งรหัส 6 หลักไปที่อีเมลแล้ว กรุณาตรวจสอบ', 'ok');

    // ไปขั้น OTP + เริ่มนับเวลา
    fEmail.hidden = true; fOtp.hidden = false;
    startResendCountdown();
    startOtpCountdown();
});

/* ===== ยืนยัน OTP ===== */
fOtp.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = new FormData(fOtp).get('code').trim();
    if (!/^\d{6}$/.test(code)) { showMsg(msgOtp, 'กรุณากรอกรหัส 6 หลักให้ถูกต้อง', 'err'); return; }

    btnConfirm.classList.add('is-loading');

    const { error } = await sb.auth.verifyOtp({
        email: loginEmail,
        token: code,
        type: 'email',
    });

    btnConfirm.classList.remove('is-loading');

    if (error) { showMsg(msgOtp, 'รหัสไม่ถูกต้องหรือหมดอายุ', 'err'); return; }

    stopOtpCountdown();
    const { data: { user } } = await sb.auth.getUser();
    showDashboard(user);
});

/* ย้อนกลับไปขอรหัสใหม่ */
btnBack.addEventListener('click', () => {
    fOtp.hidden = true; fEmail.hidden = false;
    stopResendCountdown(); stopOtpCountdown();
    msgEmail.hidden = true; msgOtp.hidden = true;
    btnConfirm.textContent = 'ยืนยัน';
});

/* ออกจากระบบ */
btnOut?.addEventListener('click', async () => {
    await sb.auth.signOut();
    toCompactMode();
    location.reload();
});

/* ===== Dashboard ===== */
async function showDashboard(user) {
    toDashboardMode();
    fEmail.hidden = true; fOtp.hidden = true; app.hidden = false;

    // เปลี่ยนโหมดการจัดวางเป็นแดชบอร์ด 2 คอลัมน์
    portalEl.classList.remove('portal--compact');
    portalEl.classList.add('is-dashboard');
    portalEl.classList.remove('has-score');          // เริ่มต้นยังไม่มีการ์ดคะแนน

    // 1) ข้อมูลผู้เข้าระบบ
    const { data: me } = await sb
        .from('students')
        .select('id, student_no, first_name, last_name, email')
        .eq('email', user.email)
        .maybeSingle();

    const $who = $('#card-who'), $courses = $('#card-courses'), $score = $('#card-score');

    if (!me) {
        $who.innerHTML = `
      <div class="card">
        <h3>ไม่พบข้อมูลของอีเมลนี้</h3>
        <p class="muted">กรุณาติดต่ออาจารย์: <span class="code">${user.email}</span></p>
      </div>`;
        $courses.innerHTML = ''; $score.innerHTML = ''; return;
    }

    $who.innerHTML = `
    <div class="card">
      <h3 style="margin:0 0 6px">รายละเอียดนักศึกษา</h3>
      <div><b>${me.first_name} ${me.last_name}</b> <span class="muted">(${me.student_no})</span></div>
      <div class="muted">${me.email}</div>
    </div>`;

    // 2) รายวิชาที่ลงทะเบียน
    const { data: enrolls } = await sb.from('enrollments').select('course_id').eq('student_id', me.id);
    const courseIds = (enrolls || []).map(x => x.course_id);

    if (!courseIds.length) {
        $courses.innerHTML = `<div class="card"><h3 style="margin:0 0 6px">รายวิชาที่ลงทะเบียน</h3><div class="muted">ยังไม่มีรายวิชา</div></div>`;
        $score.innerHTML = ''; return;
    }

    const { data: courses } = await sb
        .from('courses')
        .select('id, code, title_th, title_en')
        .in('id', courseIds);

    $courses.innerHTML = `
    <div class="card">
      <h3 style="margin:0 0 8px">รายวิชาที่ลงทะเบียน</h3>
      <div class="courses-grid">
        ${(courses || []).map(c => `
          <article class="card">
            <div style="font-weight:700;margin-bottom:4px">${c.code}</div>
            <div class="muted" style="margin-bottom:8px">${c.title_th || c.title_en || ''}</div>
            <button class="btn btn--outline btn--sm" onclick="openCourse(${c.id}, '${c.code}', ${me.id})">ดูคะแนน</button>
          </article>
        `).join('')}
      </div>
    </div>`;

    // 3) เคลียร์การ์ดคะแนน & กลับเป็น 2 คอลัมน์
    $score.innerHTML = '';
    portalEl.classList.remove('has-score');
}
window.showDashboard = showDashboard; // เผื่อเรียกซ้ำ

// ===== เปิดการ์ดคะแนน (เพิ่มคอลัมน์ที่ 3) =====
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
    let total = 0;
    const rows = (assess || []).map(a => {
        const sc = byAid[a.id] ?? 0;
        const pct = a.max_score ? (sc / a.max_score) : 0;
        total += (a.weight || 0) * pct;
        return `<tr>
      <td>${a.name}</td>
      <td class="right">${(a.weight || 0).toFixed(1)}%</td>
      <td class="right">${sc}</td>
      <td class="right">/${a.max_score}</td>
      <td class="right">${(pct * 100).toFixed(1)}%</td>
    </tr>`;
    }).join('');

    const { data: course } = await sb.from('courses').select('grade_rules').eq('id', courseId).single();
    let letter = '-';
    try {
        const rules = course?.grade_rules ? JSON.parse(course.grade_rules) : {};
        const pairs = Object.entries(rules).sort((a, b) => b[1] - a[1]);
        const found = pairs.find(([g, cut]) => total >= cut);
        letter = found ? found[0] : '-';
    } catch { }

    // แสดงการ์ดคะแนนในคอลัมน์ที่ 3 และเปิดโหมด 3 คอลัมน์
    document.querySelector('#card-score').innerHTML = `
    <div class="card">
      <h3 style="margin:0 0 8px">${code} — คะแนนรวม</h3>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th align="left">รายการ</th>
              <th class="right">สัดส่วน</th>
              <th class="right">ได้</th>
              <th class="right"></th>
              <th class="right">% ย่อย</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr><td colspan="4" align="right"><b>รวม</b></td><td class="right"><b>${total.toFixed(2)}%</b></td></tr>
            <tr><td colspan="4" align="right"><b>เกรด</b></td><td class="right"><span class="pill pill--grade">${letter}</span></td></tr>
          </tfoot>
        </table>
      </div>
    </div>`;
    portalEl.classList.add('has-score'); // <— สลับเป็น 3 คอลัมน์
}

/* ===== Helpers ===== */
function showMsg(el, text, type = 'ok') {
    el.textContent = text;
    el.className = 'notice notice--' + (type === 'err' ? 'err' : 'ok');
    el.hidden = false;
}

/* นับเวลาส่งใหม่ */
function startResendCountdown() {
    let left = RESEND_WINDOW;
    btnSend.textContent = `ส่งใหม่ใน ${left}s`;
    btnSend.disabled = true;

    clearInterval(resendTimer);
    resendTimer = setInterval(() => {
        left -= 1;
        btnSend.textContent = left > 0 ? `ส่งใหม่ใน ${left}s` : 'ส่งรหัส OTP';
        if (left <= 0) {
            clearInterval(resendTimer);
            btnSend.disabled = false;
        }
    }, 1000);
}
function stopResendCountdown() {
    clearInterval(resendTimer);
    btnSend.textContent = 'ส่งรหัส OTP';
    btnSend.disabled = false;
}

/* นับเวลา OTP + เปลี่ยนข้อความปุ่มยืนยันแบบเรียลไทม์ */
function startOtpCountdown() {
    let left = OTP_WINDOW;
    otpCount.textContent = left;
    btnConfirm.textContent = `ยืนยัน (${left}s)`;
    btnConfirm.disabled = false;

    clearInterval(otpTimer);
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

/* ให้ปุ่ม “ดูคะแนน” ที่ render แบบ HTML inline เรียกใช้ได้ */
window.openCourse = openCourse;
