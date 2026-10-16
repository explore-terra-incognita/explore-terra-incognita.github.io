/* Luna 03 · Salida de la Tierra — dejar la Tierra (al fondo) asomando justo por el borde de la Luna.
   Vista rasante sobre el horizonte lunar: la Tierra, medio iluminada, sube despacio como en la foto del Apolo 8. */
(function () {
  'use strict';
  var TI = window.TI, U = TI.util, FX = TI.fx, C = TI.color, TAU = Math.PI * 2;
  var ESPERA = 900;

  TI.registrar({
    id: 'salida-de-la-tierra', n: 3, mundo: 'luna', nombre: 'Salida de la Tierra', tipo: 'Mirada',
    pista: 'Desde el suelo de la Luna, la Tierra nunca sale ni se pone. Desde aquí arriba, sí: haz que asome por el borde.',
    detectar: function (api) {
      var E = api.motor, carga = 0, armado = true;
      api.en('cuadro', function (d) {
        var T = E.tierraEnCielo(), asoma = T && T.d > E.R - T.r * 0.5 && T.d < E.R + T.r * 1.8;
        if (!T || T.d > E.R + T.r * 4) armado = true;
        if (armado && asoma && !E.arrastre) carga += d.dt; else carga = Math.max(0, carga - d.dt * 2);
        if (carga > ESPERA) { carga = 0; armado = false; api.disparar(); }
      });
    },
    escena: function (E) {
      var L = E.lectura, rotT = TI.mat.mirando(12, -40), giro = 0;
      function horizonte(x) { var dx = x - E.cx; return E.cy - Math.sqrt(Math.max(0, E.R * E.R - dx * dx)); }
      return {
        duracion: 13500 + L,
        centrado: true,
        sinTierraFondo: true,
        tarjeta: {
          en: 5000, hasta: 12000 + L,
          titulo: 'Salida de la Tierra',
          texto: 'Así la vio William Anders desde el Apolo 8 el 24 de diciembre de 1968, al salir de detrás de la Luna. Desde el suelo lunar, la Tierra apenas se mueve en el cielo: ni sale ni se pone. Solo «sale» si das la vuelta a la Luna, como acabas de hacer.',
          pie: 'Apolo 8 · 24.12.1968'
        },
        // el horizonte lunar abajo y mucho cielo: el centro de la Luna queda muy por debajo de la pantalla
        inicio: function () { var Z = 3.2, Rt = E.Rbase * Z; E.camara(2, 105, Z, 2200, 0, null, E.H * 0.2 + Rt); },
        cuadro: function (t, dt) {
          E.brilloEstrellas = 1 - 0.85 * U.meseta(t, 1200, 2600, 12000 + L, 13300 + L);   // en la foto no se ven estrellas
          giro += dt * TAU / 60000; rotT = TI.mat.mul(TI.mat.mirando(12, -40), TI.mat.eje(0, 1, 0, giro));
        },
        frente: function (ctx, t) {
          var a = U.meseta(t, 1400, 2400, 12000 + L, 13300 + L); if (a <= 0) return;
          var r = Math.min(E.W, E.H) * 0.075, x = E.cx + E.W * 0.13, h0 = horizonte(x);
          var y = U.lerp(h0 + r * 1.3, h0 - r * 2.3, U.inOut(U.tramo(t, 1600, 8200)));
          // la Luna tapa lo que queda por debajo de su borde
          ctx.save();
          var k = r * 2.8, p = new Path2D(); p.rect(x - k, y - k, 2 * k, 2 * k); p.arc(E.cx, E.cy, E.R, 0, TAU); ctx.clip(p, 'evenodd');
          E.dibujarTierra(x, y, r, { alfa: a, rot: rotT });
          ctx.restore();
          var et = U.meseta(t, 6200, 7000, 11600 + L, 12800 + L);
          if (et > 0) FX.texto('LA TIERRA · ' + U.num(384400) + ' KM', x + r + 14, y - r * 0.4, { tam: 10.5, a: 0.8 * et, espaciado: 1.2 });
        }
      };
    }
  });
})();
