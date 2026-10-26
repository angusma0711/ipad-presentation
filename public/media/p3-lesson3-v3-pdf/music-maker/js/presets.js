'use strict';

/* Musical presets for the ad-music workshop.
   Melody rows stay inside a pentatonic scale so edits cannot sound "wrong". */
(function () {
  var MOODS = [
    { id: 'happy', zh: '開心', en: 'Happy', color: '#FFB703' },
    { id: 'exciting', zh: '興奮', en: 'Exciting', color: '#FB5607' },
    { id: 'calm', zh: '平靜', en: 'Calm', color: '#2A9D8F' },
    { id: 'sad', zh: '傷心', en: 'Sad', color: '#457B9D' },
    { id: 'mysterious', zh: '神秘', en: 'Mysterious', color: '#7B2CBF' }
  ];

  var SPEEDS = [
    { id: 'slow', zh: '慢', en: 'Slow', color: '#6D8A96' },
    { id: 'medium', zh: '中', en: 'Medium', color: '#E9A825' },
    { id: 'fast', zh: '快', en: 'Fast', color: '#E4572E' }
  ];

  /* Ordered from low to high register. octave = how far the melody is moved
     from the base scale. Only the melody voice changes between instruments. */
  var INSTRUMENTS = [
    { id: 'contrabass', zh: '低音大提琴', en: 'Double bass', tag: '低', octave: -2, color: '#8D5A3B' },
    { id: 'cello', zh: '大提琴', en: 'Cello', tag: '中低', octave: -1, color: '#C0713A' },
    { id: 'piano', zh: '鋼琴', en: 'Piano', tag: '中', octave: 0, color: '#E07A3D' },
    { id: 'flute', zh: '長笛', en: 'Flute', tag: '中高', octave: 1, color: '#3A86FF' },
    { id: 'bells', zh: '鈴鐘', en: 'Bells', tag: '高', octave: 2, color: '#F15BB5' }
  ];

  /* Style names describe movement so P3 pupils can link them to pictures. */
  var STYLES = [
    { id: 'bouncy', zh: '蹦跳', en: 'Hop', color: '#FFD60A' },
    { id: 'steady', zh: '踏步', en: 'March', color: '#52B788' },
    { id: 'light', zh: '飄浮', en: 'Float', color: '#48CAE4' },
    { id: 'groovy', zh: '跳舞', en: 'Dance', color: '#9D4EDD' }
  ];

  /* Dynamics only change the master volume; see DYNAMICS_DB in app.js. */
  var DYNAMICS = [
    { id: 'loud', zh: '強', en: 'Loud', color: '#C1121F' },
    { id: 'mid', zh: '中', en: 'Medium', color: '#E9A825' },
    { id: 'soft', zh: '弱', en: 'Soft', color: '#8FA9B5' }
  ];

  var DRUM_ROWS = [
    { id: 'kick', zh: '低鼓', en: 'Kick', color: '#C44536' },
    { id: 'snare', zh: '小鼓', en: 'Snare', color: '#E07A3D' },
    { id: 'hat', zh: '踏鈸', en: 'Hi-hat', color: '#E0A100' },
    { id: 'clap', zh: '拍手', en: 'Clap', color: '#1F8A70' },
    { id: 'tom', zh: '筒鼓', en: 'Tom', color: '#3D5A80' }
  ];

  var MELODY_COLORS = ['#FF595E', '#FF924C', '#FFCA3A', '#8AC926', '#1982C4'];

  /* High note first, so the top grid row is the highest pitch. */
  var SCALES = {
    happy: ['C5', 'A4', 'G4', 'E4', 'D4'],
    exciting: ['C5', 'A4', 'G4', 'E4', 'D4'],
    calm: ['C5', 'A4', 'G4', 'E4', 'D4'],
    sad: ['A4', 'G4', 'E4', 'D4', 'C4'],
    mysterious: ['C5', 'Bb4', 'G4', 'F4', 'Eb4']
  };

  var SCALE_NAMES = {
    happy: { zh: '五聲音階 · C 大調', en: 'Pentatonic · C major' },
    exciting: { zh: '五聲音階 · C 大調', en: 'Pentatonic · C major' },
    calm: { zh: '五聲音階 · C 大調', en: 'Pentatonic · C major' },
    sad: { zh: '五聲音階 · A 小調', en: 'Pentatonic · A minor' },
    mysterious: { zh: '五聲音階 · C 小調', en: 'Pentatonic · C minor' }
  };

  var CHORDS = {
    happy: [['C4', 'E4', 'G4'], ['C4', 'F4', 'A4'], ['C4', 'E4', 'G4'], ['C4', 'F4', 'A4']],
    exciting: [['C4', 'E4', 'G4'], ['C4', 'F4', 'A4'], ['B3', 'D4', 'G4'], ['C4', 'E4', 'G4']],
    calm: [['C4', 'E4', 'G4'], ['A3', 'C4', 'E4'], ['A3', 'C4', 'F4'], ['B3', 'D4', 'G4']],
    sad: [['A3', 'C4', 'E4'], ['A3', 'C4', 'F4'], ['C4', 'E4', 'G4'], ['B3', 'D4', 'G4']],
    mysterious: [['C4', 'Eb4', 'G4'], ['C4', 'F4', 'Ab4'], ['Bb3', 'D4', 'F4'], ['Bb3', 'D4', 'G4']]
  };

  var CHORD_NAMES = {
    happy: ['C', 'F', 'C', 'F'],
    exciting: ['C', 'F', 'G', 'C'],
    calm: ['C', 'Am', 'F', 'G'],
    sad: ['Am', 'F', 'C', 'G'],
    mysterious: ['Cm', 'Fm', 'Bb', 'Gm']
  };

  /* Nursery-style harmonization of the existing happy/pentatonic motifs.
     Keep accented melody notes supported instead of imposing a pop loop.
     Hop/Dance: E -> A -> E -> A/C, supported by I/IV (plagal return).
     March: E -> G -> A -> G, supported by I/V/IV/V (V -> I on repeat).
     Float: E -> G -> E -> G across two bars; prolong I until the final V.
     References and exact timing: docs/HARMONY.md. */
  var CHILD_CHORDS = {
    C: ['C4', 'E4', 'G4'],
    F: ['C4', 'F4', 'A4'],
    G: ['B3', 'D4', 'G4']
  };
  var CHILD_PROGRESSIONS = {
    bouncy: ['C', 'F', 'C', 'F'],
    steady: ['C', 'G', 'F', 'G'],
    light: ['C', 'C', 'C', 'G'],
    groovy: ['C', 'F', 'C', 'F']
  };

  /* Each character is one of 16 steps. Melody: row index 0 (high) to 4 (low), or ".". */
  var MELODY = {
    happy: {
      bouncy: '3.2.1.2.3.2.1.0.',
      steady: '3...2...1...2...',
      light: '3.......2.......',
      groovy: '3..2.1..3..2.1..'
    },
    exciting: {
      bouncy: '0.1.2.3.0.1.2.3.',
      steady: '0...1...2...1...',
      light: '0.......1.......',
      groovy: '0..1..2.0..1..2.'
    },
    calm: {
      bouncy: '2...3...2...1...',
      steady: '2.......3.......',
      light: '2...............',
      groovy: '2.....3...2.....'
    },
    sad: {
      bouncy: '1...2...3...4...',
      steady: '1.......2.......',
      light: '0...............',
      groovy: '1..2....3..4....'
    },
    mysterious: {
      bouncy: '4...2...4...1...',
      steady: '4.......2.......',
      light: '4...............',
      groovy: '4..2....3..1....'
    }
  };

  var DRUMS = {
    happy: {
      bouncy: { kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', clap: '....x.......x...', tom: '..............x.' },
      steady: { kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'xxxxxxxxxxxxxxxx', clap: '....x.......x...', tom: '........x.......' },
      light: { kick: 'x.......x.......', snare: '....x...........', hat: 'x...x...x...x...', clap: '................', tom: '................' },
      groovy: { kick: 'x..x..x.x..x....', snare: '....x.......x...', hat: 'x.xxx.x.x.xxx.x.', clap: '....x......x.x..', tom: '.........x......' }
    },
    exciting: {
      bouncy: { kick: 'x..xx...x..xx...', snare: '....x.......x...', hat: 'xxxxxxxxxxxxxxxx', clap: '....x...x...x...', tom: '......x.......x.' },
      steady: { kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'xxxxxxxxxxxxxxxx', clap: '....x.......x...', tom: '......x.......x.' },
      light: { kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', clap: '....x...........', tom: '................' },
      groovy: { kick: 'x..x..x.x..x..x.', snare: '....x.......x...', hat: 'xxxxxxxxxxxxxxxx', clap: '....x...x...x..x', tom: '..x.........x...' }
    },
    calm: {
      bouncy: { kick: 'x.......x.......', snare: '....x...........', hat: 'x...x...x...x...', clap: '............x...', tom: '................' },
      steady: { kick: 'x.......x.......', snare: '........x.......', hat: 'x...x...x...x...', clap: '................', tom: '................' },
      light: { kick: 'x...............', snare: '........x.......', hat: 'x.......x.......', clap: '................', tom: '................' },
      groovy: { kick: 'x.....x.........', snare: '....x...........', hat: 'x...x...x...x...', clap: '................', tom: '..............x.' }
    },
    sad: {
      bouncy: { kick: 'x.......x.......', snare: '........x.......', hat: 'x...x...x...x...', clap: '................', tom: '................' },
      steady: { kick: 'x.......x.......', snare: '........x.......', hat: 'x.......x.......', clap: '................', tom: '................' },
      light: { kick: 'x...............', snare: '................', hat: 'x...............', clap: '................', tom: '................' },
      groovy: { kick: 'x.....x.........', snare: '......x.........', hat: 'x...x.....x.....', clap: '................', tom: '................' }
    },
    mysterious: {
      bouncy: { kick: 'x.....x...x.....', snare: '......x.........', hat: '..x.....x.....x.', clap: '................', tom: '...........x...x' },
      steady: { kick: 'x.......x.......', snare: '........x.......', hat: '..x.....x.....x.', clap: '................', tom: '..............x.' },
      light: { kick: 'x...............', snare: '................', hat: '....x...........', clap: '................', tom: '...........x....' },
      groovy: { kick: 'x..x......x.....', snare: '......x.........', hat: '..x...x...x...x.', clap: '................', tom: '.........x......' }
    }
  };

  var SPEED_BPM = { slow: 76, medium: 104, fast: 132 };
  var MOOD_BPM = { happy: 0, exciting: 14, calm: -12, sad: -8, mysterious: -6 };

  function must16(str, label) {
    if (typeof str !== 'string' || str.length !== 16) {
      throw new Error(label + ' must be 16 steps');
    }
    return str;
  }

  function parseHits(str, label) {
    must16(str, label);
    return str.split('').map(function (ch) { return ch === 'x'; });
  }

  function parseMelody(str, label) {
    must16(str, label);
    return str.split('').map(function (ch, i) {
      if (ch === '.') return -1;
      var n = Number(ch);
      if (!(n >= 0 && n <= 4)) throw new Error(label + ' bad note at ' + i);
      return n;
    });
  }

  function thinHats(hat) {
    var thinned = hat.map(function (on, i) { return on && i % 2 === 0; });
    var count = thinned.filter(Boolean).length;
    return count >= 2 ? thinned : hat.slice();
  }

  function melodyToGrid(rows) {
    var grid = [0, 1, 2, 3, 4].map(function () { return new Array(16).fill(false); });
    rows.forEach(function (row, step) {
      if (row >= 0 && row <= 4) grid[row][step] = true;
    });
    return grid;
  }

  /* Instruments no longer reshape the melody: only timbre and register change. */
  function shapeMelody(rows) {
    return rows.slice();
  }

  function build(choice) {
    var mood = choice.mood;
    var speed = choice.speed;
    var style = choice.style;
    var drumSrc = DRUMS[mood][style];
    var drums = {
      kick: parseHits(drumSrc.kick, mood + ' ' + style + ' kick'),
      snare: parseHits(drumSrc.snare, 'snare'),
      hat: parseHits(drumSrc.hat, 'hat'),
      clap: parseHits(drumSrc.clap, 'clap'),
      tom: parseHits(drumSrc.tom, 'tom')
    };

    if (speed === 'slow') drums.hat = thinHats(drums.hat);
    if (speed === 'fast' && style !== 'light' && mood !== 'calm' && mood !== 'sad') {
      var busy = parseHits('x.x.x.x.x.x.x.x.', 'fast hats');
      drums.hat = drums.hat.map(function (on, i) { return on || busy[i]; });
    }

    var motif = parseMelody(MELODY[mood][style], mood + ' ' + style);
    var shaped = shapeMelody(motif);
    var bpm = SPEED_BPM[speed] + MOOD_BPM[mood];
    bpm = Math.max(64, Math.min(160, bpm));

    var nursery = mood === 'happy';
    var chordNames = nursery ? CHILD_PROGRESSIONS[style] : CHORD_NAMES[mood];
    var chords = nursery ? chordNames.map(function (name) { return CHILD_CHORDS[name]; }) : CHORDS[mood];

    return {
      bpm: bpm,
      scale: SCALES[mood].slice(),
      scaleName: { zh: SCALE_NAMES[mood].zh, en: SCALE_NAMES[mood].en },
      chords: chords.map(function (notes) { return notes.slice(); }),
      chordNames: chordNames.slice(),
      chordEvery: (mood === 'calm' || mood === 'sad' || style === 'light') ? 8 : 4,
      drums: drums,
      melody: melodyToGrid(shaped)
    };
  }

  window.AdPresets = {
    moods: MOODS,
    speeds: SPEEDS,
    dynamics: DYNAMICS,
    instruments: INSTRUMENTS,
    styles: STYLES,
    drumRows: DRUM_ROWS,
    melodyColors: MELODY_COLORS,
    build: build
  };
})();
