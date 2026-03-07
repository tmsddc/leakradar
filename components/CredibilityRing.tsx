import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { COLORS, FONT, TOKENS } from '../constants/theme';

interface Props {
  score: number;   // 0–100
  size?: number;   // outer diameter
  strokeWidth?: number;
  showLabel?: boolean;
  compact?: boolean;
}

function getLabel(score: number): string {
  if (score >= 80) return 'Reliable';
  if (score >= 60) return 'Likely';
  if (score >= 40) return 'Rumour';
  return 'Speculative';
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function CredibilityRing({
  score,
  size = 52,
  strokeWidth = 3.5,
  showLabel = false,
  compact = false,
}: Props) {
  const color = TOKENS.credibility(score);
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: score / 100,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [score]);

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  if (compact) {
    // Inline chip: ring + number side by side
    const cSize = 28;
    const cStroke = 2.5;
    const cR = (cSize - cStroke) / 2;
    const cCirc = 2 * Math.PI * cR;
    const cDash = cCirc * (1 - score / 100);
    return (
      <View style={styles.chipRow}>
        <Svg width={cSize} height={cSize} style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle
            cx={cSize / 2} cy={cSize / 2} r={cR}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={cStroke} fill="none"
          />
          <Circle
            cx={cSize / 2} cy={cSize / 2} r={cR}
            stroke={color}
            strokeWidth={cStroke} fill="none"
            strokeDasharray={`${cCirc} ${cCirc}`}
            strokeDashoffset={cDash}
            strokeLinecap="round"
          />
        </Svg>
        <Text style={[styles.chipScore, { color }]}>{score}%</Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      <Svg
        width={size}
        height={size}
        style={{ transform: [{ rotate: '-90deg' }] }}
      >
        <Defs>
          <SvgGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity="1" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.5" />
          </SvgGradient>
        </Defs>
        {/* Track */}
        <Circle
          cx={cx} cy={cy} r={r}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc */}
        <AnimatedCircle
          cx={cx} cy={cy} r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset as any}
          strokeLinecap="round"
        />
      </Svg>
      {/* Center text */}
      <View style={styles.center}>
        <Text style={[styles.scoreText, { color, fontSize: size * 0.24 }]}>
          {score}
        </Text>
        <Text style={[styles.pct, { color, fontSize: size * 0.15 }]}>%</Text>
      </View>
      {showLabel && (
        <Text style={[styles.label, { color }]}>{getLabel(score)}</Text>
      )}
    </View>
  );
}

// Full-width credibility bar with integrated ring — used in detail screens
export function CredibilityBar({
  score,
  showLabel = true,
  compact = false,
}: {
  score: number;
  showLabel?: boolean;
  compact?: boolean;
}) {
  if (compact) {
    return <CredibilityRing score={score} size={28} strokeWidth={2.5} compact />;
  }

  const color = TOKENS.credibility(score);
  const label = getLabel(score);

  return (
    <View style={barStyles.row}>
      <CredibilityRing score={score} size={56} strokeWidth={4} />
      {showLabel && (
        <View style={barStyles.textBlock}>
          <Text style={barStyles.title}>Credibility Score</Text>
          <Text style={[barStyles.value, { color }]}>{score}% · {label}</Text>
          <View style={barStyles.track}>
            <View
              style={[
                barStyles.fill,
                { width: `${score}%` as any, backgroundColor: color },
              ]}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    flexDirection: 'row',
  },
  scoreText: {
    fontWeight: FONT.heavy,
    includeFontPadding: false,
  },
  pct: {
    fontWeight: FONT.bold,
    alignSelf: 'flex-end',
    marginBottom: 1,
    includeFontPadding: false,
  },
  label: {
    fontSize: 9,
    fontWeight: FONT.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  chipScore: {
    fontSize: 12,
    fontWeight: FONT.bold,
  },
});

const barStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: FONT.heavy,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 14,
    fontWeight: FONT.bold,
  },
  track: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 1,
    overflow: 'hidden',
    marginTop: 2,
  },
  fill: {
    height: '100%',
    borderRadius: 1,
  },
});
