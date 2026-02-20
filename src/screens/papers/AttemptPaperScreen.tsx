import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert
} from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import { useQuery, useMutation } from '@tanstack/react-query'
import type { PapersStackParamList } from '../../navigation'
import { papersApi } from '../../api/papers'
import { colors } from '../../theme/colors'
import { spacing, radius } from '../../theme/spacing'
import type { AnswerEntry } from '../../types'

type Nav = NativeStackNavigationProp<PapersStackParamList, 'AttemptPaper'>
type Route = RouteProp<PapersStackParamList, 'AttemptPaper'>

export default function AttemptPaperScreen() {
  const navigation = useNavigation<Nav>()
  const { params } = useRoute<Route>()

  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [startTime] = useState(Date.now())
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const { data: paper, isLoading } = useQuery({
    queryKey: ['paper', params.paperId],
    queryFn: () => papersApi.getById(params.paperId),
  })

  const submitMutation = useMutation({
    mutationFn: (answerList: AnswerEntry[]) =>
      papersApi.submit(params.paperId, {
        answers: answerList,
        exam_id: params.examId,
        time_taken_seconds: Math.floor((Date.now() - startTime) / 1000),
        mode: 'standard',
      }),
    onSuccess: (data) => {
      // Detect if backend silently returned an existing submission
      // (backend returns existing submission if already submitted for this paper)
      const submissionAge = Date.now() - new Date(data.created_at).getTime()
      const isExistingSubmission = submissionAge > 10_000 // older than 10s = already existed

      if (isExistingSubmission) {
        Alert.alert(
          'Already Submitted',
          `You have already submitted this paper.\n\nYour score: ${data.total_score ?? '?'} / ${data.max_score ?? '?'}\n\nEach paper can only be attempted once. Generate a new paper to try again.`,
          [
            {
              text: 'View Results',
              onPress: () => navigation.getParent()?.navigate('Results', {
                screen: 'ResultDetail',
                params: { checkedPaperId: data.id },
              }),
            },
            { text: 'Back to Papers', onPress: () => navigation.navigate('PapersList') },
          ]
        )
        return
      }

      const scoreMsg = data.total_score != null && data.max_score
        ? `\n\nYour score: ${data.total_score} / ${data.max_score}`
        : ''
      Alert.alert(
        'Paper Submitted!',
        `Your answers have been recorded and graded.${scoreMsg}`,
        [
          {
            text: 'View Results',
            onPress: () => navigation.getParent()?.navigate('Results', {
              screen: 'ResultDetail',
              params: { checkedPaperId: data.id },
            }),
          },
          { text: 'Back to Papers', onPress: () => navigation.navigate('PapersList') },
        ]
      )
    },
    onError: async (err: any) => {
      const status = err?.response?.status
      const detail = err?.response?.data?.detail
      const errData = err?.response?.data

      // On 500, check if submission was actually saved (backend may fail during grading but save answers)
      if (status === 500) {
        try {
          const existing = await papersApi.getSubmission(params.paperId)
          if (existing?.id) {
            Alert.alert(
              'Paper Submitted',
              'Your answers were saved. Grading may take a moment — check the Results tab.',
              [
                {
                  text: 'View Results',
                  onPress: () => navigation.getParent()?.navigate('Results', {
                    screen: 'ResultDetail',
                    params: { checkedPaperId: existing.id },
                  }),
                },
                {
                  text: 'Results List',
                  onPress: () => navigation.getParent()?.navigate('Results', { screen: 'ResultsList' }),
                },
              ]
            )
            return
          }
        } catch (_) {
          // submission not found, show generic error
        }
      }

      // Build a useful message
      let msg: string
      if (typeof detail === 'string') {
        msg = detail
      } else if (Array.isArray(detail)) {
        msg = detail.map((d: any) => d.msg || JSON.stringify(d)).join('\n')
      } else if (typeof errData === 'string') {
        msg = errData
      } else if (status === 500) {
        msg = 'The server encountered an error. Please try again.'
      } else if (status === 422) {
        msg = 'Invalid submission data. Please try again.'
      } else {
        msg = 'Submission failed. Please try again.'
      }

      Alert.alert('Submission Failed', msg, [{ text: 'OK' }])
    },
  })

  // Timer setup
  useEffect(() => {
    if (paper?.duration_minutes) {
      setTimeLeft(paper.duration_minutes * 60)
    }
  }, [paper])

  useEffect(() => {
    if (timeLeft === null) return
    if (timeLeft <= 0) {
      handleSubmit(true)
      return
    }
    timerRef.current = setInterval(() => setTimeLeft((t) => (t ?? 0) - 1), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [timeLeft])

  const handleSubmit = useCallback((autoSubmit = false) => {
    if (!autoSubmit) {
      Alert.alert('Submit Paper', 'Are you sure you want to submit?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit', onPress: () => doSubmit() },
      ])
    } else {
      doSubmit()
    }
  }, [answers, paper])

  const doSubmit = () => {
    const answerList: AnswerEntry[] = (paper?.questions || []).map((q) => ({
      question_id: q.id,
      response: answers[q.id] || '',
    }))
    submitMutation.mutate(answerList)
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  if (isLoading || !paper) {
    return <View style={styles.center}><Text>Loading...</Text></View>
  }

  return (
    <View style={styles.root}>
      {/* Fixed header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle} numberOfLines={1}>{paper.title}</Text>
        <View style={styles.headerRight}>
          {timeLeft !== null && (
            <View style={[styles.timer, timeLeft < 300 && styles.timerWarning]}>
              <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={() => handleSubmit()}
            disabled={submitMutation.isPending}
          >
            <Text style={styles.submitBtnText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {paper.questions.map((q, index) => (
          <View key={q.id} style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <Text style={styles.questionNum}>Q{index + 1}</Text>
              <Text style={styles.questionMarks}>{q.marks} {q.marks === 1 ? 'mark' : 'marks'}</Text>
            </View>
            <Text style={styles.questionText}>{q.question_text}</Text>

            {/* MCQ */}
            {q.question_type === 'mcq' && Array.isArray(q.options) && (
              <View style={styles.mcqOptions}>
                {(q.options as Array<{id: string; text: string}>).map((opt, i) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.mcqOption, answers[q.id] === opt.id && styles.mcqOptionSelected]}
                    onPress={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.id }))}
                  >
                    <Text style={[styles.mcqLabel, answers[q.id] === opt.id && styles.mcqLabelSelected]}>
                      {String.fromCharCode(65 + i)}
                    </Text>
                    <Text style={[styles.mcqText, answers[q.id] === opt.id && styles.mcqTextSelected]}>
                      {opt.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* True/False */}
            {q.question_type === 'true_false' && (
              <View style={styles.tfRow}>
                {['True', 'False'].map((val) => (
                  <TouchableOpacity
                    key={val}
                    style={[styles.tfBtn, answers[q.id] === val && styles.tfBtnSelected]}
                    onPress={() => setAnswers((prev) => ({ ...prev, [q.id]: val }))}
                  >
                    <Text style={[styles.tfText, answers[q.id] === val && styles.tfTextSelected]}>{val}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Text input for short/long/fill */}
            {['short_answer', 'long_answer', 'fill_blank'].includes(q.question_type) && (
              <TextInput
                style={[styles.textInput, q.question_type === 'long_answer' && styles.textInputLong]}
                placeholder="Type your answer here..."
                placeholderTextColor={colors.subtle}
                multiline
                value={answers[q.id] || ''}
                onChangeText={(text) => setAnswers((prev) => ({ ...prev, [q.id]: text }))}
              />
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing[4], backgroundColor: colors.navBg,
    paddingTop: spacing[8],
  },
  headerTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.white, marginRight: spacing[3] },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  timer: {
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  timerWarning: { backgroundColor: 'rgba(239,68,68,0.3)' },
  timerText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  submitBtn: {
    backgroundColor: colors.white, borderRadius: radius.full,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  submitBtnText: { color: colors.accent, fontWeight: '700', fontSize: 13 },
  content: { padding: spacing[4], paddingBottom: 40, gap: spacing[4] },
  questionCard: {
    backgroundColor: colors.card, borderRadius: radius.xl,
    padding: spacing[4], borderWidth: 1, borderColor: colors.border,
  },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing[3] },
  questionNum: { fontSize: 13, fontWeight: '800', color: colors.accent },
  questionMarks: { fontSize: 12, fontWeight: '600', color: colors.muted },
  questionText: { fontSize: 15, color: colors.ink, lineHeight: 22, marginBottom: spacing[3] },
  mcqOptions: { gap: spacing[2] },
  mcqOption: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    padding: spacing[3], borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface2,
  },
  mcqOptionSelected: { borderColor: colors.accent, backgroundColor: colors.accentLight },
  mcqLabel: {
    width: 24, height: 24, borderRadius: 12, textAlign: 'center', lineHeight: 24,
    fontWeight: '700', backgroundColor: colors.border, color: colors.muted, fontSize: 12,
  },
  mcqLabelSelected: { backgroundColor: colors.accent, color: colors.white },
  mcqText: { flex: 1, fontSize: 14, color: colors.ink },
  mcqTextSelected: { color: colors.accentStrong, fontWeight: '600' },
  tfRow: { flexDirection: 'row', gap: spacing[3] },
  tfBtn: {
    flex: 1, height: 44, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface2,
  },
  tfBtnSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  tfText: { fontSize: 14, fontWeight: '700', color: colors.muted },
  tfTextSelected: { color: colors.white },
  textInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg,
    padding: spacing[3], fontSize: 14, color: colors.ink, minHeight: 60,
    backgroundColor: colors.surface2, textAlignVertical: 'top',
  },
  textInputLong: { minHeight: 120 },
})
