import React from 'react'
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native'
import colors from '../theme/colors'
import { spacing, radius } from '../theme/spacing'

interface FilterOption {
  label: string
  value: string
}

interface FilterChipProps {
  options: FilterOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  multiSelect?: boolean
}

export default function FilterChip({
  options,
  selected,
  onChange,
  multiSelect = false,
}: FilterChipProps) {
  const toggle = (value: string) => {
    if (multiSelect) {
      if (selected.includes(value)) {
        onChange(selected.filter((v) => v !== value))
      } else {
        onChange([...selected, value])
      }
    } else {
      onChange(selected.includes(value) ? [] : [value])
    }
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {options.map((opt) => {
          const active = selected.includes(opt.value)
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => toggle(opt.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  container: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    gap: spacing[2],
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.muted,
  },
  labelActive: {
    color: colors.white,
  },
})
