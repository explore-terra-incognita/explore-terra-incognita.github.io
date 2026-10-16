/* Luna 01 · Apolo 11 — clic en la Base Tranquilidad (Mar de la Tranquilidad).
   Vista rasante: el módulo Eagle se posa levantando polvo, aparecen las huellas una a una y se planta la bandera. */
(function () {
  'use strict';
  var TI = window.TI, U = TI.util, FX = TI.fx, C = TI.color, TAU = Math.PI * 2;
  var BASE = [0.67408, 23.47297];

  TI.registrar({
    id: 'apolo-11', n: 1, mundo: 'luna', nombre: 'Apolo 11', tipo: 'Lugar',
    pista: 'Un mar sin agua donde alguien dio un pequeño paso.',
    lugar: BASE, radioSenal: 14,
    detectar: function (api) {
      api.en('clic', function (d) { if (api.motor.cercaDe(d, BASE[0], BASE[1], 2.2, 14)) api.disparar(); });
    },
    escena: function (E) {
      var L = E.lectura, m = FX.marcoLocal(BASE[0], BASE[1]), q = [0, 0, 0, 0], q2 = [0, 0, 0, 0];
      // las huellas: un paseo desde el módulo, pie izquierdo y derecho alternos
      // hacia el sureste, es decir, hacia quien mira: así las huellas se acercan y se ven más grandes
      var huellas = [];
      for (var i = 0; i < 18; i++) {
        var s = 0.6 + i * 0.17, w = -1.05 + 0.3 * Math.sin(i * 0.33), lado = (i % 2 ? 1 : -1) * 0.07;
        var dx = Math.cos(w), dy = Math.sin(w), ex = -dy * lado, ey = dx * lado;
        huellas.push({ v: FX.local(m, dx * s + ex, dy * s + ey), v2: FX.local(m, dx * (s + 0.05) + ex, dy * (s + 0.05) + ey), t0: 5000 + i * 220 });
      }
      var bandera = FX.local(m, 2.3, -0.15), H_EAGLE = 0.03, H_MASTIL = 0.024, suelo = FX.suelo(m, 14, 0.32, 69);
      return {
        duracion: 13500 + L,
        sinTierraFondo: true,
        tarjeta: {
          en: 5200, hasta: 12000 + L,
          titulo: 'Apolo 11',
          texto: 'El 20 de julio de 1969 el módulo Eagle se posó aquí, en el Mar de la Tranquilidad. Horas después Neil Armstrong bajó y dijo: «Es un pequeño paso para el hombre, pero un gran salto para la humanidad». Sin viento que las borre, sus huellas pueden seguir ahí millones de años.',
          pie: 'Base Tranquilidad · 0°40′ N · 23°28′ E'
        },
        inicio: function () { FX.rasante(BASE[0], BASE[1], 8, 50, 0.56, 2200); },
        puntos: function (ctx, t) {
          E.dibujarPuntos({ alfa: 1 - 0.25 * U.meseta(t, 800, 2200, 12000 + L, 13500 + L) });
          FX.dibujarSuelo(suelo, U.meseta(t, 1000, 2400, 12000 + L, 13500 + L));
        },
        frente: function (ctx, t) {
          var sal = 1 - U.tramo(t, 12000 + L, 13500 + L);
          // el módulo baja hasta posarse
          var baja = U.sale(U.tramo(t, 1400, 4200)), h = 0.07 * (1 - baja);
          E.proy(m.c, q, h); E.proy(m.c, q2, h + H_EAGLE);
          var x = q[0], y = q[1], ux = (q2[0] - q[0]), uy = (q2[1] - q[1]), alto = Math.hypot(ux, uy) || 1;
          ux /= alto; uy /= alto;   // «arriba» en pantalla en ese punto
          var px = -uy, py = ux;    // «al lado»
          var A = U.tramo(t, 900, 1600) * sal;
          if (A > 0) {
            ctx.strokeStyle = U.rgba(C.luna, 0.95 * A); ctx.fillStyle = U.rgba(C.luna, 0.95 * A); ctx.lineWidth = 1.4; ctx.lineJoin = 'round';
            var w = alto * 0.75, b = alto * 0.35;   // patas, etapa de descenso y de ascenso
            ctx.beginPath();
            [-1, 1].forEach(function (sg) {
              ctx.moveTo(x + px * sg * w * 0.45 + ux * b, y + py * sg * w * 0.45 + uy * b); ctx.lineTo(x + px * sg * w * 0.85, y + py * sg * w * 0.85);
              ctx.moveTo(x + px * sg * w * 0.95, y + py * sg * w * 0.95); ctx.lineTo(x + px * sg * w * 0.75, y + py * sg * w * 0.75);
            });
            ctx.stroke();
            ctx.beginPath();   // etapa de descenso
            ctx.moveTo(x + px * w * 0.5 + ux * b, y + py * w * 0.5 + uy * b); ctx.lineTo(x - px * w * 0.5 + ux * b, y - py * w * 0.5 + uy * b);
            ctx.lineTo(x - px * w * 0.5 + ux * alto * 0.62, y - py * w * 0.5 + uy * alto * 0.62); ctx.lineTo(x + px * w * 0.5 + ux * alto * 0.62, y + py * w * 0.5 + uy * alto * 0.62); ctx.closePath();
            ctx.globalAlpha = 0.35; ctx.fill(); ctx.globalAlpha = 1; ctx.stroke();
            ctx.beginPath();   // etapa de ascenso
            ctx.moveTo(x + px * w * 0.32 + ux * alto * 0.62, y + py * w * 0.32 + uy * alto * 0.62); ctx.lineTo(x + px * w * 0.22 + ux * alto, y + py * w * 0.22 + uy * alto);
            ctx.lineTo(x - px * w * 0.3 + ux * alto, y - py * w * 0.3 + uy * alto); ctx.lineTo(x - px * w * 0.36 + ux * alto * 0.62, y - py * w * 0.36 + uy * alto * 0.62);
            ctx.stroke();
            if (baja < 1) FX.brillo(x, y + 2, 14, C.acento, 0.5 * (1 - baja) * A);   // el motor de descenso
          }
          // el polvo al tocar el suelo
          var p = U.tramo(t, 4000, 5600);
          if (p > 0 && p < 1) for (var k = 0; k < 3; k++) {
            var f = U.clamp(p * 1.4 - k * 0.18, 0, 1); if (f <= 0) continue;
            ctx.strokeStyle = U.rgba(C.luna, 0.5 * (1 - f)); ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y, 10 + f * 70, (10 + f * 70) * 0.38, Math.atan2(py, px), 0, TAU); ctx.stroke();
          }
          if (t > 4300) FX.texto('EAGLE · 20.07.1969 · 20:17 UTC', x + ux * alto * 1.5, y + uy * alto * 1.5 - 8, { tam: 10.5, alin: 'center', a: 0.85 * U.tramo(t, 4300, 5000) * sal, espaciado: 1 });
          // las huellas
          var primera = null;
          huellas.forEach(function (hu, i) {
            var f = U.tramo(t, hu.t0, hu.t0 + 260) * sal; if (f <= 0) return;
            E.proy(hu.v, q); E.proy(hu.v2, q2); if (q[2] <= 0) return;
            if (i === 0) primera = [q[0], q[1]];
            ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(Math.atan2(q2[1] - q[1], q2[0] - q[0])); ctx.scale(1, 0.55);
            ctx.fillStyle = U.rgba(C.luna, 0.9 * f); ctx.beginPath(); ctx.ellipse(0, 0, 7, 3.4, 0, 0, TAU); ctx.fill();
            ctx.restore();
          });
          if (primera) {
            var a1 = U.meseta(t, 5100, 5600, 9000, 9800) * sal;
            if (a1 > 0) {
              FX.ondas(primera[0], primera[1], 4, 22, 2, (t - 5000) / 1400, C.acento, 0.8 * a1, 1);
              FX.texto('PRIMER PASO · 21.07.1969 · 02:56 UTC', primera[0] + 14, primera[1] + 18, { tam: 10.5, a: a1, color: C.acento, espaciado: 1 });
            }
          }
          // la bandera
          var bf = U.sale(U.tramo(t, 9200, 10200)) * sal;
          if (bf > 0) {
            E.proy(bandera, q); E.proy(bandera, q2, H_MASTIL * bf);
            if (q[2] > 0) {
              ctx.strokeStyle = U.rgba(C.luna, 0.95 * sal); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(q2[0], q2[1]); ctx.stroke();
              var fw = 30 * bf, fh = 19 * bf;
              ctx.fillStyle = U.rgba(C.luna, 0.22 * sal); ctx.fillRect(q2[0], q2[1], fw, fh);
              ctx.strokeStyle = U.rgba(C.luna, 0.85 * sal); ctx.lineWidth = 1; ctx.strokeRect(q2[0], q2[1], fw, fh);
              ctx.beginPath(); for (var r = 1; r < 4; r++) { ctx.moveTo(q2[0] + fw * 0.4, q2[1] + fh * r / 4); ctx.lineTo(q2[0] + fw, q2[1] + fh * r / 4); } ctx.stroke();
            }
          }
        }
      };
    }
  });
})();
