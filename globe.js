import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import ThreeGlobe from "three-globe";
import * as topojson from "topojson-client";

if (typeof THREE === 'undefined') {
  alert('Three.js failed to load — check import map in tour3d.html.');
}

const container = document.getElementById('globe-container');
const tooltip   = document.getElementById('tooltip');

const events = [
  { lat: 51.5074, lng: -0.1278, country: 'United Kingdom', name: 'UKF Invites – London', date: 'Aug 6, 2025', link: '#' },
  { lat: 37.5683, lng: 14.3839, country: 'Italy', name: 'Mosaico Festival – Piazza Armerina', date: 'Aug 8, 2025', link: '#' },
  { lat: 38.9050, lng: 16.5870, country: 'Italy', name: 'Factory Area Festival – Catanzaro', date: 'Aug 20, 2025', link: '#' },
  { lat: 52.5200, lng: 13.4050, country: 'Germany', name: 'Lava Festival – Berlin', date: 'Aug 31, 2025', link: '#' },
  { lat: 48.8566, lng: 2.3522, country: 'France', name: 'Les Nuits de la Bomba – Paris', date: 'Sep 20, 2025', link: '#' }
];

// === Scene & Camera ===
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 0, 350);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

// === Controls (Drag Rotate) ===
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 200;
controls.maxDistance = 500;
controls.rotateSpeed = 0.8;
controls.zoomSpeed = 0.6;
controls.enableZoom = true;

// === Globe ===
const globe = new ThreeGlobe()
  .globeImageUrl('') // no texture for white globe
  .showAtmosphere(false)
  .showGraticules(false)
  .pointsData(events)
  .pointLat('lat')
  .pointLng('lng')
  .pointAltitude(0.02)
  .pointRadius(0.5)
  .pointColor(() => '#ff4081');

// White globe
globe.globeMaterial(new THREE.MeshBasicMaterial({ color: 0xffffff }));
scene.add(globe);

// === Lighting ===
scene.add(new THREE.AmbientLight(0xffffff, 1.2));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(1, 1, 1);
scene.add(dirLight);

// === Country borders & event fills ===
fetch('https://unpkg.com/world-atlas@2/countries-110m.json')
  .then(res => res.json())
  .then(worldData => {
    const countries = topojson.feature(worldData, worldData.objects.countries).features;
    const eventCountries = new Set(events.map(e => e.country));

    // Fill event countries light grey
    globe
      .hexPolygonsData(countries)
      .hexPolygonResolution(3)
      .hexPolygonMargin(0.3)
      .hexPolygonColor(d => eventCountries.has(d.properties.name) ? '#e0e0e0' : 'rgba(0,0,0,0)');

    // Borders
    const borderMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    countries.forEach(feature => {
      const coords = feature.geometry.coordinates;
      (feature.geometry.type === 'MultiPolygon' ? coords : [coords]).forEach(polygon => {
        polygon.forEach(ring => {
          const points = ring.map(([lng, lat]) => {
            const phi = (90 - lat) * Math.PI / 180;
            const theta = (lng + 180) * Math.PI / 180;
            const r = 100.1;
            return new THREE.Vector3(
              -r * Math.sin(phi) * Math.cos(theta),
               r * Math.cos(phi),
               r * Math.sin(phi) * Math.sin(theta)
            );
          });
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          const line = new THREE.LineLoop(geometry, borderMaterial);
          globe.add(line);
        });
      });
    });
  });

// === Tooltip / Interaction ===
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

document.addEventListener('mousemove', event => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(
    globe.pointsData().map(p => p.__threeObj).filter(Boolean)
  );

  if (intersects.length > 0) {
    const d = intersects[0].object.__data;
    tooltip.innerHTML = `<strong>${d.name}</strong><br>${d.date}`;
    tooltip.style.left = event.clientX + 15 + 'px';
    tooltip.style.top = event.clientY + 15 + 'px';
    tooltip.classList.remove('hidden');
  } else {
    tooltip.classList.add('hidden');
  }
});

container.addEventListener('mouseleave', () => tooltip.classList.add('hidden'));

document.addEventListener('click', event => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(
    globe.pointsData().map(p => p.__threeObj).filter(Boolean)
  );
  if (intersects.length > 0) {
    const d = intersects[0].object.__data;
    if (d.link) window.open(d.link, '_blank');
  }
});

// === Animate ===
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
