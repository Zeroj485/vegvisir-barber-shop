// scripts.js - mock auth, reservation flow, gallery storage
const PREFIJO = '+53'; // país (Cuba) según tu indicación

// Mock users
const USERS = {
  'alejandro': 'Vegv2026!',
  'barbero2': 'Vegv2026!',
  'barbero3': 'Vegv2026!',
  'barbero4': 'Vegv2026!',
  'barbero5': 'Vegv2026!'
};

// Mock phone numbers
const PHONES = {
  'alejandro': '+53 56513862',
  'barbero2': '+53 60000002',
  'barbero3': '+53 60000003',
  'barbero4': '+53 60000004',
  'barbero5': '+53 60000005'
};

// Reservation modal handlers
const reservaModal = document.getElementById('reservaModal');
const closeModal = document.getElementById('closeModal');
const reservarBtns = document.querySelectorAll('.reservar-btn');
const reservarTop = document.getElementById('reservarTop');
const ctaReservar = document.getElementById('ctaReservar');

function openModal(){
  reservaModal.setAttribute('aria-hidden','false');
}
function close(){
  reservaModal.setAttribute('aria-hidden','true');
}
closeModal.addEventListener('click',close);
reservarTop && reservarTop.addEventListener('click',(e)=>{e.preventDefault();openModal()});
ctaReservar && ctaReservar.addEventListener('click',(e)=>{e.preventDefault();openModal()});

reservarBtns.forEach(btn=>{
  btn.addEventListener('click',(e)=>{
    e.preventDefault();
    const svc = btn.dataset.service || '';
    const barber = btn.dataset.barber || '';
    document.getElementById('servicioInput').value = svc;
    if(barber) document.getElementById('barberoSelect').value = barber;
    openModal();
  })
});

// handle reservation submit
const reservaForm = document.getElementById('reservaForm');
reservaForm && reservaForm.addEventListener('submit',(e)=>{
  e.preventDefault();
  const barber = document.getElementById('barberoSelect').value;
  const servicio = document.getElementById('servicioInput').value;
  const fecha = document.getElementById('fechaInput').value;
  const hora = document.getElementById('horaInput').value;
  const nombre = document.getElementById('nombreInput').value;
  const telefono = document.getElementById('telefonoInput').value;

  const phone = PHONES[barber] || (PREFIJO + telefono);
  const plainPhone = phone.replace(/[^+0-9]/g,'');

  let mensaje = `Hola ${barber} 👋%0AQuisiera reservar:%0A- Servicio: ${servicio}%0A- Fecha: ${fecha}%0A- Hora: ${hora}%0A- Cliente: ${nombre}%0A- Teléfono: ${telefono}`;

  // open WhatsApp web/mobile
  const url = `https://wa.me/${plainPhone.replace('+','') }?text=${mensaje}`;
  // save reservation locally for demo
  saveReservation({barber,servicio,fecha,hora,nombre,telefono,created:new Date().toISOString()});
  window.open(url,'_blank');
});

function saveReservation(obj){
  const key = 'vegvisir_reservas';
  const data = JSON.parse(localStorage.getItem(key) || '[]');
  data.push(obj);
  localStorage.setItem(key,JSON.stringify(data));
}

// Simple mock auth for uploader page
function mockLogin(username,password){
  if(USERS[username] && USERS[username] === password){
    localStorage.setItem('vegvisir_user',username);
    return true;
  }
  return false;
}
function mockLogout(){
  localStorage.removeItem('vegvisir_user');
}
function getCurrentUser(){
  return localStorage.getItem('vegvisir_user');
}

// Gallery helpers (store dataURLs per user)
function saveImageForUser(username,dataUrl){
  const key = `gallery_${username}`;
  const arr = JSON.parse(localStorage.getItem(key) || '[]');
  arr.push({src:dataUrl,created:new Date().toISOString()});
  localStorage.setItem(key,JSON.stringify(arr));
}
function getImagesForUser(username){
  const key = `gallery_${username}`;
  return JSON.parse(localStorage.getItem(key) || '[]');
}

// If on gallery page, render galleries
function renderGalleries(){
  const container = document.getElementById('galleryContainer');
  if(!container) return;
  const barbers = Object.keys(PHONES);
  barbers.forEach(b=>{
    const section = document.createElement('section');
    section.id = b;
    section.className = 'barber-section';
    const h = document.createElement('h4');
    h.textContent = b;
    section.appendChild(h);
    const imgs = getImagesForUser(b);
    const grid = document.createElement('div');
    grid.className = 'gallery-grid';
    if(imgs.length===0){
      const p = document.createElement('p'); p.textContent = 'Sin trabajos subidos aún.'; section.appendChild(p);
    } else {
      imgs.forEach(it=>{
        const img = document.createElement('img'); img.src = it.src; img.alt = b; img.className='thumb'; grid.appendChild(img);
      });
      section.appendChild(grid);
    }
    container.appendChild(section);
  });
}

// If on login page, attach handlers
if(document.getElementById('loginForm')){
  document.getElementById('loginForm').addEventListener('submit',(e)=>{
    e.preventDefault();
    const u = document.getElementById('userInput').value;
    const p = document.getElementById('passInput').value;
    if(mockLogin(u,p)){
      alert('Login exitoso');
      window.location.href = 'uploader.html';
    } else alert('Usuario o clave incorrecta');
  });
}

// uploader page logic
if(document.getElementById('uploadForm')){
  const user = getCurrentUser();
  if(!user){
    alert('Debes iniciar sesión como barbero para subir trabajos.');
    window.location.href = 'login.html';
  }
  document.getElementById('currentUser').textContent = user;
  document.getElementById('uploadForm').addEventListener('submit',(e)=>{
    e.preventDefault();
    const input = document.getElementById('fileInput');
    const files = Array.from(input.files).slice(0,6);
    files.forEach(file=>{
      const reader = new FileReader();
      reader.onload = function(ev){
        saveImageForUser(user,ev.target.result);
      };
      reader.readAsDataURL(file);
    });
    alert('Imágenes subidas (demo). Se guardan localmente en tu navegador.');
    window.location.href = 'galeria.html#'+user;
  });
}

// gallery page render
if(document.getElementById('galleryContainer')) renderGalleries();
