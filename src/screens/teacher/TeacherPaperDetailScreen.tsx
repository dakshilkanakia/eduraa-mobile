import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRoute, useNavigation } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { TeacherPapersStackParamList } from '../../navigation/TeacherPapersNavigator'
import { papersApi } from '../../api/papers'
import { colors } from '../../theme/colors'
import { spacing, radius, shadows } from '../../theme/spacing'
import StatusBadge from '../../components/StatusBadge'

type Route = RouteProp<TeacherPapersStackParamList, 'TeacherPaperDetail'>
type Nav = NativeStackNavigationProp<TeacherPapersStackParamList, 'TeacherPaperDetail'>

const Q_TYPE_LABELS: Record<string, string> = {
  mcq: 'MCQ', short_answer: 'Short Ans', long_answer: 'Long Ans',
  fill_blank: 'Fill Blank', match_columns: 'Match Col', true_false: 'True/False',
}

export default function TeacherPaperDetailScreen() {
  const { params } = useRoute<Route>()
  const navigation = useNavigation<Nav>()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const [publishing, setPublishing] = useState(false)

  const { data: paper, isLoading, isError, refetch } = useQuery({
    queryKey: ['paper', params.paperId],
    queryFn: () => papersApi.getById(params.paperId),
  })

  const publishMutation = useMutation({
    mutationFn: () => papersApi.publish(params.paperId),
    onMutate: () => setPublishing(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paper', params.paperId] })
      queryClient.invalidateQueries({ queryKey: ['teacherPapers'] })
    },
    onSettled: () => setPublishing(false),
  })

  const handleExportPdf = async () => {
    Alert.alert('PDF Export', 'PDF export requires expo-file-system. Please ensure it is installed.')
  }

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator color={colors.accent} size="large" /></View>
  }

  if (isError || !paper) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.subtle} />
        <Text style={styles.errorText}>Could not load paper</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Info card */}
      <View style={[styles.infoCard, shadows.sm]}>
        <View style={styles.infoTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.paperTitle}>{paper.title}</Text>
            {paper.subtitle ? <Text style={styles.paperSub}>{paper.subtitle}</Text> : null}
          </View>
          <StatusBadge status={paper.status} />
        </View>

        <View style={styles.chipRow}>
          <View style={styles.chip}>
            <Ionicons name="star-outline" size={11} color={colors.accent} />
            <Text style={styles.chipText}>{paper.total_marks} marks</Text>
          </View>
          {paper.duration_minutes ? (
            <View style={styles.chip}>
              <Ionicons name="time-outline" size={11} color={colors.info} />
              <Text style={[styles.chipText, { color: colors.info }]}>{paper.duration_minutes} min</Text>
            </View>
          ) : null}
          <View style={styles.chip}>
            <Ionicons name="help-circle-outline" size={11} color={colors.success} />
            <Text style={[styles.chipText, { color: colors.success }]}>{paper.questions.length} questions</Text>
          </View>
          {paper.standard ? (
            <View style={styles.chip}>
              <Ionicons name="school-outline" size={11} color={colors.muted} />
              <Text style={styles.chipText}>Std {paper.standard}{paper.division ? `-${paper.division}` : ''}</Text>
            </View>
          ) : null}
        </View>

        {paper.instructions ? (
          <View style={styles.instructionsBanner}>
            <Text style={styles.instructionsLabel}>Instructions</Text>
            <Text style={styles.instructionsText}>{paper.instructions}</Text>
          </View>
        ) : null}
      </View>

      {/* Action buttons */}
      <View style={styles.actionsRow}>
        {paper.status === 'draft' ? (
          <TouchableOpacity
            style={[styles.primaryBtn, publishing && styles.btnDisabled]}
            onPress={() => publishMutation.mutate()}
            disabled={publishing}
            activeOpacity={0.82}
          >
            {publishing ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={16} color={colors.white} />
                <Text style={styles.primaryBtnText}>Publish Paper</Text>
              </>
            )}
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('EditPaper', { paperId: paper.id })}
          activeOpacity={0.82}
        >
          <Ionicons name="pencil-outline" size={16} color={colors.accent} />
          <Text style={styles.secondaryBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleExportPdf} activeOpacity={0.82}>
          <Ionicons name="download-outline" size={16} color={colors.accent} />
          <Text style={styles.secondaryBtnText}>PDF</Text>
        </TouchableOpacity>
      </View>

      {/* Questions */}
      <Text style={styles.sectionLabel}>Questions · {paper.questions.length}</Text>
      {paper.questions.map((q, index) => (
        <View key={q.id} style={[styles.questionCard, shadows.xs]}>
          <View style={styles.questionHeader}>
            <View style={styles.qNum}>
              <Text style={styles.qNumText}>Q{q.question_number || index + 1}</Text>
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <View style={styles.qMeta}>
                <View style={styles.qtypeBadge}>
                  <Text style={styles.qtypeText}>{Q_TYPE_LABELS[q.question_type] ?? q.question_type}</Text>
                </View>
                <View style={styles.marksBadge}>
                  <Text style={styles.marksText}>{q.marks} {q.marks === 1 ? 'mark' : 'marks'}</Text>
                </View>
                {q.difficulty ? (
                  <View style={[
                    styles.diffBadge,
                    q.difficulty === 'hard' && { backgroundColor: colors.dangerBg },
                    q.difficulty === 'medium' && { backgroundColor: colors.warningBg },
                    q.difficulty === 'easy' && { backgroundColor: colors.successBg },
                  ]}>
                    <Text style={[
                      styles.diffText,
                      q.difficulty === 'hard' && { color: colors.danger },
                      q.difficulty === 'medium' && { color: colors.warning },
                      q.difficulty === 'easy' && { color: colors.success },
                    ]}>{q.difficulty}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
          <Text style={styles.questionText}>{q.question_text}</Text>

          {/* MCQ options */}
          {q.question_type === 'mcq' && Array.isArray(q.options) ? (
            <View style={styles.optionsList}>
              {(q.options as Array<{ id: string; text: string }>).map((opt, i) => {
                const isCorrect = q.answer_key === opt.id || q.answer_key === opt.text
                return (
                  <View key={opt.id} style={[styles.optionRow, isCorrect && styles.optionRowCorrect]}>
                    <View style={[styles.optionLetter, isCorrect && styles.optionLetterCorrect]}>
                      <Text style={[styles.optionLetterText, isCorrect && { color: colors.white }]}>
                        {String.fromCharCode(65 + i)}
                      </Text>
                    </View>
                    <Text style={[styles.optionText, isCorrect && { color: colors.successText, fontWeight: '600' }]}>
                      {opt.text}
                    </Text>
                    {isCorrect ? <Ionicons name="checkmark-circle" size={14} color={colors.success} /> : null}
                  </View>
                )
              })}
            </View>
          ) : null}

          {/* Answer key for non-MCQ */}
          {q.answer_key && q.question_type !== 'mcq' ? (
            <View style={styles.answerKey}>
              <Text style={styles.answerKeyLabel}>Answer Key</Text>
              <Text style={styles.answerKeyText}>
                {typeof q.answer_key === 'string' ? q.answer_key : JSON.stringify(q.answer_key)}
              </Text>
            </View>
          ) : null}

          {/* True/False */}
          {q.question_type === 'true_false' && q.answer_key ? (
            <View style={styles.answerKey}>
              <Text style={styles.answerKeyLabel}>Correct Answer</Text>
              <Text style={styles.answerKeyText}>{String(q.answer_key)}</Text>
            </View>
          ) : null}
        </View>
      ))}
    </ScrollView>
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
    backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing[5],
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, gap: spacing[3],
  },
  infoTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
  paperTitle: { fontSize: 20, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  paperSub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full,
    backgroundColor: colors.surface2, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
  },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.muted },
  instructionsBanner: {
    backgroundColor: colors.infoBg, borderRadius: radius.lg, padding: spacing[3],
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.infoBorder, gap: 4,
  },
  instructionsLabel: { fontSize: 10, fontWeight: '700', color: colors.info, textTransform: 'uppercase' },
  instructionsText: { fontSize: 13, color: colors.infoText, lineHeight: 19 },

  actionsRow: { flexDirection: 'row', gap: spacing[2] },
  primaryBtn: {
    flex: 1, height: 46, backgroundColor: colors.accent, borderRadius: radius.full,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2],
  },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  secondaryBtn: {
    height: 46, paddingHorizontal: spacing[4], backgroundColor: colors.card,
    borderRadius: radius.full, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: spacing[2],
    borderWidth: 1.5, borderColor: colors.accent,
  },
  secondaryBtnText: { color: colors.accent, fontWeight: '700', fontSize: 14 },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.subtle,
    textTransform: 'uppercase', letterSpacing: 0.8, marginTop: spacing[2],
  },
  questionCard: {
    backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing[4],
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, gap: spacing[3],
  },
  questionHeader: { flexDirection: 'row', gap: spacing[3], alignItems: 'flex-start' },
  qNum: {
    width: 32, height: 32, borderRadius: radius.md,
    backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  qNumText: { fontSize: 12, fontWeight: '800', color: colors.accentStrong },
  qMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  qtypeBadge: {
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.full,
    backgroundColor: colors.surface2, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
  },
  qtypeText: { fontSize: 10, fontWeight: '700', color: colors.muted, textTransform: 'uppercase' },
  marksBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.full, backgroundColor: colors.accentLight },
  marksText: { fontSize: 10, fontWeight: '700', color: colors.accentStrong },
  diffBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.full },
  diffText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  questionText: { fontSize: 14, color: colors.ink, lineHeight: 22 },
  optionsList: { gap: spacing[2] },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], padding: spacing[2], borderRadius: radius.md },
  optionRowCorrect: { backgroundColor: colors.successBg },
  optionLetter: {
    width: 24, height: 24, borderRadius: radius.sm,
    backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  optionLetterCorrect: { backgroundColor: colors.success },
  optionLetterText: { fontSize: 11, fontWeight: '700', color: colors.muted },
  optionText: { flex: 1, fontSize: 13, color: colors.muted, lineHeight: 20 },
  answerKey: {
    backgroundColor: colors.successBg, borderRadius: radius.md, padding: spacing[3],
    gap: 4, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.successBorder,
  },
  answerKeyLabel: { fontSize: 10, fontWeight: '700', color: colors.successText, textTransform: 'uppercase' },
  answerKeyText: { fontSize: 13, color: colors.successText },
})
