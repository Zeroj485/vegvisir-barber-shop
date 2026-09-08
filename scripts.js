// scripts.js - supabase-aware reservation and uploader logic
// If you create a file `supabase-config.js` that sets window.SUPABASE_CONFIG = { SUPABASE_URL: '...', SUPABASE_ANON_KEY: '...' }
// then this script will dynamically load supabase-js and enable full backend features.

const PREFIJO = '+53'; // país (Cuba)

// Demo fallback users (only used if Supabase not configured)
const DEMO_USERS = {
  'alejandro': 'Vegv2026!',
  'barbero2': 'Vegv2026!',
  'barbero3': 'Vegv2026!',
  'barbero4': 'Vegv2026!',
  'barbero5': 'Vegv2026!'
};

const DEMO_PHONES = {
  'alejandro': '+53 56513862',
  'barbero2': '+53 60000002',
  'barbero3': '+53 60000003',
  'barbero4': '+53 60000004',
  'barbero5': '+53 60000005'
};

let supabase = null;
let USING_SUPABASE = false;

async function initSupabase(){
  if(!window.SUPABASE_CONFIG || !window.SUPABASE_CONFIG.SUPABASE_URL || !window.SUPABASE_CONFIG.SUPABASE_ANON_KEY){
    console.log('Supabase config not found — running in demo/local mode');
    return;
  }
  try{
    // dynamic import of supabase-js ESM bundle
    const mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/dist/esm/index.js');
    supabase = mod.createClient(window.SUPABASE_CONFIG.SUPABASE_URL, window.SUPABASE_CONFIG.SUPABASE_ANON_KEY);
    USING_SUPABASE = true;
    console.log('Supabase initialized');
  }catch(err){
    console.warn('No se pudo cargar supabase-js desde CDN, continuando en modo demo', err);
  }
}

// Init on load
initSupabase();

// Reservation modal handlers (same UI as demo)
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
closeModal && closeModal.addEventListener('click',close);
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

async function saveReservationToSupabase(obj){
  if(!USING_SUPABASE || !supabase) return {error:'supabase_not_configured'};
  const { data, error } = await supabase.from('reservas').insert([obj]).select();
  return {data,error};
}

// handle reservation submit
const reservaForm = document.getElementById('reservaForm');
reservaForm && reservaForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const barber = document.getElementById('barberoSelect').value;
  const servicio = document.getElementById('servicioInput').value;
  const fecha = document.getElementById('fechaInput').value;
  const hora = document.getElementById('horaInput').value;
  const nombre = document.getElementById('nombreInput').value;
  const telefono = document.getElementById('telefonoInput').value;

  const phone = (DEMO_PHONES[barber] || (PREFIJO + ' ' + telefono)).replace(/\s+/g,'');
  const plainPhone = phone.replace(/[^+0-9]/g,'');

  let mensaje = `Hola ${barber} 👋%0AQuisiera reservar:%0A- Servicio: ${encodeURIComponent(servicio)}%0A- Fecha: ${fecha}%0A- Hora: ${hora}%0A- Cliente: ${encodeURIComponent(nombre)}%0A- Teléfono: ${telefono}`;

  const reservationObj = { barber, servicio, fecha, hora, nombre, telefono };

  if(USING_SUPABASE && supabase){
    try{
      const res = await saveReservationToSupabase({ ...reservationObj, created_at: new Date().toISOString() });
      if(res.error){
        console.warn('Error guardando reserva en Supabase:', res.error);
      } else {
        console.log('Reserva guardada en Supabase', res.data);
      }
    }catch(err){
      console.warn('Error al insertar reserva en Supabase', err);
    }
  } else {
    saveReservationLocal(reservationObj);
  }

  const url = `https://wa.me/${plainPhone.replace('+','')}?text=${mensaje}`;
  window.open(url,'_blank');
});

function saveReservationLocal(obj){
  const key = 'vegvisir_reservas';
  const data = JSON.parse(localStorage.getItem(key) || '[]');
  data.push({...obj, created_at: new Date().toISOString()});
  localStorage.setItem(key,JSON.stringify(data));
}

// --- Auth & uploader logic ---
// If Supabase is configured, use real auth & storage. Otherwise fall back to demo/local mode.

function mockLogin(username,password){
  if(DEMO_USERS[username] && DEMO_USERS[username] === password){
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

// Supabase auth helpers
async function supabaseLogin({email,password}){
  if(!USING_SUPABASE || !supabase) throw new Error('Supabase no configurado');
  const res = await supabase.auth.signInWithPassword({ email, password });
  return res;
}
async function supabaseSignUp({email,password,username}){
  if(!USING_SUPABASE || !supabase) throw new Error('Supabase no configurado');
  const res = await supabase.auth.signUp({ email, password, options: { data: { username } } });
  return res;
}
async function supabaseLogout(){
  if(!USING_SUPABASE || !supabase) return;
  await supabase.auth.signOut();
}

// uploader: save images (Supabase storage or local)
async function uploadFilesForCurrentUser(files){
  if(USING_SUPABASE && supabase){
    const user = supabase.auth.getUser ? (await supabase.auth.getUser()).data.user : null;
    if(!user){
      throw new Error('No hay usuario logueado');
    }
    const username = user.user_metadata?.username || user.id;
    const uploaded = [];
    for(const file of files){
      const ext = file.name.split('.').pop();
      const filePath = `${username}/${Date.now()}-${Math.random().toString(36).substring(2,8)}.${ext}`;
      const { data, error } = await supabase.storage.from('barberos').upload(filePath, file, { cacheControl: '3600', upsert: false });
      if(error){
        console.warn('Error subida:', error);
      } else {
        const publicURL = 
          (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.SUPABASE_URL)
          ? `${window.SUPABASE_CONFIG.SUPABASE_URL.replace(/\.co$/, '.co')}/storage/v1/object/public/barberos/${encodeURIComponent(filePath)}`
          : null;
        uploaded.push({path:filePath, publicURL});
      }
    }
    return uploaded;
  } else {
    // local fallback: save as dataURLs in localStorage (demo)
    const user = getCurrentUser();
    if(!user) throw new Error('No demo user logged in');
    const arr = [];
    for(const file of files){
      const dataUrl = await fileToDataUrl(file);
      saveImageForUser(user,dataUrl);
      arr.push({src:dataUrl});
    }
    return arr;
  }
}

function fileToDataUrl(file){
  return new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.onload = ()=>resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Local gallery helpers (demo)
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

// Render galleries on gallery page
function renderGalleries(){
  const container = document.getElementById('galleryContainer');
  if(!container) return;
  const barbers = Object.keys(DEMO_PHONES);
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

// Login page handler
if(document.getElementById('loginForm')){
  document.getElementById('loginForm').addEventListener('submit',async (e)=>{
    e.preventDefault();
    const u = document.getElementById('userInput').value;
    const p = document.getElementById('passInput').value;
    if(USING_SUPABASE && supabase){
      try{
        // in production we expect barberos to login with email; the demo login form uses username for compatibility
        // Here we attempt to sign in with username@vegvisir.local (convention) if username provided
        let emailCandidate = u.includes('@') ? u : `${u}@vegvisir.local`;
        const res = await supabaseLogin({ email: emailCandidate, password: p });
        if(res.error){
          alert('Error al iniciar sesión: ' + (res.error.message||res.error));
        } else {
          alert('Login exitoso');
          window.location.href = 'uploader.html';
        }
      }catch(err){
        console.warn(err);
        alert('Error al iniciar sesión con Supabase.');
      }
    } else {
      if(mockLogin(u,p)){
        alert('Login demo exitoso');
        window.location.href = 'uploader.html';
      } else alert('Usuario o clave incorrecta');
    }
  });
}

// uploader page handler
if(document.getElementById('uploadForm')){
  (async ()=>{
    if(USING_SUPABASE && supabase){
      const { data: { user } } = await supabase.auth.getUser().catch(()=>({data:{user:null}}));
      if(!user){
        alert('Debes iniciar sesión como barbero para subir trabajos.');
        window.location.href = 'login.html';
        return;
      }
      document.getElementById('currentUser').textContent = user.user_metadata?.username || user.id;
      document.getElementById('uploadForm').addEventListener('submit', async (e)=>{
        e.preventDefault();
        const input = document.getElementById('fileInput');
        const files = Array.from(input.files).slice(0,6);
        try{
          const res = await uploadFilesForCurrentUser(files);
          alert('Imágenes subidas.');
          window.location.href = 'galeria.html#' + (user.user_metadata?.username || user.id);
        }catch(err){
          console.warn(err);
          alert('Error al subir imágenes.');
        }
      });
    } else {
      const user = getCurrentUser();
      if(!user){
        alert('Debes iniciar sesión como barbero para subir trabajos.');
        window.location.href = 'login.html';
        return;
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
  })();
}

// gallery render
if(document.getElementById('galleryContainer')) renderGalleries();
