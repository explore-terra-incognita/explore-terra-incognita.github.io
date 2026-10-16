/* 10 · Paciencia — no tocar nada durante 45 segundos.
   El mundo enseña cómo está ahora mismo: el día y la noche reales (posición del Sol según tu reloj) y las ciudades encendidas. */
(function () {
  'use strict';
  var TI = window.TI, U = TI.util, G = TI.geo, FX = TI.fx, C = TI.color, TAU = Math.PI * 2;
  var ESPERA = 45000, NOCHE = [72, 84, 112], OCASO = [255, 160, 92], LUCES = [255, 198, 120];
  var ORBITA_KM_S = 29.78, DIA = 86164;

  TI.registrar({
    id: 'paciencia', n: 10, nombre: 'Paciencia', tipo: 'Espera',
    pista: 'El único que no se encuentra buscando. Suelta el ratón y deja el mundo en paz un rato.',
    detectar: function (api) {
      api.en('cuadro', function (d) {
        if (d.inactivo > ESPERA && !document.hidden && !document.documentElement.classList.contains('cuaderno-abierto')) { api.motor.ultimoInput = api.motor.t; api.disparar({ segundos: TI.motor.segundosDesdeCarga() }); }
      });
    },
    escena: function (E, datos) {
      var ahora = new Date(), sol = G.sol(ahora), s = G.vec(sol[0], sol[1]);
      var seg = (datos && datos.segundos) || E.segundosDesdeCarga();
      var grados = seg * 360 / DIA, km = seg * ORBITA_KM_S;
      var ciudades = window.TI_DATOS.ciudades.map(function (c, i) {
        var v = G.vec(c[0], c[1]); return { v: v, d: v[0] * s[0] + v[1] * s[1] + v[2] * s[2], r: 0.8 + Math.sqrt(c[2]) * 0.55, f: (i * 0.618) % 1 };
      });
      var T = E.tierra.xyz, NT = E.tierra.n, D = new Float32Array(NT);
      for (var i = 0; i < NT; i++) D[i] = T[i * 3] * s[0] + T[i * 3 + 1] * s[1] + T[i * 3 + 2] * s[2];
      // la vista: la línea del ocaso delante (72° al este del Sol son las ~5 de la tarde), donde se encienden las ciudades
      var lonVista = sol[1] + 72, latVista = 18;
      var q = [0, 0, 0, 0];
      var hh = U.dos(ahora.getUTCHours()) + ':' + U.dos(ahora.getUTCMinutes());
      function noche(t) { return U.lerp(-1.08, 0.02, U.inOut(U.tramo(t, 1600, 4200))) * (1 - U.tramo(t, 11400, 13000)) + (-1.08) * U.tramo(t, 11400, 13000); }
      return {
        duracion: 13400,
        tarjeta: {
          en: 4600, hasta: 11400,
          titulo: 'Paciencia',
          texto: 'Así está el mundo ahora mismo: medio de día, medio de noche, con las ciudades encendidas. Mientras esperabas, la Tierra de verdad ha girado ' + U.num(grados, 2) + '° y ha avanzado ' + U.num(km) + ' km en su órbita alrededor del Sol.',
          pie: 'UTC ' + hh + ' · Sol en el cénit sobre ' + G.gms(sol[0], sol[1])
        },
        inicio: function () { E.camara(latVista, lonVista, 1.22, 2400); },
        cuadro: function (t) { E.brilloEstrellas = 1 + 0.5 * U.meseta(t, 2000, 4000, 11000, 13000); },
        puntos: function (ctx, t) {
          var P = E.P, lim = noche(t), rT = E.radioPunto();
          var dia = [new Path2D(), new Path2D()], oscuro = new Path2D(), ocaso = new Path2D();
          for (var i = 0; i < NT; i++) {
            var z = P.tz[i]; if (z < 0.02) continue;
            var d = D[i], x = P.tx[i], y = P.ty[i], r = rT * (0.6 + 0.4 * z);
            if (d < lim) { oscuro.moveTo(x + r, y); oscuro.arc(x, y, r, 0, TAU); }
            else if (d < lim + 0.1 && lim > -1) { ocaso.moveTo(x + r, y); ocaso.arc(x, y, r, 0, TAU); }
            else { var b = z > 0.45 ? 1 : 0; dia[b].moveTo(x + r, y); dia[b].arc(x, y, r, 0, TAU); }
          }
          E.dibujarPuntos({ sinTierra: true });   // solo el mar (la tierra se pinta aquí)
          ctx.fillStyle = U.rgba(NOCHE, 0.75); ctx.fill(oscuro);
          ctx.fillStyle = U.rgba(OCASO, 0.9); ctx.fill(ocaso);
          ctx.fillStyle = U.rgba(C.hueso, 0.5); ctx.fill(dia[0]);
          ctx.fillStyle = U.rgba(C.hueso, 0.95); ctx.fill(dia[1]);
          // la luz del Sol en el borde del disco
          var sv = [E.rot[0] * s[0] + E.rot[1] * s[1] + E.rot[2] * s[2], E.rot[3] * s[0] + E.rot[4] * s[1] + E.rot[5] * s[2]];
          var la = U.meseta(t, 1800, 3600, 11400, 13000);
          if (la > 0) {
            ctx.save(); ctx.beginPath(); ctx.arc(E.cx, E.cy, E.R, 0, TAU); ctx.clip();
            FX.brillo(E.cx + sv[0] * E.R, E.cy - sv[1] * E.R, E.R * 1.3, [255, 236, 200], 0.12 * la);
            ctx.restore();
            // el terminador
            ctx.setLineDash([2, 5]); ctx.strokeStyle = U.rgba(OCASO, 0.5 * la); ctx.lineWidth = 1; ctx.beginPath(); FX.circulo(s, 90, 1, 240); ctx.stroke(); ctx.setLineDash([]);
          }
        },
        frente: function (ctx, t) {
          var lim = noche(t), a = U.meseta(t, 2600, 4400, 11200, 12800); if (a <= 0) return;
          ctx.save(); ctx.globalCompositeOperation = 'lighter';
          var halo = new Path2D(), nucleo = new Path2D();
          for (var i = 0; i < ciudades.length; i++) {
            var c = ciudades[i]; if (c.d > Math.min(-0.02, lim)) continue;
            var on = U.tramo(t, 2600 + c.f * 1800, 3000 + c.f * 1800); if (on <= 0) continue;
            E.proy(c.v, q); if (q[2] < 0.05) continue;
            var parp = 0.85 + 0.15 * Math.sin(t * 0.004 + c.f * 40);
            halo.moveTo(q[0] + c.r * 4, q[1]); halo.arc(q[0], q[1], c.r * 4 * on * parp, 0, TAU);
            nucleo.moveTo(q[0] + c.r, q[1]); nucleo.arc(q[0], q[1], c.r * on, 0, TAU);
          }
          ctx.fillStyle = U.rgba(LUCES, 0.07 * a); ctx.fill(halo);
          ctx.fillStyle = U.rgba(LUCES, 0.9 * a); ctx.fill(nucleo);
          ctx.restore();
          // el Sol, si cae delante
          E.proy(s, q);
          if (q[2] > 0) FX.marca(q[0], q[1], 'SOL EN EL CÉNIT', 0.85 * a, [255, 214, 150]);
        }
      };
    }
  });
})();
