// scripts.js - supabase-aware reservation and uploader logic (updated)
const PREFIJO = '+53'; // país (Cuba)

const DEMO_USERS = {
  'alejandro': 'Vegv2026!',
  'karel': 'Vegv2026!',
  'leo': 'Vegv2026!',
  'marco': 'Vegv2026!',
  'chino': 'Vegv2026!'
};

const DEMO_PHONES = {
  'alejandro': '+53 56513862',
  'karel': '+53 60000002',
  'leo': '+53 60000003',
  'marco': '+53 60000004',
  'chino': '+53 60000005'
};

let supabase = null;
let USING_SUPABASE = false;

async function initSupabase(){
  if(!window.SUPABASE_CONFIG || !window.SUPABASE_CONFIG.SUPABASE_URL || !window.SUPABASE_CONFIG.SUPABASE_ANON_KEY){
    console.log('Supabase config not found — running in demo/local mode');
    return;
  }
  try{
    const mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/dist/esm/index.js');
    supabase = mod.createClient(window.SUPABASE_CONFIG.SUPABASE_URL, window.SUPABASE_CONFIG.SUPABASE_ANON_KEY);
    USING_SUPABASE = true;
    console.log('Supabase initialized');
  }catch(err){
    console.warn('Could not load supabase-js from CDN, continuing in demo mode', err);
  }
}

initSupabase();

// --- Render site data (services & team) if available ---
function renderSiteFromData(){
  const data = window.SITE_DATA;
  if(!data) return;

  // services
  const servicesContainer = document.getElementById('servicesContainer');
  if(servicesContainer && Array.isArray(data.services)){
    servicesContainer.innerHTML = '';
    data.services.forEach(s => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `<h4>${s.title}</h4><p>Precio: $${s.price} — Duración: ${s.duration}</p><button class="btn small reservar-btn" data-service="${s.title}">Reservar</button>`;
      servicesContainer.appendChild(card);
    });
  }

  // team
  const teamContainer = document.getElementById('teamContainer');
  if(teamContainer && Array.isArray(data.barbers)){
    teamContainer.innerHTML = '';
    data.barbers.forEach(b => {
      const div = document.createElement('div');
      div.className = 'member';
      div.innerHTML = `<img src="${b.img}" alt="${b.name}"><h4>${b.name}</h4><p>Especialista</p><button class="btn small reservar-btn" data-barber="${b.username}" data-service="">Reservar</button><a class="btn outline small" href="galeria.html#${b.username}">Ver trabajos</a>`;
      teamContainer.appendChild(div);
    });

    // also populate select in modal
    const barberoSelect = document.getElementById('barberoSelect');
    if(barberoSelect){
      barberoSelect.innerHTML = '';
      data.barbers.forEach(b => {
        const opt = document.createElement('option'); opt.value = b.username; opt.textContent = b.name; barberoSelect.appendChild(opt);
      });
    }
  }

  // attach reserva button handlers after rendering
  const reservarBtns = document.querySelectorAll('.reservar-btn');
  reservarBtns.forEach(btn=>{
    btn.addEventListener('click',(e)=>{
      e.preventDefault();
      const svc = btn.dataset.service || '';
      const barber = btn.dataset.barber || '';
      const servicioInput = document.getElementById('servicioInput');
      if(servicioInput && svc) servicioInput.value = svc;
      if(barber) document.getElementById('barberoSelect').value = barber;
      openModal();
    });
  });
}

// Reservation modal handlers
const reservaModal = document.getElementById('reservaModal');
const closeModalBtn = document.getElementById('closeModal');
const reservarTop = document.getElementById('reservarTop');
const ctaReservar = document.getElementById('ctaReservar');
function openModal(){ if(reservaModal) reservaModal.setAttribute('aria-hidden','false'); }
function closeModalFn(){ if(reservaModal) reservaModal.setAttribute('aria-hidden','true'); }
if(closeModalBtn) closeModalBtn.addEventListener('click',closeModalFn);
if(reservarTop) reservarTop.addEventListener('click',(e)=>{e.preventDefault();openModal()});
if(ctaReservar) ctaReservar.addEventListener('click',(e)=>{e.preventDefault();openModal()});

// close modal when clicking on overlay
if(reservaModal){
  reservaModal.addEventListener('click',(e)=>{
    if(e.target === reservaModal){
      closeModalFn();
    }
  });
}
// close modal with Escape
document.addEventListener('keydown',(e)=>{ if(e.key === 'Escape') closeModalFn(); });

async function saveReservationToSupabase(obj){ if(!USING_SUPABASE || !supabase) return {error:'supabase_not_configured'}; const { data, error } = await supabase.from('reservas').insert([obj]).select(); return {data,error}; }

const reservaForm = document.getElementById('reservaForm');
if(reservaForm) reservaForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const barber = document.getElementById('barberoSelect').value;
  const servicio = document.getElementById('servicioInput').value;
  const fecha = document.getElementById('fechaInput').value;
  const hora = document.getElementById('horaInput').value;
  const nombre = document.getElementById('nombreInput').value;
  const telefono = document.getElementById('telefonoInput').value;

  const phone = (DEMO_PHONES[barber] || (PREFIJO + ' ' + telefono)).replace(/\s+/g,'');
  const plainPhone = phone.replace(/[^+0-9]/g,'');

  const mensaje = `Hola ${barber} 👋%0AQuisiera reservar:%0A- Servicio: ${encodeURIComponent(servicio)}%0A- Fecha: ${fecha}%0A- Hora: ${hora}%0A- Cliente: ${encodeURIComponent(nombre)}%0A- Teléfono: ${telefono}`;

  const reservationObj = { barber, servicio, fecha, hora, nombre, telefono };

  if(USING_SUPABASE && supabase){
    try{
      const res = await saveReservationToSupabase({ ...reservationObj, created_at: new Date().toISOString() });
      if(res.error){ console.warn('Error guardando reserva en Supabase:', res.error); }
      else console.log('Reserva guardada en Supabase', res.data);
    }catch(err){ console.warn('Error al insertar reserva en Supabase', err); }
  } else { saveReservationLocal(reservationObj); }

  const url = `https://wa.me/${plainPhone.replace('+','')}?text=${mensaje}`;
  window.open(url,'_blank');
  closeModalFn();
});

function saveReservationLocal(obj){ const key = 'vegvisir_reservas'; const data = JSON.parse(localStorage.getItem(key) || '[]'); data.push({...obj, created_at: new Date().toISOString()}); localStorage.setItem(key,JSON.stringify(data)); }

// --- Auth & uploader helpers ---
function mockLogin(username,password){ if(DEMO_USERS[username] && DEMO_USERS[username] === password){ localStorage.setItem('vegvisir_user',username); return true; } return false; }
function mockLogout(){ localStorage.removeItem('vegvisir_user'); }
function getCurrentUser(){ return localStorage.getItem('vegvisir_user'); }

async function supabaseLogin({email,password}){ if(!USING_SUPABASE || !supabase) throw new Error('Supabase no configurado'); const res = await supabase.auth.signInWithPassword({ email, password }); return res; }
async function supabaseSignUp({email,password,username}){ if(!USING_SUPABASE || !supabase) throw new Error('Supabase no configurado'); const res = await supabase.auth.signUp({ email, password, options: { data: { username } } }); return res; }
async function supabaseLogout(){ if(!USING_SUPABASE || !supabase) return; await supabase.auth.signOut(); }

async function uploadFilesForCurrentUser(files){
  if(USING_SUPABASE && supabase){
    const userResp = await supabase.auth.getUser().catch(()=>({data:{user:null}}));
    const user = userResp.data ? userResp.data.user : null;
    if(!user) throw new Error('No hay usuario logueado');
    const username = user.user_metadata?.username || user.id;
    const uploaded = [];
    for(const file of files){
      const ext = file.name.split('.').pop();
      const filePath = `${username}/${Date.now()}-${Math.random().toString(36).substring(2,8)}.${ext}`;
      const { data, error } = await supabase.storage.from('barberos').upload(filePath, file, { cacheControl: '3600', upsert: false });
      if(error){ console.warn('Error subida:', error); }
      else {
        const publicURL = `${window.SUPABASE_CONFIG.SUPABASE_URL.replace(/\/$/,'')}/storage/v1/object/public/barberos/${encodeURIComponent(filePath)}`;
        uploaded.push({path:filePath, publicURL});
      }
    }
    return uploaded;
  } else {
    const user = getCurrentUser(); if(!user) throw new Error('No demo user logged in'); const arr = []; for(const file of files){ const dataUrl = await fileToDataUrl(file); saveImageForUser(user,dataUrl); arr.push({src:dataUrl}); } return arr;
  }
}

function fileToDataUrl(file){ return new Promise((resolve,reject)=>{ const reader = new FileReader(); reader.onload = ()=>resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); }); }

function saveImageForUser(username,dataUrl){ const key = `gallery_${username}`; const arr = JSON.parse(localStorage.getItem(key) || '[]'); arr.push({src:dataUrl,created:new Date().toISOString()}); localStorage.setItem(key,JSON.stringify(arr)); }
function getImagesForUser(username){ const key = `gallery_${username}`; return JSON.parse(localStorage.getItem(key) || '[]'); }

function renderGalleries(){ const container = document.getElementById('galleryContainer'); if(!container) return; const barbers = window.SITE_DATA ? window.SITE_DATA.barbers.map(b=>b.username) : Object.keys(DEMO_PHONES); barbers.forEach(b=>{ const section = document.createElement('section'); section.id = b; section.className = 'barber-section'; const barberObj = window.SITE_DATA ? window.SITE_DATA.barbers.find(x=>x.username===b) : null; const h = document.createElement('h4'); h.textContent = barberObj ? barberObj.name : b; section.appendChild(h); const imgs = getImagesForUser(b); const grid = document.createElement('div'); grid.className = 'gallery-grid'; if(imgs.length===0){ const p = document.createElement('p'); p.textContent = 'Sin trabajos subidos aún.'; section.appendChild(p); } else { imgs.forEach(it=>{ const img = document.createElement('img'); img.src = it.src; img.alt = b; img.className='thumb'; grid.appendChild(img); }); section.appendChild(grid); } container.appendChild(section); }); }

// Login page handler
if(document.getElementById('loginForm')){
  document.getElementById('loginForm').addEventListener('submit',async (e)=>{
    e.preventDefault();
    const u = document.getElementById('userInput').value;
    const p = document.getElementById('passInput').value;
    if(USING_SUPABASE && supabase){
      try{
        // Allow login by username or email
        let emailCandidate = u.includes('@') ? u : `${u}@vegvisir.local`;
        const res = await supabaseLogin({ email: emailCandidate, password: p });
        if(res.error) alert('Error al iniciar sesión: ' + (res.error.message||JSON.stringify(res.error)));
        else { alert('Login exitoso'); window.location.href = 'uploader.html'; }
      }catch(err){ console.warn(err); alert('Error al iniciar sesión con Supabase.'); }
    } else {
      if(mockLogin(u,p)){ alert('Login demo exitoso'); window.location.href = 'uploader.html'; } else alert('Usuario o clave incorrecta');
    }
  });
}

// Signup page handler (new)
if(document.getElementById('signupForm')){
  document.getElementById('signupForm').addEventListener('submit',async (e)=>{
    e.preventDefault();
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPass').value;
    const username = document.getElementById('signupUser').value;

    if(!email || !password || !username){ alert('Completa todos los campos.'); return; }

    if(USING_SUPABASE && supabase){
      try{
        const res = await supabaseSignUp({ email, password, username });
        if(res.error){
          alert('Error en registro: ' + (res.error.message||JSON.stringify(res.error)));
        } else {
          // depending on your Supabase settings, the user might need to confirm email
          alert('Registro completado. Revisa tu correo para confirmar tu cuenta si es necesario.');
          window.location.href = 'login.html';
        }
      }catch(err){ console.warn(err); alert('Error al registrarse.'); }
    } else {
      // demo: create local user
      localStorage.setItem('demo_user_'+username, JSON.stringify({ email, password }));
      alert('Registro demo creado. Ahora inicia sesión con tu usuario.');
      window.location.href = 'login.html';
    }
  });
}

// uploader page handler
if(document.getElementById('uploadForm')){
  (async ()=>{
    if(USING_SUPABASE && supabase){
      const { data: { user } } = await supabase.auth.getUser().catch(()=>({data:{user:null}}));
      if(!user){ alert('Debes iniciar sesión como barbero para subir trabajos.'); window.location.href = 'login.html'; return; }
      document.getElementById('currentUser').textContent = user.user_metadata?.username || user.id;
      document.getElementById('uploadForm').addEventListener('submit', async (e)=>{
        e.preventDefault();
        const input = document.getElementById('fileInput');
        const files = Array.from(input.files).slice(0,6);
        try{ const res = await uploadFilesForCurrentUser(files); alert('Imágenes subidas.'); window.location.href = 'galeria.html#' + (user.user_metadata?.username || user.id); }catch(err){ console.warn(err); alert('Error al subir imágenes.'); }
      });
    } else {
      const user = getCurrentUser(); if(!user){ alert('Debes iniciar sesión como barbero para subir trabajos.'); window.location.href = 'login.html'; return; }
      document.getElementById('currentUser').textContent = user;
      document.getElementById('uploadForm').addEventListener('submit',(e)=>{
        e.preventDefault();
        const input = document.getElementById('fileInput');
        const files = Array.from(input.files).slice(0,6);
        files.forEach(file=>{ const reader = new FileReader(); reader.onload = function(ev){ saveImageForUser(user,ev.target.result); }; reader.readAsDataURL(file); });
        alert('Imágenes subidas (demo). Se guardan localmente en tu navegador.'); window.location.href = 'galeria.html#'+user;
      });
    }
  })();
}

// gallery render
if(document.getElementById('galleryContainer')) renderGalleries();

// render site after DOM ready
document.addEventListener('DOMContentLoaded', ()=>{
  renderSiteFromData();
});
