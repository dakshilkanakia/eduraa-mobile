import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRoute, useNavigation } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useQuery } from '@tanstack/react-query'
import type { ResultsStackParamList } from '../../navigation'
import { checkedPapersApi } from '../../api/checkedPapers'
import { colors } from '../../theme/colors'
import { spacing, radius, shadows } from '../../theme/spacing'
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
  const rounded = Math.round(pct * 100)

  const grade =
    pct >= 0.9  ? { label: 'Excellent', color: colors.success } :
    pct >= 0.75 ? { label: 'Good',      color: '#16A34A' } :
    pct >= 0.5  ? { label: 'Average',   color: colors.warning } :
    pct >= 0.33 ? { label: 'Needs Work', color: '#EA580C' } :
    { label: 'Try Again', color: colors.accent }

  // Animate the percentage text
  const countAnim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(countAnim, { toValue: rounded, duration: 1000, delay: 200, useNativeDriver: false }).start()
  }, [countAnim, rounded])

  return (
    <View style={ring.wrap}>
      <View style={[ring.ring, { borderColor: grade.color }]}>
        <Text style={[ring.pct, { color: grade.color }]}>{rounded}%</Text>
        <Text style={ring.fraction}>{score}/{max}</Text>
      </View>
      <View style={[ring.gradePill, { backgroundColor: grade.color + '18' }]}>
        <Text style={[ring.gradeText, { color: grade.color }]}>{grade.label}</Text>
      </View>
    </View>
  )
}

const ring = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing[3] },
  ring: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  pct: { fontSize: 30, fontWeight: '900', letterSpacing: -1 },
  fraction: { fontSize: 13, color: colors.muted, fontWeight: '600', marginTop: -2 },
  gradePill: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
  },
  gradeText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
})

// ─── Question Card ────────────────────────────────────────────────────────────

function QuestionCard({ item, index }: { item: GradingResultItem; index: number }) {
  const [expanded, setExpanded] = useState(index === 0)
  const rotateAnim = useRef(new Animated.Value(index === 0 ? 1 : 0)).current

  const toggleExpand = () => {
    const toValue = expanded ? 0 : 1
    Animated.spring(rotateAnim, { toValue, useNativeDriver: true, speed: 18, bounciness: 2 }).start()
    setExpanded(e => !e)
  }

  const qNum = item.question_number ?? index + 1
  const typeLabel = QUESTION_TYPE_LABELS[item.question_type || ''] || (item.question_type || '').replace(/_/g, ' ')
  const hasScore = item.score != null && item.max_score != null
  const pct = hasScore ? item.score! / item.max_score! : null
  const correct = pct === 1
  const partial = pct !== null && pct > 0 && pct < 1
  const wrong = pct === 0

  const chipColor = correct ? colors.success : partial ? colors.warning : wrong ? colors.accent : colors.muted
  const chipBg = correct ? colors.successBg : partial ? colors.warningBg : wrong ? colors.dangerBg : colors.surface2

  const arrowRotation = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] })

  return (
    <View style={qc.card}>
      <TouchableOpacity style={qc.header} onPress={toggleExpand} activeOpacity={0.72}>
        <View style={[qc.qNumBadge, { backgroundColor: chipBg, borderColor: chipColor + '60' }]}>
          <Text style={[qc.qNumText, { color: chipColor }]}>Q{qNum}</Text>
        </View>
        <View style={qc.headerMid}>
          <Text style={qc.typeText}>{typeLabel}</Text>
          {item.question_text ? (
            <Text style={qc.previewText} numberOfLines={1}>{item.question_text}</Text>
          ) : null}
        </View>
        <View style={qc.headerRight}>
          {hasScore && (
            <View style={[qc.scoreChip, { backgroundColor: chipBg, borderColor: chipColor + '50' }]}>
              <Text style={[qc.scoreChipText, { color: chipColor }]}>
                {correct ? '✓' : wrong ? '✗' : '~'} {item.score}/{item.max_score}
              </Text>
            </View>
          )}
          <Animated.View style={{ transform: [{ rotate: arrowRotation }] }}>
            <Ionicons name="chevron-down" size={16} color={colors.subtle} />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={qc.detail}>
          {item.question_text ? (
            <View style={qc.questionBlock}>
              <Text style={qc.blockLabel}>Question</Text>
              <Text style={qc.questionText}>{item.question_text}</Text>
            </View>
          ) : null}

          <View style={qc.answerBlock}>
            <Text style={qc.blockLabel}>Your Answer</Text>
            {item.response ? (
              <Text style={[
                qc.answerText,
                correct && { color: colors.success },
                wrong && { color: colors.accent },
              ]}>
                {item.response}
              </Text>
            ) : (
              <Text style={qc.noAnswer}>— Not answered —</Text>
            )}
          </View>

          {(wrong || partial) && item.expected_answer ? (
            <View style={[qc.answerBlock, qc.expectedBlock]}>
              <Text style={[qc.blockLabel, { color: colors.success }]}>Expected Answer</Text>
              <Text style={qc.expectedText}>{String(item.expected_answer)}</Text>
            </View>
          ) : null}

          {item.feedback ? (
            <View style={qc.feedbackBlock}>
              <View style={qc.feedbackIconWrap}>
                <Ionicons name="sparkles" size={13} color={colors.info} />
              </View>
              <Text style={qc.feedbackText}>{item.feedback}</Text>
            </View>
          ) : null}

          {item.recommendation ? (
            <View style={qc.tipBlock}>
              <View style={qc.tipIconWrap}>
                <Ionicons name="bulb-outline" size={13} color={colors.warning} />
              </View>
              <Text style={qc.tipText}>{item.recommendation}</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  )
}

const qc = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  qNumBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  qNumText: { fontSize: 13, fontWeight: '800' },
  headerMid: { flex: 1, gap: 2, overflow: 'hidden' },
  typeText: { fontSize: 12, fontWeight: '700', color: colors.muted },
  previewText: { fontSize: 12, color: colors.subtle },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  scoreChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  scoreChipText: { fontSize: 12, fontWeight: '800' },

  detail: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface1,
    padding: spacing[4],
    gap: spacing[3],
  },
  questionBlock: { gap: 4 },
  blockLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.subtle,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  questionText: { fontSize: 14, color: colors.ink, lineHeight: 21 },
  answerBlock: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing[3],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: 4,
  },
  answerText: { fontSize: 13, color: colors.ink, lineHeight: 20 },
  noAnswer: { fontSize: 13, color: colors.subtle, fontStyle: 'italic' },
  expectedBlock: {
    borderColor: colors.successBorder,
    backgroundColor: colors.successBg,
  },
  expectedText: { fontSize: 13, color: colors.successText, lineHeight: 20 },

  feedbackBlock: {
    flexDirection: 'row',
    gap: spacing[3],
    backgroundColor: colors.infoBg,
    borderRadius: radius.md,
    padding: spacing[3],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.infoBorder,
    alignItems: 'flex-start',
  },
  feedbackIconWrap: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  feedbackText: { fontSize: 13, color: colors.infoText, flex: 1, lineHeight: 20 },

  tipBlock: {
    flexDirection: 'row',
    gap: spacing[3],
    backgroundColor: colors.warningBg,
    borderRadius: radius.md,
    padding: spacing[3],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.warningBorder,
    alignItems: 'flex-start',
  },
  tipIconWrap: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tipText: { fontSize: 13, color: colors.warningText, flex: 1, lineHeight: 20 },
})

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ResultDetailScreen() {
  const { params } = useRoute<Route>()
  const navigation = useNavigation<Nav>()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()

  const id = params.checkedPaperId || ''
  const { data, isLoading } = useQuery({
    queryKey: ['checked-paper', id],
    queryFn: () => checkedPapersApi.getById(id),
    enabled: !!id,
  })

  const fadeAnim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start()
  }, [fadeAnim])

  const hPad = width < 380 ? spacing[4] : spacing[5]

  if (!id) {
    return (
      <View style={styles.center}>
        <Ionicons name="document-outline" size={40} color={colors.subtle} />
        <Text style={styles.mutedText}>No result selected</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('ResultsList')}>
          <Text style={styles.backBtnText}>← Back to Results</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={[styles.mutedText, { marginTop: spacing[3] }]}>Loading result…</Text>
      </View>
    )
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.subtle} />
        <Text style={styles.mutedText}>Result not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('ResultsList')}>
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
  const dateStr = new Date(data.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.content, { paddingHorizontal: hPad, paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Back link */}
        <TouchableOpacity style={styles.backLink} onPress={() => navigation.navigate('ResultsList')} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={15} color={colors.accent} />
          <Text style={styles.backLinkText}>Back to Results</Text>
        </TouchableOpacity>

        {/* Paper info */}
        <Text style={styles.paperTitle}>
          {data.exam_name || data.subject_name || `Paper #${data.id.slice(0, 8)}`}
        </Text>
        <Text style={styles.paperMeta}>
          {data.subject_name && data.exam_name ? `${data.subject_name}  ·  ` : ''}
          {dateStr}
        </Text>

        {/* Score card */}
        <View style={[styles.scoreCard, shadows.sm]}>
          {hasScore ? (
            <>
              <ScoreRing score={data.total_score!} max={data.max_score!} />

              {questions.length > 0 && (
                <View style={styles.statRow}>
                  <View style={[styles.statChip, { backgroundColor: colors.successBg }]}>
                    <Text style={[styles.statNum, { color: colors.success }]}>{correctCount}</Text>
                    <Text style={[styles.statLabel, { color: colors.success }]}>Correct</Text>
                  </View>
                  {partialCount > 0 && (
                    <View style={[styles.statChip, { backgroundColor: colors.warningBg }]}>
                      <Text style={[styles.statNum, { color: colors.warning }]}>{partialCount}</Text>
                      <Text style={[styles.statLabel, { color: colors.warning }]}>Partial</Text>
                    </View>
                  )}
                  <View style={[styles.statChip, { backgroundColor: colors.dangerBg }]}>
                    <Text style={[styles.statNum, { color: colors.accent }]}>{wrongCount}</Text>
                    <Text style={[styles.statLabel, { color: colors.accent }]}>Wrong</Text>
                  </View>
                </View>
              )}
            </>
          ) : (
            <View style={styles.awaitingWrap}>
              <View style={styles.awaitingIcon}>
                <Ionicons name="hourglass-outline" size={28} color={colors.warning} />
              </View>
              <Text style={styles.awaitingTitle}>Awaiting grading</Text>
              <Text style={styles.awaitingBody}>Your paper is being reviewed. Check back soon.</Text>
            </View>
          )}

          {/* Status */}
          <View style={styles.statusRow}>
            {(data.status === 'graded' || data.status === 'completed') ? (
              <View style={styles.statusGraded}>
                <Ionicons name="checkmark-circle" size={13} color={colors.success} />
                <Text style={styles.statusTextGraded}>Graded</Text>
              </View>
            ) : data.status === 'pending_manual_review' ? (
              <View style={styles.statusPending}>
                <Ionicons name="time" size={13} color={colors.warning} />
                <Text style={styles.statusTextPending}>Pending Review</Text>
              </View>
            ) : (
              <View style={styles.statusDefault}>
                <Text style={styles.statusTextDefault}>{data.status.replace(/_/g, ' ')}</Text>
              </View>
            )}
            {data.is_teacher_override && (
              <View style={styles.overrideBadge}>
                <Ionicons name="school-outline" size={11} color={colors.info} />
                <Text style={styles.overrideText}>Teacher reviewed</Text>
              </View>
            )}
          </View>
        </View>

        {/* AI Feedback */}
        {data.grading_feedback ? (
          <View style={[styles.feedbackCard, shadows.xs]}>
            <View style={styles.feedbackHeader}>
              <View style={styles.feedbackIconWrap}>
                <Ionicons name="sparkles" size={14} color={colors.info} />
              </View>
              <Text style={styles.feedbackTitle}>AI Feedback</Text>
            </View>
            <Text style={styles.feedbackText}>{data.grading_feedback}</Text>
          </View>
        ) : null}

        {/* Question Breakdown */}
        {questions.length > 0 && (
          <View style={styles.questionsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>
                Question Breakdown
              </Text>
              <Text style={styles.sectionCount}>{questions.length} questions</Text>
            </View>
            <Text style={styles.sectionHint}>Tap any question to expand</Text>
            <View style={{ gap: spacing[2] }}>
              {questions.map((q, idx) => (
                <QuestionCard key={q.question_id || idx} item={q} index={idx} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface1 },
  content: { paddingTop: spacing[4], gap: spacing[4] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3] },
  mutedText: { fontSize: 14, color: colors.muted },
  backBtn: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2],
    backgroundColor: colors.accent,
    borderRadius: radius.full,
  },
  backBtnText: { color: colors.white, fontWeight: '700' },

  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1] + 2,
    alignSelf: 'flex-start',
    paddingVertical: spacing[1],
    marginBottom: -spacing[1],
  },
  backLinkText: { fontSize: 13, fontWeight: '700', color: colors.accent },

  paperTitle: { fontSize: 20, fontWeight: '800', color: colors.ink, lineHeight: 26, letterSpacing: -0.2 },
  paperMeta: { fontSize: 12, color: colors.muted, marginTop: -spacing[2] },

  scoreCard: {
    backgroundColor: colors.card,
    borderRadius: radius['2xl'],
    padding: spacing[6],
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing[4],
  },
  statRow: { flexDirection: 'row', gap: spacing[3] },
  statChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.xl,
    alignItems: 'center',
    minWidth: 76,
    gap: 2,
  },
  statNum: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },

  awaitingWrap: { alignItems: 'center', gap: spacing[2] },
  awaitingIcon: {
    width: 60,
    height: 60,
    borderRadius: radius['2xl'],
    backgroundColor: colors.warningBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  awaitingTitle: { fontSize: 17, fontWeight: '700', color: colors.ink },
  awaitingBody: { fontSize: 13, color: colors.muted, textAlign: 'center', maxWidth: 220 },

  statusRow: { flexDirection: 'row', gap: spacing[2], alignItems: 'center' },
  statusGraded: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.successBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.successBorder,
  },
  statusTextGraded: { fontSize: 12, fontWeight: '700', color: colors.success },
  statusPending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.warningBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.warningBorder,
  },
  statusTextPending: { fontSize: 12, fontWeight: '700', color: colors.warning },
  statusDefault: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.surface2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  statusTextDefault: { fontSize: 12, fontWeight: '700', color: colors.muted, textTransform: 'capitalize' },
  overrideBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.infoBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.infoBorder,
  },
  overrideText: { fontSize: 11, fontWeight: '700', color: colors.info },

  feedbackCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing[3],
  },
  feedbackHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  feedbackIconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.infoBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackTitle: { fontSize: 13, fontWeight: '700', color: colors.ink },
  feedbackText: { fontSize: 14, color: colors.ink, lineHeight: 22 },

  questionsSection: { gap: spacing[2] },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.subtle,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionCount: { fontSize: 12, color: colors.muted },
  sectionHint: { fontSize: 11, color: colors.subtle, marginTop: -spacing[1] },
})
