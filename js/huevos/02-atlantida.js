/* 02 · Atlántida — un punto del Atlántico centellea de vez en cuando; clic en él.
   Surgen del mar los anillos de tierra y agua que describió Platón, con el templo en el centro, y se vuelven a hundir. */
(function () {
  'use strict';
  var TI = window.TI, U = TI.util, G = TI.geo, FX = TI.fx, C = TI.color, TAU = Math.PI * 2, D2R = Math.PI / 180;
  var A = [31.5, -35.0], CICLO = 7000;
  var ESC = 3, AGUA = [1.56, 3.36, 5.55];   // tamaño del plano de Platón y radios (grados) de los tres anillos de agua

  function marco(lat, lon) {
    var c = G.vec(lat, lon), e = [c[2], 0, -c[0]], l = Math.hypot(e[0], e[2]); e = [e[0] / l, 0, e[2] / l];
    var n = [c[1] * e[2] - c[2] * e[1], c[2] * e[0] - c[0] * e[2], c[0] * e[1] - c[1] * e[0]];
    return { c: c, e: e, n: n };
  }
  function local(m, dx, dy) {  // dx, dy en grados → vector unitario
    var v = [m.c[0] + (m.e[0] * dx + m.n[0] * dy) * D2R, m.c[1] + (m.e[1] * dx + m.n[1] * dy) * D2R, m.c[2] + (m.e[2] * dx + m.n[2] * dy) * D2R];
    var l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l];
  }

  TI.registrar({
    id: 'atlantida', n: 2, nombre: 'Atlántida', tipo: 'Lugar',
    pista: 'Más allá de las columnas de Hércules, algo brilla bajo el agua de vez en cuando.',
    lugar: A, radioSenal: 18,
    detectar: function (api) {
      var E = api.motor, q = [0, 0, 0, 0];
      api.en('clic', function (d) { if (E.cercaDe(d, A[0], A[1], 2.4, 14)) api.disparar(); });
      // el destello: cada 7 s, y fijo si la lupa pasa por encima
      api.capa(function (ctx, t) {
        E.proyLL(A[0], A[1], q); if (q[2] < 0.12) return;
        var f = (t % CICLO) / CICLO, a = f < 0.16 ? Math.sin(f / 0.16 * Math.PI) : 0;
        var p = E.puntero, cerca = p.dentro && Math.hypot(p.x - q[0], p.y - q[1]) < 70 ? 1 - Math.hypot(p.x - q[0], p.y - q[1]) / 70 : 0;
        a = Math.max(a, cerca * (0.6 + 0.4 * Math.sin(t * 0.012)));
        if (a < 0.01) return;
        a *= Math.min(1, q[2] * 2);
        FX.brillo(q[0], q[1], 14, C.acento, 0.5 * a);
        ctx.fillStyle = U.rgba(C.acento, a); ctx.beginPath(); ctx.arc(q[0], q[1], 1.8, 0, TAU); ctx.fill();
        if (f < 0.16) { ctx.strokeStyle = U.rgba(C.acento, 0.5 * a); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(q[0], q[1], 3 + f / 0.16 * 14, 0, TAU); ctx.stroke(); }
      });
    },
    escena: function (E) {
      var m = marco(A[0], A[1]), r = U.azar(202), pts = [];
      // una rejilla hexagonal y, de ella, solo lo que es tierra en el plano de Platón (anillos de tierra y agua)
      var paso = 0.22, lim = Math.ceil(7.5 / paso);
      for (var fy = -lim; fy <= lim; fy++) {
        for (var fx = -lim; fx <= lim; fx++) {
          var dx = (fx + (fy & 1 ? 0.5 : 0)) * paso, dy = fy * paso * 0.866, d = Math.hypot(dx, dy) / ESC, zona, h;
          if (d < 0.36) { zona = 0; h = d < 0.13 ? 0.075 : 0.045; }
          else if (d < 0.52) continue;
          else if (d < 0.96) { zona = 1; h = 0.027; }
          else if (d < 1.12) continue;
          else if (d < 1.66) { zona = 2; h = 0.016; }
          else if (d < 1.85) continue;
          else if (d < 2.45) { zona = 3; h = 0.006; }
          else continue;
          if (zona > 0 && Math.abs(dx) < 0.28 && dy < 0) continue;   // el canal hacia el mar, al sur
          h *= 0.8 + r() * 0.4;
          pts.push({ v: local(m, dx, dy), z: zona, h: h, t0: 1700 + zona * 380 + r() * 420 + d * 120, hund: 9000 + (3 - zona) * 260 + r() * 300 });
        }
      }
      var base = [0, 0, 0, 0], cima = [0, 0, 0, 0], q = [0, 0, 0, 0];
      function altura(p, t) {
        var sube = U.rebote(U.tramo(t, p.t0, p.t0 + 1500)), baja = U.entra(U.tramo(t, p.hund, p.hund + 1500));
        return p.h * sube * (1 - baja);
      }
      return {
        duracion: 12000,
        tarjeta: {
          en: 4300, hasta: 10200,
          titulo: 'Atlántida',
          texto: 'Anillos de tierra y de agua alrededor de una isla con un templo, «más allá de las columnas de Hércules». Platón la describió hacia el 360 a.&nbsp;C. y la hundió en el mar en un solo día y una noche.',
          pie: 'Platón · Timeo y Critias'
        },
        centrado: true,
        // de lado y de cerca: el centro del globo queda por debajo de la pantalla, para que se vea el relieve
        inicio: function () { var Z = 3.9, Rt = E.Rbase * Z; E.camara(A[0] - 40, A[1], Z, 2100, 0, null, E.H * 0.38 + Math.sin(40 * D2R) * Rt - E.H / 2); },
        puntos: function (ctx, t) {
          E.dibujarPuntos({ alfa: 1 - 0.35 * U.meseta(t, 500, 1600, 9800, 11500) });
          // los anillos de agua, que ondean
          var a = U.meseta(t, 1200, 2400, 9600, 11400);
          if (a > 0) {
            ctx.lineWidth = 1;
            for (var i = 0; i < AGUA.length; i++) {
              ctx.strokeStyle = U.rgba(C.mar, 0.55 * a); ctx.beginPath(); FX.circulo(m.c, AGUA[i] - 0.2 + 0.08 * Math.sin(t * 0.002 + i), 1, 160); ctx.stroke();
              ctx.strokeStyle = U.rgba(C.mar, 0.25 * a); ctx.beginPath(); FX.circulo(m.c, AGUA[i] + 0.18 + 0.08 * Math.sin(t * 0.0023 + i * 2), 1, 160); ctx.stroke();
            }
          }
          // ondas al hundirse
          var h = U.tramo(t, 9200, 12000);
          if (h > 0 && h < 1) {
            for (var k = 0; k < 3; k++) {
              var f = U.clamp(h * 1.4 - k * 0.2, 0, 1); if (f <= 0) continue;
              ctx.strokeStyle = U.rgba(C.acento, 0.5 * (1 - f)); ctx.beginPath(); FX.circulo(m.c, 1 + f * 9, 1, 160); ctx.stroke();
            }
          }
        },
        frente: function (ctx, t) {
          var rT = U.clamp(paso * D2R * E.R * 0.28, 0.8, 2.6), altos = [], bajos = [];
          ctx.lineWidth = 1; ctx.strokeStyle = U.rgba(C.acento, 0.2); ctx.beginPath();
          for (var i = 0; i < pts.length; i++) {
            var p = pts[i], hh = altura(p, t); if (hh <= 0.0004) continue;
            E.proy(p.v, base); if (base[2] <= 0) continue;
            E.proy(p.v, cima, hh);
            ctx.moveTo(base[0], base[1]); ctx.lineTo(cima[0], cima[1]);
            (hh > p.h * 0.5 && p.z < 2 ? altos : bajos).push(cima[0], cima[1]);
          }
          ctx.stroke();
          ctx.fillStyle = U.rgba(C.hueso, 0.9); ctx.beginPath();
          for (var j = 0; j < bajos.length; j += 2) { ctx.moveTo(bajos[j] + rT, bajos[j + 1]); ctx.arc(bajos[j], bajos[j + 1], rT, 0, TAU); }
          ctx.fill();
          ctx.fillStyle = U.rgba(C.acento, 0.95); ctx.beginPath();
          for (var k = 0; k < altos.length; k += 2) { ctx.moveTo(altos[k] + rT * 1.1, altos[k + 1]); ctx.arc(altos[k], altos[k + 1], rT * 1.1, 0, TAU); }
          ctx.fill();
          // la luz del templo
          var luz = U.meseta(t, 3600, 4600, 8600, 9600);
          if (luz > 0) {
            E.proy(m.c, base, 0.075); E.proy(m.c, q, 0.075 + 0.4 * luz);
            var g = ctx.createLinearGradient(base[0], base[1], q[0], q[1]);
            g.addColorStop(0, U.rgba(C.acento, 0.75 * luz)); g.addColorStop(1, U.rgba(C.acento, 0));
            ctx.strokeStyle = g; ctx.lineCap = 'round';
            ctx.lineWidth = 9; ctx.globalAlpha = 0.18; ctx.beginPath(); ctx.moveTo(base[0], base[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
            ctx.lineWidth = 2; ctx.globalAlpha = 1; ctx.beginPath(); ctx.moveTo(base[0], base[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
            FX.brillo(base[0], base[1], 60, C.acento, 0.45 * luz);
          }
        }
      };
    }
  });
})();
