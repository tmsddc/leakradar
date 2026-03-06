import React, { useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT, RADIUS, SPACING, SHADOW } from '../../constants/theme';
import { GradientBackground } from '../../components/GradientBackground';
import { GlassPanel } from '../../components/GlassPanel';
import { useLeakStore } from '../../store/useLeakStore';
import { SUBREDDITS, RSS_FEEDS, REFRESH_INTERVALS } from '../../constants/sources';
import { clearSavedPosts } from '../../lib/storage';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const settings = useLeakStore(s => s.settings);
  const updateSettingsAction = useLeakStore(s => s.updateSettings);
  const loadSettings = useLeakStore(s => s.loadSettings);
  const loadSavedPosts = useLeakStore(s => s.loadSavedPosts);

  useEffect(() => {
    loadSettings();
  }, []);

  const handleClearSaved = () => {
    Alert.alert(
      'Clear Saved Posts',
      'Are you sure you want to remove all saved posts?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearSavedPosts();
            await loadSavedPosts();
          },
        },
      ]
    );
  };

  const toggleSubreddit = (name: string) => {
    const current = settings.enabledSubreddits;
    const updated = current.includes(name)
      ? current.filter(s => s !== name)
      : [...current, name];
    updateSettingsAction({ enabledSubreddits: updated });
  };

  const toggleRSSFeed = (name: string) => {
    const current = settings.enabledRSSFeeds;
    const updated = current.includes(name)
      ? current.filter(s => s !== name)
      : [...current, name];
    updateSettingsAction({ enabledRSSFeeds: updated });
  };

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 8, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Settings</Text>

        {/* Dark Mode */}
        <GlassPanel style={styles.section}>
          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>Dark Mode</Text>
              <Text style={styles.rowSubtitle}>Use dark color scheme</Text>
            </View>
            <Switch
              value={settings.darkMode}
              onValueChange={(v) => updateSettingsAction({ darkMode: v })}
              trackColor={{ false: '#333', true: COLORS.accentGreen }}
              thumbColor={COLORS.white}
            />
          </View>
        </GlassPanel>

        {/* Refresh Interval */}
        <Text style={styles.sectionTitle}>Refresh Interval</Text>
        <GlassPanel style={styles.section}>
          {REFRESH_INTERVALS.map(interval => (
            <TouchableOpacity
              key={interval.value}
              style={[
                styles.optionRow,
                settings.refreshInterval === interval.value && styles.optionRowActive,
              ]}
              onPress={() => updateSettingsAction({ refreshInterval: interval.value })}
            >
              <Text style={[
                styles.optionText,
                settings.refreshInterval === interval.value && styles.optionTextActive,
              ]}>
                {interval.label}
              </Text>
              {settings.refreshInterval === interval.value && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </GlassPanel>

        {/* Subreddits */}
        <Text style={styles.sectionTitle}>Subreddits</Text>
        <GlassPanel style={styles.section}>
          {SUBREDDITS.map(sub => (
            <View key={sub.subreddit} style={styles.row}>
              <Text style={styles.rowTitle}>{sub.emoji} r/{sub.subreddit}</Text>
              <Switch
                value={settings.enabledSubreddits.includes(sub.subreddit)}
                onValueChange={() => toggleSubreddit(sub.subreddit)}
                trackColor={{ false: '#333', true: COLORS.accentGreen }}
                thumbColor={COLORS.white}
              />
            </View>
          ))}
        </GlassPanel>

        {/* RSS Feeds */}
        <Text style={styles.sectionTitle}>RSS Feeds</Text>
        <GlassPanel style={styles.section}>
          {RSS_FEEDS.map(feed => (
            <View key={feed.name} style={styles.row}>
              <Text style={styles.rowTitle}>{feed.emoji} {feed.name}</Text>
              <Switch
                value={settings.enabledRSSFeeds.includes(feed.name)}
                onValueChange={() => toggleRSSFeed(feed.name)}
                trackColor={{ false: '#333', true: COLORS.accentGreen }}
                thumbColor={COLORS.white}
              />
            </View>
          ))}
        </GlassPanel>

        {/* Clear Saved */}
        <TouchableOpacity onPress={handleClearSaved}>
          <GlassPanel style={styles.section}>
            <Text style={styles.dangerText}>Clear All Saved Posts</Text>
          </GlassPanel>
        </TouchableOpacity>

        {/* App Info */}
        <GlassPanel style={styles.section}>
          <Text style={styles.infoText}>LeakRadar v1.0.0</Text>
          <Text style={styles.infoSubtext}>
            Gaming leaks & rumours aggregator.{'\n'}
            All data is from public sources. No personal data is collected.
          </Text>
        </GlassPanel>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: FONT.black,
    color: COLORS.textPrimary,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: FONT.bold,
    color: COLORS.textSecondary,
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  rowTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: FONT.medium,
  },
  rowSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: FONT.regular,
    marginTop: 2,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: RADIUS.sm,
  },
  optionRowActive: {
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
  },
  optionText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: FONT.medium,
  },
  optionTextActive: {
    color: COLORS.accentGreen,
  },
  checkmark: {
    color: COLORS.accentGreen,
    fontSize: 16,
    fontWeight: FONT.bold,
  },
  dangerText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: FONT.semibold,
    textAlign: 'center',
    paddingVertical: 4,
  },
  infoText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: FONT.semibold,
    textAlign: 'center',
  },
  infoSubtext: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: FONT.regular,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
