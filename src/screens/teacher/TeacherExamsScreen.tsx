import React, { useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useQuery } from '@tanstack/react-query'
import type { TeacherExamsStackParamList } from '../../navigation/TeacherExamsNavigator'
import { examsApi } from '../../api/exams'
import { colors } from '../../theme/colors'
import { spacing, radius, shadows } from '../../theme/spacing'
import type { Exam } from '../../types'
import FilterChip from '../../components/FilterChip'
import EmptyState from '../../components/EmptyState'

type Nav = NativeStackNavigationProp<TeacherExamsStackParamList, 'TeacherExamsList'>

const FILTER_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Past', value: 'past' },
  { label: 'Published', value: 'published' },
]

function ExamCard({ exam, onPress }: { exam: Exam; onPress: () => void }) {
  const isUpcoming = exam.exam_date ? new Date(exam.exam_date) > new Date() : true
  return (
    <TouchableOpacity style={[styles.card, shadows.xs]} onPress={onPress} activeOpacity={0.78}>
      <View style={styles.cardTop}>
        <View style={[styles.typeBadge, isUpcoming ? styles.upcomingBadge : styles.pastBadge]}>
          <Text style={[styles.typeBadgeText, isUpcoming ? styles.upcomingText : styles.pastText]}>
            {isUpcoming ? 'Upcoming' : 'Past'}
          </Text>
        </View>
        <View style={styles.rightBadges}>
          {exam.results_published ? (
            <View style={styles.publishedBadge}>
              <Text style={styles.publishedText}>Published</Text>
            </View>
          ) : null}
          {exam.auto_grade_enabled ? (
            <View style={styles.autoBadge}>
              <Ionicons name="flash" size={10} color={colors.infoText} />
              <Text style={styles.autoText}>Auto-grade</Text>
            </View>
          ) : null}
        </View>
      </View>

      <Text style={styles.examName} numberOfLines={2}>{exam.name}</Text>

      <View style={styles.chipRow}>
        {exam.subject_name ? (
          <View style={styles.chip}>
            <Ionicons name="book-outline" size={11} color={colors.accent} />
            <Text style={styles.chipText}>{exam.subject_name}</Text>
          </View>
        ) : null}
        {exam.standard ? (
          <View style={styles.chip}>
            <Ionicons name="school-outline" size={11} color={colors.info} />
            <Text style={[styles.chipText, { color: colors.infoText }]}>
              Std {exam.standard}{exam.division ? `-${exam.division}` : ''}
            </Text>
          </View>
        ) : null}
        {exam.exam_date ? (
          <View style={styles.chip}>
            <Ionicons name="calendar-outline" size={11} color={colors.muted} />
            <Text style={styles.chipText}>
              {new Date(exam.exam_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </Text>
          </View>
        ) : null}
        {exam.duration_minutes ? (
          <View style={styles.chip}>
            <Ionicons name="time-outline" size={11} color={colors.muted} />
            <Text style={styles.chipText}>{exam.duration_minutes} min</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.papersCount}>{exam.paper_ids?.length ?? 0} papers</Text>
        <View style={styles.viewLink}>
          <Text style={styles.viewLinkText}>View</Text>
          <Ionicons name="arrow-forward" size={13} color={colors.accent} />
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default function TeacherExamsScreen() {
  const navigation = useNavigation<Nav>()
  const insets = useSafeAreaInsets()
  const [filter, setFilter] = useState('all')
  const [refreshing, setRefreshing] = useState(false)

  const { data: exams, isLoading, isError, refetch } = useQuery({
    queryKey: ['teacherExams'],
    queryFn: examsApi.getTeacherExams,
  })

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const filtered = (exams ?? []).filter(e => {
    if (filter === 'all') return true
    if (filter === 'upcoming') return !e.exam_date || new Date(e.exam_date) > new Date()
    if (filter === 'past') return !!e.exam_date && new Date(e.exam_date) <= new Date()
    if (filter === 'published') return e.results_published
    return true
  })

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator color={colors.accent} size="large" /></View>
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.subtle} />
        <Text style={styles.errorText}>Failed to load exams</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <View style={styles.filterRow}>
        <FilterChip options={FILTER_OPTIONS} selected={[filter]} onChange={([v]) => setFilter(v ?? 'all')} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={e => e.id}
        renderItem={({ item }) => (
          <ExamCard exam={item} onPress={() => navigation.navigate('TeacherExamDetail', { examId: item.id })} />
        )}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />}
        ListEmptyComponent={
          <EmptyState
            icon="calendar-outline"
            title="No exams yet"
            subtitle="Create your first exam."
            action={{ label: 'Create Exam', onPress: () => navigation.navigate('CreateExam') }}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        onPress={() => navigation.navigate('CreateExam')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={26} color={colors.white} />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3] },
  errorText: { fontSize: 14, color: colors.muted },
  retryBtn: { paddingHorizontal: spacing[5], paddingVertical: spacing[2], backgroundColor: colors.accent, borderRadius: radius.full },
  retryText: { color: colors.white, fontWeight: '700' },
  filterRow: { paddingHorizontal: spacing[5], paddingVertical: spacing[3], borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, backgroundColor: colors.card },
  list: { paddingHorizontal: spacing[5], paddingTop: spacing[4] },
  card: { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing[4], borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, gap: spacing[2] },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  typeBadge: { paddingHorizontal: spacing[3], paddingVertical: 3, borderRadius: radius.full },
  upcomingBadge: { backgroundColor: colors.successBg },
  pastBadge: { backgroundColor: colors.surface2 },
  typeBadgeText: { fontSize: 11, fontWeight: '700' },
  upcomingText: { color: colors.successText },
  pastText: { color: colors.muted },
  rightBadges: { flexDirection: 'row', gap: spacing[2] },
  publishedBadge: { paddingHorizontal: spacing[2], paddingVertical: 2, borderRadius: radius.full, backgroundColor: colors.accentLight },
  publishedText: { fontSize: 10, fontWeight: '700', color: colors.accent },
  autoBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: spacing[2], paddingVertical: 2, borderRadius: radius.full, backgroundColor: colors.infoBg },
  autoText: { fontSize: 10, fontWeight: '700', color: colors.infoText },
  examName: { fontSize: 16, fontWeight: '700', color: colors.ink, lineHeight: 22 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full, backgroundColor: colors.surface1, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  chipText: { fontSize: 11, fontWeight: '600', color: colors.muted },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing[1] },
  papersCount: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  viewLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewLinkText: { fontSize: 12, color: colors.accent, fontWeight: '700' },
  fab: { position: 'absolute', right: spacing[5], width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 8 },
})
