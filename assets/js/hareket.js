/* Kalissa — hareket katmanı (kütüphanesiz).
   Sayfa dururken onaylı tasarımla aynıdır; hareket yalnız girişte, kaydırmada ve hover'da olur.
   Görünürlük IntersectionObserver ile değil konum ölçümüyle yapılır: gömülü önizlemelerde
   IO tetiklenmiyor (25-TasarimMania tm.js notu). Kaydırma + rAF + yedek zamanlayıcı.
   Kaynaklar: 25-TasarimMania tm.js (sayaç, beliren öğe), 34-Rahmi-Cebeci anasayfa.js (eğim),
   37-FintechZone konsept/b (yaşayan ışık), 25 konsept/10-kinetik-deste (derinlik yığını). */
(function () {
  'use strict';
  var AZ = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var INCE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  window.__hk = 1; // head'deki emniyet zamanlayıcısına "betik çalıştı" der

  function hazir(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  /* --- ortak kaydırma saati: tüm kaydırma işleri tek rAF'te --- */
  var isler = [], planli = 0;
  function calistir() { planli = 0; for (var i = 0; i < isler.length; i++) isler[i](); }
  // rAF gelmezse (gizli sekme) zamanlayıcı devralır; hangisi önce gelirse o çalışır
  function planla() {
    if (planli) return;
    planli = 1;
    var f = function () { if (planli) calistir(); };
    requestAnimationFrame(f); setTimeout(f, 120);
  }
  addEventListener('scroll', planla, { passive: true });
  addEventListener('resize', planla, { passive: true });
  // rAF duraklarsa (arka plan sekmesi, gömülü önizleme) yine de ilerlesin
  var yedek = setInterval(calistir, 450);
  setTimeout(function () { clearInterval(yedek); yedek = setInterval(calistir, 1500); }, 6000);

  /* --- görünür olunca bir kez çalışan işler --- */
  var bekleyen = [];
  function gorununce(el, fn, oran) { bekleyen.push({ el: el, fn: fn, oran: oran || 0.9 }); }
  isler.push(function () {
    if (!bekleyen.length) return;
    var h = innerHeight;
    bekleyen = bekleyen.filter(function (b) {
      var r = b.el.getBoundingClientRect();
      if (r.top < h * b.oran && r.bottom > 0) { b.fn(b.el); return false; }
      return true;
    });
  });

  hazir(function () {
    /* 1. Beliren öğeler */
    [].forEach.call(document.querySelectorAll('[data-r]'), function (el) {
      if (AZ) el.classList.add('is-in');
      else gorununce(el, function (x) { x.classList.add('is-in'); }, 0.92);
    });

    /* 2. Sayaç: HTML gerçek değeri taşır (bot "0" görmez), sonda özgün metin geri yazılır */
    if (!AZ) [].forEach.call(document.querySelectorAll('[data-say]'), function (el) {
      var ham = el.getAttribute('data-say'), hedef = parseFloat(ham), ek = el.getAttribute('data-ek') || '';
      var ond = (ham.split('.')[1] || '').length, son = el.textContent;
      function yaz(v) { el.textContent = v.toLocaleString('tr-TR', { minimumFractionDigits: ond, maximumFractionDigits: ond }) + ek; }
      gorununce(el, function () {
        var t0 = performance.now(), bitti = false;
        function adim(t) {
          if (bitti) return;
          var p = Math.min(1, ((t || performance.now()) - t0) / 1600);
          yaz(hedef * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(adim); else { bitti = true; el.textContent = son; }
        }
        yaz(0); requestAnimationFrame(adim);
        setTimeout(function () { if (!bitti) { bitti = true; el.textContent = son; } }, 2200); // rAF durursa
      }, 0.85);
    });

    /* 3. Paralaks: [data-px="0.06"] kaydırmada yavaşça kayar (görünür olanlar) */
    var px = [].slice.call(document.querySelectorAll('[data-px]'));
    if (!AZ && px.length) isler.push(function () {
      var h = innerHeight;
      px.forEach(function (el) {
        var r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -100 || r.top > h + 100) return;
        var k = parseFloat(el.getAttribute('data-px')) || 0.06;
        el.style.setProperty('--py', (-(r.top + r.height / 2 - h / 2) * k).toFixed(1) + 'px');
      });
    });

    /* 4. İmleç ışığı: bantlar ve kartlar --mx/--my alır */
    if (!AZ && INCE) [].forEach.call(document.querySelectorAll('[data-isik]'), function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        b.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });

    /* 5. Yeşil bant: yaşayan ışık (yarım çözünürlük, yalnız ekrandayken çizer) */
    var tv = document.querySelector('.proof canvas.isik');
    if (tv && !AZ) {
      var c = tv.getContext('2d'), W = 0, H = 0, acik = false, calis = false;
      var boy = function () { W = tv.width = Math.max(1, Math.round(tv.clientWidth * 0.5)); H = tv.height = Math.max(1, Math.round(tv.clientHeight * 0.5)); };
      boy(); addEventListener('resize', boy, { passive: true });
      // adaçayı, krem, altın-mauve: r,g,b, x, y, yarıçap, hızX, hızY, opaklık
      var T = [[111, 143, 123, .18, .40, .62, .00012, .00010, .42],
               [233, 222, 208, .52, .75, .38, -.00009, .00013, .16],
               [176, 132, 104, .78, .30, .44, .00008, -.00011, .26]];
      var ciz = function (ts) {
        if (!acik) { calis = false; return; }
        c.clearRect(0, 0, W, H);
        T.forEach(function (t, i) {
          var x = (t[3] + Math.sin(ts * t[6] + i) * .16) * W, y = (t[4] + Math.cos(ts * t[7] + i * 1.7) * .22) * H;
          var r = t[5] * Math.max(W, H), g = c.createRadialGradient(x, y, 0, x, y, r), rgb = t[0] + ',' + t[1] + ',' + t[2];
          g.addColorStop(0, 'rgba(' + rgb + ',' + t[8] + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
          c.fillStyle = g; c.fillRect(0, 0, W, H);
        });
        requestAnimationFrame(ciz);
      };
      isler.push(function () {
        var r = tv.getBoundingClientRect();
        acik = r.bottom > 0 && r.top < innerHeight;
        if (acik && !calis) { calis = true; requestAnimationFrame(ciz); }
      });
    }

    /* 6. Yorumlar: derinlik yığınından ızgaraya (kaydırmaya bağlı) + eğim */
    var deste = document.querySelector('[data-deste]');
    if (deste) {
      var K = [].slice.call(deste.querySelectorAll('[data-kart]'));
      // x, y, z, rotX, rotY — yelpaze değil, derinlik yığını
      var D = [[90, 50, -220, 12, -16], [0, 80, -340, 16, 0], [-90, 50, -220, 12, 16]];
      var yerlestir = function () {
        var r = deste.getBoundingClientRect(), h = innerHeight;
        if (r.bottom < -200 || r.top > h + 200) return;
        var p = Math.min(1, Math.max(0, (h * 0.98 - r.top) / (h * 0.55))), e = 1 - Math.pow(1 - p, 3), k = 1 - e;
        K.forEach(function (kart, i) {
          var d = D[i] || D[1], s = kart.style;
          s.setProperty('--sx', (d[0] * k).toFixed(1) + 'px'); s.setProperty('--sy', (d[1] * k).toFixed(1) + 'px');
          s.setProperty('--sz', (d[2] * k).toFixed(1) + 'px'); s.setProperty('--srx', (d[3] * k).toFixed(2) + 'deg');
          s.setProperty('--sry', (d[4] * k).toFixed(2) + 'deg'); s.setProperty('--so', (0.25 + 0.75 * e).toFixed(3));
        });
        deste.classList.toggle('is-acik', e > 0.985);
      };
      var genis = function () { return innerWidth > 900; };
      if (!AZ && genis()) { isler.push(function () { if (genis()) yerlestir(); else deste.classList.add('is-acik'); }); yerlestir(); }
      else deste.classList.add('is-acik');

      if (!AZ && INCE) K.forEach(function (kart) {
        kart.addEventListener('pointermove', function (e) {
          var b = kart.getBoundingClientRect(), x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height;
          kart.style.setProperty('--ry', ((x - 0.5) * 7).toFixed(2) + 'deg');
          kart.style.setProperty('--rx', ((0.5 - y) * 7).toFixed(2) + 'deg');
          kart.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
          kart.style.setProperty('--my', (y * 100).toFixed(1) + '%');
        });
        kart.addEventListener('pointerleave', function () {
          kart.style.setProperty('--rx', '0deg'); kart.style.setProperty('--ry', '0deg');
        });
      });
    }

    /* 7. 3D eğim kartları [data-tilt] (+ ışık) ve sahnelerin kaydırmayla girişi */
    if (!AZ && INCE) [].forEach.call(document.querySelectorAll('[data-tilt]'), function (k) {
      k.addEventListener('pointermove', function (e) {
        var b = k.getBoundingClientRect(), x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height;
        k.style.setProperty('--ry', ((x - 0.5) * 10).toFixed(2) + 'deg');
        k.style.setProperty('--rx', ((0.5 - y) * 8).toFixed(2) + 'deg');
        k.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        k.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      });
      k.addEventListener('pointerleave', function () { k.style.setProperty('--rx', '0deg'); k.style.setProperty('--ry', '0deg'); });
    });
    var sahneler = [].slice.call(document.querySelectorAll('.sd-sahne .sd-kart'));
    if (!AZ && sahneler.length) isler.push(function () {
      var h = innerHeight;
      sahneler.forEach(function (k) {
        var r = k.getBoundingClientRect(); if (r.bottom < -100 || r.top > h + 100) return;
        var p = Math.min(1, Math.max(0, (h * 0.95 - r.top) / (h * 0.6))), e = 1 - Math.pow(1 - p, 3);
        k.style.setProperty('--ent', (1 - e).toFixed(3));
      });
    });

    /* 8. Süreç adımları: sırayla vurgulanır, yüzen etiket aktif adımı gösterir */
    var surec = document.querySelector('[data-surec]');
    if (surec && !AZ) {
      var L = [].slice.call(surec.querySelectorAll('.sd-steps li')), et = surec.querySelector('.sd-etiket'), aktif = -1, zam = 0, gor = false, ust = false;
      var sec = function (i) {
        aktif = i;
        L.forEach(function (li, j) { li.classList.toggle('is-aktif', j === i); });
        if (et) { et.querySelector('b').textContent = L[i].querySelector('.sd-num').textContent; et.querySelector('span').textContent = L[i].querySelector('h3').textContent; }
      };
      var bas = function () { if (!zam) zam = setInterval(function () { if (!ust) sec((aktif + 1) % L.length); }, 3400); };
      var dur = function () { clearInterval(zam); zam = 0; };
      isler.push(function () {
        var r = surec.getBoundingClientRect(), g = r.top < innerHeight * 0.8 && r.bottom > innerHeight * 0.2;
        if (g && !gor) { gor = true; surec.classList.add('is-dongu'); sec(0); bas(); }
        else if (!g && gor) { gor = false; dur(); }
      });
      L.forEach(function (li, i) {
        li.addEventListener('mouseenter', function () { ust = true; dur(); sec(i); });
        li.addEventListener('mouseleave', function () { ust = false; if (gor) bas(); });
      });
    }

    /* 9. Yapışkan randevu çubuğu: hero geçilince görünür, CTA görünürken gizlenir */
    var yp = document.querySelector('[data-yapiskan]');
    if (yp) {
      var hero = document.querySelector('.sd-hero'), son = document.querySelector('.sd-cta') || document.querySelector('footer');
      isler.push(function () {
        var a = hero ? hero.getBoundingClientRect().bottom : 0, b = son ? son.getBoundingClientRect().top : 1e9;
        yp.classList.toggle('is-gor', a < 0 && b > innerHeight * 0.9);
      });
    }

    calistir(); // ilk ölçüm
  });
})();
