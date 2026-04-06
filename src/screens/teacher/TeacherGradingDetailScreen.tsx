import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, Modal, Alert, Switch,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRoute } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { TeacherScanStackParamList } from '../../navigation/TeacherScanNavigator'
import { scanApi } from '../../api/scan'
import { colors } from '../../theme/colors'
import { spacing, radius, shadows } from '../../theme/spacing'
import type { GradingResultItem } from '../../types'
import ScoreRing from '../../components/ScoreRing'
import StatusBadge from '../../components/StatusBadge'
import PageImageViewer from '../../components/PageImageViewer'
import ConfirmModal from '../../components/ConfirmModal'

type Route = RouteProp<TeacherScanStackParamList, 'TeacherGradingDetail'>

interface ScoreOverride {
  score: number
  feedback: string
  edited: boolean
}

export default function TeacherGradingDetailScreen() {
  const { params } = useRoute<Route>()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()

  const [viewerVisible, setViewerVisible] = useState(false)
  const [pageCount, setPageCount] = useState(0)
  const [loadingPageCount, setLoadingPageCount] = useState(false)
  const [overrides, setOverrides] = useState<Record<string, ScoreOverride>>({})
  const [resultsVisible, setResultsVisible] = useState<boolean | null>(null)
  const [publishConfirmVisible, setPublishConfirmVisible] = useState(false)
  const [regradeConfirmVisible, setRegradeConfirmVisible] = useState(false)

  const { data: paper, isLoading, isError, refetch } = useQuery({
    queryKey: ['checkedPaper', params.checkedPaperId],
    queryFn: () => scanApi.getById(params.checkedPaperId),
    onSuccess: (p) => {
      if (resultsVisible === null) setResultsVisible(p.grading_confidence != null)
    },
  })

  const reviewMutation = useMutation({
    mutationFn: (publishResults: boolean) => {
      const updates = Object.entries(overrides)
        .filter(([, v]) => v.edited)
        .map(([questionId, v]) => ({ question_id: questionId, score: v.score, feedback: v.feedback || undefined }))
      return scanApi.teacherReview(params.checkedPaperId, { updates, publish_results: publishResults })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkedPaper', params.checkedPaperId] })
      queryClient.invalidateQueries({ queryKey: ['teacherCheckedPapers'] })
      setOverrides({})
      Alert.alert('Saved', 'Teacher review saved successfully.')
    },
    onError: () => Alert.alert('Error', 'Failed to save review.'),
  })

  const publishMutation = useMutation({
    mutationFn: (visible: boolean) => scanApi.publishResults(params.checkedPaperId, visible),
    onSuccess: (updated) => {
      setResultsVisible(updated.grading_confidence != null)
      queryClient.invalidateQueries({ queryKey: ['checkedPaper', params.checkedPaperId] })
    },
  })

  const regradeMutation = useMutation({
    mutationFn: () => scanApi.regrade(params.checkedPaperId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkedPaper', params.checkedPaperId] })
      Alert.alert('Re-grading started', 'AI is re-grading this paper. Check back shortly.')
    },
    onError: () => Alert.alert('Error', 'Failed to start re-grading.'),
  })

  const openViewer = async () => {
    setLoadingPageCount(true)
    try {
      const count = await scanApi.getPageCount(params.checkedPaperId)
      setPageCount(count)
      setViewerVisible(true)
    } catch { }
    setLoadingPageCount(false)
  }

  const setOverride = (questionId: string, field: 'score' | 'feedback', value: string | number) => {
    setOverrides(prev => ({
      ...prev,
      [questionId]: {
        score: prev[questionId]?.score ?? 0,
        feedback: prev[questionId]?.feedback ?? '',
        edited: true,
        ...prev[questionId],
        [field]: value,
      },
    }))
  }

  const editedCount = Object.values(overrides).filter(v => v.edited).length

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

  const confidence = paper.grading_confidence
  const showScore = paper.total_score != null && paper.max_score != null

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.headerCard, shadows.sm]}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.studentName}>{paper.student_name ?? 'Unknown Student'}</Text>
              <Text style={styles.examName}>{paper.exam_name ?? '—'}{paper.subject_name ? ` · ${paper.subject_name}` : ''}</Text>
              <StatusBadge status={paper.status} />
            </View>
            {showScore ? (
              <ScoreRing score={paper.total_score!} maxScore={paper.max_score!} size={90} />
            ) : null}
          </View>

          {confidence != null ? (
            <View style={styles.confidenceRow}>
              <Text style={styles.confidenceLabel}>AI Confidence</Text>
              <View style={styles.confidenceBar}>
                <View style={[styles.confidenceFill, { width: `${confidence * 100}%` as any }, confidence < 0.7 ? styles.confAmber : styles.confGreen]} />
              </View>
              <Text style={[styles.confidencePct, confidence < 0.7 ? { color: colors.warning } : { color: colors.success }]}>
                {Math.round(confidence * 100)}%
              </Text>
            </View>
          ) : null}
        </View>

        {/* Toolbar */}
        <View style={styles.toolbarRow}>
          <TouchableOpacity style={styles.toolBtn} onPress={openViewer} disabled={loadingPageCount}>
            {loadingPageCount ? <ActivityIndicator size="small" color={colors.accent} /> : <Ionicons name="images-outline" size={18} color={colors.accent} />}
            <Text style={styles.toolBtnText}>Scanned Pages</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolBtn} onPress={() => setRegradeConfirmVisible(true)} disabled={regradeMutation.isPending}>
            {regradeMutation.isPending ? <ActivityIndicator size="small" color={colors.info} /> : <Ionicons name="refresh-outline" size={18} color={colors.info} />}
            <Text style={[styles.toolBtnText, { color: colors.info }]}>Re-grade</Text>
          </TouchableOpacity>
        </View>

        {/* Results visible toggle */}
        <View style={[styles.card, shadows.xs]}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Results visible to student</Text>
            </View>
            <Switch
              value={resultsVisible ?? false}
              onValueChange={(v) => {
                setResultsVisible(v)
                publishMutation.mutate(v)
              }}
              trackColor={{ true: colors.accent }}
              disabled={publishMutation.isPending}
            />
          </View>
        </View>

        {/* Per-question grading */}
        {paper.grading_results && paper.grading_results.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Question Results</Text>
            {paper.grading_results.map((item, idx) => (
              <QuestionOverrideRow
                key={item.question_id}
                item={item}
                index={idx}
                override={overrides[item.question_id]}
                onScoreChange={(v) => setOverride(item.question_id, 'score', v)}
                onFeedbackChange={(v) => setOverride(item.question_id, 'feedback', v)}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>

      {/* Bottom action bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing[2] }]}>
        <TouchableOpacity
          style={[styles.saveBtn, (editedCount === 0 || reviewMutation.isPending) && styles.saveBtnDisabled]}
          onPress={() => reviewMutation.mutate(false)}
          disabled={editedCount === 0 || reviewMutation.isPending}
        >
          {reviewMutation.isPending ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={styles.saveBtnText}>Save Review{editedCount > 0 ? ` (${editedCount})` : ''}</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.publishBtn, (editedCount === 0 || reviewMutation.isPending) && styles.saveBtnDisabled]}
          onPress={() => setPublishConfirmVisible(true)}
          disabled={editedCount === 0 || reviewMutation.isPending}
        >
          <Text style={styles.publishBtnText}>Save & Publish</Text>
        </TouchableOpacity>
      </View>

      {/* Scanned pages modal */}
      <Modal visible={viewerVisible} animationType="slide" onRequestClose={() => setViewerVisible(false)}>
        <View style={{ flex: 1 }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setViewerVisible(false)} style={styles.modalClose}>
              <Ionicons name="close" size={22} color={colors.ink} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Scanned Pages</Text>
            <View style={{ width: 40 }} />
          </View>
          <PageImageViewer checkedPaperId={params.checkedPaperId} pageCount={pageCount} />
        </View>
      </Modal>

      <ConfirmModal
        visible={publishConfirmVisible}
        title="Save & Publish Results"
        message="This will save your review and make results visible to the student."
        confirmLabel="Save & Publish"
        cancelLabel="Cancel"
        onConfirm={() => { setPublishConfirmVisible(false); reviewMutation.mutate(true) }}
        onCancel={() => setPublishConfirmVisible(false)}
      />

      <ConfirmModal
        visible={regradeConfirmVisible}
        title="Re-grade with AI"
        message="AI will re-grade this paper. Any manual overrides will be lost."
        confirmLabel="Re-grade"
        cancelLabel="Cancel"
        onConfirm={() => { setRegradeConfirmVisible(false); regradeMutation.mutate() }}
        onCancel={() => setRegradeConfirmVisible(false)}
      />
    </View>
  )
}

function QuestionOverrideRow({ item, index, override, onScoreChange, onFeedbackChange }: {
  item: GradingResultItem; index: number;
  override?: ScoreOverride;
  onScoreChange: (v: number) => void;
  onFeedbackChange: (v: string) => void;
}) {
  const [expanded, setExpanded] = useState(false)
  const [showOverride, setShowOverride] = useState(false)
  const displayScore = override?.edited ? override.score : (item.score ?? 0)
  const maxScore = item.max_score ?? 0
  const pct = maxScore > 0 ? displayScore / maxScore : null
  const scoreColor = pct == null ? colors.muted : pct >= 0.8 ? colors.success : pct >= 0.5 ? colors.warning : colors.danger

  return (
    <View style={styles.qRow}>
      <TouchableOpacity style={styles.qHeader} onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
        <View style={styles.qNumBadge}><Text style={styles.qNumText}>{item.question_number ?? index + 1}</Text></View>
        <Text style={styles.qText} numberOfLines={expanded ? undefined : 2}>{item.question_text ?? `Question ${index + 1}`}</Text>
        <View style={[styles.scoreChip, { borderColor: scoreColor }]}>
          <Text style={[styles.scoreChipText, { color: scoreColor }]}>
            {displayScore}/{maxScore}
          </Text>
        </View>
        {override?.edited ? <View style={styles.editedDot} /> : null}
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.subtle} />
      </TouchableOpacity>

      {expanded ? (
        <View style={styles.qBody}>
          {item.response ? (
            <View style={styles.qSection}>
              <Text style={styles.qSectionLabel}>Student's Answer</Text>
              <Text style={styles.qSectionText}>{item.response}</Text>
            </View>
          ) : null}
          {item.feedback ? (
            <View style={styles.qSection}>
              <Text style={styles.qSectionLabel}>AI Feedback</Text>
              <Text style={styles.qSectionText}>{item.feedback}</Text>
            </View>
          ) : null}
          {item.manual_review_requested ? (
            <View style={styles.reviewRequestedBadge}>
              <Ionicons name="person-outline" size={12} color={colors.infoText} />
              <Text style={styles.reviewRequestedText}>Student requested manual review</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.overrideToggle} onPress={() => setShowOverride(!showOverride)}>
            <Text style={styles.overrideToggleText}>{showOverride ? 'Hide' : 'Override Score'}</Text>
            <Ionicons name={showOverride ? 'chevron-up' : 'chevron-down'} size={13} color={colors.accent} />
          </TouchableOpacity>

          {showOverride ? (
            <View style={styles.overrideSection}>
              <View style={styles.overrideScoreRow}>
                <Text style={styles.overrideLabel}>Score (0–{maxScore})</Text>
                <TextInput
                  style={styles.overrideInput}
                  value={String(override?.edited ? override.score : (item.score ?? 0))}
                  onChangeText={v => onScoreChange(Math.min(maxScore, Math.max(0, parseInt(v, 10) || 0)))}
                  keyboardType="number-pad"
                />
              </View>
              <Text style={styles.overrideLabel}>Feedback</Text>
              <TextInput
                style={styles.overrideFeedback}
                value={override?.feedback ?? item.feedback ?? ''}
                onChangeText={onFeedbackChange}
                placeholder="Enter feedback..."
                placeholderTextColor={colors.placeholder}
                multiline
              />
            </View>
          ) : null}
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
  retryBtn: { paddingHorizontal: spacing[5], paddingVertical: spacing[2], backgroundColor: colors.accent, borderRadius: radius.full },
  retryText: { color: colors.white, fontWeight: '700' },

  headerCard: { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing[5], borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, gap: spacing[3] },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
  studentName: { fontSize: 18, fontWeight: '800', color: colors.ink },
  examName: { fontSize: 13, color: colors.muted, marginTop: 2, marginBottom: spacing[2] },
  confidenceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  confidenceLabel: { fontSize: 11, color: colors.muted, width: 90 },
  confidenceBar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.surface2, overflow: 'hidden' },
  confidenceFill: { height: 6, borderRadius: 3 },
  confAmber: { backgroundColor: colors.warning },
  confGreen: { backgroundColor: colors.success },
  confidencePct: { fontSize: 11, fontWeight: '700', width: 32, textAlign: 'right' },

  toolbarRow: { flexDirection: 'row', gap: spacing[3] },
  toolBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing[3], borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  toolBtnText: { fontSize: 13, fontWeight: '600', color: colors.accent },

  card: { backgroundColor: colors.card, borderRadius: radius.xl, paddingHorizontal: spacing[4], borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[3] },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: colors.ink },

  section: { gap: spacing[2] },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.subtle, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: spacing[2] },

  qRow: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, overflow: 'hidden' },
  qHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], padding: spacing[3] },
  qNumBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  qNumText: { fontSize: 11, fontWeight: '700', color: colors.muted },
  qText: { flex: 1, fontSize: 13, color: colors.ink },
  scoreChip: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: radius.full, borderWidth: 1 },
  scoreChipText: { fontSize: 11, fontWeight: '700' },
  editedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },

  qBody: { paddingHorizontal: spacing[3], paddingBottom: spacing[3], gap: spacing[2], borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  qSection: { gap: 4, paddingTop: spacing[2] },
  qSectionLabel: { fontSize: 10, fontWeight: '700', color: colors.subtle, textTransform: 'uppercase' },
  qSectionText: { fontSize: 13, color: colors.muted, lineHeight: 18 },
  reviewRequestedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.infoBg, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  reviewRequestedText: { fontSize: 11, fontWeight: '700', color: colors.infoText },

  overrideToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: spacing[2] },
  overrideToggleText: { fontSize: 13, fontWeight: '700', color: colors.accent },
  overrideSection: { gap: spacing[2], backgroundColor: colors.surface1, borderRadius: radius.md, padding: spacing[3] },
  overrideScoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  overrideLabel: { fontSize: 12, fontWeight: '600', color: colors.muted },
  overrideInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing[3], paddingVertical: spacing[2], fontSize: 16, fontWeight: '700', color: colors.ink, width: 70, textAlign: 'center' },
  overrideFeedback: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing[3], fontSize: 13, color: colors.ink, minHeight: 70, textAlignVertical: 'top' },

  bottomBar: { flexDirection: 'row', gap: spacing[3], paddingHorizontal: spacing[5], paddingTop: spacing[3], backgroundColor: colors.card, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  saveBtn: { flex: 1, height: 48, backgroundColor: colors.accent, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: colors.white },
  publishBtn: { flex: 1, height: 48, backgroundColor: colors.success, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  publishBtnText: { fontSize: 14, fontWeight: '700', color: colors.white },

  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], paddingVertical: spacing[3], borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, backgroundColor: colors.card },
  modalClose: { padding: spacing[2] },
  modalTitle: { fontSize: 17, fontWeight: '700', color: colors.ink },
})
