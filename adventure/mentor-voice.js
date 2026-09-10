/* Original synthetic chipmunk-style babble. No microphone, speech API or download.
   A cached 4.8 s mono buffer loops in Web Audio; no JavaScript playback timer. */
( () => {
  'use strict';
  const SAMPLE_RATE = 22050, DURATION = 4.8;
  const PITCHES = [520, 660, 430, 580, 720, 480, 610, 540];
  const VOWELS = [[800, 2200, 3400], [500, 2700, 3800], [650, 1500, 3200], [1000, 2400, 3600], [450, 1700, 3000]];
  const VOICE_PROFILES = Object.freeze({
    BYTE: {
      pitch: 1,
      seed: 317,
      rhythm: 1,
      gap: 1,
      vowel: 0
    },
    Aster: {
      pitch: 1.20,
      seed: 1103,
      rhythm: .90,
      gap: 1.22,
      vowel: 2
    },
    Mira: {
      pitch: 1.48,
      seed: 2707,
      rhythm: .73,
      gap: 1.45,
      vowel: 1
    },
    Rook: {
      pitch: .86,
      seed: 4513,
      rhythm: 1.03,
      gap: .82,
      vowel: 3
    },
    Fern: {
      pitch: 1.32,
      seed: 7919,
      rhythm: .84,
      gap: 1.33,
      vowel: 4
    }
  });
  function createSamples(speaker = 'BYTE') {
    const profile = VOICE_PROFILES[speaker] || VOICE_PROFILES.BYTE;
    const {
      ceil,
      exp,
      sin,
      PI,
      max,
      abs,
      round,
      floor,
      imul,
      min
    } = Math;
    const samples = new Float32Array(ceil(SAMPLE_RATE * DURATION));
    // Small vowel wavetables avoid evaluating harmonics for every audio sample.
    const tables = VOWELS.map(formants => {
      const table = new Float32Array(256);
      let peak = 0;
      const weights = Array.from({ length: 10 }, (_, i) => {
        const f = (i + 1) * 550;
        return (.12 + formants.reduce( (sum, center) => sum + exp(- ( ( (f - center) / 500) ** 2)), 0)) / (i + 1);
      });
      for (let n = 0; n < 256; n++) {
        let value = 0;
        for (let h = 1; h <= weights.length; h++) value += weights[h - 1] * sin(n / 256 * PI * 2 * h);
        table[n] = value;
        peak = max(peak, abs(value));
      }
      for (let n = 0; n < table.length; n++) table[n] /= peak;
      return table;
    });
    let cursor = .08, seed = profile.seed, previousNoise = 0;
    for (let syllable = 0; syllable < 24; syllable++) {
      const duration = [.085, .12, .095, .08, .13, .10][syllable % 6] * profile.rhythm, table = tables[ (syllable + profile.vowel) % tables.length];
      const start = round(cursor * SAMPLE_RATE), length = round(duration * SAMPLE_RATE);
      const pitch = PITCHES[ (syllable + profile.vowel) % PITCHES.length] * profile.pitch;
      let phase = 0;
      for (let n = 0; n < length && start + n < samples.length; n++) {
        const t = n / SAMPLE_RATE, progress = n / length;
        phase += pitch * (1 + (syllable % 2 ? .2: - .17) * (progress - .5)) / SAMPLE_RATE;
        if (phase >= 1) phase -= 1;
        const position = phase * 256, index = floor(position), fraction = position - index;
        const vowel = table[index] * (1 - fraction) + table[ (index + 1) & 255] * fraction;
        seed = (imul(seed, 1664525) + 1013904223) >>> 0;
        const noise = seed / 0xffffffff * 2 - 1, consonant = (noise - previousNoise) * max(0, 1 - t / .025) * .09;
        previousNoise = noise;
        const envelope = min(1, t / .009, (duration - t) / .015);
        samples[start + n] = (vowel * .62 + consonant) * max(0, envelope);
      }
      // Several quick syllables, a breath, and a longer break before looping.
      cursor += duration + (syllable % 6 === 5 ? .34: [.028, .04, .018][syllable % 3]) * profile.gap;
    }
    return samples;
  }
  class GibberishVoice { constructor(speaker = 'BYTE') {
      this.speaker = Object.hasOwn(VOICE_PROFILES, speaker) ? speaker: 'BYTE';
      this.context = null;
      this.buffer = null;
      this.source = null;
      this.gain = null;
    } get active() {
      return this.source !== null;
    } play(context, destination) {
      if (this.source && this.context === context) return;
      this.stop();
      if (this.context !== context || !this.buffer) {
        const samples = createSamples(this.speaker), buffer = context.createBuffer(1, samples.length, SAMPLE_RATE);
        buffer.getChannelData(0).set(samples);
        this.buffer = buffer;
        this.context = context;
      }
      const source = context.createBufferSource(), gain = context.createGain();
      this.source = source;
      this.gain = gain;
      try {
        source.buffer = this.buffer;
        source.loop = true;
        gain.gain.value = .18;
        source.connect(gain);
        gain.connect(destination);
        source.onended = () => {
          source.disconnect();
          gain.disconnect();
          if (this.source === source) {
            this.source = null;
            this.gain = null;
          }
        };
        source.start();
      } catch (error) {
        this.stop();
        throw error;
      }
    } stop() {
      const source = this.source, gain = this.gain;
      this.source = null;
      this.gain = null;
      if (!source) return;
      source.onended = null;
      try {
        source.stop();
      } catch { /* Already stopped or not yet started. */ }
      source.disconnect();
      gain.disconnect();
    } }
  window.BitboundMentorVoice = Object.freeze({
    SAMPLE_RATE,
    DURATION,
    VOICE_PROFILES,
    createSamples,
    GibberishVoice
  });
})();
