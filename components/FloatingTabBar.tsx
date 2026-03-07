import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOW, FONT } from '../constants/theme';
import { useLeakStore } from '../store/useLeakStore';

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

type TabName = 'index' | 'trending' | 'saved' | 'settings';

const TAB_ICONS: Record<TabName, { focused: keyof typeof Ionicons.glyphMap; unfocused: keyof typeof Ionicons.glyphMap }> = {
  index:    { focused: 'radio',        unfocused: 'radio-outline'        },
  trending: { focused: 'trending-up',  unfocused: 'trending-up-outline'  },
  saved:    { focused: 'bookmark',     unfocused: 'bookmark-outline'     },
  settings: { focused: 'settings',     unfocused: 'settings-outline'     },
};

const TAB_LABELS: Record<TabName, string> = {
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
          const name = route.name as TabName;
          const icons = TAB_ICONS[name] ?? { focused: 'ellipse', unfocused: 'ellipse-outline' };
          const label = TAB_LABELS[name] ?? route.name;
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
                <Ionicons
                  name={isFocused ? icons.focused : icons.unfocused}
                  size={20}
                  color={isFocused ? COLORS.accent : COLORS.textMuted}
                />
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
    gap: 3,
  },
  tabActive: {
    backgroundColor: COLORS.accentDim,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
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
