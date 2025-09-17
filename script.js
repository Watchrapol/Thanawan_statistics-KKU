document.addEventListener('DOMContentLoaded', () => {
  new Swiper('.mySwiper', {
    direction: 'horizontal',
    slidesPerView: 1,        // กลางเต็ม 1 ใบ
    centeredSlides: true,    // จัดกลาง
    spaceBetween: 16,        // ระยะห่าง (มีผลกับพื้นที่ peek)
    loop: true,
    grabCursor: true,
    // ไม่ต้องใช้ coverflow ก็ได้ ถ้าอยากเน้นเรียบ ๆ
    // effect: 'slide',

    observer: true,
    observeParents: true,
    updateOnWindowResize: true,

    autoplay: { delay: 3000, disableOnInteraction: false },
    pagination: { el: '.swiper-pagination', clickable: true },

    // มือถือ: ลด padding (เราจะตั้งใน CSS ด้วย)
    breakpoints: {
      0:   { spaceBetween: 12 },
      768: { spaceBetween: 16 }
    }
  });
});
