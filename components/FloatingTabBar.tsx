import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, RADIUS, SHADOW, FONT } from '../constants/theme';
import { useLeakStore } from '../store/useLeakStore';

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  index: { active: '📡', inactive: '📡' },
  trending: { active: '📈', inactive: '📈' },
  saved: { active: '⭐', inactive: '☆' },
  settings: { active: '⚙️', inactive: '⚙️' },
};

const TAB_LABELS: Record<string, string> = {
  index: 'Feed',
  trending: 'Trending',
  saved: 'Saved',
  settings: 'Settings',
};

export function FloatingTabBar({ state, descriptors, navigation }: TabBarProps) {
  const unreadCount = useLeakStore(s => s.unreadCount);

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <View style={styles.highlight} />
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const icons = TAB_ICONS[route.name] || { active: '📄', inactive: '📄' };
          const label = TAB_LABELS[route.name] || route.name;
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
              <View style={styles.iconWrapper}>
                <Text style={styles.tabIcon}>
                  {isFocused ? icons.active : icons.inactive}
                </Text>
                {showBadge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {unreadCount > 99 ? '99+' : String(unreadCount)}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
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
    bottom: 24,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(14, 14, 26, 0.92)',
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingVertical: 6,
    paddingHorizontal: 6,
    overflow: 'hidden',
    ...SHADOW.nav,
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: COLORS.glassHighlight,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: RADIUS.pill,
    gap: 2,
  },
  tabActive: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
  },
  iconWrapper: {
    position: 'relative',
  },
  tabIcon: {
    fontSize: 18,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#ef4444',
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
  tabLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: FONT.semibold,
  },
  tabLabelActive: {
    color: COLORS.accentGreen,
  },
});
