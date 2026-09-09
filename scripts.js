// scripts.js - robust site renderer, reservation and auth fallbacks
const PREFIJO = '+53'; // país (Cuba) - usado si el usuario introduce su propio teléfono

// Demo credentials (solo para demo/local)
const DEMO_USERS = {
  'alejandro': 'Vegv2026!',
  'karel': 'Vegv2026!',
  'leo': 'Vegv2026!',
  'marco': 'Vegv2026!',
  'chino': 'Vegv2026!'
};

// fallback demo phones (leave empty since authoritative data lives in site-data.js)
const DEMO_PHONES = {};

let supabase = null;
let USING_SUPABASE = false;

async function initSupabase(){
  if(!window.SUPABASE_CONFIG || !window.SUPABASE_CONFIG.SUPABASE_URL || !window.SUPABASE_CONFIG.SUPABASE_ANON_KEY){
    console.log('Supabase no configurado, usando modo demo/localStorage');
    return;
  }
  try{
    const mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/dist/esm/index.js');
    supabase = mod.createClient(window.SUPABASE_CONFIG.SUPABASE_URL, window.SUPABASE_CONFIG.SUPABASE_ANON_KEY);
    USING_SUPABASE = true;
    console.log('Supabase inicializado');
  }catch(err){
    console.warn('No se pudo cargar supabase-js, continuando en demo mode', err);
    USING_SUPABASE = false;
  }
}

// robust rendering of services & team using window.SITE_DATA (or sensible fallbacks)
function renderSiteFromData(){
  try{
    const data = window.SITE_DATA || { services: [], barbers: [] };

    // SERVICES
    const servicesContainer = document.getElementById('servicesContainer');
    if(servicesContainer){
      servicesContainer.innerHTML = '';
      (data.services || []).forEach(s => {
        const card = document.createElement('div');
        card.className = 'card service-card';
        card.innerHTML = `
          <h4>${s.title}</h4>
          <p>Precio: $${s.price}${s.duration ? ' — Duración: ' + s.duration : ''}</p>
          <div style="margin-top:8px">
            <button class="btn small reservar-btn" data-service="${s.title}">Reservar</button>
          </div>
        `;
        servicesContainer.appendChild(card);
      });
    }

    // TEAM (limit to first 5)
    const teamContainer = document.getElementById('teamContainer');
    if(teamContainer){
      teamContainer.innerHTML = '';
      const barbers = (data.barbers || []).slice(0,5);
      barbers.forEach(b => {
        const div = document.createElement('div');
        div.className = 'member';
        const img = b.img || 'https://via.placeholder.com/300?text=Barbero';
        const phone = b.phone || '';
        div.innerHTML = `
          <img src="${img}" alt="${b.name || b.username}">
          <h4>${b.name || b.username}</h4>
          <p class="phone">${phone}</p>
          <div style="margin-top:10px">
            <button class="btn small reservar-btn" data-username="${b.username}" data-phone="${phone}" data-service="">Reservar</button>
            <a class="btn outline small" href="galeria.html#${b.username}">Ver trabajos</a>
          </div>
        `;
        teamContainer.appendChild(div);
      });

      // populate modal select with all barbers (useful for manual selection)
      const barberoSelect = document.getElementById('barberoSelect');
      if(barberoSelect){
        barberoSelect.innerHTML = '';
        (data.barbers || []).forEach(b=>{
          const opt = document.createElement('option');
          opt.value = b.username;
          opt.textContent = (b.name ? b.name + ' — ' : '') + (b.phone || b.username);
          barberoSelect.appendChild(opt);
        });
      }
    }

    // Attach reservar handlers
    document.querySelectorAll('.reservar-btn').forEach(btn=>{
      // remove any previous handler to avoid duplicates
      if(btn._reserveHandler){
        btn.removeEventListener('click', btn._reserveHandler);
      }
      const handler = function(e){
        e.preventDefault();
        const svc = btn.dataset.service || '';
        const username = btn.dataset.username || '';
        const phone = btn.dataset.phone || '';
        const servicioInput = document.getElementById('servicioInput');
        if(servicioInput && svc) servicioInput.value = svc;
        const barberoSelect = document.getElementById('barberoSelect');
        if(barberoSelect && username) barberoSelect.value = username;
        // ensure hidden field barberPhoneHidden exists and set it
        const form = document.getElementById('reservaForm');
        if(form){
          let hidden = document.getElementById('barberPhoneHidden');
          if(!hidden){
            hidden = document.createElement('input');
            hidden.type = 'hidden';
            hidden.id = 'barberPhoneHidden';
            hidden.name = 'barberPhoneHidden';
            form.appendChild(hidden);
          }
          hidden.value = phone || '';
        }
        const telefonoInput = document.getElementById('telefonoInput');
        if(telefonoInput && phone) telefonoInput.placeholder = phone.replace(/\s+/g,'');
        if(typeof openModal === 'function') openModal();
      };
      btn.addEventListener('click', handler);
      btn._reserveHandler = handler;
    });

  }catch(err){
    console.error('Error en renderSiteFromData:', err);
  }
}

// Modal open/close
const reservaModal = document.getElementById('reservaModal');
const closeModalBtn = document.getElementById('closeModal');
const ctaReservar = document.getElementById('ctaReservar');

function openModal(){ if(reservaModal) reservaModal.setAttribute('aria-hidden','false'); }
function closeModalFn(){ if(reservaModal) reservaModal.setAttribute('aria-hidden','true'); }

if(closeModalBtn) closeModalBtn.addEventListener('click', closeModalFn);
if(ctaReservar) ctaReservar.addEventListener('click', (e)=>{ e.preventDefault(); openModal(); });

// overlay click
if(reservaModal){
  reservaModal.addEventListener('click',(e)=>{
    if(e.target === reservaModal) closeModalFn();
  });
}
document.addEventListener('keydown',(e)=>{ if(e.key === 'Escape') closeModalFn(); });

// Reservation storage helpers
async function saveReservationToSupabase(obj){
  if(!USING_SUPABASE || !supabase) return { error: 'supabase_not_configured' };
  try{
    const res = await supabase.from('reservas').insert([obj]).select();
    if(res.error) return { error: res.error };
    return { data: res.data };
  }catch(err){
    return { error: err };
  }
}
function saveReservationLocal(obj){
  try{
    const key = 'vegvisir_reservas';
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    data.push({...obj, created_at: new Date().toISOString()});
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  }catch(e){
    console.warn('saveReservationLocal error', e);
    return false;
  }
}

// Form submit -> save and open WhatsApp
(function wireReservationForm(){
  const reservaForm = document.getElementById('reservaForm');
  if(!reservaForm) return;
  reservaForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const barber = (document.getElementById('barberoSelect') ? document.getElementById('barberoSelect').value : '') || '';
    const servicio = (document.getElementById('servicioInput') ? document.getElementById('servicioInput').value : '') || '';
    const fecha = (document.getElementById('fechaInput') ? document.getElementById('fechaInput').value : '') || '';
    const hora = (document.getElementById('horaInput') ? document.getElementById('horaInput').value : '') || '';
    const nombre = (document.getElementById('nombreInput') ? document.getElementById('nombreInput').value : '') || '';
    let telefono = (document.getElementById('telefonoInput') ? document.getElementById('telefonoInput').value : '') || '';

    // prefer hidden barberPhoneHidden (barber's number) if present
    const hidden = document.getElementById('barberPhoneHidden');
    if(hidden && hidden.value) telefono = hidden.value;

    // if phone still empty, try SITE_DATA lookup
    if(!telefono){
      const data = window.SITE_DATA || {};
      const barberObj = (data.barbers || []).find(b => b.username === barber);
      telefono = (barberObj && barberObj.phone) || '';
    }

    const phoneNormalized = (telefono || '').replace(/\s+/g,'').replace(/[^+0-9]/g,'');
    const plainPhone = phoneNormalized.replace(/^\+/, '');

    const mensajeText = `Hola ${barber} 👋%0AQuisiera reservar:%0A- Servicio: ${encodeURIComponent(servicio)}%0A- Fecha: ${fecha}%0A- Hora: ${hora}%0A- Cliente: ${encodeURIComponent(nombre)}%0A- Teléfono: ${encodeURIComponent(telefono)}`;

    const reservationObj = { barber, servicio, fecha, hora, nombre, telefono };

    // Save reservation
    if(USING_SUPABASE && supabase){
      const res = await saveReservationToSupabase({ ...reservationObj, created_at: new Date().toISOString() });
      if(res && res.error) console.warn('Error guardando en Supabase:', res.error);
    } else {
      saveReservationLocal(reservationObj);
    }

    // Open WhatsApp
    if(plainPhone){
      const url = `https://wa.me/${plainPhone}?text=${mensajeText}`;
      window.open(url, '_blank');
    } else {
      alert('No se pudo determinar el teléfono del barbero. Se guardó la reserva localmente; por favor contacta manualmente.');
    }
    closeModalFn();
  });
})();

// File utilities & gallery local fallback
function fileToDataUrl(file){
  return new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.onload = ()=>resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function saveImageForUser(username, dataUrl){
  try{
    const key = `gallery_${username}`;
    const arr = JSON.parse(localStorage.getItem(key) || '[]');
    arr.push({ src: dataUrl, created: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(arr));
    return true;
  }catch(e){
    console.warn('saveImageForUser error', e);
    return false;
  }
}
function getImagesForUser(username){
  try{
    const key = `gallery_${username}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  }catch(e){
    return [];
  }
}

// Supabase auth wrappers (v2 style)
async function supabaseLogin({email,password}){
  if(!USING_SUPABASE || !supabase) throw new Error('Supabase no configurado');
  return await supabase.auth.signInWithPassword({ email, password });
}
async function supabaseSignUp({email,password,username}){
  if(!USING_SUPABASE || !supabase) throw new Error('Supabase no configurado');
  // add username into user metadata if possible
  return await supabase.auth.signUp({ email, password }, { data: { username } });
}

// Login & Signup handlers (with demo fallback)
(function wireAuthForms(){
  // LOGIN
  const loginForm = document.getElementById('loginForm');
  if(loginForm){
    loginForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const u = document.getElementById('userInput').value;
      const p = document.getElementById('passInput').value;
      if(USING_SUPABASE && supabase){
        try{
          let emailCandidate = u.includes('@') ? u : `${u}@vegvisir.local`;
          const res = await supabaseLogin({ email: emailCandidate, password: p });
          if(res.error) alert('Error al iniciar sesión: ' + (res.error.message || JSON.stringify(res.error)));
          else { alert('Login exitoso'); window.location.href = 'uploader.html'; }
        }catch(err){ console.warn(err); alert('Error al iniciar sesión con Supabase.'); }
      } else {
        // demo: check localStorage demo_user_{username}
        const demo = JSON.parse(localStorage.getItem('demo_user_' + u) || 'null');
        if(demo && demo.password === p){ localStorage.setItem('vegvisir_user', u); alert('Login demo exitoso'); window.location.href = 'uploader.html'; }
        else if(DEMO_USERS[u] && DEMO_USERS[u] === p){ localStorage.setItem('vegvisir_user', u); alert('Login demo exitoso'); window.location.href = 'uploader.html'; }
        else alert('Usuario o clave incorrecta (modo demo).');
      }
    });
  }

  // SIGNUP
  const signupForm = document.getElementById('signupForm');
  if(signupForm){
    signupForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const email = document.getElementById('signupEmail').value;
      const password = document.getElementById('signupPass').value;
      const username = document.getElementById('signupUser').value;
      if(!email || !password || !username){ alert('Completa todos los campos.'); return; }

      if(USING_SUPABASE && supabase){
        try{
          const res = await supabaseSignUp({ email, password, username });
          if(res.error) alert('Error en registro: ' + (res.error.message || JSON.stringify(res.error)));
          else {
            alert('Registro completado (revisa tu correo si es necesario).');
            window.location.href = 'login.html';
          }
        }catch(err){ console.warn(err); alert('Error al registrarse con Supabase.'); }
      } else {
        // demo: store in localStorage demo_user_{username}
        localStorage.setItem('demo_user_' + username, JSON.stringify({ email, password }));
        alert('Registro demo creado. Ahora inicia sesión con tu usuario.');
        window.location.href = 'login.html';
      }
    });
  }
})();

// Uploader page (demo fallback if no Supabase)
(async function wireUploader(){
  const uploadForm = document.getElementById('uploadForm');
  if(!uploadForm) return;
  if(USING_SUPABASE && supabase){
    try{
      const userResp = await supabase.auth.getUser().catch(()=>({ data: { user: null } }));
      const user = userResp?.data?.user || null;
      if(!user){ alert('Debes iniciar sesión como barbero para subir trabajos.'); window.location.href = 'login.html'; return; }
      document.getElementById('currentUser').textContent = user.user_metadata?.username || user.id;
      uploadForm.addEventListener('submit', async (e)=>{
        e.preventDefault();
        const input = document.getElementById('fileInput');
        const files = Array.from(input.files || []).slice(0,6);
        // implement Supabase upload logic if desired (left minimal)
        alert('Subida con Supabase no implementada en este script demo.');
      });
    }catch(err){ console.warn('Uploader error', err); }
  } else {
    const user = localStorage.getItem('vegvisir_user');
    if(!user){ alert('Debes iniciar sesión como barbero para subir trabajos.'); window.location.href = 'login.html'; return; }
    document.getElementById('currentUser').textContent = user;
    uploadForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const input = document.getElementById('fileInput');
      const files = Array.from(input.files || []).slice(0,6);
      for(const file of files){
        const dataUrl = await fileToDataUrl(file);
        saveImageForUser(user, dataUrl);
      }
      alert('Imágenes subidas (demo). Se guardan localmente en tu navegador.');
      window.location.href = 'galeria.html#' + user;
    });
  }
})();

// Gallery render (demo)
function renderGalleries(){
  const container = document.getElementById('galleryContainer');
  if(!container) return;
  container.innerHTML = '';
  const barbers = window.SITE_DATA ? (window.SITE_DATA.barbers || []).map(b=>b.username) : Object.keys(DEMO_PHONES);
  barbers.forEach(b=>{
    const section = document.createElement('section');
    section.id = b;
    section.className = 'barber-section';
    const barberObj = (window.SITE_DATA || {}).barbers ? (window.SITE_DATA.barbers.find(x=>x.username===b) || null) : null;
    const h = document.createElement('h4');
    h.textContent = barberObj ? barberObj.name : b;
    section.appendChild(h);
    const imgs = getImagesForUser(b);
    if(imgs.length === 0){
      const p = document.createElement('p');
      p.textContent = 'Próximamente encontrarás aquí los trabajos de nuestros barberos.';
      section.appendChild(p);
    } else {
      const grid = document.createElement('div');
      grid.className = 'gallery-grid';
      imgs.forEach(it=>{
        const img = document.createElement('img');
        img.src = it.src;
        img.className = 'thumb';
        grid.appendChild(img);
      });
      section.appendChild(grid);
    }
    container.appendChild(section);
  });
}

// initialize
document.addEventListener('DOMContentLoaded', async ()=>{
  await initSupabase();
  renderSiteFromData();
  // render gallery if needed
  if(document.getElementById('galleryContainer')) renderGalleries();
});
