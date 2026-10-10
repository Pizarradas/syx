/**
 * SYX — Pila isométrica del hero de la home
 * ─────────────────────────────────────────
 * Las siete @layer como placas en isométrica real, animadas con GSAP:
 *
 *   1. Entrada: se trazan las escuadras y la cota, cada placa dibuja su
 *      contorno de abajo arriba (el orden de la cascada) y entran cantos,
 *      relleno y rayado.
 *   2. Giro independiente: la pila se abre un poco y cada capa gira 90° por su
 *      cuenta, alternando el sentido, como las caras de un cubo de Rubik.
 *   3. Giro en conjunto: la pila se cierra y gira entera; la capa azul asienta.
 *   4. Scroll (ScrollTrigger + ScrambleText): el hero se fija, la cámara se
 *      aleja, la pila se abre y cada placa recibe su nombre de capa.
 *   5. Arrastre (Draggable + Inertia): sobre una placa gira esa capa; sobre el
 *      fondo, la pila entera. Al soltar encaja en el múltiplo de 90°.
 *
 * Reglas del estrato isométrico (mind-system/knowledges/isometric/03-animacion):
 * la geometría sale de datos —ángulo, separación, apertura, elevación— y se
 * proyecta en cada fotograma; nada de scaleY ni de transform sobre la figura.
 * La "cámara" es el viewBox: alejarla es un escalado uniforme de toda la
 * escena, que la proyección paralela admite.
 *
 * Es DECORATIVA (aria-hidden): no dice nada que no esté en el texto. Solo se
 * ve donde el tema enciende la figura del hero (--component-hero-figure-
 * display-wide; hoy, syx-sketch) y en pantalla ancha. Si el SVG no se ve, no
 * se anima nada ni se fija el hero. Sin JS, el SVG queda `hidden` y la página
 * conserva la figura estática del ::after. Con movimiento reducido aparece en
 * su estado final: sin entrada, sin hero fijo ni arrastre.
 *
 * Dependencias: GSAP 3.13 y sus plugins, copiados en js/site/vendor/gsap/.
 * Esta carpeta NO entra en el paquete de npm (package.json → files solo
 * publica js/syx-*.js): SYX sigue sin dependencias.
 *
 * Uso (home.html):
 *   <svg class="org-home-hero__stack" data-hero-stack aria-hidden="true" focusable="false" hidden></svg>
 *   <script src="js/site/vendor/gsap/gsap.min.js" defer></script> … plugins …
 *   <script src="js/site/hero-stack.js" defer></script>
 */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var P = 'org-home-hero__stack-';          // prefijo de las piezas
  var COS30 = 0.8660254;
  var N = 7;              // capas
  var HALF = 75;          // media arista de la placa (unidades de mundo = px)
  var THICK = 7;          // canto
  var CX = 191.9;         // centro de la pila en pantalla
  var BASE = 325;         // y del centro de la placa inferior
  var GAP = 36;           // separación de reposo
  var GAP_TWIST = 4;      // apertura extra durante el giro de la entrada
  var GAP_SCROLL = 28;    // apertura extra en la vista explosionada
  var MID = (N - 1) / 2;
  var DIM_X = 40;         // x de la cota vertical
  var TAG_X = 420;        // x de los rótulos de capa
  var VB_REST = [0, 0, 383, 465];          // el mismo marco que la figura estática
  var VB_OPEN = [-10, -199, 690, 838];     // misma proporción: el SVG no cambia de alto
  var CORNERS = [[-HALF, -HALF], [HALF, -HALF], [HALF, HALF], [-HALF, HALF]];
  // De abajo arriba, como manda la cascada. El número del rótulo es la precedencia.
  var LAYERS = [
    ['syx.reset', 'Lowest priority · global reset'],
    ['syx.base', 'Typography · HTML elements'],
    ['syx.tokens', 'CSS variables, all 4 kinds'],
    ['syx.atoms', 'Buttons, icons, pills, inputs'],
    ['syx.molecules', 'Cards, form fields'],
    ['syx.organisms', 'Page sections, layouts'],
    ['syx.utilities', 'Highest priority · helpers']
  ];

  function mk(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function cls(name) { return P + name; }
  function project(wx, wy, wz) { return [CX + (wx - wy) * COS30, BASE + (wx + wy) * 0.5 - wz]; }
  function pt(p) { return p[0].toFixed(2) + ',' + p[1].toFixed(2); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function f(v) { return v.toFixed(2); }

  function mount(svg, gsap) {
    svg.textContent = '';
    var defs = mk('defs', {}, svg);

    var frame = mk('g', { 'class': cls('frame') }, svg);
    var brackets = [0, 1, 2, 3, 4, 5, 6, 7].map(function () {
      return mk('line', { 'class': cls('guide'), pathLength: 1 }, frame);
    });

    // Placas, de abajo arriba: el orden del DOM es el orden de profundidad.
    var plates = [];
    for (var i = 0; i < N; i++) {
      var g = mk('g', { 'class': cls('plate') + (i === N - 1 ? ' ' + cls('plate') + '--accent' : ''), 'data-iso-part': 'layer-' + (i + 1), 'data-layer': i }, svg);
      var sides = [0, 1, 2, 3].map(function () { return mk('polygon', { 'class': cls('side'), pathLength: 1 }, g); });
      var fill = mk('polygon', { 'class': cls('top') }, g);
      var pat = null, hatch = null;
      if (i < 2) {
        var pid = 'syx-hero-stack-hatch-' + i;
        pat = mk('pattern', { id: pid, width: 9, height: 9, patternUnits: 'userSpaceOnUse' }, defs);
        mk('line', { x1: 0, y1: 0, x2: 0, y2: 9, 'class': cls('hatch-line') }, pat);
        hatch = mk('polygon', { 'class': cls('hatch'), fill: 'url(#' + pid + ')' }, g);
      }
      var edge = mk('polygon', { 'class': cls('edge'), pathLength: 1 }, g);
      var guide = mk('line', { 'class': cls('guide') + ' ' + cls('guide') + '--dash' }, g);
      plates.push({ i: i, sides: sides, fill: fill, pat: pat, hatch: hatch, edge: edge, guide: guide, theta: 0, lift: 0, guideT: 0 });
    }

    // Rótulos de la vista explosionada, por encima de todo.
    var tagsG = mk('g', { 'class': cls('tags') }, svg);
    var tags = LAYERS.map(function (L, n) {
      var leader = mk('line', { 'class': cls('leader'), pathLength: 1 }, tagsG);
      var num = mk('text', { 'class': cls('tag-num') }, tagsG);
      num.textContent = '0' + (n + 1);
      var name = mk('text', { 'class': cls('tag-name') }, tagsG);
      var desc = mk('text', { 'class': cls('tag-desc') }, tagsG);
      return { leader: leader, num: num, name: name, desc: desc, label: L[0], text: L[1] };
    });

    var dim = mk('g', { 'class': cls('dims') }, svg);
    var vLine = mk('line', { 'class': cls('dim'), pathLength: 1 }, dim);
    var arrowTop = mk('polyline', { 'class': cls('dim') }, dim);
    var arrowBot = mk('polyline', { 'class': cls('dim') }, dim);
    var label = mk('text', { 'class': cls('label'), 'text-anchor': 'middle' }, dim);
    label.textContent = '7 LAYERS';
    var wLine = mk('line', { 'class': cls('guide'), pathLength: 1 }, dim);
    var wTickL = mk('line', { 'class': cls('guide') }, dim);
    var wTickR = mk('line', { 'class': cls('guide') }, dim);

    // theta y gap los mueve la entrada; open, el scroll; theta por placa, el arrastre.
    var stack = { theta: 0, gap: GAP, open: 0 };

    function render() {
      var o = stack.open;
      var vb = VB_REST.map(function (v, k) { return lerp(v, VB_OPEN[k], o); });
      var k = vb[2] / VB_REST[2];                     // escala de cámara
      svg.setAttribute('viewBox', vb.map(f).join(' '));
      svg.style.setProperty('--component-hero-stack-scale', k.toFixed(3));

      // Escuadras ancladas a las esquinas de la vista.
      var x0 = vb[0] + 10 * k, y0 = vb[1] + 10 * k, x1 = vb[0] + vb[2] - 10 * k, y1 = vb[1] + vb[3] - 10 * k, L = 13 * k;
      [[x0, y0, x0 + L, y0], [x0, y0, x0, y0 + L], [x1, y0, x1 - L, y0], [x1, y0, x1, y0 + L],
       [x0, y1, x0 + L, y1], [x0, y1, x0, y1 - L], [x1, y1, x1 - L, y1], [x1, y1, x1, y1 - L]].forEach(function (c, n) {
        var b = brackets[n];
        b.setAttribute('x1', f(c[0])); b.setAttribute('y1', f(c[1])); b.setAttribute('x2', f(c[2])); b.setAttribute('y2', f(c[3]));
      });

      var gap = stack.gap + o * GAP_SCROLL;
      var yTop = Infinity, yBot = -Infinity, xMin = Infinity, xMax = -Infinity;
      for (var n = 0; n < plates.length; n++) {
        var p = plates[n];
        var th = (stack.theta + p.theta) * Math.PI / 180;
        var c = Math.cos(th), s = Math.sin(th);
        var z = MID * GAP + (p.i - MID) * gap + p.lift;
        var w = CORNERS.map(function (q) { return [q[0] * c - q[1] * s, q[0] * s + q[1] * c]; });
        var top = w.map(function (q) { return project(q[0], q[1], z); });
        var bot = w.map(function (q) { return project(q[0], q[1], z - THICK); });

        // Cantos visibles: los que miran hacia el observador (normal · (1,1) > 0).
        var slot = 0, j;
        for (j = 0; j < 4; j++) {
          var a = w[j], b2 = w[(j + 1) % 4];
          if (a[0] + b2[0] + a[1] + b2[1] > 0.001) {
            var side = p.sides[slot++];
            side.setAttribute('points', [top[j], top[(j + 1) % 4], bot[(j + 1) % 4], bot[j]].map(pt).join(' '));
            side.style.visibility = 'visible';
          }
        }
        for (; slot < 4; slot++) p.sides[slot].style.visibility = 'hidden';

        var pts = top.map(pt).join(' ');
        p.fill.setAttribute('points', pts);
        p.edge.setAttribute('points', pts);

        // Rayado en el plano de la placa: gira y se desplaza con ella.
        if (p.hatch) {
          var oc = project(0, 0, z);
          var m = [COS30 * (c - s), 0.5 * (c + s), COS30 * (-s - c), 0.5 * (c - s), oc[0], oc[1]];
          p.pat.setAttribute('patternTransform', 'matrix(' + m.map(function (v) { return v.toFixed(4); }).join(' ') + ')');
          p.hatch.setAttribute('points', pts);
        }

        // Referencia desde el vértice más alto hacia la cota.
        var hi = top[0], right = top[0];
        for (j = 1; j < 4; j++) {
          if (top[j][1] < hi[1]) hi = top[j];
          if (top[j][0] > right[0]) right = top[j];
        }
        var gx = hi[0] - 8;
        p.guide.setAttribute('x1', f(gx)); p.guide.setAttribute('y1', f(hi[1]));
        p.guide.setAttribute('x2', f(gx + (DIM_X - gx) * p.guideT)); p.guide.setAttribute('y2', f(hi[1]));
        p.guide.style.visibility = p.guideT > 0 ? 'visible' : 'hidden';

        // Rótulo: guía desde el vértice derecho hasta la columna de nombres.
        var t = tags[n], fs = 11 * k;
        t.leader.setAttribute('x1', f(right[0] + 6)); t.leader.setAttribute('y1', f(right[1]));
        t.leader.setAttribute('x2', f(TAG_X - 8)); t.leader.setAttribute('y2', f(right[1]));
        t.num.setAttribute('x', TAG_X); t.num.setAttribute('y', f(right[1] - 2 * k));
        t.num.setAttribute('font-size', f(fs));
        t.name.setAttribute('x', f(TAG_X + 26 * k)); t.name.setAttribute('y', f(right[1] - 2 * k));
        t.name.setAttribute('font-size', f(fs));
        t.desc.setAttribute('x', f(TAG_X + 26 * k)); t.desc.setAttribute('y', f(right[1] + 13 * k));
        t.desc.setAttribute('font-size', f(9.5 * k));

        for (j = 0; j < 4; j++) {
          yTop = Math.min(yTop, top[j][1]);
          yBot = Math.max(yBot, bot[j][1]);
          xMin = Math.min(xMin, top[j][0]);
          xMax = Math.max(xMax, top[j][0]);
        }
      }

      // Las cotas miden la pila en vivo.
      var a4 = 4 * k, a10 = 10 * k;
      vLine.setAttribute('x1', DIM_X); vLine.setAttribute('x2', DIM_X);
      vLine.setAttribute('y1', f(yTop)); vLine.setAttribute('y2', f(yBot));
      arrowTop.setAttribute('points', f(DIM_X - a4) + ',' + f(yTop + a10) + ' ' + DIM_X + ',' + f(yTop) + ' ' + f(DIM_X + a4) + ',' + f(yTop + a10));
      arrowBot.setAttribute('points', f(DIM_X - a4) + ',' + f(yBot - a10) + ' ' + DIM_X + ',' + f(yBot) + ' ' + f(DIM_X + a4) + ',' + f(yBot - a10));
      var lx = DIM_X - 14 * k, my = f((yTop + yBot) / 2);
      label.setAttribute('x', f(lx)); label.setAttribute('y', my);
      label.setAttribute('font-size', f(10.5 * k));
      label.setAttribute('transform', 'rotate(-90 ' + f(lx) + ' ' + my + ')');
      var wy = yBot + 26 * k;
      wLine.setAttribute('x1', f(xMin)); wLine.setAttribute('x2', f(xMax));
      wLine.setAttribute('y1', f(wy)); wLine.setAttribute('y2', f(wy));
      [[wTickL, xMin], [wTickR, xMax]].forEach(function (q) {
        q[0].setAttribute('x1', f(q[1])); q[0].setAttribute('x2', f(q[1]));
        q[0].setAttribute('y1', f(wy - 5 * k)); q[0].setAttribute('y2', f(wy + 5 * k));
      });
    }

    var edges = plates.map(function (p) { return p.edge; });
    var sidesAll = [].concat.apply([], plates.map(function (p) { return p.sides; }));
    var faces = [].concat.apply([], plates.map(function (p) { return p.hatch ? [p.fill, p.hatch] : [p.fill]; }));
    var drawn = brackets.concat(edges, sidesAll, [vLine, wLine]);
    var tagText = [].concat.apply([], tags.map(function (t) { return [t.num, t.name, t.desc]; }));
    var leaders = tags.map(function (t) { return t.leader; });

    function setStart() {
      gsap.set(drawn, { strokeDasharray: 1, strokeDashoffset: 1 });
      gsap.set(faces.concat([arrowTop, arrowBot, label, wTickL, wTickR]), { opacity: 0 });
      gsap.set(sidesAll, { fillOpacity: 0 });
      gsap.set(leaders, { strokeDasharray: 1, strokeDashoffset: 1 });
      gsap.set(tagText, { opacity: 0 });
      tags.forEach(function (t) { t.name.textContent = ''; t.desc.textContent = ''; });
      plates.forEach(function (p) { p.guideT = 0; p.theta = 0; p.lift = 0; });
      stack.theta = 0; stack.gap = GAP; stack.open = 0;
      render();
    }

    function intro() {
      var tl = gsap.timeline({ onUpdate: render });
      tl.to(brackets, { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out', stagger: 0.03 }, 0);
      tl.to(vLine, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' }, 0.2);
      plates.forEach(function (p, n) {
        var t = 0.3 + n * 0.14;
        tl.to(p.edge, { strokeDashoffset: 0, duration: 0.7, ease: 'power1.inOut' }, t);
        tl.to(p.sides, { strokeDashoffset: 0, duration: 0.45, ease: 'power1.out' }, t + 0.4);
        tl.to(p.hatch ? [p.fill, p.hatch] : [p.fill], { opacity: 1, duration: 0.5, ease: 'power1.out' }, t + 0.55);
        tl.to(p.sides, { fillOpacity: 0.94, duration: 0.5, ease: 'power1.out' }, t + 0.55);
        tl.to(p, { guideT: 1, duration: 0.5, ease: 'power2.out' }, t + 0.6);
      });
      tl.to(wLine, { strokeDashoffset: 0, duration: 0.6, ease: 'power2.out' }, 0.9);
      tl.to([arrowTop, arrowBot, label, wTickL, wTickR], { opacity: 1, duration: 0.4, ease: 'power1.out' }, 1.2);
      return tl;
    }

    // Giro: primero cada capa por su cuenta (Rubik), luego la pila entera.
    function twist() {
      var tl = gsap.timeline({ onUpdate: render });
      tl.to(stack, { gap: GAP + GAP_TWIST, duration: 0.55, ease: 'power2.inOut' }, 0);
      for (var n = N - 1; n >= 0; n--) {
        tl.to(plates[n], { theta: (n % 2 ? '-=' : '+=') + '90', duration: 0.75, ease: 'power3.inOut' }, 0.2 + (N - 1 - n) * 0.1);
      }
      tl.to(stack, { theta: '+=90', gap: GAP, duration: 1.2, ease: 'power3.inOut' }, '>-0.05');
      var topPlate = plates[N - 1];
      tl.to(topPlate, { lift: 9, duration: 0.22, ease: 'power2.out' }, '>-0.2');
      tl.to(topPlate, { lift: 0, duration: 0.6, ease: 'back.out(3)' });
      return tl;
    }

    // Vista explosionada: la cámara se aleja, la pila se abre y cada capa recibe su nombre.
    function explode() {
      var tl = gsap.timeline({ onUpdate: render });
      tl.to(stack, { open: 1, duration: 1, ease: 'power2.inOut' }, 0);
      tags.forEach(function (t, n) {
        var at = 0.3 + n * 0.08;
        tl.to(t.leader, { strokeDashoffset: 0, duration: 0.2, ease: 'none' }, at);
        tl.to(t.num, { opacity: 1, duration: 0.08 }, at + 0.1);
        tl.to(t.name, { opacity: 1, duration: 0.3, scrambleText: { text: t.label, chars: '01{}<>/#@;', speed: 0.6 } }, at + 0.1);
        tl.to(t.desc, { opacity: 1, duration: 0.3, scrambleText: { text: t.text, chars: 'lowerCase', speed: 0.6 } }, at + 0.18);
      });
      tl.to({}, { duration: 0.2 });   // una pausa con todo legible antes de soltar el pin
      return tl;
    }

    // Arrastre: sobre una placa gira esa capa; sobre el fondo, la pila entera.
    var DEG_PER_PX = 0.6, STEP = 90 / DEG_PER_PX;
    function enableDrag(Draggable) {
      var proxy = document.createElement('div');
      var target = stack;
      var d = Draggable.create(proxy, {
        type: 'x', trigger: svg, inertia: true, allowContextMenu: true,
        snap: { x: function (v) { return Math.round(v / STEP) * STEP; } },
        onPress: function (e) {
          var hit = e.target && e.target.closest ? e.target.closest('.' + cls('plate')) : null;
          target = hit ? plates[+hit.getAttribute('data-layer')] : stack;
          gsap.killTweensOf(target, 'theta');
          gsap.set(proxy, { x: target.theta / DEG_PER_PX });
          this.update();
        },
        onDrag: function () { target.theta = this.x * DEG_PER_PX; render(); },
        onThrowUpdate: function () { target.theta = this.x * DEG_PER_PX; render(); },
        onRelease: function () {
          if (!this.tween || !this.tween.isActive()) {
            gsap.to(target, { theta: Math.round(target.theta / 90) * 90, duration: 0.4, ease: 'back.out(2)', onUpdate: render });
          }
        }
      })[0];
      return d;
    }

    function play() {
      setStart();
      var master = gsap.timeline();
      master.add(intro()).add(twist(), '+=0.25');
      return master;
    }
    function finish() {
      play().progress(1).pause();
      render();
    }

    return { play: play, finish: finish, explode: explode, enableDrag: enableDrag };
  }

  /* ── Arranque ─────────────────────────────────────────────────────────── */
  var svg = document.querySelector('[data-hero-stack]');
  var gsap = window.gsap;
  if (!svg || !gsap || !window.ScrollTrigger || !window.ScrambleTextPlugin || !window.Draggable || !window.InertiaPlugin) return;
  gsap.registerPlugin(window.ScrollTrigger, window.ScrambleTextPlugin, window.Draggable, window.InertiaPlugin);

  var hero = svg.closest('.org-home-hero');
  var header = document.getElementById('site-header');
  var themeLink = document.getElementById('syx-theme-css');
  var LIVE = 'org-home-hero--live';
  var hs = mount(svg, gsap);
  var ctx = null;

  // Se pregunta al CSS en vez de al nombre del tema: si el token no está, la
  // hoja cargada no trae la capa del sitio y el hero sigue como siempre.
  function hasSiteLayer() {
    return getComputedStyle(hero).getPropertyValue('--component-hero-stack-ink').trim() !== '';
  }

  function setup() {
    if (ctx) { ctx.revert(); ctx = null; }
    var on = hasSiteLayer();
    // toggleAttribute y no .hidden: SVGElement no tiene esa propiedad.
    svg.toggleAttribute('hidden', !on);
    hero.classList.toggle(LIVE, on);
    if (!on) return;

    ctx = gsap.context(function () {
      var mm = gsap.matchMedia();
      mm.add({
        motion: '(prefers-reduced-motion: no-preference)',
        wide: '(min-width: 64em)'          // breakpoint(laptop): la figura solo se ve ahí
      }, function (c) {
        // Ver, no suponer: el tema decide con su token de display si hay figura.
        if (!c.conditions.wide || getComputedStyle(svg).display === 'none') return;
        if (!c.conditions.motion) { hs.finish(); return; }

        var drag = null;
        var master = hs.play();
        master.eventCallback('onComplete', function () { drag = hs.enableDrag(window.Draggable); });

        window.ScrollTrigger.create({
          trigger: hero,
          // Se fija cuando la figura queda centrada en el hueco bajo la
          // cabecera fija: el hero suele medir más que la pantalla, y lo que
          // tiene que verse entero mientras la pila se abre es la figura.
          // Si ya lo está al cargar, desde el principio.
          start: function () {
            var r = svg.getBoundingClientRect();
            var top = header ? header.offsetHeight : 0;
            var centre = r.top + window.scrollY + r.height / 2;
            return Math.max(0, Math.round(centre - (window.innerHeight + top) / 2));
          },
          end: '+=120%',
          pin: true,
          scrub: 0.6,
          animation: hs.explode(),
          invalidateOnRefresh: true
        });

        return function () { if (drag) drag.kill(); };
      });
    });
  }

  setup();
  // El selector de temas cambia el href de la hoja: al cargar la nueva, se
  // vuelve a decidir si hay figura (y la entrada se repite al volver a sketch).
  if (themeLink) themeLink.addEventListener('load', setup);
})();
