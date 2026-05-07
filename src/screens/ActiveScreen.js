// src/screens/ActiveScreen.js

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, AppState, Animated,
} from 'react-native';
import { useAccelerometer } from '../hooks/useAccelerometer';
import { AudioManager } from '../services/AudioManager';
import { BackgroundService } from '../services/BackgroundService';
import { MODE_META } from '../utils/sounds';

const MAX_LOG_ENTRIES = 20;

export default function ActiveScreen({ navigation, route }) {
  const mode = route.params?.mode || 'pain';
  const sensitivity = route.params?.sensitivity ?? 0.7;
  const cooldown = route.params?.cooldown ?? 750;

  const [isRunning, setIsRunning] = useState(true);
  const [hitLog, setHitLog] = useState([]);
  const [stats, setStats] = useState({ totalHits: 0, sessionHits: 0 });
  const [appState, setAppState] = useState(AppState.currentState);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef(null);

  // Pulse animation for the "listening" indicator
  useEffect(() => {
    if (!isRunning) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isRunning, pulseAnim]);

  // Track app foreground/background state
  useEffect(() => {
    const sub = AppState.addEventListener('change', setAppState);
    return () => sub.remove();
  }, []);

  // Only run foreground hook when app is active
  // Background detection is handled by BackgroundService
  const isForeground = appState === 'active';

  const onHit = useCallback(async () => {
    const label = await AudioManager.play();
    const entry = { label, time: new Date().toLocaleTimeString() };
    setHitLog((prev) => [entry, ...prev].slice(0, MAX_LOG_ENTRIES));
    setStats(AudioManager.getStats());
    // Auto scroll log to top
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  useAccelerometer({
    sensitivity,
    cooldown,
    onHit,
    active: isRunning && isForeground,
  });

  const handleStop = async () => {
    setIsRunning(false);
    await BackgroundService.stop();
    navigation.navigate('Home');
  };

  const meta = MODE_META[mode] || MODE_META.pain;

  return (
    <View style={styles.container}>
      {/* Status header */}
      <View style={styles.statusHeader}>
        <Animated.View style={[styles.pulseDot, { transform: [{ scale: pulseAnim }] }]} />
        <Text style={styles.statusText}>
          {isRunning ? 'Listening for taps...' : 'Stopped'}
        </Text>
      </View>

      {/* Mode badge */}
      <View style={[styles.modeBadge, { borderColor: meta.color + '44' }]}>
        <View style={[styles.modeDot, { backgroundColor: meta.color }]} />
        <Text style={[styles.modeLabel, { color: meta.color }]}>{meta.label}</Text>
        <Text style={styles.bgLabel}>· running in background</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{stats.sessionHits}</Text>
          <Text style={styles.statLabel}>this session</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{stats.totalHits}</Text>
          <Text style={styles.statLabel}>total hits</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{cooldown}</Text>
          <Text style={styles.statLabel}>cooldown ms</Text>
        </View>
      </View>

      {/* Hit log */}
      <Text style={styles.sectionLabel}>RECENT HITS</Text>
      <ScrollView ref={scrollRef} style={styles.logScroll} contentContainerStyle={styles.logContent}>
        {hitLog.length === 0 && (
          <Text style={styles.emptyLog}>Tap or shake your phone to trigger a sound...</Text>
        )}
        {hitLog.map((entry, i) => (
          <View key={i} style={styles.logRow}>
            <Text style={styles.logTime}>{entry.time}</Text>
            <View style={[styles.logBadge, { backgroundColor: meta.color + '22' }]}>
              <Text style={[styles.logLabel, { color: meta.color }]}>{entry.label}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Stop button */}
      <TouchableOpacity style={styles.stopBtn} onPress={handleStop} activeOpacity={0.85}>
        <Text style={styles.stopBtnText}>■  Stop</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F', padding: 20 },

  statusHeader: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 16, marginBottom: 16, gap: 10,
  },
  pulseDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#1D9E75',
  },
  statusText: { fontSize: 15, color: '#1D9E75', fontWeight: '600' },

  modeBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1A1A1A', borderRadius: 10,
    padding: 12, borderWidth: 1, marginBottom: 20, gap: 8,
  },
  modeDot: { width: 8, height: 8, borderRadius: 4 },
  modeLabel: { fontSize: 13, fontWeight: '700' },
  bgLabel: { fontSize: 11, color: '#444' },

  statsRow: {
    flexDirection: 'row', gap: 10, marginBottom: 24,
  },
  statCard: {
    flex: 1, backgroundColor: '#1A1A1A', borderRadius: 10,
    padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#2A2A2A',
  },
  statNum: { fontSize: 24, fontWeight: '800', color: '#FFF' },
  statLabel: { fontSize: 10, color: '#555', marginTop: 2 },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: '#555',
    letterSpacing: 2, marginBottom: 10,
  },

  logScroll: { flex: 1, marginBottom: 16 },
  logContent: { gap: 8 },
  emptyLog: { color: '#333', fontSize: 13, textAlign: 'center', marginTop: 20 },
  logRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A1A', borderRadius: 8,
    padding: 10, borderWidth: 1, borderColor: '#2A2A2A',
  },
  logTime: { fontSize: 11, color: '#444' },
  logBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  logLabel: { fontSize: 12, fontWeight: '600' },

  stopBtn: {
    backgroundColor: '#E24B4A', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  stopBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700', letterSpacing: 1 },
});
