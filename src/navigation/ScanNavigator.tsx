import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { stackScreenOptions } from './shared'
import ScanUploadScreen from '../screens/scan/ScanUploadScreen'
import CheckedPapersScreen from '../screens/scan/CheckedPapersScreen'
import CheckedPaperDetailScreen from '../screens/scan/CheckedPaperDetailScreen'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'

export type ScanStackParamList = {
  ScanRoot: undefined
  CheckedPaperDetail: { checkedPaperId: string }
}

const Stack = createNativeStackNavigator<ScanStackParamList>()

type ScanTab = 'upload' | 'uploads'

function ScanRoot() {
  const [activeTab, setActiveTab] = useState<ScanTab>('upload')

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan Paper</Text>
        <View style={styles.segmentRow}>
          <TouchableOpacity
            style={[styles.segment, activeTab === 'upload' && styles.segmentActive]}
            onPress={() => setActiveTab('upload')}
          >
            <Text style={[styles.segmentText, activeTab === 'upload' && styles.segmentTextActive]}>
              Upload New
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segment, activeTab === 'uploads' && styles.segmentActive]}
            onPress={() => setActiveTab('uploads')}
          >
            <Text style={[styles.segmentText, activeTab === 'uploads' && styles.segmentTextActive]}>
              My Uploads
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {activeTab === 'upload' ? (
        <ScanUploadScreen onUploadSuccess={() => setActiveTab('uploads')} />
      ) : (
        <CheckedPapersScreen />
      )}
    </View>
  )
}

export default function ScanNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="ScanRoot" component={ScanRoot} options={{ headerShown: false }} />
      <Stack.Screen
        name="CheckedPaperDetail"
        component={CheckedPaperDetailScreen}
        options={{ title: 'Paper Detail' }}
      />
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
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.3,
    marginBottom: spacing[3],
  },
  segmentRow: {
    flexDirection: 'row',
    gap: spacing[1],
  },
  segment: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  segmentActive: { borderBottomColor: colors.accent },
  segmentText: { fontSize: 14, fontWeight: '600', color: colors.muted },
  segmentTextActive: { color: colors.accent },
})
