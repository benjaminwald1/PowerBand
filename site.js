const $ = (s) => document.querySelector(s);
const NS = 'http://www.w3.org/2000/svg';

/* nav */
const nav = $('#nav');
const onScroll = () => nav.classList.toggle('scrolled', scrollY > 40);
addEventListener('scroll', onScroll, { passive: true }); onScroll();

/* staggered blur-in headline */
document.querySelectorAll('.blur-in').forEach((el, i) => (el.style.animationDelay = `${0.06 * i}s`));
$('#lede').style.animation = 'blurIn 1s .7s var(--ease) both';

/* string bed */
(() => {
  const g = $('#strings'); let d = '';
  for (let x = -100; x <= 1500; x += 46) d += `M${x} -20V640`;
  for (let y = -20; y <= 640; y += 46) d += `M-100 ${y}H1500`;
  const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); g.appendChild(p);
})();

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

/* sports carousel */
const sports = [
  ['Tennis', 'Racquet', 'Swing speed, spin, serve speed and racquet path on every stroke.', '#0f5132', '#c6f432', 'ball'],
  ['Pickleball', 'Paddle', 'Dink, drive and drop. See the pace and spin you actually produce.', '#0b3a6b', '#6fd3ff', 'ball'],
  ['Padel', 'Racquet', 'Track bandeja, vibora and smash power off the glass.', '#5a1d73', '#ff7ad9', 'ball'],
  ['Golf', 'Club', 'Club speed, tempo and swing plane, straight from the shaft.', '#14532d', '#9be37a', 'arc'],
  ['Boxing', 'Wrist band', 'Punch power, speed and combos counted for you, round by round.', '#7a1411', '#ff6a4d', 'punch'],
  ['Baseball', 'Bat', 'Bat speed, attack angle and time to contact.', '#44280f', '#ffc46b', 'arc'],
  ['Badminton', 'Racquet', 'Smash speed and wrist snap measured to the millisecond.', '#0d4a4a', '#6dffe3', 'ball'],
  ['Squash', 'Racquet', 'Every drive, drop and boast, tracked and mapped.', '#222', '#c6f432', 'ball'],
];
const art = (t, c1, c2) => {
  if (t === 'punch') return `<circle cx="150" cy="190" r="110" fill="${c2}" opacity=".12"/><circle cx="150" cy="190" r="70" fill="${c2}" opacity=".18"/><rect x="95" y="150" width="110" height="80" rx="34" fill="#0b0b0c"/><circle cx="150" cy="190" r="7" fill="${c2}"/><path d="M30 190h50M40 160h40M40 220h40" stroke="${c2}" stroke-width="5" stroke-linecap="round" opacity=".7"/>`;
  if (t === 'arc') return `<path d="M-10 420C80 400 120 150 330 40" fill="none" stroke="${c2}" stroke-width="5" stroke-linecap="round" stroke-dasharray="2 14"/><circle cx="240" cy="110" r="22" fill="#fff"/><circle cx="240" cy="110" r="22" fill="none" stroke="#0003"/><rect x="60" y="250" width="90" height="40" rx="20" fill="#0b0b0c" transform="rotate(-24 105 270)"/><circle cx="105" cy="270" r="6" fill="${c2}" transform="rotate(-24 105 270)"/>`;
  return `<path d="M-10 420C60 380 140 200 330 80" fill="none" stroke="${c2}" stroke-width="5" stroke-linecap="round"/><circle cx="238" cy="140" r="26" fill="${c2}"/><path d="M216 130c14 8 30 8 44-2M218 152c12-8 28-8 42 0" stroke="${c1}" stroke-width="3" fill="none" opacity=".6"/><rect x="70" y="256" width="100" height="44" rx="22" fill="#0b0b0c"/><circle cx="120" cy="278" r="6.5" fill="${c2}"/>`;
};
$('#carousel').innerHTML = sports.map((s) => `<article class="sport"><svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g-${s[0]}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${s[3]}"/><stop offset="1" stop-color="#000"/></linearGradient></defs><rect width="300" height="400" fill="url(#g-${s[0]})"/>${art(s[5], s[3], s[4])}</svg><span class="tag">${s[1]}</span><div class="cap"><h3>${s[0]}</h3><p>${s[2]}</p></div></article>`).join('');
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

/* details */
const colors = { 'Carbone Black': 'url(#body)', 'Arctic White': 'url(#body-w)', 'Volt': 'url(#body-v)', 'Court Orange': 'url(#body-o)' };
const details = {
  'Sensors': ['Nine axes. One thousand reads a second.', 'A 6-axis IMU plus a high-g accelerometer catches everything from a gentle dink to a 130 mph serve.', () => `<svg viewBox="0 0 400 240"><use href="#sensor-art"/></svg>`],
  'Dampener fit': ['Sits right where a dampener does.', 'Weighs about the same as the one you already use, so your racquet balance and feel stay exactly as they were.', () => `<svg viewBox="0 0 400 300"><g stroke="#cfcfd6" stroke-width="3">${[...Array(9)].map((_, i) => `<path d="M${30 + i * 42} 0V300"/>`).join('')}</g><g stroke="#cfcfd6" stroke-width="3"><path d="M0 70H400M0 230H400"/></g><g transform="translate(0 40)"><use href="#sensor-art"/></g></svg>`],
  'Wrist band': ['Built for boxing. And everything with a punch.', 'Snap the sensor into a soft knit band. It counts punches, measures power and tracks your rounds.', () => `<svg viewBox="0 0 400 300"><use href="#band-art"/></svg>`],
  'Colors': ['Pick your color.', 'Four finishes. Swap the sensor between mounts without losing a single session.', null],
  'Battery': ['Five days. Thirty minutes.', 'A full week of casual play on one charge. Top it up on the magnetic puck while you cool down.', () => `<svg viewBox="0 0 400 240"><rect x="60" y="80" width="260" height="90" rx="26" fill="none" stroke="#1d1d1f" stroke-width="8"/><rect x="324" y="108" width="20" height="34" rx="8" fill="#1d1d1f"/><rect x="76" y="96" width="190" height="58" rx="14" fill="#c6f432"/><text x="190" y="215" text-anchor="middle" font-size="26" font-weight="600" fill="#1d1d1f" font-family="-apple-system,Inter,sans-serif">5 days</text></svg>`],
  'Magnetic snap': ['Click. You are ready.', 'Pop it between the strings, onto a club, or into the band. Strong magnets and a silicone grip hold it through the hardest hit.', () => `<svg viewBox="0 0 400 260"><g transform="translate(0 -30) scale(1)"><use href="#sensor-art"/></g><g stroke="#1d1d1f" stroke-width="4" stroke-linecap="round"><path d="M200 210v22M170 214l-8 20M230 214l8 20"/></g><rect x="120" y="236" width="160" height="16" rx="8" fill="#d2d2d7"/></svg>`],
};
let cur = 'Sensors', curColor = 'Carbone Black';
const dtabs = $('#detail-tabs'), card = $('#detail-card');
const renderDetail = () => {
  const [h, p, vis] = details[cur];
  const sw = cur === 'Colors' ? `<div class="swatches">${Object.keys(colors).map((c) => `<span class="sw ${c === curColor ? 'on' : ''}" title="${c}" data-c="${c}" style="background:${{ 'Carbone Black': '#222', 'Arctic White': '#f1f1f4', 'Volt': '#c6f432', 'Court Orange': '#ff6a1f' }[c]}"></span>`).join('')}</div><p style="margin-top:12px;font-size:14px">${curColor}</p>` : '';
  const v = vis ? vis() : `<svg viewBox="0 0 400 240" style="--c:${colors[curColor]}"><use href="#sensor-art" style="--c:${colors[curColor]}"/></svg>`;
  card.innerHTML = `<div class="txt"><h3>${h}</h3><p>${p}</p>${sw}</div><div class="vis" style="--c:${colors[curColor]}">${v}</div>`;
  dtabs.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.textContent === cur));
};
dtabs.innerHTML = Object.keys(details).map((k) => `<button>${k}</button>`).join('');
dtabs.onclick = (e) => { if (e.target.tagName === 'BUTTON') { cur = e.target.textContent; renderDetail(); } };
card.onclick = (e) => { const c = e.target.dataset && e.target.dataset.c; if (c) { curColor = c; renderDetail(); } };
renderDetail();

/* buy */
const gal = $('#gallery');
const views = { Sensor: `<svg viewBox="0 0 400 240"><use href="#sensor-art"/></svg>`, Band: `<svg viewBox="0 0 400 300"><use href="#band-art"/></svg>` };
gal.innerHTML = `<div id="gal-view">${views.Sensor}</div><div class="gal-tabs"><button class="on">Sensor</button><button>Band</button></div>`;
gal.querySelector('.gal-tabs').onclick = (e) => {
  if (e.target.tagName !== 'BUTTON') return;
  gal.querySelectorAll('.gal-tabs button').forEach((b) => b.classList.toggle('on', b === e.target));
  $('#gal-view').innerHTML = views[e.target.textContent];
  $('#gal-view').firstChild.style.cssText = 'width:100%;filter:drop-shadow(0 40px 40px #0003)';
};
$('#gal-view').firstChild.style.cssText = 'width:100%;filter:drop-shadow(0 40px 40px #0003)';
$('#gal-view').style.width = '72%';

const bundles = [['1× PowerBand', '', 149, 179, ''], ['2× PowerBand', 'Train with a partner', 278, 358, 'Best seller'], ['3× PowerBand', 'Racquet, club and band', 387, 537, 'Top value']];
const opts = $('#opts');
opts.innerHTML = bundles.map((b, i) => `<button class="opt ${i === 1 ? 'on' : ''}">${b[4] ? `<span class="badge">${b[4]}</span>` : ''}<span class="n">${b[0]}${b[1] ? `<small>${b[1]}</small>` : ''}</span><span class="p">$${b[2]}<s>$${b[3]}</s></span></button>`).join('');
opts.onclick = (e) => { const o = e.target.closest('.opt'); if (o) opts.querySelectorAll('.opt').forEach((x) => x.classList.toggle('on', x === o)); };
$('#preorder-btn').onclick = (e) => { e.preventDefault(); $('#preorder-form').classList.add('show'); $('#preorder-form input').focus(); };
$('#preorder-form').onsubmit = (e) => { e.preventDefault(); e.target.classList.remove('show'); $('#thanks').style.display = 'block'; return false; };

/* specs */
const specs = [['Featherlight', 'About a dampener. You will forget it is there.'], ['1,000 Hz', 'Motion sampled at the moment of impact.'], ['5 days', 'One charge. Gone all week.'], ['Local storage', 'Two days of sessions, no phone needed.'], ['Screenless', 'No distractions. All the data in the app.'], ['IP67', 'Sweat, rain and splash proof.'], ['Bluetooth 5.3', 'Instant pairing, rock-solid sync.'], ['USB-C puck', 'Fully charged in 30 minutes.']];
$('#spec-grid').innerHTML = specs.map((s) => `<div class="spec reveal"><b>${s[0]}</b><span>${s[1]}</span></div>`).join('');

/* faq */
const faq = [
  ['What is PowerBand?', 'PowerBand is a tiny, screenless sensor that measures your swing and shows you the data in the PowerBand app. On a racquet it is the size of a dampener. For boxing and other sports it snaps into a soft wrist band.'],
  ['Which sports does it work with?', 'Tennis, pickleball, padel, golf, boxing, baseball, badminton and squash at launch, with more on the way.'],
  ['What does it track?', 'Swing speed, ball speed, racquet path, spin, serve speed, impact point, tempo and more, depending on the sport.'],
  ['How do I attach it?', 'For racquets it sits between the strings at the throat, just like a dampener. For clubs and bats use the included mount, and for boxing use the wrist band.'],
  ['Do I need my phone while I play?', 'No. PowerBand stores two days of sessions on the device and syncs when you open the app.'],
  ['Will it change how my racquet feels?', 'It weighs about the same as a standard dampener, so balance and feel stay put.'],
  ['How long does the battery last?', 'Around five days of regular play, and a full charge takes 30 minutes on the magnetic puck.'],
  ['Is my data private?', 'Yes. Your sessions are encrypted, never sold and always yours to export or delete.'],
  ['How much does it cost?', 'The launch pricing shown on this page is a placeholder. Reserve your spot and we will email you the final price before anything is charged.'],
];
$('#faq').innerHTML = faq.map((f) => `<details><summary>${f[0]}</summary><p>${f[1]}</p></details>`).join('');

/* scroll reveal */
const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add('in'), io.unobserve(e.target))), { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
