/* Luna 06 · Pluma y martillo — mantener pulsado sobre la Luna sin moverse (se carga un anillo) y soltar.
   En Hadley, donde aterrizó el Apolo 15: un martillo y una pluma caen a la vez y llegan juntos al suelo. */
(function () {
  'use strict';
  var TI = window.TI, U = TI.util, FX = TI.fx, C = TI.color, TAU = Math.PI * 2;
  var HADLEY = [26.1322, 3.6339], CARGA = 1400, AVISO = 350;

  function martillo(ctx, x, y, a, ang) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang || 0);
    ctx.strokeStyle = U.rgba(C.luna, a); ctx.fillStyle = U.rgba(C.luna, a); ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(0, -8); ctx.stroke();
    ctx.fillRect(-7, -13, 14, 6);
    ctx.restore();
  }
  function pluma(ctx, x, y, a, ang) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang || 0);
    ctx.strokeStyle = U.rgba(C.luna, a); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(0, 13); ctx.quadraticCurveTo(1, 0, -1, -13); ctx.stroke();
    ctx.fillStyle = U.rgba(C.luna, 0.55 * a);
    ctx.beginPath(); ctx.moveTo(0, 8); ctx.quadraticCurveTo(8, 0, 2, -13); ctx.quadraticCurveTo(-7, -4, 0, 8); ctx.fill();
    ctx.restore();
  }

  TI.registrar({
    id: 'pluma-y-martillo', n: 6, mundo: 'luna', nombre: 'Pluma y martillo', tipo: 'Gesto',
    pista: 'Aquí un martillo y una pluma caen igual de deprisa. Sostén algo un momento… y suéltalo.',
    lugar: null,
    detectar: function (api) {
      var E = api.motor;
      api.en('subir', function (d) { if (d.dentro && d.movido < 6 && d.dur > CARGA) api.disparar(); });
      // mientras se mantiene pulsado, un anillo se va llenando
      api.capa(function (ctx) {
        var A = E.arrastre; if (!A || A.movido >= 6) return;
        var f = (E.t - A.t0 - AVISO) / (CARGA - AVISO); if (f <= 0) return;
        if (!E.pantallaA(A.x0, A.y0)) return;
        var lleno = f >= 1;
        ctx.lineCap = 'round';
        ctx.strokeStyle = U.rgba(C.acento, 0.2); ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(A.x0, A.y0, 18, 0, TAU); ctx.stroke();
        ctx.strokeStyle = U.rgba(C.acento, 0.95); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(A.x0, A.y0, 18, -Math.PI / 2, -Math.PI / 2 + Math.min(1, f) * TAU); ctx.stroke();
        if (lleno) FX.texto('SUELTA', A.x0, A.y0 + 32, { tam: 10.5, alin: 'center', a: 0.85, color: C.acento, espaciado: 2 });
      });
    },
    escena: function (E) {
      var L = E.lectura, q = [0, 0, 0, 0], q2 = [0, 0, 0, 0];
      var SUELTA = 3400, CAIDA = 1410;   // 1,4 s: lo que tarda en caer algo desde 1,6 m con la gravedad de la Luna (1,62 m/s²)
      var m = FX.marcoLocal(HADLEY[0], HADLEY[1]), suelo = FX.suelo(m, 14, 0.32, 15);
      return {
        duracion: 12500 + L,
        sinTierraFondo: true,
        tarjeta: {
          en: 5600, hasta: 11200 + L,
          titulo: 'Pluma y martillo',
          texto: 'El 2 de agosto de 1971, David Scott (Apolo 15) soltó a la vez un martillo y una pluma de halcón. Sin aire que frene a la pluma, llegaron juntos al suelo, como había predicho Galileo. «El señor Galileo tenía razón», dijo Scott.',
          pie: 'Hadley-Apeninos · 26°08′ N · 3°38′ E'
        },
        inicio: function () { FX.rasante(HADLEY[0], HADLEY[1], 8, 50, 0.6, 2200); },
        puntos: function (ctx, t) {
          E.dibujarPuntos({ alfa: 1 - 0.25 * U.meseta(t, 800, 2200, 11000 + L, 12400 + L) });
          FX.dibujarSuelo(suelo, U.meseta(t, 1000, 2400, 11000 + L, 12400 + L));
        },
        frente: function (ctx, t) {
          var sal = 1 - U.tramo(t, 11000 + L, 12400 + L), a = U.tramo(t, 1600, 2400) * sal; if (a <= 0) return;
          E.proy(m.c, q); E.proy(m.c, q2, 0.01);
          var ux = q2[0] - q[0], uy = q2[1] - q[1], l = Math.hypot(ux, uy) || 1; ux /= l; uy /= l;
          var altura = 200, sep = 46, f = U.clamp((t - SUELTA) / CAIDA, 0, 1), caida = altura * (1 - f * f);   // caída libre: y ∝ t²
          var balanceo = t < SUELTA ? Math.sin(t * 0.004) * 0.08 : 0;
          [-1, 1].forEach(function (lado) {
            var bx = q[0] - uy * lado * sep, by = q[1] + ux * lado * sep;
            var x = bx + ux * caida, y = by + uy * caida;
            ctx.save(); ctx.translate(x, y - 20); ctx.scale(1.6, 1.6);
            if (lado < 0) martillo(ctx, 0, 0, a, balanceo); else pluma(ctx, 0, 0, a, -balanceo);
            ctx.restore();
            ctx.fillStyle = U.rgba(C.luna, 0.15 * a); ctx.beginPath(); ctx.ellipse(bx, by, 9, 3, 0, 0, TAU); ctx.fill();   // sombra
            var p = U.tramo(t, SUELTA + CAIDA, SUELTA + CAIDA + 1200);
            if (p > 0 && p < 1) { ctx.strokeStyle = U.rgba(C.luna, 0.55 * (1 - p)); ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(bx, by, 6 + p * 34, (6 + p * 34) * 0.35, 0, 0, TAU); ctx.stroke(); }
          });
          // la regla de la altura y el momento de soltar
          var r = U.meseta(t, 2200, 2800, SUELTA + CAIDA + 400, SUELTA + CAIDA + 1400) * sal;
          if (r > 0) {
            var rx = q[0] - uy * (sep + 40), ry = q[1] + ux * (sep + 40);
            ctx.strokeStyle = U.rgba(C.luna, 0.4 * r); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx + ux * altura, ry + uy * altura); ctx.stroke();
            FX.texto(f > 0 ? U.num(f * CAIDA / 1000, 2) + ' s' : '1,6 m', rx - 10, ry + uy * altura * 0.5, { tam: 11, alin: 'right', a: 0.8 * r, color: C.acento, espaciado: 1 });
          }
          var cita = U.meseta(t, SUELTA + CAIDA + 500, SUELTA + CAIDA + 1200, 11000 + L, 12200 + L);
          if (cita > 0) FX.texto('«EL SEÑOR GALILEO TENÍA RAZÓN»', q[0], q[1] - altura - 40, { tam: 12, alin: 'center', a: cita, color: C.acento, espaciado: 1.5, peso: 600 });
          if (t > SUELTA + CAIDA) FX.texto('A LA VEZ', q[0], q[1] + 28, { tam: 10.5, alin: 'center', a: 0.7 * U.tramo(t, SUELTA + CAIDA, SUELTA + CAIDA + 500) * sal, espaciado: 2 });
        }
      };
    }
  });
})();
