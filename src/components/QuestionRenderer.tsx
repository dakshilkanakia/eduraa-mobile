import React from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import type { QuestionInPaper, MCQOption, MatchColumnsOptions } from '../types'
import colors from '../theme/colors'
import { spacing, radius } from '../theme/spacing'

interface QuestionRendererProps {
  question: QuestionInPaper
  answer: string
  onChange: (value: string) => void
  disabled?: boolean
  showAnswerKey?: boolean
}

export default function QuestionRenderer({
  question,
  answer,
  onChange,
  disabled = false,
  showAnswerKey = false,
}: QuestionRendererProps) {
  const { question_type, options, answer_key } = question

  // ── MCQ ───────────────────────────────────────────────────────────────────
  if (question_type === 'mcq') {
    const mcqOptions = options as MCQOption[] | undefined
    return (
      <View style={styles.group}>
        {mcqOptions?.map((opt) => {
          const selected = answer === opt.id
          const isCorrect = showAnswerKey && answer_key === opt.id
          const isWrong = showAnswerKey && selected && answer_key !== opt.id
          return (
            <TouchableOpacity
              key={opt.id}
              style={[
                styles.mcqOption,
                selected && styles.mcqSelected,
                isCorrect && styles.mcqCorrect,
                isWrong && styles.mcqWrong,
              ]}
              onPress={() => !disabled && onChange(opt.id)}
              disabled={disabled}
              activeOpacity={0.7}
            >
              <View style={[styles.radio, selected && styles.radioSelected]} />
              <Text style={[styles.mcqText, selected && styles.mcqTextSelected]}>
                {opt.text}
              </Text>
            </TouchableOpacity>
          )
        })}
        {showAnswerKey && answer_key ? (
          <Text style={styles.answerKeyHint}>Correct: {
            mcqOptions?.find((o) => o.id === answer_key)?.text ?? String(answer_key)
          }</Text>
        ) : null}
      </View>
    )
  }

  // ── True / False ──────────────────────────────────────────────────────────
  if (question_type === 'true_false') {
    return (
      <View style={styles.tfRow}>
        {(['True', 'False'] as const).map((val) => {
          const selected = answer === val
          const isCorrect = showAnswerKey && answer_key === val
          const isWrong = showAnswerKey && selected && answer_key !== val
          return (
            <TouchableOpacity
              key={val}
              style={[
                styles.tfBtn,
                selected && styles.tfBtnSelected,
                isCorrect && styles.mcqCorrect,
                isWrong && styles.mcqWrong,
              ]}
              onPress={() => !disabled && onChange(val)}
              disabled={disabled}
              activeOpacity={0.7}
            >
              <Text style={[styles.tfText, selected && styles.tfTextSelected]}>{val}</Text>
            </TouchableOpacity>
          )
        })}
        {showAnswerKey && answer_key ? (
          <Text style={styles.answerKeyHint}>Correct: {String(answer_key)}</Text>
        ) : null}
      </View>
    )
  }

  // ── Fill in the Blank ─────────────────────────────────────────────────────
  if (question_type === 'fill_blank') {
    if (disabled) {
      return (
        <View>
          <Text style={styles.readOnly}>{answer || '—'}</Text>
          {showAnswerKey && answer_key ? (
            <Text style={styles.answerKeyHint}>Correct: {String(answer_key)}</Text>
          ) : null}
        </View>
      )
    }
    return (
      <View>
        <TextInput
          style={styles.textInput}
          value={answer}
          onChangeText={onChange}
          placeholder="Your answer..."
          placeholderTextColor={colors.placeholder}
          maxLength={500}
        />
        <Text style={styles.charCount}>{answer.length}/500</Text>
      </View>
    )
  }

  // ── Short Answer ──────────────────────────────────────────────────────────
  if (question_type === 'short_answer') {
    if (disabled) {
      return (
        <View>
          <Text style={styles.readOnly}>{answer || '—'}</Text>
          {showAnswerKey && answer_key ? (
            <Text style={styles.answerKeyHint}>Answer: {String(answer_key)}</Text>
          ) : null}
        </View>
      )
    }
    return (
      <View>
        <TextInput
          style={styles.textInput}
          value={answer}
          onChangeText={onChange}
          placeholder="Your answer..."
          placeholderTextColor={colors.placeholder}
          maxLength={500}
        />
        <Text style={styles.charCount}>{answer.length}/500</Text>
      </View>
    )
  }

  // ── Long Answer ───────────────────────────────────────────────────────────
  if (question_type === 'long_answer') {
    if (disabled) {
      return (
        <View>
          <Text style={styles.readOnly}>{answer || '—'}</Text>
          {showAnswerKey && answer_key ? (
            <Text style={styles.answerKeyHint}>Answer: {String(answer_key)}</Text>
          ) : null}
        </View>
      )
    }
    return (
      <View>
        <TextInput
          style={[styles.textInput, styles.longInput]}
          value={answer}
          onChangeText={onChange}
          placeholder="Write your answer here..."
          placeholderTextColor={colors.placeholder}
          multiline
          textAlignVertical="top"
          maxLength={5000}
        />
        <Text style={styles.charCount}>{answer.length}/5000</Text>
      </View>
    )
  }

  // ── Match Columns ─────────────────────────────────────────────────────────
  if (question_type === 'match_columns') {
    const matchOpts = options as MatchColumnsOptions | undefined
    if (disabled) {
      return (
        <View>
          <Text style={styles.readOnly}>{answer || '—'}</Text>
          {showAnswerKey && answer_key ? (
            <Text style={styles.answerKeyHint}>Answer: {String(answer_key)}</Text>
          ) : null}
        </View>
      )
    }
    return (
      <View style={styles.group}>
        {matchOpts?.left.map((leftItem, i) => (
          <View key={i} style={styles.matchRow}>
            <Text style={styles.matchLeft}>{i + 1}. {leftItem}</Text>
            <TextInput
              style={styles.matchInput}
              value={
                // Parse "1-A, 2-B" format to extract this item's mapping
                answer
                  .split(',')
                  .find((p) => p.trim().startsWith(`${i + 1}-`))
                  ?.split('-')[1]
                  ?.trim() ?? ''
              }
              onChangeText={(val) => {
                // Rebuild the mapping string
                const parts: Record<number, string> = {}
                answer.split(',').forEach((p) => {
                  const [k, v] = p.trim().split('-')
                  if (k && v) parts[parseInt(k)] = v.trim()
                })
                parts[i + 1] = val.trim()
                const newAnswer = Object.entries(parts)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([k, v]) => `${k}-${v}`)
                  .join(', ')
                onChange(newAnswer)
              }}
              placeholder={`Match for ${i + 1}`}
              placeholderTextColor={colors.placeholder}
              maxLength={10}
            />
          </View>
        ))}
        {matchOpts?.right.map((rightItem, i) => (
          <Text key={i} style={styles.matchRightHint}>
            {String.fromCharCode(65 + i)}. {rightItem}
          </Text>
        ))}
        {showAnswerKey && answer_key ? (
          <Text style={styles.answerKeyHint}>Answer: {String(answer_key)}</Text>
        ) : null}
      </View>
    )
  }

  return null
}

const styles = StyleSheet.create({
  group: {
    gap: spacing[2],
  },
  mcqOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    gap: spacing[3],
  },
  mcqSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentLight,
  },
  mcqCorrect: {
    borderColor: colors.success,
    backgroundColor: colors.successBg,
  },
  mcqWrong: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerBg,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.border,
  },
  radioSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  mcqText: {
    flex: 1,
    fontSize: 14,
    color: colors.ink,
  },
  mcqTextSelected: {
    color: colors.accent,
    fontWeight: '500',
  },
  tfRow: {
    flexDirection: 'row',
    gap: spacing[3],
    flexWrap: 'wrap',
  },
  tfBtn: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  tfBtnSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentLight,
  },
  tfText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.muted,
  },
  tfTextSelected: {
    color: colors.accent,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing[3],
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.card,
  },
  longInput: {
    minHeight: 120,
  },
  charCount: {
    fontSize: 11,
    color: colors.subtle,
    textAlign: 'right',
    marginTop: 4,
  },
  readOnly: {
    fontSize: 14,
    color: colors.ink,
    padding: spacing[3],
    backgroundColor: colors.surface1,
    borderRadius: radius.md,
    minHeight: 44,
  },
  answerKeyHint: {
    fontSize: 13,
    color: colors.successText,
    fontStyle: 'italic',
    marginTop: spacing[2],
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  matchLeft: {
    flex: 1,
    fontSize: 14,
    color: colors.ink,
  },
  matchInput: {
    width: 80,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing[2],
    fontSize: 14,
    color: colors.ink,
    textAlign: 'center',
  },
  matchRightHint: {
    fontSize: 13,
    color: colors.muted,
    paddingLeft: spacing[2],
  },
})
