import React from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import type { PapersStackParamList } from '../../navigation'
import { papersApi } from '../../api/papers'
import { colors } from '../../theme/colors'
import { spacing, radius } from '../../theme/spacing'

type Nav = NativeStackNavigationProp<PapersStackParamList, 'PaperDetail'>
type Route = RouteProp<PapersStackParamList, 'PaperDetail'>

export default function PaperDetailScreen() {
  const navigation = useNavigation<Nav>()
  const { params } = useRoute<Route>()

  const { data: paper, isLoading } = useQuery({
    queryKey: ['paper', params.paperId],
    queryFn: () => papersApi.getById(params.paperId),
  })

  // Check if this paper already has a submission — GET /papers/{id}/submission
  // Returns 404 if not submitted yet, so we suppress errors
  const { data: existingSubmission } = useQuery({
    queryKey: ['paper-submission', params.paperId],
    queryFn: () => papersApi.getSubmission(params.paperId),
    enabled: !!paper,
    retry: false,           // don't retry on 404
    throwOnError: false,    // suppress 404 errors silently
  })

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator color={colors.accent} /></View>
  }

  if (!paper) {
    return <View style={styles.center}><Text style={styles.errorText}>Paper not found.</Text></View>
  }

  const alreadySubmitted = !!existingSubmission

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* Title block */}
      <View style={styles.titleBlock}>
        <Text style={styles.title}>{paper.title}</Text>
        {paper.subtitle && <Text style={styles.subtitle}>{paper.subtitle}</Text>}
        <View style={styles.meta}>
          <Text style={styles.metaText}>{paper.total_marks} marks</Text>
          {paper.duration_minutes && <Text style={styles.metaText}>{paper.duration_minutes} min</Text>}
          <Text style={styles.metaText}>{paper.questions.length} questions</Text>
        </View>
      </View>

      {/* Already submitted notice */}
      {alreadySubmitted && existingSubmission && (
        <View style={styles.submittedBanner}>
          <Text style={styles.submittedBannerText}>
            ✓ You've already attempted this paper.
            {existingSubmission.total_score != null && existingSubmission.max_score != null
              ? `  Score: ${existingSubmission.total_score} / ${existingSubmission.max_score}`
              : ''}
          </Text>
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actions}>
        {alreadySubmitted && existingSubmission ? (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              // The submission ID is also the checked-paper ID for B2C students
              navigation.getParent()?.navigate('Results', {
                screen: 'ResultDetail',
                params: { checkedPaperId: existingSubmission.id },
              })
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>View My Results</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('AttemptPaper', { paperId: paper.id })}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Attempt Paper</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('Quiz', { paperId: paper.id })}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryBtnText}>Interactive Quiz</Text>
        </TouchableOpacity>
      </View>

      {/* Questions list */}
      <Text style={styles.sectionLabel}>Questions ({paper.questions.length})</Text>
      {paper.questions.map((q, index) => (
        <View key={q.id} style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <Text style={styles.questionNum}>Q{q.question_number || index + 1}</Text>
            <View style={styles.questionMeta}>
              <Text style={styles.questionType}>{q.question_type.replace('_', ' ')}</Text>
              <Text style={styles.questionMarks}>{q.marks} {q.marks === 1 ? 'mark' : 'marks'}</Text>
            </View>
          </View>
          <Text style={styles.questionText}>{q.question_text}</Text>
          {q.options && Array.isArray(q.options) && (
            <View style={styles.optionsList}>
              {(q.options as Array<{id: string; text: string}>).map((opt, i) => (
                <Text key={opt.id} style={styles.optionText}>
                  {String.fromCharCode(65 + i)}. {opt.text}
                </Text>
              ))}
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface1 },
  content: { padding: spacing[5], paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: colors.muted, fontSize: 14 },
  titleBlock: {
    backgroundColor: colors.card, borderRadius: radius.xl,
    padding: spacing[5], borderWidth: 1, borderColor: colors.border, marginBottom: spacing[4],
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.ink, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.muted, marginBottom: spacing[3] },
  meta: { flexDirection: 'row', gap: spacing[3] },
  metaText: {
    fontSize: 12, fontWeight: '700', color: colors.accent,
    backgroundColor: colors.accentLight, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radius.full,
  },
  submittedBanner: {
    backgroundColor: '#d1fae5', borderRadius: radius.lg,
    padding: spacing[3], borderWidth: 1, borderColor: '#34d399',
    marginBottom: spacing[4],
  },
  submittedBannerText: { color: '#065f46', fontSize: 13, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: spacing[3], marginBottom: spacing[5] },
  primaryBtn: {
    flex: 1, height: 48, backgroundColor: colors.accent,
    borderRadius: radius.full, alignItems: 'center', justifyContent: 'center',
  },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  secondaryBtn: {
    flex: 1, height: 48, backgroundColor: colors.card, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.accent,
  },
  secondaryBtnText: { color: colors.accent, fontWeight: '700', fontSize: 14 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.1, marginBottom: spacing[3],
  },
  questionCard: {
    backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing[4],
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing[3],
  },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[2] },
  questionNum: { fontSize: 13, fontWeight: '800', color: colors.accent },
  questionMeta: { flexDirection: 'row', gap: spacing[2] },
  questionType: {
    fontSize: 10, fontWeight: '700', textTransform: 'uppercase', color: colors.muted,
    backgroundColor: colors.surface2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm,
  },
  questionMarks: { fontSize: 12, fontWeight: '700', color: colors.ink },
  questionText: { fontSize: 14, color: colors.ink, lineHeight: 20 },
  optionsList: { marginTop: spacing[2], gap: 4 },
  optionText: { fontSize: 13, color: colors.muted, paddingLeft: spacing[2] },
})
