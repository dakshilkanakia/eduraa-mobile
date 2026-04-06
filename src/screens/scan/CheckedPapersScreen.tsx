import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useQuery } from '@tanstack/react-query'
import type { ScanStackParamList } from '../../navigation/ScanNavigator'
import { scanApi } from '../../api/scan'
import { colors } from '../../theme/colors'
import { spacing, radius, shadows } from '../../theme/spacing'
import type { CheckedPaper, CheckedPaperStatus } from '../../types'
import StatusBadge from '../../components/StatusBadge'
import FilterChip from '../../components/FilterChip'
import EmptyState from '../../components/EmptyState'

type Nav = NativeStackNavigationProp<ScanStackParamList>

const FILTER_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Processing', value: 'processing' },
  { label: 'Graded', value: 'graded' },
  { label: 'Needs Review', value: 'needs_review' },
]

function PaperCard({ paper, onPress }: { paper: CheckedPaper; onPress: () => void }) {
  const dateStr = new Date(paper.created_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  const showScore =
    paper.total_score != null &&
    paper.max_score != null &&
    (paper.status === 'graded' || paper.status === 'completed')

  return (
    <TouchableOpacity
      style={[styles.card, shadows.xs]}
      onPress={onPress}
      activeOpacity={0.78}
    >
      <View style={styles.cardTop}>
        <StatusBadge status={paper.status} size="sm" />
        <Text style={styles.dateText}>{dateStr}</Text>
      </View>

      <Text style={styles.examName} numberOfLines={2}>
        {paper.exam_name ?? 'Unknown Exam'}
      </Text>

      {paper.subject_name ? (
        <View style={styles.chip}>
          <Ionicons name="book-outline" size={11} color={colors.accent} />
          <Text style={styles.chipText}>{paper.subject_name}</Text>
        </View>
      ) : null}

      {showScore ? (
        <View style={styles.scoreRow}>
          <Ionicons name="checkmark-circle" size={14} color={colors.success} />
          <Text style={styles.scoreText}>
            Score: {paper.total_score} / {paper.max_score}
          </Text>
        </View>
      ) : paper.status === 'graded' || paper.status === 'completed' ? (
        <View style={styles.scoreRow}>
          <Ionicons name="hourglass-outline" size={14} color={colors.warningText} />
          <Text style={styles.awaitingText}>Awaiting results</Text>
        </View>
      ) : null}

      {paper.needs_review ? (
        <View style={styles.reviewRow}>
          <Ionicons name="flag-outline" size={13} color={colors.warningText} />
          <Text style={styles.reviewText}>Needs Review</Text>
        </View>
      ) : null}

      <View style={styles.cardFooter}>
        <Text style={styles.viewLink}>View details</Text>
        <Ionicons name="arrow-forward" size={13} color={colors.accent} />
      </View>
    </TouchableOpacity>
  )
}

export default function CheckedPapersScreen() {
  const navigation = useNavigation<Nav>()
  const insets = useSafeAreaInsets()
  const [statusFilter, setStatusFilter] = useState('all')
  const [refreshing, setRefreshing] = useState(false)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['checkedPapers'],
    queryFn: () => scanApi.list(),
  })

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const filtered = (data ?? []).filter((p) => {
    if (statusFilter === 'all') return true
    return p.status === statusFilter
  })

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    )
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.subtle} />
        <Text style={styles.errorText}>Failed to load uploads</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <View style={styles.filterRow}>
        <FilterChip
          options={FILTER_OPTIONS}
          selected={[statusFilter]}
          onChange={([val]) => setStatusFilter(val ?? 'all')}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PaperCard
            paper={item}
            onPress={() =>
              navigation.navigate('CheckedPaperDetail', { checkedPaperId: item.id })
            }
          />
        )}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
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
          <EmptyState
            icon="document-text-outline"
            title="No uploaded papers yet"
            subtitle="Upload your first answer sheet above."
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3] },
  filterRow: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  list: { paddingHorizontal: spacing[5], paddingTop: spacing[4] },
  errorText: { fontSize: 14, color: colors.muted },
  retryBtn: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2],
    backgroundColor: colors.accent,
    borderRadius: radius.full,
  },
  retryText: { color: colors.white, fontWeight: '700' },
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
  dateText: { fontSize: 11, color: colors.subtle },
  examName: { fontSize: 15, fontWeight: '700', color: colors.ink, lineHeight: 21 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.surface1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipText: { fontSize: 11, fontWeight: '600', color: colors.muted },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  scoreText: { fontSize: 12, color: colors.success, fontWeight: '600' },
  awaitingText: { fontSize: 12, color: colors.warningText, fontWeight: '600' },
  reviewRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  reviewText: { fontSize: 12, color: colors.warningText, fontWeight: '600' },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: spacing[1],
  },
  viewLink: { fontSize: 12, color: colors.accent, fontWeight: '700' },
})
