import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Animated,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRoute, useNavigation } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import type { StudentPapersStackParamList } from '../../navigation/StudentTabs'
import { papersApi } from '../../api/papers'
import { colors } from '../../theme/colors'
import { spacing, radius, shadows } from '../../theme/spacing'
import type { QuestionInPaper } from '../../types'
import QuestionRenderer from '../../components/QuestionRenderer'
import ScoreRing from '../../components/ScoreRing'
import ConfirmModal from '../../components/ConfirmModal'

type Route = RouteProp<StudentPapersStackParamList, 'Quiz'>

type Stage = 'overview' | 'quiz' | 'summary'

// ─── Stage 1: Overview ────────────────────────────────────────────────────────

function OverviewStage({
  paper,
  showAnswerKey,
  setShowAnswerKey,
  showHints,
  setShowHints,
  onStart,
}: {
  paper: { title: string; questions: QuestionInPaper[]; duration_minutes?: number | null }
  showAnswerKey: boolean
  setShowAnswerKey: (v: boolean) => void
  showHints: boolean
  setShowHints: (v: boolean) => void
  onStart: () => void
}) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.overviewContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.overviewIcon}>
        <Ionicons name="flash" size={36} color={colors.accent} />
      </View>
      <Text style={styles.overviewTitle}>{paper.title}</Text>
      <Text style={styles.overviewSub}>Interactive Practice Quiz</Text>

      <View style={styles.overviewStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{paper.questions.length}</Text>
          <Text style={styles.statLabel}>Questions</Text>
        </View>
        {paper.duration_minutes ? (
          <View style={[styles.statItem, styles.statDivider]}>
            <Text style={styles.statValue}>{paper.duration_minutes}</Text>
            <Text style={styles.statLabel}>Min</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.optionsCard}>
        <Text style={styles.optionsTitle}>Quiz Options</Text>
        <View style={styles.optionRow}>
          <View style={styles.optionLeft}>
            <Ionicons name="eye-outline" size={18} color={colors.ink} />
            <View>
              <Text style={styles.optionLabel}>Show answer after each question</Text>
              <Text style={styles.optionSub}>See correct answer immediately</Text>
            </View>
          </View>
          <Switch
            value={showAnswerKey}
            onValueChange={setShowAnswerKey}
            trackColor={{ false: colors.surface2, true: colors.accent }}
            thumbColor={colors.white}
          />
        </View>
        <View style={[styles.optionRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
          <View style={styles.optionLeft}>
            <Ionicons name="bulb-outline" size={18} color={colors.ink} />
            <View>
              <Text style={styles.optionLabel}>Enable AI hints</Text>
              <Text style={styles.optionSub}>Get hints, explanations & feedback</Text>
            </View>
          </View>
          <Switch
            value={showHints}
            onValueChange={setShowHints}
            trackColor={{ false: colors.surface2, true: colors.accent }}
            thumbColor={colors.white}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.startBtn} onPress={onStart} activeOpacity={0.82}>
        <Ionicons name="play" size={18} color={colors.white} />
        <Text style={styles.startBtnText}>Start Quiz</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

// ─── Stage 2: Quiz ────────────────────────────────────────────────────────────

function QuizStage({
  questions,
  answers,
  onAnswer,
  showAnswerKey,
  showHints,
  paperId,
  onFinish,
}: {
  questions: QuestionInPaper[]
  answers: Record<string, string>
  onAnswer: (questionId: string, value: string) => void
  showAnswerKey: boolean
  showHints: boolean
  paperId: string
  onFinish: () => void
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [assistCache, setAssistCache] = useState<Record<string, Record<string, string>>>({})
  const [assistLoading, setAssistLoading] = useState(false)
  const [assistText, setAssistText] = useState<string | null>(null)
  const [assistMode, setAssistMode] = useState<string | null>(null)
  const [flagged, setFlagged] = useState<Set<string>>(new Set())
  const [showFinishModal, setShowFinishModal] = useState(false)

  const question = questions[currentIndex]
  const answer = answers[question.id] ?? ''
  const isChecked = checked[question.id]
  const isFlagged = flagged.has(question.id)

  const unansweredCount = questions.filter((q) => !answers[q.id]).length

  const checkAnswer = () => {
    setChecked((prev) => ({ ...prev, [question.id]: true }))
  }

  const fetchAssist = async (mode: 'hint' | 'explain' | 'mistake') => {
    const cacheKey = `${question.id}:${mode}`
    const cached = assistCache[question.id]?.[mode]
    if (cached) {
      setAssistText(cached)
      setAssistMode(mode)
      return
    }
    setAssistLoading(true)
    setAssistText(null)
    setAssistMode(mode)
    try {
      const result = await papersApi.getInteractiveAssist(paperId, {
        question_id: question.id,
        mode,
        student_answer: mode === 'mistake' ? answer : undefined,
      })
      setAssistCache((prev) => ({
        ...prev,
        [question.id]: { ...(prev[question.id] ?? {}), [mode]: result.content },
      }))
      setAssistText(result.content)
    } catch {
      setAssistText('Failed to get AI response. Please try again.')
    } finally {
      setAssistLoading(false)
    }
  }

  const goNext = () => {
    setAssistText(null)
    setAssistMode(null)
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const goPrev = () => {
    setAssistText(null)
    setAssistMode(null)
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const toggleFlag = () => {
    setFlagged((prev) => {
      const next = new Set(prev)
      if (next.has(question.id)) next.delete(question.id)
      else next.add(question.id)
      return next
    })
  }

  // Check if answer is correct (simple string comparison for non-MCQ)
  const isCorrect = isChecked && question.answer_key != null && answer
    ? String(question.answer_key).trim().toLowerCase() === answer.trim().toLowerCase() ||
      (question.question_type === 'mcq' && question.answer_key === answer)
    : null

  return (
    <View style={{ flex: 1 }}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentIndex + 1) / questions.length) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {questions.length}
        </Text>
        <TouchableOpacity onPress={toggleFlag} style={styles.flagBtn}>
          <Ionicons
            name={isFlagged ? 'flag' : 'flag-outline'}
            size={18}
            color={isFlagged ? colors.warning : colors.muted}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.quizContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Question card */}
        <View style={[styles.questionCard, shadows.sm]}>
          <View style={styles.questionHeader}>
            <View style={styles.qNumBadge}>
              <Text style={styles.qNumText}>Q{question.question_number || currentIndex + 1}</Text>
            </View>
            <View style={styles.qTypeBadge}>
              <Text style={styles.qTypeText}>{question.question_type.replace(/_/g, ' ')}</Text>
            </View>
            <View style={styles.qMarksBadge}>
              <Text style={styles.qMarksText}>{question.marks} {question.marks === 1 ? 'mark' : 'marks'}</Text>
            </View>
          </View>
          <Text style={styles.questionText}>{question.question_text}</Text>
          {question.topic_name ? (
            <Text style={styles.topicLabel}>{question.topic_name}</Text>
          ) : null}

          <QuestionRenderer
            question={question}
            answer={answer}
            onChange={(val) => onAnswer(question.id, val)}
            disabled={isChecked}
            showAnswerKey={isChecked && showAnswerKey}
          />

          {/* Check answer button */}
          {!isChecked && answer ? (
            <TouchableOpacity style={styles.checkBtn} onPress={checkAnswer} activeOpacity={0.82}>
              <Text style={styles.checkBtnText}>Check Answer</Text>
            </TouchableOpacity>
          ) : null}

          {/* Feedback */}
          {isChecked && isCorrect !== null ? (
            <View style={[styles.feedbackRow, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
              <Ionicons
                name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                size={18}
                color={isCorrect ? colors.success : colors.danger}
              />
              <Text style={[styles.feedbackText, { color: isCorrect ? colors.successText : colors.dangerText }]}>
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </Text>
            </View>
          ) : null}
        </View>

        {/* AI Hints section */}
        {showHints ? (
          <View style={[styles.hintsCard, shadows.xs]}>
            <Text style={styles.hintsTitle}>AI Assist</Text>
            <View style={styles.hintBtns}>
              <TouchableOpacity
                style={styles.hintBtn}
                onPress={() => fetchAssist('hint')}
                disabled={assistLoading}
              >
                <Ionicons name="bulb-outline" size={14} color={colors.accent} />
                <Text style={styles.hintBtnText}>Hint</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.hintBtn}
                onPress={() => fetchAssist('explain')}
                disabled={assistLoading}
              >
                <Ionicons name="information-circle-outline" size={14} color={colors.info} />
                <Text style={[styles.hintBtnText, { color: colors.infoText }]}>Explain</Text>
              </TouchableOpacity>
              {isChecked && isCorrect === false ? (
                <TouchableOpacity
                  style={styles.hintBtn}
                  onPress={() => fetchAssist('mistake')}
                  disabled={assistLoading}
                >
                  <Ionicons name="search-outline" size={14} color={colors.warning} />
                  <Text style={[styles.hintBtnText, { color: colors.warningText }]}>Why wrong?</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            {assistLoading ? (
              <ActivityIndicator color={colors.accent} size="small" style={{ marginTop: spacing[3] }} />
            ) : assistText ? (
              <View style={styles.assistResult}>
                <Text style={styles.assistMode}>{assistMode?.toUpperCase()}</Text>
                <Text style={styles.assistText}>{assistText}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      {/* Navigation bar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
          onPress={goPrev}
          disabled={currentIndex === 0}
        >
          <Ionicons name="chevron-back" size={20} color={currentIndex === 0 ? colors.subtle : colors.accent} />
          <Text style={[styles.navBtnText, currentIndex === 0 && { color: colors.subtle }]}>Prev</Text>
        </TouchableOpacity>

        {currentIndex === questions.length - 1 ? (
          <TouchableOpacity style={styles.finishBtn} onPress={() => setShowFinishModal(true)}>
            <Text style={styles.finishBtnText}>Finish</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.nextBtn} onPress={goNext}>
            <Text style={styles.nextBtnText}>Next</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>

      <ConfirmModal
        visible={showFinishModal}
        title="Finish Quiz?"
        message={
          unansweredCount > 0
            ? `You have ${unansweredCount} unanswered question${unansweredCount > 1 ? 's' : ''}. Finish anyway?`
            : 'Are you ready to see your results?'
        }
        confirmLabel="Finish"
        cancelLabel="Continue"
        onConfirm={() => { setShowFinishModal(false); onFinish() }}
        onCancel={() => setShowFinishModal(false)}
      />
    </View>
  )
}

// ─── Stage 3: Summary ────────────────────────────────────────────────────────

function SummaryStage({
  questions,
  answers,
  onRedo,
  onClose,
}: {
  questions: QuestionInPaper[]
  answers: Record<string, string>
  onRedo: () => void
  onClose: () => void
}) {
  const insets = useSafeAreaInsets()

  // Calculate score: for MCQ/T-F compare directly; for others give full mark if answered
  let totalScore = 0
  let totalMax = 0
  const topicStats: Record<string, { correct: number; total: number }> = {}

  questions.forEach((q) => {
    const ans = answers[q.id] ?? ''
    totalMax += q.marks
    const topic = q.topic_name ?? 'General'
    if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0 }
    topicStats[topic].total += 1

    if (q.answer_key && ans) {
      const isCorrect =
        q.question_type === 'mcq' || q.question_type === 'true_false'
          ? String(q.answer_key).trim() === ans.trim()
          : ans.trim().length > 0 // subjective: credit if answered

      if (isCorrect) {
        totalScore += q.marks
        topicStats[topic].correct += 1
      }
    }
  })

  // Sort: wrong/unanswered first
  const sortedQs = [...questions].sort((a, b) => {
    const aCorrect = answers[a.id] && a.answer_key
      ? (a.question_type === 'mcq' || a.question_type === 'true_false'
          ? String(a.answer_key) === answers[a.id]
          : true)
      : false
    const bCorrect = answers[b.id] && b.answer_key
      ? (b.question_type === 'mcq' || b.question_type === 'true_false'
          ? String(b.answer_key) === answers[b.id]
          : true)
      : false
    if (!aCorrect && bCorrect) return -1
    if (aCorrect && !bCorrect) return 1
    return 0
  })

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.summaryContent, { paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryTitle}>Quiz Complete!</Text>
        <ScoreRing score={totalScore} maxScore={totalMax} size={140} />
        <TouchableOpacity style={styles.redoBtn} onPress={onRedo}>
          <Ionicons name="refresh" size={16} color={colors.accent} />
          <Text style={styles.redoBtnText}>Redo Quiz</Text>
        </TouchableOpacity>
      </View>

      {/* Topic stats */}
      {Object.keys(topicStats).length > 0 ? (
        <View style={styles.statsSection}>
          <Text style={styles.statsSectionTitle}>Topic Performance</Text>
          {Object.entries(topicStats).map(([topic, stat]) => (
            <View key={topic} style={styles.topicRow}>
              <Text style={styles.topicName} numberOfLines={1}>{topic}</Text>
              <View style={styles.topicBar}>
                <View
                  style={[
                    styles.topicBarFill,
                    { width: `${(stat.correct / stat.total) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.topicPct}>
                {stat.correct}/{stat.total}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Per-question review */}
      <Text style={styles.reviewTitle}>Question Review</Text>
      {sortedQs.map((q, i) => {
        const ans = answers[q.id]
        const hasKey = !!q.answer_key
        const isCorrect = ans && hasKey
          ? (q.question_type === 'mcq' || q.question_type === 'true_false'
              ? String(q.answer_key) === ans
              : null) // subjective: null (can't auto-judge)
          : null

        return (
          <View key={q.id} style={[styles.reviewCard, shadows.xs]}>
            <View style={styles.reviewCardHeader}>
              <Text style={styles.reviewQNum}>Q{q.question_number || i + 1}</Text>
              {isCorrect === true ? (
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              ) : isCorrect === false ? (
                <Ionicons name="close-circle" size={18} color={colors.danger} />
              ) : !ans ? (
                <View style={styles.unansweredBadge}>
                  <Text style={styles.unansweredText}>Unanswered</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.reviewQText} numberOfLines={3}>{q.question_text}</Text>
            {ans ? <Text style={styles.reviewAns}>Your answer: <Text style={styles.reviewAnsVal}>{ans}</Text></Text> : null}
            {hasKey ? <Text style={styles.reviewKey}>Correct: <Text style={styles.reviewKeyVal}>{String(q.answer_key)}</Text></Text> : null}
          </View>
        )
      })}

      <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
        <Text style={styles.closeBtnText}>Done</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

// ─── Main QuizScreen ──────────────────────────────────────────────────────────

export default function QuizScreen() {
  const { params } = useRoute<Route>()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()

  const [stage, setStage] = useState<Stage>('overview')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showAnswerKey, setShowAnswerKey] = useState(true)
  const [showHints, setShowHints] = useState(true)

  const fadeAnim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start()
  }, [fadeAnim])

  const { data: paper, isLoading, isError } = useQuery({
    queryKey: ['paper', params.paperId],
    queryFn: () => papersApi.getById(params.paperId),
  })

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleRedo = () => {
    setAnswers({})
    setStage('overview')
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    )
  }

  if (isError || !paper) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.subtle} />
        <Text style={styles.errorText}>Failed to load paper</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <Animated.View
      style={[
        styles.root,
        { paddingTop: insets.top, paddingBottom: 0 },
        { opacity: fadeAnim },
      ]}
    >
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {stage === 'summary' ? 'Quiz Results' : 'Interactive Quiz'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {stage === 'overview' ? (
        <OverviewStage
          paper={paper}
          showAnswerKey={showAnswerKey}
          setShowAnswerKey={setShowAnswerKey}
          showHints={showHints}
          setShowHints={setShowHints}
          onStart={() => setStage('quiz')}
        />
      ) : stage === 'quiz' ? (
        <QuizStage
          questions={paper.questions}
          answers={answers}
          onAnswer={handleAnswer}
          showAnswerKey={showAnswerKey}
          showHints={showHints}
          paperId={params.paperId}
          onFinish={() => setStage('summary')}
        />
      ) : (
        <SummaryStage
          questions={paper.questions}
          answers={answers}
          onRedo={handleRedo}
          onClose={() => navigation.goBack()}
        />
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3] },
  errorText: { fontSize: 14, color: colors.muted },
  backBtn: { paddingHorizontal: spacing[5], paddingVertical: spacing[2], backgroundColor: colors.accent, borderRadius: radius.full },
  backBtnText: { color: colors.white, fontWeight: '700' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerBack: { width: 36, alignItems: 'flex-start' },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.ink, textAlign: 'center' },

  // Overview
  overviewContent: { padding: spacing[5], gap: spacing[4], alignItems: 'center' },
  overviewIcon: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: colors.accentLight,
    alignItems: 'center', justifyContent: 'center',
  },
  overviewTitle: { fontSize: 22, fontWeight: '800', color: colors.ink, textAlign: 'center', letterSpacing: -0.3 },
  overviewSub: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: -spacing[2] },
  overviewStats: { flexDirection: 'row', gap: spacing[6] },
  statItem: { alignItems: 'center', gap: 4 },
  statDivider: { paddingLeft: spacing[6], borderLeftWidth: 1, borderLeftColor: colors.border },
  statValue: { fontSize: 28, fontWeight: '800', color: colors.accent },
  statLabel: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  optionsCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.xs,
  },
  optionsTitle: { fontSize: 13, fontWeight: '700', color: colors.subtle, textTransform: 'uppercase', letterSpacing: 0.5, padding: spacing[4], paddingBottom: spacing[2] },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing[4], gap: spacing[3] },
  optionLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  optionLabel: { fontSize: 14, fontWeight: '600', color: colors.ink },
  optionSub: { fontSize: 12, color: colors.muted, marginTop: 1 },
  startBtn: {
    width: '100%',
    height: 54,
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  startBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },

  // Quiz
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  progressTrack: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.surface2, overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: colors.accent, borderRadius: 2 },
  progressText: { fontSize: 13, fontWeight: '700', color: colors.ink, minWidth: 44, textAlign: 'center' },
  flagBtn: { padding: spacing[1] },
  quizContent: { padding: spacing[4], gap: spacing[3] },
  questionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing[3],
  },
  questionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], flexWrap: 'wrap' },
  qNumBadge: {
    paddingHorizontal: spacing[3], paddingVertical: 3,
    borderRadius: radius.sm, backgroundColor: colors.accentLight,
  },
  qNumText: { fontSize: 12, fontWeight: '800', color: colors.accentStrong },
  qTypeBadge: {
    paddingHorizontal: spacing[2], paddingVertical: 3,
    borderRadius: radius.full, backgroundColor: colors.surface2,
  },
  qTypeText: { fontSize: 10, fontWeight: '700', color: colors.muted, textTransform: 'uppercase' },
  qMarksBadge: {
    paddingHorizontal: spacing[2], paddingVertical: 3,
    borderRadius: radius.full, backgroundColor: colors.accentLight,
  },
  qMarksText: { fontSize: 10, fontWeight: '700', color: colors.accentStrong },
  questionText: { fontSize: 15, color: colors.ink, lineHeight: 23 },
  topicLabel: { fontSize: 12, color: colors.muted, fontStyle: 'italic' },
  checkBtn: {
    height: 44, backgroundColor: colors.accent, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center', marginTop: spacing[2],
  },
  checkBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  feedbackRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[2],
    padding: spacing[3], borderRadius: radius.md,
  },
  feedbackCorrect: { backgroundColor: colors.successBg },
  feedbackWrong: { backgroundColor: colors.dangerBg },
  feedbackText: { fontSize: 14, fontWeight: '700' },
  hintsCard: {
    backgroundColor: colors.card, borderRadius: radius.xl,
    padding: spacing[4], borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, gap: spacing[3],
  },
  hintsTitle: { fontSize: 13, fontWeight: '700', color: colors.ink },
  hintBtns: { flexDirection: 'row', gap: spacing[2], flexWrap: 'wrap' },
  hintBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing[3], paddingVertical: spacing[2],
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.card,
  },
  hintBtnText: { fontSize: 13, fontWeight: '600', color: colors.accent },
  assistResult: { backgroundColor: colors.accentLight, borderRadius: radius.md, padding: spacing[3], gap: spacing[1] },
  assistMode: { fontSize: 10, fontWeight: '800', color: colors.accent, textTransform: 'uppercase', letterSpacing: 0.5 },
  assistText: { fontSize: 14, color: colors.ink, lineHeight: 21 },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: spacing[2] },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText: { fontSize: 14, fontWeight: '600', color: colors.accent },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.accent, paddingHorizontal: spacing[5], paddingVertical: spacing[3], borderRadius: radius.full,
  },
  nextBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  finishBtn: {
    backgroundColor: colors.success, paddingHorizontal: spacing[5], paddingVertical: spacing[3], borderRadius: radius.full,
  },
  finishBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },

  // Summary
  summaryContent: { padding: spacing[5], gap: spacing[4] },
  summaryHeader: { alignItems: 'center', gap: spacing[3] },
  summaryTitle: { fontSize: 24, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  redoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[2],
    paddingHorizontal: spacing[5], paddingVertical: spacing[2],
    borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.accent,
  },
  redoBtnText: { fontSize: 14, fontWeight: '600', color: colors.accent },
  statsSection: {
    backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing[4],
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, gap: spacing[3],
  },
  statsSectionTitle: { fontSize: 14, fontWeight: '700', color: colors.ink },
  topicRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  topicName: { width: 100, fontSize: 13, color: colors.ink },
  topicBar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.surface2, overflow: 'hidden' },
  topicBarFill: { height: 6, backgroundColor: colors.accent, borderRadius: 3 },
  topicPct: { fontSize: 12, fontWeight: '700', color: colors.muted, minWidth: 36, textAlign: 'right' },
  reviewTitle: { fontSize: 15, fontWeight: '700', color: colors.ink, marginTop: spacing[2] },
  reviewCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing[4],
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, gap: spacing[2],
  },
  reviewCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewQNum: { fontSize: 12, fontWeight: '800', color: colors.muted },
  reviewQText: { fontSize: 14, color: colors.ink, lineHeight: 20 },
  reviewAns: { fontSize: 12, color: colors.muted },
  reviewAnsVal: { color: colors.ink, fontWeight: '600' },
  reviewKey: { fontSize: 12, color: colors.muted },
  reviewKeyVal: { color: colors.success, fontWeight: '600' },
  unansweredBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full, backgroundColor: colors.surface2 },
  unansweredText: { fontSize: 11, fontWeight: '700', color: colors.muted },
  closeBtn: {
    height: 54, backgroundColor: colors.accent, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center', marginTop: spacing[2],
  },
  closeBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
})
