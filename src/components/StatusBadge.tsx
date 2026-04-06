import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import colors from '../theme/colors'
import { radius, spacing } from '../theme/spacing'

interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
}

function getBadgeColors(status: string): { bg: string; text: string } {
  const s = status.toLowerCase()
  if (s === 'graded' || s === 'completed') return { bg: colors.successBg, text: colors.successText }
  if (s === 'processing' || s === 'pending_auto_check') return { bg: colors.infoBg, text: colors.infoText }
  if (s === 'pending_manual_review' || s === 'needs_review') return { bg: colors.warningBg, text: colors.warningText }
  if (s === 'published') return { bg: colors.accentLight, text: colors.accent }
  if (s === 'failed') return { bg: colors.dangerBg, text: colors.dangerText }
  // default: uploaded, draft, or unknown
  return { bg: colors.surface2, text: colors.muted }
}

function formatLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const { bg, text } = getBadgeColors(status)
  const isSmall = size === 'sm'
  return (
    <View style={[styles.badge, { backgroundColor: bg }, isSmall && styles.badgeSm]}>
      <Text style={[styles.label, { color: text }, isSmall && styles.labelSm]}>
        {formatLabel(status)}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  labelSm: {
    fontSize: 11,
  },
})
