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
    timeoutRef.current = setTimeout(() => {
      setSearchQuery(text);
    }, 300);
  }, [setSearchQuery]);

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <View style={styles.iconContainer}>
          <View style={styles.searchIcon} />
          {isScanning && <View style={styles.pulseDot} />}
        </View>
        <TextInput
          style={styles.input}
          placeholder="Search leaks & rumours..."
          placeholderTextColor={COLORS.textMuted}
          value={value}
          onChangeText={handleChange}
          returnKeyType="search"
          autoCorrect={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glass,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 16,
    height: 44,
  },
  iconContainer: {
    marginRight: 10,
    position: 'relative',
  },
  searchIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
  },
  pulseDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accentGreen,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: FONT.medium,
  },
});
