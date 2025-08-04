// Safety check
if (typeof THREE === 'undefined') {
  alert('Three.js failed to load — check script order in tour3d.html.');
}

// DOM references
const container = document.getElementById('globe-container');
const tooltip = document.getElementById('tooltip');

// Event data
const events = [
  { lat: 51.5074, lng: -0.1278, name: 'UKF Invites – London', date: 'Aug 6, 2025', link: 'https://ra.co/events/22180551451883445855686343' },
  { lat: 37.5683, lng: 14.3839, name: 'Mosaico Festival – Piazza Armerina', date: 'Aug 8, 2025', link: 'https://dice.fm/bundles/mosaico-festival-2025-d99o' },
  { lat: 38.905, lng: 16.587, name: 'Factory Area Festival – Catanzaro', date: 'Aug 20, 2025', link: 'https://linktr.ee/FACTORYAREA' },
  { lat: 52.5200, lng: 13.4050, name: 'Lava Festival – Berlin', date: 'Aug 31, 2025', link: 'https://www.ticketmaster.de/event/1709407918' },
  { lat: 48.8566, lng: 2.3522, name: 'Les Nuits de la Bomba – Paris', date: 'Sep 20, 2025', link: 'https://dice.fm/event/avgo2d-les-nuits-de-la-bomba-et-leurs-amis-pass-samedi-trabendo-20th-sep' }
];

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.z = 350;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// Create globe
const globe = new ThreeGlobe()
  .globeImageUrl('') // Prevent default texture (fixes WebGL error)
  .showAtmosphere(false)
  .showGraticules(false)
  .pointsData(events)
  .pointLat('lat')
  .pointLng('lng')
  .pointAltitude(0.03)
  .pointRadius(0.4)
  .pointColor(() => '#ff4081');

// Force pure white globe
globe.globeMaterial(new THREE.MeshBasicMaterial({ color: 0xffffff }));

scene.add(globe);

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, 1.2));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(1, 1, 1);
scene.add(dirLight);

// Load country borders (black outline only)
fetch('https://app.unpkg.com/world-atlas@2/countries-110m.json')
  .then(res => res.json())
  .then(countries => {
    const globeData = topojson.feature(countries, countries.objects.countries).features;

    // Transparent fill polygons
    globe
      .hexPolygonsData(globeData)
      .hexPolygonResolution(3)
      .hexPolygonMargin(0.3)
      .hexPolygonColor(() => 'rgba(0,0,0,0)'); // no fill

    // Draw black borders
    const borderMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    globeData.forEach(feature => {
      const coords = feature.geometry.coordinates;
      coords.forEach(polygon => {
        const points = polygon[0].map(([lng, lat]) => {
          const phi = (90 - lat) * (Math.PI / 180);
          const theta = (lng + 180) * (Math.PI / 180);
          const radius = 100; // matches globe radius
          return new THREE.Vector3(
            -radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.cos(phi),
            radius * Math.sin(phi) * Math.sin(theta)
          );
        });
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.LineLoop(geometry, borderMaterial);
        globe.add(line);
      });
    });
  })
  .catch(err => console.error("Error loading country data:", err));

// Tooltip + hover rotation
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let targetRotationX = 0;
let targetRotationY = 0;

document.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Rotate based on mouse position
  targetRotationY = mouse.x * 0.5;
  targetRotationX = mouse.y * 0.5;

  // Tooltip detection
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(globe.pointsData().map(p => p.__threeObj).filter(Boolean));

  if (intersects.length > 0) {
    const data = intersects[0].object.__data;
    tooltip.innerHTML = `<strong>${data.name}</strong><br>${data.date}<br><a href="${data.link}" target="_blank">Get Tickets</a>`;
    tooltip.style.left = event.clientX + 15 + 'px';
    tooltip.style.top = event.clientY + 15 + 'px';
    tooltip.classList.remove('hidden');
  } else {
    tooltip.classList.add('hidden');
  }
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  globe.rotation.y += (targetRotationY - globe.rotation.y) * 0.05;
  globe.rotation.x += (targetRotationX - globe.rotation.x) * 0.05;
  renderer.render(scene, camera);
}
animate();

// Resize handling
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
