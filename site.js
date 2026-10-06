const $ = (s) => document.querySelector(s);
const NS = 'http://www.w3.org/2000/svg';

/* nav */
const nav = $('#nav');
const onScroll = () => nav.classList.toggle('scrolled', scrollY > 40);
addEventListener('scroll', onScroll, { passive: true }); onScroll();

/* staggered blur-in headline */
document.querySelectorAll('.blur-in').forEach((el, i) => (el.style.animationDelay = `${0.06 * i}s`));
$('#lede').style.animation = 'blurIn 1s .7s var(--ease) both';

/* live metric cards */
const cards = [
  ['SS', 'Swing speed', '78 mph, personal best'], ['BS', 'Ball speed', '112 mph first serve'],
  ['SP', 'Spin', '2,840 rpm topspin'], ['RP', 'Racquet path', 'Inside-out, 4° closed'],
  ['IP', 'Impact point', 'Sweet spot, 94%'], ['SV', 'Serve speed', 'Fastest this week: 118 mph'],
  ['CS', 'Club speed', '104 mph driver'], ['PW', 'Punch power', '1,240 N cross'],
  ['TM', 'Tempo', '3 : 1, perfectly smooth'], ['SH', 'Session saved', '212 swings logged'],
];
const cardHTML = (c) => `<div class="glass"><div class="row"><span class="ic">${c[0]}</span><span><b>${c[1]}</b><span class="s">${c[2]}</span></span></div><div class="bar"><i style="width:${60 + ((c[1].length * 7) % 40)}%"></i></div></div>`;
const fill = (a, b, list) => { const h = list.map(cardHTML).join(''); $(a).innerHTML = h; $(b).innerHTML = h; };
fill('#m1', '#m1b', cards);
fill('#m2', '#m2b', [...cards.slice(5), ...cards.slice(0, 5)]);
fill('#m3', '#m3b', [...cards.slice(3), ...cards.slice(0, 3)]);

/* sports carousel */
const sports = [
  ['Tennis', 'Racquet insert', 'Clicks into the string bed. Swing speed, spin, serve speed and racquet path on every stroke.', 'tennis'],
  ['Pickleball & padel', 'Paddle insert', 'Seats flush in the paddle face. Track dinks, drives, bandejas and smashes.', 'padel'],
  ['Golf', 'Grip insert', 'Hides in the butt of the grip. Club speed, tempo and swing plane from the shaft.', 'golf'],
  ['Boxing', 'Wrist band', 'Snaps into a wrist band. Punch power, speed and combos counted round by round.', 'boxing'],
];
$('#carousel').innerHTML = sports.map((s) => `<article class="sport"><img src="images/${s[3]}.webp" alt="PowerBand sensor in a ${s[0].toLowerCase()} setup" loading="lazy"><span class="tag">${s[1]}</span><div class="cap"><h3>${s[0]}</h3><p>${s[2]}</p></div></article>`).join('');
const car = $('#carousel');
$('#prev').onclick = () => car.scrollBy({ left: -360, behavior: 'smooth' });
$('#next').onclick = () => car.scrollBy({ left: 360, behavior: 'smooth' });

/* app screens */
const bars = (vals) => {
  const w = 280, h = 76, m = Math.max(...vals);
  const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * w},${h - (v / m) * (h - 10)}`).join(' ');
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="#1d1d1f" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><polyline points="0,${h} ${pts} ${w},${h}" fill="#c6f432" opacity=".35" stroke="none"/></svg>`;
};
const screens = {
  'Swing speed': { t: 'Forehand · Today', big: '78', u: 'mph', chip: '+6% vs last week', c: [40, 52, 48, 60, 58, 70, 66, 78], m: [['Ball speed', '96', 'mph'], ['Spin', '2.8k', 'rpm'], ['Impact', '94', '%'], ['Tempo', '2.9', ':1']] },
  'Serve': { t: 'First serve · Today', big: '112', u: 'mph', chip: 'Personal best', c: [90, 96, 94, 101, 99, 108, 105, 112], m: [['In %', '68', '%'], ['Spin', '2.2k', 'rpm'], ['Toss', '3.1', 'm'], ['Kick', '4.6', 'ft']] },
  'Racquet path': { t: 'Backhand · Today', big: '4°', u: 'closed', chip: 'Low-to-high 18°', c: [10, 22, 30, 44, 52, 64, 72, 80], m: [['Path', '18', '°'], ['Face', '2', '°'], ['Contact', '0.4', 'm'], ['Follow', '82', '%']] },
  'Spin': { t: 'Topspin · Today', big: '2,840', u: 'rpm', chip: 'Heavy topspin', c: [30, 44, 40, 58, 62, 60, 72, 80], m: [['Top', '2.8k', 'rpm'], ['Slice', '1.1k', 'rpm'], ['Kick', '5.2', 'ft'], ['Bounce', '38', '°']] },
};
const tabs = $('#app-tabs'), screen = $('#screen');
const showScreen = (k) => {
  const s = screens[k];
  screen.innerHTML = `<div class="s-title">${s.t}</div><div class="s-big">${s.big}<small>${s.u}</small></div><span class="s-chip">${s.chip}</span><div class="chart">${bars(s.c)}</div><div class="minis">${s.m.map((m) => `<div class="mini"><span>${m[0]}</span><b>${m[1]}<i>${m[2]}</i></b></div>`).join('')}</div>`;
  tabs.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.textContent === k));
};
tabs.innerHTML = Object.keys(screens).map((k) => `<button>${k}</button>`).join('');
tabs.onclick = (e) => e.target.tagName === 'BUTTON' && showScreen(e.target.textContent);
showScreen('Swing speed');
let ti = 0; const auto = setInterval(() => showScreen(Object.keys(screens)[++ti % 4]), 4200);
tabs.addEventListener('click', () => clearInterval(auto));

/* metric cloud */
$('#cloud').innerHTML = ['Swing speed', 'Ball speed', 'Racquet path', 'Spin rate', 'Serve speed', 'Impact point', 'Swing tempo', 'Club speed', 'Face angle', 'Punch power', 'Shot count', 'Rally length', 'Calories', 'Consistency score', 'Fatigue', 'Session replay'].map((m) => `<span>${m}</span>`).join('');

/* bands */
const bandsList = [
  ['mocha', 'Mocha', 'Suede-finish leather', '#6b4a3b'], ['onyx', 'Onyx', 'Matte black', '#2b2b2d'],
  ['cognac', 'Cognac', 'Tan leather', '#b07a4a'], ['navy', 'Navy', 'Deep blue', '#2c3e6b'],
  ['forest', 'Forest', 'Dark green', '#25503a'], ['bordeaux', 'Bordeaux', 'Wine red', '#6b2c3c'],
  ['stone', 'Stone', 'Light grey', '#d7d4cf'], ['sky', 'Sky', 'Washed blue', '#6f94b8'],
];
let band = 'mocha';
const bandImg = (k) => `images/band-${k}.webp`;
const dots = (el) => { el.innerHTML = bandsList.map((b) => `<span class="dot ${b[0] === band ? 'on' : ''}" role="button" tabindex="0" title="${b[1]}" data-b="${b[0]}" style="background:${b[3]}"></span>`).join(''); };
const setBand = (k) => {
  band = k; const b = bandsList.find((x) => x[0] === k);
  const big = $('#band-big'); big.classList.add('swap');
  setTimeout(() => { big.src = bandImg(k); big.classList.remove('swap'); }, 200);
  $('#band-name').innerHTML = `${b[1]}<small>${b[2]}</small>`;
  dots($('#band-swatches')); dots($('#buy-swatches'));
  document.querySelectorAll('#band-thumbs button').forEach((t) => t.classList.toggle('on', t.dataset.b === k));
  if (typeof refreshGallery === 'function') refreshGallery();
};
$('#band-thumbs').innerHTML = bandsList.map((b) => `<button data-b="${b[0]}"><img src="${bandImg(b[0])}" alt="${b[1]} band" loading="lazy"><span>${b[1]}</span></button>`).join('');
['#band-swatches', '#buy-swatches', '#band-thumbs'].forEach((id) => $(id).addEventListener('click', (e) => { const t = e.target.closest('[data-b]'); if (t) setBand(t.dataset.b); }));
bandsList.forEach((b) => { new Image().src = bandImg(b[0]); });

/* details */
const photo = (f) => `<img src="images/${f}.webp" alt="" loading="lazy">`;
const details = {
  'Sensor': ['A coin-sized sensor. Six grams.', 'Ø24 mm by 7 mm. Nine axes of motion sensing sampled a thousand times a second, from a gentle dink to a 130 mph serve.', () => `<img src="images/sensor-top.webp" alt="PowerBand sensor, top">`, ''],
  'Underside': ['Charge pins, nothing else.', 'Two gold contacts snap onto the magnetic charger. No ports, no flaps, nothing to leak sweat or rain.', () => `<img src="images/sensor-bottom.webp" alt="PowerBand sensor, underside">`, ''],
  'Racquet': ['Clicks into the strings.', 'Sits in the string bed at the throat. Weighs less than the dampener it replaces, so balance and feel stay put.', () => photo('tennis'), 'photo'],
  'Paddle': ['Flush in the paddle face.', 'Seats into pickleball and padel paddles without changing the swing weight.', () => photo('padel'), 'photo'],
  'Grip': ['Hidden in the grip.', 'Slides into the butt of a golf club grip. Measures club speed and tempo from the shaft.', () => photo('golf'), 'photo'],
  'Wrist band': ['Built for boxing. And everything with a punch.', 'Snap the sensor into a soft wrist band. It counts punches, measures power and tracks your rounds.', () => photo('boxing'), 'photo'],
};
let cur = 'Sensor';
const dtabs = $('#detail-tabs'), card = $('#detail-card');
const renderDetail = () => {
  const [h, p, vis, cls] = details[cur];
  card.innerHTML = `<div class="txt"><h3>${h}</h3><p>${p}</p></div><div class="vis ${cls}">${vis()}</div>`;
  dtabs.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.textContent === cur));
};
dtabs.innerHTML = Object.keys(details).map((k) => `<button>${k}</button>`).join('');
dtabs.onclick = (e) => { if (e.target.tagName === 'BUTTON') { cur = e.target.textContent; renderDetail(); } };
renderDetail();

/* buy */
const gal = $('#gallery');
let gview = 'Band';
const gsrc = () => ({ Band: bandImg(band), Sensor: 'images/sensor-top.webp', Underside: 'images/sensor-bottom.webp' })[gview];
gal.innerHTML = `<div id="gal-view"><img alt="PowerBand"></div><div class="gal-tabs"><button class="on">Band</button><button>Sensor</button><button>Underside</button></div>`;
const refreshGallery = () => { $('#gal-view img').src = gsrc(); };
gal.querySelector('.gal-tabs').onclick = (e) => {
  if (e.target.tagName !== 'BUTTON') return;
  gview = e.target.textContent;
  gal.querySelectorAll('.gal-tabs button').forEach((b) => b.classList.toggle('on', b === e.target));
  refreshGallery();
};
const bundles = [['1× PowerBand', '', 149, 179, ''], ['2× PowerBand', 'Train with a partner', 278, 358, 'Best seller'], ['3× PowerBand', 'Racquet, grip and band', 387, 537, 'Top value']];
const opts = $('#opts');
opts.innerHTML = bundles.map((b, i) => `<button class="opt ${i === 1 ? 'on' : ''}">${b[4] ? `<span class="badge">${b[4]}</span>` : ''}<span class="n">${b[0]}${b[1] ? `<small>${b[1]}</small>` : ''}</span><span class="p">$${b[2]}<s>$${b[3]}</s></span></button>`).join('');
opts.onclick = (e) => { const o = e.target.closest('.opt'); if (o) opts.querySelectorAll('.opt').forEach((x) => x.classList.toggle('on', x === o)); };
$('#preorder-btn').onclick = (e) => { e.preventDefault(); $('#preorder-form').classList.add('show'); $('#preorder-form input').focus(); };
$('#preorder-form').onsubmit = (e) => { e.preventDefault(); e.target.classList.remove('show'); $('#thanks').style.display = 'block'; return false; };
setBand('mocha');

/* specs */
const specs = [['6 grams', 'Lighter than the dampener it replaces.'], ['Ø24 × 7 mm', 'Coin-sized. Disappears into any grip or racquet.'], ['1,000 Hz', 'Motion sampled at the moment of impact.'], ['5 days', 'One charge. Gone all week.'], ['Local storage', 'Two days of sessions, no phone needed.'], ['Screenless', 'One green light. All the data in the app.'], ['IP67', 'Sweat, rain and splash proof.'], ['8 band colors', 'Leather-finish straps that snap on in a second.']];
$('#spec-grid').innerHTML = specs.map((s) => `<div class="spec reveal"><b>${s[0]}</b><span>${s[1]}</span></div>`).join('');

/* faq */
const faq = [
  ['What is PowerBand?', 'PowerBand is a tiny, screenless sensor that measures your swing and shows you the data in the PowerBand app. On a racquet it is the size of a coin. For boxing and other sports it snaps into a soft wrist band.'],
  ['Which sports does it work with?', 'Tennis, pickleball, padel, golf and boxing at launch, with more sports on the way.'],
  ['What does it track?', 'Swing speed, ball speed, racquet path, spin, serve speed, impact point, tempo and more, depending on the sport.'],
  ['How do I attach it?', 'The sensor clicks into the string bed of a racquet, a paddle face or a golf grip, and snaps into the wrist band for boxing.'],
  ['Do I need my phone while I play?', 'No. PowerBand stores two days of sessions on the device and syncs when you open the app.'],
  ['Will it change how my racquet feels?', 'It weighs just six grams, less than a standard dampener, so balance and feel stay put.'],
  ['How long does the battery last?', 'Around five days of regular play, and a full charge takes 30 minutes on the magnetic puck.'],
  ['Is my data private?', 'Yes. Your sessions are encrypted, never sold and always yours to export or delete.'],
  ['How much does it cost?', 'The launch pricing shown on this page is a placeholder. Reserve your spot and we will email you the final price before anything is charged.'],
];
$('#faq').innerHTML = faq.map((f) => `<details><summary>${f[0]}</summary><p>${f[1]}</p></details>`).join('');

/* scroll reveal */
const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add('in'), io.unobserve(e.target))), { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

/* hero video */
(() => {
  const v = $('#hero-video'), t = $('#vid-toggle');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) v.removeAttribute('autoplay'), v.pause();
  else {
    const kick = () => v.paused && !v.dataset.manual && v.play().catch(() => {});
    kick(); addEventListener('pointerdown', kick, { once: true }); addEventListener('scroll', kick, { once: true, passive: true });
    new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? kick() : v.pause())), { threshold: 0.05 }).observe(v);
  }
  t.onclick = () => {
    const play = v.paused; v.dataset.manual = play ? '' : '1'; play ? v.play() : v.pause();
    t.setAttribute('aria-label', play ? 'Pause video' : 'Play video');
    t.innerHTML = play ? '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="2" y="1" width="3.5" height="12" rx="1"/><rect x="8.5" y="1" width="3.5" height="12" rx="1"/></svg>' : '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M3 1.5v11l9-5.5z"/></svg>';
  };
})();
