/* 03 · Punto Nemo — clic en el polo de inaccesibilidad del Pacífico.
   Tres líneas hasta las tres orillas más cercanas (a la misma distancia), el círculo vacío,
   chatarra espacial que cae y la Estación Espacial pasando por encima. */
(function () {
  'use strict';
  var TI = window.TI, U = TI.util, G = TI.geo, FX = TI.fx, C = TI.color, TAU = Math.PI * 2, D2R = Math.PI / 180;
  var NEMO = [-48.8767, -123.3933];
  var ORILLAS = [['ISLA DUCIE', -24.6667, -124.7833], ['MOTU NUI', -27.2025, -109.4544], ['ISLA MAHER', -72.9667, -126.3667]];
  var FUEGO = [255, 168, 92];

  TI.registrar({
    id: 'punto-nemo', n: 3, nombre: 'Punto Nemo', tipo: 'Lugar',
    pista: 'El punto del mar más lejano de cualquier orilla. Allí solo llega la chatarra que cae del cielo.',
    lugar: NEMO, radioSenal: 18,
    detectar: function (api) {
      api.en('clic', function (d) { if (api.motor.cercaDe(d, NEMO[0], NEMO[1], 3, 14)) api.disparar(); });
    },
    escena: function (E) {
      var L = E.lectura;   // tiempo extra para leer la tarjeta (motor.js)
      var n = G.vec(NEMO[0], NEMO[1]), r = U.azar(303);
      var orillas = ORILLAS.map(function (o) { return { nombre: o[0], v: G.vec(o[1], o[2]), km: G.dist(NEMO[0], NEMO[1], o[1], o[2]) * G.KM_GRADO }; });
      var radio = orillas.reduce(function (s, o) { return s + o.km; }, 0) / orillas.length / G.KM_GRADO;
      // la órbita de la Estación Espacial (inclinación 51,6°) que pasa justo por encima de Nemo
      var e = [n[2], 0, -n[0]], le = Math.hypot(e[0], e[2]); e = [e[0] / le, 0, e[2] / le];
      var u = [n[1] * e[2] - n[2] * e[1], n[2] * e[0] - n[0] * e[2], n[0] * e[1] - n[1] * e[0]];
      var sb = U.clamp(Math.cos(51.6 * D2R) / Math.cos(NEMO[0] * D2R), -1, 1), cb = Math.sqrt(1 - sb * sb);
      var nor = [cb * e[0] + sb * u[0], cb * e[1] + sb * u[1], cb * e[2] + sb * u[2]];
      var dir = [nor[1] * n[2] - nor[2] * n[1], nor[2] * n[0] - nor[0] * n[2], nor[0] * n[1] - nor[1] * n[0]];
      var ALT = 408 / G.RADIO_KM;
      function orbita(phi) { var c = Math.cos(phi), s = Math.sin(phi); return [n[0] * c + dir[0] * s, n[1] * c + dir[1] * s, n[2] * c + dir[2] * s]; }
      var caidas = [];
      for (var i = 0; i < 9; i++) caidas.push({ t0: 3300 + i * 520 + r() * 260, dur: 900 + r() * 500, x: 0.7 + r() * 0.9, y: -0.2 - r() * 0.5, off: [(r() - 0.5) * 2.5, (r() - 0.5) * 2.5] });
      var q = [0, 0, 0, 0], q2 = [0, 0, 0, 0];
      return {
        duracion: 12500 + L,
        tarjeta: {
          en: 4600, hasta: 11000 + L,
          titulo: 'Punto Nemo',
          texto: 'El lugar del océano más lejos de cualquier tierra: ' + U.num(Math.round(radio * G.KM_GRADO)) + ' km hasta la orilla más cercana. Es el cementerio de las naves espaciales. Y cuando la Estación Espacial pasa por encima, a unos 400 km, las personas más cercanas están allí arriba.',
          pie: '48°53′ S · 123°24′ O · Pacífico Sur'
        },
        inicio: function () { E.camara(NEMO[0] + 4, NEMO[1], 1.3, 1900); },
        puntos: function (ctx, t) {
          E.dibujarPuntos({ alfa: 1 - 0.4 * U.meseta(t, 400, 1600, 10600 + L, 12300 + L) });
          var sal = 1 - U.tramo(t, 10600 + L, 12300 + L);
          // las tres orillas, a la misma distancia
          ctx.lineWidth = 1;
          orillas.forEach(function (o, i) {
            var f = U.inOut(U.tramo(t, 900 + i * 260, 2400 + i * 260)); if (f <= 0) return;
            ctx.setLineDash([3, 4]); ctx.strokeStyle = U.rgba(C.hueso, 0.55 * sal); ctx.beginPath(); FX.arco(n, o.v, 0, 0, f, 60); ctx.stroke(); ctx.setLineDash([]);
            if (f >= 1) {
              E.proy(o.v, q); if (q[2] > 0) {
                var a = U.tramo(t, 2400 + i * 260, 3000 + i * 260) * sal;
                FX.marca(q[0], q[1], o.nombre, a, C.hueso, q[0] < E.cx - E.R * 0.2 ? 'izq' : 'der');
                FX.texto(U.num(o.km) + ' km', q[0] + (q[0] < E.cx - E.R * 0.2 ? -12 : 12), q[1] + 14, { tam: 10.5, a: 0.55 * a, alin: q[0] < E.cx - E.R * 0.2 ? 'right' : 'left', espaciado: 0.6 });
              }
            }
          });
          // el círculo vacío: nadie más cerca
          var c = U.inOut(U.tramo(t, 2600, 4200));
          if (c > 0) { ctx.strokeStyle = U.rgba(C.acento, 0.5 * sal); ctx.lineWidth = 1.2; ctx.beginPath(); FX.circulo(n, radio, c, 200); ctx.stroke(); }
        },
        frente: function (ctx, t) {
          var sal = 1 - U.tramo(t, 10600 + L, 12300 + L);
          E.proy(n, q); var nx = q[0], ny = q[1];
          FX.ondas(nx, ny, 3, 26, 3, t / 2200, C.acento, 0.6 * sal, 1);
          ctx.fillStyle = U.rgba(C.acento, sal); ctx.beginPath(); ctx.arc(nx, ny, 2.6, 0, TAU); ctx.fill();
          // chatarra que reentra y cae aquí
          caidas.forEach(function (c) {
            var f = (t - c.t0) / c.dur; if (f < 0) return;
            var tx = nx + c.off[0] * 6, ty = ny + c.off[1] * 4;
            if (f < 1) {
              var sx = E.cx + E.R * c.x * 1.4, sy = E.cy + E.R * c.y * 2 - 120, e = U.entra(f);
              var hx = U.lerp(sx, tx, e), hy = U.lerp(sy, ty, e), cola = 0.16;
              var bx = U.lerp(sx, tx, Math.max(0, e - cola)), by = U.lerp(sy, ty, Math.max(0, e - cola));
              var g = ctx.createLinearGradient(bx, by, hx, hy); g.addColorStop(0, U.rgba(FUEGO, 0)); g.addColorStop(1, U.rgba(FUEGO, 0.9));
              ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(hx, hy); ctx.stroke();
              FX.brillo(hx, hy, 9, FUEGO, 0.7);
              ctx.fillStyle = 'rgba(255,245,225,0.95)'; ctx.beginPath(); ctx.arc(hx, hy, 1.6, 0, TAU); ctx.fill();
            } else if (f < 2.2) {
              var k = (f - 1) / 1.2;
              ctx.strokeStyle = U.rgba(FUEGO, 0.6 * (1 - k) * sal); ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(tx, ty, 3 + k * 16, (3 + k * 16) * 0.45, 0, 0, TAU); ctx.stroke();
            }
          });
          // la Estación Espacial
          var fi = (t - 6600) / 2600 * 0.9;
          if (t > 4200 && t < 11500 + L) {
            var a = U.meseta(t, 4200, 5000, 10600 + L, 11500 + L);
            ctx.lineWidth = 1; ctx.strokeStyle = U.rgba(C.hueso, 0.22 * a); ctx.beginPath();
            var dentro = false;
            for (var j = -60; j <= 60; j++) {
              E.proy(orbita(j * 0.02), q2, ALT);
              if (E.visible(q2)) { if (!dentro) { ctx.moveTo(q2[0], q2[1]); dentro = true; } else ctx.lineTo(q2[0], q2[1]); } else dentro = false;
            }
            ctx.stroke();
            E.proy(orbita(fi), q2, ALT);
            if (E.visible(q2)) {
              FX.brillo(q2[0], q2[1], 12, C.hueso, 0.5 * a);
              ctx.fillStyle = U.rgba(C.hueso, a); ctx.fillRect(q2[0] - 5, q2[1] - 0.8, 10, 1.6); ctx.fillRect(q2[0] - 1.2, q2[1] - 2.2, 2.4, 4.4);
              FX.texto('ISS', q2[0] + 10, q2[1] - 10, { tam: 10.5, a: 0.8 * a, espaciado: 1 });
            }
            // cuando pasa justo encima: la distancia vertical
            var cerca = U.meseta(fi, -0.12, -0.04, 0.04, 0.12) * a;
            if (cerca > 0) {
              E.proy(orbita(0), q2, ALT);
              ctx.setLineDash([2, 3]); ctx.strokeStyle = U.rgba(C.acento, 0.8 * cerca); ctx.beginPath(); ctx.moveTo(nx, ny); ctx.lineTo(q2[0], q2[1]); ctx.stroke(); ctx.setLineDash([]);
              FX.texto('≈ 400 km', (nx + q2[0]) / 2 + 10, (ny + q2[1]) / 2, { tam: 11, a: cerca, color: C.acento, espaciado: 0.6 });
            }
          }
        }
      };
    }
  });
})();
