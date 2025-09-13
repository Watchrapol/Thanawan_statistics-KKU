// คำแปล 2 ภาษา + ตัวสลับภาษา (จำค่าไว้ใน localStorage)
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

    // Hero (Intro)
    "hero.name": "Thanawan Prahadchai",
    "hero.tagline": "อาจารย์ประจำสาขาสถิติ มข. — ทำวิจัยด้านเหตุการณ์สุดขั้ว (Extreme Events), การวิเคราะห์ความถี่เชิงภูมิภาค (RFA) และ AI สำหรับข้อมูลสถิติ",
    "hero.ctaCV": "ดาวน์โหลด CV",
    "hero.ctaContact": "ติดต่อ",
    "hero.image": "ภาพโปรไฟล์ / หน้าปก",
    "hero.openTitle": "กำลังเปิดรับ:",
    "hero.openCollab": "• ความร่วมมือวิจัย",
    "hero.openGuest": "• บรรยายพิเศษ / วิทยากร",
    "hero.openSupervision": "• ที่ปรึกษางานวิจัยระดับบัณฑิตศึกษา",

    // Chips (research areas)
    "chips.rfa": "RFA & L-moments",
    "chips.spi": "ดัชนีภัยแล้ง (SPI/SPEI)",
    "chips.evt": "Extreme Value Theory",
    "chips.ts": "อนุกรมเวลา",
    "chips.ai": "Statistical AI",

    // Featured strip
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

    // Subjects
    "subjects.title": "รายวิชาในเทอมนี้",
    "subjects.c1meta": "ภาคต้น 2568 • เอกสาร • Syllabus",
    "subjects.c2meta": "ภาคต้น 2568 • เอกสาร • Syllabus ",
    "subjects.c3meta": "คอร์สสั้น • โน้ต • ชุดข้อมูล",
    "subjects.syllabus": "Syllabus",
    "subjects.materials": "เอกสาร",
    "subjects.notes": "โน้ต",

    // Publications
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
    "footer.sitemap": "แผนผังเว็บไซต์"
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
    "hero.tagline": "Lecturer in Statistics at KKU — research on extreme events, Regional Frequency Analysis (RFA), and AI for statistics.",
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

    // Featured strip
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

    // Subjects
    "subjects.title": "Subjects this term",
    "subjects.c1meta": "2nd semester 2025 • Materials • Syllabus",
    "subjects.c2meta": "1st semester 2025 • Slides • Labs",
    "subjects.c3meta": "Short course • Notes • Datasets",
    "subjects.syllabus": "Syllabus",
    "subjects.materials": "Materials",
    "subjects.notes": "Notes",

    // Publications
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
    "footer.sitemap": "Sitemap"
  }
};

function setLanguage(lang){
  const dict = I18N[lang] || I18N.th;
  document.documentElement.lang = lang;

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dict[key] !== undefined) el.innerHTML = dict[key];
  });

  // ปรับสถานะปุ่ม
  document.querySelectorAll(".lang-btn").forEach(btn=>{
    btn.setAttribute("aria-pressed", String(btn.dataset.lang === lang));
  });

  localStorage.setItem("lang", lang);
}

document.addEventListener("DOMContentLoaded", ()=>{
  const saved = localStorage.getItem("lang") || "th";
  setLanguage(saved);

  document.querySelectorAll(".lang-btn").forEach(btn=>{
    btn.addEventListener("click", ()=> setLanguage(btn.dataset.lang));
  });
});
