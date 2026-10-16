/* Final de la Luna · Luna cognita — se lanza solo al encontrar los seis secretos lunares (y se puede volver a ver).
   Se encienden los lugares de las misiones, una ola cian recorre la Luna desde la Base Tranquilidad y el título pierde su «in». */
(function () {
  'use strict';
  var TI = window.TI, U = TI.util, G = TI.geo, FX = TI.fx, C = TI.color, TAU = Math.PI * 2;
  var LUGARES = [
    ['01', 'BASE TRANQUILIDAD', 0.674, 23.473], ['06', 'HADLEY', 26.13, 3.63],
    ['02', 'MAR DE MOSCÚ', 27.3, 147.9], ['02', 'TSIOLKOVSKI', -20.4, 129.1]
  ];
  function duracion(ms) {
    if (!isFinite(ms) || ms <= 0) return 'un momento';
    var min = Math.round(ms / 60000);
    if (min < 1) return 'menos de un minuto';
    if (min < 60) return min + (min === 1 ? ' minuto' : ' minutos');
    var h = Math.floor(min / 60), m = min % 60;
    if (h < 48) return h + ' h' + (m ? ' ' + m + ' min' : '');
    var d = Math.floor(h / 24); return d + ' días y ' + (h % 24) + ' h';
  }

  TI.registrarFinal({
    mundo: 'luna',
    escena: function (E, datos) {
      var n = (datos.huevos || []).length, raiz = document.documentElement, q = [0, 0, 0, 0];
      var pts = LUGARES.map(function (l, i) { return { n: l[0], nombre: l[1], v: G.vec(l[2], l[3]), t0: 1400 + i * 420 }; });
      var base = pts[0].v, X = E.luna.xyz, NL = E.luna.n, NIV = E.luna.nivel, DIST = new Float32Array(NL);
      for (var i = 0; i < NL; i++) DIST[i] = Math.acos(U.clamp(X[i * 3] * base[0] + X[i * 3 + 1] * base[1] + X[i * 3 + 2] * base[2], -1, 1));
      return {
        duracion: 16500,
        tarjeta: {
          en: 4200, hasta: 15200,
          etiqueta: 'Los ' + TI.interfaz.palabra(n) + ' secretos', titulo: 'Luna cognita',
          texto: 'Has visto la Luna por delante, por detrás y a oscuras. Lo has encontrado todo en ' + duracion(datos.hasta - datos.desde) + ', del primer secreto al último.',
          pie: 'Cuaderno lunar completo · ' + n + '/' + n
        },
        inicio: function () { raiz.classList.add('final-activo'); E.camara(10, 30, 1.0, 2200); },
        cuadro: function (t, dt) { if (t > 2200) E.girarPropio(dt * TAU / 26000); E.brilloEstrellas = 1 + 0.6 * U.meseta(t, 2000, 5000, 14000, 16400); if (t > 5200) raiz.classList.add('cognita'); },
        puntos: function (ctx, t) {
          var P = E.P, rT = E.radioPunto(), o1 = U.inOut(U.tramo(t, 4400, 7600)) * 3.3, o2 = U.inOut(U.tramo(t, 9000, 12600)) * 3.3;
          var plata = [new Path2D(), new Path2D(), new Path2D(), new Path2D()], cian = [new Path2D(), new Path2D()], cresta = new Path2D();
          for (var i = 0; i < NL; i++) {
            var z = P.lz[i]; if (z < 0.02) continue;
            var d = DIST[i], x = P.lx[i], y = P.ly[i], r = rT * (0.7 + 0.12 * NIV[i]) * (0.75 + 0.25 * z);
            if ((o1 > 0.01 && o1 < 3.25 && Math.abs(d - o1) < 0.08) || (o2 > 0.01 && o2 < 3.25 && Math.abs(d - o2) < 0.08)) { cresta.moveTo(x + r * 1.8, y); cresta.arc(x, y, r * 1.8, 0, TAU); }
            else if (d < o1 && d > o2) { cian[NIV[i] >= 2 ? 1 : 0].moveTo(x + r, y); cian[NIV[i] >= 2 ? 1 : 0].arc(x, y, r, 0, TAU); }
            else { plata[NIV[i]].moveTo(x + r, y); plata[NIV[i]].arc(x, y, r, 0, TAU); }
          }
          [0.22, 0.4, 0.66, 0.97].forEach(function (a, k) { ctx.fillStyle = U.rgba(C.luna, a * (0.6 + 0.4 * 1)); ctx.fill(plata[k]); });
          ctx.fillStyle = U.rgba(C.acento, 0.45); ctx.fill(cian[0]); ctx.fillStyle = U.rgba(C.acento, 0.95); ctx.fill(cian[1]);
          ctx.fillStyle = 'rgba(245,252,255,0.95)'; ctx.fill(cresta);
        },
        frente: function (ctx, t) {
          var sal = 1 - U.tramo(t, 14600, 16400);
          pts.forEach(function (p) {
            var a = U.sale(U.tramo(t, p.t0, p.t0 + 500)) * sal; if (a <= 0) return;
            E.proy(p.v, q); if (q[2] <= 0.05) return;
            FX.ondas(q[0], q[1], 3, 18, 2, (t - p.t0) / 1800, C.acento, 0.6 * a, 1);
            FX.marca(q[0], q[1], p.n + ' · ' + p.nombre, a * Math.min(1, q[2] * 2.5), C.acento, q[0] < E.cx ? 'izq' : 'der');
          });
        },
        fin: function () { raiz.classList.remove('final-activo'); }
      };
    }
  });
})();
