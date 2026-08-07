/* ============================================================
   RAGAMALIKA PLAYER
   Handles: queue building, shuffle (no repeat until the whole
   queue has played once), loop, next/prev, background rotation.
   ============================================================ */

const Player = (() => {
  const audio = new Audio();
  let queue = [];          // ordered list of song objects currently active
  let shuffleBag = [];     // remaining indices to play this cycle, when shuffle is on
  let currentIndex = -1;   // index into `queue`
  let shuffleOn = false;
  let loopOn = false;
  let allBackgrounds = { couples_music: [], couples: [], men_solo: [], music_covers: [] };
  let currentBg = null;

  const els = {};

  function bindDOM() {
    els.playerBg = document.querySelector('.player-bg img');
    els.disc = document.querySelector('.disc');
    els.title = document.querySelector('.now-playing .title');
    els.sub = document.querySelector('.now-playing .sub');
    els.playBtn = document.querySelector('.ctrl-btn.play');
    els.shuffleBtn = document.querySelector('.ctrl-btn.shuffle');
    els.loopBtn = document.querySelector('.ctrl-btn.loop');
    els.progressFill = document.querySelector('.progress-fill');
    els.progressBar = document.querySelector('.progress-bar');
    els.timeCurrent = document.querySelector('.time-current');
    els.timeTotal = document.querySelector('.time-total');
    els.bgChangeBtn = document.querySelector('.bg-change-btn');

    document.querySelector('.ctrl-btn.prev')?.addEventListener('click', prev);
    document.querySelector('.ctrl-btn.next')?.addEventListener('click', next);
    els.playBtn?.addEventListener('click', togglePlay);
    els.shuffleBtn?.addEventListener('click', toggleShuffle);
    els.loopBtn?.addEventListener('click', toggleLoop);
    els.bgChangeBtn?.addEventListener('click', () => rotateBackground(true));
    els.progressBar?.addEventListener('click', seek);

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', () => { els.disc?.classList.add('spinning'); setPlayIcon(true); });
    audio.addEventListener('pause', () => { els.disc?.classList.remove('spinning'); setPlayIcon(false); });
  }

  async function loadBackgrounds() {
    try {
      const res = await fetch('data/backgrounds.json');
      allBackgrounds = await res.json();
    } catch (e) {
      console.warn('Could not load backgrounds.json', e);
    }
  }

  function combinedBgPool() {
    return Object.values(allBackgrounds).flat();
  }

  function rotateBackground(force) {
    const pool = combinedBgPool();
    if (!pool.length) return;
    let next;
    do {
      next = pool[Math.floor(Math.random() * pool.length)];
    } while (pool.length > 1 && next === currentBg && force);
    currentBg = next;
    if (els.playerBg) {
      els.playerBg.style.opacity = 0;
      setTimeout(() => {
        els.playerBg.src = next;
        els.playerBg.style.opacity = 1;
      }, 200);
    }
  }

  function setPlayIcon(playing) {
    if (els.playBtn) els.playBtn.textContent = playing ? '❚❚' : '▶';
  }

  function buildShuffleBag() {
    shuffleBag = queue.map((_, i) => i).filter(i => i !== currentIndex);
    // Fisher-Yates
    for (let i = shuffleBag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffleBag[i], shuffleBag[j]] = [shuffleBag[j], shuffleBag[i]];
    }
  }

  function setQueue(songs, startIndex = 0) {
    queue = songs.slice();
    currentIndex = startIndex;
    if (shuffleOn) buildShuffleBag();
    playCurrent();
  }

  function playCurrent() {
    const song = queue[currentIndex];
    if (!song) return;
    audio.src = song.url;
    audio.play().catch(() => {});
    if (els.title) els.title.textContent = song.title;
    if (els.sub) els.sub.textContent = [song.decade, song.movie].filter(Boolean).join(' · ') || 'Telugu';
    rotateBackground(false);
    recordRecentlyPlayed(song);
  }

  function togglePlay() {
    if (!queue.length) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  }

  function next() {
    if (!queue.length) return;
    if (shuffleOn) {
      if (!shuffleBag.length) buildShuffleBag();
      currentIndex = shuffleBag.shift();
    } else {
      currentIndex = (currentIndex + 1) % queue.length;
      if (currentIndex === 0 && !loopOn) { audio.pause(); return; }
    }
    playCurrent();
  }

  function prev() {
    if (!queue.length) return;
    if (audio.currentTime > 3) { audio.currentTime = 0; return; }
    currentIndex = (currentIndex - 1 + queue.length) % queue.length;
    playCurrent();
  }

  function handleEnded() {
    if (shuffleOn) {
      if (!shuffleBag.length && !loopOn) return; // finished full cycle, stop
      if (!shuffleBag.length) buildShuffleBag();
      next();
    } else if (currentIndex < queue.length - 1) {
      next();
    } else if (loopOn) {
      currentIndex = -1;
      next();
    }
  }

  function toggleShuffle() {
    shuffleOn = !shuffleOn;
    els.shuffleBtn?.classList.toggle('active', shuffleOn);
    if (shuffleOn) buildShuffleBag();
  }

  function toggleLoop() {
    loopOn = !loopOn;
    els.loopBtn?.classList.toggle('active', loopOn);
  }

  function seek(e) {
    if (!audio.duration) return;
    const rect = els.progressBar.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * audio.duration;
  }

  function fmtTime(s) {
    if (!isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  function updateProgress() {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    if (els.progressFill) els.progressFill.style.width = pct + '%';
    if (els.timeCurrent) els.timeCurrent.textContent = fmtTime(audio.currentTime);
    if (els.timeTotal) els.timeTotal.textContent = fmtTime(audio.duration);
  }

  function recordRecentlyPlayed(song) {
    try {
      const key = 'ragamalika_recent';
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      const filtered = list.filter(t => t !== song.url);
      filtered.unshift(song.url);
      localStorage.setItem(key, JSON.stringify(filtered.slice(0, 100)));
    } catch (e) { /* localStorage unavailable, skip silently */ }
  }

  function getRecentlyPlayed() {
    try {
      return JSON.parse(localStorage.getItem('ragamalika_recent') || '[]');
    } catch (e) { return []; }
  }

  function init() {
    bindDOM();
    loadBackgrounds().then(() => rotateBackground(false));
  }

  return { init, setQueue, togglePlay, next, prev, toggleShuffle, toggleLoop, getRecentlyPlayed };
})();
