import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, RADIUS, SHADOW, FONT } from '../constants/theme';
import { useLeakStore } from '../store/useLeakStore';

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

// Plain Unicode symbols – no emoji
const TAB_SYMBOLS: Record<string, string> = {
  index:    '◉',
  trending: '↑',
  saved:    '◆',
  settings: '◎',
};

const TAB_LABELS: Record<string, string> = {
  index:    'Feed',
  trending: 'Trending',
  saved:    'Saved',
  settings: 'Settings',
};

export function FloatingTabBar({ state, navigation }: TabBarProps) {
  const unreadCount = useLeakStore(s => s.unreadCount);

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const symbol = TAB_SYMBOLS[route.name] ?? '·';
          const label  = TAB_LABELS[route.name]  ?? route.name;
          const showBadge = route.name === 'index' && unreadCount > 0;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={[styles.tab, isFocused && styles.tabActive]}
              activeOpacity={0.7}
            >
              <View style={styles.iconRow}>
                <Text style={[styles.symbol, isFocused && styles.symbolActive]}>
                  {symbol}
                </Text>
                {showBadge ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {unreadCount > 99 ? '99+' : String(unreadCount)}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.label, isFocused && styles.labelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 20,
    left: 14,
    right: 14,
  },
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingVertical: 6,
    paddingHorizontal: 4,
    ...SHADOW.nav,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    gap: 2,
  },
  tabActive: {
    backgroundColor: COLORS.accentDim,
  },
  iconRow: {
    position: 'relative',
    alignItems: 'center',
  },
  symbol: {
    fontSize: 16,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  symbolActive: {
    color: COLORS.accent,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: COLORS.red,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: FONT.heavy,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: FONT.semibold,
  },
  labelActive: {
    color: COLORS.accent,
  },
});
