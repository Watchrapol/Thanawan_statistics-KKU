// === ใส่ค่าโปรเจกต์ Supabase ของอุ้ย ===
const SUPABASE_URL = "https://uyhhxexhagbcwdtoanly.supabase.co";     // Settings → API → Project URL
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5aGh4ZXhoYWdiY3dkdG9hbmx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MzEyODksImV4cCI6MjA3MzUwNzI4OX0.p0LeCTzk5T1LKqO7IGBmtH7jKwumy_0vxc-FXKZpRz8";                   // Settings → API → anon public key
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== Helpers =====
const $ = s => document.querySelector(s);
const fEmail = $('#f-email'), fOtp = $('#f-otp'), app = $('#app');
const msgEl = $('#msg');

function msg({ text = "", cls = "" } = {}) {
    msgEl.hidden = false; msgEl.className = `notice ${cls}`; msgEl.textContent = text;
}
function clearMsg() { msgEl.hidden = true; msgEl.textContent = ""; }
function setLoading(btn, on) {
    btn.classList.toggle('is-loading', on);
    btn.disabled = on;
}
let loginEmail = "", cooldown = 0, timerId = null;
function startCooldown(sec) {
    cooldown = sec;
    if (timerId) clearInterval(timerId);
    const btn = fEmail.querySelector('button[type=submit]');
    timerId = setInterval(() => {
        cooldown--;
        if (cooldown <= 0) {
            clearInterval(timerId); timerId = null;
            btn.textContent = 'ส่งรหัส OTP';
            btn.disabled = false;
            return;
        }
        btn.textContent = `ส่งใหม่ใน ${cooldown}s`;
        btn.disabled = true;
    }, 1000);
}

// ===== Boot =====
(async function boot() {
    const { data: { user } } = await sb.auth.getUser();
    if (user) return showDashboard(user);
    fEmail.hidden = false; fOtp.hidden = true; app.hidden = true;
})();

// ===== ขอ OTP =====
fEmail.addEventListener('submit', async (e) => {
    e.preventDefault(); clearMsg();
    const btn = e.target.querySelector('button[type=submit]');
    const email = new FormData(fEmail).get('email').trim();
    if (!email) return;

    // (ทางเลือก) จำกัดโดเมน: comment ทิ้งถ้าไม่ต้องการ
    // if (!/@kku\.ac\.th$/i.test(email)) return msg({text:'กรุณาใช้อีเมล @kku.ac.th', cls:'notice--warn'});

    loginEmail = email;
    setLoading(btn, true);
    const { error } = await sb.auth.signInWithOtp({
        email,
        options: {
            emailRedirectTo: location.origin + location.pathname, // กลับหน้าเดิมเมื่อกดยืนยันลิงก์
            shouldCreateUser: true
        }
    });
    setLoading(btn, false);

    if (error) return msg({ text: 'ส่งรหัสไม่สำเร็จ: ' + error.message, cls: 'notice--err' });

    fEmail.hidden = true;
    fOtp.hidden = false;
    msg({ text: 'ส่งรหัส 6 หลักไปที่อีเมลแล้ว กรุณาตรวจสอบ', cls: 'notice--ok' });
    startCooldown(60);
});

// ===== ยืนยัน OTP =====
fOtp.addEventListener('submit', async (e) => {
    e.preventDefault(); clearMsg();
    const btn = e.target.querySelector('button[type=submit]');
    const code = new FormData(fOtp).get('code').trim();
    if (!/^\d{6}$/.test(code)) return msg({ text: 'กรุณากรอกรหัส 6 หลักให้ถูกต้อง', cls: 'notice--warn' });

    setLoading(btn, true);
    const { error } = await sb.auth.verifyOtp({
        email: loginEmail,
        token: code,
        type: 'email'
    });
    setLoading(btn, false);

    if (error) return msg({ text: 'รหัสไม่ถูกต้องหรือหมดอายุ', cls: 'notice--err' });

    const { data: { user } } = await sb.auth.getUser();
    showDashboard(user);
});

// ย้อนกลับ
$('#btn-back').onclick = () => {
    clearMsg();
    if (timerId) clearInterval(timerId);
    fOtp.hidden = true; fEmail.hidden = false;
};

// ออกจากระบบ
$('#signout').onclick = async () => {
    await sb.auth.signOut();
    location.reload();
};

// ===== แดชบอร์ด =====
async function showDashboard(user) {
    fEmail.hidden = true; fOtp.hidden = true; app.hidden = false; clearMsg();

    // 1) ข้อมูลนักศึกษา
    const { data: me } = await sb
        .from('students')
        .select('id, student_no, first_name, last_name, email')
        .eq('email', user.email)
        .maybeSingle();

    if (!me) {
        $('#who').innerHTML = `
      <div class="card">
        <h3>ไม่พบข้อมูลของอีเมลนี้</h3>
        <p class="muted">กรุณาติดต่ออาจารย์เพื่อเพิ่มอีเมลในระบบ: <span class="code">${user.email}</span></p>
      </div>`;
        $('#courses').innerHTML = '';
        return;
    }

    $('#who').innerHTML = `
    <div class="card">
      <h3>${me.first_name} ${me.last_name} <span class="muted">(${me.student_no})</span></h3>
      <div class="muted">${me.email}</div>
    </div>`;

    // 2) รายวิชาที่ลงทะเบียน
    const { data: enrolls } = await sb
        .from('enrollments')
        .select('course_id')
        .eq('student_id', me.id);

    const courseIds = (enrolls || []).map(x => x.course_id);
    if (!courseIds.length) {
        $('#courses').innerHTML = `<div class="muted">ยังไม่มีรายวิชาที่ลงทะเบียน</div>`;
        return;
    }

    const { data: courses } = await sb
        .from('courses')
        .select('id, code, title_th, title_en')
        .in('id', courseIds);

    $('#courses').innerHTML = (courses || []).map(c => `
    <article class="card">
      <h4>${c.code}</h4>
      <p class="muted">${c.title_th || c.title_en || ''}</p>
      <button class="btn btn--outline btn--sm" onclick="openCourse(${c.id}, '${c.code}', ${me.id})">ดูคะแนน</button>
    </article>
  `).join('');
    // ถ้าเปิดหน้าด้วย ?course=SC602001 ให้เปิดอัตโนมัติ
    const want = new URLSearchParams(location.search).get('course');
    if (want) {
        const hit = (courses || []).find(c => c.code.toUpperCase() === want.toUpperCase());
        if (hit) openCourse(hit.id, hit.code, me.id);
    }
}

// รายละเอียดคะแนนของวิชา
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
        const w = a.weight || 0;
        total += pct * w;
        return `<tr>
      <td>${a.name}</td>
      <td class="right">${(a.weight || 0).toFixed(1)}%</td>
      <td class="right">${sc}</td>
      <td class="right">/${a.max_score}</td>
      <td class="right">${(pct * 100).toFixed(1)}%</td>
    </tr>`;
    }).join('');

    const { data: course } = await sb
        .from('courses')
        .select('grade_rules')
        .eq('id', courseId)
        .single();

    let letter = '-';
    try {
        const rules = course?.grade_rules ? JSON.parse(course.grade_rules) : {};
        const pairs = Object.entries(rules).sort((a, b) => b[1] - a[1]);
        const found = pairs.find(([g, cut]) => total >= cut);
        letter = found ? found[0] : '-';
    } catch { }

    $('#course-detail').innerHTML = `
    <div class="card">
      <h3>${code} — รายละเอียดคะแนน</h3>
      <div class="table-wrap">
        <table style="width:100%; border-collapse:collapse">
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
                <tr><td colspan="4" align="right"><b>เกรด</b></td>
                <td class="right"><span class="pill pill--grade">${letter}</span></td></tr>
            </tfoot>
        </table>
      </div>
    </div>`;
}
