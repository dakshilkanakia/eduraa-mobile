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
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useQuery } from '@tanstack/react-query'
import type { StudentExamsStackParamList } from '../../navigation/StudentExamsNavigator'
import { examsApi } from '../../api/exams'
import { papersApi } from '../../api/papers'
import { colors } from '../../theme/colors'
import { spacing, radius, shadows } from '../../theme/spacing'
import type { StudentExamRead, PaperListItem } from '../../types'
import EmptyState from '../../components/EmptyState'

type Nav = NativeStackNavigationProp<StudentExamsStackParamList, 'StudentExamsList'>

// ─── Exam Card ────────────────────────────────────────────────────────────────

function ExamCard({ exam, onPress }: { exam: StudentExamRead; onPress: () => void }) {
  const submittedCount = exam.papers?.filter((p) => (p as any).is_submitted_by_me).length ?? 0
  const totalPapers = exam.papers?.length ?? 0
  const isUpcoming = exam.exam_date ? new Date(exam.exam_date) > new Date() : true

  return (
    <TouchableOpacity style={[styles.card, shadows.xs]} onPress={onPress} activeOpacity={0.78}>
      <View style={styles.cardTop}>
        <View style={[styles.typeBadge, isUpcoming ? styles.upcomingBadge : styles.pastBadge]}>
          <Text style={[styles.typeBadgeText, isUpcoming ? styles.upcomingText : styles.pastText]}>
            {isUpcoming ? 'Upcoming' : 'Past'}
          </Text>
        </View>
        {exam.exam_date ? (
          <Text style={styles.dateText}>
            {new Date(exam.exam_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
        ) : null}
      </View>

      <Text style={styles.examName} numberOfLines={2}>{exam.name}</Text>

      <View style={styles.metaRow}>
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
        {exam.duration_minutes ? (
          <View style={styles.chip}>
            <Ionicons name="time-outline" size={11} color={colors.muted} />
            <Text style={styles.chipText}>{exam.duration_minutes} min</Text>
          </View>
        ) : null}
      </View>

      {totalPapers > 0 ? (
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${totalPapers > 0 ? (submittedCount / totalPapers) * 100 : 0}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{submittedCount}/{totalPapers} submitted</Text>
        </View>
      ) : null}

      <View style={styles.cardFooter}>
        <Text style={styles.viewLink}>View papers</Text>
        <Ionicons name="arrow-forward" size={13} color={colors.accent} />
      </View>
    </TouchableOpacity>
  )
}

// ─── Practice Paper Card ──────────────────────────────────────────────────────

function PracticeCard({ paper, onPress }: { paper: PaperListItem; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.card, shadows.xs]} onPress={onPress} activeOpacity={0.78}>
      <View style={styles.cardTop}>
        <View style={[styles.typeBadge, styles.practiceBadge]}>
          <Text style={[styles.typeBadgeText, styles.practiceText]}>Practice</Text>
        </View>
        <Text style={styles.dateText}>
          {new Date(paper.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </Text>
      </View>
      <Text style={styles.examName} numberOfLines={2}>{paper.title}</Text>
      <View style={styles.metaRow}>
        {paper.subject_name ? (
          <View style={styles.chip}>
            <Ionicons name="book-outline" size={11} color={colors.accent} />
            <Text style={styles.chipText}>{paper.subject_name}</Text>
          </View>
        ) : null}
        <View style={styles.chip}>
          <Ionicons name="star-outline" size={11} color={colors.muted} />
          <Text style={styles.chipText}>{paper.total_marks} marks</Text>
        </View>
        {paper.question_count ? (
          <View style={styles.chip}>
            <Ionicons name="help-circle-outline" size={11} color={colors.muted} />
            <Text style={styles.chipText}>{paper.question_count} questions</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.viewLink}>Attempt / Quiz</Text>
        <Ionicons name="arrow-forward" size={13} color={colors.accent} />
      </View>
    </TouchableOpacity>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

const TABS = ['Teacher Exams', 'Practice Papers'] as const
type TabType = typeof TABS[number]

export default function StudentExamsScreen() {
  const navigation = useNavigation<Nav>()
  const insets = useSafeAreaInsets()
  const [activeTab, setActiveTab] = useState<TabType>('Teacher Exams')
  const [refreshing, setRefreshing] = useState(false)
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start()
  }, [fadeAnim])

  const {
    data: exams,
    isLoading: examsLoading,
    isError: examsError,
    refetch: refetchExams,
  } = useQuery({
    queryKey: ['studentExams'],
    queryFn: examsApi.getStudentExams,
  })

  const {
    data: papersData,
    isLoading: papersLoading,
    isError: papersError,
    refetch: refetchPapers,
  } = useQuery({
    queryKey: ['studentPractice'],
    queryFn: () => papersApi.list({ status: 'published', limit: 50 }),
  })

  const onRefresh = async () => {
    setRefreshing(true)
    await Promise.all([refetchExams(), refetchPapers()])
    setRefreshing(false)
  }

  // Group exams by upcoming / past
  const sortedExams = (exams ?? []).slice().sort((a, b) => {
    const aDate = a.exam_date ? new Date(a.exam_date).getTime() : Infinity
    const bDate = b.exam_date ? new Date(b.exam_date).getTime() : Infinity
    return aDate - bDate
  })
  const upcomingExams = sortedExams.filter(
    (e) => !e.exam_date || new Date(e.exam_date) > new Date()
  )
  const pastExams = sortedExams.filter(
    (e) => e.exam_date && new Date(e.exam_date) <= new Date()
  )

  const practiceItems = papersData?.items ?? []
  const isLoading = activeTab === 'Teacher Exams' ? examsLoading : papersLoading
  const isError = activeTab === 'Teacher Exams' ? examsError : papersError

  return (
    <Animated.View style={[styles.root, { opacity: fadeAnim }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Exams</Text>
        {/* Tabs */}
        <View style={styles.tabRow}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.subtle} />
          <Text style={styles.errorText}>Failed to load</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : activeTab === 'Teacher Exams' ? (
        <FlatList
          data={[
            ...(upcomingExams.length > 0 ? [{ type: 'section', title: 'Upcoming' }] : []),
            ...upcomingExams.map((e) => ({ type: 'exam', data: e })),
            ...(pastExams.length > 0 ? [{ type: 'section', title: 'Past' }] : []),
            ...pastExams.map((e) => ({ type: 'exam', data: e })),
          ] as any[]}
          keyExtractor={(item, i) => item.data?.id ?? `section-${i}`}
          renderItem={({ item }) => {
            if (item.type === 'section') {
              return <Text style={styles.sectionLabel}>{item.title}</Text>
            }
            return (
              <ExamCard
                exam={item.data as StudentExamRead}
                onPress={() =>
                  navigation.navigate('ExamDetail', {
                    examId: (item.data as StudentExamRead).id,
                    examName: (item.data as StudentExamRead).name,
                  })
                }
              />
            )
          }}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
          ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title="No exams assigned"
              subtitle="Your teacher hasn't assigned any exams yet."
            />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={practiceItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PracticeCard
              paper={item}
              onPress={() =>
                navigation.navigate('ExamDetail' as any, {
                  examId: item.id,
                  examName: item.title,
                })
              }
            />
          )}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
          ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="document-text-outline"
              title="No practice papers"
              subtitle="Generate a paper to start practising."
            />
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
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingTop: spacing[5],
    paddingHorizontal: spacing[5],
    paddingBottom: 0,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.ink, letterSpacing: -0.3, marginBottom: spacing[3] },
  tabRow: { flexDirection: 'row', gap: spacing[1] },
  tab: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  tabActive: { borderBottomColor: colors.accent },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.muted },
  tabTextActive: { color: colors.accent },
  list: { paddingHorizontal: spacing[5], paddingTop: spacing[4] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3] },
  errorText: { fontSize: 14, color: colors.muted },
  retryBtn: { paddingHorizontal: spacing[5], paddingVertical: spacing[2], backgroundColor: colors.accent, borderRadius: radius.full },
  retryText: { color: colors.white, fontWeight: '700' },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.subtle,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingTop: spacing[3],
    paddingBottom: spacing[1],
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing[2],
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  typeBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  upcomingBadge: { backgroundColor: colors.successBg },
  pastBadge: { backgroundColor: colors.surface2 },
  practiceBadge: { backgroundColor: colors.infoBg },
  typeBadgeText: { fontSize: 11, fontWeight: '700' },
  upcomingText: { color: colors.successText },
  pastText: { color: colors.muted },
  practiceText: { color: colors.infoText },
  dateText: { fontSize: 11, color: colors.subtle },
  examName: { fontSize: 16, fontWeight: '700', color: colors.ink, lineHeight: 22 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.surface1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipText: { fontSize: 11, fontWeight: '600', color: colors.muted },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surface2,
    overflow: 'hidden',
  },
  progressFill: { height: 4, backgroundColor: colors.accent, borderRadius: 2 },
  progressText: { fontSize: 11, color: colors.muted, fontWeight: '600' },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: spacing[1],
  },
  viewLink: { fontSize: 12, color: colors.accent, fontWeight: '700' },
})
