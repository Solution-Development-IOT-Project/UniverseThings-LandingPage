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

let forceLeafMotion = true;
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
    //"https://raw.githubusercontent.com/DennysDionigi/bee-glb/94253437c023643dd868592e11a0fd2c228cfe07/demon_bee_full_texture.glb",
    // Alternativa (descomenta para tu modelo original)
     "https://raw.githubusercontent.com/Solution-Development-IOT-Project/UniverseThings-LandingPage/3Dmodelo/Sin_nombre.glb",
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
/* =======================
   Hojas con control toggle
   ======================= */

/* =========================================================
   Sistema de Hojas Animadas
   ========================================================= */
(function initLeaves() {
  const WIND_LEAF_COUNT = 160;
  const windContainer = document.querySelector('.wind');
  if (!windContainer) return;

  // Crear hojas con animación completa
  function createLeaf(i) {
    const leaf = document.createElement('div');
    leaf.className = 'leaf';
    
    // Variantes para diversidad visual
    if (i % 4 === 2) leaf.classList.add('variant-1');
    if (i % 8 === 3) leaf.classList.add('variant-2');

    const span = document.createElement('span');

    
 // MEZCLA DE TAMAÑOS - algunas pequeñas, medianas y grandes
const sizeOptions = [0.1, 0.2, 0.3, 0.75, 1.3];
const size = sizeOptions[Math.floor(Math.random() * sizeOptions.length)];
    span.style.width = `${size}vmin`;
    span.style.height = `${size}vmin`;
 

    // Color y efectos aleatorios
    const hue = 20 + Math.random() * 25;
    const brightness = 0.6 + Math.random() * 0.6;
    span.style.filter = `hue-rotate(${hue}deg) brightness(${brightness}) drop-shadow(0 0 ${Math.random() * 2}px var(--leaf-shadow))`;

    // Posición vertical aleatoria
    const top = Math.random() * 120;
    leaf.style.top = `${top}vh`;

    // Animación de desplazamiento
    const speed = (5 + Math.random() * 25).toFixed(2);
    const delay = (Math.random() * -15).toFixed(2);

    const keyName = `leaf-drift-${i}-${Date.now()}`;
    const driftKeyframes = `
      @keyframes ${keyName} {
        0% { transform: translate3d(0, 0, 0); }
        100% { transform: translate3d(calc(100vw + 8vmin), 0, 0); }
      }
    `;
    
    // Inyectar keyframes
    const styleEl = document.createElement('style');
    styleEl.textContent = driftKeyframes;
    document.head.appendChild(styleEl);

    leaf.style.animation = `${keyName} ${speed}s linear ${delay}s infinite`;

    // Animación de giro
    const spinDuration = (0.5 + Math.random() * 1.1).toFixed(2);
    span.style.animation = `spin ${spinDuration}s ease-in-out 0s infinite alternate`;

    leaf.appendChild(span);
    windContainer.appendChild(leaf);
  }

  // Crear todas las hojas
  for (let i = 0; i < WIND_LEAF_COUNT; i++) {
    createLeaf(i);
  }

  // Control de dirección con hover
  const directionZone = document.querySelector('.wind .direction');
  if (directionZone) {
    directionZone.addEventListener('mouseenter', () => {
      windContainer.querySelectorAll('.leaf').forEach(l => {
        l.style.animationDirection = 'reverse';
      });
    });
    
    directionZone.addEventListener('mouseleave', () => {
      windContainer.querySelectorAll('.leaf').forEach(l => {
        l.style.animationDirection = 'normal';
      });
    });
  }

  // Botón de play/pause (opcional)
  const createControlButton = () => {
    const btn = document.createElement('button');
    btn.textContent = 'Pausar Hojas';
    btn.style.position = 'fixed';
    btn.style.bottom = '20px';
    btn.style.right = '20px';
    btn.style.zIndex = '1000';
    btn.style.padding = '10px 15px';
    btn.style.background = 'var(--primary)';
    btn.style.color = 'white';
    btn.style.border = 'none';
    btn.style.borderRadius = '5px';
    btn.style.cursor = 'pointer';
    
    let paused = false;
    btn.addEventListener('click', () => {
      paused = !paused;
      btn.textContent = paused ? 'Reanudar Hojas' : 'Pausar Hojas';
      
      windContainer.querySelectorAll('.leaf').forEach(leaf => {
        leaf.style.animationPlayState = paused ? 'paused' : 'running';
        const span = leaf.querySelector('span');
        if (span) span.style.animationPlayState = paused ? 'paused' : 'running';
      });
    });
    
    document.body.appendChild(btn);
  };

  // Crear botón de control (opcional - descomenta si lo quieres)
  // createControlButton();

})();
/* =========================================================
   INIT
   ========================================================= */
window.addEventListener('DOMContentLoaded', () => {
  // Podrías lazy-load: setTimeout(initThree, 400);
  initThree();
  initCards3D();
});

/* =========================================================
   Sistema de Multiidioma - Traducción en tiempo real
   ========================================================= */

const translations = {
  es: {
    // Navegación
    "nav.problem": "Problema",
    "nav.solution": "Solución", 
    "nav.testimonials": "Testimonios",
    "nav.team": "Equipo",
    "nav.contact": "Contacto",
    
    // Hero
    "hero.title": "Revolucionando la Agricultura con IoT y Visión Artificial",
    "hero.description": "AgroPre es un sistema integral de monitoreo y automatización diseñado para optimizar el manejo de cultivos, con enfoque en la protección contra heladas y el control inteligente de plagas.",
    "hero.cta1": "Conocer AgroPre", 
    "hero.cta2": "Solicitar Demo",
    
    // Problema
    "problem.title": "El Desafío Agrícola Actual",
    "problem.card1.title": "Heladas Impredecibles",
    "problem.card1.description": "Las heladas pueden destruir cosechas enteras en horas, generando pérdidas económicas devastadoras.",
    "problem.card2.title": "Plagas Persistentes", 
    "problem.card2.description": "Plagas como los Áfidos provocan daños progresivos difíciles de detectar a tiempo sin monitoreo.",
    "problem.card3.title": "Métodos Tradicionales Ineficientes",
    "problem.card3.description": "Intervenciones manuales reactivas implican altos costos y bajo control de riesgos.",
    
    // Solución
    "solution.title": "Nuestra Solución: AgroPre",
    "solution.subtitle": "Automatización Inteligente para Cultivos", 
    "solution.description1": "AgroPre integra sensores, visión artificial y analítica en tiempo real para transformar la gestión climática y biológica.",
    "solution.description2": "Sistema modular escalable con monitoreo constante, protección activa y plataforma digital centralizada.",
    "solution.cta": "Solicitar Información",
    "solution.feature1.title": "Monitoreo en Tiempo Real",
    "solution.feature1.description": "Temperatura, humedad, imágenes y eventos críticos detectados automáticamente.",
    "solution.feature2.title": "Automatización Inteligente",
    "solution.feature2.description": "Actuadores activados por umbrales y modelos de detección de plagas.", 
    "solution.feature3.title": "Plataforma Digital",
    "solution.feature3.description": "Web y móvil con alertas, control remoto y registros históricos.",
    "solution.feature4.title": "Sostenibilidad",
    "solution.feature4.description": "Reducción de agua, químicos y mano de obra mediante precisión contextual.",
    
  // Solution 3D cards
  "solution.cards.card1.title": "Proyección-UniverseThing",
  "solution.cards.card1.desc": "Proyección de datos climáticos y de cultivos en tiempo real.",
 
    // Testimonios
    "testimonials.title": "Lo Que Dicen Nuestros Clientes",
    "testimonials.card1.text": "\"Antes perdía cosecha por heladas. Con AgroPre recibo alertas y el sistema actúa. Ahora produzco con tranquilidad.\"",
    "testimonials.card1.name": "Juan Pérez",
    "testimonials.card1.role": "Agricultor de papa, Junín", 
    "testimonials.card2.text": "\"La cooperativa ahora toma decisiones basadas en datos en tiempo real. Hemos reducido pérdidas y mejorado la coordinación.\"",
    "testimonials.card2.name": "María Gonzales",
    "testimonials.card2.role": "Gerente Cooperativa, Cusco",
    "testimonials.card3.text": "\"La integración de monitoreo, visión e intervención automática simplifica la gestión técnica de los cultivos.\"", 
    "testimonials.card3.name": "Carlos Rivas",
    "testimonials.card3.role": "Ingeniero Agrónomo",
    
    // Banner
    "banner.title": "Transforma tu Agricultura con Tecnología de Vanguardia",
    "banner.description": "Únete a los agricultores que ya incrementan su productividad gracias a AgroPre.",
    "banner.cta": "Comenzar Ahora",
    
    // Módulos
    "modules.title": "Nuestros Módulos en Acción", 
    "modules.card1.title": "Monitoreo Inteligente",
    "modules.card1.description": "Sensores de ambiente y suelo con actualización constante.",
    "modules.card2.title": "Visión Artificial",
    "modules.card2.description": "Detección de plagas y anomalías mediante IA embarcada.",
    "modules.card3.title": "Automatización", 
    "modules.card3.description": "Riego, protección antihelada y fumigación inteligente.",
    "modules.cta": "Ver más",
    
    // Equipo
    "team.title": "Nuestro Equipo",
    "team.role": "Ingeniero de Software",
    "team.member1.description": "Especialista en Python, C++ y Assembler.",
    "team.member2.description": "Experto en Python, C++ y Kotlin.", 
    "team.member3.description": "Desarrollo de soluciones innovadoras.",
    "team.member4.description": "Aplicaciones para agricultura de precisión.",
    "team.member5.description": "Sistemas robustos para entornos agrícolas.",
    
    // CTA
    "cta.title": "¿Listo para transformar tu agricultura?",
    "cta.description": "Únete a la revolución de la agricultura de precisión con UniverseThing y descubre cómo AgroPre reduce pérdidas y aumenta rentabilidad.", 
    "cta.cta": "Solicitar una Demo",
    
    // Footer
    "footer.description": "Soluciones IoT para Agricultura de Precisión.",
    "footer.links.title": "Enlaces",
    "footer.contact.title": "Contacto", 
    "footer.copyright": "Todos los derechos reservados."
  },
  
  en: {
    // Navigation
    "nav.problem": "Problem",
    "nav.solution": "Solution",
    "nav.testimonials": "Testimonials", 
    "nav.team": "Team",
    "nav.contact": "Contact",
    
    // Hero
    "hero.title": "Revolutionizing Agriculture with IoT and Computer Vision",
    "hero.description": "AgroPre is a comprehensive monitoring and automation system designed to optimize crop management, focusing on frost protection and intelligent pest control.",
    "hero.cta1": "Learn About AgroPre", 
    "hero.cta2": "Request Demo",
    
    // Problem
    "problem.title": "Current Agricultural Challenge", 
    "problem.card1.title": "Unpredictable Frosts",
    "problem.card1.description": "Frost can destroy entire crops in hours, generating devastating economic losses.",
    "problem.card2.title": "Persistent Pests",
    "problem.card2.description": "Pests like Aphids cause progressive damage that's difficult to detect in time without monitoring.", 
    "problem.card3.title": "Inefficient Traditional Methods",
    "problem.card3.description": "Reactive manual interventions involve high costs and low risk control.",
    
    // Solution
    "solution.title": "Our Solution: AgroPre",
    "solution.subtitle": "Smart Automation for Crops", 
    "solution.description1": "AgroPre integrates sensors, computer vision and real-time analytics to transform climate and biological management.",
    "solution.description2": "Scalable modular system with constant monitoring, active protection and centralized digital platform.",
    "solution.cta": "Request Information",
    "solution.feature1.title": "Real-time Monitoring",
    "solution.feature1.description": "Temperature, humidity, images and critical events automatically detected.", 
    "solution.feature2.title": "Smart Automation",
    "solution.feature2.description": "Actuators activated by thresholds and pest detection models.",
    "solution.feature3.title": "Digital Platform",
    "solution.feature3.description": "Web and mobile with alerts, remote control and historical records.", 
    "solution.feature4.title": "Sustainability",
    "solution.feature4.description": "Reduction of water, chemicals and labor through contextual precision.",
    
  // Solution 3D cards
  "solution.cards.card1.title": "Projection-UniverseThing",
  "solution.cards.card1.desc": "Projection of climate and crop data in real time.",
 
    // Testimonials
    "testimonials.title": "What Our Clients Say",
    "testimonials.card1.text": "\"I used to lose crops to frost. With AgroPre I receive alerts and the system acts. Now I produce with peace of mind.\"", 
    "testimonials.card1.name": "Juan Pérez",
    "testimonials.card1.role": "Potato Farmer, Junín",
    "testimonials.card2.text": "\"The cooperative now makes decisions based on real-time data. We have reduced losses and improved coordination.\"",
    "testimonials.card2.name": "María Gonzales", 
    "testimonials.card2.role": "Cooperative Manager, Cusco",
    "testimonials.card3.text": "\"The integration of monitoring, vision and automatic intervention simplifies the technical management of crops.\"",
    "testimonials.card3.name": "Carlos Rivas",
    "testimonials.card3.role": "Agricultural Engineer", 
    
    // Banner
    "banner.title": "Transform Your Agriculture with Cutting-Edge Technology",
    "banner.description": "Join the farmers who are already increasing their productivity thanks to AgroPre.",
    "banner.cta": "Get Started Now",
    
    // Modules
    "modules.title": "Our Modules in Action", 
    "modules.card1.title": "Smart Monitoring",
    "modules.card1.description": "Environmental and soil sensors with constant updating.",
    "modules.card2.title": "Computer Vision", 
    "modules.card2.description": "Pest and anomaly detection through embedded AI.",
    "modules.card3.title": "Automation",
    "modules.card3.description": "Irrigation, anti-frost protection and smart fumigation.",
    "modules.cta": "Learn More",
    
    // Team
    "team.title": "Our Team", 
    "team.role": "Software Engineer",
    "team.member1.description": "Specialist in Python, C++ and Assembler.",
    "team.member2.description": "Expert in Python, C++ and Kotlin.",
    "team.member3.description": "Development of innovative solutions.", 
    "team.member4.description": "Applications for precision agriculture.",
    "team.member5.description": "Robust systems for agricultural environments.",
    
    // CTA
    "cta.title": "Ready to transform your agriculture?",
    "cta.description": "Join the precision agriculture revolution with UniverseThing and discover how AgroPre reduces losses and increases profitability.", 
    "cta.cta": "Request a Demo",
    
    // Footer
    "footer.description": "IoT Solutions for Precision Agriculture.",
    "footer.links.title": "Links", 
    "footer.contact.title": "Contact",
    "footer.copyright": "All rights reserved."
  }
};

let currentLanguage = 'es';

function translatePage() {
  const elements = document.querySelectorAll('[data-i18n]');
  
  elements.forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (translations[currentLanguage] && translations[currentLanguage][key]) {
      // Para elementos de entrada (input) usamos value, para otros textContent
      if (element.tagName === 'INPUT') {
        element.value = translations[currentLanguage][key];
      } else {
        element.textContent = translations[currentLanguage][key];
      }
    }
  });
  
  // Actualizar el atributo lang del HTML
  document.documentElement.lang = currentLanguage;
}

// Cambio de idioma
const langToggleBtn = document.getElementById('lang-toggle');

if (langToggleBtn) {
  langToggleBtn.addEventListener('click', () => {
    if (currentLanguage === 'es') {
      currentLanguage = 'en';
      langToggleBtn.textContent = 'Español';
    } else {
      currentLanguage = 'es';
      langToggleBtn.textContent = 'English';
    }

    translatePage();
  });
}

// Inicializar traducción al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  translatePage();
});

/* =========================================================
   3D Cards Hover (vanilla)
   ========================================================= */
function initCards3D() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const wraps = document.querySelectorAll('.card3d-wrap');
  if (!wraps.length) return;
  wraps.forEach(wrap => {
    const card = wrap.querySelector('.card3d');
    const bg = wrap.querySelector('.card3d-bg');
    if (!card || !bg) return;
    let rect;
    const reset = () => {
      card.style.transform = 'rotateX(0deg) rotateY(0deg)';
      bg.style.transform = 'translate3d(0,0,0)';
    };
    const onMove = e => {
      if (prefersReduced || isTouch) return; // keep it calm on reduced-motion and touch
      rect = rect || wrap.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5..0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      const rotY = x * 30; // degrees
      const rotX = -y * 30;
      const tx = -x * 40; // px parallax
      const ty = -y * 40;
      card.style.transform = `rotateY(${rotY}deg) rotateX(${rotX}deg)`;
      bg.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
    };
    const onEnter = () => { rect = wrap.getBoundingClientRect(); };
    const onLeave = () => { rect = null; reset(); };

    wrap.addEventListener('mousemove', onMove);
    wrap.addEventListener('mouseenter', onEnter);
    wrap.addEventListener('mouseleave', onLeave);
  });

  // Simple slideshow for single card variant
  const slideshowWrap = document.getElementById('card3d-slideshow');
  if (slideshowWrap) {
    const bg = slideshowWrap.querySelector('.card3d-bg');
    if (bg) {
      const images = [
        './images/agropre1.jpeg',
        './images/agropre2.jpeg',
        './images/agropre3.jpeg',
        './images/agropre4.jpeg'
      ];
      let idx = 0;
      let timer = null;
      const intervalMs = Math.max(500, parseInt(slideshowWrap.dataset.interval || '3500', 10));
      const fadeMs = Math.max(0, parseInt(slideshowWrap.dataset.fade || '250', 10));
      const setBg = (src) => {
        // fade out then change then fade in
        bg.style.opacity = '0.2';
        setTimeout(() => {
          bg.style.backgroundImage = `url(${src})`;
          bg.style.opacity = '0.85';
        }, fadeMs);
      };
      const start = () => {
        if (prefersReduced) return;
        stop();
        timer = setInterval(() => {
          idx = (idx + 1) % images.length;
          setBg(images[idx]);
        }, intervalMs);
      };
      const stop = () => { if (timer) { clearInterval(timer); timer = null; } };

      // init first image immediately
      bg.style.backgroundImage = `url(${images[0]})`;

      // pause on hover of the whole card
      slideshowWrap.addEventListener('mouseenter', stop);
      slideshowWrap.addEventListener('mouseleave', start);

      // start autoplay
      start();
    }
  }
}