import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Switch, Alert, Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { TeacherExamsStackParamList } from '../../navigation/TeacherExamsNavigator'
import { examsApi } from '../../api/exams'
import { papersApi } from '../../api/papers'
import { colors } from '../../theme/colors'
import { spacing, radius, shadows } from '../../theme/spacing'
import type { PaperListItem } from '../../types'
import BottomSheet from '../../components/BottomSheet'

type Nav = NativeStackNavigationProp<TeacherExamsStackParamList, 'CreateExam'>

export default function CreateExamScreen() {
  const navigation = useNavigation<Nav>()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [standard, setStandard] = useState('')
  const [division, setDivision] = useState('')
  const [semester, setSemester] = useState('')
  const [category, setCategory] = useState('')
  const [examDate, setExamDate] = useState('')
  const [duration, setDuration] = useState('')
  const [autoGrade, setAutoGrade] = useState(true)
  const [resultsPublished, setResultsPublished] = useState(false)
  const [linkedPapers, setLinkedPapers] = useState<PaperListItem[]>([])
  const [paperPickerVisible, setPaperPickerVisible] = useState(false)
  const [paperSearch, setPaperSearch] = useState('')

  const { data: options } = useQuery({
    queryKey: ['paperOptions'],
    queryFn: papersApi.getOptions,
  })

  const { data: papersData } = useQuery({
    queryKey: ['teacherPapers'],
    queryFn: () => papersApi.list({ limit: 100, status: 'published' }),
  })

  const createMutation = useMutation({
    mutationFn: () => examsApi.create({
      name: name.trim(),
      subject_id: subjectId || undefined,
      standard: standard || undefined,
      division: division || undefined,
      semester: semester || undefined,
      category: category || undefined,
      exam_date: examDate || undefined,
      duration_minutes: duration ? parseInt(duration, 10) : undefined,
      auto_grade_enabled: autoGrade,
      results_published: resultsPublished,
      paper_ids: linkedPapers.map(p => p.id),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherExams'] })
      navigation.goBack()
    },
    onError: () => Alert.alert('Error', 'Failed to create exam. Please try again.'),
  })

  const allPapers = papersData?.items ?? []
  const searchedPapers = allPapers.filter(p =>
    !paperSearch || p.title.toLowerCase().includes(paperSearch.toLowerCase())
  )

  const subjectItems = options?.subjects ?? []
  const standardItems = options?.standards ?? []
  const divisionItems = options?.divisions ?? []
  const categoryItems = options?.exam_types ?? []

  const isValid = name.trim().length > 0 && linkedPapers.length > 0

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, shadows.sm]}>
          {/* Name */}
          <FormField label="Exam Name *" value={name} onChangeText={setName} placeholder="e.g. Mid Term Exam 2025" />

          {/* Subject picker */}
          <SimplePickerField
            label="Subject"
            value={subjectId}
            items={subjectItems.map(s => ({ id: s.id, label: s.name }))}
            onSelect={setSubjectId}
          />

          {/* Standard */}
          <SimplePickerField
            label="Standard"
            value={standard}
            items={standardItems.map(s => ({ id: s, label: `Std ${s}` }))}
            onSelect={setStandard}
          />

          {/* Division */}
          <SimplePickerField
            label="Division"
            value={division}
            items={divisionItems.map(d => ({ id: d, label: d }))}
            onSelect={setDivision}
          />

          {/* Category */}
          <SimplePickerField
            label="Category"
            value={category}
            items={categoryItems.map(e => ({ id: e, label: e }))}
            onSelect={setCategory}
          />

          <FormField label="Semester" value={semester} onChangeText={setSemester} placeholder="e.g. Semester 1" />

          {/* Exam Date — text input (ISO format) until datetimepicker is installed */}
          <FormField
            label="Exam Date (YYYY-MM-DD)"
            value={examDate}
            onChangeText={setExamDate}
            placeholder="e.g. 2025-12-15"
            keyboardType="numbers-and-punctuation"
          />

          <FormField
            label="Duration (minutes)"
            value={duration}
            onChangeText={setDuration}
            placeholder="e.g. 90"
            keyboardType="number-pad"
          />

          {/* Toggles */}
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Auto-grade enabled</Text>
              <Text style={styles.toggleSub}>AI automatically grades submitted papers</Text>
            </View>
            <Switch value={autoGrade} onValueChange={setAutoGrade} trackColor={{ true: colors.accent }} />
          </View>

          <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Publish results immediately</Text>
              <Text style={styles.toggleSub}>Students see results right after submission</Text>
            </View>
            <Switch value={resultsPublished} onValueChange={setResultsPublished} trackColor={{ true: colors.accent }} />
          </View>
        </View>

        {/* Linked papers */}
        <View style={[styles.card, shadows.sm]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Linked Papers</Text>
            <TouchableOpacity
              style={styles.addPaperBtn}
              onPress={() => setPaperPickerVisible(true)}
            >
              <Ionicons name="add" size={16} color={colors.accent} />
              <Text style={styles.addPaperText}>Add Paper</Text>
            </TouchableOpacity>
          </View>

          {linkedPapers.length === 0 ? (
            <Text style={styles.noPapersText}>No papers linked yet. At least one paper is required.</Text>
          ) : (
            linkedPapers.map(p => (
              <View key={p.id} style={styles.linkedPaperRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.linkedPaperTitle} numberOfLines={1}>{p.title}</Text>
                  <Text style={styles.linkedPaperMeta}>{p.total_marks} marks</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setLinkedPapers(prev => prev.filter(lp => lp.id !== p.id))}
                  style={styles.removePaperBtn}
                >
                  <Ionicons name="close-circle" size={18} color={colors.muted} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Create button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing[3] }]}>
        <TouchableOpacity
          style={[styles.createBtn, (!isValid || createMutation.isPending) && styles.createBtnDisabled]}
          onPress={() => createMutation.mutate()}
          disabled={!isValid || createMutation.isPending}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.createBtnText}>Create Exam</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Paper picker bottom sheet */}
      <BottomSheet
        visible={paperPickerVisible}
        onClose={() => setPaperPickerVisible(false)}
        title="Add Paper"
      >
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={16} color={colors.subtle} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search papers..."
            placeholderTextColor={colors.placeholder}
            value={paperSearch}
            onChangeText={setPaperSearch}
          />
        </View>
        <ScrollView style={{ maxHeight: 320 }}>
          {searchedPapers.map(p => {
            const alreadyLinked = linkedPapers.some(lp => lp.id === p.id)
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.paperPickerRow, alreadyLinked && styles.paperPickerRowSelected]}
                onPress={() => {
                  if (!alreadyLinked) {
                    setLinkedPapers(prev => [...prev, p])
                    setPaperPickerVisible(false)
                    setPaperSearch('')
                  }
                }}
                disabled={alreadyLinked}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.paperPickerTitle, alreadyLinked && { color: colors.muted }]} numberOfLines={1}>{p.title}</Text>
                  <Text style={styles.paperPickerMeta}>{p.total_marks} marks · {p.question_count ?? 0} questions</Text>
                </View>
                {alreadyLinked ? (
                  <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                ) : (
                  <Ionicons name="add-circle-outline" size={18} color={colors.accent} />
                )}
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </BottomSheet>
    </View>
  )
}

function FormField({ label, value, onChangeText, placeholder, keyboardType }: {
  label: string; value: string; onChangeText: (v: string) => void; placeholder?: string; keyboardType?: any;
}) {
  return (
    <View style={ff.wrap}>
      <Text style={ff.label}>{label}</Text>
      <TextInput
        style={ff.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        keyboardType={keyboardType}
      />
    </View>
  )
}

function SimplePickerField({ label, value, items, onSelect }: {
  label: string; value: string;
  items: { id: string; label: string }[];
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false)
  const selected = items.find(i => i.id === value)
  return (
    <View style={ff.wrap}>
      <Text style={ff.label}>{label}</Text>
      <TouchableOpacity style={ff.picker} onPress={() => setOpen(!open)}>
        <Text style={[ff.pickerText, !selected && ff.placeholder]}>
          {selected?.label ?? `Select ${label}...`}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={14} color={colors.subtle} />
      </TouchableOpacity>
      {open ? (
        <View style={ff.dropdown}>
          <TouchableOpacity style={ff.dropdownItem} onPress={() => { onSelect(''); setOpen(false) }}>
            <Text style={[ff.dropdownText, { color: colors.muted }]}>None</Text>
          </TouchableOpacity>
          {items.map(item => (
            <TouchableOpacity
              key={item.id}
              style={[ff.dropdownItem, item.id === value && { backgroundColor: colors.accentLight }]}
              onPress={() => { onSelect(item.id); setOpen(false) }}
            >
              <Text style={[ff.dropdownText, item.id === value && { color: colors.accent, fontWeight: '700' }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  )
}

const ff = StyleSheet.create({
  wrap: { gap: spacing[2], borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, paddingVertical: spacing[3] },
  label: { fontSize: 11, fontWeight: '700', color: colors.subtle, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { fontSize: 15, color: colors.ink, paddingVertical: 2 },
  picker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 2 },
  pickerText: { fontSize: 15, color: colors.ink },
  placeholder: { color: colors.placeholder },
  dropdown: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.card, overflow: 'hidden', marginTop: 4 },
  dropdownItem: { padding: spacing[3], borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  dropdownText: { fontSize: 14, color: colors.ink },
})

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface1 },
  content: { paddingHorizontal: spacing[5], paddingTop: spacing[4], gap: spacing[4] },
  card: {
    backgroundColor: colors.card, borderRadius: radius.xl,
    paddingHorizontal: spacing[5], paddingBottom: spacing[2],
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: colors.ink },
  toggleSub: { fontSize: 11, color: colors.muted, marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: spacing[4], paddingBottom: spacing[2],
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  addPaperBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addPaperText: { fontSize: 13, fontWeight: '700', color: colors.accent },
  noPapersText: { fontSize: 13, color: colors.muted, paddingBottom: spacing[3] },
  linkedPaperRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    paddingVertical: spacing[3], borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
  },
  linkedPaperTitle: { fontSize: 14, fontWeight: '600', color: colors.ink },
  linkedPaperMeta: { fontSize: 11, color: colors.muted, marginTop: 2 },
  removePaperBtn: { padding: spacing[1] },
  bottomBar: {
    paddingHorizontal: spacing[5], paddingTop: spacing[3],
    backgroundColor: colors.card, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
  },
  createBtn: {
    backgroundColor: colors.accent, borderRadius: radius.full,
    height: 52, alignItems: 'center', justifyContent: 'center',
  },
  createBtnDisabled: { opacity: 0.45 },
  createBtnText: { fontSize: 16, fontWeight: '700', color: colors.white },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[2],
    backgroundColor: colors.surface1, borderRadius: radius.lg,
    paddingHorizontal: spacing[3], height: 38,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    marginBottom: spacing[3],
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.ink },
  paperPickerRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    paddingVertical: spacing[3], paddingHorizontal: spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  paperPickerRowSelected: { opacity: 0.5 },
  paperPickerTitle: { fontSize: 14, fontWeight: '600', color: colors.ink },
  paperPickerMeta: { fontSize: 11, color: colors.muted, marginTop: 2 },
})
