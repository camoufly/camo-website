import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import ThreeGlobe from "three-globe";
import * as topojson from "topojson-client";

// === Event Data ===
const events = [
  { lat: 51.5074, lng: -0.1278, country: 'United Kingdom', name: 'UKF Invites – London', date: 'Aug 6, 2025', link: 'https://ra.co/events/22180551451883445855686343' },
  { lat: 37.5683, lng: 14.3839, country: 'Italy', name: 'Mosaico Festival – Piazza Armerina', date: 'Aug 8, 2025', link: 'https://dice.fm/bundles/mosaico-festival-2025-d99o' },
  { lat: 38.9050, lng: 16.5870, country: 'Italy', name: 'Factory Area Festival – Catanzaro', date: 'Aug 20, 2025', link: 'https://linktr.ee/FACTORYAREA' },
  { lat: 52.5200, lng: 13.4050, country: 'Germany', name: 'Lava Festival – Berlin', date: 'Aug 31, 2025', link: 'https://www.ticketmaster.de/event/1709407918' },
  { lat: 48.8566, lng: 2.3522, country: 'France', name: 'Les Nuits de la Bomba – Paris', date: 'Sep 20, 2025', link: 'https://dice.fm/event/avgo2d-les-nuits-de-la-bomba-et-leurs-amis-pass-samedi-trabendo-20th-sep' }
];

const container = document.getElementById('globe-container');
const tooltip   = document.getElementById('tooltip');
const eventList = document.getElementById('event-list');

// === Scene & Camera ===
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 2000);
camera.position.set(0, 0, 350);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

// === Controls ===
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 160; 
controls.maxDistance = 400;
controls.rotateSpeed = 0.7;

// === Lat/Lng to Vector3 ===
function latLngToVector3(lat, lng, radius = 100.2) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = lng * Math.PI / 180; // FIX: removed +180
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta), // keep minus sign for correct orientation
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// === Globe ===
const globe = new ThreeGlobe()
  .globeImageUrl('') 
  .showAtmosphere(false)
  .showGraticules(false)
  .pointsData(events)
  .pointLat('lat')
  .pointLng('lng')
  .pointAltitude(0.02)
  .pointRadius(0.6)
  .pointColor(() => '#ff4081');

globe.globeMaterial(new THREE.MeshBasicMaterial({ color: 0xffffff }));
scene.add(globe);

// === Lighting ===
scene.add(new THREE.AmbientLight(0xffffff, 1.2));
const dl = new THREE.DirectionalLight(0xffffff, 0.6);
dl.position.set(1, 1, 1);
scene.add(dl);

// === Borders ===
fetch('https://unpkg.com/world-atlas@2/countries-110m.json')
  .then(res => res.json())
  .then(worldData => {
    const rawFeatures = topojson.feature(worldData, worldData.objects.countries).features;

    const countries = rawFeatures.filter(f =>
      f.geometry &&
      (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')
    );

    const eventCountries = new Set(events.map(e => e.country));

    globe
      .hexPolygonsData(countries)
      .hexPolygonResolution(3)
      .hexPolygonMargin(0.3)
      .hexPolygonColor(d => {
        const name = d.properties?.name || '';
        return eventCountries.has(name) ? '#e0e0e0' : 'rgba(0,0,0,0)';
      });

    const borderMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    countries.forEach(feature => {
      const coords = feature.geometry.coordinates;
      (feature.geometry.type === 'MultiPolygon' ? coords : [coords]).forEach(polygon => {
        polygon.forEach(ring => {
          const points = ring.map(([lng, lat]) => latLngToVector3(lat, lng));
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          globe.add(new THREE.LineLoop(geometry, borderMaterial));
        });
      });
    });
  });

// === Hover State Management ===
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let currentHoveredEvent = null;
let isHovering = false;

function startHover(ev) {
  if (!isHovering) {
    isHovering = true;
    currentHoveredEvent = ev;
    focusOnEvent(ev, true);
  }
}

function endHover() {
  if (isHovering) {
    isHovering = false;
    currentHoveredEvent = null;
    resetCameraPosition();
  }
}

// === Mouse Hover on Globe ===
document.addEventListener('mousemove', e => {
  mouse.x = (e.clientX / container.clientWidth) * 2 - 1;
  mouse.y = -(e.clientY / container.clientHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(globe.pointsData().map(p => p.__threeObj).filter(Boolean));

  if (intersects.length > 0) {
    const d = intersects[0].object.__data;
    tooltip.innerHTML = `<strong>${d.name}</strong><br>${d.date}`;
    tooltip.style.left = e.clientX + 15 + 'px';
    tooltip.style.top = e.clientY + 15 + 'px';
    tooltip.classList.remove('hidden');
    container.style.cursor = 'pointer';
    startHover(d);
  } else {
    tooltip.classList.add('hidden');
    container.style.cursor = 'grab';
    endHover();
  }
});

// === Click on Globe ===
document.addEventListener('click', e => {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(globe.pointsData().map(p => p.__threeObj).filter(Boolean));
  if (intersects.length > 0) {
    const d = intersects[0].object.__data;
    if (d.link) window.open(d.link, '_blank');
  }
});

// === Hover on List ===
if (eventList) {
  eventList.innerHTML = events.map((e, i) => `<li data-index="${i}">${e.date} — ${e.name}</li>`).join('');
  eventList.addEventListener('mouseover', e => {
    const li = e.target.closest('li');
    if (!li) return;
    const ev = events[li.dataset.index];
    startHover(ev);
  });
  eventList.addEventListener('mouseleave', endHover);
  eventList.addEventListener('click', e => {
    const li = e.target.closest('li');
    if (!li) return;
    const ev = events[li.dataset.index];
    if (ev.link) window.open(ev.link, '_blank');
  });
}

// === Camera Animation ===
function focusOnEvent(ev, closeUp = false) {
  const phi = (90 - ev.lat) * Math.PI / 180;
  const theta = ev.lng * Math.PI / 180; // FIX: removed +180
  const radius = closeUp ? 180 : 300;
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  gsap.to(camera.position, {
    x, y, z,
    duration: 1.2,
    ease: "power2.out",
    onUpdate: () => camera.lookAt(0, 0, 0)
  });
}

function resetCameraPosition() {
  gsap.to(camera.position, {
    x: 0, y: 0, z: 350,
    duration: 1.5,
    ease: "power2.out",
    onUpdate: () => camera.lookAt(0, 0, 0)
  });
}

// === Animate ===
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});
