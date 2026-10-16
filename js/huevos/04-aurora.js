/* 04 · Aurora — mirar el mundo desde un polo durante un momento.
   Se enciende el óvalo de la aurora alrededor del polo geomagnético: cortinas verdes que ondean, con la cresta violeta. */
(function () {
  'use strict';
  var TI = window.TI, U = TI.util, G = TI.geo, FX = TI.fx, C = TI.color, TAU = Math.PI * 2, D2R = Math.PI / 180;
  var POLOS = { norte: [80.7, -72.7], sur: [-80.7, 107.3] };   // polos geomagnéticos (dipolo), aprox.
  var VERDE = [92, 255, 170], TURQ = [70, 220, 210], VIOLETA = [190, 120, 255];
  var ESPERA = 1400;

  TI.registrar({
    id: 'aurora', n: 4, nombre: 'Aurora', tipo: 'Mirada',
    pista: 'Asómate al mundo desde arriba y quédate quieto hasta que se encienda el cielo.',
    detectar: function (api) {
      var E = api.motor, carga = 0, polo = 'norte', armado = true;   // tras dispararse, hay que salir del polo para volver a armarlo
      api.en('cuadro', function (d) {
        var m = E.rot, lat = Math.asin(U.clamp(m[7], -1, 1)) * 180 / Math.PI;   // latitud del centro de la vista
        if (Math.abs(lat) < 60) armado = true;
        if (armado && Math.abs(lat) > 68 && !E.arrastre) { carga += d.dt; polo = lat > 0 ? 'norte' : 'sur'; }
        else carga = Math.max(0, carga - d.dt * 2);
        if (carga > ESPERA) { carga = 0; armado = false; api.disparar({ polo: polo }); }
      });
      // mientras se espera, el óvalo empieza a parpadear
      api.capa(function (ctx, t) {
        if (carga < 200) return;
        var p = POLOS[polo], a = U.tramo(carga, 200, ESPERA) * (0.5 + 0.5 * Math.sin(t * 0.02));
        ctx.strokeStyle = U.rgba(VERDE, 0.35 * a); ctx.lineWidth = 2; ctx.beginPath(); FX.circulo(G.vec(p[0], p[1]), 21, 1, 140); ctx.stroke();
      });
    },
    escena: function (E, datos) {
      var L = E.lectura;   // tiempo extra para leer la tarjeta (motor.js)
      var polo = (datos && datos.polo) || 'norte', P = POLOS[polo], sur = polo === 'sur';
      var c = G.vec(P[0], P[1]), e = Math.abs(c[1]) > 0.99 ? [1, 0, 0] : [c[2], 0, -c[0]], le = Math.hypot(e[0], e[1], e[2]); e = [e[0] / le, e[1] / le, e[2] / le];
      var nn = [c[1] * e[2] - c[2] * e[1], c[2] * e[0] - c[0] * e[2], c[0] * e[1] - c[1] * e[0]];
      var N = 360, base = [0, 0, 0, 0], top = [0, 0, 0, 0], mid = [0, 0, 0, 0], v = [0, 0, 0];
      var caminos = []; for (var i = 0; i < 9; i++) caminos.push(new Path2D());
      function punto(phi, col, o) {
        var cr = Math.cos(col * D2R), sr = Math.sin(col * D2R), ca = Math.cos(phi), sa = Math.sin(phi);
        o[0] = c[0] * cr + (e[0] * ca + nn[0] * sa) * sr; o[1] = c[1] * cr + (e[1] * ca + nn[1] * sa) * sr; o[2] = c[2] * cr + (e[2] * ca + nn[2] * sa) * sr;
        return o;
      }
      return {
        duracion: 12500 + L,
        atmosfera: 0.6,
        tarjeta: {
          en: 4200, hasta: 11000 + L,
          titulo: sur ? 'Aurora austral' : 'Aurora boreal',
          texto: 'El viento solar choca con el oxígeno del aire a más de 100 km de altura y lo hace brillar en verde. Por eso la aurora dibuja un anillo alrededor del polo geomagnético, no del polo geográfico.',
          pie: 'Polo geomagnético ' + (sur ? 'sur' : 'norte') + ' · ' + G.gms(P[0], P[1]) + ' (aprox.)'
        },
        // el polo, alto y de lado: así las cortinas se levantan sobre el horizonte
        inicio: function () { E.camara(sur ? -38 : 38, P[1] + (sur ? -15 : -20), 1.3, 2200, 0, null, sur ? -E.H * 0.06 : E.H * 0.1); },
        cuadro: function (t) { E.brilloEstrellas = 1 + 0.8 * U.meseta(t, 800, 2400, 10500 + L, 12400 + L); },
        puntos: function (ctx, t) { E.dibujarPuntos({ alfa: 1 - 0.35 * U.meseta(t, 600, 2000, 10500 + L, 12400 + L) }); },
        frente: function (ctx, t) {
          var a = U.meseta(t, 1200, 3400, 9800 + L, 12300 + L); if (a <= 0) return;
          for (var k = 0; k < 9; k++) caminos[k] = new Path2D();
          var tt = t * 0.001;
          for (var j = 0; j < N; j++) {
            var phi = j / N * TAU;
            var col = 21 + 2.6 * Math.sin(3 * phi + tt * 0.7) + 1.4 * Math.sin(7 * phi - tt * 1.1) + 0.7 * Math.sin(13 * phi + tt * 2.3);
            var h = (0.06 + 0.06 * (0.5 + 0.5 * Math.sin(5 * phi - tt * 1.6)) + 0.02 * Math.sin(11 * phi + tt * 2.9)) * (0.4 + 0.6 * a);
            var inten = 0.5 + 0.5 * Math.sin(phi * 4 + tt * 1.9) * Math.sin(phi * 2.3 - tt * 1.3);
            punto(phi, col, v);
            E.proy(v, base); E.proy(v, mid, h * 0.45); E.proy(v, top, h);
            if (!(base[2] > -0.05 || top[3] > 1)) continue;
            var b = inten > 0.66 ? 2 : inten > 0.33 ? 1 : 0;
            caminos[b * 3].moveTo(base[0], base[1]); caminos[b * 3].lineTo(mid[0], mid[1]);
            caminos[b * 3 + 1].moveTo(mid[0], mid[1]); caminos[b * 3 + 1].lineTo(top[0], top[1]);
            caminos[b * 3 + 2].moveTo(base[0], base[1]); caminos[b * 3 + 2].lineTo(base[0] + 0.01, base[1]);
          }
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
          var fuerza = [0.25, 0.5, 0.85];
          for (var b2 = 0; b2 < 3; b2++) {
            var f = fuerza[b2] * a;
            ctx.lineWidth = 9; ctx.strokeStyle = U.rgba(VERDE, 0.07 * f); ctx.stroke(caminos[b2 * 3]);
            ctx.lineWidth = 2.4; ctx.strokeStyle = U.rgba(VERDE, 0.4 * f); ctx.stroke(caminos[b2 * 3]);
            ctx.lineWidth = 8; ctx.strokeStyle = U.rgba(VIOLETA, 0.07 * f); ctx.stroke(caminos[b2 * 3 + 1]);
            ctx.lineWidth = 1.8; ctx.strokeStyle = U.rgba(TURQ, 0.2 * f); ctx.stroke(caminos[b2 * 3 + 1]);
            ctx.lineWidth = 3; ctx.strokeStyle = U.rgba(VERDE, 0.5 * f); ctx.stroke(caminos[b2 * 3 + 2]);
          }
          ctx.restore();
          // el polo geomagnético
          E.proy(c, base);
          if (base[2] > 0) { var m = U.tramo(t, 3000, 3800) * (1 - U.tramo(t, 10500 + L, 12000 + L)); FX.marca(base[0], base[1], 'POLO GEOMAGNÉTICO', m * 0.85, C.hueso); }
        }
      };
    }
  });
})();
