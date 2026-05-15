// ===== GALLERY LIGHTBOX =====
const galleryItems = document.querySelectorAll('.gallery__item');
const lightbox     = document.getElementById('lightbox');
const lbImg        = document.getElementById('lbImg');
const lbCounter    = document.getElementById('lbCounter');
const lbClose      = document.getElementById('lbClose');
const lbPrev       = document.getElementById('lbPrev');
const lbNext       = document.getElementById('lbNext');

const images = Array.from(galleryItems).map(item => ({
  src: item.querySelector('img').src,
  alt: item.querySelector('img').alt
}));

let currentIndex = 0;

function openLightbox(index) {
  currentIndex = index;
  lbImg.src    = images[index].src;
  lbImg.alt    = images[index].alt;
  lbCounter.textContent = (index + 1) + ' / ' + images.length;
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function showPrev() {
  currentIndex = (currentIndex - 1 + images.length) % images.length;
  lbImg.style.opacity = '0';
  setTimeout(() => {
    lbImg.src = images[currentIndex].src;
    lbImg.alt = images[currentIndex].alt;
    lbCounter.textContent = (currentIndex + 1) + ' / ' + images.length;
    lbImg.style.opacity = '1';
  }, 150);
}

function showNext() {
  currentIndex = (currentIndex + 1) % images.length;
  lbImg.style.opacity = '0';
  setTimeout(() => {
    lbImg.src = images[currentIndex].src;
    lbImg.alt = images[currentIndex].alt;
    lbCounter.textContent = (currentIndex + 1) + ' / ' + images.length;
    lbImg.style.opacity = '1';
  }, 150);
}

galleryItems.forEach((item, i) => item.addEventListener('click', () => openLightbox(i)));
lbClose.addEventListener('click', closeLightbox);
lbPrev.addEventListener('click', showPrev);
lbNext.addEventListener('click', showNext);

lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

document.addEventListener('keydown', e => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape')     closeLightbox();
  if (e.key === 'ArrowLeft')  showPrev();
  if (e.key === 'ArrowRight') showNext();
});

// ===== HEADER SCROLL SHADOW =====
// Header scroll shadow
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 10);
});

// Mobile burger menu
const burger = document.getElementById('burger');
const nav    = document.getElementById('nav');

burger.addEventListener('click', () => {
  nav.classList.toggle('open');
  burger.classList.toggle('active');
});

// Close nav on link click
nav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    burger.classList.remove('active');
  });
});

// Contact form — simple validation + success message
document.getElementById('contactForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const name  = this.name.value.trim();
  const phone = this.phone.value.trim();

  if (!name || !phone) {
    alert('Моля, попълнете вашето име и телефон.');
    return;
  }

  this.innerHTML = `
    <div style="text-align:center;padding:40px 20px">
      <div style="font-size:56px;margin-bottom:16px">✅</div>
      <h3 style="margin-bottom:12px;color:#0f172a">Благодаря!</h3>
      <p style="color:#6b7280">Ще се свържа с теб скоро, <strong>${name}</strong>!</p>
    </div>
  `;
});

// Smooth active nav highlight on scroll
const sections = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.nav a[href^="#"]');

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(l => l.classList.remove('active'));
      const active = document.querySelector(`.nav a[href="#${entry.target.id}"]`);
      if (active) active.classList.add('active');
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => observer.observe(s));

// Add active nav style dynamically
const style = document.createElement('style');
style.textContent = '.nav a.active { color: var(--primary); background: var(--primary-light); }';
document.head.appendChild(style);
