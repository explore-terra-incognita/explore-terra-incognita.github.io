/* Terra Incognita · arranque
   Con ?prueba en la dirección, el cuaderno deja probar todos los secretos (sin apuntarlos) y
   #id-del-secreto lo lanza al cargar (#luna hace el viaje a la Luna). TI.debug sirve para probar desde la consola. */
(function () {
  'use strict';
  var TI = window.TI, E = TI.motor, I = TI.interfaz;
  I.iniciar();
  E.iniciar(document.getElementById('lienzo'));

  function buscar(id) { var h = null; I.huevos().forEach(function (x) { if (x.id === id) h = x; }); return h; }
  function irA(mundo) {   // cambio de mundo inmediato, sin viaje (para probar)
    if (E.mundo !== mundo) E.cambiarMundo(mundo, { rot: TI.mat.mirando(mundo === 'luna' ? 8 : 24, mundo === 'luna' ? 12 : -28), zoom: 1 });
  }

  TI.debug = {
    // lanza un secreto sin apuntarlo: TI.debug.disparar('atlantida'), TI.debug.disparar('apolo-11') (salta al mundo que toque)
    disparar: function (id, datos) {
      if (id === 'luna' || id === 'tierra') return I.viajar(id);
      if (id === 'final') { I.verFinal(E.mundo); return true; }
      if (id === 'final-luna') { irA('luna'); I.verFinal('luna'); return true; }
      if (id === 'creditos') { I.mostrarCreditos(E.mundo); return true; }
      var h = buscar(id); if (!h) return false;
      irA(h.mundo);
      return I.disparar(h, datos, { prueba: true });
    },
    irA: irA,
    congelar: E.congelar,
    paso: E.paso,                       // TI.debug.paso(ms, trozos): avanza el reloj a mano
    mirar: function (lat, lon, zoom) { E.rot = TI.mat.mirando(lat, lon); if (zoom) E.zoom = zoom; },
    puntero: function (x, y) { E.puntero.x = x; E.puntero.y = y; E.puntero.sobre = true; E.puntero.tipo = 'mouse'; },
    ids: function () { return I.huevos().map(function (h) { return h.mundo + ':' + h.id; }); }
  };

  if (location.hash.length > 1) {
    var id = decodeURIComponent(location.hash.slice(1));
    setTimeout(function () { TI.debug.disparar(id); }, 600);
  }
})();
