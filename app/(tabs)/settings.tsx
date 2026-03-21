import React, { useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Switch, Alert, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS, SHADOW } from '../../constants/theme';
import { GradientBackground } from '../../components/GradientBackground';
import { GlassPanel } from '../../components/GlassPanel';
import { useLeakStore } from '../../store/useLeakStore';
import { SUBREDDITS, RSS_FEEDS, REFRESH_INTERVALS } from '../../constants/sources';
import { clearSavedPosts, cacheFeed } from '../../lib/storage';

const MIN_CRED_OPTIONS = [
  { label: 'All',             value: 0  },
  { label: '60%+ — Likely',  value: 60 },
  { label: '80%+ — Reliable',value: 80 },
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

  useEffect(() => { loadSettings(); }, []);

  const handleClearSaved = () => {
    Alert.alert('Clear Saved Posts', 'Remove all saved posts?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive',
        onPress: async () => {
          await clearSavedPosts();
          await loadSavedPosts();
        },
      },
    ]);
  };

  const handleClearCache = () => {
    Alert.alert('Clear Feed Cache', 'This will clear the offline cached feed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive',
        onPress: async () => {
          await cacheFeed([]);
          Alert.alert('Done', 'Feed cache cleared.');
        },
      },
    ]);
  };

  const toggleSubreddit = (name: string) => {
    const current = settings.enabledSubreddits;
    updateSettingsAction({
      enabledSubreddits: current.includes(name)
        ? current.filter(s => s !== name)
        : [...current, name],
    });
  };

  const toggleRSSFeed = (name: string) => {
    const current = settings.enabledRSSFeeds;
    updateSettingsAction({
      enabledRSSFeeds: current.includes(name)
        ? current.filter(s => s !== name)
        : [...current, name],
    });
  };

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 8, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium header */}
        <View style={styles.premiumHeader}>
          <View>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>Personalize LeakRadar</Text>
          </View>
          <View style={styles.headerIcon}>
            <View style={styles.headerIconBg} />
            <Ionicons name="settings" size={24} color={COLORS.accent} />
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Ionicons name="document-text-outline" size={16} color={COLORS.neonBlue} />
            <Text style={styles.statNum}>{posts.length}</Text>
            <Text style={styles.statLbl}>Cached Leaks</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="layers-outline" size={16} color={COLORS.neonGreen} />
            <Text style={styles.statNum}>
              {settings.enabledSubreddits.length + settings.enabledRSSFeeds.length}
            </Text>
            <Text style={styles.statLbl}>Active Sources</Text>
          </View>
        </View>

        {/* Auto-refresh */}
        <View style={styles.sectionHeader}>
          <Ionicons name="timer-outline" size={14} color={COLORS.accent} />
          <Text style={styles.sectionTitle}>AUTO-REFRESH</Text>
        </View>
        <GlassPanel style={styles.section}>
          {REFRESH_INTERVALS.map(interval => (
            <TouchableOpacity
              key={interval.value}
              style={[styles.optionRow, settings.refreshInterval === interval.value && styles.optionRowActive]}
              onPress={() => updateSettingsAction({ refreshInterval: interval.value })}
            >
              <Text style={[styles.optionText, settings.refreshInterval === interval.value && styles.optionTextActive]}>
                {interval.label}
              </Text>
              {settings.refreshInterval === interval.value ? (
                <Text style={styles.check}>✓</Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </GlassPanel>

        {/* Credibility filter */}
        <View style={styles.sectionHeader}>
          <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.accent} />
          <Text style={styles.sectionTitle}>MIN. CREDIBILITY</Text>
        </View>
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
              {minCredibility === opt.value ? <Text style={styles.check}>✓</Text> : null}
            </TouchableOpacity>
          ))}
        </GlassPanel>

        {/* Subreddits */}
        <View style={styles.sectionHeader}>
          <Ionicons name="logo-reddit" size={14} color={COLORS.accent} />
          <Text style={styles.sectionTitle}>
            SUBREDDITS — {settings.enabledSubreddits.length}/{SUBREDDITS.length}
          </Text>
        </View>
        <GlassPanel style={styles.section}>
          {SUBREDDITS.map(sub => (
            <View key={sub.subreddit} style={styles.row}>
              <Text style={styles.rowTitle}>r/{sub.subreddit}</Text>
              <Switch
                value={settings.enabledSubreddits.includes(sub.subreddit)}
                onValueChange={() => toggleSubreddit(sub.subreddit)}
                trackColor={{ false: COLORS.surface, true: COLORS.accentDim }}
                thumbColor={COLORS.accent}
              />
            </View>
          ))}
        </GlassPanel>

        {/* RSS feeds */}
        <View style={styles.sectionHeader}>
          <Ionicons name="newspaper-outline" size={14} color={COLORS.accent} />
          <Text style={styles.sectionTitle}>
            NEWS FEEDS — {settings.enabledRSSFeeds.length}/{RSS_FEEDS.length}
          </Text>
        </View>
        <GlassPanel style={styles.section}>
          {RSS_FEEDS.map(feed => (
            <View key={feed.name} style={styles.row}>
              <Text style={styles.rowTitle}>{feed.name}</Text>
              <Switch
                value={settings.enabledRSSFeeds.includes(feed.name)}
                onValueChange={() => toggleRSSFeed(feed.name)}
                trackColor={{ false: COLORS.surface, true: COLORS.accentDim }}
                thumbColor={COLORS.accent}
              />
            </View>
          ))}
        </GlassPanel>

        {/* Appearance */}
        <View style={styles.sectionHeader}>
          <Ionicons name="moon-outline" size={14} color={COLORS.accent} />
          <Text style={styles.sectionTitle}>APPEARANCE</Text>
        </View>
        <GlassPanel style={styles.section}>
          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>Dark Mode</Text>
              <Text style={styles.rowSub}>Use dark colour scheme</Text>
            </View>
            <Switch
              value={settings.darkMode}
              onValueChange={(v) => updateSettingsAction({ darkMode: v })}
              trackColor={{ false: COLORS.surface, true: COLORS.accentDim }}
              thumbColor={COLORS.accent}
            />
          </View>
        </GlassPanel>

        {/* Notifications */}
        <View style={styles.sectionHeader}>
          <Ionicons name="notifications-outline" size={14} color={COLORS.accent} />
          <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
        </View>
        <GlassPanel style={styles.section}>
          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>Push Notifications</Text>
              <Text style={styles.rowSub}>Alerts for major new leaks</Text>
            </View>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={(v) => updateSettingsAction({ notificationsEnabled: v })}
              trackColor={{ false: COLORS.surface, true: COLORS.accentDim }}
              thumbColor={COLORS.accent}
            />
          </View>
        </GlassPanel>

        {/* Data */}
        <View style={styles.sectionHeader}>
          <Ionicons name="trash-outline" size={14} color={COLORS.red} />
          <Text style={[styles.sectionTitle, { color: COLORS.red }]}>DATA</Text>
        </View>
        <GlassPanel style={styles.section}>
          <TouchableOpacity style={styles.actionRow} onPress={handleClearSaved}>
            <Text style={styles.dangerText}>Clear All Saved Posts</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.actionRow} onPress={handleClearCache}>
            <Text style={styles.dangerText}>Clear Feed Cache</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </GlassPanel>

        {/* About */}
        <GlassPanel style={[styles.section, styles.aboutPanel]}>
          <View style={styles.aboutLogoRow}>
            <Text style={styles.aboutLeak}>LEAK</Text>
            <Text style={styles.aboutRadar}>RADAR</Text>
          </View>
          <Text style={styles.appVersion}>v1.0.0 · Gaming Leaks Aggregator</Text>
          <Text style={styles.aboutText}>
            All data is sourced from public Reddit posts and gaming news RSS feeds.
            No personal data is collected or stored externally.
          </Text>
          <TouchableOpacity
            style={styles.githubBtn}
            onPress={() => Linking.openURL('https://github.com/tmsddc/leakradar')}
            activeOpacity={0.7}
          >
            <Ionicons name="logo-github" size={14} color={COLORS.accent} style={{ marginRight: 6 }} />
            <Text style={styles.githubBtnText}>GitHub Repository</Text>
          </TouchableOpacity>
        </GlassPanel>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16 },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: FONT.black,
    color: COLORS.textPrimary,
    letterSpacing: -0.7,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
    fontWeight: FONT.medium,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  headerIconBg: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.accent,
    opacity: 0.06,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
    ...SHADOW.card,
  },
  statNum: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: FONT.heavy,
  },
  statLbl: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: FONT.medium,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 2,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: FONT.heavy,
    color: COLORS.textMuted,
    letterSpacing: 1.2,
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
    fontSize: 14,
    fontWeight: FONT.medium,
  },
  rowSub: {
    color: COLORS.textMuted,
    fontSize: 11,
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
  optionRowActive: { backgroundColor: COLORS.accentDim },
  optionText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: FONT.medium,
  },
  optionTextActive: { color: COLORS.accent },
  check: {
    color: COLORS.neonGreen,
    fontSize: 15,
    fontWeight: FONT.bold,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  chevron: { color: COLORS.textMuted, fontSize: 20 },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: 2,
  },
  dangerText: {
    color: COLORS.red,
    fontSize: 14,
    fontWeight: FONT.semibold,
  },
  aboutPanel: { alignItems: 'center', marginTop: 16, paddingVertical: 20 },
  aboutLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  aboutLeak: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: FONT.black,
    letterSpacing: -0.5,
  },
  aboutRadar: {
    color: COLORS.accent,
    fontSize: 20,
    fontWeight: FONT.black,
    letterSpacing: -0.5,
  },
  appVersion: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 10,
  },
  aboutText: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  githubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
  },
  githubBtnText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: FONT.semibold,
  },
});
