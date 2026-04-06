import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Switch, Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRoute, useNavigation } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { TeacherExamsStackParamList } from '../../navigation/TeacherExamsNavigator'
import { examsApi } from '../../api/exams'
import { colors } from '../../theme/colors'
import { spacing, radius, shadows } from '../../theme/spacing'
import ConfirmModal from '../../components/ConfirmModal'

type Route = RouteProp<TeacherExamsStackParamList, 'TeacherExamDetail'>
type Nav = NativeStackNavigationProp<TeacherExamsStackParamList, 'TeacherExamDetail'>

export default function TeacherExamDetailScreen() {
  const { params } = useRoute<Route>()
  const navigation = useNavigation<Nav>()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const [deleteVisible, setDeleteVisible] = useState(false)

  const { data: exams, isLoading, isError, refetch } = useQuery({
    queryKey: ['teacherExams'],
    queryFn: examsApi.getTeacherExams,
  })

  const exam = exams?.find(e => e.id === params.examId)

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof examsApi.update>[1]) => examsApi.update(params.examId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherExams'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => examsApi.delete(params.examId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherExams'] })
      navigation.goBack()
    },
    onError: () => Alert.alert('Error', 'Failed to delete exam.'),
  })

  const toggleResultsPublished = () => {
    if (!exam) return
    updateMutation.mutate({ results_published: !exam.results_published })
  }

  const toggleAutoGrade = () => {
    if (!exam) return
    updateMutation.mutate({ auto_grade_enabled: !exam.auto_grade_enabled })
  }

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator color={colors.accent} size="large" /></View>
  }

  if (isError || !exam) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.subtle} />
        <Text style={styles.errorText}>Could not load exam</Text>
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
        <Text style={styles.examName}>{exam.name}</Text>
        {exam.category ? <Text style={styles.category}>{exam.category}</Text> : null}

        <View style={styles.metaGrid}>
          {exam.subject_name ? (
            <MetaItem icon="book-outline" label="Subject" value={exam.subject_name} />
          ) : null}
          {exam.standard ? (
            <MetaItem icon="school-outline" label="Class" value={`${exam.standard}${exam.division ? `-${exam.division}` : ''}`} />
          ) : null}
          {exam.exam_date ? (
            <MetaItem
              icon="calendar-outline"
              label="Date"
              value={new Date(exam.exam_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            />
          ) : null}
          {exam.duration_minutes ? (
            <MetaItem icon="time-outline" label="Duration" value={`${exam.duration_minutes} min`} />
          ) : null}
        </View>
      </View>

      {/* Toggles */}
      <View style={[styles.card, shadows.xs]}>
        <Text style={styles.cardTitle}>Settings</Text>
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleLabel}>Publish Results to Students</Text>
            <Text style={styles.toggleSub}>Students can see their results</Text>
          </View>
          <Switch
            value={exam.results_published}
            onValueChange={toggleResultsPublished}
            trackColor={{ true: colors.accent }}
            disabled={updateMutation.isPending}
          />
        </View>
        <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleLabel}>Auto-grade Enabled</Text>
            <Text style={styles.toggleSub}>AI automatically grades submissions</Text>
          </View>
          <Switch
            value={exam.auto_grade_enabled}
            onValueChange={toggleAutoGrade}
            trackColor={{ true: colors.accent }}
            disabled={updateMutation.isPending}
          />
        </View>
      </View>

      {/* Papers */}
      <View style={[styles.card, shadows.xs]}>
        <Text style={styles.cardTitle}>Linked Papers · {exam.paper_ids?.length ?? 0}</Text>
        {(exam.paper_ids?.length ?? 0) === 0 ? (
          <Text style={styles.emptyText}>No papers linked.</Text>
        ) : (
          exam.paper_ids?.map((paperId, i) => (
            <View key={paperId} style={[styles.paperRow, i < (exam.paper_ids?.length ?? 0) - 1 && styles.paperRowBorder]}>
              <Ionicons name="document-text-outline" size={14} color={colors.accent} />
              <Text style={styles.paperIdText} numberOfLines={1}>{paperId}</Text>
            </View>
          ))
        )}
      </View>

      {/* Delete */}
      <TouchableOpacity
        style={[styles.deleteBtn, shadows.xs]}
        onPress={() => setDeleteVisible(true)}
        activeOpacity={0.8}
        disabled={deleteMutation.isPending}
      >
        {deleteMutation.isPending ? (
          <ActivityIndicator color={colors.danger} size="small" />
        ) : (
          <>
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
            <Text style={styles.deleteBtnText}>Delete Exam</Text>
          </>
        )}
      </TouchableOpacity>

      <ConfirmModal
        visible={deleteVisible}
        title="Delete Exam"
        message="This will permanently delete the exam. Are you sure?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={() => { setDeleteVisible(false); deleteMutation.mutate() }}
        onCancel={() => setDeleteVisible(false)}
      />
    </ScrollView>
  )
}

function MetaItem({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={14} color={colors.accent} />
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
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

  infoCard: {
    backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing[5],
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, gap: spacing[3],
  },
  examName: { fontSize: 20, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  category: { fontSize: 13, color: colors.muted },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  metaItem: { minWidth: '40%', gap: 2 },
  metaLabel: { fontSize: 10, fontWeight: '700', color: colors.subtle, textTransform: 'uppercase', letterSpacing: 0.5 },
  metaValue: { fontSize: 13, fontWeight: '600', color: colors.ink },

  card: {
    backgroundColor: colors.card, borderRadius: radius.xl,
    paddingHorizontal: spacing[5], paddingBottom: spacing[2],
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
  },
  cardTitle: { fontSize: 13, fontWeight: '700', color: colors.muted, paddingTop: spacing[4], paddingBottom: spacing[2] },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: colors.ink },
  toggleSub: { fontSize: 11, color: colors.muted, marginTop: 2 },

  emptyText: { fontSize: 13, color: colors.muted, paddingBottom: spacing[3] },
  paperRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    paddingVertical: spacing[3],
  },
  paperRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  paperIdText: { flex: 1, fontSize: 12, color: colors.muted, fontFamily: 'monospace' },

  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2],
    height: 50, borderRadius: radius.full, backgroundColor: colors.card,
    borderWidth: 1.5, borderColor: colors.dangerBorder, marginTop: spacing[2],
  },
  deleteBtnText: { fontSize: 15, fontWeight: '700', color: colors.danger },
})
