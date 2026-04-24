/* ============================================
   COOL AIR ENTERPRISES — Main Script
   ============================================
   TABLE OF CONTENTS
   1.  Init on DOM Ready
   2.  Navbar — Scroll + Active Link
   3.  Mobile Hamburger Menu
   4.  Three.js — Hero Particle Field (index.html)
   5.  Three.js — Wireframe Shape (inner page heroes)
   6.  3D Tilt Cards (CSS perspective via mousemove)
   7.  Count-Up Animation
   8.  Scroll Reveal — IntersectionObserver
   9.  Underline Draw — IntersectionObserver
   10. Contact Form Validation & Success
   ============================================ */

/* ============================================
   1. INIT
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initMobileMenu();
  initScrollReveal();
  initUnderlineDraw();
  initCountUp();
  initTiltCards();
  initContactForm();
  initScrollCueFade();

  // Page-specific Three.js
  const heroCanvas = document.getElementById('hero-canvas');
  if (heroCanvas) initHeroParticles(heroCanvas);

  const innerCanvas = document.getElementById('page-hero-canvas');
  if (innerCanvas) initWireframeShape(innerCanvas);
});

/* ============================================
   2. NAVBAR
   ============================================ */
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Highlight active page link
  const links = navbar.querySelectorAll('.nav-links a');
  const page  = location.pathname.split('/').pop() || 'index.html';
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // Also highlight mobile menu links
  const mobileLinks = document.querySelectorAll('.mobile-menu a');
  mobileLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

/* ============================================
   2b. SCROLL CUE FADE
   ============================================ */
function initScrollCueFade() {
  const scrollCue = document.querySelector('.scroll-cue');
  if (!scrollCue) return;

  // Use a class with !important so it overrides the CSS animation
  // (CSS animations sit above inline styles in the cascade)
  window.addEventListener('scroll', () => {
    scrollCue.classList.toggle('is-hidden', window.scrollY > 80);
  }, { passive: true });
}

/* ============================================
   3. MOBILE HAMBURGER MENU
   ============================================ */
function initMobileMenu() {
  const hamburger   = document.querySelector('.hamburger');
  const mobileMenu  = document.querySelector('.mobile-menu');
  if (!hamburger || !mobileMenu) return;

  const toggle = (force) => {
    const open = force !== undefined ? force : !hamburger.classList.contains('open');
    hamburger.classList.toggle('open', open);
    mobileMenu.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };

  hamburger.addEventListener('click', () => toggle());

  // Close on link click
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => toggle(false));
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') toggle(false);
  });
}

/* ============================================
   4. THREE.JS — HERO PARTICLE FIELD
   ============================================ */
function initHeroParticles(canvas) {
  if (typeof THREE === 'undefined') return;

  const W = () => window.innerWidth;
  const H = () => window.innerHeight;

  const scene    = new THREE.Scene();
  const camera   = new THREE.PerspectiveCamera(60, W() / H(), 0.1, 2000);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W(), H());
  renderer.setClearColor(0x000000, 0);
  camera.position.z = 120;

  /* ------ Particle System ------ */
  const COUNT = 1800;
  const geometry = new THREE.BufferGeometry();

  const positions = new Float32Array(COUNT * 3);
  const colors    = new Float32Array(COUNT * 3);
  const sizes     = new Float32Array(COUNT);
  const speeds    = new Float32Array(COUNT);   // drift speed per particle

  const colIceBlue   = new THREE.Color(0x38bdf8);
  const colWhite     = new THREE.Color(0xf0f9ff);
  const colSkyDeep   = new THREE.Color(0x0ea5e9);

  const SPREAD_X = 280, SPREAD_Y = 180, SPREAD_Z = 120;

  for (let i = 0; i < COUNT; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * SPREAD_X;
    positions[i * 3 + 1] = (Math.random() - 0.5) * SPREAD_Y;
    positions[i * 3 + 2] = (Math.random() - 0.5) * SPREAD_Z;

    const r = Math.random();
    const c = r < 0.55 ? colIceBlue : r < 0.82 ? colWhite : colSkyDeep;
    colors[i * 3]     = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;

    sizes[i]  = Math.random() * 1.6 + 0.4;
    speeds[i] = Math.random() * 0.06 + 0.015;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.9,
    vertexColors: true,
    transparent: true,
    opacity: 0.72,
    sizeAttenuation: true,
    depthWrite: false,
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  /* ------ Subtle fog for depth ------ */
  scene.fog = new THREE.FogExp2(0x030712, 0.006);

  /* ------ Mouse Parallax ------ */
  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;

  const onMouseMove = (e) => {
    targetX = ((e.clientX / W()) - 0.5) * 18;
    targetY = -((e.clientY / H()) - 0.5) * 12;
  };
  window.addEventListener('mousemove', onMouseMove, { passive: true });

  /* ------ Animation ------ */
  const clock = new THREE.Clock();

  const animate = () => {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    // Gentle global rotation
    particles.rotation.y += 0.00018;
    particles.rotation.x += 0.00009;

    // Drift particles downward (snow effect)
    const pos = geometry.attributes.position.array;
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3 + 1] -= speeds[i] * delta * 30;
      // Add slight horizontal sway
      pos[i * 3]     += Math.sin(clock.elapsedTime * 0.3 + i) * 0.003;

      if (pos[i * 3 + 1] < -SPREAD_Y * 0.5) {
        pos[i * 3 + 1] = SPREAD_Y * 0.5;
        pos[i * 3]     = (Math.random() - 0.5) * SPREAD_X;
        pos[i * 3 + 2] = (Math.random() - 0.5) * SPREAD_Z;
      }
    }
    geometry.attributes.position.needsUpdate = true;

    // Smooth camera parallax
    currentX += (targetX - currentX) * 0.04;
    currentY += (targetY - currentY) * 0.04;
    camera.position.x = currentX;
    camera.position.y = currentY;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  };
  animate();

  /* ------ Resize ------ */
  window.addEventListener('resize', () => {
    camera.aspect = W() / H();
    camera.updateProjectionMatrix();
    renderer.setSize(W(), H());
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });
}

/* ============================================
   5. THREE.JS — WIREFRAME SHAPE (INNER HEROES)
   ============================================ */
function initWireframeShape(canvas) {
  if (typeof THREE === 'undefined') return;

  const parent = canvas.parentElement;
  const getW   = () => parent.offsetWidth;
  const getH   = () => parent.offsetHeight;

  const scene    = new THREE.Scene();
  const camera   = new THREE.PerspectiveCamera(55, getW() / getH(), 0.1, 500);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(getW(), getH());
  renderer.setClearColor(0x000000, 0);
  camera.position.z = 7;

  /* ------ Icosahedron wireframe ------ */
  const geoIco    = new THREE.IcosahedronGeometry(2.6, 1);
  const edges     = new THREE.EdgesGeometry(geoIco);
  const matLines  = new THREE.LineBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.28,
  });
  const wireframe = new THREE.LineSegments(edges, matLines);
  scene.add(wireframe);

  /* ------ Second smaller shape for depth ------ */
  const geoSmall  = new THREE.OctahedronGeometry(1.2, 0);
  const edgesSm   = new THREE.EdgesGeometry(geoSmall);
  const matSm     = new THREE.LineBasicMaterial({
    color: 0x0ea5e9,
    transparent: true,
    opacity: 0.18,
  });
  const wire2 = new THREE.LineSegments(edgesSm, matSm);
  wire2.position.set(1.5, -0.8, -1);
  scene.add(wire2);

  const animate = () => {
    requestAnimationFrame(animate);
    wireframe.rotation.x += 0.0028;
    wireframe.rotation.y += 0.0045;
    wireframe.rotation.z += 0.001;
    wire2.rotation.x -= 0.004;
    wire2.rotation.y += 0.003;
    renderer.render(scene, camera);
  };
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = getW() / getH();
    camera.updateProjectionMatrix();
    renderer.setSize(getW(), getH());
  });
}

/* ============================================
   6. 3D TILT CARDS
   ============================================ */
function initTiltCards() {
  const cards = document.querySelectorAll('.tilt-card');
  if (!cards.length) return;

  cards.forEach(card => {
    let animId = null;
    let currentRX = 0, currentRY = 0;
    let targetRX  = 0, targetRY  = 0;
    let isHovered = false;

    card.addEventListener('mousemove', (e) => {
      const rect    = card.getBoundingClientRect();
      const x       = e.clientX - rect.left;
      const y       = e.clientY - rect.top;
      const centerX = rect.width  / 2;
      const centerY = rect.height / 2;
      targetRX = ((y - centerY) / centerY) * -9;
      targetRY = ((x - centerX) / centerX) *  9;
    });

    card.addEventListener('mouseenter', () => {
      isHovered = true;
      if (!animId) loop();
    });

    card.addEventListener('mouseleave', () => {
      isHovered = false;
      targetRX = 0;
      targetRY = 0;
    });

    const loop = () => {
      currentRX += (targetRX - currentRX) * 0.12;
      currentRY += (targetRY - currentRY) * 0.12;

      card.style.transform =
        `perspective(1000px) rotateX(${currentRX.toFixed(3)}deg) rotateY(${currentRY.toFixed(3)}deg) translateZ(${isHovered ? '8px' : '0'})`;

      if (Math.abs(currentRX) > 0.05 || Math.abs(currentRY) > 0.05 || isHovered) {
        animId = requestAnimationFrame(loop);
      } else {
        card.style.transform = '';
        animId = null;
      }
    };
  });
}

/* ============================================
   7. COUNT-UP ANIMATION
   ============================================ */
function initCountUp() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const formatNum = (val, hasPlus) => {
    const int = Math.floor(val);
    return hasPlus ? `${int}+` : `${int}%`;
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);

      const el      = entry.target;
      const target  = parseInt(el.dataset.count, 10);
      const hasPlus = el.dataset.suffix === '+';
      const hasPct  = el.dataset.suffix === '%';
      const duration = 1800;
      const start   = performance.now();

      const tick = (now) => {
        const elapsed  = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Easing: ease-out cubic
        const eased    = 1 - Math.pow(1 - progress, 3);
        const current  = target * eased;

        el.textContent = hasPct ? `${Math.floor(current)}%` : `${Math.floor(current)}+`;

        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = hasPct ? `${target}%` : `${target}+`;
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}

/* ============================================
   8. SCROLL REVEAL
   ============================================ */
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(el => observer.observe(el));
}

/* ============================================
   9. UNDERLINE DRAW
   ============================================ */
function initUnderlineDraw() {
  const elements = document.querySelectorAll('.underline-draw');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  elements.forEach(el => observer.observe(el));

  // Also watch project cards for border draw animation
  const projectCards = document.querySelectorAll('.project-full-card');
  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        cardObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  projectCards.forEach(card => cardObserver.observe(card));
}

/* ============================================
   10. CONTACT FORM VALIDATION
   ============================================ */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const showError = (group, msg) => {
    group.classList.add('error');
    const errEl = group.querySelector('.form-error-msg');
    if (errEl) errEl.textContent = msg;
  };

  const clearError = (group) => {
    group.classList.remove('error');
  };

  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const validatePhone = (phone) =>
    /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''));

  // Real-time clear errors
  form.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('input', () => {
      clearError(field.closest('.form-group'));
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    const nameGroup    = form.querySelector('[data-field="name"]');
    const phoneGroup   = form.querySelector('[data-field="phone"]');
    const emailGroup   = form.querySelector('[data-field="email"]');
    const serviceGroup = form.querySelector('[data-field="service"]');
    const msgGroup     = form.querySelector('[data-field="message"]');

    const nameVal    = nameGroup.querySelector('input').value.trim();
    const phoneVal   = phoneGroup.querySelector('input').value.trim();
    const emailVal   = emailGroup.querySelector('input').value.trim();
    const serviceVal = serviceGroup.querySelector('select').value;
    const msgVal     = msgGroup.querySelector('textarea').value.trim();

    // Name
    if (nameVal.length < 2) {
      showError(nameGroup, 'Please enter your full name.');
      valid = false;
    }
    // Phone
    if (!validatePhone(phoneVal)) {
      showError(phoneGroup, 'Enter a valid 10-digit Indian mobile number.');
      valid = false;
    }
    // Email
    if (!validateEmail(emailVal)) {
      showError(emailGroup, 'Enter a valid email address.');
      valid = false;
    }
    // Service
    if (!serviceVal) {
      showError(serviceGroup, 'Please select a service.');
      valid = false;
    }
    // Message
    if (msgVal.length < 20) {
      showError(msgGroup, 'Message must be at least 20 characters.');
      valid = false;
    }

    if (!valid) return;

    // Success
    const formEl      = form.querySelector('.form-fields');
    const successEl   = form.querySelector('.form-success');
    if (formEl && successEl) {
      formEl.style.display     = 'none';
      successEl.classList.add('visible');
    }
  });
}
