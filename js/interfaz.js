/* Terra Incognita · interfaz
   El registro de secretos de los dos mundos (la Tierra y, en la Exploración 2, la Luna), el progreso (en este navegador),
   el cuaderno, la tarjeta de cada escena, los créditos con la puerta secreta, los avisos y los instrumentos de abajo. */
(function () {
  'use strict';
  var TI = window.TI, U = TI.util, E = TI.motor, G = TI.geo;
  var CLAVE = 'terra-incognita.v1';
  var PRUEBA = /[?&]prueba\b/.test(location.search);
  var I = TI.interfaz = { prueba: PRUEBA };
  var huevos = [], finales = {}, viaje = null;
  var estado = { hallados: {}, final: false, finalLuna: false, luna: false, introVista: false };
  var $ = function (id) { return document.getElementById(id); };
  var raiz = document.documentElement;
  // quién ha hecho el juego: sale en los créditos al terminar cada final y, después, al pie del cuaderno
  var AUTOR = { nombre: 'Pau Morató Sebastià', linkedin: 'https://www.linkedin.com/in/pau-morat%C3%B3-sebasti%C3%A0-5554a01b2' };

  // lo que cambia de un mundo a otro
  var MUNDOS = {
    tierra: {
      titulo: 'Terra', etq: 'Expedición nº 001', cuaderno: 'Cuaderno de campo', donde: 'en el mundo', claveFinal: 'final',
      sub: function () { return 'Atlas de secretos · ' + U.num(E.tierra.n + E.mar.n) + ' puntos'; },
      creditosEtq: 'Mundo cartografiado por', creditosTxt: 'Gracias por explorar hasta el último punto', puerta: true,
      fuentes: 'Geografía: Natural Earth (dominio público).'
    },
    luna: {
      titulo: 'Luna', etq: 'Expedición nº 002', cuaderno: 'Cuaderno lunar', donde: 'en la Luna', claveFinal: 'finalLuna',
      sub: function () { return 'Exploración 2 · ' + U.num(E.luna.n) + ' puntos'; },
      creditosEtq: 'Luna cartografiada por', creditosTxt: 'Gracias por llegar hasta aquí.', puerta: false,
      fuentes: 'Mapa lunar: NASA’s Scientific Visualization Studio, a partir del Lunar Reconnaissance Orbiter.'
    }
  };

  /* ---------- registro ----------
     Cada secreto: { id, n, nombre, tipo, pista, mundo?: 'tierra'|'luna', lugar?: [lat, lon], detectar(api), escena(motor, datos) } */
  TI.registrar = function (h) { h.mundo = h.mundo || 'tierra'; huevos.push(h); huevos.sort(function (a, b) { return a.n - b.n; }); };
  TI.registrarFinal = function (h) { finales[h.mundo || 'tierra'] = h; };
  TI.registrarViaje = function (h) { viaje = h; };
  I.huevos = function () { return huevos; };
  var PALABRAS = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte'];
  I.palabra = function (n) { return PALABRAS[n] || String(n); };
  I.estado = function () { return estado; };

  function cargar() { try { var s = localStorage.getItem(CLAVE); if (s) { var o = JSON.parse(s); for (var k in o) estado[k] = o[k]; } } catch (e) { /* sin almacenamiento */ } }
  function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch (e) { /* sin almacenamiento */ } }
  function delMundo(m) { return huevos.filter(function (h) { return h.mundo === m; }); }
  function cuantos(m) { return delMundo(m).filter(function (h) { return estado.hallados[h.id]; }).length; }
  I.delMundo = delMundo;

  /* ---------- disparar un secreto ---------- */
  I.disparar = function (h, datos, op) {
    op = op || {};
    if (E.escena || !$('intro').hidden || !$('creditos').hidden || h.mundo !== E.mundo) return false;
    cerrarCuaderno();
    var nuevo = !estado.hallados[h.id] && !op.prueba, m = h.mundo, total = delMundo(m).length;
    if (nuevo) { estado.hallados[h.id] = Date.now(); guardar(); }
    h.ultimosDatos = datos || h.ultimosDatos || null;
    var envoltorio = { id: h.id, escena: function (motor) {
      var s = h.escena(motor, datos || h.ultimosDatos || null);
      // «Secreto 03 / 10 · Lugar»: se numera solo, así añadir un secreto es solo añadir su archivo
      if (s && s.tarjeta && !s.tarjeta.etiqueta) s.tarjeta.etiqueta = 'Secreto ' + U.dos(h.n) + ' / ' + U.dos(total) + ' · ' + h.tipo;
      return s;
    } };
    E.reproducir(envoltorio, function () {
      pintarLista(nuevo ? h.id : null);
      if (nuevo) {
        aviso('Secreto encontrado <b>' + U.dos(cuantos(m)) + '/' + total + '</b> · ' + h.nombre);
        var b = $('b-cuaderno'); b.classList.remove('pulso'); void b.offsetWidth; b.classList.add('pulso');
        if (cuantos(m) === total && !estado[MUNDOS[m].claveFinal] && finales[m]) setTimeout(function () { I.verFinal(m); }, 1600);
      }
    });
    return true;
  };
  I.verFinal = function (m) {
    m = m || E.mundo;
    var fin = finales[m];
    if (!fin || E.escena || m !== E.mundo) return;
    cerrarCuaderno();
    var lista = delMundo(m), primero = Infinity, ultimo = 0;
    lista.forEach(function (h) { var t = estado.hallados[h.id]; if (t) { primero = Math.min(primero, t); ultimo = Math.max(ultimo, t); } });
    E.reproducir({ id: 'final-' + m, escena: function (motor) { return fin.escena(motor, { desde: primero, hasta: ultimo, huevos: lista }); } }, function () {
      if (cuantos(m) === lista.length) { estado[MUNDOS[m].claveFinal] = true; guardar(); }
      pintarLista();
      mostrarCreditos(m);
    });
  };

  /* ---------- viajar entre la Tierra y la Luna ---------- */
  I.viajar = function (destino) {
    if (!viaje || E.escena || destino === E.mundo) return false;
    cerrarCuaderno(); cerrarCreditos(true);
    var primeraVez = destino === 'luna' && !estado.luna;
    if (primeraVez) { estado.luna = true; guardar(); }   // la puerta ya está encontrada, aunque se cierre la página a medio viaje
    E.reproducir({ id: 'viaje-' + destino, escena: function (motor) { return viaje.escena(motor, { destino: destino, primeraVez: primeraVez }); } }, function () {
      if (E.mundo !== destino) E.cambiarMundo(destino, { rot: TI.mat.mirando(destino === 'luna' ? 8 : 24, destino === 'luna' ? 12 : -28), zoom: 1 });
      if (primeraVez) aviso('Exploración 2 desbloqueada · <b>Luna incognita</b>', 5200);
      pintarLista();
    });
    return true;
  };

  /* ---------- créditos ---------- */
  function mostrarCreditos(m) {
    var c = $('creditos'), M = MUNDOS[m || E.mundo];
    $('creditos-etq').textContent = M.creditosEtq;
    var txt = $('creditos-txt'); txt.textContent = M.creditosTxt;
    if (M.puerta) {
      // la puerta a la Exploración 2: el punto final de la frase. Ni botón ni cursor de mano: hay que encontrarlo
      var p = document.createElement('span'); p.className = 'puerta'; p.id = 'puerta'; p.textContent = '.';
      p.addEventListener('click', function () { I.viajar('luna'); });
      txt.appendChild(p);
    }
    c.hidden = false; c.classList.remove('saliendo'); void c.offsetWidth; c.classList.add('visible');
    E.bloqueado = true;
    setTimeout(function () { var b = $('creditos-enlace').hidden ? $('creditos-cerrar') : $('creditos-enlace'); try { b.focus({ preventScroll: true }); } catch (e) { b.focus(); } }, 2600);
  }
  function cerrarCreditos(rapido) {
    var c = $('creditos'); if (c.hidden) return;
    c.classList.remove('visible'); c.classList.add('saliendo');
    E.bloqueado = false; E.ultimoInput = E.t;
    setTimeout(function () { c.hidden = true; c.classList.remove('saliendo'); }, rapido ? 10 : 650);
    if (rapido) c.hidden = true;
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

  // títulos y textos del mundo en el que se está
  function actualizarMundo() {
    var m = E.mundo, M = MUNDOS[m], lista = delMundo(m);
    $('t-mundo').textContent = M.titulo;
    $('sub').textContent = M.sub();
    $('c-etq').textContent = M.etq;
    $('cuaderno-titulo').textContent = M.cuaderno;
    var palabra = I.palabra(lista.length);
    $('c-intro').textContent = palabra.charAt(0).toUpperCase() + palabra.slice(1) + ' secretos escondidos ' + M.donde + '. Cada pista apunta a uno; el nombre aparece cuando lo encuentras.';
    $('fila-radio').hidden = m !== 'luna';
    $('c-fuentes').textContent = M.fuentes;
    pintarLista();
  }
  I.actualizarMundo = actualizarMundo;

  function pintarLista(recien) {
    var m = E.mundo, M = MUNDOS[m], lista = delMundo(m), ol = $('lista'); ol.innerHTML = '';
    lista.forEach(function (h) {
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
    var n = cuantos(m), completo = !!estado[M.claveFinal];
    $('contador').textContent = U.dos(n) + '/' + U.dos(lista.length);
    var seg = $('segmentos'); seg.innerHTML = ''; seg.style.gridTemplateColumns = 'repeat(' + lista.length + ', 1fr)';
    for (var i = 0; i < lista.length; i++) seg.appendChild(el('i', i < n ? 'si' : ''));
    $('ver-final').hidden = !(completo || (PRUEBA && finales[m]));
    $('c-credito-linea').hidden = !completo;
    // ir y volver: la Luna solo aparece en el cuaderno cuando ya se ha encontrado la puerta
    var v = $('viajar');
    v.hidden = !(m === 'luna' || estado.luna || PRUEBA);
    v.textContent = m === 'luna' ? '← Volver a la Tierra' : 'Viajar a la Luna →';
    raiz.classList.toggle('cognita', completo);
  }

  /* ---------- instrumentos ---------- */
  var cuadroHud = 0, ultimoSenal = -1, ultimoRadio = -1;
  function barras(id, valor, ultimo) {
    var b = Math.ceil(valor * 5 - 0.15);
    if (b === ultimo) return b;
    var is = $(id).children;
    for (var i = 0; i < is.length; i++) is[i].classList.toggle('si', i < b);
    return b;
  }
  function instrumentos() {
    // señal: cercanía de la lupa a un secreto con lugar (de este mundo) que aún no se ha encontrado
    var objetivo = 0, p = E.puntero;
    if (p.dentro) {
      huevos.forEach(function (h) {
        if (h.mundo !== E.mundo || !h.lugar || estado.hallados[h.id]) return;
        var d = G.dist(p.lat, p.lon, h.lugar[0], h.lugar[1]);
        objetivo = Math.max(objetivo, U.clamp(1 - d / (h.radioSenal || 16), 0, 1));
      });
    }
    E.senal += (objetivo - E.senal) * 0.12;
    if (++cuadroHud % 4) return;
    $('h-zoom').textContent = U.num(E.zoom, 2) + '×';
    $('h-giro').textContent = U.num(Math.abs(E.velGiro || 0) * 57.2958, 0) + ' °/s';
    ultimoSenal = barras('h-senal', E.senal, ultimoSenal);
    if (E.mundo === 'luna') {
      // radio con la Tierra: llena si miras la cara visible, nula si miras la cara oculta (la Luna tapa la Tierra)
      var radio = U.clamp((E.rot[8] + 0.2) / 0.6, 0, 1);
      ultimoRadio = barras('h-radio', radio, ultimoRadio);
      $('h-radio-txt').textContent = radio < 0.05 ? 'Sin señal' : '';
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
    var cuantosHay = I.palabra(delMundo('tierra').length);
    Array.prototype.forEach.call(document.querySelectorAll('.n-secretos'), function (e) { e.textContent = cuantosHay; });

    // cada detector solo escucha en su mundo
    huevos.forEach(function (h) {
      h.detectar && h.detectar({
        motor: E,
        en: function (evento, fn) { E.en(evento, function (d) { if (E.mundo === h.mundo) fn(d); }); },
        capa: function (fn) { E.capas.push(function (ctx, t) { if (E.mundo === h.mundo) fn(ctx, t); }); },
        hallado: function () { return !!estado.hallados[h.id]; },
        disparar: function (datos) { return I.disparar(h, datos); }
      });
    });
    E.en('cuadro', instrumentos);
    E.en('tecla', tecla);
    E.en('mundo', actualizarMundo);

    $('b-cuaderno').addEventListener('click', function () { $('cuaderno').classList.contains('abierto') ? cerrarCuaderno() : abrirCuaderno(); });
    $('cerrar-cuaderno').addEventListener('click', cerrarCuaderno);
    $('saltar').addEventListener('click', function () { E.saltar(); });
    $('ver-final').addEventListener('click', function () { I.verFinal(E.mundo); });
    $('viajar').addEventListener('click', function () { I.viajar(E.mundo === 'luna' ? 'tierra' : 'luna'); });
    $('borrar').addEventListener('click', function () {
      if (!window.confirm('¿Borrar todos los secretos encontrados en este navegador?')) return;
      estado = { hallados: {}, final: false, finalLuna: false, luna: false, introVista: true }; guardar();
      if (E.mundo !== 'tierra') E.cambiarMundo('tierra', { rot: TI.mat.mirando(24, -28), zoom: 1 }); else actualizarMundo();
    });
    window.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && !E.escena) { cerrarCuaderno(); cerrarCreditos(); } });

    $('creditos-nombre').textContent = AUTOR.nombre;
    $('c-credito-nombre').textContent = AUTOR.nombre;
    if (AUTOR.linkedin) { $('creditos-enlace').href = AUTOR.linkedin; $('c-credito').href = AUTOR.linkedin; }
    else $('creditos-enlace').hidden = true;
    $('creditos-cerrar').addEventListener('click', function () { cerrarCreditos(); });

    actualizarMundo();

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
