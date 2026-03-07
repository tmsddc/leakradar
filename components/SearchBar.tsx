import React, { useState, useCallback } from 'react';
import { StyleSheet, TextInput, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

  const handleClear = () => {
    setValue('');
    setSearchQuery('');
  };

  return (
    <View style={styles.container}>
      <View style={[styles.inputWrapper, isScanning && styles.scanning]}>
        <Ionicons name="search-outline" size={16} color={COLORS.textMuted} />
        <TextInput
          style={styles.input}
          placeholder="Search leaks & rumours..."
          placeholderTextColor={COLORS.textMuted}
          value={value}
          onChangeText={handleChange}
          returnKeyType="search"
          autoCorrect={false}
        />
        {value.length > 0 ? (
          <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        ) : isScanning ? (
          <Ionicons name="radio-outline" size={16} color={COLORS.accent} />
        ) : null}
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
    paddingHorizontal: 14,
    height: 44,
    gap: 10,
  },
  scanning: { borderColor: COLORS.accentBorder },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: FONT.regular,
  },
});
