/* 01 · Null Island — clic en 0° 0°.
   Los datos «perdidos» de todo el mundo vuelan hacia el cero y forman una isla alrededor de la boya. */
(function () {
  'use strict';
  var TI = window.TI, U = TI.util, G = TI.geo, FX = TI.fx, C = TI.color, TAU = Math.PI * 2;

  TI.registrar({
    id: 'null-island', n: 1, nombre: 'Null Island', tipo: 'Lugar',
    pista: 'Cero y cero. Allí van a parar los datos que nadie supo situar.',
    lugar: [0, 0], radioSenal: 14,
    detectar: function (api) {
      api.en('clic', function (d) { if (api.motor.cercaDe(d, 0, 0, 1.8, 12)) api.disparar(); });
    },
    escena: function (E) {
      var L = E.lectura;   // tiempo extra para leer la tarjeta (motor.js)
      var r = U.azar(101), N = 190, part = [], centro = G.vec(0, 0);
      for (var i = 0; i < N; i++) {
        var k = Math.floor(r() * E.tierra.n), o = [E.tierra.xyz[k * 3], E.tierra.xyz[k * 3 + 1], E.tierra.xyz[k * 3 + 2]];
        var a = r() * TAU, rad = Math.sqrt(r()) * 2.3 * (1 + 0.3 * Math.sin(3 * a + 1.3) + 0.16 * Math.sin(5 * a + 0.4));
        var d = G.vec(Math.sin(a) * rad * 0.75, Math.cos(a) * rad * 1.2);
        var ang = Math.acos(U.clamp(o[0] * d[0] + o[1] * d[1] + o[2] * d[2], -1, 1));
        part.push({ o: o, d: d, t0: 1000 + r() * 2600, dur: 1200 + ang * 520, alto: 0.06 + ang * 0.1 });
      }
      var q = [0, 0, 0, 0], q2 = [0, 0, 0, 0];
      return {
        duracion: 11500 + L,
        tarjeta: {
          en: 4300, hasta: 10400 + L,
          titulo: 'Null Island',
          texto: 'La isla que no existe. Cuando un mapa no sabe dónde poner un dato, lo deja en 0° 0°, y aquí se amontona todo lo que se perdió por el camino. En el sitio de verdad solo hay una boya meteorológica.',
          pie: '0°00′ N · 0°00′ E · Golfo de Guinea'
        },
        inicio: function () { E.camara(0, 0, 1.75, 1800, 0.06); },
        puntos: function (ctx, t) {
          E.dibujarPuntos({ alfa: 1 - 0.3 * U.meseta(t, 600, 1800, 9000 + L, 10800 + L) });
          // el ecuador y el meridiano de Greenwich se cruzan aquí
          var g = U.sale(U.tramo(t, 300, 2200)), sal = 1 - U.tramo(t, 9600 + L, 11000 + L);
          ctx.setLineDash([2, 5]); ctx.lineWidth = 1; ctx.strokeStyle = U.rgba(C.acento, 0.4 * sal);
          ctx.beginPath(); FX.circulo([0, 1, 0], 90, g, 240, Math.PI); ctx.stroke();
          ctx.beginPath(); FX.circulo([1, 0, 0], 90, g, 240, Math.PI / 2); ctx.stroke();
          ctx.setLineDash([]);
        },
        frente: function (ctx, t) {
          var sal = 1 - U.tramo(t, 9300 + L, 11000 + L), llegados = 0;
          // estelas y cabezas de los datos en vuelo
          ctx.lineWidth = 1; ctx.strokeStyle = U.rgba(C.acento, 0.32 * sal); ctx.beginPath();
          var cabezas = [], quietos = [];
          for (var i = 0; i < part.length; i++) {
            var p = part[i], u = (t - p.t0) / p.dur;
            if (u <= 0) continue;
            if (u >= 1) { E.proy(p.d, q); if (q[2] > 0) quietos.push(q[0], q[1]); llegados++; continue; }
            var e = U.inOut(u), dentro = false;
            for (var s = 0; s <= 6; s++) {
              var uu = Math.max(0, e - s * 0.035);
              FX.puntoArco(p.o, p.d, p.alto, uu, q2);
              if (E.visible(q2)) { if (!dentro) { ctx.moveTo(q2[0], q2[1]); dentro = true; } else ctx.lineTo(q2[0], q2[1]); } else dentro = false;
            }
            FX.puntoArco(p.o, p.d, p.alto, e, q); if (E.visible(q)) cabezas.push(q[0], q[1]);
          }
          ctx.stroke();
          ctx.fillStyle = U.rgba(C.acento, sal); ctx.beginPath();
          for (var j = 0; j < cabezas.length; j += 2) { ctx.moveTo(cabezas[j] + 1.9, cabezas[j + 1]); ctx.arc(cabezas[j], cabezas[j + 1], 1.9, 0, TAU); }
          ctx.fill();
          // la isla: brillo y puntos asentados
          E.proy(centro, q);
          var isla = llegados / part.length;
          FX.brillo(q[0], q[1], 26 + 40 * isla * E.zoom, C.acento, 0.22 * isla * sal);
          var rq = TI.motor.radioPunto() * 1.15;
          ctx.fillStyle = U.rgba(C.acento, 0.95 * sal); ctx.beginPath();
          for (var k = 0; k < quietos.length; k += 2) { ctx.moveTo(quietos[k] + rq, quietos[k + 1]); ctx.arc(quietos[k], quietos[k + 1], rq, 0, TAU); }
          ctx.fill();
          // la boya
          var b = U.sale(U.tramo(t, 1300, 2200)) * sal;
          if (b > 0) {
            var x = q[0], y = q[1], alto = 18 * b;
            ctx.strokeStyle = U.rgba(C.hueso, 0.9 * b); ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - alto); ctx.stroke();
            ctx.fillStyle = U.rgba(C.hueso, 0.9 * b); ctx.beginPath(); ctx.ellipse(x, y, 5, 2, 0, 0, TAU); ctx.fill();
            var luz = (Math.sin(t * 0.0065) > 0.55 ? 1 : 0.25) * b;
            FX.brillo(x, y - alto, 16, C.acento, 0.6 * luz);
            ctx.fillStyle = U.rgba(C.acento, luz); ctx.beginPath(); ctx.arc(x, y - alto, 2.2, 0, TAU); ctx.fill();
            var et = U.tramo(t, 2400, 3200) * sal;
            if (et > 0) {
              ctx.strokeStyle = U.rgba(C.hueso, 0.35 * et); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 6, y - alto); ctx.lineTo(x + 40, y - alto - 22); ctx.lineTo(x + 52, y - alto - 22); ctx.stroke();
              FX.texto('BOYA 13010 «SOUL»', x + 58, y - alto - 22, { tam: 11, a: 0.85 * et, espaciado: 1 });
              FX.texto('datos sin lugar: ' + U.num(llegados), x + 58, y - alto - 6, { tam: 10.5, a: 0.5 * et, color: C.acento, espaciado: 0.6 });
            }
          }
        }
      };
    }
  });
})();
