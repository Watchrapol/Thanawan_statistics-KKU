(() => {
    // ===== CONFIG (scoped) =====
    const SB_URL = "https://uyhhxexhagbcwdtoanly.supabase.co";
    const SB_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5aGh4ZXhoYWdiY3dkdG9hbmx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MzEyODksImV4cCI6MjA3MzUwNzI4OX0.p0LeCTzk5T1LKqO7IGBmtH7jKwumy_0vxc-FXKZpRz8";

    let sb = null;

    // ===== UTILS =====
    const $ = (s, el = document) => el.querySelector(s);
    const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
    const esc = (s) => String(s ?? "").replace(/[&<>"']/g, m => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]
    ));
    const chips = (tools) => String(tools || "")
        .split("/").map(x => x.trim()).filter(Boolean).slice(0, 6)
        .map(t => `<span class="chip">${esc(t)}</span>`).join("");
    const semLabel = (c) => c.semester_label || ((c.term != null && c.year != null) ? `${c.term}/${c.year}` : "—");

    function showError(msg) {
        const cardsWrap = $("#courses-cards");
        if (cardsWrap) cardsWrap.innerHTML = `<div class="card" style="color:#b91c1c">${esc(msg)}</div>`;
    }

    // ===== READMORE =====
    function setReadmoreState(box, open) {
        const btn = box.querySelector("[data-toggle='readmore']");
        const content = box.querySelector(".readmore__content");
        if (!btn || !content) return;

        // สลับคลาส + aria
        box.classList.toggle("is-open", !!open);
        btn.setAttribute("aria-expanded", String(!!open));

        // ปรับสไตล์บังคับ (กันบางเบราว์เซอร์จำค่าเดิม)
        if (open) {
            content.style.display = "block";
            content.style.webkitLineClamp = "unset";
            btn.textContent = "ย่อ";
        } else {
            const lines = getComputedStyle(content).getPropertyValue("--lines").trim() || "3";
            content.style.display = "-webkit-box";
            content.style.webkitLineClamp = lines;
            btn.textContent = "อ่านทั้งหมด";
        }
    }

    function wireReadmores(root = document) {
        // ตั้งค่าเริ่มต้นให้ทุกกล่อง
        root.querySelectorAll(".readmore").forEach(box => {
            const btn = box.querySelector("[data-toggle='readmore']");
            if (!btn) return;
            if (btn.dataset.rmBound === "1") return; // กันผูกซ้ำเวลา re-render

            btn.dataset.rmBound = "1";
            btn.type = "button";

            const initOpen = box.classList.contains("is-open") || btn.getAttribute("aria-expanded") === "true";
            setReadmoreState(box, !!initOpen);

            btn.addEventListener("click", (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                const willOpen = !box.classList.contains("is-open");
                setReadmoreState(box, willOpen);
            });
        });
    }

    // ===== LOAD & RENDER =====
    async function loadAll() {
        const cardsWrap = $("#courses-cards");
        const secsWrap = $("#courses-sections");

        if (!sb) { showError("ไม่พบ Supabase SDK — กรุณารีเฟรชหน้า หรือเช็คการโหลดสคริปต์"); return; }

        // courses
        let qc;
        try {
            qc = await sb.from("courses")
                .select("id, code, title_th, title_en, section, term, year, semester_label")
                .order("created_at", { ascending: false });
        } catch (err) { console.error(err); showError("เชื่อมต่อฐานข้อมูลไม่สำเร็จ"); return; }

        if (qc.error) { console.error(qc.error); showError("โหลดรายวิชาไม่สำเร็จ: " + qc.error.message); if (secsWrap) secsWrap.innerHTML = ""; return; }

        const courses = qc.data || [];
        if (!courses.length) {
            if (cardsWrap) cardsWrap.innerHTML = `<div class="card muted">ยังไม่มีรายวิชาที่เปิดสอน</div>`;
            if (secsWrap) secsWrap.innerHTML = "";
            return;
        }

        // course_infos (รวม assessment มาด้วย)
        const ids = courses.map(c => c.id);
        const qi = await sb.from("course_infos")
            .select("course_id, instructor, schedule, location, tools, description, topics, assessment")
            .in("course_id", ids);
        const infoMap = Object.fromEntries((qi.data || []).map(r => [String(r.course_id), r]));

        // cards
        if (cardsWrap) {
            cardsWrap.innerHTML = courses.map(c => {
                const info = infoMap[String(c.id)] || {};
                const href = `#${esc(c.code || ("C" + c.id))}`;
                return `
          <a class="card course-link" href="${href}">
            <div class="course-code">${esc(c.code || "")}</div>
            <div class="course-title">${esc(c.title_th || c.title_en || "(ไม่ระบุชื่อวิชา)")}</div>
            <p class="course-meta">${esc(semLabel(c))} • Sec ${esc(c.section || "-")}</p>
            <div class="chips">${chips(info.tools)}</div>
          </a>
        `;
            }).join("");
        }

        // sections
        if (secsWrap) {
            const sectionsHTML = courses.map(c => {
                const info = infoMap[String(c.id)] || {};
                const A = Array.isArray(info.assessment) ? info.assessment : [];   // <<<<<< ใช้ assessment จาก course_infos
                const topics = Array.isArray(info.topics) ? info.topics : [];
                const codeAnchor = esc(c.code || ("C" + c.id));

                return `
          <section id="${codeAnchor}" class="section anchor-section">
            <div class="container">
              <div class="course-header">
                <div>
                  <h2>${esc(c.code || "")}: ${esc(c.title_th || c.title_en || "(ไม่ระบุชื่อวิชา)")}</h2>
                  <p class="muted">${esc(semLabel(c))} • Sec ${esc(c.section || "-")}</p>
                </div>
                <div class="actions">
                  <a class="btn btn--ghost btn--sm" href="portal.html?course=${encodeURIComponent(c.code || c.id)}">ดูคะแนน</a>
                </div>
              </div>

              <div class="detail-grid">
                <article class="card">
                  <h3>ข้อมูลรายวิชา</h3>
                  <ul class="kv">
                    <li><b>ผู้สอน</b> : <span>${esc(info.instructor || "-")}</span></li>
                    <li><b>เวลา</b> : <span>${esc(info.schedule || "-")}</span></li>
                    <li><b>สถานที่</b> : <span>${esc(info.location || "-")}</span></li>
                    <li><b>เครื่องมือ</b> : <span>${esc(info.tools || "-")}</span></li>
                  </ul>

                  <h4>Course description</h4>
                  <ul class="bullets">
                    <li class="no-marker">
                      <div class="readmore">
                        <div class="readmore__content" style="--lines: 3;">
                          <span>${esc(info.description || "—")}</span>
                        </div>
                        <div class="readmore__fade" aria-hidden="true"></div>
                        <button type="button"
                                class="btn btn--outline btn--sm readmore__btn"
                                data-toggle="readmore"
                                aria-expanded="false"></button>
                      </div>
                    </li>
                  </ul>

                  <div class="resource-chips chips">
                    ${chips(info.tools)}
                  </div>
                </article>

                <aside class="card">
                  <h3>การประเมินผล</h3>
                  ${A.length
                        ? `<ul class="bullets">` +
                        A.map(x => `<li>${esc(x.name || "")} ${x.weight != null ? esc(String(x.weight)) + "%" : ""}</li>`).join("") +
                        `</ul>`
                        : `<p class="muted">ยังไม่ตั้งองค์ประกอบคะแนน</p>`
                    }

                  <h4>หัวข้อโดยรวม</h4>
                  ${topics.length
                        ? `
                        <div class="readmore">
                          <ul class="bullets readmore__content" style="--lines: 6;">
                            ${topics.map(t => `<li>${esc(t)}</li>`).join("")}
                          </ul>
                          <div class="readmore__fade" aria-hidden="true"></div>
                          <button type="button"
                                  class="btn btn--outline btn--sm readmore__btn"
                                  data-toggle="readmore"
                                  aria-expanded="false"></button>
                        </div>`
                        : `<p class="muted">—</p>`
                    }
                </aside>
              </div>

              <h3 class="section-title" data-i18n="course.announcements.title"></h3>
              <ul class="timeline js-news" data-course="${esc(c.code || "")}"
                  data-sort="pinnedThenDate" data-new-days="3" aria-live="polite"></ul>
              <a class="link-more" href="announcements.html?course=${encodeURIComponent(c.code || "")}"
                 data-i18n="course.announcements.viewAll"></a>

              <div class="back-top"><a href="#top" data-i18n="subjectsPage.backTop">↑ กลับไปด้านบน</a></div>
            </div>
          </section>
        `;
            }).join("");

            secsWrap.innerHTML = sectionsHTML;

            // bind readmores หลังแทนที่ DOM
            wireReadmores(secsWrap);
        }

        if (window.News && typeof window.News.mountAll === "function") {
            window.News.mountAll();
        }
    }

    // ===== REALTIME =====
    function mountRealtime() {
        if (!sb || !("channel" in sb)) return;
        const ch = sb.channel("public-subjects-realtime", {
            config: { broadcast: { ack: false }, presence: { key: "subjects" } },
        });
        ch.on("postgres_changes", { event: "*", schema: "public", table: "courses" }, () => loadAll());
        ch.on("postgres_changes", { event: "*", schema: "public", table: "course_infos" }, () => loadAll());
        // จะคง listener ของ assessments ไว้ก็ไม่เป็นไร ถึงไม่ได้ใช้แล้ว
        ch.on("postgres_changes", { event: "*", schema: "public", table: "assessments" }, () => loadAll());
        ch.subscribe();
    }

    // ===== BOOT =====
    window.addEventListener("load", async () => {
        if (!("supabase" in window)) {
            showError("Supabase SDK not loaded. ตรวจลำดับ <script> ใน subjects.html");
            return;
        }
        sb = window.supabase.createClient(SB_URL, SB_KEY);
        await loadAll();
        mountRealtime();
    });
})();
