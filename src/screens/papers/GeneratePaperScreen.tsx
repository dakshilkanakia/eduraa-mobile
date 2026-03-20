import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Animated,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useQuery, useMutation } from '@tanstack/react-query'
import type { PapersStackParamList } from '../../navigation'
import { papersApi } from '../../api/papers'
import { colors } from '../../theme/colors'
import { spacing, radius, shadows } from '../../theme/spacing'
import type { Difficulty, Chapter } from '../../types'

type Nav = NativeStackNavigationProp<PapersStackParamList, 'GeneratePaper'>

const DIFFICULTIES: { value: Difficulty; label: string; color: string; bg: string }[] = [
  { value: 'easy', label: 'Easy', color: colors.success, bg: colors.successBg },
  { value: 'medium', label: 'Medium', color: colors.warning, bg: colors.warningBg },
  { value: 'hard', label: 'Hard', color: colors.danger, bg: colors.dangerBg },
]

// ─── Numeric Stepper ─────────────────────────────────────────────────────────

function Stepper({
  label,
  sublabel,
  value,
  onChange,
  min = 0,
  max = 30,
}: {
  label: string
  sublabel?: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
}) {
  return (
    <View style={stepper.wrap}>
      <View style={{ flex: 1 }}>
        <Text style={stepper.label}>{label}</Text>
        {sublabel ? <Text style={stepper.sub}>{sublabel}</Text> : null}
      </View>
      <View style={stepper.controls}>
        <TouchableOpacity
          style={[stepper.btn, value <= min && stepper.btnDisabled]}
          onPress={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          activeOpacity={0.7}
        >
          <Ionicons name="remove" size={16} color={value <= min ? colors.subtle : colors.ink} />
        </TouchableOpacity>
        <Text style={stepper.value}>{value}</Text>
        <TouchableOpacity
          style={[stepper.btn, value >= max && stepper.btnDisabled]}
          onPress={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={16} color={value >= max ? colors.subtle : colors.ink} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const stepper = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
  },
  label: { fontSize: 14, fontWeight: '600', color: colors.ink },
  sub: { fontSize: 11, color: colors.muted, marginTop: 1 },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  btn: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  value: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
    minWidth: 28,
    textAlign: 'center',
  },
})

// ─── Section card ─────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sec.wrap}>
      <Text style={sec.title}>{title}</Text>
      <View style={[sec.card, shadows.xs]}>{children}</View>
    </View>
  )
}

const sec = StyleSheet.create({
  wrap: { marginBottom: spacing[4] },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.subtle,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing[2],
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    paddingHorizontal: spacing[4],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
})

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function GeneratePaperScreen() {
  const navigation = useNavigation<Nav>()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()

  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedChapters, setSelectedChapters] = useState<string[]>([])
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [titleLine1, setTitleLine1] = useState('')
  const [mcqCount, setMcqCount] = useState(10)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [chaptersLoading, setChaptersLoading] = useState(false)
  const [titleFocused, setTitleFocused] = useState(false)

  const { data: options, isLoading: optionsLoading } = useQuery({
    queryKey: ['paper-options'],
    queryFn: papersApi.getOptions,
  })

  useEffect(() => {
    if (!selectedSubject) { setChapters([]); return }
    let cancelled = false
    setChaptersLoading(true)
    setSelectedChapters([])
    papersApi
      .getChapters(selectedSubject)
      .then(data => { if (!cancelled) setChapters(data) })
      .catch(() => { if (!cancelled) setChapters([]) })
      .finally(() => { if (!cancelled) setChaptersLoading(false) })
    return () => { cancelled = true }
  }, [selectedSubject])

  const generateMutation = useMutation({
    mutationFn: papersApi.generate,
    onSuccess: (paper) => navigation.replace('PaperDetail', { paperId: paper.id }),
    onError: (err: any) => {
      const detail = err?.response?.data?.detail
      const msg = typeof detail === 'string' ? detail
        : Array.isArray(detail) ? detail.map((d: any) => d.msg).join(', ')
        : 'Please try again.'
      Alert.alert('Generation failed', msg)
    },
  })

  const handleGenerate = () => {
    if (!selectedSubject) { Alert.alert('Missing subject', 'Please select a subject.'); return }
    if (selectedChapters.length === 0) { Alert.alert('Missing chapters', 'Please select at least one chapter.'); return }
    if (!titleLine1.trim()) { Alert.alert('Missing title', 'Please enter a paper title.'); return }
    if (mcqCount === 0) { Alert.alert('No questions', 'Add at least one question.'); return }
    generateMutation.mutate({
      subject_id: selectedSubject,
      chapter_ids: selectedChapters,
      difficulty,
      title_line_1: titleLine1.trim(),
      mcq_count: mcqCount,
      short_answer_count: 0,
      long_answer_count: 0,
      fill_blank_count: 0,
      match_columns_count: 0,
      true_false_count: 0,
    })
  }

  const toggleChapter = (id: string) => {
    setSelectedChapters(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  // Entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start()
  }, [fadeAnim])

  if (optionsLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.loadingText}>Loading options…</Text>
      </View>
    )
  }

  const subjects = options?.subjects || []
  const isSmall = width < 380
  const hPad = isSmall ? spacing[4] : spacing[5]
  const totalQuestions = mcqCount

  return (
    <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.content, { paddingHorizontal: hPad, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* Subject */}
        <Section title="Subject">
          {subjects.length === 0 ? (
            <View style={styles.emptySection}>
              <Ionicons name="alert-circle-outline" size={20} color={colors.subtle} />
              <Text style={styles.emptySectionText}>No subjects available. Add subjects in your Profile.</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillScroll}
            >
              {subjects.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.pill, selectedSubject === s.id && styles.pillActive]}
                  onPress={() => setSelectedSubject(s.id)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.pillText, selectedSubject === s.id && styles.pillTextActive]}>
                    {s.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </Section>

        {/* Chapters */}
        {selectedSubject ? (
          <Section title={`Chapters  ${selectedChapters.length > 0 ? `· ${selectedChapters.length} selected` : ''}`}>
            {chaptersLoading ? (
              <View style={styles.emptySection}>
                <ActivityIndicator color={colors.accent} size="small" />
              </View>
            ) : chapters.length === 0 ? (
              <View style={styles.emptySection}>
                <Text style={styles.emptySectionText}>No chapters found for this subject.</Text>
              </View>
            ) : (
              <View style={styles.chapterGrid}>
                {chapters.map(ch => {
                  const active = selectedChapters.includes(ch.id)
                  return (
                    <TouchableOpacity
                      key={ch.id}
                      style={[styles.chapterChip, active && styles.chapterChipActive]}
                      onPress={() => toggleChapter(ch.id)}
                      activeOpacity={0.75}
                    >
                      {active ? (
                        <Ionicons name="checkmark" size={12} color={colors.accent} style={{ marginRight: 4 }} />
                      ) : null}
                      <Text style={[styles.chapterText, active && styles.chapterTextActive]} numberOfLines={1}>
                        {ch.title}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            )}
          </Section>
        ) : null}

        {/* Difficulty */}
        <Section title="Difficulty">
          <View style={styles.diffRow}>
            {DIFFICULTIES.map(d => {
              const active = difficulty === d.value
              return (
                <TouchableOpacity
                  key={d.value}
                  style={[styles.diffSegment, active && { backgroundColor: d.bg }]}
                  onPress={() => setDifficulty(d.value)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.diffText, active && { color: d.color }]}>{d.label}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </Section>

        {/* Title */}
        <Section title="Paper Title">
          <View style={[styles.titleInputWrap, titleFocused && styles.titleInputFocused]}>
            <Ionicons name="document-text-outline" size={16} color={titleFocused ? colors.accent : colors.subtle} style={{ marginRight: spacing[2] }} />
            <TextInput
              style={styles.titleInput}
              placeholder="e.g. Chapter 3 Practice Test"
              placeholderTextColor={colors.placeholder}
              value={titleLine1}
              onChangeText={setTitleLine1}
              onFocus={() => setTitleFocused(true)}
              onBlur={() => setTitleFocused(false)}
            />
          </View>
        </Section>

        {/* Question Counts */}
        <Section title={`Questions${totalQuestions > 0 ? `  ·  ${totalQuestions} total` : ''}`}>
          <View>
            <Stepper label="MCQ" sublabel="Multiple choice" value={mcqCount} onChange={setMcqCount} min={1} max={50} />
          </View>
        </Section>

        {/* Generate button */}
        <TouchableOpacity
          style={[styles.generateBtn, shadows.md, generateMutation.isPending && styles.generateBtnDisabled]}
          onPress={handleGenerate}
          disabled={generateMutation.isPending}
          activeOpacity={0.82}
        >
          {generateMutation.isPending ? (
            <View style={styles.generateBtnInner}>
              <ActivityIndicator color={colors.white} size="small" />
              <Text style={styles.generateBtnText}>Generating paper…</Text>
            </View>
          ) : (
            <View style={styles.generateBtnInner}>
              <Ionicons name="sparkles" size={18} color={colors.white} />
              <Text style={styles.generateBtnText}>Generate Paper</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface1 },
  content: { paddingTop: spacing[4] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3] },
  loadingText: { color: colors.muted, fontSize: 14 },

  emptySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
  },
  emptySectionText: {
    fontSize: 13,
    color: colors.muted,
    flex: 1,
    lineHeight: 18,
  },

  // Subject pills
  pillScroll: {
    paddingVertical: spacing[3],
    gap: spacing[2],
    flexDirection: 'row',
  },
  pill: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
  },
  pillActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  pillText: { fontSize: 13, fontWeight: '600', color: colors.muted },
  pillTextActive: { color: colors.white },

  // Chapter grid
  chapterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    paddingVertical: spacing[3],
  },
  chapterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1] + 2,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    maxWidth: '100%',
  },
  chapterChipActive: {
    backgroundColor: colors.accentLight,
    borderColor: colors.accentMid,
  },
  chapterText: { fontSize: 12, fontWeight: '600', color: colors.muted },
  chapterTextActive: { color: colors.accentStrong },

  // Difficulty segmented
  diffRow: {
    flexDirection: 'row',
    margin: spacing[3],
    gap: spacing[2],
  },
  diffSegment: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  diffText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
  },

  // Title input
  titleInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing[3],
    height: 50,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    paddingHorizontal: spacing[3],
  },
  titleInputFocused: {
    borderColor: colors.accent,
    backgroundColor: colors.card,
  },
  titleInput: {
    flex: 1,
    fontSize: 15,
    color: colors.ink,
    paddingVertical: 0,
  },

  // Stepper divider
  stepperDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderSubtle,
    marginLeft: 0,
  },

  // Generate button
  generateBtn: {
    height: 56,
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[2],
  },
  generateBtnDisabled: { opacity: 0.65 },
  generateBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  generateBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
})
