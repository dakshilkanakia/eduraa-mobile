import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRoute } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ScanStackParamList } from '../../navigation/ScanNavigator'
import { scanApi } from '../../api/scan'
import { colors } from '../../theme/colors'
import { spacing, radius, shadows } from '../../theme/spacing'
import ScoreRing from '../../components/ScoreRing'
import StatusBadge from '../../components/StatusBadge'
import PageImageViewer from '../../components/PageImageViewer'
import ConfirmModal from '../../components/ConfirmModal'

type Route = RouteProp<ScanStackParamList, 'CheckedPaperDetail'>

export default function CheckedPaperDetailScreen() {
  const { params } = useRoute<Route>()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const [viewerVisible, setViewerVisible] = useState(false)
  const [pageCount, setPageCount] = useState(0)
  const [loadingPageCount, setLoadingPageCount] = useState(false)
  const [confirmReviewVisible, setConfirmReviewVisible] = useState(false)
  const [reviewRequested, setReviewRequested] = useState(false)

  const { data: paper, isLoading, isError, refetch } = useQuery({
    queryKey: ['checkedPaper', params.checkedPaperId],
    queryFn: () => scanApi.getById(params.checkedPaperId),
  })

  const reviewMutation = useMutation({
    mutationFn: () => scanApi.requestManualReview(params.checkedPaperId),
    onSuccess: () => {
      setReviewRequested(true)
      queryClient.invalidateQueries({ queryKey: ['checkedPaper', params.checkedPaperId] })
      queryClient.invalidateQueries({ queryKey: ['checkedPapers'] })
    },
  })

  const openViewer = async () => {
    setLoadingPageCount(true)
    try {
      const count = await scanApi.getPageCount(params.checkedPaperId)
      setPageCount(count)
      setViewerVisible(true)
    } catch {
      // ignore
    } finally {
      setLoadingPageCount(false)
    }
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
        <Text style={styles.errorText}>Could not load paper details</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const isGraded = paper.status === 'graded' || paper.status === 'completed'
  const resultsVisible = isGraded // student always sees their own results
  const confidence = paper.grading_confidence ?? null
  const showScore = paper.total_score != null && paper.max_score != null && isGraded

  const alreadyRequested = reviewRequested || paper.manual_review_requested

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Score + Status */}
      <View style={[styles.headerCard, shadows.sm]}>
        <View style={styles.headerTop}>
          <View style={styles.headerInfo}>
            <Text style={styles.examName} numberOfLines={2}>
              {paper.exam_name ?? 'Unknown Exam'}
            </Text>
            {paper.subject_name ? (
              <View style={styles.chipRow}>
                <View style={styles.chip}>
                  <Ionicons name="book-outline" size={11} color={colors.accent} />
                  <Text style={styles.chipText}>{paper.subject_name}</Text>
                </View>
              </View>
            ) : null}
            <StatusBadge status={paper.status} />
          </View>
          {showScore ? (
            <ScoreRing
              score={paper.total_score!}
              maxScore={paper.max_score!}
              size={100}
            />
          ) : null}
        </View>

        {/* Confidence bar */}
        {confidence != null ? (
          <View style={styles.confidenceSection}>
            <View style={styles.confidenceHeader}>
              <Text style={styles.confidenceLabel}>AI Grading Confidence</Text>
              <Text
                style={[
                  styles.confidencePct,
                  confidence < 0.7 ? styles.confidenceLow : styles.confidenceHigh,
                ]}
              >
                {Math.round(confidence * 100)}%
              </Text>
            </View>
            <View style={styles.confidenceTrack}>
              <View
                style={[
                  styles.confidenceFill,
                  { width: `${confidence * 100}%` as any },
                  confidence < 0.7 ? styles.confidenceFillAmber : styles.confidenceFillGreen,
                ]}
              />
            </View>
          </View>
        ) : null}

        {/* Results not visible banner */}
        {!resultsVisible ? (
          <View style={styles.waitBanner}>
            <Ionicons name="hourglass-outline" size={16} color={colors.warningText} />
            <Text style={styles.waitText}>Results are not yet published by your teacher.</Text>
          </View>
        ) : null}
      </View>

      {/* View Scanned Pages */}
      <TouchableOpacity
        style={[styles.viewPagesBtn, shadows.xs]}
        onPress={openViewer}
        activeOpacity={0.8}
        disabled={loadingPageCount}
      >
        {loadingPageCount ? (
          <ActivityIndicator color={colors.accent} size="small" />
        ) : (
          <Ionicons name="images-outline" size={20} color={colors.accent} />
        )}
        <Text style={styles.viewPagesBtnText}>View Scanned Pages</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.accent} />
      </TouchableOpacity>

      {/* Per-question grading list */}
      {resultsVisible && paper.grading_results && paper.grading_results.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Question-wise Results</Text>
          {paper.grading_results.map((item, idx) => (
            <QuestionResultRow
              key={item.question_id}
              item={item}
              index={idx}
            />
          ))}
        </View>
      ) : null}

      {/* Manual review request */}
      {isGraded ? (
        <View style={[styles.reviewCard, shadows.xs]}>
          <View style={styles.reviewCardHeader}>
            <Ionicons name="person-outline" size={18} color={colors.info} />
            <Text style={styles.reviewCardTitle}>Teacher Review</Text>
          </View>
          <Text style={styles.reviewCardSubtitle}>
            Not satisfied with the AI grading? Request a manual review from your teacher.
          </Text>
          {alreadyRequested ? (
            <View style={styles.reviewRequestedRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.reviewRequestedText}>Review Requested</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.reviewBtn}
              onPress={() => setConfirmReviewVisible(true)}
              activeOpacity={0.8}
              disabled={reviewMutation.isPending}
            >
              {reviewMutation.isPending ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.reviewBtnText}>Request Manual Review</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      ) : null}

      {/* Page Image Viewer Modal */}
      <Modal visible={viewerVisible} animationType="slide" onRequestClose={() => setViewerVisible(false)}>
        <View style={{ flex: 1 }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setViewerVisible(false)} style={styles.modalClose}>
              <Ionicons name="close" size={22} color={colors.ink} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Scanned Pages</Text>
            <View style={{ width: 40 }} />
          </View>
          <PageImageViewer
            checkedPaperId={params.checkedPaperId}
            pageCount={pageCount}
          />
        </View>
      </Modal>

      <ConfirmModal
        visible={confirmReviewVisible}
        title="Request Manual Review"
        message="This will notify your teacher to manually review your graded paper. Are you sure?"
        confirmLabel="Request Review"
        cancelLabel="Cancel"
        onConfirm={() => {
          setConfirmReviewVisible(false)
          reviewMutation.mutate()
        }}
        onCancel={() => setConfirmReviewVisible(false)}
      />
    </ScrollView>
  )
}

function QuestionResultRow({ item, index }: { item: any; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const hasScore = item.score != null && item.max_score != null
  const pct = hasScore ? item.score / item.max_score : null
  const scoreColor =
    pct == null ? colors.muted
    : pct >= 0.8 ? colors.success
    : pct >= 0.5 ? colors.warning
    : colors.danger

  return (
    <View style={styles.qRow}>
      <TouchableOpacity
        style={styles.qHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.8}
      >
        <View style={styles.qNumBadge}>
          <Text style={styles.qNumText}>{item.question_number ?? index + 1}</Text>
        </View>
        <Text style={styles.qText} numberOfLines={expanded ? undefined : 2}>
          {item.question_text ?? `Question ${index + 1}`}
        </Text>
        <View style={[styles.scoreChip, { borderColor: scoreColor }]}>
          <Text style={[styles.scoreChipText, { color: scoreColor }]}>
            {hasScore ? `${item.score}/${item.max_score}` : '–'}
          </Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={colors.subtle}
        />
      </TouchableOpacity>

      {expanded && item.feedback ? (
        <View style={styles.qFeedback}>
          <Text style={styles.qFeedbackLabel}>Feedback</Text>
          <Text style={styles.qFeedbackText}>{item.feedback}</Text>
        </View>
      ) : null}

      {expanded && item.response ? (
        <View style={styles.qResponse}>
          <Text style={styles.qResponseLabel}>Your Answer</Text>
          <Text style={styles.qResponseText}>{item.response}</Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface1 },
  content: { paddingHorizontal: spacing[5], paddingTop: spacing[4], gap: spacing[3] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3] },
  errorText: { fontSize: 14, color: colors.muted },
  retryBtn: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2],
    backgroundColor: colors.accent,
    borderRadius: radius.full,
  },
  retryText: { color: colors.white, fontWeight: '700' },

  headerCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing[5],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing[3],
  },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
  headerInfo: { flex: 1, gap: spacing[2] },
  examName: { fontSize: 18, fontWeight: '800', color: colors.ink, letterSpacing: -0.2 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
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

  confidenceSection: { gap: spacing[2] },
  confidenceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  confidenceLabel: { fontSize: 12, fontWeight: '600', color: colors.muted },
  confidencePct: { fontSize: 12, fontWeight: '700' },
  confidenceLow: { color: colors.warning },
  confidenceHigh: { color: colors.success },
  confidenceTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surface2,
    overflow: 'hidden',
  },
  confidenceFill: { height: 6, borderRadius: 3 },
  confidenceFillAmber: { backgroundColor: colors.warning },
  confidenceFillGreen: { backgroundColor: colors.success },

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

  viewPagesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  viewPagesBtnText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.accent },

  section: { gap: spacing[2] },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.subtle,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: spacing[2],
  },

  qRow: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  qHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[3],
  },
  qNumBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qNumText: { fontSize: 11, fontWeight: '700', color: colors.muted },
  qText: { flex: 1, fontSize: 13, color: colors.ink, lineHeight: 18 },
  scoreChip: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  scoreChipText: { fontSize: 11, fontWeight: '700' },
  qFeedback: {
    paddingHorizontal: spacing[3],
    paddingBottom: spacing[3],
    gap: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing[2],
  },
  qFeedbackLabel: { fontSize: 11, fontWeight: '700', color: colors.subtle, textTransform: 'uppercase' },
  qFeedbackText: { fontSize: 13, color: colors.muted, lineHeight: 18 },
  qResponse: {
    paddingHorizontal: spacing[3],
    paddingBottom: spacing[3],
    gap: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing[2],
  },
  qResponseLabel: { fontSize: 11, fontWeight: '700', color: colors.subtle, textTransform: 'uppercase' },
  qResponseText: { fontSize: 13, color: colors.ink, lineHeight: 18 },

  reviewCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing[3],
  },
  reviewCardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  reviewCardTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  reviewCardSubtitle: { fontSize: 13, color: colors.muted, lineHeight: 18 },
  reviewRequestedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  reviewRequestedText: { fontSize: 14, color: colors.success, fontWeight: '600' },
  reviewBtn: {
    backgroundColor: colors.info,
    borderRadius: radius.full,
    paddingVertical: spacing[3],
    alignItems: 'center',
  },
  reviewBtnText: { fontSize: 15, fontWeight: '700', color: colors.white },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  modalClose: { padding: spacing[2] },
  modalTitle: { fontSize: 17, fontWeight: '700', color: colors.ink },
})
