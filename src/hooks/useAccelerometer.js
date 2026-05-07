// src/hooks/useAccelerometer.js
//
// Accelerometer tap detection, ported from:
//   github.com/taigrr/apple-silicon-accelerometer/detector
//
// Algorithm:
//   1. Maintain a rolling window of recent magnitudes (baseline)
//   2. Compute magnitude deviation from baseline
//   3. Trigger onHit when deviation > amplitudeThreshold AND cooldown elapsed
//
// Sensitivity slider 0..1 maps to amplitudeThreshold 0.50g..0.05g
// (same range as --min-amplitude in spank)

import { useEffect, useRef, useCallback } from 'react';
import { accelerometer, setUpdateIntervalForType, SensorTypes } from 'react-native-sensors';

const SAMPLE_WINDOW = 20;
const POLL_INTERVAL_MS = 16; // ~60 Hz

export function useAccelerometer({ sensitivity, cooldown, onHit, active }) {
  const subscription = useRef(null);
  const lastHitTime = useRef(0);
  const sampleBuffer = useRef([]);

  // Map sensitivity 0→1 to threshold 0.50g→0.05g (high sensitivity = low threshold)
  const amplitudeThreshold = 0.50 - sensitivity * 0.45;

  const handleSensor = useCallback(
    ({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);

      sampleBuffer.current.push(magnitude);
      if (sampleBuffer.current.length > SAMPLE_WINDOW) {
        sampleBuffer.current.shift();
      }
      if (sampleBuffer.current.length < 3) return;

      const mean =
        sampleBuffer.current.reduce((a, b) => a + b, 0) /
        sampleBuffer.current.length;

      const deviation = Math.abs(magnitude - mean);
      const now = Date.now();

      if (deviation > amplitudeThreshold && now - lastHitTime.current > cooldown) {
        lastHitTime.current = now;
        onHit && onHit({ magnitude, deviation, timestamp: now });
      }
    },
    [amplitudeThreshold, cooldown, onHit]
  );

  useEffect(() => {
    if (!active) {
      subscription.current?.unsubscribe();
      subscription.current = null;
      sampleBuffer.current = [];
      return;
    }

    setUpdateIntervalForType(SensorTypes.accelerometer, POLL_INTERVAL_MS);
    subscription.current = accelerometer.subscribe({
      next: handleSensor,
      error: (err) => console.warn('Accelerometer error:', err),
    });

    return () => {
      subscription.current?.unsubscribe();
      subscription.current = null;
    };
  }, [active, handleSensor]);
}
