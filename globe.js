import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import ThreeGlobe from "three-globe";
import * as topojson from "topojson-client";

const events = [
  { lat:51.5074,lng:-0.1278,name:'UKF Invites – London',date:'Aug 6, 2025',link:'https://ra.co/events/22180551451883445855686343',country:'UK' },
  { lat:37.5683,lng:14.3839,name:'Mosaico Festival – Piazza Armerina',date:'Aug 8, 2025',link:'https://dice.fm/...',country:'Italy' },
  { lat:38.905,lng:16.587,name:'Factory Area Festival – Catanzaro',date:'Aug 20, 2025',link:'https://linktr.ee/FACTORYAREA',country:'Italy' },
  { lat:52.52,lng:13.405,name:'Lava Festival – Berlin',date:'Aug 31, 2025',link:'https://www.ticketmaster.de/...',country:'Germany' },
  { lat:48.8566,lng:2.3522,name:'Les Nuits de la Bomba – Paris',date:'Sep 20, 2025',link:'https://dice.fm/...',country:'France' }
];

const container = document.getElementById('globe-container');
const tooltip   = document.getElementById('tooltip');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 2000);
camera.position.z = 350;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 250;
controls.maxDistance = 600;
controls.rotateSpeed = 0.7;

const globe = new ThreeGlobe()
  .globeImageUrl('')
  .showAtmosphere(false)
  .showGraticules(false)
  .pointsData(events)
  .pointLat('lat').pointLng('lng')
  .pointAltitude(0.02).pointRadius(0.6)
  .pointColor(() => '#ff4081');

globe.globeMaterial(new THREE.MeshBasicMaterial({ color: 0xffffff }));
scene.add(globe);

scene.add(new THREE.AmbientLight(0xffffff, 1.2));
const dl = new THREE.DirectionalLight(0xffffff, 0.6);
dl.position.set(1,1,1); scene.add(dl);

fetch('https://unpkg.com/world-atlas@2/countries-110m.json')
  .then(r=>r.json())
  .then(data => {
    const countries = topojson.feature(data,data.objects.countries).features;
    const evCs = new Set(events.map(e=>e.country));
    globe.hexPolygonsData(countries)
      .hexPolygonResolution(3).hexPolygonMargin(0.3)
      .hexPolygonColor(d => evCs.has(d.properties.name) ? '#e0e0e0' : 'rgba(0,0,0,0)');
    countries.forEach(f=> {
      const coords = f.geometry.coordinates;
      ([...(f.geometry.type==='MultiPolygon'?coords:[coords])]).forEach(poly=>{
        poly.forEach(ring=>{
          const pts = ring.map(([lng,lat])=>{
            const phi=(90-lat)*Math.PI/180,theta=(lng+180)*Math.PI/180,r=100.2;
            return new THREE.Vector3(-r*Math.sin(phi)*Math.cos(theta),r*Math.cos(phi),r*Math.sin(phi)*Math.sin(theta));
          });
          const geom = new THREE.BufferGeometry().setFromPoints(pts);
          const l = new THREE.LineLoop(geom,new THREE.LineBasicMaterial({color:0x000000}));
          globe.add(l);
        });
      });
    });
  });

const ray = new THREE.Raycaster();
const mv = new THREE.Vector2();

function showTooltip(evt,obj) {
  tooltip.innerHTML = `<strong>${obj.name}</strong><br>${obj.date}`;
  tooltip.style.left = evt.clientX+15+'px'; tooltip.style.top = evt.clientY+15+'px';
  tooltip.style.display = 'block';
}

function hideTooltip(){ tooltip.style.display = 'none'; }

document.addEventListener('mousemove', e => {
  mv.x = e.clientX/container.clientWidth*2 -1;
  mv.y = -(e.clientY/container.clientHeight)*2 +1;
  ray.setFromCamera(mv, camera);
  const ints = ray.intersectObjects(globe.pointsData().map(p=>p.__threeObj).filter(Boolean));
  if(ints.length) showTooltip(e, ints[0].object.__data);
  else hideTooltip();
});

container.addEventListener('mouseleave', hideTooltip);

document.addEventListener('click', e => {
  mv.x = e.clientX/container.clientWidth*2 -1;
  mv.y = -(e.clientY/container.clientHeight)*2 +1;
  ray.setFromCamera(mv, camera);
  const ints = ray.intersectObjects(globe.pointsData().map(p=>p.__threeObj).filter(Boolean));
  if(ints.length && ints[0].object.__data.link) window.open(ints[0].object.__data.link,'_blank');
});

document.getElementById('event-list').addEventListener('mouseover', e => {
  const i = +e.target.dataset.index;
  if (i>=0) {
    const ev = events[i];
    globe.pointLat(ev.lat).pointLng(ev.lng);
    const phi=(90-ev.lat)*Math.PI/180,theta=(ev.lng+180)*Math.PI/180;
    const x=100*Math.sin(phi)*Math.cos(theta),y=100*Math.cos(phi),z=100*Math.sin(phi)*Math.sin(theta);
    gsap.to(camera.position,{duration:1.2,x:x*2.2,y:y*2.2,z:z*2.2});
    camera.lookAt(new THREE.Vector3(0,0,0));
  }
});

const animate = ()=>{
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
};
animate();

window.addEventListener('resize', ()=> {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth,container.clientHeight);
});
