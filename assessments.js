/* assessments.js — จัดการแท็บ "องค์ประกอบคะแนน" ให้ทำงานแยกจาก admin.js
   สมมติคอลัมน์ในตาราง assessments: id, course_id, name, weight, max_score
   (ถ้าชื่อคอลัมน์ของคุณต่างกัน ให้เปลี่ยนในส่วน select/update/insert ตามจริง) */

/* ====== Short DOM helpers (ใช้ร่วมกับ admin.js ได้) ====== */
const A$ = (s, el = document) => el.querySelector(s);
const A$$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const Aesc = (s) => String(s ?? "").replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

/* ====== API หลักที่ admin.js จะเรียก ======
   admin.js เรียก loadAssess(courseId, containerEl) อยู่แล้ว
   เราจึงประกาศเป็น global บน window ให้แท็บนี้ทำงานแทนฟังก์ชันเดิม */
window.loadAssess = async function loadAssess(courseId, containerEl) {
    const panel = A$('.tabpanel[data-panel="assess"]', containerEl);
    if (!panel) return;

    // วางแถบเครื่องมือเล็ก ๆ ด้านบน (ถ้ายังไม่มี)
    ensureAssessToolbar(panel);

    // โหลดรายการจากฐานข้อมูล
    panel._assessState = panel._assessState || {};
    const st = panel._assessState;
    st.courseId = courseId;
    st.editId = null;

    panel.querySelector('#tbody-assess').innerHTML = `<tr><td colspan="4" class="muted">กำลังโหลด...</td></tr>`;

    const { data, error } = await sb
        .from('assessments')
        .select('id, course_id, name, weight, max_score')
        .eq('course_id', courseId)
        .order('id', { ascending: true });

    if (error) {
        panel.querySelector('#tbody-assess').innerHTML = `<tr><td colspan="4" class="muted">โหลดไม่สำเร็จ: ${Aesc(error.message)}</td></tr>`;
        return;
    }

    st.rows = (data || []).map(r => ({
        id: r.id, course_id: r.course_id,
        name: r.name ?? '',
        weight: r.weight ?? 0,
        max_score: r.max_score ?? 0,
    }));

    renderAssessTable(panel);
};

/* ====== วางแถบเครื่องมือ/ปุ่มเพิ่ม ====== */
function ensureAssessToolbar(panel) {
    if (panel._toolbarReady) return;
    const wrap = document.createElement('div');
    wrap.className = 'row';
    wrap.style.gap = '.5rem';
    wrap.style.margin = '.25rem 0 8px';
    wrap.innerHTML = `
    <button class="btn" id="btn-add-assess-modal">+ เพิ่มองค์ประกอบ</button>
    <span id="assess-sum" class="muted"></span>
  `;
    panel.insertBefore(wrap, panel.querySelector('.table-wrap'));

    // ผูกปุ่ม "เพิ่มองค์ประกอบ"
    A$('#btn-add-assess-modal', panel)?.addEventListener('click', () => openAddAssessModal(panel));

    // ผูกคลิกบนตาราง (edit/save/cancel/delete)
    const tbody = panel.querySelector('#tbody-assess');
    tbody.addEventListener('click', async (ev) => {
        const btn = ev.target.closest('button[data-act]');
        if (!btn) return;
        const tr = btn.closest('tr');
        const id = Number(tr?.dataset.id || 0);
        const st = panel._assessState;

        if (btn.dataset.act === 'edit') {
            st.editId = id; renderAssessTable(panel);
        }
        else if (btn.dataset.act === 'cancel') {
            st.editId = null; renderAssessTable(panel);
        }
        else if (btn.dataset.act === 'save') {
            const name = tr.querySelector('input[data-field="name"]')?.value?.trim() || '';
            const weight = parseFloat(tr.querySelector('input[data-field="weight"]')?.value ?? '0');
            const max_score = parseFloat(tr.querySelector('input[data-field="max_score"]')?.value ?? '0');

            if (!name) { alert('กรอกชื่อองค์ประกอบก่อน'); return; }
            if (!Number.isFinite(weight) || !Number.isFinite(max_score)) { alert('ค่าน้ำหนัก/คะแนนเต็มต้องเป็นตัวเลข'); return; }

            const { error } = await sb.from('assessments').update({ name, weight, max_score }).eq('id', id);
            if (error) return alert('บันทึกไม่สำเร็จ: ' + error.message);

            // อัปเดต state
            const row = st.rows.find(r => r.id === id);
            if (row) { row.name = name; row.weight = weight; row.max_score = max_score; }
            st.editId = null;
            renderAssessTable(panel);
        }
        else if (btn.dataset.act === 'del') {
            if (!confirm('ลบองค์ประกอบนี้? (คะแนนที่เกี่ยวข้องจะถูกลบด้วย)')) return;

            // ลบ scores ของ assessment นี้ก่อน (กัน FK)
            await sb.from('scores').delete().eq('assessment_id', id);
            const { error } = await sb.from('assessments').delete().eq('id', id);
            if (error) return alert('ลบไม่สำเร็จ: ' + error.message);

            st.rows = st.rows.filter(r => r.id !== id);
            renderAssessTable(panel);
        }
    });

    panel._toolbarReady = true;
}

/* ====== Render table ====== */
function renderAssessTable(panel) {
    const st = panel._assessState || { rows: [] };
    const tbody = panel.querySelector('#tbody-assess');

    if (!st.rows.length) {
        tbody.innerHTML = `<tr><td colspan="4" class="muted">ยังไม่มีองค์ประกอบ</td></tr>`;
    } else {
        tbody.innerHTML = st.rows.map(r => {
            if (st.editId === r.id) {
                // แถวโหมดแก้ไข
                return `
        <tr data-id="${r.id}">
          <td><input class="input input--sm" data-field="name"   value="${Aesc(r.name)}"></td>
          <td class="right"><input class="input input--sm" data-field="weight" type="number" step="0.01" value="${Aesc(r.weight)}"></td>
          <td class="right"><input class="input input--sm" data-field="max_score"   type="number" step="0.01" value="${Aesc(r.max_score)}"></td>
          <td class="right">
            <button class="btn btn--sm" data-act="save">บันทึก</button>
            <button class="btn btn--outline btn--sm" data-act="cancel">ยกเลิก</button>
          </td>
        </tr>`;
            }
            // แถวปกติ
            return `
      <tr data-id="${r.id}">
        <td>${Aesc(r.name)}</td>
        <td class="right">${Aesc(r.weight)}</td>
        <td class="right">${Aesc(r.max_score)}</td>
        <td class="right">
          <button class="btn btn--outline btn--sm" data-act="edit">แก้ไข</button>
          <button class="btn btn--outline btn--sm" data-act="del">ลบ</button>
        </td>
      </tr>`;
        }).join('');
    }

    // สรุปสัดส่วนรวม
    const sum = (st.rows || []).reduce((a, r) => a + (Number(r.weight) || 0), 0);
    const badge = A$('#assess-sum', panel);
    if (badge) {
        const ok = Math.abs(sum - 100) < 0.001; // ใกล้ 100 ถือว่าโอเค
        badge.textContent = `สัดส่วนรวม: ${sum.toFixed(2)}%` + (ok ? '' : ' (ควรรวมได้ 100%)');
        badge.style.color = ok ? '' : '#b91c1c';
    }
}

/* ====== Modal: เพิ่มองค์ประกอบ ====== */
function openAddAssessModal(panel) {
    closeAssessModal('modal-add-assess');
    const html = `
  <div class="modal" id="modal-add-assess" role="dialog" aria-modal="true">
    <div class="modal__backdrop" data-close></div>
    <div class="modal__panel" role="document">
      <header class="modal__head">
        <h3>เพิ่มองค์ประกอบคะแนน</h3>
        <button class="modal__close" data-close aria-label="ปิด">×</button>
      </header>
      <form id="form-add-assess" class="stack">
        <label>ชื่อรายการ*
          <input class="input" name="name" required placeholder="เช่น Quiz 1">
        </label>
        <div class="row wrap" style="gap:.75rem">
          <label class="w-200">สัดส่วน (%)
            <input class="input" name="weight" type="number" step="0.01" placeholder="เช่น 10">
          </label>
          <label class="w-200">คะแนนเต็ม
            <input class="input" name="max_score" type="number" step="0.01" placeholder="เช่น 10">
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

    const modal = document.getElementById('modal-add-assess');
    modal.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => closeAssessModal('modal-add-assess')));
    modal.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAssessModal('modal-add-assess'); });

    const form = document.getElementById('form-add-assess');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const name = (fd.get('name') || '').toString().trim();
        const weight = parseFloat(fd.get('weight') ?? '0');
        const max_score = parseFloat(fd.get('max_score') ?? '0');

        if (!name) { alert('กรอกชื่อรายการก่อน'); return; }
        if (!Number.isFinite(weight) || !Number.isFinite(max_score)) { alert('ค่าน้ำหนัก/คะแนนเต็มต้องเป็นตัวเลข'); return; }

        const st = panel._assessState;
        const { data, error } = await sb.from('assessments')
            .insert({ course_id: st.courseId, name, weight, max_score })
            .select()
            .single();

        if (error) { alert('เพิ่มไม่สำเร็จ: ' + error.message); return; }

        st.rows.push({ id: data.id, course_id: data.course_id, name, weight, max_score });
        closeAssessModal('modal-add-assess');
        renderAssessTable(panel);
    });

    modal.querySelector('input[name="name"]').focus();
}

function closeAssessModal(id) { const m = document.getElementById(id); if (m) m.remove(); }
