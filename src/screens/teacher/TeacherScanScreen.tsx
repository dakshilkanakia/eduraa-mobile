import React, { useState, useRef } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { scanApi } from '../../api/scan'
import { colors } from '../../theme/colors'
import { spacing, radius, shadows } from '../../theme/spacing'
import FileUploadButton, { PickedFile } from '../../components/FileUploadButton'

type UploadMode = 'ai' | 'custom'

export default function TeacherScanScreen() {
  const insets = useSafeAreaInsets()
  const abortRef = useRef<AbortController | null>(null)

  const [uploadMode, setUploadMode] = useState<UploadMode>('ai')
  const [selectedExamId, setSelectedExamId] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [selectedPaperId, setSelectedPaperId] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [pickedFiles, setPickedFiles] = useState<PickedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: options, isLoading } = useQuery({
    queryKey: ['scanOptions'],
    queryFn: scanApi.getOptions,
  })

  const handleUpload = async () => {
    if (uploadMode === 'ai' && !selectedExamId) { setError('Please select an exam.'); return }
    if (uploadMode === 'custom' && !selectedPaperId) { setError('Please select a paper.'); return }
    if (pickedFiles.length === 0) { setError('Please select at least one file.'); return }

    setError(null)
    setUploading(true)
    abortRef.current = new AbortController()

    const formData = new FormData()
    if (uploadMode === 'ai') {
      formData.append('exam_id', selectedExamId)
      if (selectedSubjectId) formData.append('subject_id', selectedSubjectId)
    } else {
      formData.append('paper_id', selectedPaperId)
      formData.append('upload_mode', 'custom_paper')
    }
    if (selectedStudentId) formData.append('student_id', selectedStudentId)
    pickedFiles.forEach(f => {
      formData.append('files', { uri: f.uri, name: f.name, type: f.mimeType ?? 'application/octet-stream' } as any)
    })

    try {
      await scanApi.upload(formData)
      setUploading(false)
      Alert.alert('Grading Started', 'Upload complete. Check Graded Papers for results.')
      setSelectedExamId('')
      setSelectedSubjectId('')
      setSelectedPaperId('')
      setSelectedStudentId('')
      setPickedFiles([])
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Upload failed. Please try again.')
      setUploading(false)
    }
  }

  const exams = options?.exams ?? []
  const subjects = options?.subjects ?? []
  const students = options?.students ?? []
  const papers = options?.papers ?? []
  const customPapers = papers.filter((p: any) => p.source_type === 'custom_paper')

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator color={colors.accent} size="large" /></View>
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Mode toggle */}
      <View style={[styles.card, shadows.sm]}>
        <Text style={styles.cardTitle}>Upload Mode</Text>
        <View style={styles.modeRow}>
          {([['ai', 'AI Exam System'], ['custom', 'Custom Paper']] as [UploadMode, string][]).map(([mode, label]) => (
            <TouchableOpacity
              key={mode}
              style={[styles.modeBtn, uploadMode === mode && styles.modeBtnActive]}
              onPress={() => setUploadMode(mode)}
            >
              <Text style={[styles.modeBtnText, uploadMode === mode && styles.modeBtnTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Exam / Paper selector */}
      <View style={[styles.card, shadows.sm]}>
        {uploadMode === 'ai' ? (
          <>
            <Text style={styles.cardTitle}>Select Exam *</Text>
            {exams.length === 0 ? (
              <Text style={styles.emptyText}>No exams available</Text>
            ) : (
              exams.map((exam: any) => (
                <TouchableOpacity
                  key={exam.id}
                  style={[styles.pickerItem, selectedExamId === exam.id && styles.pickerItemSelected]}
                  onPress={() => {
                    setSelectedExamId(exam.id)
                    if (exam.subject_id) setSelectedSubjectId(exam.subject_id)
                    else setSelectedSubjectId('')
                  }}
                >
                  <Ionicons
                    name={selectedExamId === exam.id ? 'radio-button-on' : 'radio-button-off'}
                    size={18} color={selectedExamId === exam.id ? colors.accent : colors.subtle}
                  />
                  <Text style={[styles.pickerItemText, selectedExamId === exam.id && { color: colors.accent, fontWeight: '700' }]}>
                    {exam.name}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </>
        ) : (
          <>
            <Text style={styles.cardTitle}>Select Paper *</Text>
            {customPapers.length === 0 ? (
              <Text style={styles.emptyText}>No custom papers available</Text>
            ) : (
              (customPapers as any[]).map((paper) => (
                <TouchableOpacity
                  key={paper.id}
                  style={[styles.pickerItem, selectedPaperId === paper.id && styles.pickerItemSelected]}
                  onPress={() => setSelectedPaperId(paper.id)}
                >
                  <Ionicons
                    name={selectedPaperId === paper.id ? 'radio-button-on' : 'radio-button-off'}
                    size={18} color={selectedPaperId === paper.id ? colors.accent : colors.subtle}
                  />
                  <Text style={[styles.pickerItemText, selectedPaperId === paper.id && { color: colors.accent, fontWeight: '700' }]}>
                    {paper.title}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </View>

      {/* Student selector (optional) */}
      {students.length > 0 ? (
        <View style={[styles.card, shadows.sm]}>
          <Text style={styles.cardTitle}>Student (optional — auto-detect if blank)</Text>
          <View style={[styles.pickerItem, !selectedStudentId && styles.pickerItemSelected]}
          >
            <TouchableOpacity onPress={() => setSelectedStudentId('')} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
              <Ionicons name={!selectedStudentId ? 'radio-button-on' : 'radio-button-off'} size={18} color={!selectedStudentId ? colors.accent : colors.subtle} />
              <Text style={[styles.pickerItemText, !selectedStudentId && { color: colors.accent }]}>Auto-detect from scan</Text>
            </TouchableOpacity>
          </View>
          {students.slice(0, 10).map((s: any) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.pickerItem, selectedStudentId === s.id && styles.pickerItemSelected]}
              onPress={() => setSelectedStudentId(s.id)}
            >
              <Ionicons
                name={selectedStudentId === s.id ? 'radio-button-on' : 'radio-button-off'}
                size={18} color={selectedStudentId === s.id ? colors.accent : colors.subtle}
              />
              <Text style={[styles.pickerItemText, selectedStudentId === s.id && { color: colors.accent }]}>
                {s.first_name} {s.last_name} · {s.student_id}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {/* File upload */}
      <View style={[styles.card, shadows.sm]}>
        <Text style={styles.cardTitle}>Select Files *</Text>
        <Text style={styles.cardSub}>Upload answer sheet(s) — PDF or image</Text>
        <FileUploadButton
          accept="any"
          multiple
          onFilePicked={(files) => setPickedFiles(Array.isArray(files) ? files : [files as PickedFile])}
          label="Choose Files"
        />
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {uploading ? (
        <View style={styles.uploadingRow}>
          <ActivityIndicator color={colors.accent} size="small" />
          <Text style={styles.uploadingText}>Uploading & starting grading...</Text>
          <TouchableOpacity onPress={() => { abortRef.current?.abort(); setUploading(false) }}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.uploadBtn, (uploading) && styles.uploadBtnDisabled]}
          onPress={handleUpload}
          disabled={uploading}
          activeOpacity={0.8}
        >
          <Ionicons name="cloud-upload-outline" size={20} color={colors.white} />
          <Text style={styles.uploadBtnText}>Upload & Start Grading</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface1 },
  content: { paddingHorizontal: spacing[5], paddingTop: spacing[4], gap: spacing[3] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing[4], borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, gap: spacing[2] },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.ink },
  cardSub: { fontSize: 12, color: colors.muted },
  modeRow: { flexDirection: 'row', gap: spacing[2] },
  modeBtn: { flex: 1, height: 40, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.border },
  modeBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  modeBtnText: { fontSize: 13, fontWeight: '700', color: colors.muted },
  modeBtnTextActive: { color: colors.white },
  emptyText: { fontSize: 13, color: colors.muted, paddingVertical: spacing[2] },
  pickerItem: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[2], paddingHorizontal: spacing[2], borderRadius: radius.md },
  pickerItemSelected: { backgroundColor: colors.accentLight },
  pickerItemText: { flex: 1, fontSize: 14, color: colors.ink },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], backgroundColor: colors.dangerBg, borderRadius: radius.lg, padding: spacing[3], borderWidth: StyleSheet.hairlineWidth, borderColor: colors.dangerBorder },
  errorText: { flex: 1, fontSize: 13, color: colors.danger },
  uploadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], justifyContent: 'center', paddingVertical: spacing[4] },
  uploadingText: { flex: 1, fontSize: 14, color: colors.ink, fontWeight: '600' },
  cancelText: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], backgroundColor: colors.accent, borderRadius: radius.full, paddingVertical: spacing[4] },
  uploadBtnDisabled: { opacity: 0.45 },
  uploadBtnText: { fontSize: 16, fontWeight: '700', color: colors.white },
})
