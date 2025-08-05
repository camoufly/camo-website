if (typeof THREE === 'undefined') {
  alert('Three.js failed to load — check script order in tour3d.html.');
}

const container = document.getElementById('globe-container');
const tooltip   = document.getElementById('tooltip');

const events = [
  { lat: 51.5074, lng: -0.1278, country: 'United Kingdom', name: 'UKF Invites – London', date: 'Aug 6, 2025' },
  { lat: 37.5683, lng: 14.3839, country: 'Italy', name: 'Mosaico Festival – Piazza Armerina', date: 'Aug 8, 2025' },
  { lat: 38.9050, lng: 16.5870, country: 'Italy', name: 'Factory Area Festival – Catanzaro', date: 'Aug 20, 2025' },
  { lat: 52.5200, lng: 13.4050, country: 'Germany', name: 'Lava Festival – Berlin', date: 'Aug 31, 2025' },
  { lat: 48.8566, lng: 2.3522, country: 'France', name: 'Les Nuits de la Bomba – Paris', date: 'Sep 20, 2025' }
];

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.z = 350;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

const globe = new ThreeGlobe()
  .globeImageUrl('') // no texture
  .showAtmosphere(false)
  .showGraticules(false)
  .pointsData(events)
  .pointLat('lat')
  .pointLng('lng')
  .pointAltitude(0.02)
  .pointRadius(0.5)
  .pointColor(() => '#ff4081');

// Make globe solid white
globe.globeMaterial(new THREE.MeshBasicMaterial({ color: 0xffffff }));

scene.add(globe);

scene.add(new THREE.AmbientLight(0xffffff, 1.2));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(1, 1, 1);
scene.add(dirLight);

// Country borders + fill for event countries
fetch('https://unpkg.com/world-atlas@2/countries-110m.json')
  .then(res => res.json())
  .then(worldData => {
    const countries = topojson.feature(worldData, worldData.objects.countries).features;
    const eventCountries = new Set(events.map(e => e.country));

    // Light grey fill for event countries
    globe
      .hexPolygonsData(countries)
      .hexPolygonResolution(3)
      .hexPolygonMargin(0.3)
      .hexPolygonColor(d => eventCountries.has(d.properties.name) ? '#e0e0e0' : 'rgba(0,0,0,0)');

    // Black borders that rotate with globe
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
          globe.add(line); // IMPORTANT: add to globe so it rotates with pins
        });
      });
    });
  });

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let targetRotationX = 0;
let targetRotationY = 0;

document.addEventListener('mousemove', event => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  targetRotationY = mouse.x * 0.5;
  targetRotationX = mouse.y * 0.5;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(globe.pointsData().map(p => p.__threeObj).filter(Boolean));

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

// Hide tooltip if mouse leaves the globe container
container.addEventListener('mouseleave', () => {
  tooltip.classList.add('hidden');
});

document.addEventListener('click', event => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(globe.pointsData().map(p => p.__threeObj).filter(Boolean));
  if (intersects.length > 0) {
    const d = intersects[0].object.__data;
    // Open ticket link in new tab if needed later
    // window.open(d.link, '_blank');
  }
});

function animate() {
  requestAnimationFrame(animate);
  globe.rotation.y += (targetRotationY - globe.rotation.y) * 0.05;
  globe.rotation.x += (targetRotationX - globe.rotation.x) * 0.05;
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
