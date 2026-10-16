/* 09 · Un punto azul pálido — seguir alejándose cuando el zoom ya no deja.
   La cámara se va hasta que la Tierra es un píxel azul dentro de un rayo de luz, como en la foto de la Voyager 1. */
(function () {
  'use strict';
  var TI = window.TI, U = TI.util, FX = TI.fx, C = TI.color, TAU = Math.PI * 2;
  var AZUL = [172, 204, 255];
  var RAYOS = [   // [posición x (0…1), ancho (en anchos de pantalla), color, alfa]
    [0.30, 0.05, [196, 150, 120], 0.10], [0.43, 0.075, [222, 192, 152], 0.22],
    [0.56, 0.04, [150, 170, 200], 0.09], [0.66, 0.09, [205, 160, 140], 0.11], [0.79, 0.035, [160, 190, 170], 0.07]
  ];

  TI.registrar({
    id: 'punto-azul', n: 9, nombre: 'Un punto azul pálido', tipo: 'Distancia',
    pista: 'Aléjate. Más. Más de lo que te deja.',
    detectar: function (api) {
      var extra = 0, ultimo = 0, E = api.motor;
      api.en('rueda', function (d) {
        if (!d.enMin) { extra = 0; return; }
        if (E.t - ultimo > 1500) extra = 0;
        ultimo = E.t; extra += Math.abs(d.dy);
        if (extra > 1100) { extra = 0; api.disparar(); }
      });
    },
    escena: function (E) {
      var L = E.lectura;   // tiempo extra para leer la tarjeta (motor.js)
      var R0 = null, ROTA = -0.11;
      function radio(t) {
        if (R0 === null) return E.R;
        if (t < 3600) return R0 * Math.pow(1.1 / R0, U.inOut(t / 3600));
        if (t < 11000 + L) return 1.1;
        return 1.1 * Math.pow(R0 / 1.1, U.inOut(U.tramo(t, 11000 + L, 13400 + L)));
      }
      return {
        duracion: 13600 + L,
        sinAtmosfera: true,
        tarjeta: {
          en: 5000, hasta: 10600 + L,
          titulo: 'Un punto azul pálido',
          texto: 'Así se ve la Tierra desde unos 6.000 millones de kilómetros. La Voyager 1 se dio la vuelta el 14 de febrero de 1990 para hacer una última foto de casa. Todo lo que conoces cabe en ese píxel.',
          pie: 'Voyager 1 · 14.02.1990'
        },
        inicio: function () { R0 = E.Rbase * E.zoom; },
        cuadro: function (t) {
          E.zoom = radio(t) / E.Rbase;
          E.brilloEstrellas = 1 - 0.85 * U.meseta(t, 1500, 3800, 10800 + L, 13000 + L);
          if (t > 13300 + L) E.zoom = R0 / E.Rbase;
        },
        fondo: function (ctx, t) {
          // los rayos de luz dispersa del Sol en la óptica de la cámara
          var a = U.meseta(t, 2600, 4600, 10600 + L, 12600 + L); if (a <= 0) return;
          ctx.save(); ctx.translate(E.W / 2, E.H / 2); ctx.rotate(ROTA); ctx.translate(-E.W / 2, -E.H / 2);
          ctx.globalCompositeOperation = 'lighter';
          RAYOS.forEach(function (r, i) {
            var x = E.W * r[0] + (i === 1 ? E.cx - E.W * 0.43 : 0), w = E.W * r[1];
            var g = ctx.createLinearGradient(x - w, 0, x + w, 0);
            g.addColorStop(0, U.rgba(r[2], 0)); g.addColorStop(0.5, U.rgba(r[2], r[3] * a)); g.addColorStop(1, U.rgba(r[2], 0));
            ctx.fillStyle = g; ctx.fillRect(x - w, -E.H * 0.3, w * 2, E.H * 1.6);
          });
          ctx.restore();
        },
        puntos: function (ctx, t) {
          var R = E.R;
          if (R > 26) { E.dibujarAtmosfera(U.clamp((R - 26) / 60, 0, 1)); E.dibujarPuntos({ escala: Math.max(0.35, Math.min(1, R / 120)), conMar: R > 80 }); return; }
          // de lejos ya no se distinguen los puntos: un disco y, al final, un píxel azul
          var k = U.clamp((26 - R) / 22, 0, 1), col = U.mezcla(C.hueso, AZUL, k);
          FX.brillo(E.cx, E.cy, 4 + R * 2.5, AZUL, 0.25 + 0.2 * k);
          ctx.fillStyle = U.rgba(col, 0.95); ctx.beginPath(); ctx.arc(E.cx, E.cy, Math.max(0.9, R), 0, TAU); ctx.fill();
        },
        frente: function (ctx, t) {
          var a = U.meseta(t, 4400, 5200, 10200 + L, 11000 + L); if (a <= 0) return;
          var x = E.cx, y = E.cy;
          ctx.strokeStyle = U.rgba(C.hueso, 0.45 * a); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x + 7, y - 7); ctx.lineTo(x + 46, y - 46); ctx.lineTo(x + 60, y - 46); ctx.stroke();
          FX.texto('TÚ ESTÁS AQUÍ', x + 66, y - 46, { tam: 11, a: 0.9 * a, espaciado: 1.4 });
        },
        vuelta: { zoom: 1, dur: 600 }
      };
    }
  });
})();
