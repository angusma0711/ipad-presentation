'use strict';

/* Live playback uses Tone.js. WAV export builds a second instrument kit inside
   Tone.Offline so the file matches the grid without recording the microphone. */
(function () {
  /* One mix for every instrument, so changing instrument changes only the
     melody voice (timbre and register). Chords always use the soft piano pad. */
  var MIX = { drum: 0.8, melody: 0.85, chord: 0.28 };
  var INSTRUMENT_NAMES = ['contrabass', 'cello', 'piano', 'flute', 'bells'];
  var OCTAVE = { contrabass: -2, cello: -1, piano: 0, flute: 1, bells: 2 };

  function transpose(note, octaves) {
    if (!octaves) return note;
    var m = /^([A-G][b#]?)(-?\d+)$/.exec(note);
    if (!m) return note;
    return m[1] + (Number(m[2]) + octaves);
  }

  var MASTER_GAIN = 0.9;
  var DYNAMICS_FADE = 0.1;

  var kit = null;
  var dynamicsDb = 0;
  var seq = null;
  var ready = false;
  var getScore = function () { return null; };

  function track(list, node) {
    list.push(node);
    return node;
  }

  // Decode each recording once. Live and offline samplers share immutable buffers.
  var sampleBuffers = null;
  var sampleLoad = null;
  var VOICE_SETTINGS = {
    contrabass: { attack: 0.012, release: 0.18, volume: -3 },
    cello: { attack: 0.012, release: 0.2, volume: -6 },
    piano: { attack: 0, release: 0.65, volume: -5 },
    flute: { attack: 0.012, release: 0.12, volume: -7 },
    bells: { attack: 0, release: 1.4, volume: -6 }
  };

  function loadSamples() {
    if (sampleBuffers) return Promise.resolve();
    if (sampleLoad) return sampleLoad;
    var decoded = {};
    var loaders = [];
    sampleLoad = Promise.resolve().then(function () {
      if (!window.MusicMakerSamples) throw new Error('Instrument sample bank missing');
      var tasks = [];
      INSTRUMENT_NAMES.forEach(function (name) {
        var bank = window.MusicMakerSamples[name];
        if (!bank || !Object.keys(bank).length) throw new Error('Missing samples: ' + name);
        decoded[name] = {};
        Object.keys(bank).forEach(function (note) {
          tasks.push(new Promise(function (resolve, reject) {
            var buffer = new Tone.ToneAudioBuffer(bank[note], function (loaded) {
              var audio = loaded.get();
              var peak = 0;
              for (var ch = 0; ch < audio.numberOfChannels; ch += 1) {
                var channel = audio.getChannelData(ch);
                for (var i = 0; i < channel.length; i += 1) {
                  peak = Math.max(peak, Math.abs(channel[i]));
                }
              }
              // Sources have different recording levels; normalize once before mixing.
              if (peak > 0) {
                var gain = 0.85 / peak;
                for (var c = 0; c < audio.numberOfChannels; c += 1) {
                  var data = audio.getChannelData(c);
                  for (var j = 0; j < data.length; j += 1) data[j] *= gain;
                }
              }
              decoded[name][note] = audio;
              resolve();
            }, reject);
            loaders.push(buffer);
          }));
        });
      });
      return Promise.all(tasks);
    }).then(function () {
      sampleBuffers = decoded;
      loaders.forEach(function (buffer) { buffer.dispose(); });
    }).catch(function (err) {
      loaders.forEach(function (buffer) { buffer.dispose(); });
      sampleLoad = null;
      throw err;
    });
    return sampleLoad;
  }

  function makeVoice(kind, destination, nodes) {
    var settings = VOICE_SETTINGS[kind];
    var sampler = track(nodes, new Tone.Sampler({
      urls: sampleBuffers[kind],
      attack: settings.attack,
      release: settings.release,
      curve: 'exponential',
      volume: settings.volume
    }));
    sampler.connect(destination);
    return sampler;
  }

  function createKit(onlyInstrument) {
  var nodes = [];
    var limiter = track(nodes, new Tone.Limiter(-1.5).toDestination());
    var master = track(nodes, new Tone.Gain(0.9).connect(limiter));
    var drumBus = track(nodes, new Tone.Gain(1).connect(master));
    var melodyBus = track(nodes, new Tone.Gain(1).connect(master));
    var chordBus = track(nodes, new Tone.Gain(1).connect(master));

    var kick = track(nodes, new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 5.5,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.28, sustain: 0, release: 0.12 }
    }).connect(drumBus));
    kick.volume.value = -3;

    var tom = track(nodes, new Tone.MembraneSynth({
      pitchDecay: 0.08,
      octaves: 3,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.22, sustain: 0, release: 0.1 }
    }).connect(drumBus));
    tom.volume.value = -4;

    var snareFilter = track(nodes, new Tone.Filter({ frequency: 1800, type: 'bandpass', Q: 0.8 }).connect(drumBus));
    var snareNoise = track(nodes, new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.16, sustain: 0 }
    }).connect(snareFilter));
    snareNoise.volume.value = -8;
    var snareBody = track(nodes, new Tone.MembraneSynth({
      pitchDecay: 0.02,
      octaves: 2,
      envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.04 }
    }).connect(drumBus));
    snareBody.volume.value = -8;

    var hatFilter = track(nodes, new Tone.Filter({ frequency: 6500, type: 'highpass' }).connect(drumBus));
    var hat = track(nodes, new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.04, sustain: 0 }
    }).connect(hatFilter));
    hat.volume.value = -16;

    var clapFilter = track(nodes, new Tone.Filter({ frequency: 1400, type: 'bandpass', Q: 0.7 }).connect(drumBus));
    var clap = track(nodes, new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.14, sustain: 0 }
    }).connect(clapFilter));
    clap.volume.value = -10;

  var melody = {};
  var names = onlyInstrument ? [onlyInstrument] : INSTRUMENT_NAMES;
  names.forEach(function (name) {
    melody[name] = makeVoice(name, melodyBus, nodes);
  });
  var chordVoice = makeVoice('piano', chordBus, nodes);

    return {
      nodes: nodes,
      master: master,
      drumBus: drumBus,
      melodyBus: melodyBus,
      chordBus: chordBus,
      drums: {
        kick: function (time) { kick.triggerAttackRelease('C1', 0.16, time, 0.95); },
        snare: function (time) {
          snareNoise.triggerAttackRelease(0.12, time, 0.8);
          snareBody.triggerAttackRelease('G3', 0.08, time, 0.5);
        },
        hat: function (time) { hat.triggerAttackRelease(0.03, time, 0.55); },
        clap: function (time) { clap.triggerAttackRelease(0.11, time, 0.7); },
        tom: function (time) { tom.triggerAttackRelease('A2', 0.18, time, 0.8); }
      },
      melody: melody,
      chordVoice: chordVoice
    };
  }

  function applyMix(target, instrument) {
    target.drumBus.gain.value = MIX.drum;
    target.melodyBus.gain.value = MIX.melody;
    target.chordBus.gain.value = MIX.chord;
  }

  function isStart(grid, row, step) {
    if (!grid[row][step]) return false;
    if (step === 0) return true;
    return !grid[row][step - 1];
  }

  function runLength(grid, row, step) {
    var n = 1;
    while (step + n < 16 && grid[row][step + n]) n += 1;
    return n;
  }

  function playHits(target, score, step, time, stepDur, absoluteStep) {
    var drums = score.drums;
    if (drums.kick[step]) target.drums.kick(time);
    if (drums.snare[step]) target.drums.snare(time);
    if (drums.hat[step]) target.drums.hat(time);
    if (drums.clap[step]) target.drums.clap(time);
    if (drums.tom[step]) target.drums.tom(time);

    var voice = target.melody[score.instrument] || target.melody.piano;
    var chordVoice = target.chordVoice;
    var shift = OCTAVE[score.instrument] || 0;
score.melody.forEach(function (_row, r) {
    if (!isStart(score.melody, r, step)) return;
    var note = score.scale[r];
      if (!note) return;
      note = transpose(note, shift);
      var dur = Math.max(0.06, runLength(score.melody, r, step) * stepDur * 0.92);
      voice.triggerAttackRelease(note, dur, time, 0.84);
    });

    var every = score.chordEvery || 4;
    if (step % every === 0) {
      var chord = score.chords[Math.floor(absoluteStep / every) % score.chords.length];
      if (chord && chord.length) {
        var chordDur = Math.max(0.12, every * stepDur * 0.9);
        chordVoice.triggerAttackRelease(chord, chordDur, time, 0.5);
      }
    }
  }

  function releaseAll() {
    if (!kit) return;
    var time = Tone.now();
    Object.keys(kit.melody).forEach(function (name) {
      if (kit.melody[name].releaseAll) kit.melody[name].releaseAll(time);
    });
    if (kit.chordVoice && kit.chordVoice.releaseAll) kit.chordVoice.releaseAll(time);
  }

  function ensureSequence() {
    if (seq) return;
    var steps = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    seq = new Tone.Sequence(function (time, step) {
      var score = getScore();
      if (!score) return;
      var stepDur = (60 / score.bpm) / 4;
      // Transport ticks preserve the harmonic position across melody loops,
      // pauses and seeks; eight-step chords must not skip slots 1 and 3.
      var absoluteStep = Math.round(Tone.Transport.getTicksAtTime(time) / (Tone.Transport.PPQ / 4));
      playHits(kit, score, step, time, stepDur, absoluteStep);
    }, steps, '16n');
    seq.loop = true;
    seq.start(0);
  }

  function setTempo(bpm) {
    if (!ready) return;
    Tone.Transport.bpm.value = bpm;
  }

  function playFrom(seconds) {
    var score = getScore();
    if (!ready || !score) return;
    ensureSequence();
    Tone.Transport.bpm.value = score.bpm;
    if (seq.state !== 'started') seq.start(0);
    if (Tone.Transport.state === 'started') Tone.Transport.pause();
    Tone.Transport.seconds = Math.max(0, seconds || 0);
    Tone.Transport.start();
  }

  function parkAt(seconds) {
    var score = getScore();
    if (!ready || !score) return;
    Tone.Transport.bpm.value = score.bpm;
    if (Tone.Transport.state === 'started') Tone.Transport.pause();
    Tone.Transport.seconds = Math.max(0, seconds || 0);
    releaseAll();
  }

  function pauseMusic() {
    if (!ready) return;
    if (Tone.Transport.state === 'started') Tone.Transport.pause();
    releaseAll();
  }

  function cloneScore(score) {
    return {
      dynamics: score.dynamics,
      bpm: score.bpm,
      instrument: score.instrument,
      chordEvery: score.chordEvery,
      scale: score.scale.slice(),
      chords: score.chords.map(function (notes) { return notes.slice(); }),
      drums: {
        kick: score.drums.kick.slice(),
        snare: score.drums.snare.slice(),
        hat: score.drums.hat.slice(),
        clap: score.drums.clap.slice(),
        tom: score.drums.tom.slice()
      },
      melody: score.melody.map(function (row) { return row.slice(); })
    };
  }

  function disposeKit(target) {
    if (!target) return;
    target.nodes.forEach(function (node) {
      try {
        if (node && typeof node.dispose === 'function') node.dispose();
      } catch (err) {
        /* A failed cleanup should not block the download. */
      }
    });
  }

  function scheduleScore(target, score, duration, lead) {
    var stepDur = (60 / score.bpm) / 4;
    var count = Math.floor((duration - 0.001) / stepDur) + 1;
    for (var i = 0; i < count; i += 1) {
      var time = i * stepDur + lead;
      if (time >= duration + lead) break;
      playHits(target, score, i % 16, time, stepDur, i);
    }
  }

  async function exportWav(score, duration) {
    var snapshot = cloneScore(score);
    await loadSamples();
    var exportGain = MASTER_GAIN * Tone.dbToGain(({ loud: 0, mid: -6, soft: -14 })[snapshot.dynamics] || 0);
    var lead = 0.03;
    var tail = 1.5;
    var renderFor = duration + lead + tail;
    var offlineKit = null;
    var rendered = await Tone.Offline(function () {
      offlineKit = createKit(snapshot.instrument);
      applyMix(offlineKit, snapshot.instrument);
      offlineKit.master.gain.cancelScheduledValues(0);
      offlineKit.master.gain.setValueAtTime(0.0001, 0);
      offlineKit.master.gain.linearRampToValueAtTime(exportGain, lead);
      offlineKit.master.gain.setValueAtTime(exportGain, Math.max(lead, renderFor - 0.08));
      offlineKit.master.gain.linearRampToValueAtTime(0.0001, renderFor - 0.01);
      scheduleScore(offlineKit, snapshot, duration, lead);
    }, renderFor, 2, 44100);
    var audioBuffer = typeof rendered.get === 'function' ? rendered.get() : rendered;
    disposeKit(offlineKit);
    return audioBufferToWav(audioBuffer);
  }

  function audioBufferToWav(buffer) {
    var channelCount = buffer.numberOfChannels;
    var sampleRate = buffer.sampleRate;
    var frames = buffer.length;
    var channels = [];
    for (var c = 0; c < channelCount; c += 1) channels.push(buffer.getChannelData(c));
    var block = channelCount * 2;
    var dataSize = frames * block;
    var ab = new ArrayBuffer(44 + dataSize);
    var view = new DataView(ab);
    function str(offset, text) {
      for (var i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
    }
    str(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    str(8, 'WAVE');
    str(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channelCount, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * block, true);
    view.setUint16(32, block, true);
    view.setUint16(34, 16, true);
    str(36, 'data');
    view.setUint32(40, dataSize, true);
    var offset = 44;
    for (var i = 0; i < frames; i += 1) {
      for (var ch = 0; ch < channelCount; ch += 1) {
        var sample = Math.max(-1, Math.min(1, channels[ch][i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
        offset += 2;
      }
    }
    return new Blob([ab], { type: 'audio/wav' });
  }

  async function init(scoreGetter) {
    getScore = scoreGetter;
    await loadSamples();
    if (!kit) kit = createKit();
    var first = getScore();
    if (first) applyMix(kit, first.instrument);
    ensureSequence();
    if (first) Tone.Transport.bpm.value = first.bpm;
    ready = true;
  }

  function stepFromSeconds(seconds, bpm) {
    var stepDur = (60 / bpm) / 4;
    if (!isFinite(stepDur) || stepDur <= 0) return 0;
    var loop = stepDur * 16;
    var local = seconds % loop;
    if (local < 0) local += loop;
    return Math.floor(local / stepDur + 1e-6) % 16;
  }

  /* Changes only the live master gain, with a short fade so nothing restarts. */
  function setDynamics(db) {
    dynamicsDb = isFinite(db) ? db : 0;
    if (!kit) return;
    kit.master.gain.rampTo(MASTER_GAIN * Tone.dbToGain(dynamicsDb), DYNAMICS_FADE);
  }

  window.AdEngine = {
    init: init,
    setDynamics: setDynamics,
    masterGain: function () { return kit ? kit.master.gain.value : null; },
    setTempo: setTempo,
    setInstrument: function (name) {
      if (!kit) return;
      applyMix(kit, name);
      releaseAll();
    },
    playFrom: playFrom,
    parkAt: parkAt,
    pauseMusic: pauseMusic,
    exportWav: exportWav,
    stepFromSeconds: stepFromSeconds,
    transportState: function () { return ready ? Tone.Transport.state : 'stopped'; },
    transportSeconds: function () { return ready ? Tone.Transport.seconds : 0; },
    get ready() { return ready; }
  };
})();
