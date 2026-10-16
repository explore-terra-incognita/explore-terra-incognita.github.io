/* Luna 05 · Luna de sangre — no tocar nada durante 30 segundos (con el cuaderno cerrado).
   La sombra de la Tierra cruza la Luna: primero la penumbra la apaga y luego la umbra la tiñe de rojo cobre. */
(function () {
  'use strict';
  var TI = window.TI, U = TI.util, FX = TI.fx, C = TI.color, TAU = Math.PI * 2;
  var ESPERA = 30000, COBRE = [196, 82, 52], OSCURO = [92, 40, 30];
  // radios de la sombra de la Tierra a la distancia de la Luna, en radios lunares (aprox.)
  var UMBRA = 2.65, PENUMBRA = 4.6;

  TI.registrar({
    id: 'luna-de-sangre', n: 5, mundo: 'luna', nombre: 'Luna de sangre', tipo: 'Espera',
    pista: 'Deja la Luna en paz medio minuto y la Tierra le hará sombra.',
    detectar: function (api) {
      api.en('cuadro', function (d) {
        if (d.inactivo > ESPERA && !document.hidden && !document.documentElement.classList.contains('cuaderno-abierto')) { api.motor.ultimoInput = api.motor.t; api.disparar(); }
      });
    },
    escena: function (E) {
      var L = E.lectura, NIV = E.luna.nivel, NL = E.luna.n;
      var A_L = [0.22, 0.4, 0.66, 0.97];
      function sombra(t) {   // centro de la sombra, en radios lunares respecto al centro de la Luna
        var entra = U.inOut(U.tramo(t, 800, 5400)), sale = U.inOut(U.tramo(t, 10400 + L, 14400 + L));
        return [U.lerp(-PENUMBRA - 1.2, 0.12, entra) + (PENUMBRA + 1.4) * sale, -0.18];
      }
      return {
        duracion: 15000 + L,
        tarjeta: {
          en: 5600, hasta: 12800 + L,
          titulo: 'Luna de sangre',
          texto: 'En un eclipse total, la Tierra se pone entre el Sol y la Luna y le tapa la luz. Pero la Luna no desaparece: se vuelve rojiza porque le llega la luz que atraviesa la atmósfera de la Tierra, la de todos sus amaneceres y atardeceres a la vez.',
          pie: 'Eclipse total de Luna · la sombra de la Tierra'
        },
        inicio: function () { E.camara(0, 0, 1.12, 2200); },
        cuadro: function (t) { var s = sombra(t), dd = Math.hypot(s[0], s[1]); E.brilloEstrellas = 1 + 1.2 * U.clamp((UMBRA - dd) / 1.5, 0, 1); },
        puntos: function (ctx, t) {
          var P = E.P, rT = E.radioPunto(), s = sombra(t), sx = E.cx + s[0] * E.R, sy = E.cy - s[1] * E.R;
          var caminos = []; for (var k = 0; k < 16; k++) caminos.push(new Path2D());
          for (var i = 0; i < NL; i++) {
            var z = P.lz[i]; if (z <= 0.02) continue;
            var x = P.lx[i], y = P.ly[i], d = Math.hypot(x - sx, y - sy) / E.R;
            var zona = d < UMBRA - 0.25 ? 2 : d < UMBRA + 0.1 ? 1 : 0;   // 0 luz/penumbra, 1 borde de la umbra, 2 umbra
            var pen = d < PENUMBRA ? 1 - (d - UMBRA) / (PENUMBRA - UMBRA) : 0;
            if (zona === 0 && pen > 0.5) zona = 3;                        // penumbra profunda
            var r = rT * (0.7 + 0.12 * NIV[i]) * (0.75 + 0.25 * z);
            caminos[zona * 4 + NIV[i]].moveTo(x + r, y); caminos[zona * 4 + NIV[i]].arc(x, y, r, 0, TAU);
          }
          for (var nv = 0; nv < 4; nv++) {
            ctx.fillStyle = U.rgba(C.luna, A_L[nv]); ctx.fill(caminos[nv]);
            ctx.fillStyle = U.rgba(U.mezcla(C.luna, COBRE, 0.55), A_L[nv] * 0.7); ctx.fill(caminos[4 + nv]);
            ctx.fillStyle = U.rgba(U.mezcla(OSCURO, COBRE, nv / 3), 0.45 + 0.4 * nv / 3); ctx.fill(caminos[8 + nv]);
            ctx.fillStyle = U.rgba(C.luna, A_L[nv] * 0.55); ctx.fill(caminos[12 + nv]);
          }
        },
        frente: function (ctx, t) {
          // el borde de la sombra de la Tierra, apenas insinuado
          var a = U.meseta(t, 1200, 2400, 12800 + L, 14200 + L); if (a <= 0) return;
          var s = sombra(t), sx = E.cx + s[0] * E.R, sy = E.cy - s[1] * E.R;
          ctx.setLineDash([2, 6]); ctx.strokeStyle = U.rgba(COBRE, 0.35 * a); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(sx, sy, UMBRA * E.R, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
          FX.texto('SOMBRA DE LA TIERRA', sx, sy - UMBRA * E.R - 12, { tam: 10.5, alin: 'center', a: 0.55 * a, color: COBRE, espaciado: 2 });
        }
      };
    }
  });
})();
