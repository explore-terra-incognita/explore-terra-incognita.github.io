/* 08 · Código Konami — ↑ ↑ ↓ ↓ ← → ← → B A en el teclado.
   El mundo se pixela en cuatro verdes de consola portátil, una nave de 8 bits le da la vuelta y caen +30 vidas. */
(function () {
  'use strict';
  var TI = window.TI, U = TI.util, FX = TI.fx, C = TI.color, TAU = Math.PI * 2;
  var CODIGO = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
  var PAL = [[15, 56, 15], [48, 98, 48], [139, 172, 15], [155, 188, 15]];   // los cuatro tonos clásicos
  var NAVE = ['....##.....', '...####....', '..##..##...', '###########', '.#########.', '..#.#.#.#..', '...........'];
  var FUENTE = {   // 5×7, solo lo que se escribe
    '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'],
    '3': ['####.', '....#', '...#.', '..##.', '....#', '#...#', '.###.'],
    '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
    'V': ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
    'I': ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'],
    'D': ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
    'A': ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    'S': ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
    '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
    'U': ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    'P': ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
    ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....']
  };
  function pixelTexto(ctx, s, x, y, px, col) {
    ctx.fillStyle = col;
    for (var i = 0; i < s.length; i++) {
      var g = FUENTE[s[i]] || FUENTE[' '];
      for (var f = 0; f < 7; f++) for (var c = 0; c < 5; c++) if (g[f][c] === '#') ctx.fillRect(x + (i * 6 + c) * px, y + f * px, px, px);
    }
  }

  TI.registrar({
    id: 'konami', n: 8, nombre: 'Código Konami', tipo: 'Teclado',
    pista: 'Un código de 1986 que todavía abre puertas: ↑ ↑ ↓ ↓ …',
    detectar: function (api) {
      var pos = 0;
      api.en('tecla', function (d) {
        var k = (d.key || '').toLowerCase();
        if (k === CODIGO[pos]) { pos++; if (pos === CODIGO.length) { pos = 0; api.disparar(); } }
        else pos = k === CODIGO[0] ? 1 : 0;
      });
    },
    escena: function (E) {
      var L = E.lectura;   // tiempo extra para leer la tarjeta (motor.js)
      var marca = null, celdas = null, anchoCel = 0, altoCel = 0, ctxScan = null;
      function lineas(ctx) {   // líneas de barrido, una vez
        if (ctxScan) return ctxScan;
        var c = document.createElement('canvas'); c.width = 4; c.height = 3;
        var x = c.getContext('2d'); x.fillStyle = 'rgba(0,0,0,0.28)'; x.fillRect(0, 2, 4, 1);
        ctxScan = ctx.createPattern(c, 'repeat'); return ctxScan;
      }
      function tamCelda(t) { return Math.round(U.lerp(2, 8, U.sale(U.tramo(t, 300, 1300))) * (1 - U.tramo(t, 9300 + L, 10300 + L)) + 2 * U.tramo(t, 9300 + L, 10300 + L)); }
      return {
        duracion: 10800 + L,
        sinAtmosfera: true,
        tarjeta: {
          en: 3800, hasta: 9300 + L, retro: true,
          titulo: 'CÓDIGO KONAMI',
          texto: '↑ ↑ ↓ ↓ ← → ← → B A. Kazuhisa Hashimoto lo metió en Gradius (1986) para no perder vidas mientras probaba el juego, y se quedó dentro. Desde entonces muchas webs lo esconden. Esta también.',
          pie: '+30 vidas en Contra (1988)'
        },
        inicio: function () { E.camaraZoom(1.08, 900); },
        cuadro: function (t, dt) { E.girarPropio(dt * 0.0005); },
        fondo: function (ctx, t) {
          var a = U.meseta(t, 0, 600, 9600 + L, 10600 + L);
          ctx.fillStyle = U.rgba(PAL[0], 0.55 * a); ctx.fillRect(0, 0, E.W, E.H);
        },
        puntos: function (ctx, t) {
          var a = U.meseta(t, 0, 500, 9700 + L, 10500 + L), cel = tamCelda(t), P = E.P;
          if (a < 0.02) { E.dibujarPuntos(); return; }
          // el disco: océano en el tono más oscuro, a cuadros
          var w = Math.ceil(E.W / cel) + 1, h = Math.ceil(E.H / cel) + 1;
          if (!celdas || anchoCel !== w || altoCel !== h) { celdas = new Uint8Array(w * h); anchoCel = w; altoCel = h; } else celdas.fill(0);
          var R2 = E.R * E.R;
          ctx.fillStyle = U.rgba(PAL[1], a);
          ctx.beginPath();
          var y0 = Math.floor((E.cy - E.R) / cel), y1 = Math.ceil((E.cy + E.R) / cel);
          for (var gy = y0; gy <= y1; gy++) {
            var yy = gy * cel + cel / 2 - E.cy; if (yy * yy > R2) continue;
            var half = Math.sqrt(R2 - yy * yy), x0 = Math.floor((E.cx - half) / cel), x1 = Math.floor((E.cx + half) / cel);
            ctx.rect(x0 * cel, gy * cel, (x1 - x0 + 1) * cel - 1, cel - 1);
          }
          ctx.fill();
          // la tierra: una celda por punto, el tono según la profundidad
          var cub = [new Path2D(), new Path2D()];
          for (var i = 0; i < E.tierra.n; i++) {
            var z = P.tz[i]; if (z < 0.05) continue;
            var cx = Math.floor(P.tx[i] / cel), cy = Math.floor(P.ty[i] / cel); if (cx < 0 || cy < 0 || cx >= w || cy >= h) continue;
            var id = cy * w + cx; if (celdas[id]) continue; celdas[id] = 1;
            cub[z > 0.45 ? 1 : 0].rect(cx * cel, cy * cel, cel - 1, cel - 1);
          }
          ctx.fillStyle = U.rgba(PAL[2], a); ctx.fill(cub[0]);
          ctx.fillStyle = U.rgba(PAL[3], a); ctx.fill(cub[1]);
          // y, por debajo, los puntos de siempre desvaneciéndose
          if (a < 1) E.dibujarPuntos({ alfa: 1 - a });
        },
        frente: function (ctx, t) {
          var a = U.meseta(t, 600, 1200, 9300 + L, 10200 + L);
          if (a > 0) {
            // la nave da vueltas al mundo (pasa por detrás)
            var px = 4, ang = (t - 600) * 0.0012, ex = Math.cos(ang) * E.R * 1.35, ey = Math.sin(ang) * E.R * 0.32, delante = Math.sin(ang) > -0.1;
            var x = Math.round((E.cx + ex) / px) * px, y = Math.round((E.cy + ey - E.R * 0.15) / px) * px;
            var dentroDisco = Math.hypot(x - E.cx, y - E.cy) < E.R;
            if (delante || !dentroDisco) {
              var dir = Math.cos(ang + Math.PI / 2) >= 0 ? 1 : -1;
              ctx.fillStyle = U.rgba(PAL[3], a);
              for (var f = 0; f < NAVE.length; f++) for (var c = 0; c < NAVE[f].length; c++) if (NAVE[f][c] === '#') ctx.fillRect(x + (dir > 0 ? c : 10 - c) * px - 22, y + f * px - 14, px, px);
              // disparos
              for (var b = 0; b < 3; b++) { var fb = ((t * 0.002) + b / 3) % 1; ctx.fillRect(x + dir * (30 + fb * 120) - 2, y - 2, 6, 2); }
            }
            // +30 VIDAS
            var v = U.tramo(t, 1600, 2000), sube = Math.sin(t * 0.008) * 3;
            if (v > 0) {
              var pt = 5, texto = '+30 VIDAS', ancho = texto.length * 6 * pt;
              pixelTexto(ctx, texto, Math.round((E.cx - ancho / 2) / pt) * pt, Math.round((E.cy - E.R - 70 + sube) / pt) * pt, pt, U.rgba(PAL[3], a * v));
              pixelTexto(ctx, '1UP', Math.round((E.cx + E.R * 0.9) / 3) * 3, Math.round((E.cy + E.R * 0.8) / 3) * 3, 3, U.rgba(PAL[2], a * v * (Math.sin(t * 0.01) > 0 ? 1 : 0.3)));
            }
          }
          var s = U.meseta(t, 0, 500, 9800 + L, 10600 + L);
          if (s > 0) { ctx.globalAlpha = s; ctx.fillStyle = lineas(ctx); ctx.fillRect(0, 0, E.W, E.H); ctx.globalAlpha = 1; }
        }
      };
    }
  });
})();
