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
    "hero.name": "ธนวรรณ ประฮาดไชย",
    "hero.tagline": "อาจารย์ประจำสาขาสถิติ คณะวิทยาศาสตร์ มหาวิทยาลัยขอนแก่น ",
    "hero.ctaCV": "ดาวน์โหลด CV",
    "hero.ctaContact": "ติดต่อ",
    "hero.image": "ภาพโปรไฟล์ / หน้าปก",
    "hero.openTitle": "ประวัติการศึกษา:",
    "hero.openPhD": "• Ph.D. in Statistics, Chonnam National University, South Korea",
    "hero.openMSc": "• M.Sc. in Statistics, Chonnam National University, South Korea",
    "hero.openBsc": "• B.Sc. in Statistics, Mahasarakham University, Thailand",

    // Chips
    "chips.rfa": "Design and Analysis of Computer Experiments",
    "chips.spi": "Statistical Meteorology including Extreme Events and Climate Change",
    "chips.evt": "Statistical Computing",

    // Featured
    "feat.badge": "ผลงานใหม่",
    "feat.title": "Ensemble Machine Learning for Comprehensive Drought Assessment: A Case Study in the Mun Watershed of Northeast Thailand",
    "feat.desc": "Tossapol Phoophiwfa, Prapawan Chomphuwiset, <u>Thanawan Prahadchai</u>, Sujitta Suraphee, Andrei Volodin, Piyapatr Busababodhin",
    "feat.read": "อ่านเปเปอร์",
    "feat.code": "โค้ด & ข้อมูล",
    "feat.open": "Open Access",

    // Highlights
    "highlights.title": "หัวข้อเด่น",
    "highlights.projects": "โครงการที่กำลังดำเนินการ",
    "highlights.p1": "Distribution-Based Estimation of Hyperparameters for the Negative Power Transformation of the Generalized Extreme Value Distribution.",
    "highlights.p2": "Using Negative Power Transformation to Model Block Minima.",
    "highlights.focus": "หัวข้อวิจัยหลัก",
    "highlights.open": "กำลังเปิดรับ",
    "highlights.openDesc": "· ความร่วมมือวิจัย <br>· วิทยากรรับเชิญ <br>· ที่ปรึกษางานวิจัยบัณฑิตศึกษา",
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
    "subjects.courseDetails": "ข้อมูลรายวิชา",   // ✅ แก้คีย์
    "subjects.syllabus": "syllabus",
    "subjects.materials": "เอกสาร",
    "subjects.notes": "โน้ต",

    // Publications (home)
    "pubs.title": "ผลงานวิจัยล่าสุด",
    "pubs.p1": "Distribution-Based Estimation of Hyperparameters for the Negative Power Transformation of the Generalized Extreme Value Distribution. Journal of applied statistics (under review)",
    "pubs.p2": "Using Negative Power Transformation to Model Block Minima. Journal of applied statistics (under review)",
    "pubs.p3": "Ensemble Machine Learning for Comprehensive Drought Assessment: A Case Study in the Mun Watershed of Northeast Thailand (2025)",
    "pubs.more": "ดูทั้งหมด",

    // Contact
    "contact.title": "ติดต่ออาจารย์",
    "contact.addr": "ภาควิชาสถิติ คณะวิทยาศาสตร์ มหาวิทยาลัยขอนแก่น SC06404",
    "contact.emailL": "อีเมล:",
    "contact.emailBtn": "ส่งอีเมล",
    "contact.cv": "ดาวน์โหลด CV",

    // Footer
    "footer.copy": "© 2025 Thanawan Prahadchai — ",
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
    "subjectsPage.learning": "คำอธิบายรายวิชา",
    "subjectsPage.goals": "เป้าหมายรายวิชา",
    "subjectsPage.assess": "การประเมินผล",
    "subjectsPage.topics": "หัวข้อโดยรวม",
    "subjectsPage.backTop": "↑ กลับไปด้านบน",
    "subjectsPage.labels.lecturerL": "ผู้สอน",
    "subjectsPage.labels.timeL": "เวลา",
    "subjectsPage.labels.placeL": "สถานที่",
    "subjectsPage.labels.toolsL": "เครื่องมือ",

    // Course 1
    "subjectsPage.c1.title": "สถิติขั้นต้น ",
    "subjectsPage.c1.h2": "SC602001 : สถิติขั้นต้น ",
    "subjectsPage.c1.meta": " เทอมต้น ปีการศึกษา 2568 • 3(3-0-6) หน่วยกิต",
    "subjectsPage.c1.lecturerV": "อ.ดร.ธนวรรณ ประฮาดไชย",
    "subjectsPage.c1.timeV": "จันทร์, พุทธ 9:00 – 10:30 น.",
    "subjectsPage.c1.placeV": "คณะวิทยาศาสตร์ SC9109 มหาวิทยาลัยขอนแก่น",
    "subjectsPage.c1.toolsV": "R / Excel / SPSS",
    "subjectsPage.c1.lo1": "ความหมายและขอบข่ายของสถิติข้อมูลและระดับการจัด วิธีการเก็บข้อมูลและการนำเสนอการวัดแนวโน้มเข้าสู่ส่วนกลางและการกระจายความน่าจะเป็นตัวแปรสุ่มและการแจกแจงบางแบบ การแจกแจงของตัวสถิติการประมาณค่าและการทดสอบสมมติฐานการถดถอยและสหสัมพันธ์เชิงเส้น",
    "subjectsPage.c1.link1": "R",
    "subjectsPage.c1.link2": "Excel",
    "subjectsPage.c1.link3": "SPSS",
    "subjectsPage.c1.link4": "Google Classroom",
    "subjectsPage.c1.gr1": "แบบฝึกหัด/งานย่อย 35%",
    "subjectsPage.c1.gr2": "MIDTERM 30%",
    "subjectsPage.c1.gr3": "FINAL 35%",
    "subjectsPage.c1.t1": "บทที่ 1 ความรู้เบื้องต้นทางสถิติ",
    "subjectsPage.c1.t2": "บทที่ 2 ความน่าจะเป็น",
    "subjectsPage.c1.t3": "บทที่ 3 ตัวแปรสุ่มและการแจกแจงของตัวแปรสุ่ม",
    "subjectsPage.c1.t4": "บทที่ 4 การแจกแจงความน่าจะเป็นชนิดไม่ต่อเนื่อง",
    "subjectsPage.c1.t5": "บทที่ 5 การแจกแจงความน่าจะเป็นชนิดไม่ต่อเนื่อง",
    "subjectsPage.c1.t6": "บทที่ 6 การแจกแจงความน่าจะเป็นชนิดต่อเนื่อง",
    "subjectsPage.c1.t7": "บทที่ 7 การประมาณค่า",
    "subjectsPage.c1.t8": "บทที่ 8 การทดสอบสมมติฐานทางสถิติ",
    "subjectsPage.c1.t9": "บทที่ 9 การวิเคราะห์ความแปรปรวน",
    "subjectsPage.c1.t10": "บทที่ 10 การวิเคราะห์สหสัมพันธ์และการถดถอย",
    "subjectsPage.c1.t11": "บทที่ 11 การวิเคราะห์ข้อมูลเชิงจำแนก",
    "subjectsPage.c1.tag1": "R",
    "subjectsPage.c1.tag2": "Excel",
    "subjectsPage.c1.tag3": "SPSS",

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
    "hero.tagline": "Lecturer, Department of Statistics, Faculty of Science, Khon Kaen University (KKU), Khon Kaen 40002, Thailand",
    "hero.ctaCV": "Download CV",
    "hero.ctaContact": "Contact",
    "hero.image": "Profile / Cover Image",
    "hero.openTitle": "EDUCATION:",
    "hero.openPhD": "• Ph.D. in Statistics, Chonnam National University, South Korea",
    "hero.openMSc": "• M.Sc. in Statistics, Chonnam National University, South Korea",
    "hero.openBsc": "• B.Sc. in Statistics, Mahasarakham University, Thailand",

    // Chips
    "chips.rfa": "Design and Analysis of Computer Experiments",
    "chips.spi": "Statistical Meteorology including Extreme Events and Climate Change",
    "chips.evt": "Statistical Computing",

    // Featured
    "feat.badge": "Featured",
    "feat.title": "Ensemble Machine Learning for Comprehensive Drought Assessment: A Case Study in the Mun Watershed of Northeast Thailand",
    "feat.desc": "Tossapol Phoophiwfa, Prapawan Chomphuwiset, <u>Thanawan Prahadchai</u>, Sujitta Suraphee, Andrei Volodin, Piyapatr Busababodhin",
    "feat.read": "Read paper",
    "feat.code": "Code & data",
    "feat.open": "Open Access",

    // Highlights
    "highlights.title": "Highlights",
    "highlights.projects": "Ongoing Projects",
    "highlights.p1": "Distribution-Based Estimation of Hyperparameters for the Negative Power Transformation of the Generalized Extreme Value Distribution.",
    "highlights.p2": "Using Negative Power Transformation to Model Block Minima.",
    "highlights.focus": "Research Focus",
    "highlights.open": "Currently open to",
    "highlights.openDesc": "· Research collaboration <br>· Guest lectures <br>· Graduate supervision",
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
    "pubs.p1": "Distribution-Based Estimation of Hyperparameters for the Negative Power Transformation of the Generalized Extreme Value Distribution. Journal of applied statistics (under review)",
    "pubs.p2": "Using Negative Power Transformation to Model Block Minima. Journal of applied statistics (under review)",
    "pubs.p3": "Ensemble Machine Learning for Comprehensive Drought Assessment: A Case Study in the Mun Watershed of Northeast Thailand (2025)",
    "pubs.more": "View all",

    // Contact
    "contact.title": "Contact",
    "contact.addr": "Department of Statistics, Faculty of Science, Khon Kaen University SC06404",
    "contact.emailL": "Email:",
    "contact.emailBtn": "Email me",
    "contact.cv": "Download CV",

    // Footer
    "footer.copy": "© 2025 Thanawan Prahadchai — ",
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
    "subjectsPage.learning": "Course Description",
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
    "subjectsPage.c1.lecturerV": "Dr.Thanawan Prahadchai",
    "subjectsPage.c1.timeV": "Mon, Wed 09:00–10:30 (ICT)",
    "subjectsPage.c1.placeV": "Faculty of Science SC9109, KKU",
    "subjectsPage.c1.toolsV": "R / Python / Excel",
    "subjectsPage.c1.lo1": "Meaning of statistic, data and measurement, procedures for collecting and presentation of data, Measure of central tendency and dispersion, probability, random variables and distribution, sampling distribution, estimation and testing hypothesis, introduction to linear regression and correlation.",
    "subjectsPage.c1.link1": "R",
    "subjectsPage.c1.link2": "Excel",
    "subjectsPage.c1.link3": "SPSS",
    "subjectsPage.c1.link4": "Google Classroom",
    "subjectsPage.c1.gr1": "Assignments 30%",
    "subjectsPage.c1.gr2": "MIDTERM 20% • FINAL 30%",
    "subjectsPage.c1.gr3": "Project/Presentation 20%",
    "subjectsPage.c1.t1": "Chapter 1 Introduction to Statistics",
    "subjectsPage.c1.t2": "Chapter 2 Probability",
    "subjectsPage.c1.t3": "Chapter 3 Random Variables and Their Distributions",
    "subjectsPage.c1.t4": "Chapter 4 Discrete Probability Distributions",
    "subjectsPage.c1.t5": "Chapter 5 Discrete Probability Distributions",
    "subjectsPage.c1.t6": "Chapter 6 Continuous Probability Distributions",
    "subjectsPage.c1.t7": "Chapter 7 Estimation",
    "subjectsPage.c1.t8": "Chapter 8 Statistical Hypothesis Testing",
    "subjectsPage.c1.t9": "Chapter 9 Analysis of Variance",
    "subjectsPage.c1.t10": "Chapter 10 Correlation and Regression Analysis",
    "subjectsPage.c1.t11": "Chapter 11 Categorical Data Analysis",

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
