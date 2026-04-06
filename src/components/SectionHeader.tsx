import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import colors from '../theme/colors'
import { spacing } from '../theme/spacing'

interface SectionHeaderProps {
  title: string
  subtitle?: string
  rightAction?: { label: string; onPress: () => void }
}

export default function SectionHeader({ title, subtitle, rightAction }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {rightAction ? (
        <TouchableOpacity onPress={rightAction.onPress}>
          <Text style={styles.action}>{rightAction.label}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  left: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
  },
  subtitle: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  action: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },
})
