/* Terra Incognita · interfaz
   El registro de secretos, el progreso (en este navegador), el cuaderno, la tarjeta de cada escena,
   los avisos y los instrumentos de abajo. */
(function () {
  'use strict';
  var TI = window.TI, U = TI.util, E = TI.motor, G = TI.geo;
  var CLAVE = 'terra-incognita.v1';
  var PRUEBA = /[?&]prueba\b/.test(location.search);
  var I = TI.interfaz = { prueba: PRUEBA };
  var huevos = [], final = null;
  var estado = { hallados: {}, final: false, introVista: false };
  var $ = function (id) { return document.getElementById(id); };
  var raiz = document.documentElement;
  // quién ha hecho el juego: sale en los créditos al terminar el final y, después, al pie del cuaderno
  var AUTOR = { nombre: 'Pau Morató Sebastià', linkedin: 'https://www.linkedin.com/in/pau-morat%C3%B3-sebasti%C3%A0-5554a01b2' };

  /* ---------- registro ----------
     Cada secreto: { id, n, nombre, tipo, pista, lugar?: [lat, lon], detectar(api), escena(motor, datos) } */
  TI.registrar = function (h) { huevos.push(h); huevos.sort(function (a, b) { return a.n - b.n; }); };
  TI.registrarFinal = function (h) { final = h; };
  I.huevos = function () { return huevos; };
  var PALABRAS = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte'];
  I.palabra = function (n) { return PALABRAS[n] || String(n); };
  I.estado = function () { return estado; };

  function cargar() { try { var s = localStorage.getItem(CLAVE); if (s) { var o = JSON.parse(s); for (var k in o) estado[k] = o[k]; } } catch (e) { /* sin almacenamiento */ } }
  function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch (e) { /* sin almacenamiento */ } }
  function cuantos() { var n = 0; huevos.forEach(function (h) { if (estado.hallados[h.id]) n++; }); return n; }

  /* ---------- disparar un secreto ---------- */
  I.disparar = function (h, datos, op) {
    op = op || {};
    if (E.escena || !$('intro').hidden || !$('creditos').hidden) return false;
    cerrarCuaderno();
    var nuevo = !estado.hallados[h.id] && !op.prueba;
    if (nuevo) { estado.hallados[h.id] = Date.now(); guardar(); }
    h.ultimosDatos = datos || h.ultimosDatos || null;
    var envoltorio = { id: h.id, escena: function (motor) {
      var s = h.escena(motor, datos || h.ultimosDatos || null);
      // «Secreto 03 / 10 · Lugar»: se numera solo, así añadir un secreto es solo añadir su archivo
      if (s && s.tarjeta && !s.tarjeta.etiqueta) s.tarjeta.etiqueta = 'Secreto ' + U.dos(h.n) + ' / ' + U.dos(huevos.length) + ' · ' + h.tipo;
      return s;
    } };
    E.reproducir(envoltorio, function () {
      pintarLista(nuevo ? h.id : null);
      if (nuevo) {
        aviso('Secreto encontrado <b>' + U.dos(cuantos()) + '/' + huevos.length + '</b> · ' + h.nombre);
        var b = $('b-cuaderno'); b.classList.remove('pulso'); void b.offsetWidth; b.classList.add('pulso');
        if (cuantos() === huevos.length && !estado.final && final) setTimeout(function () { I.verFinal(); }, 1600);
      }
    });
    return true;
  };
  I.verFinal = function () {
    if (!final || E.escena) return;
    cerrarCuaderno();
    var primero = Infinity, ultimo = 0;
    huevos.forEach(function (h) { var t = estado.hallados[h.id]; if (t) { primero = Math.min(primero, t); ultimo = Math.max(ultimo, t); } });
    E.reproducir({ id: 'final', escena: function (motor) { return final.escena(motor, { desde: primero, hasta: ultimo, huevos: huevos }); } }, function () {
      if (cuantos() === huevos.length) { estado.final = true; guardar(); }
      pintarLista();
      mostrarCreditos();
    });
  };

  /* ---------- créditos ---------- */
  function mostrarCreditos() {
    var c = $('creditos');
    c.hidden = false; c.classList.remove('saliendo'); void c.offsetWidth; c.classList.add('visible');
    E.bloqueado = true;
    setTimeout(function () { var b = $('creditos-enlace').hidden ? $('creditos-cerrar') : $('creditos-enlace'); try { b.focus({ preventScroll: true }); } catch (e) { b.focus(); } }, 2600);
  }
  function cerrarCreditos() {
    var c = $('creditos'); if (c.hidden) return;
    c.classList.remove('visible'); c.classList.add('saliendo');
    E.bloqueado = false; E.ultimoInput = E.t;
    setTimeout(function () { c.hidden = true; c.classList.remove('saliendo'); }, 650);
  }
  I.mostrarCreditos = mostrarCreditos;

  /* ---------- tarjeta ---------- */
  I.tarjeta = function (t) {
    var el = $('tarjeta');
    if (!t) { el.classList.remove('visible'); return; }
    var v = function (x) { return typeof x === 'function' ? x() : (x || ''); };
    $('t-etq').textContent = v(t.etiqueta);
    $('t-tit').textContent = v(t.titulo);
    $('t-txt').innerHTML = v(t.texto);
    $('t-pie').textContent = v(t.pie);
    el.classList.toggle('retro', !!t.retro);
    void el.offsetWidth; el.classList.add('visible');
  };

  /* ---------- aviso ---------- */
  var tAviso = null;
  function aviso(html, ms) {
    var el = $('aviso'); el.innerHTML = html; el.classList.add('visible');
    clearTimeout(tAviso); tAviso = setTimeout(function () { el.classList.remove('visible'); }, ms || 4200);
  }
  I.aviso = aviso;

  /* ---------- cuaderno ---------- */
  function abrirCuaderno() {
    $('cuaderno').classList.add('abierto'); $('cuaderno').setAttribute('aria-hidden', 'false');
    $('b-cuaderno').setAttribute('aria-expanded', 'true'); raiz.classList.add('cuaderno-abierto');
    E.desplObjetivo = E.W > 980 ? -205 : 0;
  }
  function cerrarCuaderno() {
    $('cuaderno').classList.remove('abierto'); $('cuaderno').setAttribute('aria-hidden', 'true');
    $('b-cuaderno').setAttribute('aria-expanded', 'false'); raiz.classList.remove('cuaderno-abierto');
    E.desplObjetivo = 0;
  }
  I.abrirCuaderno = abrirCuaderno; I.cerrarCuaderno = cerrarCuaderno;

  function fecha(ms) {
    var d = new Date(ms);
    return U.dos(d.getDate()) + '.' + U.dos(d.getMonth() + 1) + '.' + d.getFullYear() + ' · ' + U.dos(d.getHours()) + ':' + U.dos(d.getMinutes());
  }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  function pintarLista(recien) {
    var ol = $('lista'); ol.innerHTML = '';
    huevos.forEach(function (h) {
      var ok = !!estado.hallados[h.id];
      var li = el('li', 'entrada' + (ok ? ' hallada' : '') + (recien === h.id ? ' nueva' : ''));
      li.appendChild(el('div', 'e-num', U.dos(h.n)));
      var c = el('div', 'e-cuerpo');
      c.appendChild(el('div', 'e-tipo', h.tipo));
      var nom = el('div', 'e-nombre');
      if (ok) nom.textContent = h.nombre;
      else { var cen = el('span', 'e-censura'); cen.style.width = (h.nombre.length * 0.48 + 0.6) + 'em'; nom.appendChild(cen); nom.setAttribute('aria-label', 'Sin descubrir'); }
      c.appendChild(nom);
      c.appendChild(el('p', 'e-pista', h.pista));
      if (ok || PRUEBA) {
        var meta = el('div', 'e-meta');
        if (ok) meta.appendChild(el('span', '', 'Encontrado ' + fecha(estado.hallados[h.id])));
        var b = el('button', 'e-ver', ok ? '↻ Ver otra vez' : '▶ Probar');
        b.type = 'button';
        b.addEventListener('click', function () { I.disparar(h, null, { prueba: !ok }); });
        meta.appendChild(b); c.appendChild(meta);
      }
      li.appendChild(c); ol.appendChild(li);
    });
    var n = cuantos();
    $('contador').textContent = U.dos(n) + '/' + huevos.length;
    var seg = $('segmentos'); seg.innerHTML = '';
    for (var i = 0; i < huevos.length; i++) seg.appendChild(el('i', i < n ? 'si' : ''));
    $('ver-final').hidden = !(estado.final || (PRUEBA && final));
    $('c-credito-linea').hidden = !estado.final;
    raiz.classList.toggle('cognita', !!estado.final);
  }

  /* ---------- instrumentos ---------- */
  var cuadroHud = 0, ultimoSenal = -1;
  function instrumentos() {
    // señal: cercanía de la lupa a un secreto con lugar que aún no se ha encontrado
    var objetivo = 0, p = E.puntero;
    if (p.dentro) {
      huevos.forEach(function (h) {
        if (!h.lugar || estado.hallados[h.id]) return;
        var d = G.dist(p.lat, p.lon, h.lugar[0], h.lugar[1]);
        objetivo = Math.max(objetivo, U.clamp(1 - d / (h.radioSenal || 16), 0, 1));
      });
    }
    E.senal += (objetivo - E.senal) * 0.12;
    if (++cuadroHud % 4) return;
    $('h-zoom').textContent = U.num(E.zoom, 2) + '×';
    $('h-giro').textContent = U.num(Math.abs(E.velGiro || 0) * 57.2958, 0) + ' °/s';
    var barras = Math.ceil(E.senal * 5 - 0.15);
    if (barras !== ultimoSenal) {
      ultimoSenal = barras;
      var is = $('h-senal').children;
      for (var i = 0; i < is.length; i++) is[i].classList.toggle('si', i < barras);
    }
  }

  /* ---------- teclas pulsadas, abajo en el centro ---------- */
  var SIMBOLOS = { ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→' };
  function tecla(d) {
    var s = SIMBOLOS[d.key] || (d.key.length === 1 && /\S/.test(d.key) ? d.key.toUpperCase() : null);
    if (!s) return;
    var cont = $('teclas'), k = el('kbd', '', s);
    cont.appendChild(k);
    while (cont.children.length > 10) cont.removeChild(cont.firstChild);
    setTimeout(function () { if (k.parentNode) k.parentNode.removeChild(k); }, 2300);
  }

  /* ---------- grano de película ---------- */
  function grano() {
    try {
      var c = document.createElement('canvas'); c.width = c.height = 180;
      var x = c.getContext('2d'), im = x.createImageData(180, 180), r = U.azar(11);
      for (var i = 0; i < im.data.length; i += 4) { var v = Math.floor(r() * 255); im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
      x.putImageData(im, 0, 0);
      $('grano').style.backgroundImage = 'url(' + c.toDataURL('image/png') + ')';
    } catch (e) { /* sin grano */ }
  }

  /* ---------- arranque ---------- */
  I.iniciar = function () {
    cargar();
    grano();
    var tactil = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    $('ayuda').textContent = tactil ? 'Arrastra para girar · Pellizca para acercar' : 'Arrastra para girar · Rueda para acercar · Flechas';
    $('sub').textContent = 'Atlas de secretos · ' + U.num(E.tierra.n + E.mar.n) + ' puntos';
    var cuantosHay = I.palabra(huevos.length);
    Array.prototype.forEach.call(document.querySelectorAll('.n-secretos'), function (e, i) { e.textContent = e.classList.contains('mayus') ? cuantosHay.charAt(0).toUpperCase() + cuantosHay.slice(1) : cuantosHay; });

    huevos.forEach(function (h) {
      h.detectar && h.detectar({
        motor: E,
        en: E.en,
        capa: function (fn) { E.capas.push(fn); },
        hallado: function () { return !!estado.hallados[h.id]; },
        disparar: function (datos) { return I.disparar(h, datos); }
      });
    });
    E.en('cuadro', instrumentos);
    E.en('tecla', tecla);

    $('b-cuaderno').addEventListener('click', function () { $('cuaderno').classList.contains('abierto') ? cerrarCuaderno() : abrirCuaderno(); });
    $('cerrar-cuaderno').addEventListener('click', cerrarCuaderno);
    $('saltar').addEventListener('click', function () { E.saltar(); });
    $('ver-final').addEventListener('click', function () { I.verFinal(); });
    $('borrar').addEventListener('click', function () {
      if (!window.confirm('¿Borrar todos los secretos encontrados en este navegador?')) return;
      estado = { hallados: {}, final: false, introVista: true }; guardar(); pintarLista();
    });
    window.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && !E.escena) { cerrarCuaderno(); cerrarCreditos(); } });

    $('creditos-nombre').textContent = AUTOR.nombre;
    $('c-credito-nombre').textContent = AUTOR.nombre;
    if (AUTOR.linkedin) { $('creditos-enlace').href = AUTOR.linkedin; $('c-credito').href = AUTOR.linkedin; }
    else $('creditos-enlace').hidden = true;
    $('creditos-cerrar').addEventListener('click', cerrarCreditos);

    pintarLista();

    var intro = $('intro');
    if (!estado.introVista && !PRUEBA) {
      intro.hidden = false; E.bloqueado = true;
      $('empezar').addEventListener('click', function () {
        estado.introVista = true; guardar();
        intro.classList.add('saliendo'); E.bloqueado = false; E.ultimoInput = E.t;
        setTimeout(function () { intro.hidden = true; }, 900);
      });
      setTimeout(function () { $('empezar').focus({ preventScroll: true }); }, 50);
    }
  };
})();
