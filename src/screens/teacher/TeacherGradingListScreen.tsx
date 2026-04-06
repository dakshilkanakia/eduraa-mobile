import React, { useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useQuery } from '@tanstack/react-query'
import type { TeacherScanStackParamList } from '../../navigation/TeacherScanNavigator'
import { scanApi } from '../../api/scan'
import { colors } from '../../theme/colors'
import { spacing, radius, shadows } from '../../theme/spacing'
import type { CheckedPaper } from '../../types'
import StatusBadge from '../../components/StatusBadge'
import FilterChip from '../../components/FilterChip'
import EmptyState from '../../components/EmptyState'

type Nav = NativeStackNavigationProp<TeacherScanStackParamList>

const FILTER_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Needs Review', value: 'needs_review' },
  { label: 'Graded', value: 'graded' },
  { label: 'Processing', value: 'processing' },
  { label: 'Pending', value: 'pending_manual_review' },
]

function GradingCard({ paper, onPress }: { paper: CheckedPaper; onPress: () => void }) {
  const confidence = paper.grading_confidence
  const showScore = paper.total_score != null && paper.max_score != null
  const hasManualRequest = paper.manual_review_requested

  return (
    <TouchableOpacity style={[styles.card, shadows.xs]} onPress={onPress} activeOpacity={0.78}>
      <View style={styles.cardTop}>
        <StatusBadge status={paper.status} size="sm" />
        <Text style={styles.dateText}>
          {new Date(paper.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </Text>
      </View>

      <Text style={styles.studentName}>
        {paper.student_name ?? 'Unknown — ID not detected'}
      </Text>

      <Text style={styles.examName} numberOfLines={1}>
        {paper.exam_name ?? '—'}{paper.subject_name ? ` · ${paper.subject_name}` : ''}
      </Text>

      {showScore ? (
        <View style={styles.scoreRow}>
          <Ionicons name="star-outline" size={12} color={colors.accent} />
          <Text style={styles.scoreText}>{paper.total_score} / {paper.max_score}</Text>
        </View>
      ) : null}

      {confidence != null ? (
        <View style={styles.confidenceRow}>
          <Text style={styles.confidenceLabel}>AI Confidence</Text>
          <View style={styles.confidenceBar}>
            <View
              style={[
                styles.confidenceFill,
                { width: `${confidence * 100}%` as any },
                confidence < 0.7 ? styles.confidenceLow : styles.confidenceHigh,
              ]}
            />
          </View>
          <Text style={[styles.confidencePct, confidence < 0.7 ? { color: colors.warning } : { color: colors.success }]}>
            {Math.round(confidence * 100)}%
          </Text>
        </View>
      ) : null}

      <View style={styles.cardFooter}>
        <View style={styles.flagRow}>
          {paper.needs_review ? (
            <View style={styles.flagBadge}>
              <Ionicons name="flag" size={10} color={colors.warningText} />
              <Text style={styles.flagText}>Review needed</Text>
            </View>
          ) : null}
          {hasManualRequest ? (
            <View style={styles.reviewBadge}>
              <Ionicons name="person-outline" size={10} color={colors.infoText} />
              <Text style={styles.reviewBadgeText}>Manual review requested</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.viewLink}>
          <Text style={styles.viewLinkText}>Review</Text>
          <Ionicons name="arrow-forward" size={13} color={colors.accent} />
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default function TeacherGradingListScreen() {
  const navigation = useNavigation<Nav>()
  const insets = useSafeAreaInsets()
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['teacherCheckedPapers'],
    queryFn: () => scanApi.list(),
  })

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const filtered = (data ?? []).filter(p => {
    const matchStatus = statusFilter === 'all' || p.status === statusFilter || (statusFilter === 'needs_review' && p.needs_review)
    const matchSearch = !search || (p.student_name ?? '').toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator color={colors.accent} size="large" /></View>
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.subtle} />
        <Text style={styles.errorText}>Failed to load</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={16} color={colors.subtle} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by student name..."
            placeholderTextColor={colors.placeholder}
            value={search}
            onChangeText={setSearch}
          />
          {search ? <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={16} color={colors.subtle} /></TouchableOpacity> : null}
        </View>
        <FilterChip options={FILTER_OPTIONS} selected={[statusFilter]} onChange={([v]) => setStatusFilter(v ?? 'all')} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={p => p.id}
        renderItem={({ item }) => (
          <GradingCard
            paper={item}
            onPress={() => navigation.navigate('TeacherGradingDetail', { checkedPaperId: item.id })}
          />
        )}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />}
        ListEmptyComponent={<EmptyState icon="document-text-outline" title="No graded papers" subtitle="Upload answer sheets to start grading." />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3] },
  errorText: { fontSize: 14, color: colors.muted },
  retryBtn: { paddingHorizontal: spacing[5], paddingVertical: spacing[2], backgroundColor: colors.accent, borderRadius: radius.full },
  retryText: { color: colors.white, fontWeight: '700' },
  topBar: { paddingHorizontal: spacing[5], paddingVertical: spacing[3], gap: spacing[2], borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, backgroundColor: colors.card },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], backgroundColor: colors.surface1, borderRadius: radius.lg, paddingHorizontal: spacing[3], height: 36, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  searchInput: { flex: 1, fontSize: 14, color: colors.ink },
  list: { paddingHorizontal: spacing[5], paddingTop: spacing[4] },
  card: { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing[4], borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, gap: spacing[2] },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateText: { fontSize: 11, color: colors.subtle },
  studentName: { fontSize: 16, fontWeight: '700', color: colors.ink },
  examName: { fontSize: 12, color: colors.muted },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  scoreText: { fontSize: 13, fontWeight: '700', color: colors.accent },
  confidenceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  confidenceLabel: { fontSize: 11, color: colors.muted, width: 80 },
  confidenceBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.surface2, overflow: 'hidden' },
  confidenceFill: { height: 4, borderRadius: 2 },
  confidenceLow: { backgroundColor: colors.warning },
  confidenceHigh: { backgroundColor: colors.success },
  confidencePct: { fontSize: 11, fontWeight: '700', width: 32, textAlign: 'right' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing[1] },
  flagRow: { flexDirection: 'row', gap: spacing[2] },
  flagBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.warningBg, borderRadius: radius.full, paddingHorizontal: 7, paddingVertical: 2 },
  flagText: { fontSize: 10, fontWeight: '700', color: colors.warningText },
  reviewBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.infoBg, borderRadius: radius.full, paddingHorizontal: 7, paddingVertical: 2 },
  reviewBadgeText: { fontSize: 10, fontWeight: '700', color: colors.infoText },
  viewLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewLinkText: { fontSize: 12, color: colors.accent, fontWeight: '700' },
})
