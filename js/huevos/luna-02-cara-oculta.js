/* Luna 02 · La cara oculta — mirar de frente la cara que nunca se ve desde la Tierra (con el radio a cero).
   Interferencias y pérdida de señal; la frontera entre las dos caras, dos lugares de la cara oculta y el Apolo 8 pasando por detrás. */
(function () {
  'use strict';
  var TI = window.TI, U = TI.util, G = TI.geo, FX = TI.fx, C = TI.color, TAU = Math.PI * 2;
  var ESPERA = 1500;
  var LUGARES = [['MAR DE MOSCÚ', 27.3, 147.9], ['TSIOLKOVSKI', -20.4, 129.1]];

  TI.registrar({
    id: 'cara-oculta', n: 2, mundo: 'luna', nombre: 'La cara oculta', tipo: 'Mirada',
    pista: 'Hay una cara que nadie vio hasta 1959. Búscala, aunque te quedes sin radio.',
    detectar: function (api) {
      var E = api.motor, carga = 0, armado = true;
      api.en('cuadro', function (d) {
        var z = E.rot[8];   // el centro de la vista, en el eje que apunta a la Tierra: −1 = cara oculta de frente
        if (z > -0.5) armado = true;
        if (armado && z < -0.82 && !E.arrastre) carga += d.dt; else carga = Math.max(0, carga - d.dt * 2);
        if (carga > ESPERA) { carga = 0; armado = false; api.disparar(); }
      });
    },
    escena: function (E) {
      var L = E.lectura, r = U.azar(902), q = [0, 0, 0, 0], q2 = [0, 0, 0, 0];
      var lugares = LUGARES.map(function (l) { return { nombre: l[0], v: G.vec(l[1], l[2]) }; });
      var ALT = 112 / 1737.4;   // órbita del Apolo 8, a unos 112 km
      function orbita(f) { var a = f * TAU; return [Math.sin(a), 0.08 * Math.sin(a * 0.5), Math.cos(a)]; }
      return {
        duracion: 12500 + L,
        tarjeta: {
          en: 4600, hasta: 11400 + L,
          titulo: 'La cara oculta',
          texto: 'La Luna tarda lo mismo en girar sobre sí misma que en dar la vuelta a la Tierra, unos 27 días, así que siempre nos enseña la misma cara. Esta no es oscura: le da el Sol igual que a la otra. Nadie la vio hasta que la fotografió la sonda soviética Luna 3, en 1959. Y cada vez que el Apolo 8 pasaba por detrás, se quedaba sin radio.',
          pie: 'Rotación síncrona · 27,3 días'
        },
        inicio: function () { E.camara(4, 178, 1.12, 1800); },
        puntos: function (ctx, t) {
          E.dibujarPuntos({ alfa: 1 - 0.3 * U.meseta(t, 2600, 3600, 11400 + L, 12400 + L) });
          var a = U.meseta(t, 2600, 3600, 11000 + L, 12300 + L);
          if (a > 0) {
            // la frontera entre las dos caras: el círculo a 90° de la dirección de la Tierra
            ctx.setLineDash([3, 5]); ctx.strokeStyle = U.rgba(C.acento, 0.6 * a); ctx.lineWidth = 1.2;
            ctx.beginPath(); FX.circulo([0, 0, 1], 90, U.inOut(U.tramo(t, 2600, 4200)), 240); ctx.stroke(); ctx.setLineDash([]);
            FX.texto('CARA OCULTA', E.cx, E.cy - E.R * 0.12, { tam: 12, alin: 'center', a: 0.85 * a, color: C.acento, espaciado: 3, peso: 600 });
            lugares.forEach(function (l, i) {
              E.proy(l.v, q); if (q[2] <= 0) return;
              FX.marca(q[0], q[1], l.nombre, U.tramo(t, 3600 + i * 500, 4200 + i * 500) * a, C.luna, i ? 'izq' : 'der');
            });
          }
        },
        frente: function (ctx, t) {
          // la nave pasa por detrás de la Luna (se oculta tras el disco)
          var a = U.meseta(t, 3200, 4200, 11000 + L, 12300 + L);
          if (a > 0) {
            var f = (t - 3200) / 9000, dentro = false;
            ctx.strokeStyle = U.rgba(C.luna, 0.22 * a); ctx.lineWidth = 1; ctx.beginPath();
            for (var j = 0; j <= 160; j++) {
              E.proy(orbita(j / 160), q2, ALT);
              if (E.visible(q2)) { if (!dentro) { ctx.moveTo(q2[0], q2[1]); dentro = true; } else ctx.lineTo(q2[0], q2[1]); } else dentro = false;
            }
            ctx.stroke();
            E.proy(orbita(f), q2, ALT);
            if (E.visible(q2)) {
              FX.brillo(q2[0], q2[1], 10, C.luna, 0.6 * a);
              ctx.fillStyle = U.rgba(C.luna, a); ctx.beginPath(); ctx.arc(q2[0], q2[1], 2.2, 0, TAU); ctx.fill();
              FX.texto('APOLO 8 · 24.12.1968', q2[0] + 10, q2[1] - 10, { tam: 10.5, a: 0.8 * a, espaciado: 1 });
            }
          }
          // interferencias: rayas de estática y el aviso de pérdida de señal
          var s = U.meseta(t, 0, 300, 2600, 3800);
          if (s > 0) {
            ctx.fillStyle = U.rgba(C.luna, 0.08 * s);
            for (var k = 0; k < 40; k++) { var y = r() * E.H, h = 1 + r() * 3; ctx.fillRect(0, y, E.W, h); }
            ctx.fillStyle = U.rgba(C.luna, 0.04 * s); ctx.fillRect(0, 0, E.W, E.H);
          }
          var av = U.meseta(t, 200, 600, 4000, 4800);
          if (av > 0 && Math.sin(t * 0.012) > -0.3) {
            FX.texto('PÉRDIDA DE SEÑAL', E.W / 2, E.H * 0.14, { tam: 14, alin: 'center', a: av, color: C.acento, espaciado: 3, peso: 600 });
            FX.texto('SIN CONTACTO CON LA TIERRA', E.W / 2, E.H * 0.14 + 22, { tam: 10.5, alin: 'center', a: 0.6 * av, espaciado: 2 });
          }
        }
      };
    }
  });
})();
