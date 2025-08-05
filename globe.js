import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff); // white background

const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0, 0, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const orbitCtrl = new OrbitControls(camera, renderer.domElement);
orbitCtrl.enableDamping = true;
orbitCtrl.enablePan = false;
orbitCtrl.minDistance = 2.5;
orbitCtrl.maxDistance = 10;
orbitCtrl.autoRotate = false; // no auto rotation

const raycaster = new THREE.Raycaster();
const pointerPos = new THREE.Vector2();

const textureLoader = new THREE.TextureLoader();
const colorMap = textureLoader.load("./src/00_earthmap1k.jpg");
const elevMap = textureLoader.load("./src/01_earthbump1k.jpg");
const alphaMap = textureLoader.load("./src/02_earthspec1k.jpg");

const globeGroup = new THREE.Group();
scene.add(globeGroup);

const globeGeo = new THREE.SphereGeometry(1, 64, 64);
const globeMat = new THREE.MeshPhongMaterial({
  map: colorMap,
  bumpMap: elevMap,
  bumpScale: 0.05,
  specularMap: alphaMap,
  specular: new THREE.Color("grey"),
});
const globe = new THREE.Mesh(globeGeo, globeMat);
globeGroup.add(globe);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x080820, 2);
scene.add(hemiLight);

// === PINS ===
const pins = [];
const pinGeometry = new THREE.SphereGeometry(0.015, 8, 8);
const pinMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

// Example tour data (replace with your real tour data)
const tourStops = [
  { city: "Berlin", lat: 52.52, lng: 13.405, date: "2025-09-15", tickets: "https://example.com/berlin" },
  { city: "London", lat: 51.5074, lng: -0.1278, date: "2025-09-18", tickets: "https://example.com/london" }
];

// Convert lat/lng to XYZ
function latLngToVector3(lat, lng, radius = 1) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// Add pins
tourStops.forEach(stop => {
  const pos = latLngToVector3(stop.lat, stop.lng, 1.01);
  const pin = new THREE.Mesh(pinGeometry, pinMaterial);
  pin.position.copy(pos);
  pin.userData = {
    html: `<b>${stop.city}</b><br>${stop.date}<br><a href="${stop.tickets}" target="_blank">Get Tickets</a>`
  };
  globeGroup.add(pin);
  pins.push(pin);
});

// === TOOLTIP ===
const tooltip = document.createElement("div");
tooltip.style.position = "absolute";
tooltip.style.background = "#fff";
tooltip.style.padding = "6px 8px";
tooltip.style.borderRadius = "6px";
tooltip.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
tooltip.style.display = "none";
tooltip.style.pointerEvents = "none";
document.body.appendChild(tooltip);

function handleRaycast(evt) {
  raycaster.setFromCamera(pointerPos, camera);
  const intersects = raycaster.intersectObjects(pins, false);
  if (intersects.length > 0) {
    const pin = intersects[0].object;
    tooltip.innerHTML = pin.userData.html;
    tooltip.style.left = evt.clientX + 10 + "px";
    tooltip.style.top = evt.clientY + 10 + "px";
    tooltip.style.display = "block";
  } else {
    tooltip.style.display = "none";
  }
}

// === ANIMATION LOOP ===
function animate() {
  renderer.render(scene, camera);
  orbitCtrl.update();
  requestAnimationFrame(animate);
}
animate();

// === EVENTS ===
window.addEventListener("mousemove", (evt) => {
  pointerPos.set(
    (evt.clientX / window.innerWidth) * 2 - 1,
    -(evt.clientY / window.innerHeight) * 2 + 1
  );
  handleRaycast(evt);
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
