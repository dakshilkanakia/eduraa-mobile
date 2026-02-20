import React, { useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Alert
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useQuery, useMutation } from '@tanstack/react-query'
import type { PapersStackParamList } from '../../navigation'
import { papersApi } from '../../api/papers'
import { colors } from '../../theme/colors'
import { spacing, radius } from '../../theme/spacing'
import type { Difficulty } from '../../types'

type Nav = NativeStackNavigationProp<PapersStackParamList, 'GeneratePaper'>

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

export default function GeneratePaperScreen() {
  const navigation = useNavigation<Nav>()

  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [selectedChapters, setSelectedChapters] = useState<string[]>([])
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [titleLine1, setTitleLine1] = useState('')
  const [mcqCount, setMcqCount] = useState('10')
  const [shortCount, setShortCount] = useState('5')

  const { data: options, isLoading: optionsLoading } = useQuery({
    queryKey: ['paper-options'],
    queryFn: papersApi.getOptions,
  })

  const generateMutation = useMutation({
    mutationFn: papersApi.generate,
    onSuccess: (paper) => {
      navigation.replace('PaperDetail', { paperId: paper.id })
    },
    onError: (err: any) => {
      Alert.alert('Generation failed', err?.response?.data?.detail || 'Please try again.')
    },
  })

  const handleGenerate = () => {
    if (!selectedSubject || selectedChapters.length === 0 || !titleLine1.trim()) {
      Alert.alert('Missing fields', 'Please select a subject, at least one chapter, and enter a title.')
      return
    }
    generateMutation.mutate({
      subject_id: selectedSubject,
      chapter_ids: selectedChapters,
      difficulty,
      title_line_1: titleLine1,
      mcq_count: parseInt(mcqCount) || 0,
      short_answer_count: parseInt(shortCount) || 0,
      long_answer_count: 0,
      fill_blank_count: 0,
      match_columns_count: 0,
      true_false_count: 0,
    })
  }

  const toggleChapter = (id: string) => {
    setSelectedChapters((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  if (optionsLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.loadingText}>Loading options...</Text>
      </View>
    )
  }

  const subjects = options?.subjects || []
  const chapters = selectedSubject ? (options?.chapters?.[selectedSubject] || []) : []

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* Subject */}
      <Text style={styles.label}>Subject *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
        {subjects.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.pill, selectedSubject === s.id && styles.pillActive]}
            onPress={() => { setSelectedSubject(s.id); setSelectedChapters([]) }}
          >
            <Text style={[styles.pillText, selectedSubject === s.id && styles.pillTextActive]}>{s.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Chapters */}
      {selectedSubject && (
        <>
          <Text style={styles.label}>Chapters * (select at least one)</Text>
          <View style={styles.chapterGrid}>
            {chapters.map((ch) => (
              <TouchableOpacity
                key={ch.id}
                style={[styles.chapterPill, selectedChapters.includes(ch.id) && styles.chapterPillActive]}
                onPress={() => toggleChapter(ch.id)}
              >
                <Text style={[styles.chapterText, selectedChapters.includes(ch.id) && styles.chapterTextActive]}>
                  {ch.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Difficulty */}
      <Text style={styles.label}>Difficulty</Text>
      <View style={styles.diffRow}>
        {DIFFICULTIES.map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.diffPill, difficulty === d && styles.diffPillActive]}
            onPress={() => setDifficulty(d)}
          >
            <Text style={[styles.diffText, difficulty === d && styles.diffTextActive]}>
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Title */}
      <Text style={styles.label}>Paper Title *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Chapter 3 Practice Test"
        placeholderTextColor={colors.subtle}
        value={titleLine1}
        onChangeText={setTitleLine1}
      />

      {/* Question counts */}
      <Text style={styles.label}>Question Counts</Text>
      <View style={styles.countRow}>
        <View style={styles.countField}>
          <Text style={styles.countLabel}>MCQ</Text>
          <TextInput
            style={styles.countInput}
            value={mcqCount}
            onChangeText={setMcqCount}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.countField}>
          <Text style={styles.countLabel}>Short Answer</Text>
          <TextInput
            style={styles.countInput}
            value={shortCount}
            onChangeText={setShortCount}
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Generate Button */}
      <TouchableOpacity
        style={[styles.generateBtn, generateMutation.isPending && styles.generateBtnDisabled]}
        onPress={handleGenerate}
        disabled={generateMutation.isPending}
        activeOpacity={0.85}
      >
        {generateMutation.isPending ? (
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <ActivityIndicator color={colors.white} />
            <Text style={styles.generateBtnText}>Generating...</Text>
          </View>
        ) : (
          <Text style={styles.generateBtnText}>Generate Paper</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface1 },
  content: { padding: spacing[5], paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: colors.muted, fontSize: 14 },
  label: {
    fontSize: 11, fontWeight: '700', color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.1, marginBottom: spacing[2], marginTop: spacing[4],
  },
  pillRow: { flexDirection: 'row', marginBottom: spacing[2] },
  pill: {
    paddingHorizontal: spacing[4], paddingVertical: spacing[2],
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.card, marginRight: spacing[2],
  },
  pillActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  pillText: { fontSize: 13, fontWeight: '600', color: colors.muted },
  pillTextActive: { color: colors.white },
  chapterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chapterPill: {
    paddingHorizontal: spacing[3], paddingVertical: spacing[1],
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface2,
  },
  chapterPillActive: { backgroundColor: colors.accentLight, borderColor: colors.accent },
  chapterText: { fontSize: 12, fontWeight: '600', color: colors.muted },
  chapterTextActive: { color: colors.accentStrong },
  diffRow: { flexDirection: 'row', gap: spacing[3] },
  diffPill: {
    flex: 1, paddingVertical: spacing[2], borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center',
  },
  diffPillActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  diffText: { fontSize: 13, fontWeight: '600', color: colors.muted },
  diffTextActive: { color: colors.white },
  input: {
    height: 48, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.border, backgroundColor: colors.card,
    paddingHorizontal: spacing[4], fontSize: 15, color: colors.ink,
  },
  countRow: { flexDirection: 'row', gap: spacing[3] },
  countField: { flex: 1 },
  countLabel: { fontSize: 11, color: colors.muted, marginBottom: 4, fontWeight: '600' },
  countInput: {
    height: 44, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border, backgroundColor: colors.card,
    paddingHorizontal: spacing[3], fontSize: 15, color: colors.ink, textAlign: 'center',
  },
  generateBtn: {
    marginTop: spacing[6], height: 52, backgroundColor: colors.accent,
    borderRadius: radius.full, alignItems: 'center', justifyContent: 'center',
  },
  generateBtnDisabled: { opacity: 0.7 },
  generateBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
})
