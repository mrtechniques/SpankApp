// src/services/AudioManager.js
//
// Ported from taigrr/spank main.go
// - Random playback for pain/halo/custom modes
// - Escalation curve for sexy/lizard modes (slapTracker logic)
// - Configurable cooldown

import Sound from 'react-native-sound';
import { SOUNDS } from '../utils/sounds';

Sound.setCategory('Playback');

// From main.go: decayHalfLife = 30.0 seconds
const DECAY_HALF_LIFE = 30.0;

/**
 * Ported from slapTracker in main.go.
 * Tracks a rolling exponential-decay score and maps it to a file index.
 *
 * score += 1.0 on each hit
 * score *= 0.5^(elapsed / halfLife) between hits
 *
 * File index: floor(N * (1 - exp(-(score-1) / scale)))
 * where scale = (ssMax - 1) / ln(N+1)
 * and   ssMax = 1 / (1 - 0.5^(cooldown / halfLife))
 */
class SlapTracker {
  constructor(fileCount, cooldownMs) {
    this.score = 0;
    this.lastTime = null;
    this.total = 0;
    this.halfLife = DECAY_HALF_LIFE;

    const cooldownSec = cooldownMs / 1000;
    const ssMax = 1.0 / (1.0 - Math.pow(0.5, cooldownSec / DECAY_HALF_LIFE));
    this.scale = (ssMax - 1) / Math.log(fileCount + 1);
    this.fileCount = fileCount;
  }

  record(now) {
    if (this.lastTime !== null) {
      const elapsed = (now - this.lastTime) / 1000; // ms -> seconds
      this.score *= Math.pow(0.5, elapsed / this.halfLife);
    }
    this.score += 1.0;
    this.lastTime = now;
    this.total += 1;
    return { total: this.total, score: this.score };
  }

  getIndex(score) {
    const maxIdx = this.fileCount - 1;
    const idx = Math.min(
      Math.floor(this.fileCount * (1.0 - Math.exp(-(score - 1) / this.scale))),
      maxIdx
    );
    return idx;
  }

  reset() {
    this.score = 0;
    this.lastTime = null;
    this.total = 0;
  }
}

class AudioManagerClass {
  constructor() {
    this._mode = 'pain';
    this._customFiles = [];
    this._customOrder = 'random';
    this._customIndex = 0;
    this._currentSound = null;
    this._sexyTracker = new SlapTracker(60, 750);
    this._lizardTracker = new SlapTracker(1, 750);
    this._totalHits = 0;
    this._sessionHits = 0;
    this._lastPlayedLabel = '';
  }

  setMode(mode) {
    this._mode = mode;
  }

  setCooldown(cooldownMs) {
    // Re-create trackers with updated cooldown
    this._sexyTracker = new SlapTracker(60, cooldownMs);
    this._lizardTracker = new SlapTracker(SOUNDS.lizard.length, cooldownMs);
  }

  setCustomFiles(files) {
    this._customFiles = files;
    this._customIndex = 0;
  }

  setCustomOrder(order) {
    this._customOrder = order;
  }

  resetSession() {
    this._sessionHits = 0;
    this._sexyTracker.reset();
    this._lizardTracker.reset();
  }

  getStats() {
    return {
      totalHits: this._totalHits,
      sessionHits: this._sessionHits,
      lastPlayed: this._lastPlayedLabel,
    };
  }

  /**
   * Play the appropriate sound for the current mode.
   * Returns a label string for the hit log.
   */
  async play() {
    this._totalHits += 1;
    this._sessionHits += 1;
    const now = Date.now();

    let soundResource = null;
    let label = '';

    switch (this._mode) {
      case 'pain': {
        const idx = Math.floor(Math.random() * SOUNDS.pain.length);
        soundResource = SOUNDS.pain[idx];
        const labels = [
          'Ow','Ouch','Owwie','Hey that hurts','Ow stop it',
          'What was that for','Ow ow ow','Hey','Yowch','That stings',
        ];
        label = labels[idx];
        break;
      }
      case 'sexy': {
        const { score } = this._sexyTracker.record(now);
        const idx = this._sexyTracker.getIndex(score);
        soundResource = SOUNDS.sexy[idx];
        label = `Sexy level ${idx + 1}/60`;
        break;
      }
      case 'halo': {
        const idx = Math.floor(Math.random() * SOUNDS.halo.length);
        soundResource = SOUNDS.halo[idx];
        label = `Halo death #${idx}`;
        break;
      }
      case 'lizard': {
        const { score } = this._lizardTracker.record(now);
        const idx = this._lizardTracker.getIndex(score);
        soundResource = SOUNDS.lizard[idx];
        label = 'Lizard!';
        break;
      }
      case 'custom': {
        if (this._customFiles.length === 0) return '';
        if (this._customOrder === 'sequential') {
          soundResource = this._customFiles[this._customIndex];
          this._customIndex = (this._customIndex + 1) % this._customFiles.length;
        } else {
          const idx = Math.floor(Math.random() * this._customFiles.length);
          soundResource = this._customFiles[idx];
        }
        const parts = (soundResource?.uri || '').split('/');
        label = parts[parts.length - 1] || 'Custom sound';
        break;
      }
      default:
        return '';
    }

    this._lastPlayedLabel = label;
    this._playSound(soundResource, this._mode === 'custom');
    return label;
  }

  _playSound(resource, isPath = false) {
    // Stop current sound if playing
    if (this._currentSound) {
      this._currentSound.stop();
      this._currentSound.release();
      this._currentSound = null;
    }

    if (!resource) return;

    let sound;
    if (isPath) {
      // User custom file — absolute path
      sound = new Sound(resource.uri, '', (err) => {
        if (err) { console.warn('Sound load error:', err); return; }
        sound.play((success) => {
          if (!success) console.warn('Sound playback failed');
          sound.release();
        });
      });
    } else {
      // Bundled asset
      sound = new Sound(resource, (err) => {
        if (err) { console.warn('Sound load error:', err); return; }
        sound.play((success) => {
          if (!success) console.warn('Sound playback failed');
          sound.release();
        });
      });
    }

    this._currentSound = sound;
  }

  stop() {
    if (this._currentSound) {
      this._currentSound.stop();
      this._currentSound.release();
      this._currentSound = null;
    }
  }
}

export const AudioManager = new AudioManagerClass();
