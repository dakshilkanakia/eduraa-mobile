import React, { useRef, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRoute, useNavigation } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useQuery } from '@tanstack/react-query'
import type { StudentExamsStackParamList } from '../../navigation/StudentExamsNavigator'
import type { StudentPapersStackParamList } from '../../navigation/StudentTabs'
import { examsApi } from '../../api/exams'
import { colors } from '../../theme/colors'
import { spacing, radius, shadows } from '../../theme/spacing'
import type { StudentExamPaper } from '../../types'
import StatusBadge from '../../components/StatusBadge'

type Route = RouteProp<StudentExamsStackParamList, 'ExamDetail'>
type PapersNav = NativeStackNavigationProp<StudentPapersStackParamList>

export default function ExamDetailScreen() {
  const { params } = useRoute<Route>()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start()
  }, [fadeAnim])

  const { data: exam, isLoading, isError, refetch } = useQuery({
    queryKey: ['studentExam', params.examId],
    queryFn: () => examsApi.getStudentExams().then((list) => list.find((e) => e.id === params.examId)),
  })

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    )
  }

  if (isError || !exam) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.subtle} />
        <Text style={styles.errorText}>Could not load exam details</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const submittedCount = exam.papers?.filter((p) => (p as any).is_submitted_by_me).length ?? 0
  const allSubmitted = exam.papers?.length > 0 && submittedCount === exam.papers.length

  const navigateToPaper = (paper: StudentExamPaper) => {
    // Navigate to the Papers tab's PaperDetail, passing examId
    navigation.navigate('Papers' as any, {
      screen: 'PaperDetail',
      params: { paperId: paper.id, examId: exam.id },
    })
  }

  return (
    <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Exam info card */}
        <View style={[styles.infoCard, shadows.sm]}>
          <Text style={styles.examName}>{exam.name}</Text>
          {exam.category ? <Text style={styles.category}>{exam.category}</Text> : null}

          <View style={styles.metaGrid}>
            {exam.subject_name ? (
              <View style={styles.metaItem}>
                <Ionicons name="book-outline" size={14} color={colors.accent} />
                <Text style={styles.metaLabel}>Subject</Text>
                <Text style={styles.metaValue}>{exam.subject_name}</Text>
              </View>
            ) : null}
            {exam.standard ? (
              <View style={styles.metaItem}>
                <Ionicons name="school-outline" size={14} color={colors.info} />
                <Text style={styles.metaLabel}>Class</Text>
                <Text style={styles.metaValue}>
                  {exam.standard}{exam.division ? `-${exam.division}` : ''}
                </Text>
              </View>
            ) : null}
            {exam.exam_date ? (
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={14} color={colors.warning} />
                <Text style={styles.metaLabel}>Date</Text>
                <Text style={styles.metaValue}>
                  {new Date(exam.exam_date).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </Text>
              </View>
            ) : null}
            {exam.duration_minutes ? (
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color={colors.muted} />
                <Text style={styles.metaLabel}>Duration</Text>
                <Text style={styles.metaValue}>{exam.duration_minutes} min</Text>
              </View>
            ) : null}
          </View>

          {exam.teacher_name ? (
            <View style={styles.teacherRow}>
              <Ionicons name="person-outline" size={13} color={colors.muted} />
              <Text style={styles.teacherText}>By {exam.teacher_name}</Text>
            </View>
          ) : null}
        </View>

        {/* Results not published banner */}
        {allSubmitted && !exam.results_published ? (
          <View style={styles.waitBanner}>
            <Ionicons name="hourglass-outline" size={16} color={colors.warningText} />
            <Text style={styles.waitText}>
              Results are not yet published by your teacher.
            </Text>
          </View>
        ) : null}

        {/* Papers section */}
        <Text style={styles.sectionLabel}>
          Papers · {exam.papers?.length ?? 0}
        </Text>

        {exam.papers?.length === 0 ? (
          <View style={styles.noPapers}>
            <Text style={styles.noPapersText}>No papers linked to this exam yet.</Text>
          </View>
        ) : (
          exam.papers?.map((paper) => {
            const submitted = !!(paper as any).is_submitted_by_me
            return (
              <TouchableOpacity
                key={paper.id}
                style={[styles.paperCard, shadows.xs]}
                onPress={() => navigateToPaper(paper)}
                activeOpacity={0.78}
              >
                <View style={styles.paperTop}>
                  <Text style={styles.paperTitle} numberOfLines={2}>{paper.title}</Text>
                  <StatusBadge status={submitted ? 'submitted' : 'not_started'} size="sm" />
                </View>

                <View style={styles.paperMeta}>
                  <View style={styles.chip}>
                    <Ionicons name="star-outline" size={11} color={colors.accent} />
                    <Text style={styles.chipText}>{paper.total_marks} marks</Text>
                  </View>
                </View>

                {submitted && exam.results_published ? (
                  <View style={styles.resultRow}>
                    <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                    <Text style={styles.resultText}>Submitted · Results available</Text>
                  </View>
                ) : submitted ? (
                  <View style={styles.resultRow}>
                    <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                    <Text style={styles.resultText}>Submitted</Text>
                  </View>
                ) : null}

                <View style={styles.paperFooter}>
                  <Text style={styles.viewLink}>{submitted ? 'View result' : 'Attempt paper'}</Text>
                  <Ionicons name="arrow-forward" size={13} color={colors.accent} />
                </View>
              </TouchableOpacity>
            )
          })
        )}
      </ScrollView>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface1 },
  content: { paddingHorizontal: spacing[5], paddingTop: spacing[4], gap: spacing[3] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3] },
  errorText: { fontSize: 14, color: colors.muted },
  retryBtn: { paddingHorizontal: spacing[5], paddingVertical: spacing[2], backgroundColor: colors.accent, borderRadius: radius.full },
  retryText: { color: colors.white, fontWeight: '700' },

  infoCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing[5],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing[3],
  },
  examName: { fontSize: 20, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  category: { fontSize: 13, color: colors.muted },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  metaItem: { minWidth: '40%', gap: 2 },
  metaLabel: { fontSize: 10, fontWeight: '700', color: colors.subtle, textTransform: 'uppercase', letterSpacing: 0.5 },
  metaValue: { fontSize: 13, fontWeight: '600', color: colors.ink },
  teacherRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  teacherText: { fontSize: 13, color: colors.muted },

  waitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.warningBg,
    borderRadius: radius.lg,
    padding: spacing[3],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.warningBorder,
  },
  waitText: { flex: 1, fontSize: 13, color: colors.warningText, lineHeight: 18 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.subtle,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: spacing[2],
  },
  noPapers: { padding: spacing[4], alignItems: 'center' },
  noPapersText: { fontSize: 14, color: colors.muted },

  paperCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing[2],
  },
  paperTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing[2] },
  paperTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.ink, lineHeight: 21 },
  paperMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
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
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  resultText: { fontSize: 12, color: colors.success, fontWeight: '600' },
  paperFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: spacing[1],
  },
  viewLink: { fontSize: 12, color: colors.accent, fontWeight: '700' },
})
