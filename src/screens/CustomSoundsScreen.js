// src/screens/CustomSoundsScreen.js

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, Alert, Platform,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CUSTOM_FILES_KEY = 'spank_custom_files';
const CUSTOM_DIR = `${RNFS.DocumentDirectoryPath}/spank_sounds`;

export default function CustomSoundsScreen({ navigation, route }) {
  const [files, setFiles] = useState([]);
  const [order, setOrder] = useState('random');

  useEffect(() => {
    loadFiles();
    AsyncStorage.getItem('spank_custom_order').then((v) => {
      if (v) setOrder(v);
    });
  }, []);

  const loadFiles = async () => {
    try {
      await RNFS.mkdir(CUSTOM_DIR);
      const raw = await AsyncStorage.getItem(CUSTOM_FILES_KEY);
      if (raw) setFiles(JSON.parse(raw));
    } catch (err) {
      console.warn('Load files error:', err);
    }
  };

  const saveFiles = async (newFiles) => {
    setFiles(newFiles);
    await AsyncStorage.setItem(CUSTOM_FILES_KEY, JSON.stringify(newFiles));
    // Notify parent if callback provided
    route.params?.setCustomFiles?.(newFiles);
  };

  const handleAdd = async () => {
    try {
      const results = await DocumentPicker.pick({
        type: [DocumentPicker.types.audio],
        allowMultiSelection: true,
      });

      const newFiles = [...files];
      for (const result of results) {
        if (!result.uri.toLowerCase().endsWith('.mp3') &&
            !result.type?.includes('audio')) {
          Alert.alert('Invalid file', `${result.name} is not a supported audio file.`);
          continue;
        }

        const destPath = `${CUSTOM_DIR}/${result.name}`;
        // Copy to app documents dir so it persists
        await RNFS.copyFile(
          Platform.OS === 'ios' ? decodeURIComponent(result.uri.replace('file://', '')) : result.uri,
          destPath
        );

        // Avoid duplicates
        if (!newFiles.find((f) => f.name === result.name)) {
          newFiles.push({
            name: result.name,
            uri: `file://${destPath}`,
            size: result.size,
          });
        }
      }
      await saveFiles(newFiles);
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        Alert.alert('Error', err.message);
      }
    }
  };

  const handleDelete = (name) => {
    Alert.alert('Delete sound', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const updated = files.filter((f) => f.name !== name);
          await saveFiles(updated);
          // Also remove from filesystem
          RNFS.unlink(`${CUSTOM_DIR}/${name}`).catch(() => {});
        },
      },
    ]);
  };

  const toggleOrder = () => {
    const next = order === 'random' ? 'sequential' : 'random';
    setOrder(next);
    AsyncStorage.setItem('spank_custom_order', next);
  };

  const formatSize = (bytes) => {
    if (!bytes) return '?';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Custom Sounds</Text>
      <Text style={styles.subtitle}>
        Add your own MP3 files. They'll play randomly (or in order) when a tap is detected.
      </Text>

      {/* Order toggle */}
      <Text style={styles.sectionLabel}>PLAYBACK ORDER</Text>
      <View style={styles.orderRow}>
        {['random', 'sequential'].map((o) => (
          <TouchableOpacity
            key={o}
            style={[styles.orderBtn, order === o && styles.orderBtnActive]}
            onPress={() => { setOrder(o); AsyncStorage.setItem('spank_custom_order', o); }}
          >
            <Text style={[styles.orderBtnText, order === o && styles.orderBtnTextActive]}>
              {o.charAt(0).toUpperCase() + o.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* File list */}
      <Text style={styles.sectionLabel}>YOUR SOUNDS ({files.length})</Text>
      <FlatList
        data={files}
        keyExtractor={(item) => item.name}
        style={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎵</Text>
            <Text style={styles.emptyText}>No custom sounds yet</Text>
            <Text style={styles.emptyHint}>Tap the button below to add MP3 files</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.fileRow}>
            <View style={styles.fileIcon}>
              <Text style={styles.fileIconText}>♪</Text>
            </View>
            <View style={styles.fileMeta}>
              <Text style={styles.fileName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.fileSize}>{formatSize(item.size)}</Text>
            </View>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(item.name)}
            >
              <Text style={styles.deleteBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Add button */}
      <TouchableOpacity style={styles.addBtn} onPress={handleAdd} activeOpacity={0.85}>
        <Text style={styles.addBtnText}>↑  Add from Files</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F', padding: 20 },

  title: {
    fontSize: 28, fontWeight: '800', color: '#FFF',
    marginTop: 12, marginBottom: 4,
  },
  subtitle: { fontSize: 12, color: '#555', marginBottom: 24, lineHeight: 18 },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: '#555',
    letterSpacing: 2, marginBottom: 10,
  },

  orderRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  orderBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#1A1A1A', alignItems: 'center',
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  orderBtnActive: { backgroundColor: '#0D1F1A', borderColor: '#1D9E75' },
  orderBtnText: { fontSize: 13, color: '#555', fontWeight: '600' },
  orderBtnTextActive: { color: '#1D9E75' },

  list: { flex: 1, marginBottom: 16 },

  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 36, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#444', fontWeight: '600' },
  emptyHint: { fontSize: 12, color: '#333', marginTop: 4 },

  fileRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1A1A1A', borderRadius: 10,
    padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  fileIcon: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: '#7F77DD22', alignItems: 'center',
    justifyContent: 'center', marginRight: 10,
  },
  fileIconText: { fontSize: 16, color: '#7F77DD' },
  fileMeta: { flex: 1 },
  fileName: { fontSize: 13, color: '#DDD', fontWeight: '500' },
  fileSize: { fontSize: 11, color: '#555', marginTop: 2 },
  deleteBtn: {
    width: 28, height: 28, borderRadius: 6,
    backgroundColor: '#2A1A1A', alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: { color: '#E24B4A', fontSize: 12, fontWeight: '700' },

  addBtn: {
    backgroundColor: '#7F77DD', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  addBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700', letterSpacing: 1 },
});
