/* ===== course_info.js — ข้อมูลรายวิชา (แก้ courses ได้, semester_label เป็น read-only) ===== */
(function () {
    const $ = (s, el = document) => el.querySelector(s);
    const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
    const sb = window.sb;
    const toInt = (v) => { const s = String(v ?? '').trim(); if (s === '') return null; const n = Number(s); return Number.isInteger(n) ? n : null; };
    const toNum = (v) => { const s = String(v ?? '').trim(); if (s === '') return null; const n = Number(s); return Number.isFinite(n) ? n : null; };

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
        grid.addEventListener('click', (ev) => {
            const b = ev.target.closest('button[data-act="info"]'); if (!b) return;
            const id = Number(b.closest('.course')?.dataset.id); if (!id) return;
            openInfoModal(id);
        });
    }

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
              <h4 style="margin:0 0 8px">ข้อมูลหลัก (ตาราง courses)</h4>
              <div class="stack">
                <label>รหัสวิชา
                  <input class="input" name="code" placeholder="เช่น SC602001">
                </label>

                <div class="row wrap" style="gap:.75rem">
                  <label class="w-1/2" style="flex:1 1 280px">ชื่อวิชา (TH)
                    <input class="input" name="title_th" placeholder="เช่น สถิติเบื้องต้น">
                  </label>
                  <label class="w-1/2" style="flex:1 1 280px">ชื่อวิชา (EN)
                    <input class="input" name="title_en" placeholder="Introduction to Statistics">
                  </label>
                </div>

                <div class="row wrap" style="gap:.75rem">
                  <label class="w-140">ภาคเรียน
                    <input class="input" name="term" type="number" min="1" max="3" placeholder="เช่น 1">
                  </label>
                  <label class="w-140">ปี
                    <input class="input" name="year" type="number" min="1900" max="2999" placeholder="เช่น 2025">
                  </label>
                  <label class="w-180">ป้ายเทอม
                    <input class="input" name="semester_label" disabled placeholder="term/year (คำนวณอัตโนมัติ)">
                  </label>
                </div>

                <label>Section
                  <input class="input" name="section" placeholder="เช่น 1 หรือ 1,2">
                </label>

                <div class="muted" style="margin:-4px 0 8px">*ป้ายเทอมเป็นคอลัมน์คำนวณอัตโนมัติจาก term/year</div>

                <hr style="border:none;height:1px;background:#eee;margin:8px 0">

                <h4 style="margin:0 0 8px">ข้อมูลสอนจริง (ตาราง course_infos)</h4>
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
                  <textarea class="input" name="description" rows="6" placeholder="สรุปคำอธิบายรายวิชา..."></textarea>
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

              <h4 style="margin:12px 0 6px">หัวข้อโดยรวม</h4>
              <div class="row" style="justify-content:space-between;align-items:center;margin:-2px 0 6px">
                <div class="muted">หัวข้อ</div>
                <button class="btn" type="button" id="btn-add-topic">+ เพิ่มหัวข้อ</button>
              </div>
              <div id="topics-rows" class="stack"></div>
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

    // ---- templates ----
    function assessTpl(i, item = {}) {
        const name = esc(item.name || ''), weight = item.weight ?? '';
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
    <div class="row wrap" data-kind="topic" style="gap:.5rem;align-items:center">
      <span class="topic-idx" style="min-width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;border-radius:999px;background:#eef2ff">${i + 1}</span>
      <input class="input" name="topic_${i}" value="${esc(text)}" placeholder="เช่น บทที่ ${i + 1} ..." style="flex:1 1 360px">
      <button class="btn btn--danger" type="button" data-act="del">ลบ</button>
    </div>`;
    }
    function renumberTopics(wrapT) {
        [...wrapT.querySelectorAll('[data-kind="topic"]')].forEach((row, idx) => {
            row.querySelector('.topic-idx').textContent = idx + 1;
            const inp = row.querySelector('input[name^="topic_"]');
            if (inp) { inp.name = `topic_${idx}`; inp.placeholder = `เช่น บทที่ ${idx + 1} ...`; }
        });
    }

    // ---- load ----
    async function loadInfoInto(modal, courseId) {
        const form = $('#form-course-info', modal);
        const wrapA = $('#assess-rows', modal);
        const wrapT = $('#topics-rows', modal);
        wrapA.innerHTML = `<div class="muted">กำลังโหลด...</div>`; wrapT.innerHTML = ``;

        // courses
        const qc = await sb.from('courses')
            .select('code,title_th,title_en,term,year,semester_label,section')
            .eq('id', courseId).maybeSingle();
        if (qc.error && qc.error.code !== 'PGRST116') {
            wrapA.innerHTML = `<div style="color:#b91c1c" class="muted">โหลด courses ไม่สำเร็จ: ${esc(qc.error.message)}</div>`; return;
        }
        const c = qc.data || {};
        form.code.value = c.code || '';
        form.title_th.value = c.title_th || '';
        form.title_en.value = c.title_en || '';
        form.term.value = c.term != null ? String(c.term) : '';
        form.year.value = c.year != null ? String(c.year) : '';
        form.semester_label.value = c.semester_label || (c.term != null && c.year != null ? `${c.term}/${c.year}` : '');
        form.section.value = c.section || '';

        // auto-preview semester label when term/year change
        const recompute = () => {
            const t = toInt(form.term.value), y = toInt(form.year.value);
            form.semester_label.value = (t != null && y != null) ? `${t}/${y}` : '';
        };
        form.term.addEventListener('input', recompute);
        form.year.addEventListener('input', recompute);

        // course_infos
        const qi = await sb.from('course_infos').select('*').eq('course_id', courseId).maybeSingle();
        if (qi.error && qi.error.code !== 'PGRST116') {
            wrapA.innerHTML = `<div style="color:#b91c1c" class="muted">โหลด course_infos ไม่สำเร็จ: ${esc(qi.error.message)}</div>`; return;
        }
        const info = qi.data || {};
        form.instructor.value = info.instructor || '';
        form.schedule.value = info.schedule || '';
        form.location.value = info.location || '';
        form.tools.value = info.tools || '';
        form.description.value = info.description || '';

        const A = Array.isArray(info.assessment) && info.assessment.length
            ? info.assessment.map(x => ({ name: x.name, weight: x.weight }))
            : [{ name: 'แบบฝึกหัด/งานย่อย', weight: 35 }, { name: 'MIDTERM', weight: 30 }, { name: 'FINAL', weight: 35 }];
        wrapA.innerHTML = ''; A.forEach((it, i) => wrapA.insertAdjacentHTML('beforeend', assessTpl(i, it)));

        const T = Array.isArray(info.topics) && info.topics.length
            ? info.topics : ['บทที่ 1 ความรู้เบื้องต้นทางสถิติ', 'บทที่ 2 ความน่าจะเป็น'];
        wrapT.innerHTML = ''; T.forEach((t, i) => wrapT.insertAdjacentHTML('beforeend', topicTpl(i, t)));
        renumberTopics(wrapT);
    }

    // ---- wire ----
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
            renumberTopics(wrapT);
        };
        modal.addEventListener('click', (ev) => {
            const del = ev.target.closest('button[data-act="del"]'); if (!del) return;
            const row = del.closest('[data-kind]'); if (!row) return;
            const isTopic = row.dataset.kind === 'topic'; row.remove(); if (isTopic) renumberTopics(wrapT);
        });

        form.onsubmit = async (e) => {
            e.preventDefault();

            // UPDATE courses (ไม่ส่ง semester_label เพราะเป็น generated/ห้ามอัปเดต)
            const coursePayload = {
                code: form.code.value.trim() || null,
                title_th: form.title_th.value.trim() || null,
                title_en: form.title_en.value.trim() || null,
                term: toInt(form.term.value),
                year: toInt(form.year.value),
                section: form.section.value.trim() || null
                // ← อย่าส่ง semester_label
            };
            const up1 = await sb.from('courses').update(coursePayload).eq('id', courseId);
            if (up1.error) { alert('บันทึกข้อมูลหลัก (courses) ไม่สำเร็จ: ' + up1.error.message); return; }

            // course_infos
            const rowsA = [...wrapA.querySelectorAll('[data-kind="assess"]')];
            const assessment = rowsA.map((row, i) => ({
                name: row.querySelector(`[name="assess_name_${i}"]`)?.value?.trim() || '',
                weight: toNum(row.querySelector(`[name="assess_weight_${i}"]`)?.value),
            })).filter(r => r.name || r.weight != null);

            const topics = [...wrapT.querySelectorAll('input[name^="topic_"]')]
                .map(inp => inp.value.trim()).filter(Boolean);

            const infosPayload = {
                course_id: courseId,
                instructor: form.instructor.value.trim() || null,
                schedule: form.schedule.value.trim() || null,
                location: form.location.value.trim() || null,
                tools: form.tools.value.trim() || null,
                description: form.description.value.trim() || null,
                assessment, topics,
                updated_at: new Date().toISOString()
            };
            const up2 = await sb.from('course_infos').upsert(infosPayload, { onConflict: 'course_id' });
            if (up2.error) { alert('บันทึกข้อมูลสอนจริง (course_infos) ไม่สำเร็จ: ' + up2.error.message); return; }

            alert('บันทึกข้อมูลรายวิชาเรียบร้อย');
            closeModal('modal-course-info');
        };
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootButtons);
    else bootButtons();
})();
