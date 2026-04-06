import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useQuery, useMutation } from '@tanstack/react-query'
import type { TeacherPapersStackParamList } from '../../navigation/TeacherPapersNavigator'
import { papersApi } from '../../api/papers'
import { colors } from '../../theme/colors'
import { spacing, radius, shadows } from '../../theme/spacing'
import StepperInput from '../../components/StepperInput'
import ConfirmModal from '../../components/ConfirmModal'
import type { PaperGenerateRequest, Difficulty } from '../../types'

type Nav = NativeStackNavigationProp<TeacherPapersStackParamList, 'GenerateTeacherPaper'>

interface FormState {
  // Step 2 — Basics
  titleLine1: string
  titleLine2: string
  subjectId: string
  subjectName: string
  standard: string
  division: string
  category: string
  semester: string
  difficulty: Difficulty
  // Step 3 — Content
  chapterIds: string[]
  chapterTitles: string[]
  additionalInstructions: string
  // Step 4 — Composition
  mcqCount: number
  trueFalseCount: number
  shortAnswerCount: number
  longAnswerCount: number
  fillBlankCount: number
  matchColumnsCount: number
  marksPerMcq: number
  marksPerTrueFalse: number
  marksPerShort: number
  marksPerLong: number
  marksPerFill: number
  marksPerMatch: number
  timerValue: number
  timerUnit: 'Minutes' | 'Hours'
}

const DEFAULT_FORM: FormState = {
  titleLine1: '', titleLine2: '', subjectId: '', subjectName: '',
  standard: '', division: '', category: '', semester: '',
  difficulty: 'medium',
  chapterIds: [], chapterTitles: [], additionalInstructions: '',
  mcqCount: 5, trueFalseCount: 0, shortAnswerCount: 3, longAnswerCount: 2,
  fillBlankCount: 0, matchColumnsCount: 0,
  marksPerMcq: 1, marksPerTrueFalse: 1, marksPerShort: 2,
  marksPerLong: 10, marksPerFill: 1, marksPerMatch: 2,
  timerValue: 60, timerUnit: 'Minutes',
}

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']
const DIFFICULTY_LABELS: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' }
const DIFFICULTY_COLORS: Record<Difficulty, string> = { easy: colors.success, medium: colors.warning, hard: colors.danger }

// ─── Step dots ────────────────────────────────────────────────────────────────

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <View style={dot.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[dot.dot, i === current && dot.dotActive, i < current && dot.dotDone]} />
      ))}
    </View>
  )
}
const dot = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: spacing[4] },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.surface3 },
  dotActive: { backgroundColor: colors.accent, width: 20 },
  dotDone: { backgroundColor: colors.accentMid },
})

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({ label, value, onChangeText, placeholder, keyboardType, multiline, required }: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; keyboardType?: any; multiline?: boolean; required?: boolean;
}) {
  return (
    <View style={field.wrap}>
      <Text style={field.label}>{label}{required ? ' *' : ''}</Text>
      <TextInput
        style={[field.input, multiline && field.inputMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : undefined}
      />
    </View>
  )
}
const field = StyleSheet.create({
  wrap: { gap: spacing[2] },
  label: { fontSize: 12, fontWeight: '700', color: colors.muted },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg,
    padding: spacing[3], fontSize: 15, color: colors.ink, backgroundColor: colors.card,
  },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
})

// ─── Picker row (simple tappable list) ────────────────────────────────────────

function PickerRow({ label, value, items, onSelect }: {
  label: string; value: string;
  items: { id: string; label: string }[];
  onSelect: (id: string, label: string) => void;
}) {
  const [open, setOpen] = useState(false)
  const selected = items.find(i => i.id === value)
  return (
    <View style={pr.wrap}>
      <Text style={pr.label}>{label}</Text>
      <TouchableOpacity style={pr.btn} onPress={() => setOpen(!open)} activeOpacity={0.8}>
        <Text style={[pr.btnText, !selected && pr.placeholder]}>
          {selected?.label ?? `Select ${label}...`}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={14} color={colors.subtle} />
      </TouchableOpacity>
      {open ? (
        <View style={pr.dropdown}>
          {items.map(item => (
            <TouchableOpacity
              key={item.id}
              style={[pr.item, item.id === value && pr.itemSelected]}
              onPress={() => { onSelect(item.id, item.label); setOpen(false) }}
            >
              <Text style={[pr.itemText, item.id === value && pr.itemTextSelected]}>{item.label}</Text>
              {item.id === value ? <Ionicons name="checkmark" size={14} color={colors.accent} /> : null}
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  )
}
const pr = StyleSheet.create({
  wrap: { gap: spacing[2] },
  label: { fontSize: 12, fontWeight: '700', color: colors.muted },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg,
    padding: spacing[3], backgroundColor: colors.card,
  },
  btnText: { fontSize: 15, color: colors.ink },
  placeholder: { color: colors.placeholder },
  dropdown: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg,
    backgroundColor: colors.card, overflow: 'hidden', marginTop: -spacing[1],
  },
  item: { padding: spacing[3], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemSelected: { backgroundColor: colors.accentLight },
  itemText: { fontSize: 14, color: colors.ink },
  itemTextSelected: { color: colors.accent, fontWeight: '700' },
})

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function GenerateTeacherPaperScreen() {
  const navigation = useNavigation<Nav>()
  const insets = useSafeAreaInsets()
  const [step, setStep] = useState(0) // 0-4
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [confirmVisible, setConfirmVisible] = useState(false)

  const patch = useCallback((updates: Partial<FormState>) => {
    setForm(prev => ({ ...prev, ...updates }))
  }, [])

  const { data: options, isLoading: optionsLoading } = useQuery({
    queryKey: ['paperOptions'],
    queryFn: papersApi.getOptions,
  })

  const { data: chapters, isLoading: chaptersLoading } = useQuery({
    queryKey: ['chapters', form.subjectId, form.standard],
    queryFn: () => papersApi.getChapters(form.subjectId),
    enabled: !!form.subjectId,
  })

  const generateMutation = useMutation({
    mutationFn: () => {
      const payload: PaperGenerateRequest = {
        title_line_1: form.titleLine1,
        title_line_2: form.titleLine2 || undefined,
        subject_id: form.subjectId,
        chapter_ids: form.chapterIds,
        chapter_titles: form.chapterTitles,
        difficulty: form.difficulty,
        standard: form.standard || undefined,
        division: form.division || undefined,
        category: form.category || undefined,
        semester: form.semester || undefined,
        additional_instructions: form.additionalInstructions || undefined,
        mcq_count: form.mcqCount,
        true_false_count: form.trueFalseCount,
        short_answer_count: form.shortAnswerCount,
        long_answer_count: form.longAnswerCount,
        fill_blank_count: form.fillBlankCount,
        match_columns_count: form.matchColumnsCount,
        marks_per_mcq: form.marksPerMcq,
        marks_per_true_false: form.marksPerTrueFalse,
        marks_per_short: form.marksPerShort,
        marks_per_long: form.marksPerLong,
        marks_per_fill_blank: form.marksPerFill,
        marks_per_match_columns: form.marksPerMatch,
        timer_value: form.timerValue,
        timer_unit: form.timerUnit,
      }
      return papersApi.generate(payload)
    },
    onSuccess: (paper) => {
      navigation.replace('TeacherPaperDetail', { paperId: paper.id })
    },
    onError: () => {
      Alert.alert('Generation Failed', 'AI could not generate the paper. Please try again.')
    },
  })

  const subjectItems = (options?.subjects ?? []).map(s => ({ id: s.id, label: s.name }))
  const standardItems = (options?.standards ?? []).map(s => ({ id: s, label: `Std ${s}` }))
  const divisionItems = (options?.divisions ?? []).map(d => ({ id: d, label: d }))
  const categoryItems = (options?.exam_types ?? []).map(e => ({ id: e, label: e }))
  const chapterItems = (chapters ?? []).map(c => ({ id: c.id, label: c.title }))

  const totalQuestions = form.mcqCount + form.trueFalseCount + form.shortAnswerCount +
    form.longAnswerCount + form.fillBlankCount + form.matchColumnsCount
  const totalMarks =
    form.mcqCount * form.marksPerMcq + form.trueFalseCount * form.marksPerTrueFalse +
    form.shortAnswerCount * form.marksPerShort + form.longAnswerCount * form.marksPerLong +
    form.fillBlankCount * form.marksPerFill + form.matchColumnsCount * form.marksPerMatch

  const canGoNext = () => {
    if (step === 0) return true // entry mode — always proceed
    if (step === 1) return form.titleLine1.trim().length > 0 && form.subjectId.length > 0
    if (step === 2) return form.chapterIds.length > 0
    if (step === 3) return totalQuestions > 0
    return true
  }

  if (optionsLoading) {
    return <View style={styles.center}><ActivityIndicator color={colors.accent} size="large" /></View>
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <StepDots total={5} current={step} />

        {/* Step 0 — Entry Mode */}
        {step === 0 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Entry Mode</Text>
            <Text style={styles.stepSub}>How do you want to create this paper?</Text>
            <TouchableOpacity style={[styles.modeCard, styles.modeCardSelected]} activeOpacity={0.85}>
              <Ionicons name="sparkles" size={24} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.modeTitle}>AI Generation</Text>
                <Text style={styles.modeSub}>AI creates questions from your chapters</Text>
              </View>
              <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
            </TouchableOpacity>
            <View style={[styles.modeCard, styles.modeCardDisabled]} activeOpacity={0.85}>
              <Ionicons name="create-outline" size={24} color={colors.subtle} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.modeTitle, { color: colors.muted }]}>Custom Paper</Text>
                <Text style={styles.modeSub}>Coming soon</Text>
              </View>
            </View>
          </View>
        )}

        {/* Step 1 — Basics */}
        {step === 1 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Paper Details</Text>
            <Field label="Title" value={form.titleLine1} onChangeText={v => patch({ titleLine1: v })} placeholder="e.g. Unit Test — Chapter 3" required />
            <Field label="Subtitle (optional)" value={form.titleLine2} onChangeText={v => patch({ titleLine2: v })} placeholder="e.g. Class 10 – Section A" />
            <PickerRow label="Subject" value={form.subjectId} items={subjectItems} onSelect={(id, label) => patch({ subjectId: id, subjectName: label, chapterIds: [], chapterTitles: [] })} />
            <PickerRow label="Standard" value={form.standard} items={standardItems} onSelect={(id) => patch({ standard: id })} />
            <PickerRow label="Division" value={form.division} items={divisionItems} onSelect={(id) => patch({ division: id })} />
            <PickerRow label="Category" value={form.category} items={categoryItems} onSelect={(id) => patch({ category: id })} />
            <Field label="Semester (optional)" value={form.semester} onChangeText={v => patch({ semester: v })} placeholder="e.g. Semester 1" />
            <View style={field.wrap}>
              <Text style={field.label}>Difficulty</Text>
              <View style={styles.diffRow}>
                {DIFFICULTIES.map(d => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.diffBtn, form.difficulty === d && { backgroundColor: DIFFICULTY_COLORS[d], borderColor: DIFFICULTY_COLORS[d] }]}
                    onPress={() => patch({ difficulty: d })}
                  >
                    <Text style={[styles.diffBtnText, form.difficulty === d && { color: colors.white }]}>
                      {DIFFICULTY_LABELS[d]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Step 2 — Content */}
        {step === 2 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Select Chapters</Text>
            <Text style={styles.stepSub}>Subject: {form.subjectName}</Text>
            {chaptersLoading ? (
              <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing[4] }} />
            ) : chapterItems.length === 0 ? (
              <Text style={styles.emptyText}>No chapters found for this subject.</Text>
            ) : (
              <>
                <View style={styles.selectAllRow}>
                  <TouchableOpacity
                    onPress={() => {
                      if (form.chapterIds.length === chapterItems.length) {
                        patch({ chapterIds: [], chapterTitles: [] })
                      } else {
                        patch({ chapterIds: chapterItems.map(c => c.id), chapterTitles: chapterItems.map(c => c.label) })
                      }
                    }}
                  >
                    <Text style={styles.selectAllText}>
                      {form.chapterIds.length === chapterItems.length ? 'Deselect All' : 'Select All'}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.selectedCount}>{form.chapterIds.length} selected</Text>
                </View>
                {chapterItems.map(c => {
                  const selected = form.chapterIds.includes(c.id)
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.chapterRow, selected && styles.chapterRowSelected]}
                      onPress={() => {
                        if (selected) {
                          patch({
                            chapterIds: form.chapterIds.filter(id => id !== c.id),
                            chapterTitles: form.chapterTitles.filter(t => t !== c.label),
                          })
                        } else {
                          patch({ chapterIds: [...form.chapterIds, c.id], chapterTitles: [...form.chapterTitles, c.label] })
                        }
                      }}
                    >
                      <Ionicons
                        name={selected ? 'checkbox' : 'square-outline'}
                        size={20}
                        color={selected ? colors.accent : colors.subtle}
                      />
                      <Text style={[styles.chapterText, selected && { color: colors.accent, fontWeight: '700' }]}>
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </>
            )}
            <Field
              label="Additional Instructions (optional)"
              value={form.additionalInstructions}
              onChangeText={v => patch({ additionalInstructions: v })}
              placeholder="Any special instructions for AI generation..."
              multiline
            />
          </View>
        )}

        {/* Step 3 — Question Composition */}
        {step === 3 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Question Composition</Text>
            <View style={styles.stepperGrid}>
              <View style={styles.stepperCell}>
                <StepperInput label="MCQ" value={form.mcqCount} onChange={v => patch({ mcqCount: v })} min={0} max={50} />
              </View>
              <View style={styles.stepperCell}>
                <StepperInput label="True/False" value={form.trueFalseCount} onChange={v => patch({ trueFalseCount: v })} min={0} max={20} />
              </View>
              <View style={styles.stepperCell}>
                <StepperInput label="Short Ans" value={form.shortAnswerCount} onChange={v => patch({ shortAnswerCount: v })} min={0} max={20} />
              </View>
              <View style={styles.stepperCell}>
                <StepperInput label="Long Ans" value={form.longAnswerCount} onChange={v => patch({ longAnswerCount: v })} min={0} max={10} />
              </View>
              <View style={styles.stepperCell}>
                <StepperInput label="Fill Blank" value={form.fillBlankCount} onChange={v => patch({ fillBlankCount: v })} min={0} max={20} />
              </View>
              <View style={styles.stepperCell}>
                <StepperInput label="Match Col" value={form.matchColumnsCount} onChange={v => patch({ matchColumnsCount: v })} min={0} max={10} />
              </View>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Questions</Text>
              <Text style={styles.totalValue}>{totalQuestions}</Text>
              <Text style={styles.totalLabel}>Total Marks</Text>
              <Text style={styles.totalValue}>{totalMarks}</Text>
            </View>

            <Text style={[field.label, { marginTop: spacing[3] }]}>Marks per Question Type</Text>
            <View style={styles.marksGrid}>
              {[
                { label: 'MCQ', value: form.marksPerMcq, key: 'marksPerMcq' as const },
                { label: 'True/False', value: form.marksPerTrueFalse, key: 'marksPerTrueFalse' as const },
                { label: 'Short Ans', value: form.marksPerShort, key: 'marksPerShort' as const },
                { label: 'Long Ans', value: form.marksPerLong, key: 'marksPerLong' as const },
                { label: 'Fill Blank', value: form.marksPerFill, key: 'marksPerFill' as const },
                { label: 'Match Col', value: form.marksPerMatch, key: 'marksPerMatch' as const },
              ].map(m => (
                <View key={m.key} style={styles.marksCell}>
                  <Text style={styles.marksCellLabel}>{m.label}</Text>
                  <TextInput
                    style={styles.marksInput}
                    value={String(m.value)}
                    onChangeText={v => patch({ [m.key]: parseInt(v, 10) || 0 } as any)}
                    keyboardType="number-pad"
                  />
                </View>
              ))}
            </View>

            <View style={styles.timerRow}>
              <Field
                label="Timer"
                value={String(form.timerValue)}
                onChangeText={v => patch({ timerValue: parseInt(v, 10) || 0 })}
                keyboardType="number-pad"
              />
              <View style={styles.timerToggle}>
                {(['Minutes', 'Hours'] as const).map(u => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.timerBtn, form.timerUnit === u && styles.timerBtnActive]}
                    onPress={() => patch({ timerUnit: u })}
                  >
                    <Text style={[styles.timerBtnText, form.timerUnit === u && styles.timerBtnTextActive]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Step 4 — Review */}
        {step === 4 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Review & Generate</Text>
            <View style={styles.summaryCard}>
              {[
                { label: 'Title', value: form.titleLine1 },
                { label: 'Subtitle', value: form.titleLine2 || '—' },
                { label: 'Subject', value: form.subjectName || '—' },
                { label: 'Standard', value: form.standard || '—' },
                { label: 'Category', value: form.category || '—' },
                { label: 'Difficulty', value: DIFFICULTY_LABELS[form.difficulty] },
                { label: 'Chapters', value: form.chapterTitles.join(', ') || '—' },
                { label: 'Questions', value: String(totalQuestions) },
                { label: 'Total Marks', value: String(totalMarks) },
                { label: 'Timer', value: `${form.timerValue} ${form.timerUnit}` },
              ].map((row, i, arr) => (
                <View key={row.label} style={[styles.summaryRow, i < arr.length - 1 && styles.summaryRowBorder]}>
                  <Text style={styles.summaryLabel}>{row.label}</Text>
                  <Text style={styles.summaryValue} numberOfLines={2}>{row.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom nav */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing[3] }]}>
        {step > 0 ? (
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep(s => s - 1)}>
            <Ionicons name="chevron-back" size={18} color={colors.ink} />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        ) : <View style={{ width: 80 }} />}

        {step < 4 ? (
          <TouchableOpacity
            style={[styles.nextBtn, !canGoNext() && styles.nextBtnDisabled]}
            onPress={() => setStep(s => s + 1)}
            disabled={!canGoNext()}
          >
            <Text style={styles.nextBtnText}>Next</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.generateBtn, generateMutation.isPending && styles.nextBtnDisabled]}
            onPress={() => setConfirmVisible(true)}
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              <>
                <ActivityIndicator size="small" color={colors.white} />
                <Text style={styles.generateBtnText}>Generating...</Text>
              </>
            ) : (
              <>
                <Ionicons name="sparkles" size={18} color={colors.white} />
                <Text style={styles.generateBtnText}>Generate Paper</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      <ConfirmModal
        visible={confirmVisible}
        title="Generate Paper"
        message="This will use AI to generate your paper. Proceed?"
        confirmLabel="Generate"
        cancelLabel="Cancel"
        onConfirm={() => { setConfirmVisible(false); generateMutation.mutate() }}
        onCancel={() => setConfirmVisible(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface1 },
  content: { paddingHorizontal: spacing[5], paddingTop: spacing[4] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  stepCard: {
    backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing[5],
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, gap: spacing[4],
    ...shadows.sm,
  },
  stepTitle: { fontSize: 20, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  stepSub: { fontSize: 13, color: colors.muted, marginTop: -spacing[2] },

  modeCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.xl,
    padding: spacing[4],
  },
  modeCardSelected: { borderColor: colors.accent, backgroundColor: colors.accentLight },
  modeCardDisabled: { opacity: 0.4 },
  modeTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  modeSub: { fontSize: 12, color: colors.muted, marginTop: 2 },

  diffRow: { flexDirection: 'row', gap: spacing[2] },
  diffBtn: {
    flex: 1, height: 40, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card,
  },
  diffBtnText: { fontSize: 13, fontWeight: '700', color: colors.muted },

  selectAllRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectAllText: { fontSize: 13, fontWeight: '700', color: colors.accent },
  selectedCount: { fontSize: 12, color: colors.muted },
  emptyText: { fontSize: 14, color: colors.muted, textAlign: 'center', paddingVertical: spacing[4] },
  chapterRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    padding: spacing[3], borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
  },
  chapterRowSelected: { backgroundColor: colors.accentLight, borderColor: colors.accent },
  chapterText: { flex: 1, fontSize: 14, color: colors.ink },

  stepperGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  stepperCell: { width: '47%' },

  totalRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: colors.surface1, borderRadius: radius.lg, padding: spacing[3],
    gap: spacing[3],
  },
  totalLabel: { fontSize: 12, fontWeight: '600', color: colors.muted },
  totalValue: { fontSize: 20, fontWeight: '800', color: colors.accent },

  marksGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  marksCell: { width: '30%', gap: spacing[1] },
  marksCellLabel: { fontSize: 10, fontWeight: '700', color: colors.muted },
  marksInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    padding: spacing[2], fontSize: 15, color: colors.ink, textAlign: 'center',
    backgroundColor: colors.card,
  },

  timerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing[3] },
  timerToggle: { flexDirection: 'row', gap: spacing[1], paddingBottom: 2 },
  timerBtn: {
    paddingHorizontal: spacing[3], paddingVertical: spacing[2],
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.border,
  },
  timerBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  timerBtnText: { fontSize: 12, fontWeight: '600', color: colors.muted },
  timerBtnTextActive: { color: colors.white },

  summaryCard: {
    borderRadius: radius.lg, overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
  },
  summaryRow: { flexDirection: 'row', paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  summaryRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  summaryLabel: { width: 100, fontSize: 13, color: colors.muted },
  summaryValue: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.ink },

  bottomBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing[5], paddingTop: spacing[3],
    backgroundColor: colors.card, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: spacing[2], paddingHorizontal: spacing[3] },
  backBtnText: { fontSize: 15, fontWeight: '600', color: colors.ink },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.accent, borderRadius: radius.full,
    paddingVertical: spacing[3], paddingHorizontal: spacing[5],
  },
  nextBtnDisabled: { opacity: 0.45 },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: colors.white },
  generateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[2],
    backgroundColor: colors.accent, borderRadius: radius.full,
    paddingVertical: spacing[3], paddingHorizontal: spacing[5],
  },
  generateBtnText: { fontSize: 15, fontWeight: '700', color: colors.white },
})
