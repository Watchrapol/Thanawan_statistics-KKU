/* ===== announcements.js =====
   Announcements UI (แยกจาก admin.js)
   ใช้ global `sb` (Supabase client) ที่ประกาศไว้ใน admin.js
*/
(function () {
    const $ = (s, el = document) => el.querySelector(s);
    const esc = (s) =>
        String(s ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
    const nl = (s) => esc(s).replace(/\n/g, "<br>");

    // ---------- Public API ----------
    const Announcements = {
        async mount(container, courseId) {
            // สร้าง shell ส่วนประกาศ
            container.innerHTML = `
        <div class="row" style="justify-content:space-between;align-items:center;gap:.5rem">
          <h3 style="margin:0">ประกาศของรายวิชา</h3>
          <button class="btn" id="btn-add-ann">เพิ่มประกาศ</button>
        </div>
        <div id="list-ann" class="stack" style="margin-top:10px">
          <div class="muted">กำลังโหลด...</div>
        </div>
      `;

            // wire ปุ่มเพิ่ม
            $("#btn-add-ann", container)?.addEventListener("click", () => openAnnModal(courseId, container));

            // โหลดรายการ
            await reloadList(container, courseId);
        }
    };

    async function reloadList(container, courseId) {
        const list = $("#list-ann", container);
        list.innerHTML = `<div class="muted">กำลังโหลด...</div>`;

        const { data, error } = await sb
            .from("announcements")
            .select("id, title_th, title_en, detail_th, detail_en, announce_date, posted_at, pinned")
            .eq("course_id", courseId)
            .order("pinned", { ascending: false })
            .order("posted_at", { ascending: false });

        if (error) {
            list.innerHTML = `<div class="muted">โหลดประกาศไม่สำเร็จ: ${esc(error.message)}</div>`;
            return;
        }

        if (!data?.length) {
            list.innerHTML = `<div class="muted">ยังไม่มีประกาศ</div>`;
            return;
        }

        list.innerHTML = data
            .map(
                (a) => `
      <article class="card">
        <div class="row" style="justify-content:space-between;align-items:start;gap:.5rem">
          <div>
            ${a.pinned ? `<span class="pill">ปักหมุด</span> ` : ``}
            <b>${esc(a.title_th)}</b>
            <div class="muted" style="margin-top:2px">
              วันที่ประกาศ: ${new Date(a.posted_at).toLocaleString("th-TH")}
              • วันที่บนการ์ด: ${new Date(a.announce_date).toLocaleDateString("th-TH")}
            </div>
            ${a.detail_th ? `<div style="margin-top:6px">${nl(a.detail_th)}</div>` : ``}
          </div>
          <div class="row" style="gap:.5rem">
            <button class="btn btn--outline btn--sm" data-edit-ann="${a.id}">แก้ไข</button>
            <button class="btn btn--danger btn--sm"  data-del-ann="${a.id}">ลบ</button>
          </div>
        </div>
      </article>
    `
            )
            .join("");

        // delegation: edit / delete
        list.onclick = (ev) => {
            const edit = ev.target.closest("button[data-edit-ann]");
            const del = ev.target.closest("button[data-del-ann]");
            if (!edit && !del) return;

            const id = edit?.dataset.editAnn || del?.dataset.delAnn;
            const dataRow = (data || []).find((x) => x.id === id);
            if (!id || !dataRow) return;

            if (edit) openAnnModal(courseId, container, dataRow);
            if (del) deleteAnnouncement(id, courseId, container);
        };
    }

    // ---------- Modal ----------
    function closeModal(id) {
        const m = document.getElementById(id);
        if (m) m.remove();
    }

    function openAnnModal(courseId, container, existing = null) {
        closeModal("modal-ann");

        const title = existing ? "แก้ไขประกาศ" : "เพิ่มประกาศ";
        const v = (k, d = "") => (existing && existing[k] != null ? existing[k] : d);

        const html = `
    <div class="modal" id="modal-ann" role="dialog" aria-modal="true">
      <div class="modal__backdrop" data-close></div>
      <div class="modal__panel" role="document">
        <header class="modal__head">
          <h3>${title}</h3>
          <button class="modal__close" data-close aria-label="ปิด">×</button>
        </header>

        <form id="form-ann" class="stack">
          <div class="row wrap" style="gap:.75rem">
            <label class="w-260">วันที่บนการ์ด (announce_date)
              <input class="input" type="date" name="announce_date" value="${esc(
            String(v("announce_date", new Date().toISOString().slice(0, 10)))
        )}">
            </label>
            <label class="w-160">ปักหมุด
              <input type="checkbox" name="pinned" ${v("pinned", false) ? "checked" : ""}>
            </label>
          </div>

          <label>หัวข้อ (ไทย)* <input class="input" name="title_th" required value="${esc(v("title_th"))}"></label>
          <label>หัวข้อ (อังกฤษ) <input class="input" name="title_en" value="${esc(v("title_en", ""))}"></label>

          <label>รายละเอียด (ไทย)
            <textarea class="input" name="detail_th" rows="4">${esc(v("detail_th", ""))}</textarea>
          </label>
          <label>รายละเอียด (อังกฤษ)
            <textarea class="input" name="detail_en" rows="4">${esc(v("detail_en", ""))}</textarea>
          </label>

          <footer class="row" style="justify-content:flex-end; gap:.5rem">
            <button type="button" class="btn btn--outline" data-close>ยกเลิก</button>
            <button type="submit" class="btn">${existing ? "บันทึก" : "เพิ่ม"}</button>
          </footer>
        </form>
      </div>
    </div>
    `;
        document.body.insertAdjacentHTML("beforeend", html);

        const modal = document.getElementById("modal-ann");
        modal.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => closeModal("modal-ann")));
        modal.addEventListener("keydown", (e) => e.key === "Escape" && closeModal("modal-ann"));

        $("#form-ann")?.addEventListener("submit", async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const payload = {
                course_id: courseId,
                title_th: String(fd.get("title_th") || "").trim(),
                title_en: String(fd.get("title_en") || "").trim() || null,
                detail_th: String(fd.get("detail_th") || "").trim() || null,
                detail_en: String(fd.get("detail_en") || "").trim() || null,
                announce_date: String(fd.get("announce_date") || new Date().toISOString().slice(0, 10)),
                pinned: !!fd.get("pinned")
            };
            if (!payload.title_th) {
                alert("กรอกหัวข้อ (ไทย) ด้วย");
                return;
            }

            let err = null;
            if (existing) {
                const { error } = await sb.from("announcements").update(payload).eq("id", existing.id);
                err = error;
            } else {
                const { error } = await sb.from("announcements").insert(payload);
                err = error;
            }
            if (err) {
                alert("บันทึกประกาศไม่สำเร็จ: " + err.message);
                return;
            }

            closeModal("modal-ann");
            await reloadList(container, courseId);
            alert("บันทึกแล้ว");
        });
    }

    async function deleteAnnouncement(id, courseId, container) {
        if (!confirm("ต้องการลบประกาศนี้หรือไม่?")) return;
        const { error } = await sb.from("announcements").delete().eq("id", id);
        if (error) {
            alert("ลบไม่สำเร็จ: " + error.message);
            return;
        }
        await reloadList(container, courseId);
        alert("ลบแล้ว");
    }

    // ---------- expose ----------
    window.Announcements = Announcements;
})();
