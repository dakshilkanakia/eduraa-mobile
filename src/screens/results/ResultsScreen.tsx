import React, { useState } from 'react'
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useQuery } from '@tanstack/react-query'
import type { ResultsStackParamList } from '../../navigation'
import { checkedPapersApi } from '../../api/checkedPapers'
import { colors } from '../../theme/colors'
import { spacing, radius } from '../../theme/spacing'
import type { CheckedPaper } from '../../types'

type Nav = NativeStackNavigationProp<ResultsStackParamList, 'ResultsList'>

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  graded:                 { label: 'Graded',         color: '#059669', bg: '#d1fae5' },
  pending_manual_review:  { label: 'Pending Review', color: '#d97706', bg: '#fef3c7' },
  completed:              { label: 'Completed',      color: '#059669', bg: '#d1fae5' },
  processing:             { label: 'Processing',     color: '#d97706', bg: '#fef3c7' },
  uploaded:               { label: 'Uploaded',       color: '#3b82f6', bg: '#dbeafe' },
  needs_review:           { label: 'Needs Review',   color: colors.accent, bg: '#ffe4e6' },
}

function ScoreBar({ score, max }: { score: number; max: number }) {
  const pct = Math.min(1, score / max)
  const barColor = pct >= 0.75 ? '#059669' : pct >= 0.5 ? '#d97706' : colors.accent
  return (
    <View style={barStyles.track}>
      <View style={[barStyles.fill, { width: `${Math.round(pct * 100)}%` as any, backgroundColor: barColor }]} />
    </View>
  )
}

const barStyles = StyleSheet.create({
  track: { height: 4, borderRadius: 2, backgroundColor: colors.surface2, marginTop: 6, overflow: 'hidden' },
  fill:  { height: 4, borderRadius: 2 },
})

function ResultCard({ item, onPress }: { item: CheckedPaper; onPress: () => void }) {
  const meta = STATUS_META[item.status] ?? { label: item.status.replace(/_/g, ' '), color: colors.muted, bg: colors.surface2 }
  const hasScore = item.total_score != null && item.max_score != null
  const pct = hasScore ? Math.round((item.total_score! / item.max_score!) * 100) : null
  const dateStr = new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Top row: status badge + date */}
      <View style={cardStyles.topRow}>
        <View style={[cardStyles.badge, { backgroundColor: meta.bg, borderColor: meta.color }]}>
          <Text style={[cardStyles.badgeText, { color: meta.color }]}>{meta.label}</Text>
        </View>
        <Text style={cardStyles.date}>{dateStr}</Text>
      </View>

      {/* Paper title / subject */}
      <Text style={cardStyles.title} numberOfLines={2}>
        {item.exam_name || item.subject_name || `Paper #${item.id.slice(0, 8)}`}
      </Text>
      {item.subject_name && item.exam_name ? (
        <Text style={cardStyles.subject}>{item.subject_name}</Text>
      ) : null}

      {/* Score row */}
      {hasScore ? (
        <View style={cardStyles.scoreSection}>
          <View style={cardStyles.scoreRow}>
            <Text style={cardStyles.scoreNum}>{item.total_score}</Text>
            <Text style={cardStyles.scoreMax}> / {item.max_score}</Text>
            <Text style={cardStyles.scorePct}>  {pct}%</Text>
          </View>
          <ScoreBar score={item.total_score!} max={item.max_score!} />
        </View>
      ) : (
        <Text style={cardStyles.scorePending}>Score pending…</Text>
      )}

      {/* Chevron */}
      <View style={cardStyles.chevronRow}>
        <Text style={cardStyles.chevron}>View full result →</Text>
      </View>
    </TouchableOpacity>
  )
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.card, borderRadius: radius.xl,
    padding: spacing[4], borderWidth: 1, borderColor: colors.border,
    gap: 6,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radius.full, borderWidth: 1,
  },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  date: { fontSize: 11, color: colors.subtle },
  title: { fontSize: 15, fontWeight: '700', color: colors.ink, marginTop: 2 },
  subject: { fontSize: 12, color: colors.muted },
  scoreSection: { marginTop: 4 },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline' },
  scoreNum: { fontSize: 26, fontWeight: '800', color: colors.accent },
  scoreMax: { fontSize: 16, color: colors.muted, fontWeight: '600' },
  scorePct: { fontSize: 14, color: colors.muted, fontWeight: '700' },
  scorePending: { fontSize: 13, color: colors.subtle, fontStyle: 'italic', marginTop: 4 },
  chevronRow: { alignItems: 'flex-end', marginTop: 2 },
  chevron: { fontSize: 12, color: colors.accent, fontWeight: '700' },
})

export default function ResultsScreen() {
  const navigation = useNavigation<Nav>()
  const [refreshing, setRefreshing] = useState(false)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['checked-papers'],
    queryFn: () => checkedPapersApi.list(),
  })

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const items = data ?? []
  const gradedCount = items.filter(i => i.status === 'graded' || i.status === 'completed').length
  const avgScore = (() => {
    const scored = items.filter(i => i.total_score != null && i.max_score)
    if (scored.length === 0) return null
    const avg = scored.reduce((s, i) => s + i.total_score! / i.max_score!, 0) / scored.length
    return Math.round(avg * 100)
  })()

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Results</Text>
        <Text style={styles.subtitle}>
          {items.length === 0
            ? 'No submissions yet'
            : `${items.length} submission${items.length !== 1 ? 's' : ''}  ·  ${gradedCount} graded${avgScore !== null ? `  ·  avg ${avgScore}%` : ''}`}
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.accent} />
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Failed to load results.</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ResultCard
              item={item}
              onPress={() => navigation.navigate('ResultDetail', { checkedPaperId: item.id })}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No results yet</Text>
              <Text style={styles.emptyBody}>Submit a paper to see your grades and AI feedback here.</Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface1 },
  header: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[6],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.ink },
  subtitle: { fontSize: 12, color: colors.muted, marginTop: 3 },
  list: { padding: spacing[4], gap: spacing[3], paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[8] },
  errorText: { fontSize: 14, color: colors.muted, marginBottom: spacing[3] },
  retryBtn: {
    paddingHorizontal: spacing[5], paddingVertical: spacing[2],
    backgroundColor: colors.accent, borderRadius: radius.full,
  },
  retryText: { color: colors.white, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60, gap: spacing[3] },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.ink },
  emptyBody: { fontSize: 14, color: colors.muted, textAlign: 'center', maxWidth: 260, lineHeight: 20 },
})
