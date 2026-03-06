import React, { useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Switch, Alert, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT, RADIUS, SPACING, SHADOW } from '../../constants/theme';
import { GradientBackground } from '../../components/GradientBackground';
import { GlassPanel } from '../../components/GlassPanel';
import { useLeakStore } from '../../store/useLeakStore';
import { SUBREDDITS, RSS_FEEDS, REFRESH_INTERVALS } from '../../constants/sources';
import { clearSavedPosts, cacheFeed } from '../../lib/storage';

const MIN_CRED_OPTIONS = [
  { label: 'All (no filter)', value: 0 },
  { label: '60%+ (Likely true)', value: 60 },
  { label: '80%+ (Highly reliable)', value: 80 },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const settings = useLeakStore(s => s.settings);
  const updateSettingsAction = useLeakStore(s => s.updateSettings);
  const loadSettings = useLeakStore(s => s.loadSettings);
  const loadSavedPosts = useLeakStore(s => s.loadSavedPosts);
  const minCredibility = useLeakStore(s => s.minCredibility);
  const setMinCredibility = useLeakStore(s => s.setMinCredibility);
  const posts = useLeakStore(s => s.posts);

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

  const handleClearCache = () => {
    Alert.alert(
      'Clear Feed Cache',
      'This will clear the offline cached feed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await cacheFeed([]);
            Alert.alert('Done', 'Feed cache cleared.');
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
        <Text style={styles.title}>⚙️ Settings</Text>

        {/* Feed Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{posts.length}</Text>
            <Text style={styles.statLbl}>Cached Leaks</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{settings.enabledSubreddits.length + settings.enabledRSSFeeds.length}</Text>
            <Text style={styles.statLbl}>Active Sources</Text>
          </View>
        </View>

        {/* Appearance */}
        <Text style={styles.sectionTitle}>Appearance</Text>
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
        <Text style={styles.sectionTitle}>Auto-Refresh Interval</Text>
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

        {/* Credibility Filter */}
        <Text style={styles.sectionTitle}>Min. Credibility Filter</Text>
        <GlassPanel style={styles.section}>
          {MIN_CRED_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.optionRow, minCredibility === opt.value && styles.optionRowActive]}
              onPress={() => setMinCredibility(opt.value)}
            >
              <Text style={[styles.optionText, minCredibility === opt.value && styles.optionTextActive]}>
                {opt.label}
              </Text>
              {minCredibility === opt.value && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}
        </GlassPanel>

        {/* Notifications */}
        <Text style={styles.sectionTitle}>Notifications</Text>
        <GlassPanel style={styles.section}>
          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>Push Notifications</Text>
              <Text style={styles.rowSubtitle}>Alerts for new major leaks</Text>
            </View>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={(v) => updateSettingsAction({ notificationsEnabled: v })}
              trackColor={{ false: '#333', true: COLORS.accentGreen }}
              thumbColor={COLORS.white}
            />
          </View>
        </GlassPanel>

        {/* Subreddits */}
        <Text style={styles.sectionTitle}>Subreddits ({settings.enabledSubreddits.length}/{SUBREDDITS.length})</Text>
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
        <Text style={styles.sectionTitle}>RSS Feeds ({settings.enabledRSSFeeds.length}/{RSS_FEEDS.length})</Text>
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

        {/* Data Management */}
        <Text style={styles.sectionTitle}>Data</Text>
        <GlassPanel style={styles.section}>
          <TouchableOpacity style={styles.actionRow} onPress={handleClearSaved}>
            <Text style={styles.dangerText}>🗑️ Clear All Saved Posts</Text>
            <Text style={styles.actionChevron}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.actionRow} onPress={handleClearCache}>
            <Text style={styles.dangerText}>🗃️ Clear Feed Cache</Text>
            <Text style={styles.actionChevron}>›</Text>
          </TouchableOpacity>
        </GlassPanel>

        {/* App Info */}
        <GlassPanel style={[styles.section, styles.infoPanel]}>
          <Text style={styles.appName}>LeakRadar</Text>
          <Text style={styles.appVersion}>v1.0.0 · Gaming Leaks Aggregator</Text>
          <Text style={styles.infoSubtext}>
            All data is from public Reddit posts and gaming news RSS feeds.{'\n'}
            No personal data is collected or stored externally.
          </Text>
          <TouchableOpacity
            style={styles.githubBtn}
            onPress={() => Linking.openURL('https://github.com/tmsddc/leakradar')}
            activeOpacity={0.7}
          >
            <Text style={styles.githubBtnText}>📖 GitHub Repository</Text>
          </TouchableOpacity>
        </GlassPanel>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16 },
  title: {
    fontSize: 28,
    fontWeight: FONT.black,
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.glass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statNum: {
    color: COLORS.accentGreen,
    fontSize: 24,
    fontWeight: FONT.heavy,
  },
  statLbl: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: FONT.medium,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: FONT.bold,
    color: COLORS.textSecondary,
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  section: { marginBottom: 4 },
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
  optionRowActive: { backgroundColor: 'rgba(52, 211, 153, 0.08)' },
  optionText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: FONT.medium,
  },
  optionTextActive: { color: COLORS.accentGreen },
  checkmark: {
    color: COLORS.accentGreen,
    fontSize: 16,
    fontWeight: FONT.bold,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  actionChevron: { color: COLORS.textMuted, fontSize: 20 },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 2,
  },
  dangerText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: FONT.semibold,
  },
  infoPanel: { alignItems: 'center', marginTop: 8 },
  appName: {
    color: COLORS.accentGreen,
    fontSize: 20,
    fontWeight: FONT.black,
    marginBottom: 2,
  },
  appVersion: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: FONT.medium,
    marginBottom: 10,
  },
  infoSubtext: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: FONT.regular,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  githubBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  githubBtnText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: FONT.semibold,
  },
});
