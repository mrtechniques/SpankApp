// src/screens/HomeScreen.js

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Switch, Platform, Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BackgroundService } from '../services/BackgroundService';
import { AudioManager } from '../services/AudioManager';
import { MODE_META } from '../utils/sounds';

const MODES = ['pain', 'sexy', 'halo', 'lizard', 'custom'];
const STORAGE_KEY = 'spank_settings';

// Default values — match spank repo defaults
const DEFAULTS = {
  mode: 'pain',
  sensitivity: 0.7,   // maps to ~0.18g threshold
  cooldown: 750,       // ms — same as defaultCooldownMs in main.go
  customOrder: 'random',
};

export default function HomeScreen({ navigation }) {
  const [mode, setMode] = useState(DEFAULTS.mode);
  const [sensitivity, setSensitivity] = useState(DEFAULTS.sensitivity);
  const [cooldown, setCooldown] = useState(DEFAULTS.cooldown);
  const [customOrder, setCustomOrder] = useState(DEFAULTS.customOrder);
  const [isRunning, setIsRunning] = useState(false);
  const [customFiles, setCustomFiles] = useState([]);

  // Load saved settings on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try {
        const saved = JSON.parse(raw);
        if (saved.mode) setMode(saved.mode);
        if (saved.sensitivity != null) setSensitivity(saved.sensitivity);
        if (saved.cooldown != null) setCooldown(saved.cooldown);
        if (saved.customOrder) setCustomOrder(saved.customOrder);
      } catch {}
    });
    setIsRunning(BackgroundService.isRunning());
  }, []);

  // Persist settings whenever they change
  useEffect(() => {
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ mode, sensitivity, cooldown, customOrder })
    );
  }, [mode, sensitivity, cooldown, customOrder]);

  const handleStart = async () => {
    if (mode === 'custom' && customFiles.length === 0) {
      Alert.alert(
        'No custom sounds',
        'Please add at least one MP3 file before using Custom mode.',
        [{ text: 'Add sounds', onPress: () => navigation.navigate('CustomSounds') }]
      );
      return;
    }
    try {
      await BackgroundService.start({ sensitivity, cooldown, mode, customFiles, customOrder });
      setIsRunning(true);
      navigation.navigate('Active', { mode, sensitivity, cooldown });
    } catch (err) {
      Alert.alert('Error', `Failed to start: ${err.message}`);
    }
  };

  const cooldownLabel = (ms) => {
    if (ms <= 300) return 'Very fast';
    if (ms <= 600) return 'Fast';
    if (ms <= 900) return 'Default';
    if (ms <= 1400) return 'Relaxed';
    return 'Slow';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.appTitle}>SPANK</Text>
      <Text style={styles.appSubtitle}>Tap your phone. It yells back.</Text>

      {/* Mode selector */}
      <Text style={styles.sectionLabel}>SOUND MODE</Text>
      {MODES.map((m) => {
        const meta = MODE_META[m];
        const selected = mode === m;
        return (
          <TouchableOpacity
            key={m}
            style={[styles.modeRow, selected && styles.modeRowSelected]}
            onPress={() => setMode(m)}
            activeOpacity={0.7}
          >
            <View style={[styles.modeDot, { backgroundColor: meta.color }]} />
            <View style={styles.modeTextWrap}>
              <Text style={[styles.modeLabel, selected && styles.modeLabelSelected]}>
                {meta.label}
              </Text>
              <Text style={styles.modeDesc}>{meta.description}</Text>
            </View>
            {selected && (
              <View style={[styles.selectedBadge, { backgroundColor: meta.color + '22' }]}>
                <Text style={[styles.selectedBadgeText, { color: meta.color }]}>✓</Text>
              </View>
            )}
            {m === 'custom' && (
              <TouchableOpacity
                style={styles.manageBtn}
                onPress={() => navigation.navigate('CustomSounds', { setCustomFiles })}
              >
                <Text style={styles.manageBtnText}>Manage</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        );
      })}

      {/* Sensitivity slider */}
      <Text style={styles.sectionLabel}>SENSITIVITY</Text>
      <View style={styles.sliderCard}>
        <View style={styles.sliderRow}>
          <Text style={styles.sliderEdgeLabel}>Low</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={sensitivity}
            onValueChange={setSensitivity}
            minimumTrackTintColor="#1D9E75"
            maximumTrackTintColor="#E0E0E0"
            thumbTintColor="#1D9E75"
            step={0.01}
          />
          <Text style={styles.sliderEdgeLabel}>High</Text>
        </View>
        <Text style={styles.sliderValue}>
          Threshold: {(0.50 - sensitivity * 0.45).toFixed(2)}g
        </Text>
      </View>

      {/* Cooldown slider */}
      <Text style={styles.sectionLabel}>COOLDOWN PERIOD</Text>
      <View style={[styles.sliderCard, styles.cooldownCard]}>
        <View style={styles.sliderRow}>
          <Text style={styles.sliderEdgeLabel}>200ms</Text>
          <Slider
            style={styles.slider}
            minimumValue={200}
            maximumValue={2000}
            value={cooldown}
            onValueChange={(v) => setCooldown(Math.round(v))}
            minimumTrackTintColor="#BA7517"
            maximumTrackTintColor="#E0E0E0"
            thumbTintColor="#BA7517"
            step={50}
          />
          <Text style={styles.sliderEdgeLabel}>2000ms</Text>
        </View>
        <View style={styles.cooldownMeta}>
          <Text style={styles.cooldownValueLabel}>{cooldownLabel(cooldown)}</Text>
          <Text style={styles.cooldownMs}>{cooldown} ms</Text>
        </View>
        <Text style={styles.cooldownHint}>
          Wait time between sounds after each tap
        </Text>
      </View>

      {/* Start button */}
      <TouchableOpacity
        style={[styles.startBtn, isRunning && styles.startBtnDisabled]}
        onPress={handleStart}
        disabled={isRunning}
        activeOpacity={0.85}
      >
        <Text style={styles.startBtnText}>
          {isRunning ? '▶ Already Running' : '▶  Start Listening'}
        </Text>
      </TouchableOpacity>

      {isRunning && (
        <TouchableOpacity
          style={styles.viewActiveBtn}
          onPress={() => navigation.navigate('Active')}
        >
          <Text style={styles.viewActiveBtnText}>View Active Session →</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F' },
  content: { padding: 20, paddingBottom: 40 },

  appTitle: {
    fontSize: 42, fontWeight: '900', color: '#FFFFFF',
    letterSpacing: 12, textAlign: 'center', marginTop: 20, marginBottom: 2,
  },
  appSubtitle: {
    fontSize: 13, color: '#666', textAlign: 'center',
    marginBottom: 32, letterSpacing: 1,
  },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: '#555',
    letterSpacing: 2, marginBottom: 10, marginTop: 8,
  },

  modeRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1A1A1A', borderRadius: 12,
    padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  modeRowSelected: {
    borderColor: '#1D9E75', backgroundColor: '#0D1F1A',
  },
  modeDot: {
    width: 10, height: 10, borderRadius: 5, marginRight: 12,
  },
  modeTextWrap: { flex: 1 },
  modeLabel: { fontSize: 14, fontWeight: '600', color: '#888' },
  modeLabelSelected: { color: '#FFFFFF' },
  modeDesc: { fontSize: 11, color: '#444', marginTop: 2 },
  selectedBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  selectedBadgeText: { fontSize: 13, fontWeight: '700' },
  manageBtn: {
    backgroundColor: '#2A2A2A', paddingHorizontal: 10,
    paddingVertical: 5, borderRadius: 7, marginLeft: 8,
  },
  manageBtnText: { fontSize: 11, color: '#888' },

  sliderCard: {
    backgroundColor: '#1A1A1A', borderRadius: 12,
    padding: 14, marginBottom: 20,
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  cooldownCard: { borderColor: '#3D2E0A' },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  slider: { flex: 1 },
  sliderEdgeLabel: { fontSize: 10, color: '#555', width: 36 },
  sliderValue: { fontSize: 11, color: '#1D9E75', marginTop: 6, textAlign: 'center' },

  cooldownMeta: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 8, alignItems: 'center',
  },
  cooldownValueLabel: { fontSize: 12, fontWeight: '600', color: '#BA7517' },
  cooldownMs: { fontSize: 16, fontWeight: '700', color: '#EF9F27' },
  cooldownHint: { fontSize: 10, color: '#664400', marginTop: 4 },

  startBtn: {
    backgroundColor: '#1D9E75', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  startBtnDisabled: { backgroundColor: '#0F4030' },
  startBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700', letterSpacing: 1 },

  viewActiveBtn: { alignItems: 'center', marginTop: 14 },
  viewActiveBtnText: { color: '#1D9E75', fontSize: 13 },
});
