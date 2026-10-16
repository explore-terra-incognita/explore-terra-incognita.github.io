/* Terra Incognita · arranque
   Con ?prueba en la dirección, el cuaderno deja probar todos los secretos (sin apuntarlos) y
   #id-del-secreto lo lanza al cargar. TI.debug sirve para probar desde la consola. */
(function () {
  'use strict';
  var TI = window.TI, E = TI.motor, I = TI.interfaz;
  I.iniciar();
  E.iniciar(document.getElementById('lienzo'));

  function buscar(id) { var h = null; I.huevos().forEach(function (x) { if (x.id === id) h = x; }); return h; }

  TI.debug = {
    // lanza un secreto sin apuntarlo: TI.debug.disparar('atlantida')
    disparar: function (id, datos) { if (id === 'final') { I.verFinal(); return true; } var h = buscar(id); return h ? I.disparar(h, datos, { prueba: true }) : false; },
    congelar: E.congelar,
    paso: E.paso,                       // TI.debug.paso(ms, trozos): avanza el reloj a mano
    mirar: function (lat, lon, zoom) { E.rot = TI.mat.mirando(lat, lon); if (zoom) E.zoom = zoom; },
    puntero: function (x, y) { E.puntero.x = x; E.puntero.y = y; E.puntero.sobre = true; E.puntero.tipo = 'mouse'; },
    ids: function () { return I.huevos().map(function (h) { return h.id; }); }
  };

  if (location.hash.length > 1) {
    var id = decodeURIComponent(location.hash.slice(1));
    setTimeout(function () { TI.debug.disparar(id); }, 600);
  }
})();
