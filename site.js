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
const I = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const cards = [
  ['Swing speed', '78 mph, personal best', I('<path d="M4 18a9 9 0 1116 0"/><path d="M12 18l4-6"/>'), '#2f9e5a', '#e5f7ec'],
  ['Ball speed', '112 mph first serve', I('<circle cx="12" cy="12" r="8"/><path d="M5 9c4 1 10 1 14 0M5 15c4-1 10-1 14 0"/>'), '#c98a00', '#fdf3d6'],
  ['Spin', '2,840 rpm topspin', I('<path d="M20 12a8 8 0 01-14 5M4 12a8 8 0 0114-5"/><path d="M18 3v4h-4M6 21v-4h4"/>'), '#7a5af0', '#eeeaff'],
  ['Racquet path', 'Inside-out, 4° closed', I('<path d="M3 18c6 0 9-4 12-8s4-5 6-5"/><circle cx="15" cy="10" r="2"/>'), '#2a6fdb', '#e4eeff'],
  ['Impact point', 'Sweet spot, 94%', I('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>'), '#d6455f', '#ffe8ec'],
  ['Serve speed', 'Fastest this week: 118 mph', I('<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>'), '#e07a1f', '#ffeedd'],
  ['Club speed', '104 mph driver', I('<path d="M7 21V4l10 4-10 4"/>'), '#168f86', '#dcf5f2'],
  ['Punch power', '1,240 N cross', I('<path d="M8 11V6a2 2 0 014 0v4M12 9a2 2 0 014 0v2M16 11a2 2 0 014 0v3a7 7 0 01-7 7h-1a6 6 0 01-5-3l-3-5a2 2 0 013-2l2 2"/>'), '#c0392b', '#ffe9e6'],
  ['Tempo', '3 : 1, perfectly smooth', I('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 3h6"/>'), '#6f7df0', '#e8eafe'],
  ['Session saved', '212 swings logged', I('<path d="M5 12l4.5 4.5L19 7"/>'), '#2f9e5a', '#e5f7ec'],
  ['Everyone synced', 'Coach sees it instantly', I('<path d="M20 11a8 8 0 00-14-4M4 13a8 8 0 0014 4"/><path d="M18 3v4h-4M6 21v-4h4"/>'), '#2a6fdb', '#e4eeff'],
  ['CSV exported', 'Ready for Excel', I('<rect x="4" y="5" width="16" height="14" rx="3"/><path d="M4 10h16M10 10v9"/>'), '#2f9e5a', '#e5f7ec'],
];
const cardHTML = (c, i) => `<div class="glass"><div class="row"><span class="ic" style="background:${c[4]};color:${c[3]}">${c[2]}</span><span><b>${c[0]}</b><span class="s">${c[1]}</span></span></div><div class="bar"><i style="width:${55 + ((i * 17) % 42)}%"></i></div></div>`;
const fill = (a, b, list) => { const h = list.map(cardHTML).join(''); $(a).innerHTML = h; $(b).innerHTML = h; };
fill('#m1', '#m1b', cards);
fill('#m2', '#m2b', [...cards.slice(4), ...cards.slice(0, 4)]);
fill('#m3', '#m3b', [...cards.slice(8), ...cards.slice(0, 8)]);

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
const smooth = (pts) => pts.reduce((d, p, i, a) => {
  if (!i) return `M${p[0]},${p[1]}`;
  const p0 = a[i - 2] || p, p1 = a[i - 1], p2 = p, p3 = a[i + 1] || p;
  const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
  return `${d} C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0]},${p2[1]}`;
}, '');
const areaChart = (vals, w = 296, h = 118, tip = '') => {
  const mx = Math.max(...vals) * 1.08, mn = Math.min(...vals) * 0.85;
  const pts = vals.map((v, i) => [+(10 + (i / (vals.length - 1)) * (w - 20)).toFixed(1), +(h - 12 - ((v - mn) / (mx - mn)) * (h - 30)).toFixed(1)]);
  const d = smooth(pts), last = pts[pts.length - 1];
  return `<svg viewBox="0 0 ${w} ${h}" class="ac"><defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c6f432" stop-opacity=".7"/><stop offset="1" stop-color="#c6f432" stop-opacity="0"/></linearGradient></defs>
  ${[0, 1, 2, 3].map((i) => `<line x1="0" x2="${w}" y1="${14 + i * 30}" y2="${14 + i * 30}" stroke="#0000000d"/>`).join('')}
  <path d="${d} L${last[0]},${h} L${pts[0][0]},${h} Z" fill="url(#ag)"/><path d="${d}" fill="none" stroke="#1d1d1f" stroke-width="2.6" stroke-linecap="round"/>
  <line x1="${last[0]}" x2="${last[0]}" y1="${last[1]}" y2="${h}" stroke="#1d1d1f" stroke-dasharray="3 3" opacity=".35"/>
  <circle cx="${last[0]}" cy="${last[1]}" r="9" fill="#c6f432" opacity=".5"/><circle cx="${last[0]}" cy="${last[1]}" r="4.5" fill="#1d1d1f" stroke="#fff" stroke-width="2"/>
  ${tip ? `<g transform="translate(${last[0] - 62},${Math.max(last[1] - 34, 2)})"><rect width="60" height="22" rx="11" fill="#1d1d1f"/><text x="30" y="15" text-anchor="middle" font-size="11" font-weight="600" fill="#fff" font-family="inherit">${tip}</text></g>` : ''}
  </svg>`;
};
const spark = (vals, col = '#1d1d1f') => { const mx = Math.max(...vals), mn = Math.min(...vals); const pts = vals.map((v, i) => [i * (60 / (vals.length - 1)), 18 - ((v - mn) / (mx - mn || 1)) * 16]); return `<svg viewBox="0 0 60 20" class="sp"><path d="${smooth(pts)}" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round"/></svg>`; };
const ico = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const tabbar = (on) => `<div class="tb">${[['Home', '<path d="M4 11l8-7 8 7v9H4z"/>'], ['Swings', '<path d="M3 17l5-9 4 6 3-4 6 7"/>'], ['Trends', '<path d="M5 20V10M12 20V4M19 20v-7"/>'], ['You', '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>']].map((t, i) => `<span class="${i === on ? 'on' : ''}">${ico(t[1])}<em>${t[0]}</em></span>`).join('')}</div>`;
const status = '<div class="sb"><b>9:41</b><span class="sbi"><i></i><i></i><i class="b"></i></span></div>';
const seg = (a) => `<div class="seg">${['Day', 'Week', 'Month'].map((x, i) => `<span class="${i === a ? 'on' : ''}">${x}</span>`).join('')}</div>`;
const swing = (n, sp, tag, t) => `<div class="sl"><span class="sd">${n}</span><div><b>${sp}</b><small>${t}</small></div><em>${tag}</em></div>`;
const screens = {
  'Swing speed': () => `${status}<div class="ah"><div><small>Tennis · Forehand</small><h5>Today</h5></div>${seg(0)}</div>
    <div class="hero-n"><span>78</span><i>mph</i><em class="up">▲ 6% vs last week</em></div>${areaChart([42, 47, 45, 52, 50, 58, 56, 63, 61, 70, 66, 78], 296, 118, '78 mph')}
    <div class="g2"><div class="m"><small>Ball speed</small><b>96<i>mph</i></b>${spark([60, 70, 66, 80, 78, 96])}</div><div class="m"><small>Spin</small><b>2.8k<i>rpm</i></b>${spark([40, 52, 48, 60, 58, 70], '#7aa800')}</div><div class="m"><small>Impact</small><b>94<i>%</i></b>${spark([60, 66, 70, 72, 80, 94])}</div><div class="m"><small>Tempo</small><b>2.9<i>:1</i></b>${spark([3.4, 3.1, 3.2, 3.0, 2.9, 2.9], '#7aa800')}</div></div>
    <p class="lh">Recent swings</p>${swing(1, '78 mph', 'Best', 'Forehand · 2:14 PM')}${swing(2, '74 mph', 'Topspin', 'Forehand · 2:13 PM')}${tabbar(1)}`,
  'Serve': () => `${status}<div class="ah"><div><small>Tennis · First serve</small><h5>Serve</h5></div>${seg(0)}</div>
    <div class="hero-n"><span>112</span><i>mph</i><em class="up">★ Personal best</em></div>
    <div class="face"><svg viewBox="0 0 300 176"><defs><radialGradient id="h1"><stop offset="0" stop-color="#ff5a36" stop-opacity=".85"/><stop offset="1" stop-color="#ff5a36" stop-opacity="0"/></radialGradient><radialGradient id="h2"><stop offset="0" stop-color="#c6f432" stop-opacity=".95"/><stop offset="1" stop-color="#c6f432" stop-opacity="0"/></radialGradient><clipPath id="rc"><ellipse cx="150" cy="86" rx="98" ry="76"/></clipPath></defs>
      <ellipse cx="150" cy="86" rx="98" ry="76" fill="#fff" stroke="#1d1d1f" stroke-width="5"/>
      <g clip-path="url(#rc)" stroke="#0000001f" stroke-width="1">${[...Array(13)].map((_, i) => `<path d="M${58 + i * 15} 0V176"/>`).join('')}${[...Array(11)].map((_, i) => `<path d="M0 ${20 + i * 15}H300"/>`).join('')}
        <ellipse cx="144" cy="82" rx="34" ry="28" fill="url(#h2)" stroke="none"/><ellipse cx="180" cy="104" rx="22" ry="18" fill="url(#h1)" stroke="none"/></g>
      <circle cx="144" cy="82" r="27" fill="none" stroke="#1d1d1f" stroke-dasharray="3 4" stroke-width="1.6"/>
      ${[[138, 78], [150, 86], [144, 90], [156, 76], [133, 88], [182, 104], [176, 108]].map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="3.4" fill="#1d1d1f" stroke="#fff" stroke-width="1.5"/>`).join('')}
      <rect x="140" y="148" width="20" height="40" rx="6" fill="#1d1d1f"/></svg><span class="fl">Sweet spot 94%</span></div>
    <div class="g2"><div class="m"><small>First serve in</small><b>68<i>%</i></b>${spark([55, 60, 58, 64, 66, 68])}</div><div class="m"><small>Spin</small><b>2.2k<i>rpm</i></b>${spark([30, 40, 38, 44, 50, 52], '#7aa800')}</div></div>
    <p class="lh">Last 5 serves</p><div class="pills"><span>112</span><span>109</span><span class="d">104</span><span>111</span><span>108</span></div>${tabbar(1)}`,
  'Racquet path': () => `${status}<div class="ah"><div><small>Tennis · Backhand</small><h5>Racquet path</h5></div>${seg(0)}</div>
    <div class="hero-n"><span>4°</span><i>closed face</i><em class="up">Low-to-high 18°</em></div>
    <div class="face path"><svg viewBox="0 0 300 150"><defs><linearGradient id="pg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c6f432" stop-opacity="0"/><stop offset="1" stop-color="#9ac81a"/></linearGradient></defs>
      <path d="M12 134H288" stroke="#0000001f"/><path d="M18 118C70 120 110 100 150 80S232 36 276 24" fill="none" stroke="url(#pg)" stroke-width="9" stroke-linecap="round"/>
      <path d="M18 118C70 120 110 100 150 80S232 36 276 24" fill="none" stroke="#1d1d1f" stroke-width="1.6" stroke-dasharray="2 5"/>
      <g transform="translate(150 80) rotate(-28)"><rect x="-4" y="-34" width="8" height="68" rx="4" fill="#1d1d1f"/></g><circle cx="150" cy="80" r="9" fill="#fff" stroke="#1d1d1f" stroke-width="2"/>
      <text x="162" y="62" font-size="10" font-weight="600" fill="#1d1d1f" font-family="inherit">Contact</text><text x="196" y="34" font-size="10" fill="#6e6e73" font-family="inherit">Follow-through</text><text x="20" y="108" font-size="10" fill="#6e6e73" font-family="inherit">Backswing</text></svg></div>
    <div class="g2"><div class="m"><small>Path angle</small><b>18<i>°</i></b>${spark([10, 12, 14, 15, 17, 18])}</div><div class="m"><small>Face angle</small><b>4<i>° closed</i></b>${spark([8, 7, 6, 5, 5, 4], '#7aa800')}</div><div class="m"><small>Contact point</small><b>0.4<i>m</i></b>${spark([.2, .3, .3, .4, .4, .4])}</div><div class="m"><small>Follow-through</small><b>82<i>%</i></b>${spark([60, 66, 70, 74, 80, 82], '#7aa800')}</div></div>${tabbar(1)}`,
  'Spin': () => `${status}<div class="ah"><div><small>Tennis · Topspin</small><h5>Spin</h5></div>${seg(0)}</div>
    <div class="gauge"><svg viewBox="0 0 300 168"><defs><linearGradient id="gg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d9f77a"/><stop offset="1" stop-color="#7ab800"/></linearGradient></defs>
      <path d="M30 150A120 120 0 0 1 270 150" fill="none" stroke="#0000000f" stroke-width="20" stroke-linecap="round"/><path d="M30 150A120 120 0 0 1 270 150" fill="none" stroke="url(#gg)" stroke-width="20" stroke-linecap="round" stroke-dasharray="377" stroke-dashoffset="${377 - 377 * 0.8}"/>
      ${[0, 1, 2, 3, 4].map((i) => `<text x="${30 + i * 60}" y="${i === 0 || i === 4 ? 166 : i === 2 ? 14 : 62 - (i === 1 || i === 3 ? 0 : 0)}" font-size="0"></text>`).join('')}
      <text x="150" y="112" text-anchor="middle" font-size="46" font-weight="600" fill="#1d1d1f" font-family="inherit" letter-spacing="-2">2,840</text><text x="150" y="136" text-anchor="middle" font-size="14" fill="#6e6e73" font-family="inherit">rpm · Heavy topspin</text></svg></div>
    <div class="bars">${[['Topspin', 2840, 3500, '#9ac81a'], ['Slice', 1100, 3500, '#1d1d1f'], ['Flat', 420, 3500, '#b9b9bf']].map((b) => `<div><span>${b[0]}<b>${b[1].toLocaleString()} rpm</b></span><i><u style="width:${(b[1] / b[2]) * 100}%;background:${b[3]}"></u></i></div>`).join('')}</div>
    <div class="g2"><div class="m"><small>Kick height</small><b>5.2<i>ft</i></b>${spark([3, 3.6, 4, 4.4, 5, 5.2])}</div><div class="m"><small>Bounce angle</small><b>38<i>°</i></b>${spark([30, 32, 34, 36, 37, 38], '#7aa800')}</div></div>${tabbar(2)}`,
};
const tabs = $('#app-tabs'), screen = $('#screen');
let curScreen = 'Swing speed';
const showScreen = (k) => {
  curScreen = k;
  screen.classList.remove('in'); void screen.offsetWidth;
  screen.innerHTML = screens[k]();
  screen.classList.add('in');
  tabs.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.textContent === k));
};
tabs.innerHTML = Object.keys(screens).map((k) => `<button>${k}</button>`).join('');
tabs.onclick = (e) => e.target.tagName === 'BUTTON' && showScreen(e.target.textContent);
showScreen('Swing speed');
let ti = 0; const auto = setInterval(() => showScreen(Object.keys(screens)[++ti % 4]), 5200);
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
const dots = (el) => { el.innerHTML = bandsList.map((b) => `<span class="dot ${b[0] === band ? 'on' : ''}" role="button" tabindex="0" title="${b[1]}" aria-label="${b[1]}" data-b="${b[0]}" style="background:${b[3]}"></span>`).join(''); };
const setBand = (k) => {
  band = k; const b = bandsList.find((x) => x[0] === k);
  const hb = $('#hero-band'); hb.classList.add('swap');
  setTimeout(() => { hb.src = bandImg(k); hb.classList.remove('swap'); }, 180);
  $('#band-name').innerHTML = `${b[1]}<small>${b[2]}</small>`;
  dots($('#hero-swatches')); dots($('#buy-swatches'));
  if (typeof refreshGallery === 'function') refreshGallery();
};
['#hero-swatches', '#buy-swatches'].forEach((id) => $(id).addEventListener('click', (e) => { const t = e.target.closest('[data-b]'); if (t) setBand(t.dataset.b); }));
bandsList.forEach((b) => { new Image().src = bandImg(b[0]); });

/* details */
const photo = (f) => `<img src="images/${f}.webp" alt="" loading="lazy">`;
const details = {
  'Sensor': ['A coin-sized sensor. Six grams.', 'Ø24 mm by 7 mm. Nine axes of motion sensing sampled a thousand times a second, from a gentle dink to a 130 mph serve.', () => `<img class="mult" src="images/sensor-top.webp" alt="PowerBand sensor, top">`, ''],
  'Underside': ['Charge pins, nothing else.', 'Two gold contacts snap onto the magnetic charger. No ports, no flaps, nothing to leak sweat or rain.', () => `<img class="mult" src="images/sensor-bottom.webp" alt="PowerBand sensor, underside">`, ''],
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
const refreshGallery = () => { const im = $('#gal-view img'); im.src = gsrc(); im.classList.toggle('mult', gview !== 'Band'); };
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
let bundleIdx = 1;
opts.onclick = (e) => { const o = e.target.closest('.opt'); if (o) { opts.querySelectorAll('.opt').forEach((x) => x.classList.toggle('on', x === o)); bundleIdx = [...opts.children].indexOf(o); } };

/* checkout */
const co = $('#checkout'), coForm = $('#co-form'), coMsg = $('#co-msg');
const money = (n) => `$${n.toLocaleString()}`;
const openCo = () => {
  const b = bundles[bundleIdx], bd = bandsList.find((x) => x[0] === band);
  $('#co-img').src = bandImg(band);
  $('#co-title').textContent = b[0];
  $('#co-lines').innerHTML = `<div><span>${b[0]}</span><b>${money(b[3])}</b></div><div><span>Launch discount</span><b class="g">&minus;${money(b[3] - b[2])}</b></div><div><span>Band</span><b>${bd[1]}</b></div><div><span>Shipping</span><b>Free</b></div><div class="tot"><span>Total</span><b>${money(b[2])}</b></div>`;
  coMsg.hidden = true; co.hidden = false; document.body.classList.add('lock');
  setTimeout(() => $('#co-email').focus(), 50);
};
const closeCo = () => { co.hidden = true; document.body.classList.remove('lock'); };
$('#preorder-btn').onclick = openCo;
co.addEventListener('click', (e) => e.target.hasAttribute('data-close') && closeCo());
addEventListener('keydown', (e) => e.key === 'Escape' && !co.hidden && closeCo());
coForm.onsubmit = (e) => {
  e.preventDefault();
  const email = $('#co-email').value.trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) { coMsg.hidden = false; coMsg.className = 'co-msg err'; coMsg.textContent = 'Enter a valid email so we can send your receipt.'; return; }
  const link = ((window.POWERBAND_CHECKOUT || {}).links || {})[bundleIdx + 1];
  if (link) {
    const u = new URL(link); u.searchParams.set('prefilled_email', email); u.searchParams.set('client_reference_id', `bundle${bundleIdx + 1}-${band}`);
    $('#co-pay').textContent = 'Redirecting to secure payment...'; location.href = u.toString(); return;
  }
  coMsg.hidden = false; coMsg.className = 'co-msg';
  coMsg.textContent = 'Card payments open at launch. Your pick is noted, and we will email you the moment checkout goes live.';
};
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

/* mini app inside the detail grid */
(() => {
  const el = $('#mini-app'); if (!el) return;
  const bars = [46, 62, 38, 74, 58, 88, 30], days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'], today = 5;
  const ring = (pct, col, val, lbl) => `<div class="rg"><svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="17" fill="none" stroke="#0000000f" stroke-width="5"/><circle cx="22" cy="22" r="17" fill="none" stroke="${col}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${(106.8 * pct).toFixed(1)} 107" transform="rotate(-90 22 22)"/></svg><b>${val}</b><small>${lbl}</small></div>`;
  const row = (icon, bg, fg, name, meta, val) => `<div class="mr"><span class="mt" style="background:${bg};color:${fg}">${icon}</span><div><b>${name}</b><small>${meta}</small></div><em>${val}</em></div>`;
  el.innerHTML = `
    <div class="mh"><b>9:41</b><span class="sbi"><i></i><i></i><i class="b"></i></span></div>
    <div class="mtop"><div><small>Sep 28 – Oct 4</small><h6>This week</h6></div><span class="av">A</span></div>
    <div class="mhero"><div class="mhh"><span>Weekly load</span><em>▲ 12%</em></div><div class="mbig">1,842<i>swings</i></div>
      <div class="mbars">${bars.map((h, i) => `<span class="${i === today ? 'on' : ''}"><u style="height:${h}%"></u><s>${days[i]}</s></span>`).join('')}</div></div>
    <div class="mrings">${ring(.78, '#8bc10a', '78', 'mph')}${ring(.92, '#1d1d1f', '92', 'Form')}${ring(.6, '#4a8cf0', '6/10', 'Goal')}</div>
    <p class="mlh">Recent sessions</p>
    ${row(I('<circle cx="12" cy="12" r="8"/><path d="M5 9c4 1 10 1 14 0M5 15c4-1 10-1 14 0"/>'), '#fdf3d6', '#c98a00', 'Tennis', '212 swings · 1h 12m', '78')}
    ${row(I('<path d="M7 21V4l10 4-10 4"/>'), '#dcf5f2', '#168f86', 'Golf', '36 swings · 2h 05m', '104')}
    ${row(I('<path d="M8 11V6a2 2 0 014 0v4M12 9a2 2 0 014 0v2M16 11a2 2 0 014 0v3a7 7 0 01-7 7h-1a6 6 0 01-5-3l-3-5a2 2 0 013-2l2 2"/>'), '#ffe9e6', '#c0392b', 'Boxing', '9 rounds · 27m', '1.2k')}
    ${tabbar(0)}<i class="hi"></i>`;
})();
