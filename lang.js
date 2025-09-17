// === i18n (TH/EN) + language switch (persist in localStorage) ===
const I18N = {
  th: {
    title: "Thanawan • STAT KKU — หน้าแรก",
    skip: "ข้ามไปยังเนื้อหา",
    brand: "Thanawan • STAT KKU",
    "nav.home": "หน้าแรก",
    "nav.subjects": "รายวิชา",
    "nav.publications": "ผลงานวิจัย",
    "nav.news": "ประกาศ",
    "nav.contact": "ติดต่อ",

    // Hero
    "hero.name": "Thanawan Prahadchai",
    "hero.tagline": "อาจารย์ประจำสาขาสถิติ มข. — ทำวิจัยด้านเหตุการณ์สุดขั้ว (Extreme Events), การวิเคราะห์ความถี่เชิงภูมิภาค (RFA) ",
    "hero.ctaCV": "ดาวน์โหลด CV",
    "hero.ctaContact": "ติดต่อ",
    "hero.image": "ภาพโปรไฟล์ / หน้าปก",
    "hero.openTitle": "กำลังเปิดรับ:",
    "hero.openCollab": "• ความร่วมมือวิจัย",
    "hero.openGuest": "• บรรยายพิเศษ / วิทยากร",
    "hero.openSupervision": "• ที่ปรึกษางานวิจัยระดับบัณฑิตศึกษา",

    // Chips
    "chips.rfa": "RFA & L-moments",
    "chips.spi": "ดัชนีภัยแล้ง (SPI/SPEI)",
    "chips.evt": "Extreme Value Theory",
    "chips.ts": "อนุกรมเวลา",
    "chips.ai": "Statistical AI",
    "chips.hydro": "อุทกวิทยา",

    // Featured
    "feat.badge": "ผลงานใหม่",
    "feat.title": "Using Negative Power Transformation to Model Block Minima (2025)",
    "feat.desc": "แนวทางแปลงค่ากำลังลบสำหรับแบบจำลอง Block Minima ช่วยปรับปรุงการประมาณค่าสุดโต่งและการตีความพารามิเตอร์ GEV",
    "feat.read": "อ่านเปเปอร์",
    "feat.code": "โค้ด & ข้อมูล",
    "feat.open": "Open Access",

    // Highlights
    "highlights.title": "หัวข้อเด่น",
    "highlights.projects": "โครงการที่กำลังดำเนินการ",
    "highlights.p1": "RFA ด้วยดัชนีภัยแล้ง — ลุ่มน้ำชี",
    "highlights.p2": "NPT-GEV: ปรับแต่งพารามิเตอร์อัตโนมัติ",
    "highlights.p3": "พยากรณ์ระดับคลื่นทะเลไทยจาก ERA5",
    "highlights.focus": "หัวข้อวิจัยหลัก",
    "highlights.open": "กำลังเปิดรับ",
    "highlights.openDesc": "ความร่วมมือวิจัย · วิทยากรรับเชิญ · ที่ปรึกษางานวิจัยบัณฑิตศึกษา",
    "highlights.contact": "ติดต่อความร่วมมือ",
    "common.learnMore": "ดูเพิ่มเติม →",

    // e-Book
    "ebook.title": "e-Book ✨ สรุปความรู้พื้นฐานด้านสถิติศาสตร์ พร้อมตัวอย่าง",
    "ebook.sub": "สรุปสาระสำคัญทางสถิติสากล พร้อมตัวอย่าง",
    "ebook.buy": "สั่งซื้อที่ CU e-Book",
    "ebook.comment": "ส่งคำแนะนำ/คอมเมนต์",

    // Announcements
    "news.title": "ประกาศ",
    "news.mid1Date": "14 ม.ค. 2568",
    "news.mid1L": "MID1 (20%)",
    "news.mid1": "อังคาร 13:00–16:00",
    "news.mid2Date": "8 ก.พ. 2568",
    "news.mid2L": "MID2 (10%)",
    "news.mid2": "เสาร์ 14:00–16:30 (Sec1–6501 / Sec2–6502)",
    "news.projDate": "สัปดาห์ที่ 12",
    "news.projL": "ส่งงานโปรเจกต์",
    "news.projV": "ภายใน 23:59 น. วันอาทิตย์",
    "news.more": "ดูประกาศทั้งหมด →",

    // Subjects (home)
    "subjects.title": "รายวิชาในเทอมนี้",
    "subjects.c1meta": "ภาคต้น 2568 • เอกสาร • Syllabus",
    "subjects.c2meta": "ภาคต้น 2568 • เอกสาร • Syllabus ",
    "subjects.c3meta": "คอร์สสั้น • โน้ต • ชุดข้อมูล",
    "subjects.courseDetails": "Course Details",   // ✅ แก้คีย์
    "subjects.syllabus": "syllabus",
    "subjects.materials": "เอกสาร",
    "subjects.notes": "โน้ต",

    // Publications (home)
    "pubs.title": "ผลงานวิจัยล่าสุด",
    "pubs.p1": "Prahadchai, T. (2025). การใช้ Negative Power Transformation กับ Block Minima (อยู่ระหว่างพิจารณา)",
    "pubs.p2": "Regional Frequency Analysis ด้วยดัชนีภัยแล้งสำหรับภาคตะวันออกเฉียงเหนือของไทย (2025)",
    "pubs.p3": "Hyperparameter Optimization สำหรับแบบจำลอง NPT-GEV (2024)",
    "pubs.more": "ดูทั้งหมด",

    // Contact
    "contact.title": "ติดต่ออาจารย์",
    "contact.addr": "ภาควิชาสถิติ คณะวิทยาศาสตร์ มหาวิทยาลัยขอนแก่น",
    "contact.emailL": "อีเมล:",
    "contact.emailBtn": "ส่งอีเมล",
    "contact.cv": "ดาวน์โหลด CV",

    // Footer
    "footer.copy": "© 2025 Thanawan Prahadchai — คณะวิทยาศาสตร์ มหาวิทยาลัยขอนแก่น",
    "footer.privacy": "นโยบายความเป็นส่วนตัว",
    "footer.access": "การเข้าถึง",
    "footer.sitemap": "แผนผังเว็บไซต์",

    /* Pages: titles (สำหรับ <title>) */
    "pageSubjects.title": "รายวิชา — Thanawan • STAT KKU",
    "pageNews.title": "ประกาศทั้งหมด — Thanawan • STAT KKU",
    "pagePublications.title": "ผลงานวิจัย — Thanawan • STAT KKU",
    "pagePrivacy.title": "นโยบายความเป็นส่วนตัว — Thanawan • STAT KKU",
    "pageAccessibility.title": "การเข้าถึง — Thanawan • STAT KKU",
    "pageSitemap.title": "แผนผังเว็บไซต์ — Thanawan • STAT KKU",

    /* Subjects page (รายละเอียด) */
    "subjectsPage.h1": "รายวิชา",
    "subjectsPage.btn.syllabus": "Syllabus",
    "subjectsPage.btn.materials": "เอกสาร",
    "subjectsPage.info": "ข้อมูลรายวิชา",
    "subjectsPage.learning": "วัตถุประสงค์/ผลลัพธ์การเรียนรู้",
    "subjectsPage.goals": "เป้าหมายรายวิชา",
    "subjectsPage.assess": "การประเมินผล",
    "subjectsPage.topics": "หัวข้อโดยรวม",
    "subjectsPage.backTop": "↑ กลับไปด้านบน",
    "subjectsPage.labels.lecturerL": "ผู้สอน",
    "subjectsPage.labels.timeL": "เวลา",
    "subjectsPage.labels.placeL": "สถานที่",
    "subjectsPage.labels.toolsL": "เครื่องมือ",

    // Course 1
    "subjectsPage.c1.title": "Introduction to Statistics",
    "subjectsPage.c1.h2": "SC602001: Introduction to Statistics",
    "subjectsPage.c1.meta": "ภาคต้น 2568 • 3(3-0-6) หน่วยกิต",
    "subjectsPage.c1.lecturerV": "Thanawan Prahadchai",
    "subjectsPage.c1.timeV": "อังคาร 13:00–16:00",
    "subjectsPage.c1.placeV": "คณะวิทยาศาสตร์ มข.",
    "subjectsPage.c1.toolsV": "R / Python / Excel",
    "subjectsPage.c1.lo1": "เข้าใจแนวคิดสถิติพื้นฐานและการอนุมาน",
    "subjectsPage.c1.lo2": "วิเคราะห์ข้อมูลจริงด้วยซอฟต์แวร์สถิติ",
    "subjectsPage.c1.lo3": "สื่อสารผลเชิงวิชาการได้",
    "subjectsPage.c1.link1": "Random number",
    "subjectsPage.c1.link2": "Q",
    "subjectsPage.c1.link3": "MST",
    "subjectsPage.c1.link4": "Google Classroom",
    "subjectsPage.c1.gr1": "แบบฝึกหัด/งานย่อย 30%",
    "subjectsPage.c1.gr2": "MIDTERM 20% • FINAL 30%",
    "subjectsPage.c1.gr3": "โปรเจกต์/พรีเซนต์ 20%",
    "subjectsPage.c1.t1": "Exploratory Data Analysis",
    "subjectsPage.c1.t2": "Probability & Distributions",
    "subjectsPage.c1.t3": "Estimation & Hypothesis Testing",
    "subjectsPage.c1.t4": "Regression Basics",
    "subjectsPage.c1.tag1": "Descriptive & Inference",
    "subjectsPage.c1.tag2": "R/Python",

    // Course 2
    "subjectsPage.c2.title": "Probability & Statistics",
    "subjectsPage.c2.h2": "SC602005: Probability & Statistics",
    "subjectsPage.c2.meta": "ภาคต้น 2568 • 3(2-1-6) หน่วยกิต",
    "subjectsPage.c2.lecturerV": "Thanawan Prahadchai",
    "subjectsPage.c2.timeV": "ศุกร์ 09:00–12:00",
    "subjectsPage.c2.placeV": "คณะวิทยาศาสตร์ มข.",
    "subjectsPage.c2.toolsV": "Python (pandas, scikit-learn)",
    "subjectsPage.c2.lo1": "เข้าใจ workflow ของโครงการข้อมูลเชิงสถิติ",
    "subjectsPage.c2.lo2": "ประยุกต์ ML พื้นฐานกับโจทย์วิจัย",
    "subjectsPage.c2.lo3": "ทำรายงาน/รีโปรดิวซ์ผลการทดลอง",
    "subjectsPage.c2.link1": "GitHub Repo",
    "subjectsPage.c2.link2": "Datasets",
    "subjectsPage.c2.link3": "Reading List",
    "subjectsPage.c2.gr1": "Mini-projects 40%",
    "subjectsPage.c2.gr2": "Quizzes/Labs 30%",
    "subjectsPage.c2.gr3": "Final Project 30%",
    "subjectsPage.c2.t1": "Data prep & EDA",
    "subjectsPage.c2.t2": "Regression/Classification",
    "subjectsPage.c2.t3": "Model evaluation",
    "subjectsPage.c2.t4": "Reproducible research",
    "subjectsPage.c2.tag1": "พื้นฐาน ML",
    "subjectsPage.c2.tag2": "โปรเจกต์"
  },

  en: {
    title: "Thanawan • STAT KKU — Home",
    skip: "Skip to content",
    brand: "Thanawan • STAT KKU",
    "nav.home": "Home",
    "nav.subjects": "Subjects",
    "nav.publications": "Publications",
    "nav.news": "News",
    "nav.contact": "Contact",

    // Hero
    "hero.name": "Thanawan Prahadchai",
    "hero.tagline": "Lecturer in Statistics at KKU — research on extreme events, Regional Frequency Analysis (RFA).",
    "hero.ctaCV": "Download CV",
    "hero.ctaContact": "Contact",
    "hero.image": "Profile / Cover Image",
    "hero.openTitle": "Currently open to:",
    "hero.openCollab": "• Research collaboration",
    "hero.openGuest": "• Guest lectures / talks",
    "hero.openSupervision": "• Graduate supervision",

    // Chips
    "chips.rfa": "RFA & L-moments",
    "chips.spi": "Drought indices (SPI/SPEI)",
    "chips.evt": "Extreme Value Theory",
    "chips.ts": "Time Series",
    "chips.ai": "Statistical AI",
    "chips.hydro": "Hydrology",

    // Featured
    "feat.badge": "Featured",
    "feat.title": "Using Negative Power Transformation to Model Block Minima (2025)",
    "feat.desc": "A negative power transformation approach for block minima to improve extreme estimation and GEV parameter interpretability.",
    "feat.read": "Read paper",
    "feat.code": "Code & data",
    "feat.open": "Open Access",

    // Highlights
    "highlights.title": "Highlights",
    "highlights.projects": "Ongoing Projects",
    "highlights.p1": "RFA with drought indices — Chi River Basin",
    "highlights.p2": "NPT-GEV: Hyperparameter optimization",
    "highlights.p3": "ERA5-based wave height forecasting (Thai coasts)",
    "highlights.focus": "Research Focus",
    "highlights.open": "Currently open to",
    "highlights.openDesc": "Research collaboration · Guest lectures · Graduate supervision",
    "highlights.contact": "Contact for collaboration",
    "common.learnMore": "Learn more →",

    // e-Book
    "ebook.title": "e-Book ✨ Summary of Basic Knowledge in Statistics with Examples",
    "ebook.sub": "Concise essentials in statistics with examples",
    "ebook.buy": "Buy at CU e-Book",
    "ebook.comment": "Feedback / Comment",

    // Announcements
    "news.title": "Announcements",
    "news.mid1Date": "14 Jan 2025",
    "news.mid1L": "MID1 (20%)",
    "news.mid1": "Tue 13:00–16:00",
    "news.mid2Date": "8 Feb 2025",
    "news.mid2L": "MID2 (10%)",
    "news.mid2": "Sat 14:00–16:30 (Sec1–6501 / Sec2–6502)",
    "news.projDate": "Week 12",
    "news.projL": "Project submission",
    "news.projV": "By 23:59 on Sunday",
    "news.more": "View all announcements →",

    // Subjects (home)
    "subjects.title": "Subjects this term",
    "subjects.c1meta": "2nd semester 2025 • Materials • Syllabus",
    "subjects.c2meta": "1st semester 2025 • Slides • Labs",
    "subjects.c3meta": "Short course • Notes • Datasets",
    "subjects.courseDetails": "Course Details",  // ✅ match TH
    "subjects.syllabus": "Syllabus",
    "subjects.materials": "Materials",
    "subjects.notes": "Notes",

    // Publications (home)
    "pubs.title": "Recent Publications",
    "pubs.p1": "Prahadchai, T. (2025). Using Negative Power Transformation to Model Block Minima. (under review)",
    "pubs.p2": "Regional Frequency Analysis with Drought Indices for Northeast Thailand (2025).",
    "pubs.p3": "Hyperparameter Optimization for NPT-GEV Models (2024).",
    "pubs.more": "View all",

    // Contact
    "contact.title": "Contact",
    "contact.addr": "Department of Statistics, Faculty of Science, Khon Kaen University",
    "contact.emailL": "Email:",
    "contact.emailBtn": "Email me",
    "contact.cv": "Download CV",

    // Footer
    "footer.copy": "© 2025 Thanawan Prahadchai — Faculty of Science, KKU",
    "footer.privacy": "Privacy",
    "footer.access": "Accessibility",
    "footer.sitemap": "Sitemap",

    /* Page titles */
    "pageSubjects.title": "Subjects — Thanawan • STAT KKU",
    "pageNews.title": "Announcements — Thanawan • STAT KKU",
    "pagePublications.title": "Publications — Thanawan • STAT KKU",
    "pagePrivacy.title": "Privacy Policy — Thanawan • STAT KKU",
    "pageAccessibility.title": "Accessibility — Thanawan • STAT KKU",
    "pageSitemap.title": "Sitemap — Thanawan • STAT KKU",

    /* Subjects page */
    "subjectsPage.h1": "Subjects",
    "subjectsPage.btn.syllabus": "Syllabus",
    "subjectsPage.btn.materials": "Materials",
    "subjectsPage.info": "Course information",
    "subjectsPage.learning": "Learning outcomes",
    "subjectsPage.goals": "Course goals",
    "subjectsPage.assess": "Assessment",
    "subjectsPage.topics": "Topics overview",
    "subjectsPage.backTop": "↑ Back to top",
    "subjectsPage.labels.lecturerL": "Lecturer",
    "subjectsPage.labels.timeL": "Time",
    "subjectsPage.labels.placeL": "Location",
    "subjectsPage.labels.toolsL": "Tools",

    // Course 1
    "subjectsPage.c1.title": "Introduction to Statistics",
    "subjectsPage.c1.h2": "SC602001: Introduction to Statistics",
    "subjectsPage.c1.meta": "1st semester 2025 • 3(3-0-6) credits",
    "subjectsPage.c1.lecturerV": "Thanawan Prahadchai",
    "subjectsPage.c1.timeV": "Tue 13:00–16:00",
    "subjectsPage.c1.placeV": "Faculty of Science, KKU",
    "subjectsPage.c1.toolsV": "R / Python / Excel",
    "subjectsPage.c1.lo1": "Understand basics of statistics and inference",
    "subjectsPage.c1.lo2": "Analyze real data with statistical software",
    "subjectsPage.c1.lo3": "Communicate results academically",
    "subjectsPage.c1.link1": "Random number",
    "subjectsPage.c1.link2": "Q",
    "subjectsPage.c1.link3": "MST",
    "subjectsPage.c1.link4": "Google Classroom",
    "subjectsPage.c1.gr1": "Assignments 30%",
    "subjectsPage.c1.gr2": "MIDTERM 20% • FINAL 30%",
    "subjectsPage.c1.gr3": "Project/Presentation 20%",
    "subjectsPage.c1.t1": "Exploratory Data Analysis",
    "subjectsPage.c1.t2": "Probability & Distributions",
    "subjectsPage.c1.t3": "Estimation & Hypothesis Testing",
    "subjectsPage.c1.t4": "Regression Basics",
    "subjectsPage.c1.tag1": "Descriptive & Inference",
    "subjectsPage.c1.tag2": "R/Python",

    // Course 2
    "subjectsPage.c2.title": "Probability & Statistics",
    "subjectsPage.c2.h2": "SC602005: Probability & Statistics",
    "subjectsPage.c2.meta": "1st semester 2025 • 3(2-1-6) credits",
    "subjectsPage.c2.lecturerV": "Thanawan Prahadchai",
    "subjectsPage.c2.timeV": "Fri 09:00–12:00",
    "subjectsPage.c2.placeV": "Faculty of Science, KKU",
    "subjectsPage.c2.toolsV": "Python (pandas, scikit-learn)",
    "subjectsPage.c2.lo1": "Understand the workflow of statistical data projects",
    "subjectsPage.c2.lo2": "Apply basic ML to research problems",
    "subjectsPage.c2.lo3": "Write reports / reproduce experiments",
    "subjectsPage.c2.link1": "GitHub Repo",
    "subjectsPage.c2.link2": "Datasets",
    "subjectsPage.c2.link3": "Reading List",
    "subjectsPage.c2.gr1": "Mini-projects 40%",
    "subjectsPage.c2.gr2": "Quizzes/Labs 30%",
    "subjectsPage.c2.gr3": "Final Project 30%",
    "subjectsPage.c2.t1": "Data prep & EDA",
    "subjectsPage.c2.t2": "Regression/Classification",
    "subjectsPage.c2.t3": "Model evaluation",
    "subjectsPage.c2.t4": "Reproducible research",
    "subjectsPage.c2.tag1": "ML Basics",
    "subjectsPage.c2.tag2": "Projects"
  }
};

/* ---------------- Core i18n switcher ---------------- */
function setLanguage(lang) {
  const dict = I18N[lang] || I18N.th;
  document.documentElement.lang = lang;

  // translate text / attributes
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const attr = el.getAttribute("data-i18n-attr"); // e.g., placeholder/title/aria-label
    const val = dict[key];
    if (val !== undefined) {
      if (attr) el.setAttribute(attr, val);
      else el.innerHTML = val;
    }
  });

  // <title> (ถ้ามี data-i18n="title" หรือคีย์เฉพาะหน้า)
  const titleEl = document.querySelector("title[data-i18n]");
  if (titleEl) {
    const key = titleEl.getAttribute("data-i18n"); // ปกติคือ "title" หรือ page*.title
    const pageKey = titleEl.dataset.pageKey;       // ใช้ได้ถ้าตั้ง data-page-key ไว้
    titleEl.textContent = dict[pageKey || key] || titleEl.textContent;
  }

  // toggle pressed state
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.lang === lang));
  });

  localStorage.setItem("lang", lang);
}

document.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("lang") || "th";
  setLanguage(saved);

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => setLanguage(btn.dataset.lang));
  });

  if (location.hash) {
    const el = document.querySelector(location.hash);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});
