/* ===== course_info.js — Modal ข้อมูลรายวิชา (โหมด B: เก็บ assessment ไว้ใน course_infos.assessment JSONB) =====
   ต้องมี window.sb (จาก admin.js: window.sb = sb)
   - ไม่ใช้ตาราง public.assessments
   - course_infos คีย์คือ id (เท่ากับ id ของการ์ดคอร์สที่กด)
*/
(function () {
    // ---------- utils ----------
    const $ = (s, el = document) => el.querySelector(s);
    const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
    const sb = window.sb;
    const toNum = (v) => { const s = String(v ?? '').trim(); if (s === '') return null; const n = Number(s); return Number.isFinite(n) ? n : null; };

    // ---------- ปุ่มบนการ์ด ----------
    function injectButtons() {
        const grid = document.getElementById('grid-courses');
        if (!grid) return;
        grid.querySelectorAll('.course .actions').forEach(act => {
            if (act.querySelector('[data-act="info"]')) return;
            const btn = document.createElement('button');
            btn.className = 'btn btn--sm btn--outline';
            btn.dataset.act = 'info';
            btn.textContent = 'ข้อมูลรายวิชา';
            const after = act.querySelector('button[data-act="scores"]');
            after ? after.after(btn) : act.appendChild(btn);
        });
    }
    function bootButtons() {
        const grid = document.getElementById('grid-courses');
        if (!grid) return setTimeout(bootButtons, 60);
        injectButtons();
        const mo = new MutationObserver(injectButtons);
        mo.observe(grid, { childList: true, subtree: true });
        grid.addEventListener('click', onGridClick);
    }
    function onGridClick(ev) {
        const b = ev.target.closest('button[data-act="info"]');
        if (!b) return;
        const id = Number(b.closest('.course')?.dataset.id);
        if (!id) return;
        openInfoModal(id);
    }

    // ---------- Modal ----------
    function openInfoModal(courseId) {
        closeModal('modal-course-info');
        const html = `
    <div class="modal" id="modal-course-info" role="dialog" aria-modal="true">
      <div class="modal__backdrop" data-close></div>
      <div class="modal__panel" role="document" style="width:min(1280px,96vw);height:90vh;overflow:auto">
        <header class="modal__head" style="position:sticky;top:0;background:#fff;z-index:1">
          <h3>ข้อมูลรายวิชา</h3>
          <button class="modal__close" data-close aria-label="ปิด">×</button>
        </header>

        <form id="form-course-info" class="stack" style="padding-bottom:8px">
          <div class="ci-grid" style="display:grid;gap:1rem;grid-template-columns:repeat(2,minmax(0,1fr));">
            <!-- ซ้าย -->
            <section class="card" style="min-height:100%">
              <h4 style="margin:0 0 8px">ข้อมูลรายวิชา</h4>
              <div class="stack">
                <label>ผู้สอน
                  <input class="input" name="instructor" placeholder="เช่น อ.ดร....">
                </label>
                <label>เวลา
                  <input class="input" name="schedule" placeholder="จันทร์, พุธ 9:00–10:30 น.">
                </label>
                <label>สถานที่
                  <input class="input" name="location" placeholder="อาคาร/ห้องเรียน">
                </label>
                <label>เครื่องมือ (คั่นด้วย /)
                  <input class="input" name="tools" placeholder="R / Excel / SPSS / Google Classroom">
                </label>
                <label>คำอธิบายรายวิชา
                  <textarea class="input" name="description" rows="7" placeholder="สรุปคำอธิบายรายวิชา..."></textarea>
                </label>
              </div>
            </section>

            <!-- ขวา -->
            <section class="card" style="min-height:100%">
              <h4 style="margin:0 0 8px">การประเมินผล</h4>
              <div id="assess-rows" class="stack"></div>
              <div class="row" id="assess-actions" style="gap:.5rem">
                <button class="btn" type="button" id="btn-add-assess">+ เพิ่มรายการ</button>
              </div>
              <p class="muted" style="margin-top:4px">ตัวอย่าง: แบบฝึกหัด/งานย่อย 35%, MIDTERM 30%, FINAL 35%</p>

              <h4 style="margin:12px 0 8px">หัวข้อโดยรวม</h4>
              <div id="topics-rows" class="stack"></div>
              <div class="row" style="gap:.5rem">
                <button class="btn" type="button" id="btn-add-topic">+ เพิ่มหัวข้อ</button>
              </div>
            </section>
          </div>

          <footer class="row" style="justify-content:flex-end;gap:.5rem;margin-top:12px">
            <button type="button" class="btn btn--outline" data-close>ยกเลิก</button>
            <button type="submit" class="btn">บันทึก</button>
          </footer>
        </form>
      </div>
    </div>`;
        document.body.insertAdjacentHTML('beforeend', html);

        const modal = $('#modal-course-info');
        modal.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => closeModal('modal-course-info')));
        modal.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal('modal-course-info'); });

        wireModal(modal, courseId);
        loadInfoInto(modal, courseId);
    }
    function closeModal(id) { const m = document.getElementById(id); if (m) m.remove(); }

    // ---------- แถว ----------
    function assessTpl(i, item = {}) {
        const name = esc(item.name || '');
        const weight = item.weight ?? '';
        return `
    <div class="row wrap" data-kind="assess" style="gap:.75rem;align-items:flex-end">
      <label class="w-320">รายการ
        <input class="input" name="assess_name_${i}" value="${name}" placeholder="เช่น แบบฝึกหัด / MIDTERM / FINAL">
      </label>
      <label class="w-120">สัดส่วน (%)
        <input class="input" type="number" step="1" min="0" max="100" name="assess_weight_${i}" value="${weight}">
      </label>
      <button class="btn btn--danger" type="button" data-act="del">ลบ</button>
    </div>`;
    }
    function topicTpl(i, text = '') {
        return `
    <div class="row wrap" data-kind="topic" style="gap:.75rem;align-items:flex-end">
      <label class="w-full">หัวข้อ
        <input class="input" name="topic_${i}" value="${esc(text)}" placeholder="เช่น บทที่ 1 ความรู้เบื้องต้นทางสถิติ">
      </label>
      <button class="btn btn--danger" type="button" data-act="del">ลบ</button>
    </div>`;
    }

    // ---------- โหลดข้อมูล ----------
    async function loadInfoInto(modal, courseId) {
        const form = $('#form-course-info', modal);
        const wrapA = $('#assess-rows', modal);
        const wrapT = $('#topics-rows', modal);

        wrapA.innerHTML = `<div class="muted">กำลังโหลด...</div>`;
        wrapT.innerHTML = ``;

        // ดึงจาก course_infos ด้วย id (ไม่ใช้ course_id)
        const qi = await sb.from('course_infos').select('*').eq('id', courseId).maybeSingle();
        if (qi.error && qi.error.code !== 'PGRST116') { // not found is fine
            wrapA.innerHTML = `<div style="color:#b91c1c" class="muted">โหลดไม่สำเร็จ: ${esc(qi.error.message)}</div>`;
            return;
        }
        const info = qi.data || {};

        form.instructor.value = info.instructor || '';
        form.schedule.value = info.schedule || '';
        form.location.value = info.location || '';
        form.tools.value = info.tools || '';
        form.description.value = info.description || '';

        // assessment จาก JSONB (ignore full)
        const A = Array.isArray(info.assessment) && info.assessment.length
            ? info.assessment.map(x => ({ name: x.name, weight: x.weight }))
            : [
                { name: 'แบบฝึกหัด/งานย่อย', weight: 35 },
                { name: 'MIDTERM', weight: 30 },
                { name: 'FINAL', weight: 35 },
            ];

        wrapA.innerHTML = '';
        A.forEach((it, i) => wrapA.insertAdjacentHTML('beforeend', assessTpl(i, it)));

        // topics
        const T = Array.isArray(info.topics) && info.topics.length
            ? info.topics
            : ['บทที่ 1 ความรู้เบื้องต้นทางสถิติ', 'บทที่ 2 ความน่าจะเป็น'];
        wrapT.innerHTML = '';
        T.forEach((t, i) => wrapT.insertAdjacentHTML('beforeend', topicTpl(i, t)));
    }

    // ---------- ผูก event ----------
    function wireModal(modal, courseId) {
        const form = $('#form-course-info', modal);
        const wrapA = $('#assess-rows', modal);
        const wrapT = $('#topics-rows', modal);

        $('#btn-add-assess', modal).onclick = () => {
            const i = wrapA.querySelectorAll('[data-kind="assess"]').length;
            wrapA.insertAdjacentHTML('beforeend', assessTpl(i, {}, false));
        };
        $('#btn-add-topic', modal).onclick = () => {
            const i = wrapT.querySelectorAll('[data-kind="topic"]').length;
            wrapT.insertAdjacentHTML('beforeend', topicTpl(i, ''));
        };
        modal.addEventListener('click', (ev) => {
            const del = ev.target.closest('button[data-act="del"]'); if (!del) return;
            del.closest('[data-kind]')?.remove();
        });

        form.onsubmit = async (e) => {
            e.preventDefault();

            // เก็บ assessment จาก DOM -> array JSON
            const rowsA = [...wrapA.querySelectorAll('[data-kind="assess"]')];
            const assessment = rowsA.map((row, i) => ({
                name: row.querySelector(`[name="assess_name_${i}"]`)?.value?.trim() || '',
                weight: toNum(row.querySelector(`[name="assess_weight_${i}"]`)?.value),
            })).filter(r => r.name || r.weight != null);

            const topics = [...wrapT.querySelectorAll('input[name^="topic_"]')]
                .map(inp => inp.value.trim()).filter(Boolean);

            // upsert เข้า course_infos โดยใช้ id = courseId
            const payload = {
                id: courseId,
                instructor: form.instructor.value.trim() || null,
                schedule: form.schedule.value.trim() || null,
                location: form.location.value.trim() || null,
                tools: form.tools.value.trim() || null,
                description: form.description.value.trim() || null,
                assessment,  // <-- เก็บใน JSONB
                topics,
                updated_at: new Date().toISOString(),
            };

            const res = await sb.from('course_infos').upsert(payload, { onConflict: 'id' });
            if (res.error) { alert('บันทึกไม่สำเร็จ: ' + res.error.message); return; }
            alert('บันทึกข้อมูลรายวิชาเรียบร้อย');
            closeModal('modal-course-info');
        };
    }

    // ---------- boot ----------
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootButtons);
    } else {
        bootButtons();
    }
})();
