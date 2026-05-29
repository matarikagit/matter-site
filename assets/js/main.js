const slides = Array.from(document.querySelectorAll('.featured-slide'));
const nextButton = document.querySelector('[data-carousel="next"]');
const prevButton = document.querySelector('[data-carousel="prev"]');
let currentSlide = 0;

function showSlide(index) {
  if (!slides.length) return;
  currentSlide = (index + slides.length) % slides.length;
  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === currentSlide);
  });
}

nextButton?.addEventListener('click', (event) => {
  event.preventDefault();
  showSlide(currentSlide + 1);
});

prevButton?.addEventListener('click', (event) => {
  event.preventDefault();
  showSlide(currentSlide - 1);
});
