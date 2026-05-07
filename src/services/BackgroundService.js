// src/services/BackgroundService.js
//
// Keeps the accelerometer + audio running when the app is backgrounded
// or the screen is locked.
//
// iOS:  Uses react-native-background-actions with a silent audio loop
//       (required by iOS to keep a background task alive).
// Android: Uses react-native-background-actions which wraps a Foreground
//          Service with a persistent notification.

import BackgroundActions from 'react-native-background-actions';
import { accelerometer, setUpdateIntervalForType, SensorTypes } from 'react-native-sensors';
import { AudioManager } from './AudioManager';

const POLL_INTERVAL_MS = 16;
const SAMPLE_WINDOW = 20;

// Background task function — runs inside the background worker.
// Receives options forwarded from start().
const backgroundTask = async (taskData) => {
  const { sensitivity, cooldown } = taskData;
  const amplitudeThreshold = 0.50 - sensitivity * 0.45;
  const sampleBuffer = [];
  let lastHitTime = 0;

  setUpdateIntervalForType(SensorTypes.accelerometer, POLL_INTERVAL_MS);

  await new Promise((resolve) => {
    const subscription = accelerometer.subscribe({
      next: ({ x, y, z }) => {
        // Check if background service should still run
        if (!BackgroundActions.isRunning()) {
          subscription.unsubscribe();
          resolve();
          return;
        }

        const magnitude = Math.sqrt(x * x + y * y + z * z);
        sampleBuffer.push(magnitude);
        if (sampleBuffer.length > SAMPLE_WINDOW) sampleBuffer.shift();
        if (sampleBuffer.length < 3) return;

        const mean = sampleBuffer.reduce((a, b) => a + b, 0) / sampleBuffer.length;
        const deviation = Math.abs(magnitude - mean);
        const now = Date.now();

        if (deviation > amplitudeThreshold && now - lastHitTime > cooldown) {
          lastHitTime = now;
          AudioManager.play();
        }
      },
      error: (err) => {
        console.warn('Background accelerometer error:', err);
        resolve();
      },
    });
  });
};

const BACKGROUND_OPTIONS = {
  taskName: 'SpankListener',
  taskTitle: 'Spank is listening',
  taskDesc: 'Tap your phone to trigger sounds',
  taskIcon: {
    name: 'ic_launcher',
    type: 'mipmap',
  },
  color: '#1D9E75',
  // iOS: link a silent audio file to keep the task alive.
  // Add a 'silence.mp3' (1s silent MP3) to src/assets/
  linkingURI: 'spankapp://background',
  parameters: {}, // filled in on start()
};

export const BackgroundService = {
  async start({ sensitivity, cooldown, mode, customFiles, customOrder }) {
    AudioManager.setMode(mode);
    AudioManager.setCooldown(cooldown);
    if (customFiles) AudioManager.setCustomFiles(customFiles);
    if (customOrder) AudioManager.setCustomOrder(customOrder);
    AudioManager.resetSession();

    const options = {
      ...BACKGROUND_OPTIONS,
      parameters: { sensitivity, cooldown },
    };

    await BackgroundActions.start(backgroundTask, options);
  },

  async stop() {
    await BackgroundActions.stop();
    AudioManager.stop();
  },

  isRunning() {
    return BackgroundActions.isRunning();
  },
};
