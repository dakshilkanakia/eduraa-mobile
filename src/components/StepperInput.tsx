import React, { useState } from 'react'
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native'
import colors from '../theme/colors'
import { spacing, radius } from '../theme/spacing'

interface StepperInputProps {
  value: number
  onChange: (n: number) => void
  min?: number
  max?: number
  label?: string
}

export default function StepperInput({ value, onChange, min = 0, max, label }: StepperInputProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))

  const decrement = () => {
    if (min !== undefined && value <= min) return
    onChange(value - 1)
  }

  const increment = () => {
    if (max !== undefined && value >= max) return
    onChange(value + 1)
  }

  const commitDraft = () => {
    const n = parseInt(draft, 10)
    if (!isNaN(n)) {
      const clamped = Math.max(min ?? 0, max !== undefined ? Math.min(max, n) : n)
      onChange(clamped)
      setDraft(String(clamped))
    } else {
      setDraft(String(value))
    }
    setEditing(false)
  }

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.btn, (min !== undefined && value <= min) && styles.btnDisabled]}
          onPress={decrement}
          activeOpacity={0.7}
          disabled={min !== undefined && value <= min}
        >
          <Text style={styles.btnText}>−</Text>
        </TouchableOpacity>

        {editing ? (
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            onBlur={commitDraft}
            onSubmitEditing={commitDraft}
            keyboardType="number-pad"
            autoFocus
            selectTextOnFocus
          />
        ) : (
          <TouchableOpacity onPress={() => { setDraft(String(value)); setEditing(true) }}>
            <Text style={styles.value}>{value}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.btn, (max !== undefined && value >= max) && styles.btnDisabled]}
          onPress={increment}
          activeOpacity={0.7}
          disabled={max !== undefined && value >= max}
        >
          <Text style={styles.btnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: spacing[1],
  },
  label: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '500',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  btn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.35,
  },
  btnText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.ink,
    lineHeight: 22,
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
    minWidth: 32,
    textAlign: 'center',
  },
  input: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
    minWidth: 40,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
    padding: 0,
  },
})
