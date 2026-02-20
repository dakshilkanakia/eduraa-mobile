import React from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { useRoute } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native-stack'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ResultsStackParamList } from '../../navigation'
import { checkedPapersApi } from '../../api/checkedPapers'
import { colors } from '../../theme/colors'
import { spacing, radius } from '../../theme/spacing'

type Route = RouteProp<ResultsStackParamList, 'ResultDetail'>

export default function ResultDetailScreen() {
  const { params } = useRoute<Route>()
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
      Alert.alert('Review Requested', 'Your manual review request has been submitted.')
    },
  })

  if (isLoading) return <View style={styles.center}><ActivityIndicator color={colors.accent} /></View>
  if (!data) return <View style={styles.center}><Text style={styles.muted}>Result not found.</Text></View>

  const scorePercent = data.total_score != null && data.max_score
    ? Math.round((data.total_score / data.max_score) * 100)
    : null

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* Score card */}
      <View style={styles.scoreCard}>
        {data.total_score != null && data.max_score ? (
          <>
            <Text style={styles.scoreValue}>{data.total_score}<Text style={styles.scoreMax}>/{data.max_score}</Text></Text>
            <Text style={styles.scorePercent}>{scorePercent}%</Text>
          </>
        ) : (
          <Text style={styles.scorePending}>Awaiting grading</Text>
        )}
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>{data.status.replace('_', ' ').toUpperCase()}</Text>
          {data.is_teacher_override && <Text style={styles.overrideBadge}>Teacher reviewed</Text>}
        </View>
      </View>

      {/* Feedback */}
      {data.grading_feedback && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>AI Feedback</Text>
          <Text style={styles.feedbackText}>{data.grading_feedback}</Text>
        </View>
      )}

      {/* Manual review */}
      {!data.manual_review_requested && data.status === 'completed' && (
        <TouchableOpacity
          style={styles.reviewBtn}
          onPress={() => reviewMutation.mutate()}
          disabled={reviewMutation.isPending}
        >
          <Text style={styles.reviewBtnText}>Request Manual Review</Text>
        </TouchableOpacity>
      )}

      {data.manual_review_requested && (
        <View style={styles.reviewPending}>
          <Text style={styles.reviewPendingText}>Manual review requested ✓</Text>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface1 },
  content: { padding: spacing[5], gap: spacing[4] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: colors.muted, fontSize: 14 },
  scoreCard: {
    backgroundColor: colors.card, borderRadius: radius['2xl'],
    padding: spacing[6], alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  scoreValue: { fontSize: 56, fontWeight: '800', color: colors.accent },
  scoreMax: { fontSize: 28, color: colors.muted },
  scorePercent: { fontSize: 18, fontWeight: '700', color: colors.muted, marginTop: 4 },
  scorePending: { fontSize: 18, color: colors.muted },
  statusRow: { flexDirection: 'row', gap: spacing[2], marginTop: spacing[3] },
  statusText: { fontSize: 11, fontWeight: '700', color: colors.muted, letterSpacing: 0.1 },
  overrideBadge: {
    fontSize: 11, fontWeight: '700', color: '#059669',
    backgroundColor: '#d1fae5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full,
  },
  section: {
    backgroundColor: colors.card, borderRadius: radius.xl,
    padding: spacing[4], borderWidth: 1, borderColor: colors.border,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.1, marginBottom: spacing[2],
  },
  feedbackText: { fontSize: 14, color: colors.ink, lineHeight: 22 },
  reviewBtn: {
    height: 50, backgroundColor: colors.surface2, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.accent,
  },
  reviewBtnText: { color: colors.accent, fontWeight: '700', fontSize: 15 },
  reviewPending: {
    height: 50, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#d1fae5', borderWidth: 1, borderColor: '#34d399',
  },
  reviewPendingText: { color: '#059669', fontWeight: '700', fontSize: 14 },
})
