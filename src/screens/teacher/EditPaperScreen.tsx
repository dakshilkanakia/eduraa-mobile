import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRoute, useNavigation } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { TeacherPapersStackParamList } from '../../navigation/TeacherPapersNavigator'
import { papersApi } from '../../api/papers'
import { colors } from '../../theme/colors'
import { spacing, radius, shadows } from '../../theme/spacing'

type Route = RouteProp<TeacherPapersStackParamList, 'EditPaper'>
type Nav = NativeStackNavigationProp<TeacherPapersStackParamList, 'EditPaper'>

export default function EditPaperScreen() {
  const { params } = useRoute<Route>()
  const navigation = useNavigation<Nav>()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [duration, setDuration] = useState('')
  const [category, setCategory] = useState('')
  const [instructions, setInstructions] = useState('')

  const { data: paper, isLoading } = useQuery({
    queryKey: ['paper', params.paperId],
    queryFn: () => papersApi.getById(params.paperId),
  })

  useEffect(() => {
    if (paper) {
      setTitle(paper.title)
      setSubtitle(paper.subtitle ?? '')
      setDuration(paper.duration_minutes ? String(paper.duration_minutes) : '')
      setCategory(paper.category ?? '')
      setInstructions(paper.instructions ?? '')
    }
  }, [paper])

  const saveMutation = useMutation({
    mutationFn: () =>
      papersApi.update(params.paperId, {
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        duration_minutes: duration ? parseInt(duration, 10) : undefined,
        category: category.trim() || undefined,
        instructions: instructions.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paper', params.paperId] })
      queryClient.invalidateQueries({ queryKey: ['teacherPapers'] })
      navigation.goBack()
    },
    onError: () => {
      Alert.alert('Error', 'Failed to save changes. Please try again.')
    },
  })

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator color={colors.accent} size="large" /></View>
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.card, shadows.sm]}>
        <View style={styles.infoNote}>
          <Text style={styles.infoNoteText}>
            Editing questions individually is not supported in v1. You can update paper metadata below.
          </Text>
        </View>

        <Field label="Title *" value={title} onChangeText={setTitle} placeholder="Paper title" />
        <Field label="Subtitle" value={subtitle} onChangeText={setSubtitle} placeholder="Optional subtitle" />
        <Field label="Duration (minutes)" value={duration} onChangeText={setDuration} placeholder="e.g. 60" keyboardType="number-pad" />
        <Field label="Category" value={category} onChangeText={setCategory} placeholder="e.g. Unit Test, Mid Term" />
        <Field
          label="Instructions"
          value={instructions}
          onChangeText={setInstructions}
          placeholder="Instructions for students..."
          multiline
          minHeight={100}
          last
        />
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, (!title.trim() || saveMutation.isPending) && styles.saveBtnDisabled]}
        onPress={() => saveMutation.mutate()}
        disabled={!title.trim() || saveMutation.isPending}
        activeOpacity={0.85}
      >
        {saveMutation.isPending ? (
          <ActivityIndicator color={colors.white} size="small" />
        ) : (
          <Text style={styles.saveBtnText}>Save Changes</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  )
}

function Field({
  label, value, onChangeText, placeholder, keyboardType, multiline, minHeight, last,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; keyboardType?: any; multiline?: boolean; minHeight?: number; last?: boolean;
}) {
  return (
    <View style={[styles.fieldWrap, !last && styles.fieldBorder]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, multiline && { minHeight: minHeight ?? 80, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface1 },
  content: { paddingHorizontal: spacing[5], paddingTop: spacing[4], gap: spacing[4] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    backgroundColor: colors.card, borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    overflow: 'hidden',
  },
  infoNote: {
    backgroundColor: colors.infoBg, padding: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  infoNoteText: { fontSize: 12, color: colors.infoText, lineHeight: 17 },
  fieldWrap: { paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  fieldBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: colors.subtle, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing[2] },
  fieldInput: { fontSize: 15, color: colors.ink },
  saveBtn: {
    backgroundColor: colors.accent, borderRadius: radius.full,
    height: 52, alignItems: 'center', justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: colors.white },
})
