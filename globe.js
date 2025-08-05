import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// === Scene & Camera ===
const container = document.getElementById('globe-container');
const tooltip = document.getElementById('tooltip');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);
camera.position.set(0, 0, 400);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

// === Lighting ===
scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 3, 5);
scene.add(dirLight);

// === Controls ===
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 200;
controls.maxDistance = 800;

// === Load Textures for Earth ===
const textureLoader = new THREE.TextureLoader();
const earthTexture = textureLoader.load('https://threejs.org/examples/textures/land_ocean_ice_cloud_2048.jpg');
const bumpMap = textureLoader.load('https://threejs.org/examples/textures/earthbump1k.jpg');

// === Create Earth Sphere ===
const earthGeometry = new THREE.SphereGeometry(100, 64, 64);
const earthMaterial = new THREE.MeshPhongMaterial({
  map: earthTexture,
  bumpMap: bumpMap,
  bumpScale: 0.5
});
const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
scene.add(earthMesh);

// === Event Data ===
const events = [
  { lat: 51.5074, lng: -0.1278, name: 'London', date: 'Aug 6, 2025' },
  { lat: 37.5683, lng: 14.3839, name: 'Piazza Armerina', date: 'Aug 8, 2025' },
  { lat: 38.9050, lng: 16.5870, name: 'Catanzaro', date: 'Aug 20, 2025' },
  { lat: 52.5200, lng: 13.4050, name: 'Berlin', date: 'Aug 31, 2025' },
  { lat: 48.8566, lng: 2.3522, name: 'Paris', date: 'Sep 20, 2025' }
];

// === Add Pins ===
const pinGeometry = new THREE.SphereGeometry(1.5, 8, 8);
const pinMaterial = new THREE.MeshBasicMaterial({ color: 0xff4081 });

events.forEach(event => {
  const { lat, lng } = event;
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const radius = 100;

  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  const pinMesh = new THREE.Mesh(pinGeometry, pinMaterial);
  pinMesh.position.set(x, y, z);
  pinMesh.userData = event; // store event info for tooltip
  scene.add(pinMesh);
});

// === Raycaster for Tooltips ===
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children);

  const pin = intersects.find(obj => obj.object.geometry.type === 'SphereGeometry' && obj.object.userData.name);
  if (pin) {
    const d = pin.object.userData;
    tooltip.innerHTML = `<strong>${d.name}</strong><br>${d.date}`;
    tooltip.style.left = event.clientX + 15 + 'px';
    tooltip.style.top = event.clientY + 15 + 'px';
    tooltip.classList.remove('hidden');
  } else {
    tooltip.classList.add('hidden');
  }
}
window.addEventListener('mousemove', onMouseMove);

// === Resize Handling ===
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// === Animation Loop ===
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
