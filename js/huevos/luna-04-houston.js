/* Luna 04 · Houston — escribir «houston» en el teclado.
   Esquema (no a escala) de la trayectoria de retorno libre del Apolo 13: sale de la Tierra, explota el tanque de oxígeno,
   rodea la Luna sin aterrizar (récord de distancia) y vuelve a casa. */
(function () {
  'use strict';
  var TI = window.TI, U = TI.util, FX = TI.fx, C = TI.color, TAU = Math.PI * 2;
  var PALABRA = 'houston', FUEGO = [255, 168, 92];

  function bezier(p0, p1, p2, p3, n, o) {
    for (var i = 1; i <= n; i++) {
      var t = i / n, u = 1 - t;
      o.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]);
    }
  }

  TI.registrar({
    id: 'houston', n: 4, mundo: 'luna', nombre: 'Houston', tipo: 'Teclado',
    pista: 'La palabra que todo el mundo dice cuando algo sale mal en el espacio.',
    detectar: function (api) {
      var buf = '';
      api.en('tecla', function (d) {
        if (!d.key || d.key.length !== 1) return;
        buf = (buf + d.key.toLowerCase()).slice(-PALABRA.length);
        if (buf === PALABRA) { buf = ''; api.disparar(); }
      });
    },
    escena: function (E) {
      var L = E.lectura, camino = null, largos = null, total = 0, iRecord = 0;
      // la trayectoria en ocho: ida por arriba hasta abajo a la izquierda de la Luna, vuelta alrededor por detrás y regreso por abajo
      function trazar() {
        var ex = E.W * 0.15, ey = E.cy, er = 24, mx = E.cx, my = E.cy, R = E.R;
        var A = [mx - R * 1.3, my - R * 0.95], B = [mx - R * 1.3, my + R * 0.95], o = [[ex + er * 0.7, ey - er * 0.7]];
        bezier(o[0], [ex + (mx - ex) * 0.4, ey - E.H * 0.24], [mx - R * 2.4, my + R * 0.1], B, 60, o);
        var a0 = Math.atan2(B[1] - my, B[0] - mx), a1 = Math.atan2(A[1] - my, A[0] - mx) - TAU, rr = Math.hypot(B[0] - mx, B[1] - my);
        var mejor = -1;
        for (var i = 1; i <= 90; i++) {
          var a = a0 + (a1 - a0) * i / 90; o.push([mx + Math.cos(a) * rr * (1 + 0.12 * Math.sin(Math.PI * i / 90)), my + Math.sin(a) * rr * (1 + 0.12 * Math.sin(Math.PI * i / 90))]);
          if (o[o.length - 1][0] > mejor) { mejor = o[o.length - 1][0]; iRecord = o.length - 1; }
        }
        bezier(A, [mx - R * 2.4, my - R * 0.1], [ex + (mx - ex) * 0.4, ey + E.H * 0.24], [ex + er * 0.7, ey + er * 0.7], 60, o);
        largos = [0]; total = 0;
        for (var j = 1; j < o.length; j++) { total += Math.hypot(o[j][0] - o[j - 1][0], o[j][1] - o[j - 1][1]); largos.push(total); }
        camino = o;
      }
      function puntoEn(f) {
        var objetivo = f * total, i = 1; while (i < largos.length - 1 && largos[i] < objetivo) i++;
        var k = (objetivo - largos[i - 1]) / ((largos[i] - largos[i - 1]) || 1);
        return [U.lerp(camino[i - 1][0], camino[i][0], k), U.lerp(camino[i - 1][1], camino[i][1], k), i];
      }
      function avance(t) { return U.inOut(U.tramo(t, 1800, 11500)); }
      // x de un texto centrado sin que se salga de la pantalla
      function dentro(texto, x, tam) {
        var ctx = E.ctx; ctx.font = '600 ' + tam + 'px "IBM Plex Mono", ui-monospace, Menlo, monospace';
        var w = ctx.measureText(texto).width / 2 + texto.length * 0.6 + 10;
        return U.clamp(x, w, E.W - w);
      }
      return {
        duracion: 14000 + L,
        centrado: true,
        sinTierraFondo: true,
        tarjeta: {
          en: 5600, hasta: 12600 + L,
          titulo: 'Houston',
          texto: '«Houston, tenemos un problema» es la frase de la película. En el Apolo 13, en abril de 1970, dijeron «Houston, hemos tenido un problema»: había explotado un tanque de oxígeno camino de la Luna. Sin poder aterrizar, la rodearon para volver, y sus tres tripulantes llegaron más lejos de la Tierra que nadie: ' + U.num(400171) + ' km. Volvieron sanos.',
          pie: 'Apolo 13 · 11–17.04.1970'
        },
        // en pantallas estrechas, más pequeño y más arriba (la tarjeta ocupa la mitad de abajo)
        inicio: function () { var estrecha = E.W < 700; E.camara(4, 8, estrecha ? 0.27 : 0.42, 1800, 0, null, estrecha ? -E.H * 0.2 : 0); },
        cuadro: function (t) { E.desplEscena = E.W * (E.W < 700 ? 0.17 : 0.2); },
        fondo: function (ctx, t) {
          var a = U.meseta(t, 600, 1600, 12600 + L, 13800 + L); if (a <= 0) return;
          E.dibujarTierra(E.W * 0.15, E.cy, 24, { alfa: a });
          FX.texto('TIERRA', E.W * 0.15, E.cy + 42, { tam: 10.5, alin: 'center', a: 0.6 * a, espaciado: 2 });
        },
        frente: function (ctx, t) {
          var a = U.meseta(t, 1200, 2000, 12600 + L, 13800 + L); if (a <= 0) return;
          trazar();
          var f = avance(t), p = puntoEn(f);
          // todo el camino, tenue y a trazos; lo recorrido, en el color de acento
          ctx.setLineDash([2, 5]); ctx.strokeStyle = U.rgba(C.luna, 0.25 * a); ctx.lineWidth = 1; ctx.beginPath();
          camino.forEach(function (c, i) { if (i) ctx.lineTo(c[0], c[1]); else ctx.moveTo(c[0], c[1]); }); ctx.stroke(); ctx.setLineDash([]);
          ctx.strokeStyle = U.rgba(C.acento, 0.85 * a); ctx.lineWidth = 1.4; ctx.beginPath();
          for (var i = 0; i < p[2]; i++) { if (i) ctx.lineTo(camino[i][0], camino[i][1]); else ctx.moveTo(camino[i][0], camino[i][1]); }
          ctx.lineTo(p[0], p[1]); ctx.stroke();
          FX.brillo(p[0], p[1], 12, C.acento, 0.7 * a);
          ctx.fillStyle = U.rgba(C.luna, a); ctx.beginPath(); ctx.arc(p[0], p[1], 2.4, 0, TAU); ctx.fill();
          // la explosión, a mitad del viaje de ida
          var fx = puntoEn(0.24), ex = U.meseta(t, 5500, 5800, 8600, 9600);
          if (f > 0.23 && ex > 0) {
            FX.brillo(fx[0], fx[1], 18 + 40 * U.sale(U.tramo(t, 5500, 6300)), FUEGO, 0.75 * ex);
            var t1 = '«HOUSTON, HEMOS TENIDO UN PROBLEMA»', t2 = '13.04.1970, HORA DE HOUSTON · TANQUE DE OXÍGENO 2';
            FX.texto(t1, dentro(t1, fx[0], 11), fx[1] - 28, { tam: 11, alin: 'center', a: ex, color: FUEGO, espaciado: 1, peso: 600 });
            FX.texto(t2, dentro(t2, fx[0], 10), fx[1] - 12, { tam: 10, alin: 'center', a: 0.65 * ex, espaciado: 1 });
          }
          // el punto más lejano
          var rec = camino[iRecord], ar = U.meseta(t, 6600, 7200, 12600 + L, 13800 + L);
          if (ar > 0 && p[2] >= iRecord) {
            FX.marca(rec[0], rec[1], U.num(400171) + ' KM · RÉCORD', ar, C.acento, rec[0] + 170 > E.W ? 'izq' : 'der');
          }
          var vuelta = U.tramo(t, 11000, 11800);
          if (vuelta > 0) FX.texto('17.04.1970 · AMERIZAJE', E.W * 0.15, E.cy - 44, { tam: 10.5, alin: 'center', a: vuelta * a, color: C.acento, espaciado: 1 });
          FX.texto('ESQUEMA · NO A ESCALA', E.W - 40, E.H - 60, { tam: 10, alin: 'right', a: 0.4 * a, espaciado: 2 });
        }
      };
    }
  });
})();
