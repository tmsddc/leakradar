import React, { useState, useCallback } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { COLORS, RADIUS, FONT } from '../constants/theme';
import { useLeakStore } from '../store/useLeakStore';

export function SearchBar() {
  const setSearchQuery = useLeakStore(s => s.setSearchQuery);
  const isScanning = useLeakStore(s => s.isScanning);
  const [value, setValue] = useState('');
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>(null);

  const handleChange = useCallback((text: string) => {
    setValue(text);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setSearchQuery(text), 300);
  }, [setSearchQuery]);

  return (
    <View style={styles.container}>
      <View style={[styles.inputWrapper, isScanning && styles.scanning]}>
        <View style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Search leaks & rumours..."
          placeholderTextColor={COLORS.textMuted}
          value={value}
          onChangeText={handleChange}
          returnKeyType="search"
          autoCorrect={false}
        />
        {isScanning ? <View style={styles.scanDot} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 14, paddingVertical: 8 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: 16,
    height: 44,
    gap: 10,
  },
  scanning: { borderColor: COLORS.accentBorder },
  icon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: FONT.regular,
  },
  scanDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
  },
});
