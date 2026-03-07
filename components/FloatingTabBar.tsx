import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS, SHADOW } from '../constants/theme';
import { useLeakStore } from '../store/useLeakStore';

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

type TabName = 'index' | 'trending' | 'saved' | 'settings';

const TAB_CONFIG: Record<TabName, {
  focused: keyof typeof Ionicons.glyphMap;
  unfocused: keyof typeof Ionicons.glyphMap;
  label: string;
}> = {
  index:    { focused: 'radio',        unfocused: 'radio-outline',        label: 'Feed'     },
  trending: { focused: 'trending-up',  unfocused: 'trending-up-outline',  label: 'Trending' },
  saved:    { focused: 'bookmark',     unfocused: 'bookmark-outline',     label: 'Saved'    },
  settings: { focused: 'settings',     unfocused: 'settings-outline',     label: 'Settings' },
};

function TabItem({
  route,
  isFocused,
  onPress,
  showBadge,
  badgeCount,
}: {
  route: any;
  isFocused: boolean;
  onPress: () => void;
  showBadge?: boolean;
  badgeCount?: number;
}) {
  const config = TAB_CONFIG[route.name as TabName] ?? {
    focused: 'ellipse', unfocused: 'ellipse-outline', label: route.name,
  };
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isFocused) {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 0.88, duration: 80, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 10, stiffness: 200 }),
      ]).start();
    }
  }, [isFocused]);

  return (
    <TouchableOpacity
      style={styles.tab}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Animated.View
        style={[
          styles.tabInner,
          isFocused && styles.tabInnerActive,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={styles.iconWrap}>
          <Ionicons
            name={isFocused ? config.focused : config.unfocused}
            size={20}
            color={isFocused ? COLORS.accent : COLORS.textMuted}
          />
          {showBadge && badgeCount != null && badgeCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {badgeCount > 99 ? '99+' : String(badgeCount)}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.label, isFocused && styles.labelActive]}>
          {config.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export function FloatingTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const unreadCount = useLeakStore(s => s.unreadCount);

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.container}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const showBadge = route.name === 'index';

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
            <TabItem
              key={route.key}
              route={route}
              isFocused={isFocused}
              onPress={onPress}
              showBadge={showBadge}
              badgeCount={unreadCount}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: 'rgba(0,0,0,0.92)',
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    ...SHADOW.nav,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  tabInner: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    gap: 3,
  },
  tabInnerActive: {
    backgroundColor: COLORS.accentDim,
  },
  iconWrap: {
    position: 'relative',
    alignItems: 'center',
    width: 24,
    height: 24,
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: COLORS.neonRed,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: FONT.heavy,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: FONT.medium,
  },
  labelActive: {
    color: COLORS.accent,
    fontWeight: FONT.bold,
  },
});
