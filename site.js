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
  ['Tennis', 'Racquet insert', 'Slides between two strings and grips in place. Swing speed, spin, serve speed and racquet path on every stroke.', 'tennis'],
  ['Pickleball & padel', 'Paddle insert', 'Seats flush in the paddle face. Track dinks, drives, bandejas and smashes.', 'padel'],
  ['Golf', 'Grip insert', 'Hides in the butt of the grip. Club speed, tempo and swing plane from the shaft.', 'golf'],
  ['Boxing', 'Wrist band', 'Snaps into a wrist band. Punch power, speed and combos counted round by round.', 'boxing'],
];
$('#carousel').innerHTML = sports.map((s) => `<article class="sport"><img src="images/${s[3]}.webp?v=3" alt="PowerBand sensor in a ${s[0].toLowerCase()} setup" loading="lazy"><span class="tag">${s[1]}</span><div class="cap"><h3>${s[0]}</h3><p>${s[2]}</p></div></article>`).join('');
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
const status = '<div class="sb"><b>9:41</b><span class="sbi"><svg viewBox="0 0 17 11" width="17" height="11" fill="currentColor"><rect x="0" y="7" width="3" height="4" rx=".8"/><rect x="4.7" y="5" width="3" height="6" rx=".8"/><rect x="9.4" y="2.6" width="3" height="8.4" rx=".8"/><rect x="14" y="0" width="3" height="11" rx=".8"/></svg><svg viewBox="0 0 16 11" width="15" height="11" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M1.2 3.6a9.6 9.6 0 0113.6 0M3.5 6a6.3 6.3 0 019 0"/><circle cx="8" cy="9" r="1.3" fill="currentColor" stroke="none"/></svg><svg viewBox="0 0 27 12" width="25" height="12" fill="none"><rect x=".6" y=".6" width="22.4" height="10.8" rx="3.3" stroke="currentColor" opacity=".45"/><rect x="2.1" y="2.1" width="17.5" height="7.8" rx="2" fill="currentColor"/><path d="M24.6 4v4c.9-.3 1.5-1.1 1.5-2s-.6-1.7-1.5-2z" fill="currentColor" opacity=".5"/></svg></span></div>';
const seg = (a) => `<div class="seg">${['Day', 'Week', 'Month'].map((x, i) => `<span class="${i === a ? 'on' : ''}">${x}</span>`).join('')}</div>`;
const swing = (n, sp, tag, t) => `<div class="sl"><span class="sd">${n}</span><div><b>${sp}</b><small>${t}</small></div><em>${tag}</em></div>`;
const WG = '#25e665', WB = '#1c9bff', WS = '#7ba1bb';
const wring = (pct, col, val, lbl, sz = 96, unit = '') => `<div class="wr" style="width:${sz}px;--sz:${sz}px"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="none" stroke="#ffffff1c" stroke-width="8"/><circle cx="50" cy="50" r="42" fill="none" stroke="${col}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${(263.9 * pct).toFixed(1)} 264" transform="rotate(-90 50 50)" style="filter:drop-shadow(0 0 5px ${col}88)"/></svg><b class="wn">${val}<i>${unit}</i></b><small>${lbl}</small></div>`;
const wline = (vals, w = 296, h = 96, col = WG) => {
  const mx = Math.max(...vals) * 1.06, mn = Math.min(...vals) * 0.82;
  const pts = vals.map((v, i) => [+(8 + (i / (vals.length - 1)) * (w - 16)).toFixed(1), +(h - 10 - ((v - mn) / (mx - mn)) * (h - 22)).toFixed(1)]);
  const d = smooth(pts), l = pts[pts.length - 1];
  return `<svg viewBox="0 0 ${w} ${h}" class="wl"><defs><linearGradient id="wg${col.slice(1)}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".38"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs>
  ${[0, 1, 2].map((i) => `<line x1="0" x2="${w}" y1="${12 + i * 30}" y2="${12 + i * 30}" stroke="#ffffff12" stroke-dasharray="2 4"/>`).join('')}
  <path d="${d} L${l[0]},${h} L${pts[0][0]},${h} Z" fill="url(#wg${col.slice(1)})"/><path d="${d}" fill="none" stroke="${col}" stroke-width="2.4" stroke-linecap="round" style="filter:drop-shadow(0 0 4px ${col}99)"/>
  <circle cx="${l[0]}" cy="${l[1]}" r="8" fill="${col}" opacity=".25"/><circle cx="${l[0]}" cy="${l[1]}" r="3.6" fill="#fff"/></svg>`;
};
const whead = (kick, title, tog = true) => `<div class="wh"><div><small>${kick}</small><h5>${title}</h5></div>${tog ? '<div class="wseg"><span class="on">DAY</span><span>WEEK</span></div>' : ''}</div>`;
const wact = (iconPath, name, meta, val, col) => `<div class="wa"><span class="wi" style="color:${col};box-shadow:0 0 0 1.5px ${col}55 inset">${ico(iconPath)}</span><div><b>${name}</b><small>${meta}</small></div><em class="wn" style="color:${col}">${val}</em></div>`;
const wkpi = (lbl, val, unit, bar, col = WG) => `<div class="wk"><small>${lbl}</small><b class="wn">${val}<i>${unit}</i></b><span class="wbar"><u style="width:${bar}%;background:${col};box-shadow:0 0 8px ${col}88"></u></span></div>`;
const BALL = '<circle cx="12" cy="12" r="8"/><path d="M5 9c4 1 10 1 14 0M5 15c4-1 10-1 14 0"/>', FLAG = '<path d="M7 21V4l10 4-10 4"/>', FIST = '<path d="M8 11V6a2 2 0 014 0v4M12 9a2 2 0 014 0v2M16 11a2 2 0 014 0v3a7 7 0 01-7 7h-1a6 6 0 01-5-3l-3-5a2 2 0 013-2l2 2"/>';
const screens = {
  'Swing speed': () => `${status}${whead('MON, OCT 5', 'Overview')}
    <div class="wrings">${wring(.87, WG, '87', 'POWER', 100, '%')}${wring(.68, WB, '14.2', 'LOAD', 100)}${wring(.92, WS, '92', 'FORM', 100, '%')}</div>
    <div class="wk2"><div class="wk"><small>SHOTS TODAY</small><b class="wn" data-count="248">0</b><span class="wsub">▲ 36 vs your average</span></div><div class="wk"><small>TOTAL SHOTS</small><b class="wn" data-count="12486">0</b><span class="wsub">Since you started</span></div></div>
    <div class="wc"><div class="wct"><small>SWING SPEED</small><em class="wd">▲ 6%</em></div><div class="wbig wn">78<i>mph</i></div>${wline([42, 47, 45, 52, 50, 58, 56, 63, 61, 70, 66, 78])}</div>
    <p class="wlh">TODAY'S SESSIONS</p>${wact(BALL, 'Tennis', '1h 12m · 212 shots', '12.4', WB)}${wact(FLAG, 'Golf', '2h 05m · 36 shots', '8.1', WB)}${tabbar(0)}`,
  'Serve': () => `${status}${whead('TENNIS · FIRST SERVE', 'Serve')}
    <div class="wbigrow"><span class="wbig wn">112<i>mph</i></span><em class="wd">★ PERSONAL BEST</em></div>
    <div class="wc wface"><svg viewBox="0 0 300 168"><defs><radialGradient id="wh1"><stop offset="0" stop-color="#25e665" stop-opacity=".95"/><stop offset="1" stop-color="#25e665" stop-opacity="0"/></radialGradient><radialGradient id="wh2"><stop offset="0" stop-color="#ff5a36" stop-opacity=".9"/><stop offset="1" stop-color="#ff5a36" stop-opacity="0"/></radialGradient><clipPath id="wrc"><ellipse cx="150" cy="82" rx="98" ry="74"/></clipPath></defs>
      <g clip-path="url(#wrc)"><ellipse cx="144" cy="78" rx="36" ry="30" fill="url(#wh1)"/><ellipse cx="184" cy="102" rx="24" ry="20" fill="url(#wh2)"/>
      <g stroke="#ffffff26">${[...Array(13)].map((_, i) => `<path d="M${58 + i * 15} 0V170"/>`).join('')}${[...Array(11)].map((_, i) => `<path d="M0 ${16 + i * 15}H300"/>`).join('')}</g></g>
      <ellipse cx="150" cy="82" rx="98" ry="74" fill="none" stroke="#fff" stroke-width="4"/><circle cx="144" cy="78" r="27" fill="none" stroke="#fff" stroke-dasharray="3 4" stroke-width="1.5"/>
      ${[[138, 74], [150, 82], [144, 86], [156, 72], [133, 84], [184, 102], [178, 106]].map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="3.2" fill="#fff"/>`).join('')}</svg><span class="wchip">SWEET SPOT 94%</span></div>
    <div class="wk2">${wkpi('FIRST SERVE IN', '68', '%', 68)}${wkpi('SPIN', '2.2k', 'rpm', 62, WB)}</div>
    <p class="wlh">LAST 5 SERVES</p><div class="wbars5">${[112, 109, 104, 111, 108].map((v, i) => `<span><u style="height:${(v - 80) * 2.4}px;${i === 0 ? `background:${WG};box-shadow:0 0 10px ${WG}88` : ''}"></u><s class="wn">${v}</s></span>`).join('')}</div>${tabbar(1)}`,
  'Racquet path': () => `${status}${whead('TENNIS · BACKHAND', 'Racquet path')}
    <div class="wbigrow"><span class="wbig wn">4°<i>closed face</i></span><em class="wd">LOW-TO-HIGH 18°</em></div>
    <div class="wc"><svg viewBox="0 0 300 150" class="wl"><defs><linearGradient id="wpg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#25e665" stop-opacity="0"/><stop offset="1" stop-color="#25e665"/></linearGradient></defs>
      ${[0, 1, 2, 3].map((i) => `<line x1="0" x2="300" y1="${24 + i * 34}" y2="${24 + i * 34}" stroke="#ffffff12" stroke-dasharray="2 4"/>`).join('')}
      <path d="M14 120C70 124 110 102 150 82S232 38 284 26" fill="none" stroke="url(#wpg)" stroke-width="8" stroke-linecap="round" style="filter:drop-shadow(0 0 6px #25e66599)"/>
      <g transform="translate(150 82) rotate(-28)"><rect x="-4" y="-34" width="8" height="68" rx="4" fill="#fff"/></g><circle cx="150" cy="82" r="9" fill="#000" stroke="#25e665" stroke-width="2.4"/>
      <text x="164" y="64" font-size="10" font-weight="700" fill="#fff" font-family="inherit">CONTACT</text><text x="196" y="36" font-size="9" fill="#8a949c" font-family="inherit">FOLLOW-THROUGH</text><text x="18" y="110" font-size="9" fill="#8a949c" font-family="inherit">BACKSWING</text></svg></div>
    <div class="wk2">${wkpi('PATH ANGLE', '18', '°', 72)}${wkpi('FACE ANGLE', '4', '° closed', 30, WB)}${wkpi('CONTACT POINT', '0.4', 'm', 54, WS)}${wkpi('FOLLOW-THROUGH', '82', '%', 82)}</div>${tabbar(1)}`,
  'Spin': () => `${status}${whead('TENNIS · TOPSPIN', 'Spin')}
    <div class="wspin">${wring(.81, WG, '2,840', 'RPM · HEAVY TOPSPIN', 190)}</div>
    <div class="wc wbars">${[['TOPSPIN', 2840, WG], ['SLICE', 1100, WB], ['FLAT', 420, WS]].map((b) => `<div><span>${b[0]}<b class="wn">${b[1].toLocaleString()}</b></span><i><u style="width:${(b[1] / 3500) * 100}%;background:${b[2]};box-shadow:0 0 8px ${b[2]}88"></u></i></div>`).join('')}</div>
    <div class="wk2">${wkpi('KICK HEIGHT', '5.2', 'ft', 70)}${wkpi('BOUNCE ANGLE', '38', '°', 58, WB)}</div>${tabbar(2)}`,
};
const countUp = (root) => root.querySelectorAll('[data-count]').forEach((el) => {
  const to = +el.dataset.count, t0 = performance.now(), dur = 1100;
  const step = (t) => { const k = Math.min((t - t0) / dur, 1); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))).toLocaleString(); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
});
const tabs = $('#app-tabs'), screen = $('#screen');
let curScreen = 'Swing speed';
const showScreen = (k) => {
  curScreen = k;
  screen.classList.remove('in'); void screen.offsetWidth;
  screen.innerHTML = screens[k]();
  screen.classList.add('in');
  countUp(screen);
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
const photo = (f) => `<img src="images/${f}.webp?v=3" alt="" loading="lazy">`;
const details = {
  'Tennis 3D': ['Two grooves. Zero tools.', 'A solid body with a narrow groove on each side. It sits in the middle of four strings, two mains and two crosses, and its groove grips all four on top of the weave. Drag to spin it a full 360 degrees.', () => `<div class="viewer"><canvas></canvas><span class="vhint"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 11-3-6.7"/><path d="M21 4v5h-5"/></svg>Drag to rotate 360°</span><button type="button" class="vtog on">String bed</button></div>`, 'v3d'],
  'Pickleball 3D': ['Locks onto the grip.', 'A soft, leather-finish PowerBand wraps the top of your grip and holds the sensor in its pocket. It slides on in seconds and the sensor clicks in and out. Tap Detach to see it come off, then drag to spin the paddle 360 degrees.', () => `<div class="viewer" data-mode="paddle"><canvas></canvas><span class="vhint"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 11-3-6.7"/><path d="M21 4v5h-5"/></svg>Drag to rotate 360°</span><button type="button" class="vtog on">Detach sensor</button></div>`, 'v3d'],
  'Photo': ['A coin-sized sensor. Six grams.', 'Ø24 mm by 7 mm. Nine axes of motion sensing sampled a thousand times a second, from a gentle dink to a 130 mph serve.', () => `<img class="mult" src="images/sensor-top.webp" alt="PowerBand sensor, top">`, ''],
  'Underside': ['Charge pins, nothing else.', 'Two gold contacts snap onto the magnetic charger. No ports, no flaps, nothing to leak sweat or rain.', () => `<img class="mult" src="images/sensor-bottom.webp" alt="PowerBand sensor, underside">`, ''],
  'Racquet': ['Slides between the strings.', 'Two narrow side grooves grip a pair of strings at the throat. Weighs less than the dampener it replaces, so balance and feel stay put.', () => photo('tennis'), 'photo'],
  'Paddle': ['Flush in the paddle face.', 'Seats into pickleball and padel paddles without changing the swing weight.', () => photo('padel'), 'photo'],
  'Grip': ['Hidden in the grip.', 'Slides into the butt of a golf club grip. Measures club speed and tempo from the shaft.', () => photo('golf'), 'photo'],
  'Wrist band': ['Built for boxing. And everything with a punch.', 'Snap the sensor into a soft wrist band. It counts punches, measures power and tracks your rounds.', () => photo('boxing'), 'photo'],
};
let cur = 'Tennis 3D';
const dtabs = $('#detail-tabs'), card = $('#detail-card');
const renderDetail = () => {
  const [h, p, vis, cls] = details[cur];
  card.innerHTML = `<div class="txt"><h3>${h}</h3><p>${p}</p></div><div class="vis ${cls}">${vis()}</div>`;
  dtabs.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.textContent === cur));
  if (window.splitText) window.splitText(card);
  const vw = card.querySelector('.viewer');
  if (vw) { if (window.mountSensor3D) window.mountSensor3D(vw); else window.__mount3d = vw; }
};
dtabs.innerHTML = Object.keys(details).map((k) => `<button>${k}</button>`).join('');
dtabs.onclick = (e) => { if (e.target.tagName === 'BUTTON') { cur = e.target.textContent; renderDetail(); } };
renderDetail();

/* buy */
const gal = $('#gallery');
let gview = 'Band';
const gsrc = () => ({ Band: bandImg(band), Sensor: 'images/sensor-top.webp' })[gview];
gal.innerHTML = `<div id="gal-view"><img alt="PowerBand"></div><div class="gal-tabs"><button class="on">Band</button><button>Sensor</button></div>`;
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
  $('#co-lines').innerHTML = `<div><span>${b[0]}</span><b>${money(b[3])}</b></div><div><span>Launch discount</span><b class="g">&minus;${money(b[3] - b[2])}</b></div><div><span>Band</span><b>${bd[1]}</b></div><div><span>Shipping</span><b>At payment</b></div><div class="tot"><span>Total</span><b>${money(b[2])}</b></div>`;
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
  ['How do I attach it?', 'The sensor slides between two racquet strings and grips in place, a paddle face or a golf grip, and snaps into the wrist band for boxing.'],
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
  const row = (icon, col, name, meta, val) => `<div class="mr"><span class="mt" style="color:${col};box-shadow:0 0 0 1.2px ${col}66 inset">${icon}</span><div><b>${name}</b><small>${meta}</small></div><em class="wn" style="color:${col}">${val}</em></div>`;
  el.innerHTML = `
    <div class="mh"><b>9:41</b><span class="sbi"><svg viewBox="0 0 17 11" width="17" height="11" fill="currentColor"><rect x="0" y="7" width="3" height="4" rx=".8"/><rect x="4.7" y="5" width="3" height="6" rx=".8"/><rect x="9.4" y="2.6" width="3" height="8.4" rx=".8"/><rect x="14" y="0" width="3" height="11" rx=".8"/></svg><svg viewBox="0 0 16 11" width="15" height="11" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M1.2 3.6a9.6 9.6 0 0113.6 0M3.5 6a6.3 6.3 0 019 0"/><circle cx="8" cy="9" r="1.3" fill="currentColor" stroke="none"/></svg><svg viewBox="0 0 27 12" width="25" height="12" fill="none"><rect x=".6" y=".6" width="22.4" height="10.8" rx="3.3" stroke="currentColor" opacity=".45"/><rect x="2.1" y="2.1" width="17.5" height="7.8" rx="2" fill="currentColor"/><path d="M24.6 4v4c.9-.3 1.5-1.1 1.5-2s-.6-1.7-1.5-2z" fill="currentColor" opacity=".5"/></svg></span></div>
    <div class="mtop"><div><small>MON, OCT 5</small><h6>Overview</h6></div></div>
    <div class="mrings">${wring(.87, WG, '87', 'POWER', 60, '%')}${wring(.68, WB, '14.2', 'LOAD', 60)}${wring(.92, WS, '92', 'FORM', 60, '%')}</div>
    <div class="mhero"><div class="mhh"><span>TOTAL SHOTS</span><em>+248 today</em></div><div class="mbig wn">12,486<i>shots</i></div>
      <div class="mbars">${bars.map((h, i) => `<span class="${i === today ? 'on' : ''}"><u style="height:${h}%"></u><s>${days[i]}</s></span>`).join('')}</div></div>
    <p class="mlh">SESSIONS</p>
    ${row(I(BALL), WB, 'Tennis', '1h 12m · 212 shots', '12.4')}
    ${row(I(FLAG), WB, 'Golf', '2h 05m · 36 shots', '8.1')}
    ${tabbar(0)}<i class="hi"></i>`;
})();


/* ---------- text animations (word-by-word blur-in, same easing and stagger style as the reference site) ---------- */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WORD_SEL = ['.h2', '.lede.sub', '.bt h3', '.bt p', '.sport h3', '.sport p', '.checks li', '.detail-card h3', '.detail-card p', '.buy h3', '.buy .tag', '.buy .eyebrow', '.incl li', '.incl h4', '.spec b', '.spec span', '.final-logo + .h2', '.band-name', 'footer p', '.opt-label', '.cta-block .h2'].join(',');
  const BLOCK_SEL = ['.faq details', '.metric-cloud span', '.opt', '.assure span', '.fine'].join(',');
  let seq = 0;
  const split = (node, st) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const parts = n.textContent.split(/(\s+)/); const frag = document.createDocumentFragment();
        parts.forEach((p) => {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = 'w'; w.textContent = p; w.setAttribute('aria-hidden', 'true'); w.style.setProperty('--i', st.i++); frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'BR' && n.tagName !== 'SVG' && n.tagName !== 'svg' && !n.matches('img,button,canvas')) split(n, st);
    });
  };
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('sv'); io.unobserve(e.target); } }), { threshold: 0.2, rootMargin: '0px 0px -6% 0px' });
  const prep = (root = document) => {
    root.querySelectorAll(WORD_SEL).forEach((el) => {
      if (el.dataset.split || el.closest('#h1,#lede')) return;
      el.dataset.split = '1'; el.setAttribute('aria-label', el.textContent.trim().replace(/\s+/g, ' '));
      if (el.classList.contains('reveal')) el.classList.remove('reveal');
      if (reduce) return; split(el, { i: 0 }); io.observe(el);
    });
    root.querySelectorAll(BLOCK_SEL).forEach((el, k) => {
      if (el.dataset.blk) return; el.dataset.blk = '1'; if (reduce) return;
      el.classList.add('blk'); el.style.setProperty('--d', (k % 6) * 70 + 'ms'); io.observe(el);
    });
  };
  window.splitText = prep; prep();
})();
