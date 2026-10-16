/* Final · Terra cognita — se lanza solo al encontrar los diez secretos (y se puede volver a ver desde el cuaderno).
   Los lugares de cada secreto se encienden y se unen, una ola verde recorre el planeta y el título pierde su «in». */
(function () {
  'use strict';
  var TI = window.TI, U = TI.util, G = TI.geo, FX = TI.fx, C = TI.color, TAU = Math.PI * 2;
  var LUGARES = [
    ['01', 'NULL ISLAND', 0, 0], ['02', 'ATLÁNTIDA', 31.5, -35], ['03', 'PUNTO NEMO', -48.88, -123.39],
    ['04', 'POLO GEOMAGNÉTICO', 80.7, -72.7], ['06', 'EJE DE GIRO', 90, 0], ['07', 'BERMUDAS', 25.6, -70.4],
    ['08', 'TOKIO', 35.68, 139.69], ['09', 'CABO CAÑAVERAL', 28.39, -80.6]
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
    escena: function (E, datos) {
      var lista = LUGARES.slice(), sol = G.sol();
      lista.push(['10', 'EL SOL, AHORA', sol[0], sol[1]]);
      (datos.huevos || []).forEach(function (h) { if (h.id === 'antipodas' && h.ultimosDatos && h.ultimosDatos.a) lista.splice(4, 0, ['05', 'TU ANTÍPODA', h.ultimosDatos.b[0], h.ultimosDatos.b[1]]); });
      var pts = lista.map(function (l, i) { return { n: l[0], nombre: l[1], v: G.vec(l[2], l[3]), t0: 1400 + i * 380 }; });
      var T = E.tierra.xyz, NT = E.tierra.n, DIST = new Float32Array(NT);
      for (var i = 0; i < NT; i++) DIST[i] = Math.acos(U.clamp(T[i * 3 + 2], -1, 1));   // distancia (rad) a Null Island
      var q = [0, 0, 0, 0], raiz = document.documentElement;
      return {
        duracion: 16500,
        tarjeta: {
          en: 4200, hasta: 15200,
          etiqueta: 'Los ' + TI.interfaz.palabra((datos.huevos || []).length) + ' secretos', titulo: 'Terra cognita',
          texto: 'Ya no queda nada por descubrir en este mundo… de momento. Lo has encontrado todo en ' + duracion(datos.hasta - datos.desde) + ', del primer secreto al último.',
          pie: 'Cuaderno completo · ' + (datos.huevos || []).length + '/' + (datos.huevos || []).length
        },
        inicio: function () { raiz.classList.add('final-activo'); E.camara(20, -40, 0.98, 2200); },
        cuadro: function (t, dt) { if (t > 2200) E.girarPropio(dt * TAU / 26000); E.brilloEstrellas = 1 + 0.6 * U.meseta(t, 2000, 5000, 14000, 16400); if (t > 5200) raiz.classList.add('cognita'); },
        puntos: function (ctx, t) {
          // dos olas desde Null Island: la primera tiñe de verde, la segunda devuelve el color
          var P = E.P, rT = E.radioPunto(), o1 = U.inOut(U.tramo(t, 4400, 7600)) * 3.3, o2 = U.inOut(U.tramo(t, 9000, 12600)) * 3.3;
          var hueso = [new Path2D(), new Path2D()], verde = [new Path2D(), new Path2D()], cresta = new Path2D();
          for (var i = 0; i < NT; i++) {
            var z = P.tz[i]; if (z < 0.02) continue;
            var d = DIST[i], x = P.tx[i], y = P.ty[i], b = z > 0.45 ? 1 : 0, r = rT * (0.6 + 0.4 * z);
            var enCresta = (o1 > 0.01 && o1 < 3.25 && Math.abs(d - o1) < 0.08) || (o2 > 0.01 && o2 < 3.25 && Math.abs(d - o2) < 0.08);
            if (enCresta) { cresta.moveTo(x + r * 1.8, y); cresta.arc(x, y, r * 1.8, 0, TAU); }
            else if (d < o1 && d > o2) { verde[b].moveTo(x + r, y); verde[b].arc(x, y, r, 0, TAU); }
            else { hueso[b].moveTo(x + r, y); hueso[b].arc(x, y, r, 0, TAU); }
          }
          E.dibujarPuntos({ sinTierra: true });
          ctx.fillStyle = U.rgba(C.hueso, 0.45); ctx.fill(hueso[0]); ctx.fillStyle = U.rgba(C.hueso, 0.93); ctx.fill(hueso[1]);
          ctx.fillStyle = U.rgba(C.acento, 0.5); ctx.fill(verde[0]); ctx.fillStyle = U.rgba(C.acento, 0.95); ctx.fill(verde[1]);
          ctx.fillStyle = 'rgba(255,255,240,0.95)'; ctx.fill(cresta);
        },
        frente: function (ctx, t) {
          var sal = 1 - U.tramo(t, 14600, 16400);
          // la ruta que une los secretos, con una luz que la recorre
          ctx.lineWidth = 1; ctx.strokeStyle = U.rgba(C.acento, 0.55 * sal); ctx.beginPath();
          for (var i = 1; i < pts.length; i++) {
            var f = U.inOut(U.tramo(t, pts[i].t0, pts[i].t0 + 700)); if (f <= 0) continue;
            FX.arco(pts[i - 1].v, pts[i].v, 0.1, 0, f, 50);
          }
          ctx.stroke();
          var viaje = ((t - 5000) / 900) % (pts.length - 1);
          if (t > 5000 && sal > 0) {
            var k = Math.floor(viaje), u = viaje - k;
            FX.puntoArco(pts[k].v, pts[k + 1].v, 0.1, U.inOut(u), q);
            if (E.visible(q)) { FX.brillo(q[0], q[1], 16, C.acento, 0.8 * sal); ctx.fillStyle = 'rgba(255,255,240,' + sal + ')'; ctx.beginPath(); ctx.arc(q[0], q[1], 2.2, 0, TAU); ctx.fill(); }
          }
          // los lugares
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
