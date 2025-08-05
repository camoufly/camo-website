// Verify Three.js is loaded
if (typeof THREE === 'undefined') {
  alert('Three.js failed to load — check script order in HTML.');
}

// Get DOM elements
const container = document.getElementById('globe-container');
const tooltip   = document.getElementById('tooltip');

// Event data: each event with location (lat, lng), details, and country
const events = [
  {
    lat: 51.5074, lng: -0.1278, country: 'United Kingdom',
    name: 'UKF Invites – London', date: 'Aug 6, 2025',
    link: 'https://ra.co/events/22180551451883445855686343'
  },
  {
    lat: 37.5683, lng: 14.3839, country: 'Italy',
    name: 'Mosaico Festival – Piazza Armerina', date: 'Aug 8, 2025',
    link: 'https://dice.fm/bundles/mosaico-festival-2025-d99o'
  },
  {
    lat: 38.9050, lng: 16.5870, country: 'Italy',
    name: 'Factory Area Festival – Catanzaro', date: 'Aug 20, 2025',
    link: 'https://linktr.ee/FACTORYAREA'
  },
  {
    lat: 52.5200, lng: 13.4050, country: 'Germany',
    name: 'Lava Festival – Berlin', date: 'Aug 31, 2025',
    link: 'https://www.ticketmaster.de/event/1709407918'
  },
  {
    lat: 48.8566, lng: 2.3522, country: 'France',
    name: 'Les Nuits de la Bomba – Paris', date: 'Sep 20, 2025',
    link: 'https://dice.fm/event/avgo2d-les-nuits-de-la-bomba-et-leurs-amis-pass-samedi-trabendo-20th-sep'
  }
];

// THREE.js scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);
camera.position.z = 350;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// Create the globe with Three-Globe
const globe = new ThreeGlobe()
  .globeImageUrl('')           // No texture (solid color)
  .showAtmosphere(false)       // No atmosphere glow
  .showGraticules(false)       // No latitude/longitude lines
  .pointsData(events)          // Data points for event locations
  .pointLat('lat')
  .pointLng('lng')
  .pointAltitude(0.02)         // Pin height (small cylinders)
  .pointRadius(0.5)            // Pin base radius (degrees)
  .pointColor(() => '#ff4081');// Pin color (pink)

// Make the globe sphere solid white
globe.globeMaterial(new THREE.MeshBasicMaterial({ color: 0xffffff }));

scene.add(globe);

// Add a thin wireframe sphere to outline the globe (black lines)
const globeRadius = 100;
const outlineGeometry = new THREE.SphereGeometry(globeRadius, 64, 64);
const outlineMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true });
const sphereOutline = new THREE.Mesh(outlineGeometry, outlineMaterial);
// Slightly enlarge the outline sphere so lines show clearly
sphereOutline.scale.set(1.01, 1.01, 1.01);
scene.add(sphereOutline);

// Lighting (for better visibility of 3D objects, though globe is basic material)
scene.add(new THREE.AmbientLight(0xffffff, 1.2));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(1, 1, 1);
scene.add(dirLight);

// Load country border data and add to globe
fetch('https://unpkg.com/world-atlas@2/countries-110m.json')
  .then(res => res.json())
  .then(worldData => {
    // Convert TopoJSON to GeoJSON features
    const countries = topojson.feature(worldData, worldData.objects.countries).features;
    // Prepare a set of country names that have events
    const eventCountries = new Set(events.map(e => e.country));

    // Add countries as "hexagon polygons" with no or light fill
    globe
      .hexPolygonsData(countries)
      .hexPolygonResolution(3)  // Tesselation detail (3 is fairly low, improving performance)
      .hexPolygonMargin(0.3)    // Small gap between hexagons
      // Fill event countries with grey, others transparent
      .hexPolygonColor(d => eventCountries.has(d.properties.name) ? '#cccccc' : 'rgba(0,0,0,0)');

    // Draw country outline borders as thin lines (black)
    const borderMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    countries.forEach(feature => {
      const { coordinates, type } = feature.geometry;
      // Each feature may be MultiPolygon or Polygon; handle both
      const polys = (type === 'MultiPolygon') ? coordinates : [coordinates];
      polys.forEach(polygon => {
        // Each polygon may have inner rings [first is outer border]
        polygon.forEach(linearRing => {
          const points = linearRing.map(([lng, lat]) => {
            const phi = (90 - lat) * (Math.PI / 180);
            const theta = (lng + 180) * (Math.PI / 180);
            const r = globeRadius + 0.1; // slightly above globe surface
            return new THREE.Vector3(
              -r * Math.sin(phi) * Math.cos(theta),
               r * Math.cos(phi),
               r * Math.sin(phi) * Math.sin(theta)
            );
          });
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          const borderLine = new THREE.LineLoop(geometry, borderMaterial);
          scene.add(borderLine);
        });
      });
    });
  });

// Tooltip and interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Track mouse movement for hover effects and globe rotation targets
let targetRotationX = 0;
let targetRotationY = 0;
document.addEventListener('mousemove', event => {
  // Normalize mouse position to [-1, 1] range for raycaster
  mouse.x =  (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  // Set rotation targets based on pointer position
  targetRotationY = mouse.x * 0.5;
  targetRotationX = mouse.y * 0.5;

  // Use raycaster to detect if a globe point (pin) is under the cursor
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(
    globe.pointsData().map(p => p.__threeObj).filter(Boolean)
  );
  if (intersects.length > 0) {
    // Get the data for the first intersected point
    const eventData = intersects[0].object.__data;
    // Populate and show the tooltip near the mouse
    tooltip.innerHTML = `
      <strong>${eventData.name}</strong><br/>
      ${eventData.date}<br/>
      <a href="${eventData.link}" target="_blank">Get Tickets</a>
    `;
    tooltip.style.left = (event.clientX + 15) + 'px';
    tooltip.style.top  = (event.clientY + 15) + 'px';
    tooltip.classList.remove('hidden');
  } else {
    // Hide tooltip when not hovering a pin
    tooltip.classList.add('hidden');
  }
});

// Open ticket link in new tab on pin click
document.addEventListener('click', event => {
  mouse.x =  (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(
    globe.pointsData().map(p => p.__threeObj).filter(Boolean)
  );
  if (intersects.length > 0) {
    const eventData = intersects[0].object.__data;
    window.open(eventData.link, '_blank');
  }
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  // Smoothly rotate globe towards target rotations (lerp for easing)
  globe.rotation.y += (targetRotationY - globe.rotation.y) * 0.05;
  globe.rotation.x += (targetRotationX - globe.rotation.x) * 0.05;
  renderer.render(scene, camera);
}
animate();

// Handle window resize to keep globe full-screen
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
