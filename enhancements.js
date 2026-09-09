(function(){
  // Enhancements to ensure team shows only first 5 and Reserve buttons prefill barber phone
  function ensureBarberPhoneHiddenForm(barberPhone){
    const form = document.getElementById('reservaForm');
    if(!form) return null;
    let hidden = document.getElementById('barberPhoneHidden');
    if(!hidden){ hidden = document.createElement('input'); hidden.type='hidden'; hidden.id='barberPhoneHidden'; hidden.name='barberPhoneHidden'; form.appendChild(hidden); }
    hidden.value = barberPhone || '';
    return hidden;
  }

  function onReserveButtonClick(btn){
    const username = btn.dataset.barber || btn.dataset.username;
    const phone = btn.dataset.phone || '';
    const barberoSelect = document.getElementById('barberoSelect');
    if(barberoSelect && username){
      // ensure option exists and select it
      let opt = barberoSelect.querySelector(`option[value="${username}"]`);
      if(!opt){ opt = document.createElement('option'); opt.value = username; opt.textContent = username; barberoSelect.appendChild(opt); }
      barberoSelect.value = username;
    }

    ensureBarberPhoneHiddenForm(phone);

    const telefonoInput = document.getElementById('telefonoInput');
    if(telefonoInput && phone){ telefonoInput.placeholder = phone.replace(/\s+/g,''); }

    // open modal if function present
    if(typeof openModal === 'function') openModal();
  }

  function refineTeam(){
    const teamContainer = document.getElementById('teamContainer');
    if(!teamContainer) return;
    const members = Array.from(teamContainer.querySelectorAll('.member'));
    // keep only first 5 elements
    members.forEach((m, idx) => { if(idx >= 5) m.remove(); });

    // Attach handlers to reserve buttons (in case renderSiteFromData wired different ones)
    const reserveBtns = teamContainer.querySelectorAll('.reservar-btn, .reserve-btn');
    reserveBtns.forEach(btn => {
      // avoid attaching twice
      if(btn.dataset.enhanced === '1') return;
      btn.dataset.enhanced = '1';
      btn.addEventListener('click', function(e){ e.preventDefault(); onReserveButtonClick(btn); });
    });
  }

  // Run shortly after DOM content loaded and after existing renderers ran
  document.addEventListener('DOMContentLoaded', function(){
    // run twice: once soon, once a bit later to catch asynchronous rendering
    setTimeout(refineTeam, 60);
    setTimeout(refineTeam, 400);
  });
})();
