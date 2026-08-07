/* ============================================================
   RAGAMALIKA APP
   Hash-based router for a fully static, no-backend site.
   Routes:
     #/                      -> language selection
     #/telugu                -> decade playlist grid
     #/telugu/90s             -> song list for that decade
   ============================================================ */

const LANGUAGES = [
  { code: 'telugu', script: 'తెలుగు', name: 'Telugu', bg: null },
  { code: 'tamil', script: 'தமிழ்', name: 'Tamil', bg: null },
  { code: 'hindi', script: 'हिंदी', name: 'Hindi', bg: null },
  { code: 'english', script: 'English', name: 'English', bg: null },
];

const dataCache = {};

async function loadLanguageData(code) {
  if (dataCache[code]) return dataCache[code];
  try {
    const res = await fetch(`data/${code}.json`);
    if (!res.ok) throw new Error('not found');
    const json = await res.json();
    dataCache[code] = json;
    return json;
  } catch (e) {
    return null;
  }
}

function prettifyDecade(d) {
  return d ? d.toUpperCase() : 'Unsorted';
}

function groupByDecade(songs) {
  const groups = {};
  songs.forEach(song => {
    const key = song.decade && song.decade.trim() ? song.decade.trim() : '_unsorted';
    if (!groups[key]) groups[key] = [];
    groups[key].push(song);
  });
  return groups;
}

const app = document.getElementById('app');
const breadcrumb = document.getElementById('breadcrumb');

function setBreadcrumb(parts) {
  breadcrumb.innerHTML = parts
    .map((p, i) => {
      const isLast = i === parts.length - 1;
      const sep = i > 0 ? '<span class="sep">/</span>' : '';
      return sep + (isLast || !p.href
        ? `<span>${p.label}</span>`
        : `<a href="${p.href}">${p.label}</a>`);
    })
    .join('');
}

async function renderHome() {
  setBreadcrumb([{ label: 'Home' }]);
  const cards = await Promise.all(LANGUAGES.map(async lang => {
    const data = await loadLanguageData(lang.code);
    const count = data ? data.songs.length : 0;
    const thumb = data ? null : null; // could wire a language-specific thumb later
    return `
      <a class="lang-card ${count === 0 ? 'empty' : ''}" href="${count ? `#/${lang.code}` : '#/'}">
        <img src="https://res.cloudinary.com/isle7yoi/image/upload/v1786099819/cm-1_q1xxbp.jpg" alt="">
        <div class="label">
          <span class="script">${lang.script}</span>
          <span class="name">${lang.name}</span>
          <span class="count">${count ? count + ' tracks' : 'Coming soon'}</span>
        </div>
      </a>`;
  }));

  app.innerHTML = `
    <div class="hero">
      <h1>Ragamalika <em>రాగమాలిక</em></h1>
      <p>A private archive of the songs that made us pause. Pick a language to begin.</p>
    </div>
    <div class="lang-grid">${cards.join('')}</div>
  `;
}

async function renderDecadeGrid(langCode) {
  const lang = LANGUAGES.find(l => l.code === langCode);
  const data = await loadLanguageData(langCode);

  if (!lang || !data) {
    app.innerHTML = `<div class="empty-state"><span class="big">Nothing here yet</span>This language hasn't been added to the archive. Check back soon.</div>`;
    return;
  }

  setBreadcrumb([{ label: 'Home', href: '#/' }, { label: lang.name }]);

  const groups = groupByDecade(data.songs);
  const order = Object.keys(groups).sort((a, b) => {
    if (a === '_unsorted') return 1;
    if (b === '_unsorted') return -1;
    return a.localeCompare(b);
  });

  const allCard = `
    <a class="ticket" href="#/${langCode}/all">
      <div class="ticket-main">
        <span class="ticket-decade">All</span>
        <span class="ticket-sub">Full Collection</span>
        <span class="ticket-count">${data.songs.length} tracks</span>
      </div>
      <div class="ticket-stub"><span class="glyph">RAGAMALIKA</span></div>
    </a>`;

  const decadeCards = order.map(key => `
    <a class="ticket" href="#/${langCode}/${key}">
      <div class="ticket-main">
        <span class="ticket-decade">${prettifyDecade(key === '_unsorted' ? '' : key)}</span>
        <span class="ticket-sub">${lang.name} Playlist</span>
        <span class="ticket-count">${groups[key].length} tracks</span>
      </div>
      <div class="ticket-stub"><span class="glyph">RAGAMALIKA</span></div>
    </a>`).join('');

  app.innerHTML = `
    <h2 class="section-title">${lang.script} <span style="color:var(--ivory-faint); font-size:1.1rem;">— choose a playlist</span></h2>
    <div class="playlist-grid">${allCard}${decadeCards}</div>
  `;
}

let selectMode = false;
let selectedUrls = new Set();
let currentSortedSongs = [];

async function renderSongList(langCode, decadeKey) {
  const lang = LANGUAGES.find(l => l.code === langCode);
  const data = await loadLanguageData(langCode);
  if (!lang || !data) { renderHome(); return; }

  let songs;
  let title;
  if (decadeKey === 'all') {
    songs = data.songs;
    title = 'All Songs';
  } else {
    songs = data.songs.filter(s => (s.decade && s.decade.trim() ? s.decade.trim() : '_unsorted') === decadeKey);
    title = prettifyDecade(decadeKey === '_unsorted' ? '' : decadeKey);
  }

  selectMode = false;
  selectedUrls = new Set();
  currentSortedSongs = songs.slice();

  setBreadcrumb([
    { label: 'Home', href: '#/' },
    { label: lang.name, href: `#/${langCode}` },
    { label: title },
  ]);

  renderSongListBody(langCode, songs, title);
}

function sortSongs(songs, mode) {
  const list = songs.slice();
  if (mode === 'az') {
    list.sort((a, b) => a.title.localeCompare(b.title));
  } else if (mode === 'recent') {
    const recent = Player.getRecentlyPlayed();
    list.sort((a, b) => {
      const ai = recent.indexOf(a.url);
      const bi = recent.indexOf(b.url);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }
  return list;
}

function renderSongListBody(langCode, originalSongs, title) {
  const rows = currentSortedSongs.map((song, i) => `
    <div class="song-row ${selectMode ? 'select-mode' : ''}" data-url="${song.url}">
      <input type="checkbox" class="song-check" ${selectedUrls.has(song.url) ? 'checked' : ''} />
      <span class="song-index">${i + 1}</span>
      <span class="song-title">${song.title}</span>
      <button class="song-play-btn" aria-label="Play ${song.title}">▶</button>
    </div>
  `).join('');

  app.innerHTML = `
    <h2 class="section-title">${title}</h2>
    <div class="toolbar">
      <button class="toolbar-btn primary" id="btn-play-all">▶ Play All</button>
      <button class="toolbar-btn" id="btn-shuffle">🔀 Shuffle</button>
      <button class="toolbar-btn" id="btn-loop">🔁 Loop</button>
      <button class="toolbar-btn" id="btn-select">☑ Select Songs</button>
      <div class="toolbar-spacer"></div>
      <select id="sort-select">
        <option value="default">Order: As Added</option>
        <option value="az">Order: A–Z</option>
        <option value="recent">Order: Recently Played</option>
      </select>
    </div>
    <div class="song-list" id="song-list">
      ${originalSongs.length ? rows : `<div class="empty-state"><span class="big">No songs here</span>Add a decade tag to songs in data/${langCode}.json to see them here.</div>`}
    </div>
  `;

  document.getElementById('btn-play-all')?.addEventListener('click', () => {
    Player.setQueue(currentSortedSongs, 0);
    markPlaying(currentSortedSongs[0]?.url);
  });

  document.getElementById('btn-shuffle')?.addEventListener('click', (e) => {
    Player.toggleShuffle();
    e.target.classList.toggle('active');
  });

  document.getElementById('btn-loop')?.addEventListener('click', (e) => {
    Player.toggleLoop();
    e.target.classList.toggle('active');
  });

  document.getElementById('btn-select')?.addEventListener('click', (e) => {
    selectMode = !selectMode;
    e.target.classList.toggle('active', selectMode);
    e.target.textContent = selectMode ? `▶ Play Selected (${selectedUrls.size})` : '☑ Select Songs';
    e.target.id = selectMode ? 'btn-play-selected' : 'btn-select';
    document.querySelectorAll('.song-row').forEach(row => row.classList.toggle('select-mode', selectMode));
    if (selectMode) {
      e.target.onclick = () => {
        const chosen = currentSortedSongs.filter(s => selectedUrls.has(s.url));
        if (chosen.length) Player.setQueue(chosen, 0);
      };
    }
  });

  document.getElementById('sort-select')?.addEventListener('change', (e) => {
    currentSortedSongs = e.target.value === 'default' ? originalSongs.slice() : sortSongs(originalSongs, e.target.value);
    renderSongListBody(langCode, originalSongs, title);
  });

  document.querySelectorAll('.song-row').forEach(row => {
    const url = row.dataset.url;
    const song = currentSortedSongs.find(s => s.url === url);

    row.querySelector('.song-play-btn')?.addEventListener('click', () => {
      const idx = currentSortedSongs.findIndex(s => s.url === url);
      Player.setQueue(currentSortedSongs, idx);
      markPlaying(url);
    });

    row.querySelector('.song-check')?.addEventListener('change', (e) => {
      if (e.target.checked) selectedUrls.add(url);
      else selectedUrls.delete(url);
      const btn = document.getElementById('btn-play-selected');
      if (btn) btn.textContent = `▶ Play Selected (${selectedUrls.size})`;
    });
  });
}

function markPlaying(url) {
  document.querySelectorAll('.song-row').forEach(row => {
    row.classList.toggle('playing', row.dataset.url === url);
  });
}

function route() {
  const hash = location.hash.replace(/^#\/?/, '');
  const parts = hash.split('/').filter(Boolean);

  if (parts.length === 0) renderHome();
  else if (parts.length === 1) renderDecadeGrid(parts[0]);
  else renderSongList(parts[0], parts[1]);
}

window.addEventListener('hashchange', route);
window.addEventListener('DOMContentLoaded', () => {
  Player.init();
  route();
});
