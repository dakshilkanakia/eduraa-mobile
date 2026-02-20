import React, { useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useAuthStore } from '../../stores/authStore'
import { colors } from '../../theme/colors'
import { spacing, radius } from '../../theme/spacing'

export default function HomeScreen() {
  const { user } = useAuthStore()
  const navigation = useNavigation<any>()

  const quickActions = [
    { label: 'Generate Paper', icon: '✦', screen: 'Papers', params: { screen: 'GeneratePaper' } },
    { label: 'My Papers', icon: '📄', screen: 'Papers', params: { screen: 'PapersList' } },
    { label: 'Results', icon: '✓', screen: 'Results', params: { screen: 'ResultsList' } },
    { label: 'AI Studio', icon: '✦', screen: 'AIStudio', params: undefined },
  ]

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>E</Text>
        </View>
        <View>
          <Text style={styles.greeting}>Hello, {user?.display_name?.split(' ')[0] || 'Student'} 👋</Text>
          <Text style={styles.subtitle}>Ready to practise today?</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionLabel}>Quick Actions</Text>
      <View style={styles.actionGrid}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={styles.actionCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate(action.screen, action.params)}
          >
            <Text style={styles.actionIcon}>{action.icon}</Text>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Placeholder stats */}
      <Text style={styles.sectionLabel}>Your Progress</Text>
      <View style={styles.statsRow}>
        {[
          { label: 'Papers Generated', value: '—' },
          { label: 'Avg Score', value: '—' },
          { label: 'Submissions', value: '—' },
        ].map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface1 },
  content: { padding: spacing[5] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[6],
    marginTop: spacing[4],
    gap: spacing[3],
  },
  brandMark: {
    width: 44,
    height: 44,
    borderRadius: radius.xl,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: { color: colors.white, fontSize: 22, fontWeight: '800' },
  greeting: { fontSize: 20, fontWeight: '700', color: colors.ink },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 2 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.12,
    marginBottom: spacing[3],
    marginTop: spacing[2],
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  actionCard: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'flex-start',
  },
  actionIcon: { fontSize: 22, marginBottom: spacing[2] },
  actionLabel: { fontSize: 14, fontWeight: '700', color: colors.ink },
  statsRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.accent },
  statLabel: { fontSize: 11, color: colors.muted, marginTop: 4, textAlign: 'center' },
})
