/* Viaje entre la Tierra y la Luna (la puerta de la Exploración 2 y la vuelta).
   El mundo de origen se aleja y se encoge hacia la izquierda; el de destino llega por la derecha mientras un contador
   recorre los 384.400 km. A mitad de camino el motor cambia de mundo y el destino pasa a ser el globo principal. */
(function () {
  'use strict';
  var TI = window.TI, U = TI.util, FX = TI.fx, C = TI.color, DIST = 384400;

  TI.registrarViaje({
    escena: function (E, datos) {
      var destino = datos.destino, origen = destino === 'luna' ? 'tierra' : 'luna', primera = !!datos.primeraVez;
      var L = primera ? E.lectura : 0, CAMBIO = 6200;
      var rotDestino = TI.mat.mirando(destino === 'luna' ? 8 : 24, destino === 'luna' ? 12 : -28);
      var rotOrigen = null, R0 = 0, xOrigen = 0, rOrigen = 0, cambiado = false;
      // el destino: entra por la derecha y acaba en el centro con el tamaño que tendrá al cambiar de mundo
      function destinoEn(t) {
        var f = U.inOut(U.tramo(t, 1800, CAMBIO));
        return { x: U.lerp(E.W + 80, E.W / 2, f), r: U.lerp(2, E.Rbase * 0.42, Math.pow(f, 1.6)) };
      }
      return {
        duracion: 9600 + L,
        centrado: true,
        sinTierraFondo: true,
        tarjeta: destino === 'luna' ? {
          en: 6600, hasta: 9400 + L,
          etiqueta: primera ? 'Exploración 2' : 'Exploración 2 · de vuelta', titulo: 'Luna incognita',
          texto: primera ? 'Has llegado hasta el último punto, y el último punto era una puerta. Aquí hay seis secretos más; el cuaderno lunar te espera arriba a la derecha.' : 'Otra vez en la Luna. Tu cuaderno lunar sigue donde lo dejaste.',
          pie: U.num(DIST) + ' km de la Tierra'
        } : {
          en: 6600, hasta: 9400,
          etiqueta: 'De vuelta en casa', titulo: 'Terra incognita',
          texto: 'La Tierra sigue aquí, con sus diez secretos.', pie: U.num(DIST) + ' km de vuelta'
        },
        inicio: function () { R0 = E.R; rotOrigen = E.rot.slice(); },
        cuadro: function (t) {
          if (!cambiado) {
            // el origen se aleja: se encoge y se va a la izquierda
            var f = U.inOut(U.tramo(t, 0, CAMBIO)), r = R0 * Math.pow(12 / R0, f);
            E.zoom = r / E.Rbase;
            E.desplX = E.desplEscena = -E.W * 0.36 * U.inOut(U.tramo(t, 300, CAMBIO));
            xOrigen = E.W / 2 + E.desplX; rOrigen = r;
            if (t >= CAMBIO) {
              cambiado = true;
              var d = destinoEn(CAMBIO);
              E.cambiarMundo(destino, { rot: rotDestino, zoom: d.r / E.Rbase });
              E.desplX = E.desplEscena = 0; E.desplY = 0;
              E.camaraZoom(1, 2600);
            }
          }
          E.brilloEstrellas = 1 + 0.4 * U.meseta(t, 800, 2400, 5600, 7200);
        },
        fondo: function (ctx, t) {
          // después del cambio, el origen se queda pequeño a la izquierda y se apaga
          if (!cambiado) return;
          var a = 1 - U.tramo(t, CAMBIO, CAMBIO + 1800); if (a <= 0) return;
          if (origen === 'tierra') E.dibujarTierra(xOrigen, E.H / 2, rOrigen, { alfa: a, rot: rotOrigen });
          else E.dibujarCuerpo('luna', xOrigen, E.H / 2, rOrigen, rotOrigen, { alfa: a });
        },
        frente: function (ctx, t) {
          if (!cambiado && t > 1800) {
            var d = destinoEn(t);
            if (destino === 'tierra') E.dibujarTierra(d.x, E.H / 2, d.r, { rot: rotDestino });
            else {
              ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.arc(d.x, E.H / 2, d.r, 0, Math.PI * 2); ctx.fill();
              E.dibujarCuerpo('luna', d.x, E.H / 2, d.r, rotDestino);
            }
          }
          // el cuentakilómetros
          var a = U.meseta(t, 600, 1400, 6600, 7800);
          if (a > 0) {
            var km = Math.round(DIST * U.inOut(U.tramo(t, 1000, CAMBIO)));
            FX.texto(U.num(km) + ' km', E.W / 2, E.H * 0.16, { tam: 22, peso: 500, alin: 'center', a: a, color: C.acento, espaciado: 1.5 });
            FX.texto(destino === 'luna' ? 'DE LA TIERRA A LA LUNA' : 'DE LA LUNA A LA TIERRA', E.W / 2, E.H * 0.16 + 26, { tam: 10.5, alin: 'center', a: 0.6 * a, espaciado: 2.4 });
          }
        },
        vuelta: { zoom: 1 }
      };
    }
  });
})();
