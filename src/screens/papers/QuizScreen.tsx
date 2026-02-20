import React from 'react'
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import type { PapersStackParamList } from '../../navigation'
import { colors } from '../../theme/colors'
import { spacing, radius } from '../../theme/spacing'

type Route = RouteProp<PapersStackParamList, 'Quiz'>

export default function QuizScreen() {
  const { params } = useRoute<Route>()
  const navigation = useNavigation()

  return (
    <View style={styles.root}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <View style={styles.center}>
        <Text style={styles.icon}>✦</Text>
        <Text style={styles.title}>Interactive Quiz</Text>
        <Text style={styles.subtitle}>Paper ID: {params.paperId}</Text>
        <Text style={styles.note}>
          Full interactive quiz with hints, explanations, and per-question AI feedback coming soon.
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface1, padding: spacing[5] },
  back: { marginTop: spacing[6], marginBottom: spacing[4] },
  backText: { color: colors.accent, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3] },
  icon: { fontSize: 48, color: colors.accent },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink },
  subtitle: { fontSize: 13, color: colors.muted },
  note: { fontSize: 14, color: colors.muted, textAlign: 'center', maxWidth: 280, lineHeight: 20 },
})
