'use strict';

(function () {
  /* Lesson settings. SHOW_MOOD = true brings the mood row back.
     DYNAMICS_DB is the master volume for each dynamics card, in dB. */
  var SHOW_MOOD = false;
  var DYNAMICS_DB = { loud: 0, mid: -6, soft: -14 };
  var PREVIEW_SECONDS = 30;

  var MSG = {
    ready: '選速度、力度、樂器和風格，再按試聽。Pick speed, dynamics, instrument and style, then press Preview.',
    dynamics: '已換力度。New dynamics.',
    pattern: '已換上新節奏。按試聽聽聽。New pattern loaded. Press Preview to listen.',
    preview: '正在試聽。Preview playing.',
    previewEnd: '試聽完了。Preview finished.',
    watch: '音樂跟廣告一起播放。Music is playing with the ad.',
    musicEnd: '你的音樂播完了。Your music has ended.',
    video: '正在睇廣告（未有你的音樂）。Watching the ad without your music.',
    exporting: '正在製作 WAV… Making the WAV…',
    exportReady: 'WAV 準備好了，按「儲存 WAV」。WAV is ready. Tap Save WAV.',
    exportFail: '匯出失敗，請再試。Export failed. Try again.',
    loadFail: '這個檔案讀不到。Could not read this file.',
    videoFail: '這段影片播不到。請換一個檔案。This video cannot play. Try another file.',
    playFail: '請再按一次播放。Tap play again.',
    videoLoaded: '已載入你的影片。原聲會關掉。Your video is loaded. Its sound is muted.'
  };

  var ICONS = {
    flute: '<rect x="6" y="27" width="52" height="10" rx="5" fill="#fff" stroke="#1c1b19" stroke-width="3"/><circle cx="22" cy="32" r="2.2" fill="#1c1b19"/><circle cx="31" cy="32" r="2.2" fill="#1c1b19"/><circle cx="40" cy="32" r="2.2" fill="#1c1b19"/><circle cx="49" cy="32" r="2.2" fill="#1c1b19"/>',
    cello: '<path d="M32 8v10" stroke="#1c1b19" stroke-width="3" stroke-linecap="round"/><path d="M26 24c0-5 12-5 12 0 0 3-3 5-3 7 0 2 6 4 6 11 0 7-6 11-9 11s-9-4-9-11c0-7 6-9 6-11 0-2-3-4-3-7z" fill="#fff" stroke="#1c1b19" stroke-width="3"/><path d="M32 30v18" stroke="#1c1b19" stroke-width="3"/>',
    contrabass: '<path d="M32 4v10" stroke="#1c1b19" stroke-width="3" stroke-linecap="round"/><path d="M24 22c0-6 16-6 16 0 0 4-4 6-4 9 0 3 8 6 8 15 0 9-8 14-12 14s-12-5-12-14c0-9 8-12 8-15 0-3-4-5-4-9z" fill="#fff" stroke="#1c1b19" stroke-width="3"/><path d="M32 30v24" stroke="#1c1b19" stroke-width="3"/>',
    happy: '<circle cx="32" cy="32" r="20" fill="#fff"/><circle cx="24" cy="28" r="3" fill="#1c1b19"/><circle cx="40" cy="28" r="3" fill="#1c1b19"/><path d="M22 38c3.5 6 16.5 6 20 0" fill="none" stroke="#1c1b19" stroke-width="3" stroke-linecap="round"/>',
    exciting: '<polygon points="36,6 16,34 30,34 26,58 50,26 34,26" fill="#fff" stroke="#1c1b19" stroke-width="3" stroke-linejoin="round"/>',
    calm: '<path d="M8 34c6 0 6-8 12-8s6 8 12 8 6-8 12-8 6 8 12 8" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M8 46c6 0 6-8 12-8s6 8 12 8 6-8 12-8 6 8 12 8" fill="none" stroke="#1c1b19" stroke-width="4" stroke-linecap="round"/>',
    sad: '<path d="M16 34c0-8 6-14 16-14s16 6 16 14v4H16z" fill="#fff"/><circle cx="22" cy="30" r="8" fill="#fff"/><circle cx="42" cy="30" r="10" fill="#fff"/><path d="M24 46v8M32 48v8M40 46v8" stroke="#1c1b19" stroke-width="3" stroke-linecap="round"/>',
    mysterious: '<path d="M40 12a16 16 0 1 0 0 32 12 12 0 1 1 0-32z" fill="#fff"/><polygon points="18,18 20,24 26,24 21,28 23,34 18,30 13,34 15,28 10,24 16,24" fill="#fff"/>',
    slow: '<ellipse cx="30" cy="36" rx="16" ry="12" fill="#fff" stroke="#1c1b19" stroke-width="3"/><circle cx="48" cy="32" r="6" fill="#fff" stroke="#1c1b19" stroke-width="3"/><circle cx="50" cy="31" r="1.4" fill="#1c1b19"/>',
    medium: '<ellipse cx="24" cy="26" rx="8" ry="12" fill="#fff" transform="rotate(-20 24 26)"/><ellipse cx="40" cy="40" rx="8" ry="12" fill="#fff" transform="rotate(-20 40 40)"/>',
    fast: '<circle cx="46" cy="32" r="10" fill="#fff"/><path d="M8 22h20M6 32h24M10 42h16" stroke="#fff" stroke-width="5" stroke-linecap="round"/>',
    piano: '<rect x="8" y="16" width="48" height="34" rx="4" fill="#fff" stroke="#1c1b19" stroke-width="3"/><rect x="18" y="16" width="6" height="18" fill="#1c1b19"/><rect x="30" y="16" width="6" height="18" fill="#1c1b19"/><rect x="42" y="16" width="6" height="18" fill="#1c1b19"/>',
    bells: '<path d="M32 8v6" stroke="#1c1b19" stroke-width="3" stroke-linecap="round"/><path d="M18 42c0-14 28-14 28 0" fill="#fff" stroke="#1c1b19" stroke-width="3"/><rect x="16" y="40" width="32" height="6" rx="2" fill="#fff" stroke="#1c1b19" stroke-width="3"/><circle cx="32" cy="52" r="3" fill="#1c1b19"/>',
    bouncy: '<circle cx="32" cy="14" r="6" fill="#fff" stroke="#1c1b19" stroke-width="3"/><path d="M32 20v14M22 26l10 4 10-4M26 46l6-12 6 12" fill="none" stroke="#1c1b19" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 56c6-6 10-6 14 0M36 56c6-6 10-6 14 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>',
    steady: '<ellipse cx="22" cy="44" rx="7" ry="10" fill="#fff"/><circle cx="18" cy="31" r="2.5" fill="#fff"/><circle cx="24" cy="30" r="2.5" fill="#fff"/><ellipse cx="42" cy="26" rx="7" ry="10" fill="#fff"/><circle cx="38" cy="13" r="2.5" fill="#fff"/><circle cx="44" cy="12" r="2.5" fill="#fff"/>',
    light: '<path d="M16 42c-6 0-8-8-2-10 0-8 10-10 14-4 4-6 14-4 14 4 6 0 8 10 0 10z" fill="#fff"/><path d="M14 52h10M30 52h20" stroke="#fff" stroke-width="3" stroke-linecap="round"/>',
    loud: '<circle cx="32" cy="32" r="22" fill="#fff"/>',
    mid: '<circle cx="32" cy="32" r="14" fill="#fff"/>',
    soft: '<circle cx="32" cy="32" r="7" fill="#fff"/>',
    groovy: '<circle cx="34" cy="12" r="6" fill="#fff" stroke="#1c1b19" stroke-width="3"/><path d="M33 18l-3 16M30 34l-8 16M30 34l10 8 2 10M32 24l-14-6M32 24l12-10" fill="none" stroke="#1c1b19" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
  };

  var CHORD_COLORS = ['#FFD6A5', '#FDFFB6', '#CAFFBF', '#9BF6FF'];

  var state = {
    mood: 'happy',
    speed: 'medium',
    instrument: 'piano',
    style: 'bouncy',
    dynamics: 'mid',
    length: PREVIEW_SECONDS,
    bpm: 104,
    scale: [],
    scaleName: { zh: '', en: '' },
    chords: [],
    chordNames: [],
    chordEvery: 4,
    drums: { kick: [], snare: [], hat: [], clap: [], tom: [] },
    melody: [[], [], [], [], []],
    edited: false
  };

  var mode = 'idle';
  var musicEndedNotified = false;
  var videoKind = 'ad';
  var localName = '';
  var objectUrl = null;
  var wavUrl = null;
  var lastStep = -1;
  var lastDrift = 0;
  var seeking = false;
  var wasPlayingBeforeSeek = false;
  var seekRepair = false;

  var gate = document.getElementById('gate');
  var gateMsg = document.getElementById('gateMsg');
  var startBtn = document.getElementById('startBtn');
  var app = document.getElementById('app');
  var statusEl = document.getElementById('status');
  var video = document.getElementById('adVideo');
  var videoToggle = document.getElementById('videoToggle');
  var seek = document.getElementById('seek');
  var timeNow = document.getElementById('timeNow');
  var timeTotal = document.getElementById('timeTotal');
  var videoFile = document.getElementById('videoFile');
  var useSample = document.getElementById('useSample');
  var useDemo = document.getElementById('useDemo');
  var tvLabel = document.getElementById('tvLabel');
  var lengthInput = document.getElementById('length');
  var lengthValue = document.getElementById('lengthValue');
  var meter = document.getElementById('meter');
  var watchAd = document.getElementById('watchAd');
  var watchMusic = document.getElementById('watchMusic');
  var previewBtn = document.getElementById('previewBtn');
  var scaleLine = document.getElementById('scaleLine');
  var chordLine = document.getElementById('chordLine');
  var summary = document.getElementById('summary');
  var grid = document.getElementById('grid');
  var exportWav = document.getElementById('exportWav');
  var saveWav = document.getElementById('saveWav');
  var saveJson = document.getElementById('saveJson');
  var loadJson = document.getElementById('loadJson');

  function esc(value) {
    return String(value).replace(/[&<>"]/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch];
    });
  }

  function svg(id) {
    return '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">' + (ICONS[id] || '') + '</svg>';
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function formatTime(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    var whole = Math.floor(sec);
    var mins = Math.floor(whole / 60);
    var rest = whole % 60;
    return mins + ':' + (rest < 10 ? '0' : '') + rest;
  }

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function setMeter(amount) {
    var width = clamp(amount, 0, 1) * 100;
    meter.style.width = width + '%';
  }

  function findMeta(list, id) {
    for (var i = 0; i < list.length; i += 1) {
      if (list[i].id === id) return list[i];
    }
    return { zh: id, en: id };
  }

  function applyBuilt(built) {
    state.bpm = built.bpm;
    state.scale = built.scale;
    state.scaleName = built.scaleName;
    state.chords = built.chords;
    state.chordNames = built.chordNames;
    state.chordEvery = built.chordEvery;
    state.drums = built.drums;
    state.melody = built.melody;
    state.edited = false;
  }

  function gridsEqual(drums, melody, other) {
    var ids = ['kick', 'snare', 'hat', 'clap', 'tom'];
    var s;
    var r;
    for (var i = 0; i < ids.length; i += 1) {
      for (s = 0; s < 16; s += 1) {
        if (!!drums[ids[i]][s] !== !!other.drums[ids[i]][s]) return false;
      }
    }
    for (r = 0; r < 5; r += 1) {
      for (s = 0; s < 16; s += 1) {
        if (!!melody[r][s] !== !!other.melody[r][s]) return false;
      }
    }
    return true;
  }

  function renderCards() {
    function fill(id, group, items, cols) {
      var html = items.map(function (item) {
        return '<button type="button" class="card" data-group="' + group + '" data-value="' + item.id + '" aria-pressed="false">' +
          '<span class="pic" style="background:' + item.color + '">' + svg(item.id) + '</span>' +
          (item.tag ? '<span class="tag">' + esc(item.tag) + '音</span>' : '') +
          '<span class="zh">' + esc(item.zh) + '</span>' +
          '<span class="en">' + esc(item.en) + '</span></button>';
      }).join('');
      var el = document.getElementById(id);
      el.className = 'cards cols-' + cols;
      el.innerHTML = html;
    }
    fill('moodCards', 'mood', AdPresets.moods, 5);
    fill('speedCards', 'speed', AdPresets.speeds, 3);
    fill('dynamicsCards', 'dynamics', AdPresets.dynamics, 3);
    fill('instrumentCards', 'instrument', AdPresets.instruments, 5);
    fill('styleCards', 'style', AdPresets.styles, 4);
    refreshSelection();
  }

  function refreshSelection() {
    var buttons = document.querySelectorAll('[data-group]');
    for (var i = 0; i < buttons.length; i += 1) {
      var btn = buttons[i];
      var on = state[btn.getAttribute('data-group')] === btn.getAttribute('data-value');
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }

  function renderSummary() {
    var mood = findMeta(AdPresets.moods, state.mood);
    var speed = findMeta(AdPresets.speeds, state.speed);
    var instrument = findMeta(AdPresets.instruments, state.instrument);
    var style = findMeta(AdPresets.styles, state.style);
    var editedZh = state.edited ? '（已修改）' : '';
    var editedEn = state.edited ? ' (edited)' : '';
    summary.innerHTML = esc(mood.zh + ' · ' + speed.zh + ' · ' + instrument.zh + ' · ' + style.zh + editedZh) +
      '<span class="en-line">' + esc(mood.en + ' · ' + speed.en + ' · ' + instrument.en + ' · ' + style.en + editedEn) +
      ' · ' + state.bpm + ' BPM</span>';
    scaleLine.innerHTML = esc(state.scaleName.zh) + '<span class="en">' + esc(state.scaleName.en) + '</span>';
    chordLine.innerHTML = '和弦 ' + esc(state.chordNames.join(' · ')) +
      '<span class="en">Chords ' + esc(state.chordNames.join(' · ')) + '</span>';
    lengthValue.textContent = String(state.length);
    lengthInput.value = String(state.length);
  }

  function renderGrid() {
    var beats = [1, 2, 3, 4].map(function (n) {
      return '<div class="beat">' + n + '</div>';
    }).join('');
    var chords = state.chordNames.map(function (name, i) {
      return '<div class="chord" style="--chord:' + CHORD_COLORS[i % 4] + '">' + esc(name) + '</div>';
    }).join('');
    var html = '<div class="seq">' +
      '<div class="seq-row" aria-hidden="true"><div class="row-label" style="--c:#e7e0d4"></div>' + beats + '</div>' +
      '<div class="seq-row" aria-hidden="true"><div class="row-label" style="--c:#e7e0d4"><span class="zh">和弦</span><span class="en">Chords</span></div>' + chords + '</div>' +
      '<p class="section-label">旋律 Melody</p>';

    state.scale.forEach(function (note, row) {
      var hint = row === 0 ? '高 High' : (row === 4 ? '低 Low' : note);
      html += rowHtml('melody', String(row), note, hint, AdPresets.melodyColors[row], state.melody[row], '旋律 ' + note);
    });
    html += '<p class="section-label">鼓 Drums</p>';
    AdPresets.drumRows.forEach(function (drum) {
      html += rowHtml('drum', drum.id, drum.zh, drum.en, drum.color, state.drums[drum.id], drum.zh + ' ' + drum.en);
    });
    html += '</div>';
    grid.innerHTML = html;
    lastStep = -1;
  }

  function rowHtml(kind, index, zh, en, color, cells, label) {
    var buttons = '';
    for (var step = 0; step < 16; step += 1) {
      var on = !!cells[step];
      var shade = step % 8 < 4 ? ' is-shade' : '';
      buttons += '<button type="button" class="cell' + (on ? ' is-on' : '') + shade + '" data-kind="' + kind +
        '" data-index="' + index + '" data-step="' + step + '" aria-pressed="' + (on ? 'true' : 'false') +
        '" aria-label="' + esc(label + ' 第' + (step + 1) + '格 step ' + (step + 1)) +
        '" style="--c:' + color + '"></button>';
    }
    return '<div class="seq-row"><div class="row-label" style="--c:' + color + '"><span class="zh">' + esc(zh) +
      '</span><span class="en">' + esc(en) + '</span></div>' + buttons + '</div>';
  }

  function setPlayhead(step) {
    var cells = grid.querySelectorAll('.cell');
    for (var i = 0; i < cells.length; i += 1) cells[i].classList.remove('is-play');
    if (step === null || step === undefined || step === '') {
      grid.dataset.playhead = '';
      return;
    }
    grid.dataset.playhead = String(step);
    var active = grid.querySelectorAll('.cell[data-step="' + step + '"]');
    for (var j = 0; j < active.length; j += 1) active[j].classList.add('is-play');
  }

  function showStep(step) {
    if (step === lastStep) return;
    lastStep = step;
    setPlayhead(step);
  }

  function clearPlayhead() {
    lastStep = -1;
    setPlayhead(null);
  }

  function paintCell(cell, value) {
    var step = Number(cell.getAttribute('data-step'));
    var kind = cell.getAttribute('data-kind');
    var index = cell.getAttribute('data-index');
    if (kind === 'melody') {
      var row = Number(index);
      if (state.melody[row][step] === value) return;
      state.melody[row][step] = value;
    } else if (state.drums[index]) {
      if (state.drums[index][step] === value) return;
      state.drums[index][step] = value;
    } else {
      return;
    }
    cell.setAttribute('aria-pressed', value ? 'true' : 'false');
    cell.classList.toggle('is-on', value);
    if (!state.edited) {
      state.edited = true;
      renderSummary();
    }
  }

  function afterPatternChange() {
    if (!AdEngine.ready) return;
    AdEngine.setInstrument(state.instrument);
    if (mode === 'preview') {
      AdEngine.playFrom(0);
    } else if (mode === 'watch') {
      var t = video.currentTime || 0;
      if (video.paused || t >= state.length) AdEngine.parkAt(Math.min(t, Math.max(0, state.length)));
      else AdEngine.playFrom(t);
    } else {
      AdEngine.setTempo(state.bpm);
    }
  }

  function dynamicsDb() {
    var db = DYNAMICS_DB[state.dynamics];
    return typeof db === 'number' ? db : 0;
  }

  /* Dynamics only fade the master volume, so playback keeps going. */
  function chooseDynamics(value) {
    state.dynamics = value;
    refreshSelection();
    AdEngine.setDynamics(dynamicsDb());
    setStatus(MSG.dynamics);
  }

  function choose(group, value) {
    if (group === 'dynamics') {
      chooseDynamics(value);
      return;
    }
    state[group] = value;
    applyBuilt(AdPresets.build(state));
    refreshSelection();
    renderGrid();
    renderSummary();
    afterPatternChange();
    setStatus(MSG.pattern);
  }

  function updateButtons() {
    var playing = !video.paused && !video.ended;
    videoToggle.textContent = playing ? '暫停 Pause' : '播放 Play';
    videoToggle.setAttribute('aria-pressed', playing ? 'true' : 'false');
    watchAd.setAttribute('aria-pressed', mode === 'video' && playing ? 'true' : 'false');
    watchMusic.setAttribute('aria-pressed', mode === 'watch' ? 'true' : 'false');
    var previewing = mode === 'preview';
    previewBtn.textContent = previewing ? '停止 Stop' : '試聽 Preview';
    previewBtn.setAttribute('aria-pressed', previewing ? 'true' : 'false');
  }

  function updateTimes() {
    timeNow.textContent = formatTime(video.currentTime || 0);
    timeTotal.textContent = formatTime(isFinite(video.duration) ? video.duration : 0);
    if (!seeking && isFinite(video.duration) && video.duration > 0) {
      seek.value = String(Math.round((video.currentTime / video.duration) * 1000));
    }
  }

  function updateTvLabel() {
    var seconds = isFinite(video.duration) ? Math.round(video.duration) : null;
    var tail = seconds ? ' · ' + seconds + ' 秒 sec' : '';
    if (videoKind === 'local') {
      tvLabel.textContent = localName + (seconds ? ' · ' + seconds + ' 秒' : '');
    } else if (videoKind === 'demo') {
      tvLabel.textContent = '陽光橙示範 Orange demo' + tail;
    } else {
      tvLabel.textContent = '廣告 Ad' + tail;
    }
  }

  function fitVideo() {
    video.classList.toggle('is-portrait', video.videoWidth > 0 && video.videoHeight > video.videoWidth);
  }

  function updateSourceButtons() {
    useSample.hidden = videoKind === 'ad';
    useDemo.hidden = videoKind === 'demo';
  }

  function tick(now) {
    if (mode === 'preview' && AdEngine.transportState() === 'started') {
      var sec = AdEngine.transportSeconds();
      if (sec >= state.length) {
        mode = 'idle';
        AdEngine.parkAt(0);
        clearPlayhead();
        setMeter(1);
        setStatus(MSG.previewEnd);
        updateButtons();
      } else {
        showStep(AdEngine.stepFromSeconds(sec, state.bpm));
        setMeter(sec / state.length);
      }
    } else if (mode === 'watch') {
      var t = video.currentTime || 0;
      showStep(AdEngine.stepFromSeconds(Math.min(t, state.length), state.bpm));
      setMeter(state.length ? Math.min(1, t / state.length) : 0);
      if (!video.paused && !seeking) {
        if (t >= state.length - 0.03) {
          if (AdEngine.transportState() === 'started') AdEngine.pauseMusic();
          if (!musicEndedNotified) {
            musicEndedNotified = true;
            setStatus(MSG.musicEnd);
          }
        } else if (now - lastDrift > 280) {
          lastDrift = now;
          var actual = AdEngine.transportSeconds();
          if (AdEngine.transportState() !== 'started' || Math.abs(actual - t) > 0.18) {
            AdEngine.playFrom(t);
          }
        }
      }
    }
    requestAnimationFrame(tick);
  }

  function bool16(arr, label) {
    if (!Array.isArray(arr) || arr.length !== 16) throw new Error(label);
    return arr.map(function (value) { return value === true || value === 1; });
  }

  function oneOf(list, value) {
    for (var i = 0; i < list.length; i += 1) {
      if (list[i].id === value) return value;
    }
    throw new Error('choice');
  }

  function noteOk(note) {
    return typeof note === 'string' && /^[A-G](?:#|b)?[0-8]$/.test(note);
  }

  function serialize() {
    return {
      app: 'ad-music-workshop',
      version: 1,
      mood: state.mood,
      speed: state.speed,
      instrument: state.instrument,
      style: state.style,
      length: state.length,
      bpm: state.bpm,
      scaleName: state.scaleName,
      scale: state.scale,
      chordNames: state.chordNames,
      chords: state.chords,
      chordEvery: state.chordEvery,
      drums: state.drums,
      melody: state.melody
    };
  }

  function applyLoaded(data) {
    if (!data || data.app !== 'ad-music-workshop' || Number(data.version) !== 1) {
      throw new Error('file');
    }
    state.mood = oneOf(AdPresets.moods, data.mood);
    state.speed = oneOf(AdPresets.speeds, data.speed);
    state.instrument = oneOf(AdPresets.instruments, data.instrument);
    state.style = oneOf(AdPresets.styles, data.style);
    state.length = clamp(Math.round(Number(data.length)), 10, 30);
    if (!Array.isArray(data.scale) || data.scale.length !== 5 || !data.scale.every(noteOk)) throw new Error('scale');
    if (!Array.isArray(data.chords) || data.chords.length !== 4) throw new Error('chords');
    if (!Array.isArray(data.chordNames) || data.chordNames.length !== 4) throw new Error('names');
    state.scale = data.scale.slice();
    state.chords = data.chords.map(function (chord) {
      if (!Array.isArray(chord) || chord.length < 2 || chord.length > 4 || !chord.every(noteOk)) throw new Error('chord');
      return chord.slice();
    });
    state.chordNames = data.chordNames.map(function (name) { return String(name); });
    state.chordEvery = data.chordEvery === 8 ? 8 : 4;
    state.drums = {
      kick: bool16(data.drums && data.drums.kick, 'kick'),
      snare: bool16(data.drums && data.drums.snare, 'snare'),
      hat: bool16(data.drums && data.drums.hat, 'hat'),
      clap: bool16(data.drums && data.drums.clap, 'clap'),
      tom: bool16(data.drums && data.drums.tom, 'tom')
    };
    if (!Array.isArray(data.melody) || data.melody.length !== 5) throw new Error('melody');
    state.melody = data.melody.map(function (row, index) { return bool16(row, 'melody ' + index); });
    var fresh = AdPresets.build(state);
    state.bpm = isFinite(Number(data.bpm)) ? clamp(Math.round(Number(data.bpm)), 64, 160) : fresh.bpm;
    state.scaleName = data.scaleName && data.scaleName.zh ? data.scaleName : fresh.scaleName;
    state.edited = !gridsEqual(state.drums, state.melody, fresh);
    refreshSelection();
    renderGrid();
    renderSummary();
    afterPatternChange();
  }

  video.muted = true;
  document.getElementById('moodRow').hidden = !SHOW_MOOD;
  if (!SHOW_MOOD) state.mood = 'happy';
  renderCards();
  applyBuilt(AdPresets.build(state));
  renderGrid();
  renderSummary();
  setStatus(MSG.ready);

  document.getElementById('cardBoard').addEventListener('click', function (event) {
    var btn = event.target.closest('[data-group]');
    if (!btn) return;
    choose(btn.getAttribute('data-group'), btn.getAttribute('data-value'));
  });

  grid.addEventListener('click', function (event) {
    var cell = event.target.closest('.cell');
    if (!cell || !grid.contains(cell)) return;
    paintCell(cell, cell.getAttribute('aria-pressed') !== 'true');
  });

  lengthInput.addEventListener('input', function () {
    state.length = clamp(Math.round(Number(lengthInput.value)), 10, 30);
    lengthValue.textContent = String(state.length);
  });

  previewBtn.addEventListener('click', function () {
    if (!AdEngine.ready) return;
    if (mode === 'preview') {
      mode = 'idle';
      AdEngine.parkAt(0);
      clearPlayhead();
      setMeter(0);
      setStatus(MSG.previewEnd);
      updateButtons();
      return;
    }
    if (!video.paused) video.pause();
    mode = 'preview';
    musicEndedNotified = false;
    unlockAudio().then(function () {
      if (mode === 'preview') AdEngine.playFrom(0);
    });
    setStatus(MSG.preview);
    updateButtons();
  });

  function beginAd() {
    mode = 'video';
    musicEndedNotified = false;
    video.muted = true;
    if (AdEngine.ready) AdEngine.parkAt(0);
    clearPlayhead();
    setMeter(0);
    if (video.readyState >= 1) video.currentTime = 0;
    var pending = video.play();
    if (pending && pending.catch) pending.catch(function () { setStatus(MSG.playFail); });
    setStatus(MSG.video);
    updateButtons();
  }

  function beginTogether() {
    if (!AdEngine.ready) return;
    mode = 'watch';
    musicEndedNotified = false;
    video.muted = true;
    if (video.readyState >= 1) video.currentTime = 0;
    AdEngine.playFrom(0);
    var pending = video.play();
    if (pending && pending.catch) pending.catch(function () { setStatus(MSG.playFail); });
    setStatus(MSG.watch);
    updateButtons();
  }

  watchAd.addEventListener('click', beginAd);
  watchMusic.addEventListener('click', beginTogether);

  videoToggle.addEventListener('click', function () {
    video.muted = true;
    if (video.paused || video.ended) {
      if (mode === 'idle') mode = 'video';
      if (video.ended && video.readyState >= 1) video.currentTime = 0;
      var pending = video.play();
      if (pending && pending.catch) pending.catch(function () { setStatus(MSG.playFail); });
    } else {
      video.pause();
    }
  });

  video.addEventListener('play', function () {
    video.muted = true;
    if (mode === 'preview') {
      mode = 'video';
      AdEngine.parkAt(0);
      clearPlayhead();
      setStatus(MSG.video);
    } else if (mode === 'watch') {
      var t = video.currentTime || 0;
      if (t < state.length - 0.03) {
        musicEndedNotified = false;
        AdEngine.playFrom(t);
      } else {
        AdEngine.pauseMusic();
        musicEndedNotified = true;
      }
    }
    updateButtons();
  });

  video.addEventListener('pause', function () {
    if (mode === 'watch') AdEngine.pauseMusic();
    updateButtons();
  });

  video.addEventListener('ended', function () {
    if (AdEngine.ready) AdEngine.pauseMusic();
    updateButtons();
    if (mode === 'watch' || mode === 'video') setStatus('廣告播完。The ad finished.');
  });

  video.addEventListener('seeked', function () {
    updateTimes();
    if (mode !== 'watch' || !AdEngine.ready) return;
    var t = video.currentTime || 0;
    if (t >= state.length - 0.03) {
      AdEngine.pauseMusic();
      musicEndedNotified = true;
      setStatus(MSG.musicEnd);
      return;
    }
    musicEndedNotified = false;
    if (video.paused) AdEngine.parkAt(t);
    else AdEngine.playFrom(t);
  });

  video.addEventListener('timeupdate', updateTimes);
  function repairSeekable() {
    var end = video.seekable.length ? video.seekable.end(0) : 0;
    if (!seekRepair && video.readyState >= 1 && isFinite(video.duration) && video.duration > 1 && end < 0.5) {
      seekRepair = true;
      video.load();
      return true;
    }
    return false;
  }

  function onVideoReady() {
    if (repairSeekable()) return;
    seek.disabled = false;
    fitVideo();
    updateTimes();
    updateTvLabel();
  }
  video.addEventListener('loadedmetadata', onVideoReady);
  // A local file can finish loading before this script runs.
  if (video.readyState >= 1) onVideoReady();
  video.addEventListener('error', function () { setStatus(MSG.videoFail); });

  seek.addEventListener('pointerdown', function () {
    seeking = true;
    wasPlayingBeforeSeek = !video.paused && !video.ended;
    video.pause();
  });
  seek.addEventListener('input', function () {
    if (!isFinite(video.duration) || video.duration <= 0) return;
    video.currentTime = (Number(seek.value) / 1000) * video.duration;
  });
  function endSeek() {
    if (!seeking) return;
    seeking = false;
    if (wasPlayingBeforeSeek) {
      var pending = video.play();
      if (pending && pending.catch) pending.catch(function () { setStatus(MSG.playFail); });
    }
  }
  seek.addEventListener('pointerup', endSeek);
  seek.addEventListener('pointercancel', endSeek);

  videoFile.addEventListener('change', function () {
    var file = videoFile.files && videoFile.files[0];
    videoFile.value = '';
    if (!file) return;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(file);
    videoKind = 'local';
    localName = file.name;
    seekRepair = false;
    video.poster = '';
    updateSourceButtons();
    mode = 'idle';
    if (AdEngine.ready) AdEngine.parkAt(0);
    clearPlayhead();
    setMeter(0);
    video.muted = true;
    video.src = objectUrl;
    video.load();
    setStatus(MSG.videoLoaded);
    updateButtons();
  });

  function loadBuiltIn(src, kind, poster) {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = null;
    videoKind = kind;
    localName = '';
    seekRepair = false;
    updateSourceButtons();
    mode = 'idle';
    if (AdEngine.ready) AdEngine.parkAt(0);
    clearPlayhead();
    setMeter(0);
    video.muted = true;
    video.poster = poster;
    video.src = src;
    video.load();
    setStatus(MSG.ready);
    updateButtons();
    updateTvLabel();
  }

  useSample.addEventListener('click', function () {
    loadBuiltIn('media/ad.mp4', 'ad', 'media/poster.jpg');
  });

  useDemo.addEventListener('click', function () {
    loadBuiltIn('media/placeholder.mp4', 'demo', 'media/demo-poster.png');
  });

  exportWav.addEventListener('click', function () {
    if (!AdEngine.ready) return;
    if (mode === 'preview') {
      mode = 'idle';
      AdEngine.parkAt(0);
      clearPlayhead();
      setMeter(0);
    }
    if (!video.paused) video.pause();
    updateButtons();
    exportWav.disabled = true;
    saveWav.hidden = true;
    setStatus(MSG.exporting);
    AdEngine.exportWav(state, state.length).then(function (blob) {
      if (wavUrl) URL.revokeObjectURL(wavUrl);
      wavUrl = URL.createObjectURL(blob);
      saveWav.href = wavUrl;
      saveWav.hidden = false;
      setStatus(MSG.exportReady);
      saveWav.focus();
    }).catch(function (err) {
      console.error(err);
      setStatus(MSG.exportFail);
    }).then(function () {
      exportWav.disabled = false;
    });
  });

  saveJson.addEventListener('click', function () {
    var blob = new Blob([JSON.stringify(serialize(), null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'ad-music.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    setStatus('已下載設定。Settings downloaded.');
  });

  loadJson.addEventListener('change', function () {
    var file = loadJson.files && loadJson.files[0];
    loadJson.value = '';
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        applyLoaded(JSON.parse(String(reader.result)));
        setStatus('已載入設定。Settings loaded.');
      } catch (err) {
        console.error(err);
        setStatus(MSG.loadFail);
      }
    };
    reader.onerror = function () { setStatus(MSG.loadFail); };
    reader.readAsText(file);
  });

  /* iPad / iPhone audio unlock.
     - audioSession 'playback' lets Web Audio play through AirPods and ignores
       the silent switch (Safari 16.4+).
     - A looping silent <audio> element does the same on older iOS.
     - Bluetooth route changes can leave the AudioContext 'suspended' or
       'interrupted', so every tap resumes it. */
  var SILENT_WAV = 'data:audio/wav;base64,UklGRmQGAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YUAGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
  var silentEl = null;

  function unlockAudio() {
    try {
      if (navigator.audioSession && navigator.audioSession.type !== 'playback') {
        navigator.audioSession.type = 'playback';
      }
    } catch (e) { /* not supported */ }
    try {
      if (!silentEl) {
        silentEl = document.createElement('audio');
        silentEl.src = SILENT_WAV;
        silentEl.loop = true;
        silentEl.setAttribute('playsinline', '');
        silentEl.preload = 'auto';
      }
      if (silentEl.paused) {
        var pr = silentEl.play();
        if (pr && pr.catch) pr.catch(function () {});
      }
    } catch (e) { /* ignore */ }
    var ctx = (typeof Tone !== 'undefined' && Tone.getContext) ? Tone.getContext().rawContext : null;
    if (ctx && ctx.state !== 'running' && ctx.resume) {
      return ctx.resume().catch(function () {});
    }
    return Promise.resolve();
  }

  ['pointerdown', 'touchend', 'keydown'].forEach(function (type) {
    document.addEventListener(type, function () {
      if (AdEngine.ready) unlockAudio();
    }, true);
  });

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && AdEngine.ready) unlockAudio();
  });

  startBtn.addEventListener('click', function () {
    unlockAudio();
    startBtn.disabled = true;
    startBtn.textContent = '準備中… Getting ready…';
    Tone.start().then(function () {
      gateMsg.textContent = '正在載入樂器聲音… Loading instrument sounds…';
      return AdEngine.init(function () { return state; });
    }).then(function () {
      AdEngine.setDynamics(dynamicsDb());
      app.inert = false;
      gate.hidden = true;
      var title = document.getElementById('pageTitle');
      title.tabIndex = -1;
      title.focus();
    }).catch(function (err) {
      console.error(err);
      startBtn.disabled = false;
      startBtn.textContent = '開始 Start';
      gateMsg.textContent = '樂器聲音未能載入，請重新載入頁面或再試一次。Instrument sounds could not load. Reload or try again.';
    });
  });

  requestAnimationFrame(tick);


  // I-board lesson bridge: same-origin parent calls a fixed command vocabulary.
  window.IBoardMusicMaker = {run: async function(action) {
    if(action==='pause'){mode='idle';if(AdEngine.ready)AdEngine.parkAt(0);video.pause();clearPlayhead();setMeter(0);updateButtons();return '已停止 Music Maker。';}
    if(!AdEngine.ready)throw new Error('請先在投影電腦的 Music Maker 按「開始」啟用音訊。');
    var allowed={speed:['slow','medium','fast'],dynamics:['loud','mid','soft'],instrument:['contrabass','cello','piano','flute','bells'],style:['bouncy','steady','light','groovy']};
    var isCheck=action==='check';
    if(action==='check'){choose('speed','slow');choose('dynamics','soft');choose('instrument','bells');choose('style','light');mode='idle';AdEngine.parkAt(0);state.length=15;lengthInput.value='15';lengthValue.textContent='15';action='play';}
    if(action==='play'){
      if(!isCheck){state.length=30;lengthInput.value='30';lengthValue.textContent='30';}
      var context=Tone.getContext().rawContext;
      if(context.state!=='running')throw new Error('音訊尚未啟用，請在投影電腦按「開始」或「試聽」。');
      if(mode!=='preview')previewBtn.click();return '已開始 Music Maker 試聽（最多 '+state.length+' 秒）。';
    }
    var match=/^(speed|dynamics|instrument|style)-([a-z]+)$/.exec(action);
    if(!match||allowed[match[1]].indexOf(match[2])<0)throw new Error('不支援的 Music Maker 指令。');
    choose(match[1],match[2]);return '已更新 Music Maker 的'+({speed:'速度',dynamics:'力度',instrument:'樂器',style:'風格'}[match[1]])+'。';
  }};
  window.addEventListener('pagehide',function(){mode='idle';if(AdEngine.ready)AdEngine.parkAt(0);video.pause();if(silentEl)silentEl.pause();});

  window.AdMusic = {
    getState: function () {
      return JSON.parse(JSON.stringify(serialize()));
    }
  };
})();
