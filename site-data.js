// site-data.js — site content used by the renderer (updated with real phone numbers and prices)
// DO NOT store secrets here. This file contains public site data (barberos & servicios).
window.SITE_DATA = {
  barbers: [
    { username: 'chino', name: 'Chino Barbero', phone: '+53 5 4657924', img: 'https://images.unsplash.com/photo-1545996124-1f5d8b0c0a4f?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=4d5e6f7g8h9i0j1k2l3m' },
    { username: 'karel', name: 'Karel Barbero', phone: '+53 5 4183460', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=1a2b3c4d5e6f7g8h9i0j' },
    { username: 'leo', name: 'Leo Barbero', phone: '+53 5 4280393', img: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=2b3c4d5e6f7g8h9i0j1k' },
    { username: 'marco', name: 'Marco Barbero', phone: '+53 5 4925131', img: 'https://images.unsplash.com/photo-1531123414780-f9990d5d4f88?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=3c4d5e6f7g8h9i0j1k2l' }
  ],
  services: [
    { title: 'Machimbre', price: 600, duration: '' },
    { title: 'Corte normal', price: 200, duration: '30 min' },
    { title: 'Arreglo de barba', price: 300, duration: '20 min' },
    { title: 'Afeitado', price: 400, duration: '20 min' },
    { title: 'Servicio completo', price: 1000, duration: '60 min' }
  ]
};
