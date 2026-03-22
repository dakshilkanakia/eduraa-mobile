import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useQuery } from '@tanstack/react-query'
import type { ResultsStackParamList } from '../../navigation'
import { checkedPapersApi } from '../../api/checkedPapers'
import { colors } from '../../theme/colors'
import { spacing, radius, shadows } from '../../theme/spacing'
import { fonts } from '../../theme/fonts'
import type { CheckedPaper } from '../../types'

type Nav = NativeStackNavigationProp<ResultsStackParamList, 'ResultsList'>

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  graded:                { label: 'Graded',        color: colors.success, bg: colors.successBg,  icon: 'checkmark-circle' },
  pending_manual_review: { label: 'In Review',     color: colors.warning, bg: colors.warningBg,  icon: 'time' },
  completed:             { label: 'Completed',     color: colors.success, bg: colors.successBg,  icon: 'checkmark-circle' },
  processing:            { label: 'Processing',    color: colors.warning, bg: colors.warningBg,  icon: 'hourglass' },
  uploaded:              { label: 'Uploaded',      color: colors.info,    bg: colors.infoBg,     icon: 'cloud-upload' },
  needs_review:          { label: 'Needs Review',  color: colors.danger,  bg: colors.dangerBg,   icon: 'alert-circle' },
}

function ScoreBar({ score, max }: { score: number; max: number }) {
  const pct = Math.min(1, score / max)
  const barColor = pct >= 0.75 ? colors.success : pct >= 0.5 ? colors.warning : colors.accent
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct,
      duration: 700,
      delay: 100,
      useNativeDriver: false,
    }).start()
  }, [anim, pct])

  return (
    <View style={bar.track}>
      <Animated.View
        style={[
          bar.fill,
          {
            width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            backgroundColor: barColor,
          },
        ]}
      />
    </View>
  )
}

const bar = StyleSheet.create({
  track: { height: 4, borderRadius: 2, backgroundColor: colors.surface2, overflow: 'hidden', marginTop: spacing[2] },
  fill: { height: 4, borderRadius: 2 },
})

function ResultCard({ item, onPress }: { item: CheckedPaper; onPress: () => void }) {
  const meta = STATUS_META[item.status] ?? {
    label: item.status.replace(/_/g, ' '),
    color: colors.muted,
    bg: colors.surface2,
    icon: 'ellipse',
  }
  const hasScore = item.total_score != null && item.max_score != null
  const pct = hasScore ? Math.round((item.total_score! / item.max_score!) * 100) : null
  const scoreColor = pct != null
    ? pct >= 75 ? colors.success : pct >= 50 ? colors.warning : colors.accent
    : colors.muted
  const dateStr = new Date(item.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <TouchableOpacity style={[styles.card, shadows.xs]} onPress={onPress} activeOpacity={0.78}>
      {/* Top row */}
      <View style={styles.cardTop}>
        <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon as any} size={11} color={meta.color} />
          <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
        </View>
        <Text style={styles.dateText}>{dateStr}</Text>
      </View>

      {/* Title */}
      <Text style={styles.cardTitle} numberOfLines={2}>
        {item.exam_name || item.subject_name || `Paper #${item.id.slice(0, 8)}`}
      </Text>
      {item.subject_name && item.exam_name ? (
        <Text style={styles.subjectText}>{item.subject_name}</Text>
      ) : null}

      {/* Score */}
      {hasScore ? (
        <View style={styles.scoreSection}>
          <View style={styles.scoreRow}>
            <Text style={[styles.scoreNum, { color: scoreColor }]}>{item.total_score}</Text>
            <Text style={styles.scoreMax}> / {item.max_score}</Text>
            <View style={[styles.pctBadge, { backgroundColor: scoreColor + '18' }]}>
              <Text style={[styles.pctText, { color: scoreColor }]}>{pct}%</Text>
            </View>
          </View>
          <ScoreBar score={item.total_score!} max={item.max_score!} />
        </View>
      ) : (
        <Text style={styles.pendingText}>Score pending…</Text>
      )}

      {/* Footer */}
      <View style={styles.cardFooter}>
        <Text style={styles.viewLink}>View full result</Text>
        <Ionicons name="arrow-forward" size={13} color={colors.accent} />
      </View>
    </TouchableOpacity>
  )
}

export default function ResultsScreen() {
  const navigation = useNavigation<Nav>()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const [refreshing, setRefreshing] = useState(false)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['checked-papers'],
    queryFn: () => checkedPapersApi.list(),
  })

  // Entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start()
  }, [fadeAnim])

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const items = data ?? []
  const gradedCount = items.filter(i => i.status === 'graded' || i.status === 'completed').length
  const avgScore = (() => {
    const scored = items.filter(i => i.total_score != null && i.max_score)
    if (!scored.length) return null
    const avg = scored.reduce((s, i) => s + i.total_score! / i.max_score!, 0) / scored.length
    return Math.round(avg * 100)
  })()

  const isSmall = width < 380
  const hPad = isSmall ? spacing[4] : spacing[5]

  return (
    <Animated.View style={[styles.root, { opacity: fadeAnim }]}>
      {/* Summary header */}
      <View style={[styles.header, { paddingHorizontal: hPad }]}>
        <View>
          <Text style={styles.headerTitle}>My Results</Text>
          <Text style={styles.headerSub}>
            {items.length === 0
              ? 'No submissions yet'
              : `${items.length} submission${items.length !== 1 ? 's' : ''}  ·  ${gradedCount} graded${avgScore != null ? `  ·  avg ${avgScore}%` : ''}`}
          </Text>
        </View>
        {avgScore != null && (
          <View style={[
            styles.avgBadge,
            { backgroundColor: avgScore >= 75 ? colors.successBg : avgScore >= 50 ? colors.warningBg : colors.dangerBg },
          ]}>
            <Text style={[
              styles.avgText,
              { color: avgScore >= 75 ? colors.success : avgScore >= 50 ? colors.warning : colors.accent },
            ]}>{avgScore}%</Text>
            <Text style={[
              styles.avgLabel,
              { color: avgScore >= 75 ? colors.success : avgScore >= 50 ? colors.warning : colors.accent },
            ]}>avg</Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.subtle} />
          <Text style={styles.errorText}>Failed to load results</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ResultCard
              item={item}
              onPress={() => navigation.navigate('ResultDetail', { checkedPaperId: item.id })}
            />
          )}
          contentContainerStyle={[
            styles.list,
            { paddingHorizontal: hPad, paddingBottom: insets.bottom + 24 },
          ]}
          ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="clipboard-outline" size={32} color={colors.subtle} />
              </View>
              <Text style={styles.emptyTitle}>No results yet</Text>
              <Text style={styles.emptyBody}>
                Submit a paper to see your grades and AI feedback here.
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing[5],
    paddingBottom: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.3,
  },
  headerSub: { fontSize: 12, color: colors.muted, marginTop: 3 },
  avgBadge: {
    borderRadius: radius.xl,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    alignItems: 'center',
  },
  avgText: { fontSize: 22, fontWeight: '800', fontFamily: fonts.displayBold },
  avgLabel: { fontSize: 10, fontWeight: '700', fontFamily: fonts.bold, textTransform: 'uppercase', marginTop: -2 },

  list: { paddingTop: spacing[4] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3] },
  errorText: { fontSize: 14, color: colors.muted },
  retryBtn: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2],
    backgroundColor: colors.accent,
    borderRadius: radius.full,
  },
  retryText: { color: colors.white, fontWeight: '700' },

  // Card
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing[2],
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  dateText: { fontSize: 11, color: colors.subtle },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: fonts.bold,
    color: colors.ink,
    lineHeight: 21,
  },
  subjectText: { fontSize: 12, fontFamily: fonts.regular, color: colors.muted },
  scoreSection: {},
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing[2] },
  scoreNum: { fontSize: 26, fontWeight: '800', fontFamily: fonts.displayBold },
  scoreMax: { fontSize: 15, color: colors.muted, fontWeight: '600', fontFamily: fonts.semibold },
  pctBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  pctText: { fontSize: 12, fontWeight: '700' },
  pendingText: { fontSize: 13, color: colors.subtle, fontStyle: 'italic' },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: spacing[1],
  },
  viewLink: { fontSize: 12, color: colors.accent, fontWeight: '700' },

  // Empty state
  empty: { alignItems: 'center', paddingTop: spacing[10], gap: spacing[3] },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: radius['2xl'],
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', fontFamily: fonts.displaySemibold, color: colors.ink },
  emptyBody: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.muted,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },
})
