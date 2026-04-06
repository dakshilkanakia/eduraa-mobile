import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { stackScreenOptions } from './shared'
import TeacherScanScreen from '../screens/teacher/TeacherScanScreen'
import TeacherGradingListScreen from '../screens/teacher/TeacherGradingListScreen'
import TeacherGradingDetailScreen from '../screens/teacher/TeacherGradingDetailScreen'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'

export type TeacherScanStackParamList = {
  TeacherScanRoot: undefined
  TeacherGradingDetail: { checkedPaperId: string }
}

const Stack = createNativeStackNavigator<TeacherScanStackParamList>()

function TeacherScanRoot() {
  const [activeTab, setActiveTab] = useState<'scan' | 'graded'>('scan')

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan & Grade</Text>
        <View style={styles.segmentRow}>
          <TouchableOpacity
            style={[styles.segment, activeTab === 'scan' && styles.segmentActive]}
            onPress={() => setActiveTab('scan')}
          >
            <Text style={[styles.segmentText, activeTab === 'scan' && styles.segmentTextActive]}>Scan New</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segment, activeTab === 'graded' && styles.segmentActive]}
            onPress={() => setActiveTab('graded')}
          >
            <Text style={[styles.segmentText, activeTab === 'graded' && styles.segmentTextActive]}>Graded Papers</Text>
          </TouchableOpacity>
        </View>
      </View>
      {activeTab === 'scan' ? (
        <TeacherScanScreen />
      ) : (
        <TeacherGradingListScreen />
      )}
    </View>
  )
}

export default function TeacherScanNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="TeacherScanRoot" component={TeacherScanRoot} options={{ headerShown: false }} />
      <Stack.Screen name="TeacherGradingDetail" component={TeacherGradingDetailScreen} options={{ title: 'Grading Detail' }} />
    </Stack.Navigator>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface1 },
  header: {
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingTop: spacing[5],
    paddingHorizontal: spacing[5],
    paddingBottom: 0,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.ink, letterSpacing: -0.3, marginBottom: spacing[3] },
  segmentRow: { flexDirection: 'row', gap: spacing[1] },
  segment: { paddingHorizontal: spacing[4], paddingVertical: spacing[2], borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  segmentActive: { borderBottomColor: colors.accent },
  segmentText: { fontSize: 14, fontWeight: '600', color: colors.muted },
  segmentTextActive: { color: colors.accent },
})
