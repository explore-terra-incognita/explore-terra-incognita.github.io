/* 06 · Vértigo — hacer girar el globo muy deprisa (más de dos vueltas en dos segundos).
   La Tierra acelera hasta ser un torbellino de estelas, se achata por el ecuador como de verdad, frena y se tambalea. */
(function () {
  'use strict';
  var TI = window.TI, U = TI.util, G = TI.geo, FX = TI.fx, C = TI.color, TAU = Math.PI * 2;
  var UMBRAL = 1.6 * TAU, DIA = 86164;   // día sidéreo, en segundos

  TI.registrar({
    id: 'vertigo', n: 6, nombre: 'Vértigo', tipo: 'Gesto',
    pista: 'Hazlo girar más deprisa de lo que debería.',
    detectar: function (api) {
      api.en('cuadro', function (d) { if (d.giro2s > UMBRAL) api.disparar({ vueltas: d.giro2s / TAU }); });
    },
    escena: function (E, datos) {
      var L = E.lectura;   // tiempo extra para leer la tarjeta (motor.js)
      var vueltas = (datos && datos.vueltas) || 2.4, giro = 0, vel = 0, maxVel = 0, rotBase = null, dias = 0;
      var q = [0, 0, 0, 0], T = E.tierra.xyz, NT = E.tierra.n;
      function velocidad(t) {   // rad/s
        if (t < 3600) return U.lerp(4, 70, U.entra(t / 3600));
        if (t < 6200) return 70;
        return 70 * Math.pow(1 - U.tramo(t, 6200, 9400), 2.2);
      }
      function achatado(t) { return 0.2 * U.meseta(t, 2600, 4400, 6200, 8600); }
      function bamboleo(t) { return 0.14 * Math.sin((t - 8000) * 0.009) * U.meseta(t, 8000, 8600, 9200, 11000); }
      return {
        duracion: 11500 + L,
        tarjeta: {
          en: 4000, hasta: 10400 + L,
          titulo: 'Vértigo',
          texto: function () {
            return 'La Tierra de verdad tarda 23 h 56 min en dar una vuelta, y aun así se achata: el ecuador sobresale 21 km más que los polos. ' +
              'A ' + U.num(maxVel / TAU, 0) + ' vueltas por segundo, sería un plato.';
          },
          pie: function () { return 'Tu giro: ' + U.num(vueltas, 1) + ' vueltas en 2 s · un día cada ' + U.num(TAU / Math.max(1, maxVel), 2) + ' s'; }
        },
        inicio: function () { var c = E.centro(); E.camara(22, c[1], 1.05, 1300); },
        cuadro: function (t, dt) {
          if (t > 1300 && !rotBase) rotBase = E.rot.slice();
          vel = velocidad(t); maxVel = Math.max(maxVel, vel);
          giro += vel * dt / 1000; dias = giro / TAU;
          if (rotBase) {
            var b = bamboleo(t);
            E.rot = TI.mat.mul(TI.mat.mul(TI.mat.eje(0, 0, 1, b), rotBase), TI.mat.eje(0, 1, 0, giro));
          }
          E.brilloEstrellas = 1 - 0.6 * U.meseta(t, 2000, 3600, 6200, 8600);
        },
        fondo: function (ctx, t) {
          // el día y la noche pasan como un estroboscopio
          var a = U.meseta(t, 2200, 3600, 6200, 8200);
          if (a > 0) { var luz = 0.5 + 0.5 * Math.sin(giro); FX.brillo(E.cx - E.R * 1.1, E.cy - E.R * 0.4, E.R * 2.4, C.hueso, 0.06 * a * luz); }
        },
        puntos: function (ctx, t) {
          var k = achatado(t), m = E.rot, R = E.R, cx = E.cx, cy = E.cy, rT = E.radioPunto();
          var estela = U.clamp(vel / 70, 0, 1) * 2.4, pasos = estela > 0.05 ? 7 : 0;
          var sx = 1 + k, sy = 1 - k * 0.6;
          if (t < 1300 || t > 10200) { E.dibujarPuntos(); return; }
          // cada punto deja su estela a lo largo de su paralelo
          var cubos = [new Path2D(), new Path2D(), new Path2D()], puntos = [new Path2D(), new Path2D(), new Path2D()];
          for (var i = 0; i < NT; i++) {
            var x = T[i * 3] * sx, y = T[i * 3 + 1] * sy, z = T[i * 3 + 2] * sx;
            var vz = m[6] * x + m[7] * y + m[8] * z; if (vz < 0.02) continue;
            var b = vz > 0.66 ? 2 : vz > 0.33 ? 1 : 0, px0 = cx + (m[0] * x + m[1] * y + m[2] * z) * R, py0 = cy - (m[3] * x + m[4] * y + m[5] * z) * R;
            puntos[b].moveTo(px0 + rT, py0); puntos[b].arc(px0, py0, rT, 0, TAU);
            if (!pasos) continue;
            cubos[b].moveTo(px0, py0);
            for (var s = 1; s <= pasos; s++) {
              var ang = -estela * s / pasos, c = Math.cos(ang), sn = Math.sin(ang), xr = c * x + sn * z, zr = -sn * x + c * z;
              if (m[6] * xr + m[7] * y + m[8] * zr < 0) break;   // la estela se esconde por detrás
              cubos[b].lineTo(cx + (m[0] * xr + m[1] * y + m[2] * zr) * R, cy - (m[3] * xr + m[4] * y + m[5] * zr) * R);
            }
          }
          var al = [0.08, 0.15, 0.24];
          ctx.lineWidth = rT * 1.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          for (var j = 0; j < 3; j++) {
            if (pasos) { ctx.strokeStyle = U.rgba(C.hueso, al[j] * Math.min(1, estela * 1.5)); ctx.stroke(cubos[j]); }
            ctx.fillStyle = U.rgba(C.hueso, [0.35, 0.6, 0.92][j]); ctx.fill(puntos[j]);
          }
          // el ecuador, que se ensancha
          if (k > 0.01) {
            ctx.strokeStyle = U.rgba(C.acento, 0.6 * k / 0.2); ctx.lineWidth = 1; ctx.beginPath();
            var dentro = false;
            for (var e = 0; e <= 180; e++) {
              var a2 = e / 180 * TAU, ex = Math.sin(a2) * sx, ez = Math.cos(a2) * sx;
              var ezv = m[6] * ex + m[8] * ez;
              if (ezv > 0) { var X = cx + (m[0] * ex + m[2] * ez) * R, Y = cy - (m[3] * ex + m[5] * ez) * R; if (!dentro) { ctx.moveTo(X, Y); dentro = true; } else ctx.lineTo(X, Y); } else dentro = false;
            }
            ctx.stroke();
          }
        },
        frente: function (ctx, t) {
          var a = U.meseta(t, 1500, 2200, 9200, 10200);
          if (a <= 0) return;
          FX.texto('DÍA ' + U.num(Math.floor(dias)), E.cx, E.cy - E.R * 1.22, { tam: 13, a: 0.9 * a, alin: 'center', espaciado: 2, peso: 600, color: C.acento });
          FX.texto('1 día = ' + U.num(vel > 0.5 ? TAU / vel : 0, 2) + ' s', E.cx, E.cy - E.R * 1.22 + 20, { tam: 11, a: 0.6 * a, alin: 'center', espaciado: 1 });
        },
        vuelta: { zoom: 1 }
      };
    }
  });
})();
