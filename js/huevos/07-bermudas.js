/* 07 · Triángulo de las Bermudas — dejar el puntero dentro del triángulo Miami–Bermudas–San Juan.
   Al entrar, el cursor y la lupa desaparecen. Si te quedas, un remolino se traga los puntos (y un barco y un avión) y luego los devuelve. */
(function () {
  'use strict';
  var TI = window.TI, U = TI.util, G = TI.geo, FX = TI.fx, C = TI.color, TAU = Math.PI * 2;
  var V = [['MIAMI', 25.7617, -80.1918], ['BERMUDAS', 32.2949, -64.7814], ['SAN JUAN', 18.4655, -66.1057]];
  var VEC = V.map(function (v) { return G.vec(v[1], v[2]); });
  var CEN = (function () { var s = [0, 0, 0]; VEC.forEach(function (v) { s[0] += v[0]; s[1] += v[1]; s[2] += v[2]; }); return G.latlon(s[0], s[1], s[2]); })();
  var ESPERA = 2200;

  function cruz(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function pp(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  var N1 = cruz(VEC[0], VEC[1]), N2 = cruz(VEC[1], VEC[2]), N3 = cruz(VEC[2], VEC[0]);
  function dentro(lat, lon) {
    var p = G.vec(lat, lon), a = pp(p, N1), b = pp(p, N2), c = pp(p, N3);
    return (a > 0 && b > 0 && c > 0) || (a < 0 && b < 0 && c < 0);
  }
  // superficie del triángulo esférico (exceso esférico × R²)
  function area() {
    var ang = function (a, b, c) {  // ángulo en a
      var n1 = cruz(a, b), n2 = cruz(a, c);
      return Math.acos(U.clamp(pp(n1, n2) / Math.hypot(n1[0], n1[1], n1[2]) / Math.hypot(n2[0], n2[1], n2[2]), -1, 1));
    };
    var ex = ang(VEC[0], VEC[1], VEC[2]) + ang(VEC[1], VEC[2], VEC[0]) + ang(VEC[2], VEC[0], VEC[1]) - Math.PI;
    return ex * G.RADIO_KM * G.RADIO_KM;
  }

  TI.registrar({
    id: 'bermudas', n: 7, nombre: 'Triángulo de las Bermudas', tipo: 'Lugar',
    pista: 'Hay un triángulo en el mar donde hasta el cursor se pierde. Quédate dentro un rato.',
    lugar: CEN, radioSenal: 20,
    detectar: function (api) {
      var E = api.motor, raiz = document.documentElement, carga = 0, armado = true;   // hay que salir del triángulo para volver a armarlo
      api.en('cuadro', function (d) {
        var p = E.puntero, si = p.dentro && p.tipo === 'mouse' && !E.arrastre && dentro(p.lat, p.lon);
        E.lenteOculta = si; raiz.classList.toggle('sin-cursor', si);
        if (!si) armado = true;
        carga = si && armado ? carga + d.dt : 0;
        if (carga > ESPERA) { carga = 0; armado = false; E.lenteOculta = false; raiz.classList.remove('sin-cursor'); api.disparar(); }
      });
    },
    escena: function (E) {
      var L = E.lectura;   // tiempo extra para leer la tarjeta (motor.js)
      var c = G.vec(CEN[0], CEN[1]), r = U.azar(707), agua = [];
      // agua extra para que el remolino tenga de qué tirar
      for (var i = 0; i < 900; i++) {
        var a = r() * TAU, d = Math.sqrt(r()) * 13;
        agua.push(G.vec(CEN[0] + Math.sin(a) * d, CEN[1] + Math.cos(a) * d / Math.cos(CEN[0] * Math.PI / 180)));
      }
      var km2 = area(), q = [0, 0, 0, 0], ox = 0, oy = 0;
      var objetos = [{ tipo: 'barco', lat: 27.5, lon: -72.5 }, { tipo: 'avion', lat: 23.5, lon: -68.5 }];
      // remolino en pantalla alrededor del centro del triángulo
      function giro(t) { return U.meseta(t, 1900, 4600, 5800, 6000); }
      function absorbe(t) { return U.entra(U.tramo(t, 2200, 5900)); }
      function devuelve(t) { return U.rebote(U.tramo(t, 6100, 7300)); }
      function remolino(x, y, t, o) {
        var dx = x - ox, dy = y - oy, d = Math.hypot(dx, dy), Rm = E.R * 0.3;
        if (d > Rm * 1.3) { o[0] = x; o[1] = y; o[2] = 1; return o; }
        var f = Math.pow(1 - d / (Rm * 1.3), 1.6), ab = absorbe(t), dv = t > 6100 ? devuelve(t) : 0;
        var k = (t > 6100 ? 1 - dv : ab) * f;
        var ang = Math.atan2(dy, dx) + giro(t) * f * 3.2 + k * 5, nd = d * (1 - k);
        o[0] = ox + Math.cos(ang) * nd; o[1] = oy + Math.sin(ang) * nd; o[2] = 1 - k * 0.9; return o;
      }
      var tmp = [0, 0, 0];
      return {
        duracion: 10500 + L,
        tarjeta: {
          en: 4200, hasta: 9800 + L,
          titulo: 'Triángulo de las Bermudas',
          texto: 'Su fama de tragarse barcos y aviones no aguanta los datos: aquí no desaparece más que en cualquier otro mar igual de transitado. Lo único que se pierde de verdad es tu cursor.',
          pie: 'Miami · Bermudas · San Juan · ' + U.num(Math.round(km2 / 1000) * 1000) + ' km²'
        },
        inicio: function () { E.camara(CEN[0], CEN[1], 3.1, 1600); },
        puntos: function (ctx, t) {
          E.proy(c, q); ox = q[0]; oy = q[1];
          var P = E.P, rT = E.radioPunto(), tierra = new Path2D(), mar = new Path2D(), aguaP = new Path2D();
          for (var i = 0; i < E.tierra.n; i++) {
            if (P.tz[i] < 0.02) continue; remolino(P.tx[i], P.ty[i], t, tmp);
            var rr = rT * tmp[2]; if (rr < 0.15) continue; tierra.moveTo(tmp[0] + rr, tmp[1]); tierra.arc(tmp[0], tmp[1], rr, 0, TAU);
          }
          for (var j = 0; j < E.mar.n; j++) {
            if (P.mz[j] < 0.02) continue; remolino(P.mx[j], P.my[j], t, tmp);
            var rm = rT * 0.6 * tmp[2]; if (rm < 0.1) continue; mar.moveTo(tmp[0] + rm, tmp[1]); mar.arc(tmp[0], tmp[1], rm, 0, TAU);
          }
          var va = U.meseta(t, 900, 1900, 8600 + L, 10000 + L);
          if (va > 0) for (var k = 0; k < agua.length; k++) {
            E.proy(agua[k], q); if (q[2] < 0.02) continue; remolino(q[0], q[1], t, tmp);
            var ra = 0.9 * tmp[2]; aguaP.moveTo(tmp[0] + ra, tmp[1]); aguaP.arc(tmp[0], tmp[1], ra, 0, TAU);
          }
          ctx.fillStyle = U.rgba(C.mar, 0.4); ctx.fill(mar);
          if (va > 0) { ctx.fillStyle = U.rgba(C.mar, 0.5 * va); ctx.fill(aguaP); }
          ctx.fillStyle = U.rgba(C.hueso, 0.9); ctx.fill(tierra);
        },
        frente: function (ctx, t) {
          var sal = 1 - U.tramo(t, 8800 + L, 10300 + L);
          // el triángulo
          var f = U.inOut(U.tramo(t, 700, 2000));
          ctx.strokeStyle = U.rgba(C.acento, 0.85 * sal); ctx.lineWidth = 1.3; ctx.beginPath();
          for (var i = 0; i < 3; i++) FX.arco(VEC[i], VEC[(i + 1) % 3], 0, 0, U.clamp(f * 3 - i, 0, 1), 40);
          ctx.stroke();
          V.forEach(function (v, i) {
            E.proy(VEC[i], q); if (q[2] <= 0) return;
            FX.marca(q[0], q[1], v[0], U.tramo(t, 1000 + i * 300, 1600 + i * 300) * sal, C.acento, i === 0 ? 'izq' : 'der');
          });
          // el barco y el avión, arrastrados
          objetos.forEach(function (o, i) {
            E.proyLL(o.lat, o.lon, q); if (q[2] <= 0) return;
            remolino(q[0], q[1], t, tmp);
            var a = U.tramo(t, 1200, 1800) * (t > 6100 ? U.tramo(t, 7000, 7600) * sal : 1), s = 6 * tmp[2];
            if (a <= 0.01 || s < 0.3) return;
            var rot = (t > 2200 && t < 6100 ? (t - 2200) * 0.008 * (i ? -1 : 1) : 0);
            ctx.save(); ctx.translate(tmp[0], tmp[1]); ctx.rotate(rot); ctx.fillStyle = U.rgba(C.hueso, a); ctx.strokeStyle = U.rgba(C.hueso, a); ctx.lineWidth = 1.2;
            if (o.tipo === 'barco') { ctx.beginPath(); ctx.moveTo(-s, 0); ctx.lineTo(s, 0); ctx.lineTo(s * 0.6, s * 0.5); ctx.lineTo(-s * 0.6, s * 0.5); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -s * 1.2); ctx.lineTo(s * 0.7, -s * 0.2); ctx.stroke(); }
            else { ctx.beginPath(); ctx.moveTo(-s * 1.2, 0); ctx.lineTo(s * 1.2, 0); ctx.moveTo(-s * 0.1, -s); ctx.lineTo(s * 0.2, s); ctx.moveTo(-s * 1.1, -s * 0.4); ctx.lineTo(-s * 1.1, s * 0.4); ctx.stroke(); }
            ctx.restore();
          });
          // destello al implosionar
          var fl = U.meseta(t, 5600, 5950, 6050, 6700);
          if (fl > 0) { FX.brillo(ox, oy, 60 + 120 * fl, C.acento, 0.55 * fl); ctx.fillStyle = U.rgba(C.acento, fl); ctx.beginPath(); ctx.arc(ox, oy, 3 * fl, 0, TAU); ctx.fill(); }
          var on = U.tramo(t, 6100, 7600); if (on > 0 && on < 1) FX.ondas(ox, oy, 4, E.R * 0.7, 1, on, C.acento, 0.6, 1.4);
        }
      };
    }
  });
})();
