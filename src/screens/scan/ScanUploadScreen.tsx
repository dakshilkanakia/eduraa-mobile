import React, { useState, useRef } from 'react'
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
import { useQuery } from '@tanstack/react-query'
import { scanApi } from '../../api/scan'
import { colors } from '../../theme/colors'
import { spacing, radius, shadows } from '../../theme/spacing'
import FileUploadButton, { PickedFile } from '../../components/FileUploadButton'

interface Props {
  onUploadSuccess?: () => void
}

type PickerItem = { id: string; label: string }

export default function ScanUploadScreen({ onUploadSuccess }: Props) {
  const insets = useSafeAreaInsets()
  const abortRef = useRef<AbortController | null>(null)

  const [selectedExam, setSelectedExam] = useState<PickerItem | null>(null)
  const [selectedSubject, setSelectedSubject] = useState<PickerItem | null>(null)
  const [pickedFile, setPickedFile] = useState<PickedFile | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: options, isLoading: optionsLoading } = useQuery({
    queryKey: ['scanOptions'],
    queryFn: scanApi.getOptions,
  })

  const handleExamSelect = (exam: { id: string; name: string }) => {
    setSelectedExam({ id: exam.id, label: exam.name })
    // Auto-fill subject if exam has one
    if (options && exam.subject_id) {
      const subject = options.subjects.find((s) => s.id === exam.subject_id)
      if (subject) setSelectedSubject({ id: subject.id, label: subject.name })
    } else {
      setSelectedSubject(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedExam) {
      setError('Please select an exam.')
      return
    }
    if (!pickedFile) {
      setError('Please select a file to upload.')
      return
    }

    setError(null)
    setUploading(true)
    abortRef.current = new AbortController()

    const formData = new FormData()
    formData.append('exam_id', selectedExam.id)
    if (selectedSubject) formData.append('subject_id', selectedSubject.id)
    formData.append('files', {
      uri: pickedFile.uri,
      name: pickedFile.name,
      type: pickedFile.mimeType ?? 'application/octet-stream',
    } as any)

    try {
      await scanApi.upload(formData)
      setUploading(false)
      Alert.alert('Upload complete', 'Grading has started. Check My Uploads for status.')
      // Reset form
      setSelectedExam(null)
      setSelectedSubject(null)
      setPickedFile(null)
      onUploadSuccess?.()
    } catch (err: any) {
      if (err?.message === 'canceled') {
        setError(null)
      } else {
        setError(err?.response?.data?.detail ?? 'Upload failed. Please try again.')
      }
      setUploading(false)
    }
  }

  const handleCancel = () => {
    abortRef.current?.abort()
    setUploading(false)
  }

  if (optionsLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    )
  }

  const exams = options?.exams ?? []
  const subjects = options?.subjects ?? []

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Step 1 — Select Exam */}
      <View style={styles.stepCard}>
        <View style={styles.stepHeader}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>1</Text>
          </View>
          <Text style={styles.stepTitle}>Select Exam</Text>
        </View>

        {exams.length === 0 ? (
          <View style={styles.noOptions}>
            <Ionicons name="calendar-outline" size={24} color={colors.subtle} />
            <Text style={styles.noOptionsText}>No exams available</Text>
          </View>
        ) : (
          <View style={styles.pickerList}>
            {exams.map((exam) => {
              const isSelected = selectedExam?.id === exam.id
              return (
                <TouchableOpacity
                  key={exam.id}
                  style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                  onPress={() => handleExamSelect(exam as any)}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                    size={18}
                    color={isSelected ? colors.accent : colors.subtle}
                  />
                  <View style={styles.pickerItemContent}>
                    <Text style={[styles.pickerItemLabel, isSelected && styles.pickerItemLabelSelected]}>
                      {exam.name}
                    </Text>
                    {(exam as any).standard ? (
                      <Text style={styles.pickerItemSub}>
                        Std {(exam as any).standard}{(exam as any).division ? `-${(exam as any).division}` : ''}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        )}
      </View>

      {/* Step 2 — Select Subject (if not auto-filled) */}
      {selectedExam && subjects.length > 0 && !selectedSubject && (
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>2</Text>
            </View>
            <Text style={styles.stepTitle}>Select Subject</Text>
          </View>
          <View style={styles.pickerList}>
            {subjects.map((subject) => {
              const isSelected = selectedSubject?.id === subject.id
              return (
                <TouchableOpacity
                  key={subject.id}
                  style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                  onPress={() => setSelectedSubject({ id: subject.id, label: subject.name })}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                    size={18}
                    color={isSelected ? colors.accent : colors.subtle}
                  />
                  <Text style={[styles.pickerItemLabel, isSelected && styles.pickerItemLabelSelected]}>
                    {subject.name}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      )}

      {/* Subject auto-fill confirmation */}
      {selectedExam && selectedSubject && (
        <View style={styles.autoFillRow}>
          <Ionicons name="book-outline" size={14} color={colors.accent} />
          <Text style={styles.autoFillText}>Subject: {selectedSubject.label}</Text>
          <TouchableOpacity onPress={() => setSelectedSubject(null)}>
            <Text style={styles.changeLink}>Change</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step 3 — Select File */}
      <View style={styles.stepCard}>
        <View style={styles.stepHeader}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>{selectedExam ? '3' : '2'}</Text>
          </View>
          <Text style={styles.stepTitle}>Select File</Text>
        </View>
        <Text style={styles.stepSubtitle}>Upload your answer sheet (PDF or image)</Text>
        <FileUploadButton
          accept="any"
          onFilePicked={(file) => setPickedFile(file as PickedFile)}
          label="Choose Answer Sheet"
        />
      </View>

      {/* Error */}
      {error ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Upload Button */}
      {uploading ? (
        <View style={styles.uploadingRow}>
          <ActivityIndicator color={colors.accent} size="small" />
          <Text style={styles.uploadingText}>Uploading...</Text>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[
            styles.uploadBtn,
            (!selectedExam || !pickedFile) && styles.uploadBtnDisabled,
          ]}
          onPress={handleUpload}
          disabled={!selectedExam || !pickedFile}
          activeOpacity={0.8}
        >
          <Ionicons name="cloud-upload-outline" size={20} color={colors.white} />
          <Text style={styles.uploadBtnText}>Upload & Submit</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface1 },
  content: { paddingHorizontal: spacing[5], paddingTop: spacing[4], gap: spacing[3] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  stepCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing[3],
    ...shadows.sm,
  },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: { fontSize: 12, fontWeight: '800', color: colors.white },
  stepTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  stepSubtitle: { fontSize: 13, color: colors.muted },

  noOptions: {
    alignItems: 'center',
    paddingVertical: spacing[4],
    gap: spacing[2],
  },
  noOptionsText: { fontSize: 14, color: colors.muted },

  pickerList: { gap: spacing[2] },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface1,
  },
  pickerItemSelected: {
    backgroundColor: colors.accentLight,
    borderColor: colors.accent,
  },
  pickerItemContent: { flex: 1, gap: 2 },
  pickerItemLabel: { fontSize: 14, fontWeight: '600', color: colors.ink },
  pickerItemLabelSelected: { color: colors.accent },
  pickerItemSub: { fontSize: 11, color: colors.muted },

  autoFillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.accentLight,
    borderRadius: radius.lg,
    padding: spacing[3],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.accent,
  },
  autoFillText: { flex: 1, fontSize: 13, color: colors.accent, fontWeight: '600' },
  changeLink: { fontSize: 13, color: colors.accent, fontWeight: '700', textDecorationLine: 'underline' },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.dangerBg,
    borderRadius: radius.lg,
    padding: spacing[3],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.dangerBorder,
  },
  errorText: { flex: 1, fontSize: 13, color: colors.danger },

  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    justifyContent: 'center',
    paddingVertical: spacing[4],
  },
  uploadingText: { fontSize: 15, color: colors.ink, fontWeight: '600' },
  cancelBtn: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: { fontSize: 13, color: colors.muted, fontWeight: '600' },

  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    paddingVertical: spacing[4],
    marginTop: spacing[2],
  },
  uploadBtnDisabled: { opacity: 0.45 },
  uploadBtnText: { fontSize: 16, fontWeight: '700', color: colors.white },
})
