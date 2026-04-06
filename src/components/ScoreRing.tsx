import React, { useEffect, useRef } from 'react'
import { View, Text, Animated, StyleSheet } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import colors from '../theme/colors'

interface ScoreRingProps {
  score: number
  maxScore: number
  size?: number
  strokeWidth?: number
}

function gradeLabel(pct: number): string {
  if (pct >= 90) return 'A+'
  if (pct >= 80) return 'A'
  if (pct >= 70) return 'B+'
  if (pct >= 60) return 'B'
  if (pct >= 50) return 'C'
  if (pct >= 40) return 'D'
  return 'F'
}

function ringColor(pct: number): string {
  if (pct >= 80) return colors.success
  if (pct >= 60) return colors.info
  if (pct >= 40) return colors.warning
  return colors.danger
}

// react-native-svg AnimatedCircle workaround
const AnimatedCircle = Animated.createAnimatedComponent(Circle)

export default function ScoreRing({ score, maxScore, size = 120, strokeWidth = 10 }: ScoreRingProps) {
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
  const color = ringColor(pct)
  const grade = gradeLabel(pct)

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(progress, {
      toValue: pct / 100,
      duration: 800,
      useNativeDriver: false,
    }).start()
  }, [pct])

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  })

  const cx = size / 2
  const cy = size / 2

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* Track */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={colors.surface2}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress */}
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <View style={[styles.center, { width: size, height: size }]}>
        <Text style={[styles.pct, { color }]}>{pct}%</Text>
        <Text style={[styles.grade, { color }]}>{grade}</Text>
        <Text style={styles.score}>{score}/{maxScore}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pct: {
    fontSize: 22,
    fontWeight: '800',
  },
  grade: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: -2,
  },
  score: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
})
