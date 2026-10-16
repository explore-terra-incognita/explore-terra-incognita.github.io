/* 05 · Antípodas — doble clic marca un punto A; su antípoda B queda marcada al otro lado del mundo.
   Al girar el globo y hacer clic en B, el globo se vuelve transparente y una luz lo atraviesa por el núcleo. */
(function () {
  'use strict';
  var TI = window.TI, U = TI.util, G = TI.geo, FX = TI.fx, C = TI.color, TAU = Math.PI * 2;
  var DIAMETRO = 12742;

  TI.registrar({
    id: 'antipodas', n: 5, nombre: 'Antípodas', tipo: 'Gesto',
    pista: 'Marca un punto con dos clics… y búscalo al otro lado del mundo.',
    detectar: function (api) {
      var E = api.motor, marca = null, q = [0, 0, 0, 0], qa = [0, 0, 0, 0];
      api.en('dobleclic', function (d) {
        if (!d.dentro) return;
        marca = { a: [d.lat, d.lon], b: G.antipoda(d.lat, d.lon), t0: E.t };
      });
      api.en('clic', function (d) {
        if (!marca || E.t - marca.t0 < 400) return;
        if (E.cercaDe(d, marca.b[0], marca.b[1], 4, 18)) { var m = marca; marca = null; api.disparar({ a: m.a, b: m.b }); }
      });
      api.en('tecla', function (d) { if (d.key === 'Escape') marca = null; });
      api.capa(function (ctx, t) {
        if (!marca) return;
        if (t - marca.t0 > 120000) { marca = null; return; }
        var ent = U.sale(U.tramo(t, marca.t0, marca.t0 + 600));
        E.proyLL(marca.a[0], marca.a[1], qa);
        if (qa[2] > 0) {
          ctx.strokeStyle = U.rgba(C.acento, 0.9 * ent); ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.arc(qa[0], qa[1], 7, 0, TAU); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(qa[0] - 12, qa[1]); ctx.lineTo(qa[0] - 4, qa[1]); ctx.moveTo(qa[0] + 4, qa[1]); ctx.lineTo(qa[0] + 12, qa[1]); ctx.moveTo(qa[0], qa[1] - 12); ctx.lineTo(qa[0], qa[1] - 4); ctx.moveTo(qa[0], qa[1] + 4); ctx.lineTo(qa[0], qa[1] + 12); ctx.stroke();
          FX.texto('A', qa[0] + 12, qa[1] - 12, { tam: 11, a: ent, color: C.acento });
          FX.texto('BUSCA SU ANTÍPODA · ' + G.texto(marca.b[0], marca.b[1]), qa[0] + 12, qa[1] + 16, { tam: 10.5, a: 0.75 * ent, espaciado: 0.5 });
        }
        E.proyLL(marca.b[0], marca.b[1], q);
        if (q[2] > 0) {
          FX.ondas(q[0], q[1], 4, 22, 3, t / 1600, C.acento, 0.7, 1);
          ctx.fillStyle = U.rgba(C.acento, 0.95); ctx.beginPath(); ctx.arc(q[0], q[1], 2.6, 0, TAU); ctx.fill();
          FX.texto('B', q[0] + 12, q[1] - 12, { tam: 11, a: 1, color: C.acento });
        } else {
          // detrás: una flecha en el borde indica hacia dónde girar
          var dx = q[0] - E.cx, dy = q[1] - E.cy, l = Math.hypot(dx, dy);
          if (l > 1) {
            var ux = dx / l, uy = dy / l, x = E.cx + ux * (E.R + 16), y = E.cy + uy * (E.R + 16), pul = 0.55 + 0.45 * Math.sin(t * 0.006);
            ctx.fillStyle = U.rgba(C.acento, pul); ctx.beginPath();
            ctx.moveTo(x + ux * 8, y + uy * 8); ctx.lineTo(x - uy * 5, y + ux * 5); ctx.lineTo(x + uy * 5, y - ux * 5); ctx.closePath(); ctx.fill();
            FX.texto('B', x + ux * 20, y + uy * 20, { tam: 11, a: pul, color: C.acento, alin: 'center' });
          }
        }
      });
    },
    escena: function (E, datos) {
      var L = E.lectura;   // tiempo extra para leer la tarjeta (motor.js)
      var A = (datos && datos.a) || [40.4168, -3.7038], B = (datos && datos.b) || G.antipoda(A[0], A[1]);
      var va = G.vec(A[0], A[1]), vb = G.vec(B[0], B[1]);
      // una vista en la que A y B quedan a izquierda y derecha, un poco girada para que se vea el volumen
      var ref = Math.abs(va[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
      var cx = [va[1] * ref[2] - va[2] * ref[1], va[2] * ref[0] - va[0] * ref[2], va[0] * ref[1] - va[1] * ref[0]], lc = Math.hypot(cx[0], cx[1], cx[2]);
      var cll = G.latlon(cx[0] / lc, cx[1] / lc, cx[2] / lc);
      var M = TI.mat.mirando(cll[0], cll[1]);
      var ax = M[0] * va[0] + M[1] * va[1] + M[2] * va[2], ay = M[3] * va[0] + M[4] * va[1] + M[5] * va[2];
      M = TI.mat.mul(TI.mat.eje(0, 0, 1, Math.PI - Math.atan2(ay, ax)), M);
      M = TI.mat.mul(TI.mat.eje(1, 0, 0, 0.32), TI.mat.mul(TI.mat.eje(0, 1, 0, 0.42), M));
      var tierraB = G.esTierra(B[0], B[1]), tierraA = G.esTierra(A[0], A[1]);
      var pct = U.num(window.TI_DATOS.antipodas * 100, 1);
      var qa = [0, 0, 0, 0], qb = [0, 0, 0, 0];
      return {
        duracion: 11500 + L,
        tarjeta: {
          en: 5000, hasta: 10600 + L,
          titulo: 'Antípodas',
          texto: 'Has atravesado la Tierra: ' + U.num(DIAMETRO) + ' km en línea recta, pasando por el núcleo. ' +
            (tierraB ? 'Tu antípoda cae en tierra firme, cosa rara: ' : 'Tu antípoda cae en el mar, como casi siempre: ') +
            'según estos puntos, solo el ' + pct + ' % de la tierra tiene tierra al otro lado.',
          pie: 'A ' + G.gms(A[0], A[1]) + '  →  B ' + G.gms(B[0], B[1])
        },
        inicio: function () { E.camaraM(M, 1.05, 2000); },
        puntos: function (ctx, t) {
          var x = U.meseta(t, 1400, 2400, 9600 + L, 11200 + L);
          E.dibujarPuntos({ alfa: 1 - 0.45 * x, dorso: 0.22 * x });
          // capas de la Tierra (a escala): manto, núcleo externo, núcleo interno
          if (x > 0) {
            ctx.lineWidth = 1;
            [[3480, 'NÚCLEO EXTERNO'], [1221, 'NÚCLEO INTERNO']].forEach(function (c, i) {
              var r = E.R * c[0] / 6371;
              ctx.strokeStyle = U.rgba(C.hueso, (0.18 + i * 0.1) * x); ctx.setLineDash([2, 4]); ctx.beginPath(); ctx.arc(E.cx, E.cy, r, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
              FX.texto(c[1], E.cx, E.cy + r + 12, { tam: 10, a: 0.45 * x, alin: 'center', espaciado: 1 });
            });
            FX.brillo(E.cx, E.cy, E.R * 0.22, [255, 190, 120], 0.25 * x);
          }
        },
        frente: function (ctx, t) {
          var sal = 1 - U.tramo(t, 9800 + L, 11300 + L);
          E.proy(va, qa); E.proy(vb, qb);
          var ent = U.tramo(t, 1500, 2100) * sal;
          FX.marca(qa[0], qa[1], 'A', ent, C.acento, 'izq');
          // el rayo: de A a B por el centro
          var f = U.inOut(U.tramo(t, 2600, 4800));
          if (f > 0) {
            var hx = U.lerp(qa[0], qb[0], f), hy = U.lerp(qa[1], qb[1], f);
            ctx.lineCap = 'round';
            ctx.strokeStyle = U.rgba(C.acento, 0.15 * sal); ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(qa[0], qa[1]); ctx.lineTo(hx, hy); ctx.stroke();
            ctx.strokeStyle = U.rgba(C.acento, 0.9 * sal); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(qa[0], qa[1]); ctx.lineTo(hx, hy); ctx.stroke();
            if (f < 1) { FX.brillo(hx, hy, 22, C.acento, 0.8); }
            var km = Math.round(DIAMETRO * f);
            FX.texto(U.num(km) + ' km', hx, hy - 18, { tam: 12, a: (f < 1 ? 1 : 0.8) * sal, color: C.acento, alin: 'center', espaciado: 0.8, peso: 600 });
          }
          if (f >= 1) {
            var g = U.tramo(t, 4800, 6000);
            FX.ondas(qb[0], qb[1], 3, 40, 3, g * 1.5, C.acento, 0.8 * sal, 1.2);
            FX.marca(qb[0], qb[1], 'B · ' + (tierraB ? 'TIERRA' : 'MAR'), sal, C.acento, 'der');
            FX.texto(tierraA ? 'TIERRA' : 'MAR', qa[0] - 12, qa[1] + 15, { tam: 10.5, a: 0.6 * sal, alin: 'right', espaciado: 0.6 });
          }
        }
      };
    }
  });
})();
