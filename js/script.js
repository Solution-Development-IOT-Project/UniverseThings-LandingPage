/* =========================================================
   Script principal
   - Tema
   - Navegación / Scroll suave
   - Animaciones fade-in
   - Bee 3D (Three.js + GLTFLoader + GSAP)
   - Neon control
   - Hojas (wind)
   ========================================================= */

import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";
import { gsap } from "https://cdn.skypack.dev/gsap";

/* ========= THEME TOGGLE ========= */
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle?.querySelector('i');
const storedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', storedTheme);
if (storedTheme === 'dark') {
  themeIcon?.classList.remove('fa-moon');
  themeIcon?.classList.add('fa-sun');
}
themeToggle?.addEventListener('click', () => {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  if (next === 'dark') {
    themeIcon?.classList.remove('fa-moon');
    themeIcon?.classList.add('fa-sun');
  } else {
    themeIcon?.classList.remove('fa-sun');
    themeIcon?.classList.add('fa-moon');
  }
});

/* ========= NAV MOBILE ========= */
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
menuToggle?.addEventListener('click', () => navLinks?.classList.toggle('active'));
document.querySelectorAll('.nav-links a').forEach(a =>
  a.addEventListener('click', () => navLinks?.classList.remove('active'))
);

/* ========= FADE-IN ON SCROLL ========= */
const fadeElements = document.querySelectorAll('.fade-in');
function fadeInOnScroll() {
  fadeElements.forEach(el => {
    if (el.getBoundingClientRect().top < window.innerHeight - 150) {
      el.classList.add('visible');
    }
  });
}
window.addEventListener('scroll', fadeInOnScroll, { passive:true });
fadeInOnScroll();

/* ========= SMOOTH ANCHOR SCROLL ========= */
document.addEventListener('click', e => {
  const link = e.target.closest("a[href^='#']");
  if (!link) return;
  const id = link.getAttribute('href').slice(1);
  const target = document.getElementById(id);
  if (target) {
    e.preventDefault();
    target.scrollIntoView({ behavior:'smooth' });
  }
});

/* =========================================================
   3D Bee
   ========================================================= */
let scene, camera, renderer, bee, mixer, clock;
let isBeeLoaded = false;

const beePositions = [
  { id: "hero",         position: { x:0,    y:-1,   z:0    },  rotation:{ x:0,    y:1.5,  z:0    } },
  { id: "problem",      position: { x:1.2,  y:-1,   z:-4   },  rotation:{ x:0.4,  y:-0.4, z:0.4  } },
  { id: "solution",     position: { x:-1,   y:-1,   z:-5   },  rotation:{ x:0,    y:0.5,  z:0.15 } },
  { id: "testimonials", position: { x:0.3,  y:-1.3, z:-6.2 },  rotation:{ x:0.2,  y:-0.8, z:-0.1 } },
  { id: "team",         position: { x:-0.6, y:-1.4, z:-7.5 },  rotation:{ x:-0.1, y:0.9,  z:0.25 } },
  { id: "contact",      position: { x:0.2,  y:-2,   z:-10  },  rotation:{ x:0.15, y:-0.5, z:-0.15} }
];

function initThree() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(10, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 13;

  renderer = new THREE.WebGLRenderer({ alpha:true, antialias:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const container = document.getElementById('container3D');
  if (container) {
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
  }

  scene.add(new THREE.AmbientLight(0xffffff, 1.25));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
  dirLight.position.set(500,500,500);
  scene.add(dirLight);

  clock = new THREE.Clock();
  loadBee();
  animate();
}

function loadBee() {
  const loader = new GLTFLoader();
  loader.load(
    // Modelo demon bee (más vistoso)
    "https://raw.githubusercontent.com/DennysDionigi/bee-glb/94253437c023643dd868592e11a0fd2c228cfe07/demon_bee_full_texture.glb",
    // Alternativa (descomenta para tu modelo original)
    // "https://raw.githubusercontent.com/Solution-Development-IOT-Project/UniverseThings-LandingPage/3Dmodelo/Sin_nombre.glb",
    gltf => {
      bee = gltf.scene;
      bee.traverse(obj => {
        if (obj.isMesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
        }
      });
      scene.add(bee);

      mixer = new THREE.AnimationMixer(bee);
      if (gltf.animations?.length) {
        mixer.clipAction(gltf.animations[0]).play();
      }
      isBeeLoaded = true;
      updateBeePosition();
    },
    xhr => console.log(((xhr.loaded / xhr.total) * 100).toFixed(1) + "% loaded"),
    err => console.error("Error cargando modelo:", err)
  );
}

function updateBeePosition() {
  if (!bee || !isBeeLoaded) return;
  const sections = document.querySelectorAll('section');
  let current = null;
  const threshold = window.innerHeight / 2.6;
  sections.forEach(sec => {
    const r = sec.getBoundingClientRect();
    if (r.top <= threshold) current = sec.id;
  });
  const def = beePositions.find(s => s.id === current);
  if (def) {
    gsap.to(bee.position, {
      x: def.position.x,
      y: def.position.y,
      z: def.position.z,
      duration:2.2,
      ease:"power2.out"
    });
    gsap.to(bee.rotation, {
      x: def.rotation.x,
      y: def.rotation.y,
      z: def.rotation.z,
      duration:2.2,
      ease:"power2.out"
    });
  }
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);
  if (renderer) renderer.render(scene, camera);
}

let scrollRAF = null;
window.addEventListener('scroll', () => {
  if (!isBeeLoaded) return;
  if (scrollRAF) cancelAnimationFrame(scrollRAF);
  scrollRAF = requestAnimationFrame(updateBeePosition);
}, { passive:true });

window.addEventListener('resize', () => {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* =========================================================
   Neon Control
   ========================================================= */
const hue1Input = document.getElementById('neonHue1');
const hue2Input = document.getElementById('neonHue2');
function updateNeon() {
  if (!hue1Input || !hue2Input) return;
  document.documentElement.style.setProperty('--neon-hue1', hue1Input.value);
  document.documentElement.style.setProperty('--neon-hue2', hue2Input.value);
}
[hue1Input, hue2Input].forEach(inp => {
  inp?.addEventListener('input', updateNeon);
});
updateNeon();

/* =========================================================
   Hojas (Wind)
   ========================================================= */
(function initLeaves(){
  const WIND_LEAF_COUNT = 160;
  const windContainer = document.querySelector('.wind');
  if (!windContainer) return;

  for (let i=0; i<WIND_LEAF_COUNT; i++) {
    const leaf = document.createElement('div');
    leaf.className = 'leaf';
    if (i%4===2) leaf.classList.add('variant-1');
    if (i%8===3) leaf.classList.add('variant-2');
    const span = document.createElement('span');

    const size = (Math.random()*0.35 + 0.15);
    span.style.width = `${size}vmin`;
    span.style.height = `${size}vmin`;

    const hue = 20 + Math.random()*25;
    const brightness = 0.6 + Math.random()*0.6;
    span.style.filter = `hue-rotate(${hue}deg) brightness(${brightness}) drop-shadow(0 0 ${Math.random()*2}px var(--leaf-shadow))`;

    const top = Math.random()*120;
    leaf.style.top = `${top}vh`;

    const speed = (5 + Math.random()*25).toFixed(2);
    const delay = (Math.random()*-15).toFixed(2);

    const driftKeyframes = `
      @keyframes leaf-drift-${i} {
        0% { transform:translate3d(0,0,0); }
        100% { transform:translate3d(calc(100vw + 8vmin),0,0); }
      }
    `;
    const styleEl = document.createElement('style');
    styleEl.textContent = driftKeyframes;
    document.head.appendChild(styleEl);

    leaf.style.animation = `leaf-drift-${i} ${speed}s linear ${delay}s infinite`;

    const spinDuration = (0.5 + Math.random()*1.1).toFixed(2);
    span.style.animation = `spin ${spinDuration}s ease-in-out 0s infinite alternate`;

    leaf.appendChild(span);
    windContainer.appendChild(leaf);
  }

  const directionZone = document.querySelector('.wind .direction');
  directionZone?.addEventListener('mouseenter', () => {
    windContainer.querySelectorAll('.leaf').forEach(l => l.style.animationDirection='reverse');
  });
  directionZone?.addEventListener('mouseleave', () => {
    windContainer.querySelectorAll('.leaf').forEach(l => l.style.animationDirection='normal');
  });
})();

/* =========================================================
   INIT
   ========================================================= */
window.addEventListener('DOMContentLoaded', () => {
  // Podrías lazy-load: setTimeout(initThree, 400);
  initThree();
});