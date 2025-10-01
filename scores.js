/* ===== scores.js =====
   Gradebook UI
   ใช้ global `sb` (Supabase client) ที่ประกาศไว้ใน admin.js
*/
(function () {
    // ---------- Utils ----------
    const $ = (s, el = document) => el.querySelector(s);
    const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
    const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
    const PAGE_SIZE = 10;

    function h(tag, attrs = {}, html = "") {
        const el = document.createElement(tag);
        Object.entries(attrs || {}).forEach(([k, v]) => {
            if (k === "class") el.className = v;
            else if (k === "style") el.setAttribute("style", v);
            else el[k] = v;
        });
        if (html instanceof Node) el.appendChild(html);
        else if (Array.isArray(html)) html.forEach((c) => (c instanceof Node ? el.appendChild(c) : el.insertAdjacentHTML("beforeend", c)));
        else if (html) el.insertAdjacentHTML("beforeend", html);
        return el;
    }

    // ---------- Public API ----------
    const Scores = {
        async mount(container, courseId) {
            container.innerHTML = "";
            container.classList.add("scores-root");
            container.appendChild(
                h(
                    "section",
                    { class: "card" },
                    `
        <header class="detail-head">
          <h3 style="margin:0">คะแนนรายวิชา</h3>
          <div class="row" style="gap:.5rem">
            <div class="row" style="gap:.5rem;margin-top:.5rem">
              <input class="input" id="scores-search" placeholder="ค้นหา ชื่อ/อีเมล/รหัส" style="max-width:320px">
              <span class="muted" id="scores-count"></span>
              <span style="flex:1"></span>
            </div>
            <button class="btn" id="btn-add-assessment">+ เพิ่มองค์ประกอบ</button>
            <button class="btn btn--outline" id="btn-export-csv">ส่งออก CSV</button>
            <label class="file"><input type="file" id="btn-import-csv" accept=".csv" /><span>นำเข้า CSV</span></label>
            <span style="flex:1"></span>
            <button class="btn" id="btn-save">บันทึกทั้งหมด</button>
            <span id="save-status" class="muted" aria-live="polite" style="margin-left:.5rem"></span>
          </div>
        </header>
        <div class="table-wrap" style="overflow:auto">
          <table id="scores-table" class="scores-table">
            <thead id="scores-thead"></thead>
            <tbody id="scores-tbody"><tr><td class="muted">กำลังโหลด...</td></tr></tbody>
          </table>
        </div>
        <div id="scores-pager" class="row" style="gap:.5rem"></div>
      `
                )
            );

            // state
            const state = {
                courseId,
                students: [],       // [{id, first_name, last_name, email, student_no}]
                assessments: [],    // [{id, name, weight, max_score}]
                scores: {},         // key `${sid}:${aid}` -> number|null
                edits: {},          // เก็บค่าที่แก้ไข ยังไม่บันทึก
                gradeRules: null,   // {A:80,"B+":75,...}
                q: "",
                page: 1
            };

            await loadAll(state);
            renderTable(container, state);
            wireToolbar(container, state);
        }
    };

    // ---------- Data loaders ----------
    async function loadAll(state) {
        const { courseId } = state;

        // enrollments -> student ids
        const { data: enrolls, error: e1 } = await sb.from("enrollments").select("student_id").eq("course_id", courseId);
        if (e1) throw new Error("โหลดรายชื่อไม่สำเร็จ: " + e1.message);
        const studentIds = [...new Set((enrolls || []).map((r) => r.student_id))];

        // students
        const { data: students, error: e2 } = await sb
            .from("students")
            .select("id, first_name, last_name, email, student_no")
            .in("id", studentIds)
            .order("id");
        if (e2) throw new Error("โหลดนักศึกษาไม่สำเร็จ: " + e2.message);
        state.students = students || [];

        // course -> grade_rules
        const { data: course, error: eCourse } = await sb.from("courses").select("grade_rules").eq("id", courseId).maybeSingle();
        if (eCourse) throw new Error("โหลดเกณฑ์ตัดเกรดไม่สำเร็จ: " + eCourse.message);
        state.gradeRules = normalizeGradeRules(course?.grade_rules);

        // assessments
        const { data: assessments, error: e3 } = await sb
            .from("assessments")
            .select("id, name, weight, max_score")
            .eq("course_id", courseId)
            .order("id");
        if (e3) throw new Error("โหลดองค์ประกอบคะแนนไม่สำเร็จ: " + e3.message);
        state.assessments = assessments || [];

        // scores
        const aIds = state.assessments.map((a) => a.id);
        const { data: scores, error: e4 } = await sb.from("scores").select("student_id, assessment_id, score").in("assessment_id", aIds);
        if (e4) throw new Error("โหลดคะแนนไม่สำเร็จ: " + e4.message);

        state.scores = {};
        (scores || []).forEach((r) => {
            state.scores[`${r.student_id}:${r.assessment_id}`] = r.score;
        });
        state.edits = {};
    }

    // ---------- Grade helpers ----------
    function normalizeGradeRules(rules) {
        const def = { A: 80, "B+": 75, B: 70, "C+": 65, C: 60, "D+": 55, D: 50, F: 0 };
        if (!rules || typeof rules !== "object") return def;
        const out = { ...def };
        for (const [k, v] of Object.entries(rules)) {
            const n = Number(v);
            if (Number.isFinite(n)) out[k] = n;
        }
        return out;
    }

    function gradeFrom(totalPct, state) {
        const gr = state.gradeRules || normalizeGradeRules();
        const order = Object.entries(gr)
            .map(([k, v]) => [k, Number(v)])
            .sort((a, b) => b[1] - a[1]);
        for (const [letter, cut] of order) {
            if (Number.isFinite(totalPct) && totalPct >= cut) return letter;
        }
        return "F";
    }

    // ---------- Width helpers (บีบให้ชิด + ไดนามิกตามข้อความยาวสุด) ----------
    function approxWidthByStrings(arr, charPx = 8.6, pad = 30, min = 140, max = 280) {
        const len = Math.max(1, ...arr.map((s) => String(s || "").length));
        const px = Math.round(len * charPx) + pad;
        return Math.max(min, Math.min(max, px));
    }
    function calcNameColWidth(state) {
        const names = (state.students || []).map((s) => `${s.first_name || ""} ${s.last_name || ""}`.trim());
        return approxWidthByStrings(names, 8.8, 30, 170, 280); // ชิดกว่าเดิม
    }
    function calcEmailColWidth(state) {
        const emails = (state.students || []).map((s) => s.email || "");
        return approxWidthByStrings(emails, 7.7, 18, 130, 200);
        //                        ^^^  ^^^  ^^^  ^^^
    }

    function calcAssessColWidth(a) {
        // หัวคอลัมน์ 2 บรรทัด: ชื่อ + (w% / max)
        // ให้กว้างพอสำหรับอินพุต 1 บรรทัด
        const label = `${a.name} ${Number(a.weight) || 0}% / ${a.max_score ?? "-"}`;
        const px = Math.round(label.length * 7.8) + 34;
        return Math.max(128, Math.min(210, px));
    }

    // ---------- Render ----------
    function renderTable(container, state) {
        const thead = $("#scores-thead", container);
        const tbody = $("#scores-tbody", container);

        // กำหนดความกว้างหลัก (บีบชื่อ/อีเมล/รหัสให้ชิดกัน)
        // (บีบให้ชิดขึ้น)
        const W_IDX = 56;  // เลขลำดับ แคบลงนิด
        const W_NAME = Math.max(150, calcNameColWidth(state) - 30);  // ชื่อ–นามสกุล ชิดขึ้น
        const W_EMAIL = Math.max(130, calcEmailColWidth(state) - 40); // อีเมล ชิดขึ้นอีก
        const W_STUID = 84;  // รหัส นศ. แคบลง


        // ตำแหน่ง sticky ต่อเนื่อง (ชิดขึ้น)
        const L_NAME = W_IDX;
        const L_EMAIL = W_IDX + W_NAME;
        const L_STUID = W_IDX + W_NAME + W_EMAIL;

        const assessWidths = state.assessments.map((a) => calcAssessColWidth(a));
        const totalWeight = (state.assessments || []).reduce((s, a) => s + (Number(a.weight) || 0), 0);

        // หัวตาราง — องค์ประกอบคะแนน 2 บรรทัด (ชื่อ / สัดส่วน-เต็ม)
        thead.innerHTML = `
      <tr>
        <th class="right" style="position:sticky;left:0;background:var(--surface);z-index:2;width:${W_IDX}px">ลำดับ</th>
        <th align="left" style="position:sticky;left:${L_NAME}px;background:var(--surface);z-index:2;min-width:${W_NAME}px">ชื่อ–นามสกุล</th>
        <th align="left" style="position:sticky;left:${L_EMAIL}px;background:var(--surface);z-index:2;min-width:${W_EMAIL}px">อีเมล</th>
        <th style="position:sticky;left:${L_STUID}px;background:var(--surface);z-index:2;min-width:${W_STUID}px;white-space:nowrap">รหัส นศ.</th>
        ${state.assessments
                .map((a, i) => {
                    const w = Number(a.weight) || 0;
                    const max = a.max_score ?? "-";
                    const aw = assessWidths[i];
                    return `
              <th style="min-width:${aw}px">
                <div style="display:flex;flex-direction:column;gap:2px;line-height:1.05">
                  <span>${esc(a.name)}</span>
                  <span class="muted" style="font-weight:normal">${w}% / ${max}</span>
                </div>
              </th>`;
                })
                .join("")}
        <th style="min-width:96px">รวม (${totalWeight || 0}%)</th>
        <th style="min-width:72px">เกรด</th>
      </tr>
    `;

        // กรอง + เพจ
        const ALL = applyFilter(state);
        const total = ALL.length;
        const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        state.page = Math.min(Math.max(1, state.page), pages);
        const start = (state.page - 1) * PAGE_SIZE;
        const SHOW = ALL.slice(start, start + PAGE_SIZE);

        const cnt = $("#scores-count", container);
        if (cnt) cnt.textContent = total ? `ทั้งหมด ${total} คน` : "";

        // แถวข้อมูล (คอลัมน์ด้านซ้าย sticky ให้ชิดกัน)
        const rows = SHOW.map((s, idx) => {
            const fixed = `
        <td class="right" style="position:sticky;left:0;background:var(--surface);z-index:1;width:${W_IDX}px">${start + idx + 1}</td>
        <td style="position:sticky;left:${L_NAME}px;background:var(--surface);z-index:1;min-width:${W_NAME}px">${esc([s.first_name, s.last_name].filter(Boolean).join(" ") || "-")}</td>
        <td style="position:sticky;left:${L_EMAIL}px;background:var(--surface);z-index:1;min-width:${W_EMAIL}px">${esc(s.email || "-")}</td>
        <td style="position:sticky;left:${L_STUID}px;background:var(--surface);z-index:1;min-width:${W_STUID}px;white-space:nowrap"><code>${esc(s.student_no || "—")}</code></td>
      `;

            const cells = state.assessments
                .map((a, i) => {
                    const key = `${s.id}:${a.id}`;
                    const val = key in state.edits ? state.edits[key] : state.scores[key];
                    const shown = val ?? "";
                    const max = Number(a.max_score) || undefined;
                    return `
            <td style="min-width:${assessWidths[i]}px">
              <input class="input input--sm score-cell" data-sid="${s.id}" data-aid="${a.id}" type="number"
                     step="0.01" ${max ? `max="${max}"` : ""} value="${esc(shown)}" style="width:100%" />
            </td>
          `;
                })
                .join("");

            const totalScore = calcTotalForStudent(s.id, state, true);
            const letter = gradeFrom(totalScore, state);

            return `<tr>${fixed}${cells}<td class="right __total"><b>${fmt(totalScore)}</b></td><td class="__grade"><b>${letter}</b></td></tr>`;
        });

        tbody.innerHTML = rows.join("") || `<tr><td class="muted">ไม่พบข้อมูล</td></tr>`;

        // realtime row total + grade
        tbody.removeEventListener("input", tbody._h);
        tbody.addEventListener(
            "input",
            (tbody._h = (ev) => {
                const inp = ev.target.closest("input.score-cell");
                if (!inp) return;
                const sid = Number(inp.dataset.sid);
                const aid = Number(inp.dataset.aid);
                const key = `${sid}:${aid}`;
                const v = inp.value === "" ? null : Number(inp.value);
                state.edits[key] = v === null || Number.isFinite(v) ? v : null;

                const tr = inp.closest("tr");
                const totalCell = tr?.querySelector("td.__total");
                const gradeCell = tr?.querySelector("td.__grade");
                const t = calcTotalForStudent(sid, state, true);
                if (totalCell) totalCell.innerHTML = `<b>${fmt(t)}</b>`;
                if (gradeCell) gradeCell.innerHTML = `<b>${gradeFrom(t, state)}</b>`;
            })
        );

        renderPager(container, state, pages, total);
    }

    function applyFilter(state) {
        const q = (state.q || "").toLowerCase();
        if (!q) return state.students;
        return state.students.filter((s) =>
            `${s.first_name || ""} ${s.last_name || ""} ${s.email || ""} ${s.student_no || ""}`.toLowerCase().includes(q)
        );
    }

    function renderPager(container, state, pages, total) {
        const box = $("#scores-pager", container);
        if (!box) return;
        if (!pages || pages <= 1) {
            box.innerHTML = "";
            return;
        }
        box.innerHTML = `
      <button class="btn btn--outline" data-pg="prev" ${state.page <= 1 ? "disabled" : ""}>ก่อนหน้า</button>
      <span class="muted">หน้า ${state.page} / ${pages} • ทั้งหมด ${total} คน</span>
      <button class="btn btn--outline" data-pg="next" ${state.page >= pages ? "disabled" : ""}>ถัดไป</button>
    `;
        box.onclick = (ev) => {
            const b = ev.target.closest("button[data-pg]");
            if (!b) return;
            if (b.dataset.pg === "prev") state.page = Math.max(1, state.page - 1);
            if (b.dataset.pg === "next") state.page = state.page + 1;
            renderTable(container, state);
        };
    }

    function calcTotalForStudent(studentId, state, preferEdits = false) {
        // รวมคะแนนแบบถ่วงน้ำหนัก: (score / max) * weight
        let sum = 0;
        for (const a of state.assessments) {
            const key = `${studentId}:${a.id}`;
            const raw = preferEdits && key in state.edits ? state.edits[key] : state.scores[key];
            const score = Number(raw);
            const max = Number(a.max_score);
            const w = Number(a.weight) || 0;
            if (Number.isFinite(score) && Number.isFinite(max) && max > 0) {
                sum += (score / max) * w;
            }
        }
        return sum; // หน่วยเป็นเปอร์เซ็นต์ (0–100)
    }

    function fmt(n) {
        return Number.isFinite(n) ? n.toFixed(2) : "—";
    }

    // ---------- Toolbar actions ----------
    function wireToolbar(container, state) {
        // save all
        $("#btn-save", container)?.addEventListener("click", async () => {
            const rows = [];
            for (const [key, val] of Object.entries(state.edits)) {
                const [sid, aid] = key.split(":").map(Number);
                rows.push({ student_id: sid, assessment_id: aid, score: val });
            }
            if (!rows.length) {
                alert("ไม่มีการแก้ไข");
                return;
            }

            const btn = $("#btn-save", container);
            const stat = $("#save-status", container);
            btn.disabled = true;
            stat.textContent = "กำลังบันทึก…";

            const { error } = await sb.from("scores").upsert(rows, { onConflict: "student_id,assessment_id" });

            btn.disabled = false;
            if (error) {
                stat.textContent = "";
                alert("บันทึกไม่สำเร็จ: " + error.message);
                return;
            }

            for (const r of rows) state.scores[`${r.student_id}:${r.assessment_id}`] = r.score;
            state.edits = {};
            const ts = new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
            stat.textContent = `บันทึกล่าสุด ${ts}`;
            alert("บันทึกคะแนนเรียบร้อย");
        });

        // add assessment
        $("#btn-add-assessment", container)?.addEventListener("click", async () => {
            const name = prompt("ชื่อองค์ประกอบ (เช่น Quiz, MID)");
            if (!name) return;
            const weight = Number(prompt("สัดส่วน (%) เช่น 10, 20") || "0");
            const max = Number(prompt("คะแนนเต็ม เช่น 10, 30") || "0");
            const { data, error } = await sb
                .from("assessments")
                .insert({ course_id: state.courseId, name, weight, max_score: max })
                .select("id, name, weight, max_score")
                .single();
            if (error) {
                alert("เพิ่มองค์ประกอบไม่สำเร็จ: " + error.message);
                return;
            }
            state.assessments.push(data);
            renderTable(container, state);
        });

        // export CSV (เพิ่มคอลัมน์ grade ท้ายสุด)
        $("#btn-export-csv", container)?.addEventListener("click", () => {
            const rows = [];
            const header = ["student_id", "first_name", "last_name", "email", "student_no", ...state.assessments.map((a) => a.name), "total", "grade"];
            rows.push(header);

            for (const s of state.students) {
                const cols = [s.id, s.first_name || "", s.last_name || "", s.email || "", s.student_no || ""];
                for (const a of state.assessments) {
                    const key = `${s.id}:${a.id}`;
                    const v = key in state.edits ? state.edits[key] : state.scores[key];
                    cols.push(v ?? "");
                }
                const totalPct = fmt(calcTotalForStudent(s.id, state, true));
                const letter = gradeFrom(Number(totalPct), state);
                cols.push(totalPct, letter);
                rows.push(cols);
            }

            const escCsv = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
            const csv = rows.map((r) => r.map(escCsv).join(",")).join("\r\n");
            const BOM = "\uFEFF";
            const blob = new Blob([BOM, csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "scores.csv";
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        });

        // import CSV (เหมือนเดิม ไม่รองรับคอลัมน์ grade)
        $("#btn-import-csv", container)?.addEventListener("change", async (ev) => {
            const file = ev.target.files?.[0];
            if (!file) return;
            const text = await file.text();
            const lines = text.split(/\r?\n/).filter(Boolean);
            if (!lines.length) return;

            const head = parseCSVLine(lines.shift());
            const idxId = head.findIndex((h) => /student_id/i.test(h));
            const idxEmail = head.findIndex((h) => /^email$/i.test(h));
            const mapAName2Id = Object.fromEntries(state.assessments.map((a) => [a.name, a.id]));
            const scoreCols = head.map((h, i) => ({ name: h, i })).filter((x) => x.name in mapAName2Id);

            const email2sid = Object.fromEntries(state.students.map((s) => [String(s.email).toLowerCase(), s.id]));
            const id2sid = new Set(state.students.map((s) => s.id));

            let changed = 0;
            for (const ln of lines) {
                const cols = parseCSVLine(ln);
                if (!cols.length) continue;
                let sid = null;
                if (idxId >= 0 && cols[idxId] !== undefined) {
                    const v = Number(cols[idxId]);
                    if (Number.isFinite(v) && id2sid.has(v)) sid = v;
                }
                if (!sid && idxEmail >= 0 && cols[idxEmail]) sid = email2sid[String(cols[idxEmail]).toLowerCase()] || null;
                if (!sid) continue;

                for (const sc of scoreCols) {
                    const aid = mapAName2Id[sc.name];
                    const raw = cols[sc.i];
                    const key = `${sid}:${aid}`;
                    const val = raw === "" ? null : Number(raw);
                    if (raw === "" || Number.isFinite(val)) {
                        state.edits[key] = val;
                        changed++;
                    }
                }
            }

            renderTable(container, state);
            alert(`นำเข้าคะแนนชั่วคราวแล้ว ${changed} ช่อง — กด "บันทึกทั้งหมด" เพื่อบันทึกลงระบบ`);
            ev.target.value = "";
        });

        // search
        $("#scores-search", container)?.addEventListener("input", (e) => {
            state.q = e.target.value.trim().toLowerCase();
            state.page = 1;
            renderTable(container, state);
        });
    }

    // CSV parser เบา ๆ
    function parseCSVLine(line) {
        const out = [];
        let cur = "", inQ = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (inQ) {
                if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
                else if (ch === '"') inQ = false;
                else cur += ch;
            } else {
                if (ch === '"') inQ = true;
                else if (ch === ",") { out.push(cur); cur = ""; }
                else cur += ch;
            }
        }
        out.push(cur);
        return out.map((s) => s.trim());
    }

    // ---------- expose ----------
    window.Scores = Scores;
})();
