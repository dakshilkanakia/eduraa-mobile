import React, { useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator
} from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ResultsStackParamList } from '../../navigation'
import { checkedPapersApi } from '../../api/checkedPapers'
import { colors } from '../../theme/colors'
import { spacing, radius } from '../../theme/spacing'
import type { GradingResultItem } from '../../types'

type Route = RouteProp<ResultsStackParamList, 'ResultDetail'>
type Nav = NativeStackNavigationProp<ResultsStackParamList, 'ResultDetail'>

const QUESTION_TYPE_LABELS: Record<string, string> = {
  mcq: 'MCQ',
  short_answer: 'Short Answer',
  long_answer: 'Long Answer',
  fill_blank: 'Fill in Blank',
  match_columns: 'Match Columns',
  true_false: 'True / False',
}

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, max }: { score: number; max: number }) {
  const pct = Math.min(1, score / max)
  const grade =
    pct >= 0.9 ? { label: 'Excellent', color: '#059669' } :
    pct >= 0.75 ? { label: 'Good', color: '#16a34a' } :
    pct >= 0.5 ? { label: 'Average', color: '#d97706' } :
    pct >= 0.33 ? { label: 'Needs Work', color: '#ea580c' } :
    { label: 'Try Again', color: colors.accent }

  return (
    <View style={ringStyles.wrap}>
      <View style={[ringStyles.ring, { borderColor: grade.color }]}>
        <Text style={[ringStyles.pct, { color: grade.color }]}>
          {Math.round(pct * 100)}%
        </Text>
        <Text style={ringStyles.fraction}>{score}/{max}</Text>
      </View>
      <Text style={[ringStyles.grade, { color: grade.color }]}>{grade.label}</Text>
    </View>
  )
}

const ringStyles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 6 },
  ring: {
    width: 110, height: 110, borderRadius: 55,
    borderWidth: 6, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.card,
  },
  pct: { fontSize: 28, fontWeight: '900' },
  fraction: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  grade: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
})

// ─── Question Card ────────────────────────────────────────────────────────────

function QuestionCard({ item, index }: { item: GradingResultItem; index: number }) {
  const [expanded, setExpanded] = useState(index === 0)

  const qNum = item.question_number ?? index + 1
  const typeLabel = QUESTION_TYPE_LABELS[item.question_type || ''] || (item.question_type || '').replace(/_/g, ' ')
  const hasScore = item.score != null && item.max_score != null
  const pct = hasScore ? item.score! / item.max_score! : null
  const correct = pct === 1
  const partial = pct !== null && pct > 0 && pct < 1
  const wrong = pct === 0

  const chipColor =
    correct ? '#059669' :
    partial ? '#d97706' :
    wrong ? colors.accent :
    colors.muted

  const chipBg =
    correct ? '#d1fae5' :
    partial ? '#fef3c7' :
    wrong ? '#ffe4e6' :
    colors.surface2

  return (
    <View style={qc.card}>
      {/* Header — always visible, tap to expand */}
      <TouchableOpacity style={qc.header} onPress={() => setExpanded(e => !e)} activeOpacity={0.7}>
        <View style={qc.headerLeft}>
          <View style={[qc.numBadge, { backgroundColor: chipBg, borderColor: chipColor }]}>
            <Text style={[qc.numText, { color: chipColor }]}>Q{qNum}</Text>
          </View>
          <Text style={qc.typeText} numberOfLines={1}>{typeLabel}</Text>
        </View>
        <View style={qc.headerRight}>
          {hasScore && (
            <View style={[qc.scoreChip, { backgroundColor: chipBg, borderColor: chipColor }]}>
              <Text style={[qc.scoreChipText, { color: chipColor }]}>
                {correct ? '✓' : wrong ? '✗' : '~'} {item.score}/{item.max_score}
              </Text>
            </View>
          )}
          <Text style={qc.chevron}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {/* Question text preview — always visible */}
      {item.question_text ? (
        <Text style={qc.questionText} numberOfLines={expanded ? undefined : 2}>
          {item.question_text}
        </Text>
      ) : null}

      {/* Expanded detail */}
      {expanded ? (
        <View style={qc.detail}>
          {/* Your answer */}
          <View style={qc.answerBlock}>
            <Text style={qc.answerLabel}>Your Answer</Text>
            {item.response ? (
              <Text style={[qc.answerText, wrong && qc.answerWrong, correct && qc.answerCorrect]}>
                {item.response}
              </Text>
            ) : (
              <Text style={qc.noAnswer}>— Not answered —</Text>
            )}
          </View>

          {/* Expected answer (only show if wrong/partial) */}
          {(wrong || partial) && item.expected_answer ? (
            <View style={[qc.answerBlock, qc.expectedBlock]}>
              <Text style={qc.answerLabel}>Expected Answer</Text>
              <Text style={qc.expectedText}>{String(item.expected_answer)}</Text>
            </View>
          ) : null}

          {/* AI feedback */}
          {item.feedback ? (
            <View style={qc.feedbackBlock}>
              <Text style={qc.feedbackIcon}>🤖</Text>
              <Text style={qc.feedbackText}>{item.feedback}</Text>
            </View>
          ) : null}

          {/* Study tip */}
          {item.recommendation ? (
            <View style={qc.tipBlock}>
              <Text style={qc.tipIcon}>💡</Text>
              <Text style={qc.tipText}>{item.recommendation}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  )
}

const qc = StyleSheet.create({
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing[3], paddingVertical: spacing[3],
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  numBadge: {
    borderWidth: 1, borderRadius: radius.md,
    paddingHorizontal: 8, paddingVertical: 2, minWidth: 36, alignItems: 'center',
  },
  numText: { fontSize: 12, fontWeight: '800' },
  typeText: { fontSize: 12, color: colors.muted, fontWeight: '600', flex: 1 },
  scoreChip: {
    borderWidth: 1, borderRadius: radius.full,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  scoreChipText: { fontSize: 12, fontWeight: '800' },
  chevron: { fontSize: 10, color: colors.subtle, marginLeft: 2 },
  questionText: {
    fontSize: 13, color: colors.ink, lineHeight: 19,
    paddingHorizontal: spacing[3], paddingBottom: spacing[2],
  },
  detail: {
    borderTopWidth: 1, borderTopColor: colors.border,
    padding: spacing[3], gap: spacing[3],
    backgroundColor: colors.surface1,
  },
  answerBlock: {
    backgroundColor: colors.card, borderRadius: radius.md,
    padding: spacing[3], borderWidth: 1, borderColor: colors.border, gap: 4,
  },
  answerLabel: { fontSize: 10, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.3 },
  answerText: { fontSize: 13, color: colors.ink, lineHeight: 19 },
  answerCorrect: { color: '#059669' },
  answerWrong: { color: colors.accent },
  noAnswer: { fontSize: 13, color: colors.subtle, fontStyle: 'italic' },
  expectedBlock: { borderColor: '#34d399', backgroundColor: '#f0fdf4' },
  expectedText: { fontSize: 13, color: '#065f46', lineHeight: 19 },
  feedbackBlock: {
    flexDirection: 'row', gap: spacing[2],
    backgroundColor: '#f8fafc', borderRadius: radius.md,
    padding: spacing[3], borderWidth: 1, borderColor: colors.border,
  },
  feedbackIcon: { fontSize: 14, marginTop: 1 },
  feedbackText: { fontSize: 13, color: colors.ink, flex: 1, lineHeight: 19 },
  tipBlock: {
    flexDirection: 'row', gap: spacing[2],
    backgroundColor: '#fffbeb', borderRadius: radius.md,
    padding: spacing[3], borderWidth: 1, borderColor: '#fde68a',
  },
  tipIcon: { fontSize: 14, marginTop: 1 },
  tipText: { fontSize: 13, color: '#92400e', flex: 1, lineHeight: 19 },
})

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ResultDetailScreen() {
  const { params } = useRoute<Route>()
  const navigation = useNavigation<Nav>()
  const queryClient = useQueryClient()

  const id = params.checkedPaperId || ''

  const { data, isLoading } = useQuery({
    queryKey: ['checked-paper', id],
    queryFn: () => checkedPapersApi.getById(id),
    enabled: !!id,
  })

  const reviewMutation = useMutation({
    mutationFn: () => checkedPapersApi.requestManualReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checked-paper', id] })
      Alert.alert('Review Requested', 'A teacher will review your paper shortly.')
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.response?.data?.detail || 'Could not submit review request.')
    },
  })

  if (!id) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>No result selected.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back to Results</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={[styles.muted, { marginTop: spacing[3] }]}>Loading result…</Text>
      </View>
    )
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Result not found.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back to Results</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const hasScore = data.total_score != null && data.max_score != null && data.max_score > 0
  const questions = data.grading_results ?? []
  const correctCount = questions.filter(q => q.score != null && q.max_score != null && q.score === q.max_score).length
  const wrongCount = questions.filter(q => q.score === 0).length
  const partialCount = questions.filter(q => q.score != null && q.max_score != null && q.score! > 0 && q.score! < q.max_score!).length

  const canRequestReview = !data.manual_review_requested && (data.status === 'graded' || data.status === 'completed')
  const dateStr = new Date(data.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>

      {/* ← Back */}
      <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back to Results</Text>
      </TouchableOpacity>

      {/* Paper identity */}
      <Text style={styles.paperTitle}>
        {data.exam_name || data.subject_name || `Paper #${data.id.slice(0, 8)}`}
      </Text>
      <Text style={styles.paperMeta}>
        {data.subject_name && data.exam_name ? `${data.subject_name}  ·  ` : ''}Submitted {dateStr}
      </Text>

      {/* Score card */}
      <View style={styles.scoreCard}>
        {hasScore ? (
          <>
            <ScoreRing score={data.total_score!} max={data.max_score!} />

            {/* Mini stat row */}
            {questions.length > 0 && (
              <View style={styles.statRow}>
                <View style={[styles.statChip, { backgroundColor: '#d1fae5' }]}>
                  <Text style={[styles.statNum, { color: '#059669' }]}>{correctCount}</Text>
                  <Text style={[styles.statLabel, { color: '#059669' }]}>Correct</Text>
                </View>
                {partialCount > 0 && (
                  <View style={[styles.statChip, { backgroundColor: '#fef3c7' }]}>
                    <Text style={[styles.statNum, { color: '#d97706' }]}>{partialCount}</Text>
                    <Text style={[styles.statLabel, { color: '#d97706' }]}>Partial</Text>
                  </View>
                )}
                <View style={[styles.statChip, { backgroundColor: '#ffe4e6' }]}>
                  <Text style={[styles.statNum, { color: colors.accent }]}>{wrongCount}</Text>
                  <Text style={[styles.statLabel, { color: colors.accent }]}>Wrong</Text>
                </View>
              </View>
            )}
          </>
        ) : (
          <View style={styles.awaitingWrap}>
            <Text style={styles.awaitingIcon}>⏳</Text>
            <Text style={styles.awaitingText}>Awaiting grading</Text>
            <Text style={styles.awaitingBody}>Your paper is being graded. Check back soon.</Text>
          </View>
        )}

        {/* Status badge */}
        <View style={styles.statusRow}>
          {data.status === 'graded' || data.status === 'completed' ? (
            <View style={styles.statusGraded}>
              <Text style={styles.statusTextGraded}>✓ Graded</Text>
            </View>
          ) : data.status === 'pending_manual_review' ? (
            <View style={styles.statusPending}>
              <Text style={styles.statusTextPending}>⏳ Pending Review</Text>
            </View>
          ) : (
            <View style={styles.statusDefault}>
              <Text style={styles.statusTextDefault}>{data.status.replace(/_/g, ' ')}</Text>
            </View>
          )}
          {data.is_teacher_override && (
            <View style={styles.overrideBadge}>
              <Text style={styles.overrideBadgeText}>Teacher reviewed</Text>
            </View>
          )}
        </View>
      </View>

      {/* Overall AI Feedback */}
      {data.grading_feedback ? (
        <View style={styles.feedbackCard}>
          <Text style={styles.sectionLabel}>AI Feedback</Text>
          <Text style={styles.feedbackText}>{data.grading_feedback}</Text>
        </View>
      ) : null}

      {/* Question Breakdown */}
      {questions.length > 0 ? (
        <View style={styles.questionsSection}>
          <Text style={styles.sectionLabel}>
            Question Breakdown  ·  {questions.length} question{questions.length !== 1 ? 's' : ''}
          </Text>
          <Text style={styles.sectionHint}>Tap any question to expand</Text>
          <View style={styles.questionsList}>
            {questions.map((q, idx) => (
              <QuestionCard key={q.question_id || idx} item={q} index={idx} />
            ))}
          </View>
        </View>
      ) : null}

      {/* Manual review / review pending */}
      {canRequestReview ? (
        <TouchableOpacity
          style={styles.reviewBtn}
          onPress={() => reviewMutation.mutate()}
          disabled={reviewMutation.isPending}
          activeOpacity={0.85}
        >
          {reviewMutation.isPending ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <>
              <Text style={styles.reviewBtnTitle}>Request Manual Review</Text>
              <Text style={styles.reviewBtnBody}>Ask a teacher to re-check this paper</Text>
            </>
          )}
        </TouchableOpacity>
      ) : null}

      {data.manual_review_requested ? (
        <View style={styles.reviewPending}>
          <Text style={styles.reviewPendingText}>✓ Manual review requested</Text>
          <Text style={styles.reviewPendingBody}>A teacher will review your paper.</Text>
        </View>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface1 },
  content: { padding: spacing[4], paddingBottom: 40, gap: spacing[4] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3] },
  muted: { color: colors.muted, fontSize: 14 },

  backRow: { paddingVertical: 2 },
  backText: { color: colors.accent, fontWeight: '700', fontSize: 14 },
  backBtn: {
    paddingHorizontal: spacing[5], paddingVertical: spacing[2],
    backgroundColor: colors.accent, borderRadius: radius.full,
  },
  backBtnText: { color: colors.white, fontWeight: '700' },

  paperTitle: { fontSize: 20, fontWeight: '800', color: colors.ink, lineHeight: 26 },
  paperMeta: { fontSize: 12, color: colors.muted, marginTop: -spacing[2] },

  scoreCard: {
    backgroundColor: colors.card, borderRadius: radius['2xl'],
    padding: spacing[5], alignItems: 'center', borderWidth: 1, borderColor: colors.border,
    gap: spacing[4],
  },
  statRow: { flexDirection: 'row', gap: spacing[3] },
  statChip: {
    paddingHorizontal: spacing[4], paddingVertical: spacing[2],
    borderRadius: radius.lg, alignItems: 'center', minWidth: 70,
  },
  statNum: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },

  awaitingWrap: { alignItems: 'center', gap: 6 },
  awaitingIcon: { fontSize: 36 },
  awaitingText: { fontSize: 18, fontWeight: '700', color: colors.ink },
  awaitingBody: { fontSize: 13, color: colors.muted, textAlign: 'center' },

  statusRow: { flexDirection: 'row', gap: spacing[2], alignItems: 'center' },
  statusGraded: {
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: radius.full, backgroundColor: '#d1fae5', borderWidth: 1, borderColor: '#34d399',
  },
  statusTextGraded: { fontSize: 12, fontWeight: '700', color: '#059669' },
  statusPending: {
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: radius.full, backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fbbf24',
  },
  statusTextPending: { fontSize: 12, fontWeight: '700', color: '#d97706' },
  statusDefault: {
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: radius.full, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border,
  },
  statusTextDefault: { fontSize: 12, fontWeight: '700', color: colors.muted, textTransform: 'capitalize' },
  overrideBadge: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: radius.full, backgroundColor: '#dbeafe', borderWidth: 1, borderColor: '#93c5fd',
  },
  overrideBadgeText: { fontSize: 11, fontWeight: '700', color: '#1d4ed8' },

  feedbackCard: {
    backgroundColor: colors.card, borderRadius: radius.xl,
    padding: spacing[4], borderWidth: 1, borderColor: colors.border, gap: spacing[2],
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.2,
  },
  feedbackText: { fontSize: 14, color: colors.ink, lineHeight: 22 },

  questionsSection: { gap: spacing[2] },
  sectionHint: { fontSize: 11, color: colors.subtle, marginTop: -spacing[1] },
  questionsList: { gap: spacing[2] },

  reviewBtn: {
    backgroundColor: colors.surface2, borderRadius: radius.xl,
    padding: spacing[4], borderWidth: 1, borderColor: colors.accent,
    alignItems: 'center', gap: 4,
  },
  reviewBtnTitle: { color: colors.accent, fontWeight: '700', fontSize: 15 },
  reviewBtnBody: { color: colors.muted, fontSize: 12 },

  reviewPending: {
    backgroundColor: '#d1fae5', borderRadius: radius.xl,
    padding: spacing[4], borderWidth: 1, borderColor: '#34d399',
    alignItems: 'center', gap: 4,
  },
  reviewPendingText: { color: '#059669', fontWeight: '700', fontSize: 15 },
  reviewPendingBody: { color: '#065f46', fontSize: 12 },
})
