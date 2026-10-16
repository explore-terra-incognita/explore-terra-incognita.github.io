/* Terra Incognita · motor
   El globo de puntos, la cámara, la entrada (ratón, táctil, teclado) y las escenas de los secretos.
   Todo se dibuja en píxeles CSS: el lienzo se escala con devicePixelRatio. */
(function () {
  'use strict';
  var TI = window.TI = window.TI || {};
  var D2R = Math.PI / 180, R2D = 180 / Math.PI, TAU = Math.PI * 2;

  /* ------------------------------------------------------------------ utilidades */
  var U = TI.util = {
    clamp: function (x, a, b) { return x < a ? a : x > b ? b : x; },
    lerp: function (a, b, t) { return a + (b - a) * t; },
    tramo: function (t, a, b) { return U.clamp((t - a) / (b - a), 0, 1); },
    suave: function (t) { t = U.clamp(t, 0, 1); return t * t * (3 - 2 * t); },
    entra: function (t) { t = U.clamp(t, 0, 1); return t * t * t; },
    sale: function (t) { t = U.clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); },
    inOut: function (t) { t = U.clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
    rebote: function (t) { t = U.clamp(t, 0, 1); var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    // sube y baja: 0 fuera de [a, d], 1 entre b y c
    meseta: function (t, a, b, c, d) { return t < a || t > d ? 0 : t < b ? U.suave((t - a) / (b - a)) : t > c ? 1 - U.suave((t - c) / (d - c)) : 1; },
    azar: function (semilla) {
      var s = (semilla | 0) || 1;
      return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
    },
    rgba: function (c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a < 0 ? 0 : a > 1 ? 1 : a).toFixed(3) + ')'; },
    mezcla: function (a, b, t) { return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)]; },
    // números a la española: 12.742 · 13,7
    num: function (x, dec) {
      var s = Math.abs(x).toFixed(dec || 0).split('.'), ent = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return (x < 0 ? '−' : '') + ent + (s[1] ? ',' + s[1] : '');
    },
    dos: function (n) { return (n < 10 ? '0' : '') + n; }
  };

  TI.color = {
    fondo: [9, 9, 10],
    hueso: [236, 230, 214],
    mar: [118, 132, 152],
    acento: [212, 255, 62],
    tenue: [140, 136, 128]
  };
  var C = TI.color;

  /* ------------------------------------------------------------------ matrices y cuaterniones
     M (3×3, por filas) lleva del cuerpo de la Tierra a la vista: X derecha, Y arriba, Z hacia ti. */
  var Mx = TI.mat = {
    id: function () { return [1, 0, 0, 0, 1, 0, 0, 0, 1]; },
    mul: function (a, b) {
      return [
        a[0] * b[0] + a[1] * b[3] + a[2] * b[6], a[0] * b[1] + a[1] * b[4] + a[2] * b[7], a[0] * b[2] + a[1] * b[5] + a[2] * b[8],
        a[3] * b[0] + a[4] * b[3] + a[5] * b[6], a[3] * b[1] + a[4] * b[4] + a[5] * b[7], a[3] * b[2] + a[4] * b[5] + a[5] * b[8],
        a[6] * b[0] + a[7] * b[3] + a[8] * b[6], a[6] * b[1] + a[7] * b[4] + a[8] * b[7], a[6] * b[2] + a[7] * b[5] + a[8] * b[8]
      ];
    },
    tr: function (a) { return [a[0], a[3], a[6], a[1], a[4], a[7], a[2], a[5], a[8]]; },
    // giro de ángulo «ang» alrededor del eje unitario (x, y, z)
    eje: function (x, y, z, ang) {
      var c = Math.cos(ang), s = Math.sin(ang), t = 1 - c;
      return [t * x * x + c, t * x * y - s * z, t * x * z + s * y,
              t * x * y + s * z, t * y * y + c, t * y * z - s * x,
              t * x * z - s * y, t * y * z + s * x, t * z * z + c];
    },
    ortonormal: function (m) {
      var a = [m[0], m[1], m[2]], b = [m[3], m[4], m[5]];
      var la = Math.hypot(a[0], a[1], a[2]); a = [a[0] / la, a[1] / la, a[2] / la];
      var d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; b = [b[0] - d * a[0], b[1] - d * a[1], b[2] - d * a[2]];
      var lb = Math.hypot(b[0], b[1], b[2]); b = [b[0] / lb, b[1] / lb, b[2] / lb];
      return [a[0], a[1], a[2], b[0], b[1], b[2],
              a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    },
    // la vista que pone (lat, lon) delante, con el norte arriba; «alto» lo sube en pantalla (−0,9…0,9 radios)
    mirando: function (lat, lon, alto) {
      var f = TI.geo.vec(lat, lon), e;
      if (Math.abs(lat) > 89.9) { var o = lon * D2R; e = [Math.cos(o), 0, -Math.sin(o)]; }
      else { e = [f[2], 0, -f[0]]; var l = Math.hypot(e[0], e[2]); e = [e[0] / l, 0, e[2] / l]; }
      var u = [f[1] * e[2] - f[2] * e[1], f[2] * e[0] - f[0] * e[2], f[0] * e[1] - f[1] * e[0]];
      var m = [e[0], e[1], e[2], u[0], u[1], u[2], f[0], f[1], f[2]];
      if (alto) m = Mx.mul(Mx.eje(1, 0, 0, -Math.asin(U.clamp(alto, -0.95, 0.95))), m);
      return m;
    },
    aQuat: function (m) {
      var tr = m[0] + m[4] + m[8], s, w, x, y, z;
      if (tr > 0) { s = Math.sqrt(tr + 1) * 2; w = 0.25 * s; x = (m[7] - m[5]) / s; y = (m[2] - m[6]) / s; z = (m[3] - m[1]) / s; }
      else if (m[0] > m[4] && m[0] > m[8]) { s = Math.sqrt(1 + m[0] - m[4] - m[8]) * 2; w = (m[7] - m[5]) / s; x = 0.25 * s; y = (m[1] + m[3]) / s; z = (m[2] + m[6]) / s; }
      else if (m[4] > m[8]) { s = Math.sqrt(1 + m[4] - m[0] - m[8]) * 2; w = (m[2] - m[6]) / s; x = (m[1] + m[3]) / s; y = 0.25 * s; z = (m[5] + m[7]) / s; }
      else { s = Math.sqrt(1 + m[8] - m[0] - m[4]) * 2; w = (m[3] - m[1]) / s; x = (m[2] + m[6]) / s; y = (m[5] + m[7]) / s; z = 0.25 * s; }
      return [w, x, y, z];
    },
    deQuat: function (q) {
      var w = q[0], x = q[1], y = q[2], z = q[3];
      return [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w),
              2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w),
              2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)];
    },
    slerp: function (a, b, t) {
      var d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
      if (d < 0) { b = [-b[0], -b[1], -b[2], -b[3]]; d = -d; }
      if (d > 0.9995) {
        var r = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t];
        var l = Math.hypot(r[0], r[1], r[2], r[3]); return [r[0] / l, r[1] / l, r[2] / l, r[3] / l];
      }
      var th = Math.acos(d), s = Math.sin(th), k0 = Math.sin((1 - t) * th) / s, k1 = Math.sin(t * th) / s;
      return [a[0] * k0 + b[0] * k1, a[1] * k0 + b[1] * k1, a[2] * k0 + b[2] * k1, a[3] * k0 + b[3] * k1];
    }
  };

  /* ------------------------------------------------------------------ geografía
     Un punto (lat, lon) es el vector x = cos·sen(lon), y = sen(lat), z = cos·cos(lon): (0°, 0°) mira hacia ti. */
  var DAT = window.TI_DATOS;
  function bits(b64, n) {
    var s = atob(b64), o = new Uint8Array(n);
    for (var i = 0; i < n; i++) o[i] = (s.charCodeAt(i >> 3) >> (7 - (i & 7))) & 1;
    return o;
  }
  var MASCARA = bits(DAT.mascara.bits, DAT.mascara.ancho * DAT.mascara.alto);

  var G = TI.geo = {
    KM_GRADO: 111.195, RADIO_KM: 6371,
    vec: function (lat, lon, o) {
      var a = lat * D2R, b = lon * D2R, c = Math.cos(a); o = o || [0, 0, 0];
      o[0] = c * Math.sin(b); o[1] = Math.sin(a); o[2] = c * Math.cos(b); return o;
    },
    latlon: function (x, y, z) {
      var l = Math.sqrt(x * x + y * y + z * z) || 1;
      return [Math.asin(U.clamp(y / l, -1, 1)) * R2D, Math.atan2(x, z) * R2D];
    },
    // distancia en grados de arco
    dist: function (la1, lo1, la2, lo2) {
      var a = G.vec(la1, lo1), b = G.vec(la2, lo2);
      return Math.acos(U.clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1)) * R2D;
    },
    // la espiral de Fibonacci: la misma fórmula que herramientas/generar_puntos.py
    fibonacci: function (n) {
      var o = new Float32Array(n * 3), dor = Math.PI * (3 - Math.sqrt(5));
      for (var i = 0; i < n; i++) {
        var y = 1 - (i + 0.5) * 2 / n, r = Math.sqrt(1 - y * y), t = i * dor;
        o[i * 3] = Math.cos(t) * r; o[i * 3 + 1] = y; o[i * 3 + 2] = Math.sin(t) * r;
      }
      return o;
    },
    esTierra: function (lat, lon) {
      var w = DAT.mascara.ancho, h = DAT.mascara.alto;
      var c = Math.floor(((lon + 180) % 360 + 360) % 360 / 360 * w), f = U.clamp(Math.floor((90 - lat) / 180 * h), 0, h - 1);
      return MASCARA[f * w + c] === 1;
    },
    antipoda: function (lat, lon) { return [-lat, lon > 0 ? lon - 180 : lon + 180]; },
    texto: function (lat, lon) {
      return U.num(Math.abs(lat), 2) + '° ' + (lat >= 0 ? 'N' : 'S') + '  ' + U.num(Math.abs(lon), 2) + '° ' + (lon >= 0 ? 'E' : 'O');
    },
    gms: function (lat, lon) {
      var f = function (v) { v = Math.abs(v); var g = Math.floor(v), m = Math.round((v - g) * 60); if (m === 60) { g++; m = 0; } return g + '°' + U.dos(m) + '′'; };
      return f(lat) + ' ' + (lat >= 0 ? 'N' : 'S') + ' · ' + f(lon) + ' ' + (lon >= 0 ? 'E' : 'O');
    },
    // el punto donde el Sol está en el cénit ahora mismo (fórmula del Almanaque Náutico, ±0,1°)
    sol: function (fecha) {
      var n = (fecha || new Date()).getTime() / 86400000 + 2440587.5 - 2451545.0;
      var L = (280.460 + 0.9856474 * n) % 360, g = ((357.528 + 0.9856003 * n) % 360) * D2R;
      var lam = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * D2R, eps = (23.439 - 0.0000004 * n) * D2R;
      var dec = Math.asin(Math.sin(eps) * Math.sin(lam)), ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam));
      var gmst = (280.46061837 + 360.98564736629 * n) % 360;
      var lon = ((ra * R2D - gmst) % 360 + 540) % 360 - 180;
      return [dec * R2D, lon];
    }
  };

  // tierra y mar: solo los puntos que tocan
  function filtrar(n, b64, quiero) {
    var todos = G.fibonacci(n), b = bits(b64, n), cuenta = 0, i;
    for (i = 0; i < n; i++) if (b[i] === quiero) cuenta++;
    var o = new Float32Array(cuenta * 3), k = 0;
    for (i = 0; i < n; i++) if (b[i] === quiero) { o[k++] = todos[i * 3]; o[k++] = todos[i * 3 + 1]; o[k++] = todos[i * 3 + 2]; }
    return o;
  }
  var TIERRA = filtrar(DAT.tierra.n, DAT.tierra.bits, 1), NT = TIERRA.length / 3;
  var MAR = filtrar(DAT.mar.n, DAT.mar.bits, 1), NM = MAR.length / 3;

  /* ------------------------------------------------------------------ el motor */
  var E = TI.motor = {
    t: 0, W: 800, H: 600, dpr: 1, cx: 400, cy: 300, R: 280, Rbase: 280,
    zoom: 1, zoomMin: 0.5, zoomMax: 3.4, desplX: 0, desplObjetivo: 0, desplEscena: 0, desplY: 0, subida: 0,
    rot: Mx.mirando(24, -28), est: Mx.id(),
    vel: { x: 0, y: 1, z: 0, w: 0 },       // inercia: eje en la vista y rad/ms
    arrastre: null,
    puntero: { x: -999, y: -999, dentro: false, lat: 0, lon: 0, sobre: false, tipo: 'mouse' },
    senal: 0, lenteOculta: false, cursorOculto: false,
    escena: null, bloqueado: false, ligero: false,
    ultimoInput: 0, giroAuto: 0, estela: 0, compresion: 0,
    tierra: { n: NT, xyz: TIERRA }, mar: { n: NM, xyz: MAR },
    P: {
      tx: new Float32Array(NT), ty: new Float32Array(NT), tz: new Float32Array(NT),
      mx: new Float32Array(NM), my: new Float32Array(NM), mz: new Float32Array(NM),
      px: new Float32Array(NT), py: new Float32Array(NT)   // fotograma anterior (estelas)
    },
    capas: [],      // dibujos de ambiente de los secretos (fuera de escena)
    oyentes: {}
  };
  var cv, ctx, raf = window.requestAnimationFrame.bind(window), ultimoRaf = null, congelado = false;
  var cam = null, historialGiro = [], cuadros = 0, mediaDt = 16, nMedidos = 0, saltarDibujo = false;
  var tiempoCarga = performance.now();

  E.en = function (nombre, fn) { (E.oyentes[nombre] = E.oyentes[nombre] || []).push(fn); };
  function emitir(nombre, d) {
    var l = E.oyentes[nombre]; if (!l) return;
    for (var i = 0; i < l.length; i++) { try { l[i](d); } catch (err) { console.error(err); } }
  }
  E.emitir = emitir;
  E.segundosDesdeCarga = function () { return (performance.now() - tiempoCarga) / 1000; };

  /* ---------- proyección ---------- */
  E.proy = function (v, o, h) {  // v en el cuerpo (h: altura sobre la superficie, en radios)
    var m = E.rot, k = 1 + (h || 0); o = o || [0, 0, 0];
    var x = m[0] * v[0] + m[1] * v[1] + m[2] * v[2], y = m[3] * v[0] + m[4] * v[1] + m[5] * v[2], z = m[6] * v[0] + m[7] * v[1] + m[8] * v[2];
    o[0] = E.cx + x * E.R * k; o[1] = E.cy - y * E.R * k; o[2] = z; o[3] = Math.sqrt(x * x + y * y) * k;  // o[3] > 1: fuera del disco
    return o;
  };
  E.proyLL = function (lat, lon, o, h) { return E.proy(G.vec(lat, lon), o, h); };
  E.visible = function (o) { return o[2] > 0 || o[3] > 1; };
  E.pantallaA = function (sx, sy) {
    var x = (sx - E.cx) / E.R, y = -(sy - E.cy) / E.R, d = x * x + y * y;
    if (d > 1) return null;
    var z = Math.sqrt(1 - d), m = E.rot;   // cuerpo = Mᵀ · vista
    return G.latlon(m[0] * x + m[3] * y + m[6] * z, m[1] * x + m[4] * y + m[7] * z, m[2] * x + m[5] * y + m[8] * z);
  };
  E.centro = function () { var m = E.rot; return G.latlon(m[6], m[7], m[8]); };
  // ¿el clic d cae en (lat, lon)? a menos de «grados» o, si se ve, a menos de «px» en pantalla
  E.cercaDe = function (d, lat, lon, grados, px) {
    if (!d || !d.dentro) return false;
    if (G.dist(d.lat, d.lon, lat, lon) <= grados) return true;
    var o = E.proyLL(lat, lon); return o[2] > 0 && Math.hypot(o[0] - d.x, o[1] - d.y) <= (px || 0);
  };

  function proyectar() {
    var m = E.rot, R = E.R, cx = E.cx, cy = E.cy, P = E.P, i, x, y, z;
    var m0 = m[0], m1 = m[1], m2 = m[2], m3 = m[3], m4 = m[4], m5 = m[5], m6 = m[6], m7 = m[7], m8 = m[8];
    for (i = 0; i < NT; i++) {
      x = TIERRA[i * 3]; y = TIERRA[i * 3 + 1]; z = TIERRA[i * 3 + 2];
      P.tx[i] = cx + (m0 * x + m1 * y + m2 * z) * R; P.ty[i] = cy - (m3 * x + m4 * y + m5 * z) * R; P.tz[i] = m6 * x + m7 * y + m8 * z;
    }
    for (i = 0; i < NM; i++) {
      x = MAR[i * 3]; y = MAR[i * 3 + 1]; z = MAR[i * 3 + 2];
      P.mx[i] = cx + (m0 * x + m1 * y + m2 * z) * R; P.my[i] = cy - (m3 * x + m4 * y + m5 * z) * R; P.mz[i] = m6 * x + m7 * y + m8 * z;
    }
  }

  /* ---------- cámara ---------- */
  // dy: cuánto baja el centro del globo en pantalla (px), para encuadres con el globo medio fuera
  E.camara = function (lat, lon, zoom, dur, alto, ease, dy) { E.camaraM(Mx.mirando(lat, lon, alto || 0), zoom, dur, ease, dy); };
  E.camaraM = function (M1, zoom, dur, ease, dy) {
    cam = { q0: Mx.aQuat(E.rot), q1: Mx.aQuat(M1), z0: E.zoom, z1: zoom == null ? E.zoom : zoom, t0: E.t, dur: dur || 1200, ease: ease || U.inOut, y0: E.desplY, y1: dy || 0 };
    E.vel.w = 0;
  };
  E.camaraZoom = function (zoom, dur) { E.camaraM(E.rot, zoom, dur); };
  E.camaraActiva = function () { return !!cam; };
  function cambiarRot(nueva) {  // las estrellas acompañan los giros de cámara (no el giro propio)
    E.est = Mx.mul(Mx.mul(nueva, Mx.tr(E.rot)), E.est);
    E.rot = nueva;
  }
  E.girarVista = function (ax, ay, az, ang) {  // giro en ejes de la vista (como un arrastre)
    var g = Mx.eje(ax, ay, az, ang); E.rot = Mx.mul(g, E.rot); E.est = Mx.mul(g, E.est);
  };
  E.girarPropio = function (ang) { E.rot = Mx.mul(E.rot, Mx.eje(0, 1, 0, ang)); };

  /* ---------- tamaño ---------- */
  function medir() {
    var w = window.innerWidth, h = window.innerHeight;
    E.W = w; E.H = h;
    E.dpr = E.ligero ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(w * E.dpr); cv.height = Math.round(h * E.dpr);
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
    var corto = Math.min(w, h);
    E.Rbase = w < 640 ? corto * 0.43 : corto * 0.345;
  }

  /* ---------- estrellas ---------- */
  var ESTRELLAS = (function () {
    var r = U.azar(7), n = 520, o = [];
    for (var i = 0; i < n; i++) {
      var u = r() * 2 - 1, t = r() * TAU, s = Math.sqrt(1 - u * u);
      o.push([Math.cos(t) * s, u, Math.sin(t) * s, Math.pow(r(), 3), r() * TAU]);
    }
    return o;
  })();
  E.brilloEstrellas = 1;
  function dibujarEstrellas() {
    var m = E.est, F = Math.max(E.W, E.H) * 0.62, cx = E.cx, cy = E.cy, R2 = Math.pow(E.R * 1.02, 2), tt = E.t * 0.001;
    var capas = [[], [], []];
    for (var i = 0; i < ESTRELLAS.length; i++) {
      var s = ESTRELLAS[i], x = m[0] * s[0] + m[1] * s[1] + m[2] * s[2], y = m[3] * s[0] + m[4] * s[1] + m[5] * s[2], z = m[6] * s[0] + m[7] * s[1] + m[8] * s[2];
      if (z > -0.18) continue;
      var sx = cx + x / -z * F, sy = cy - y / -z * F;
      if (sx < -4 || sy < -4 || sx > E.W + 4 || sy > E.H + 4) continue;
      var dx = sx - cx, dy = sy - cy; if (dx * dx + dy * dy < R2) continue;
      var b = s[3] * (0.75 + 0.25 * Math.sin(tt * 1.3 + s[4]));
      capas[b > 0.45 ? 2 : b > 0.12 ? 1 : 0].push(sx, sy);
    }
    var al = [0.28, 0.5, 0.85], ra = [0.5, 0.75, 1.1];
    for (var k = 0; k < 3; k++) {
      var L = capas[k]; if (!L.length) continue;
      ctx.fillStyle = U.rgba(C.hueso, al[k] * E.brilloEstrellas); ctx.beginPath();
      for (var j = 0; j < L.length; j += 2) { ctx.moveTo(L[j] + ra[k], L[j + 1]); ctx.arc(L[j], L[j + 1], ra[k], 0, TAU); }
      ctx.fill();
    }
  }

  /* ---------- atmósfera ---------- */
  E.dibujarAtmosfera = function (alfa) {
    alfa = alfa == null ? 1 : alfa;
    var R = E.R, g = ctx.createRadialGradient(E.cx, E.cy, R * 0.92, E.cx, E.cy, R * 1.32);
    g.addColorStop(0, U.rgba(C.hueso, 0.05 * alfa)); g.addColorStop(0.18, U.rgba(C.hueso, 0.035 * alfa)); g.addColorStop(1, U.rgba(C.hueso, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(E.cx, E.cy, R * 1.32, 0, TAU); ctx.fill();
    // el disco, un pelo más oscuro que el fondo, y su borde
    ctx.fillStyle = 'rgba(0,0,0,' + (0.35 * alfa).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(E.cx, E.cy, R, 0, TAU); ctx.fill();
    ctx.strokeStyle = U.rgba(C.hueso, 0.13 * alfa); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(E.cx, E.cy, R + 0.5, 0, TAU); ctx.stroke();
  };

  /* ---------- puntos ---------- */
  var BANDAS = [0.2, 0.42, 0.68], A_T = [0.2, 0.4, 0.64, 0.93], F_T = [0.6, 0.72, 0.86, 1], A_M = [0.08, 0.13, 0.19, 0.27];
  var cubos = [], cubosM = [], cuboDorso = new Float32Array(NT * 2), cuboLente = [new Float32Array(NT * 3), new Float32Array(NT * 3)], cuboLenteM = new Float32Array(NM * 3);
  for (var b = 0; b < 4; b++) { cubos.push(new Float32Array(NT * 2)); cubosM.push(new Float32Array(NM * 2)); }
  E.radioPunto = function () { return U.clamp(E.R * 0.0045, 0.55, 3.6); };

  /* op: alfa, tierra (color), mar (color), conMar, dorso (alfa de los puntos de detrás), escala, lente */
  E.dibujarPuntos = function (op) {
    op = op || {};
    var P = E.P, alfa = op.alfa == null ? 1 : op.alfa, colT = op.tierra || C.hueso, colM = op.mar || C.mar;
    var rT = E.radioPunto() * (op.escala || 1), rM = rT * 0.5, conMar = op.conMar !== false && !(E.ligero && E.R < 200);
    var lente = op.lente && E.puntero.dentro && !E.arrastre && !E.lenteOculta;
    var px = E.puntero.x, py = E.puntero.y, L = 78, L2 = L * L, i, k, n = [0, 0, 0, 0], nm = [0, 0, 0, 0], nd = 0, nl = [0, 0], nlm = 0;
    // estela: si gira deprisa, cada punto deja una raya desde donde estaba
    if (E.estela > 0.02 && !E.escena) {
      ctx.strokeStyle = U.rgba(colT, 0.35 * E.estela * alfa); ctx.lineWidth = rT * 1.2; ctx.lineCap = 'round'; ctx.beginPath();
      for (i = 0; i < NT; i += 2) if (P.tz[i] > 0.15) { ctx.moveTo(P.px[i], P.py[i]); ctx.lineTo(P.tx[i], P.ty[i]); }
      ctx.stroke();
    }
    if (conMar) {
      for (i = 0; i < NM; i++) {
        var zm = P.mz[i]; if (zm <= 0.02) continue;
        if (lente) { var dxm = P.mx[i] - px, dym = P.my[i] - py, dm = dxm * dxm + dym * dym; if (dm < L2) { var um = Math.sqrt(dm) / L; cuboLenteM[nlm++] = px + dxm * (1 + 0.6 * (1 - um)); cuboLenteM[nlm++] = py + dym * (1 + 0.6 * (1 - um)); cuboLenteM[nlm++] = 1 - um; continue; } }
        k = zm < BANDAS[0] ? 0 : zm < BANDAS[1] ? 1 : zm < BANDAS[2] ? 2 : 3; cubosM[k][nm[k]++] = P.mx[i]; cubosM[k][nm[k]++] = P.my[i];
      }
      for (k = 0; k < 4; k++) {
        if (!nm[k]) continue; var L0 = cubosM[k], s = rM * (0.7 + 0.1 * k) * 2;
        ctx.fillStyle = U.rgba(colM, A_M[k] * alfa); ctx.beginPath();
        for (var j = 0; j < nm[k]; j += 2) ctx.rect(L0[j] - s / 2, L0[j + 1] - s / 2, s, s);
        ctx.fill();
      }
    }
    for (i = 0; i < (op.sinTierra ? 0 : NT); i++) {
      var z = P.tz[i];
      if (z <= 0.02) { if (op.dorso && z < -0.02) { cuboDorso[nd++] = P.tx[i]; cuboDorso[nd++] = P.ty[i]; } continue; }
      if (lente) {
        var dx = P.tx[i] - px, dy = P.ty[i] - py, d2 = dx * dx + dy * dy;
        if (d2 < L2) { var u = Math.sqrt(d2) / L, q = u < 0.45 ? 0 : 1, c = cuboLente[q]; c[nl[q]++] = px + dx * (1 + 0.6 * (1 - u)); c[nl[q]++] = py + dy * (1 + 0.6 * (1 - u)); c[nl[q]++] = (1 - u) * z; continue; }
      }
      k = z < BANDAS[0] ? 0 : z < BANDAS[1] ? 1 : z < BANDAS[2] ? 2 : 3; cubos[k][n[k]++] = P.tx[i]; cubos[k][n[k]++] = P.ty[i];
    }
    if (nd) {  // la cara de detrás, como en una radiografía
      ctx.fillStyle = U.rgba(colT, op.dorso * alfa); ctx.beginPath(); var sd = rT * 1.1;
      for (var jd = 0; jd < nd; jd += 2) ctx.rect(cuboDorso[jd] - sd / 2, cuboDorso[jd + 1] - sd / 2, sd, sd);
      ctx.fill();
    }
    for (k = 0; k < 4; k++) {
      if (!n[k]) continue; var LL = cubos[k], r = rT * F_T[k];
      ctx.fillStyle = U.rgba(colT, A_T[k] * alfa); ctx.beginPath();
      for (var jj = 0; jj < n[k]; jj += 2) { ctx.moveTo(LL[jj] + r, LL[jj + 1]); ctx.arc(LL[jj], LL[jj + 1], r, 0, TAU); }
      ctx.fill();
    }
    if (lente) {
      // la lupa: el mar se ve, la tierra crece y, cerca de un secreto, se tiñe del color de acento
      var tinte = U.mezcla(C.hueso, C.acento, Math.pow(E.senal, 1.3));
      if (nlm) {
        ctx.fillStyle = U.rgba(U.mezcla(C.mar, C.acento, Math.pow(E.senal, 1.3)), 0.55 * alfa); ctx.beginPath();
        for (var jm = 0; jm < nlm; jm += 3) { var rr = rM * (1.2 + 1.6 * cuboLenteM[jm + 2]); ctx.moveTo(cuboLenteM[jm] + rr, cuboLenteM[jm + 1]); ctx.arc(cuboLenteM[jm], cuboLenteM[jm + 1], rr, 0, TAU); }
        ctx.fill();
      }
      for (q = 1; q >= 0; q--) {
        var cl = cuboLente[q]; if (!nl[q]) continue;
        ctx.fillStyle = U.rgba(q === 0 ? tinte : U.mezcla(C.hueso, tinte, 0.6), (q === 0 ? 1 : 0.9) * alfa); ctx.beginPath();
        for (var jl = 0; jl < nl[q]; jl += 3) { var rl = rT * (1 + 1.25 * cl[jl + 2]); ctx.moveTo(cl[jl] + rl, cl[jl + 1]); ctx.arc(cl[jl], cl[jl + 1], rl, 0, TAU); }
        ctx.fill();
      }
    }
  };

  /* ---------- ayudas de dibujo para las escenas ---------- */
  var tmpA = [0, 0, 0, 0];
  var FX = TI.fx = {
    // arco de círculo máximo de a a b (vectores), levantado «alto» radios en el medio; dibuja la parte entre «desde» y «hasta» (0…1)
    arco: function (a, b, alto, desde, hasta, pasos) {
      pasos = pasos || 48; desde = desde || 0; hasta = hasta == null ? 1 : hasta;
      var dot = U.clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1), om = Math.acos(dot), so = Math.sin(om) || 1e-6, dentro = false, v = [0, 0, 0];
      for (var j = 0; j <= pasos; j++) {
        var t = desde + (hasta - desde) * j / pasos, k0 = Math.sin((1 - t) * om) / so, k1 = Math.sin(t * om) / so;
        v[0] = a[0] * k0 + b[0] * k1; v[1] = a[1] * k0 + b[1] * k1; v[2] = a[2] * k0 + b[2] * k1;
        E.proy(v, tmpA, alto * Math.sin(Math.PI * t));
        if (E.visible(tmpA)) { if (!dentro) { ctx.moveTo(tmpA[0], tmpA[1]); dentro = true; } else ctx.lineTo(tmpA[0], tmpA[1]); } else dentro = false;
      }
    },
    // punto del arco en t (vector levantado)
    puntoArco: function (a, b, alto, t, o) {
      var dot = U.clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1), om = Math.acos(dot), so = Math.sin(om) || 1e-6;
      var k0 = Math.sin((1 - t) * om) / so, k1 = Math.sin(t * om) / so, v = [a[0] * k0 + b[0] * k1, a[1] * k0 + b[1] * k1, a[2] * k0 + b[2] * k1];
      return E.proy(v, o || [0, 0, 0, 0], alto * Math.sin(Math.PI * t));
    },
    // círculo menor de radio «rad» grados alrededor de c (vector), solo la parte visible; fr: fracción dibujada
    circulo: function (c, rad, fr, pasos, inicio) {
      pasos = pasos || 120; fr = fr == null ? 1 : fr; inicio = inicio || 0;
      var e = Math.abs(c[1]) > 0.99 ? [1, 0, 0] : [c[2], 0, -c[0]], le = Math.hypot(e[0], e[1], e[2]); e = [e[0] / le, e[1] / le, e[2] / le];
      var n = [c[1] * e[2] - c[2] * e[1], c[2] * e[0] - c[0] * e[2], c[0] * e[1] - c[1] * e[0]];
      var cr = Math.cos(rad * D2R), sr = Math.sin(rad * D2R), dentro = false, v = [0, 0, 0];
      for (var j = 0; j <= pasos * fr; j++) {
        var a = inicio + TAU * j / pasos, ca = Math.cos(a), sa = Math.sin(a);
        v[0] = c[0] * cr + (e[0] * ca + n[0] * sa) * sr; v[1] = c[1] * cr + (e[1] * ca + n[1] * sa) * sr; v[2] = c[2] * cr + (e[2] * ca + n[2] * sa) * sr;
        E.proy(v, tmpA);
        if (tmpA[2] > 0) { if (!dentro) { ctx.moveTo(tmpA[0], tmpA[1]); dentro = true; } else ctx.lineTo(tmpA[0], tmpA[1]); } else dentro = false;
      }
    },
    brillo: function (x, y, r, col, a) {
      var g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, U.rgba(col, a)); g.addColorStop(0.35, U.rgba(col, a * 0.35)); g.addColorStop(1, U.rgba(col, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    },
    ondas: function (x, y, r0, r1, n, fase, col, a, ancho) {
      ctx.lineWidth = ancho || 1;
      for (var i = 0; i < n; i++) {
        var f = ((fase + i / n) % 1 + 1) % 1;
        ctx.strokeStyle = U.rgba(col, a * (1 - f)); ctx.beginPath(); ctx.arc(x, y, r0 + (r1 - r0) * f, 0, TAU); ctx.stroke();
      }
    },
    texto: function (s, x, y, op) {
      op = op || {};
      ctx.font = (op.peso || 500) + ' ' + (op.tam || 11) + 'px ' + (op.serif ? '"Instrument Serif", Georgia, serif' : '"IBM Plex Mono", ui-monospace, Menlo, monospace');
      ctx.textAlign = op.alin || 'left'; ctx.textBaseline = op.base || 'middle';
      ctx.fillStyle = U.rgba(op.color || C.hueso, op.a == null ? 0.85 : op.a);
      if (op.espaciado && 'letterSpacing' in ctx) ctx.letterSpacing = op.espaciado + 'px';
      ctx.fillText(s, x, y);
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    },
    // marca de un lugar: punto, anillo y nombre
    marca: function (x, y, nombre, a, col, lado) {
      col = col || C.acento;
      ctx.fillStyle = U.rgba(col, a); ctx.beginPath(); ctx.arc(x, y, 2.4, 0, TAU); ctx.fill();
      ctx.strokeStyle = U.rgba(col, a * 0.6); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 6.5, 0, TAU); ctx.stroke();
      if (nombre) FX.texto(nombre, x + (lado === 'izq' ? -12 : 12), y, { tam: 11, a: a * 0.9, color: col, alin: lado === 'izq' ? 'right' : 'left', espaciado: 0.6 });
    }
  };

  /* ---------- la retícula del puntero ---------- */
  function dibujarReticula() {
    var p = E.puntero; if (!p.dentro || E.lenteOculta || E.arrastre || p.tipo !== 'mouse') return;
    var s = E.senal, col = U.mezcla(C.hueso, C.acento, Math.min(1, s * 1.4)), L = 84 + (s > 0.05 ? Math.sin(E.t * (0.004 + 0.02 * s)) * 3 * s : 0);
    ctx.strokeStyle = U.rgba(col, 0.22 + 0.4 * s); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(p.x, p.y, L, 0, TAU); ctx.stroke();
    ctx.beginPath();
    for (var k = 0; k < 4; k++) { var a = k * Math.PI / 2 + Math.PI / 4; ctx.moveTo(p.x + Math.cos(a) * (L - 5), p.y + Math.sin(a) * (L - 5)); ctx.lineTo(p.x + Math.cos(a) * (L + 5), p.y + Math.sin(a) * (L + 5)); }
    ctx.stroke();
    var et = G.texto(p.lat, p.lon), ex = p.x + L * 0.74 + 8, ey = p.y + L * 0.74 + 6, izq = ex + et.length * 7.4 > E.W - 12;
    FX.texto(et, izq ? p.x - L * 0.74 - 8 : ex, ey, { tam: 11, a: 0.75, color: col, espaciado: 0.4, alin: izq ? 'right' : 'left' });
  }

  /* ---------- dibujar un fotograma ---------- */
  function dibujar() {
    ctx.setTransform(E.dpr, 0, 0, E.dpr, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = U.rgba(C.fondo, 1); ctx.fillRect(0, 0, E.W, E.H);
    var esc = E.escena, s = esc && esc.s, t = esc ? esc.t : 0;
    dibujarEstrellas();
    if (s && s.fondo) s.fondo(ctx, t);
    if (!(s && s.sinAtmosfera)) E.dibujarAtmosfera(s && s.atmosfera != null ? s.atmosfera : 1);
    if (s && s.puntos) s.puntos(ctx, t); else E.dibujarPuntos({ lente: !s });
    if (!s) for (var i = 0; i < E.capas.length; i++) { try { E.capas[i](ctx, E.t); } catch (err) { console.error(err); } }
    if (s && s.frente) s.frente(ctx, t);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    if (!s) dibujarReticula();
  }

  /* ---------- un paso del reloj ---------- */
  function esc0() { return !!E.escena; }
  function actualizar(dt) {
    E.t += dt;
    // el globo se aparta si el cuaderno está abierto en pantalla ancha
    var objX = esc0() ? E.desplEscena : E.desplObjetivo;
    E.desplX += (objX - E.desplX) * Math.min(1, dt * 0.004);
    // en pantallas estrechas la tarjeta va abajo: el globo sube un poco durante la escena
    E.subida += ((esc0() && E.W <= 700 && !(E.escena.s.centrado) ? -E.H * 0.13 : 0) - E.subida) * Math.min(1, dt * 0.004);
    var giroUsuario = 0, esc = E.escena;
    if (cam) {
      var k = U.clamp((E.t - cam.t0) / cam.dur, 0, 1), e = cam.ease(k);
      cambiarRot(Mx.deQuat(Mx.slerp(cam.q0, cam.q1, e)));
      E.zoom = U.lerp(cam.z0, cam.z1, e);
      E.desplY = U.lerp(cam.y0, cam.y1, e);
      if (k >= 1) cam = null;
    } else if (!esc && !E.arrastre) {
      if (E.vel.w > 1e-6) {
        var ang = E.vel.w * dt; E.girarVista(E.vel.x, E.vel.y, E.vel.z, ang); giroUsuario = ang;
        E.vel.w *= Math.pow(0.975, dt / 16);
      }
      var inactivo = E.t - E.ultimoInput;
      E.giroAuto = U.clamp(E.giroAuto + (inactivo > 2500 ? dt / 2000 : -dt / 300), 0, 1);
      if (E.giroAuto > 0) E.girarPropio(dt * TAU / 240000 * E.giroAuto);   // una vuelta cada 4 minutos
    }
    if (E.arrastre) giroUsuario = E.arrastre.giro || 0, E.arrastre.giro = 0;
    // vueltas de usuario en los últimos 2 s (para «Vértigo»)
    historialGiro.push(E.t, giroUsuario);
    while (historialGiro.length && historialGiro[0] < E.t - 2000) historialGiro.splice(0, 2);
    var suma = 0; for (var h = 1; h < historialGiro.length; h += 2) suma += historialGiro[h];
    E.giro2s = suma;
    var velS = dt > 0 ? giroUsuario / dt * 1000 : 0;   // rad/s
    E.velGiro = E.velGiro == null ? velS : E.velGiro * 0.8 + velS * 0.2;
    E.estela = U.clamp((E.velGiro - 7) / 14, 0, 1);
    // la compresión de «alejarse más de la cuenta» vuelve sola
    E.compresion *= Math.pow(0.9, dt / 16);
    if (++cuadros % 90 === 0) { E.rot = Mx.ortonormal(E.rot); E.est = Mx.ortonormal(E.est); }

    if (esc) {
      esc.t += dt;
      var s = esc.s, ta = s.tarjeta;
      if (ta && !esc.tarjetaVista && esc.t >= ta.en) { esc.tarjetaVista = true; TI.interfaz && TI.interfaz.tarjeta(ta); }
      if (ta && esc.tarjetaVista && !esc.tarjetaQuitada && esc.t >= ta.hasta) { esc.tarjetaQuitada = true; TI.interfaz && TI.interfaz.tarjeta(null); }
      if (s.cuadro) { try { s.cuadro(esc.t, dt); } catch (err) { console.error(err); } }
      if (esc.t >= esc.dur) terminarEscena(false);
    }
    E.zoom = esc ? E.zoom : U.clamp(E.zoom, E.zoomMin, E.zoomMax);
    E.R = E.Rbase * E.zoom * (1 - E.compresion);
    E.cx = E.W / 2 + E.desplX; E.cy = E.H / 2 + E.desplY + E.subida;

    // el puntero, en grados
    var p = E.puntero;
    if (p.sobre && !esc) {
      var ll = E.pantallaA(p.x, p.y);
      p.dentro = !!ll; if (ll) { p.lat = ll[0]; p.lon = ll[1]; }
    } else p.dentro = false;
    if (!esc && !E.bloqueado) emitir('cuadro', { t: E.t, dt: dt, inactivo: E.t - E.ultimoInput, giro2s: E.giro2s, velGiro: E.velGiro });
  }

  function paso(dt) {
    var P = E.P;
    if (E.estela > 0.02) { P.px.set(P.tx); P.py.set(P.ty); }
    actualizar(dt);
    proyectar();
    if (E.estela <= 0.02) { P.px.set(P.tx); P.py.set(P.ty); }
    dibujar();
  }

  function bucle(ahora) {
    if (congelado) return;
    var dt = ultimoRaf === null ? 16 : Math.min(50, ahora - ultimoRaf); ultimoRaf = ahora;
    // en reposo (solo el giro propio, lento) pinta un fotograma de cada dos: ahorra batería
    var reposo = !E.escena && !E.arrastre && !cam && E.vel.w < 1e-5 && E.t - E.ultimoInput > 1500 && E.compresion < 0.001;
    if (reposo && (saltarDibujo = !saltarDibujo)) { acumulado += dt; raf(bucle); return; }
    paso(dt + acumulado); acumulado = 0;
    // si el ordenador no llega, modo ligero (una vez): menos resolución
    if (!E.ligero && !reposo) { mediaDt = mediaDt * 0.95 + dt * 0.05; if (++nMedidos > 120 && mediaDt > 26) { E.ligero = true; medir(); } }
    raf(bucle);
  }
  var acumulado = 0;

  /* ---------- escenas ---------- */
  E.reproducir = function (huevo, alTerminar) {
    if (E.escena) return false;
    var s = huevo.escena(E) || {};
    E.escena = { h: huevo, s: s, t: 0, dur: s.duracion || 8000, fin: alTerminar };
    E.vel.w = 0; E.arrastre = null; cam = null; E.lenteOculta = false; E.compresion = 0;
    historialGiro.length = 0; E.giro2s = 0;
    E.desplEscena = s.centrado ? 0 : E.W > 1100 ? Math.min(E.W * 0.12, 210) : 0;
    document.documentElement.classList.add('en-escena');
    if (s.inicio) { try { s.inicio(); } catch (err) { console.error(err); } }
    emitir('escena', { fase: 'inicio', huevo: huevo });
    return true;
  };
  function terminarEscena(saltada) {
    var e = E.escena; if (!e) return;
    try { e.s.fin && e.s.fin(saltada); } catch (err) { console.error(err); }
    E.escena = null; cam = null;
    TI.interfaz && TI.interfaz.tarjeta(null);
    document.documentElement.classList.remove('en-escena');
    E.brilloEstrellas = 1;
    var v = e.s.vuelta;
    if (v && v.lat != null) E.camara(v.lat, v.lon, v.zoom == null ? 1 : v.zoom, v.dur || 1400);
    else E.camaraZoom(v && v.zoom != null ? v.zoom : 1, 1300);
    E.ultimoInput = E.t;
    emitir('escena', { fase: 'fin', huevo: e.h, saltada: saltada });
    if (e.fin) e.fin(saltada);
  }
  E.saltar = function () { terminarEscena(true); };

  /* ---------- entrada ---------- */
  var punteros = {}, pinza = null, toque = null;
  function marcar() { E.ultimoInput = E.t; }
  function posicion(ev) { E.puntero.x = ev.clientX; E.puntero.y = ev.clientY; E.puntero.sobre = true; E.puntero.tipo = ev.pointerType || 'mouse'; }
  function datosPuntero(x, y) { var ll = E.pantallaA(x, y); return { x: x, y: y, dentro: !!ll, lat: ll ? ll[0] : null, lon: ll ? ll[1] : null }; }
  function libre() { return !E.escena && !E.bloqueado; }

  function alBajar(ev) {
    marcar(); posicion(ev);
    if (!libre()) return;
    punteros[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
    try { cv.setPointerCapture(ev.pointerId); } catch (e) { /* nada */ }
    var ids = Object.keys(punteros);
    if (ids.length === 2) {
      var a = punteros[ids[0]], b = punteros[ids[1]];
      pinza = { d: Math.hypot(a.x - b.x, a.y - b.y), z: E.zoom }; E.arrastre = null; return;
    }
    cam = null;
    E.arrastre = { x: ev.clientX, y: ev.clientY, x0: ev.clientX, y0: ev.clientY, t0: E.t, movido: 0, giro: 0, muestras: [] };
    E.vel.w = 0;
  }
  function alMover(ev) {
    marcar(); posicion(ev);
    if (punteros[ev.pointerId]) { punteros[ev.pointerId].x = ev.clientX; punteros[ev.pointerId].y = ev.clientY; }
    if (!libre()) return;
    if (pinza) {
      var ids = Object.keys(punteros); if (ids.length < 2) return;
      var a = punteros[ids[0]], b = punteros[ids[1]], d = Math.hypot(a.x - b.x, a.y - b.y);
      var objetivo = pinza.z * d / pinza.d;
      if (objetivo < E.zoomMin) { emitir('rueda', { dy: (E.zoomMin - objetivo) * 400, zoom: E.zoom, enMin: true }); }
      E.zoom = U.clamp(objetivo, E.zoomMin, E.zoomMax); return;
    }
    var A = E.arrastre;
    if (A) {
      var dx = ev.clientX - A.x, dy = ev.clientY - A.y, dist = Math.hypot(dx, dy);
      A.x = ev.clientX; A.y = ev.clientY; A.movido += dist;
      if (dist < 0.01) return;
      // el punto de delante sigue al dedo: eje (dy, dx, 0)
      var ax = dy / dist, ay = dx / dist, ang = dist / E.R;
      E.girarVista(ax, ay, 0, ang); A.giro += ang;
      A.muestras.push(E.t, ax, ay, ang); while (A.muestras.length > 40) A.muestras.splice(0, 4);
    } else {
      emitir('mover', datosPuntero(ev.clientX, ev.clientY));
    }
  }
  function alSubir(ev) {
    marcar();
    delete punteros[ev.pointerId];
    if (pinza) { if (Object.keys(punteros).length < 2) pinza = null; E.arrastre = null; return; }
    var A = E.arrastre; E.arrastre = null;
    if (!A || !libre()) return;
    // inercia: lo girado en los últimos 90 ms
    var sx = 0, sy = 0, sa = 0, t0 = E.t;
    for (var i = A.muestras.length - 4; i >= 0; i -= 4) {
      if (E.t - A.muestras[i] > 90) break;
      t0 = A.muestras[i]; sx += A.muestras[i + 1] * A.muestras[i + 3]; sy += A.muestras[i + 2] * A.muestras[i + 3]; sa += A.muestras[i + 3];
    }
    var dtm = Math.max(16, E.t - t0 + 16);
    if (sa > 0.002) { var l = Math.hypot(sx, sy) || 1; E.vel = { x: sx / l, y: sy / l, z: 0, w: Math.min(0.045, sa / dtm) }; }
    if (A.movido < 6 && E.t - A.t0 < 600) {
      var d = datosPuntero(ev.clientX, ev.clientY);
      emitir('clic', d);
      // doble toque en pantallas táctiles
      if (ev.pointerType !== 'mouse') {
        if (toque && E.t - toque.t < 330 && Math.hypot(toque.x - d.x, toque.y - d.y) < 30) { emitir('dobleclic', d); toque = null; }
        else toque = { t: E.t, x: d.x, y: d.y };
      }
    }
  }

  E.iniciar = function (lienzo) {
    cv = lienzo; ctx = cv.getContext('2d', { alpha: false }); E.ctx = ctx;
    medir();
    window.addEventListener('resize', medir);
    cv.addEventListener('pointerdown', alBajar);
    window.addEventListener('pointermove', function (ev) {
      if (ev.target === cv || E.arrastre || pinza) alMover(ev);
      else { E.puntero.sobre = false; marcar(); }
    });
    window.addEventListener('pointerup', alSubir);
    window.addEventListener('pointercancel', function (ev) { delete punteros[ev.pointerId]; pinza = null; E.arrastre = null; });
    cv.addEventListener('pointerleave', function (ev) { if (ev.pointerType === 'mouse' && !E.arrastre) E.puntero.sobre = false; });
    cv.addEventListener('dblclick', function (ev) { marcar(); if (libre()) emitir('dobleclic', datosPuntero(ev.clientX, ev.clientY)); });
    cv.addEventListener('wheel', function (ev) {
      ev.preventDefault(); marcar();
      if (!libre()) return;
      var dy = ev.deltaMode === 1 ? ev.deltaY * 16 : ev.deltaY;
      var antes = E.zoom; cam = null;
      E.zoom = U.clamp(E.zoom * Math.exp(-dy * 0.0016), E.zoomMin, E.zoomMax);
      var enMin = antes <= E.zoomMin + 1e-4 && dy > 0;
      if (enMin) E.compresion = U.clamp(E.compresion + dy * 0.0004, 0, 0.16);
      emitir('rueda', { dy: dy, zoom: E.zoom, enMin: enMin });
    }, { passive: false });
    window.addEventListener('keydown', function (ev) {
      marcar();
      if (ev.key === 'Escape' && E.escena) { E.saltar(); return; }
      if (!libre() || ev.metaKey || ev.ctrlKey || ev.altKey) return;
      var t = ev.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      // las flechas empujan el globo
      var em = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[ev.key];
      if (em) { ev.preventDefault(); cam = null; E.vel = { x: em[0] ? 1 : 0, y: em[1] ? 1 : 0, z: 0, w: 0.0032 }; if (em[0] < 0 || em[1] < 0) { E.vel.x = -E.vel.x; E.vel.y = -E.vel.y; } }
      emitir('tecla', { key: ev.key, code: ev.code });
    });
    document.addEventListener('visibilitychange', function () { ultimoRaf = null; marcar(); });
    E.ultimoInput = 0;
    raf(bucle);
  };

  /* ---------- pruebas: pasos manuales (TI.debug en inicio.js) ---------- */
  E.congelar = function (si) { congelado = si !== false; if (!congelado) { ultimoRaf = null; raf(bucle); } };
  E.paso = function (ms, trozos) {
    trozos = trozos || Math.max(1, Math.round(ms / 16));
    for (var i = 0; i < trozos; i++) paso(ms / trozos);
  };
})();
