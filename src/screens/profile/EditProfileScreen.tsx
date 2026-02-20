import React, { useState, useEffect } from 'react'
import {
  View, Text, TextInput, ScrollView, StyleSheet,
  TouchableOpacity, Alert, ActivityIndicator
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { b2cApi } from '../../api/b2c'
import { colors } from '../../theme/colors'
import { spacing, radius } from '../../theme/spacing'

export default function EditProfileScreen() {
  const navigation = useNavigation()
  const queryClient = useQueryClient()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['b2c-profile'],
    queryFn: b2cApi.getProfile,
  })

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name)
      setLastName(profile.last_name)
    }
  }, [profile])

  const updateMutation = useMutation({
    mutationFn: () => b2cApi.updateProfile({ first_name: firstName, last_name: lastName, current_password: currentPassword }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['b2c-profile'] })
      Alert.alert('Updated', 'Your profile has been updated.')
      navigation.goBack()
    },
    onError: (err: any) => {
      Alert.alert('Update failed', err?.response?.data?.detail || 'Please check your password and try again.')
    },
  })

  if (isLoading) return <View style={styles.center}><ActivityIndicator color={colors.accent} /></View>

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.field}>
        <Text style={styles.label}>First Name</Text>
        <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Last Name</Text>
        <TextInput style={styles.input} value={lastName} onChangeText={setLastName} autoCapitalize="words" />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Current Password * (required to save changes)</Text>
        <TextInput
          style={styles.input} value={currentPassword} onChangeText={setCurrentPassword}
          secureTextEntry placeholder="Enter current password" placeholderTextColor={colors.subtle}
        />
      </View>
      <TouchableOpacity
        style={[styles.saveBtn, updateMutation.isPending && styles.saveBtnDisabled]}
        onPress={() => updateMutation.mutate()}
        disabled={updateMutation.isPending}
      >
        {updateMutation.isPending ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface1 },
  content: { padding: spacing[5] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  field: { marginBottom: spacing[4] },
  label: { fontSize: 11, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.1, marginBottom: spacing[1] },
  input: {
    height: 48, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.card, paddingHorizontal: spacing[4], fontSize: 15, color: colors.ink,
  },
  saveBtn: {
    height: 50, backgroundColor: colors.accent, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center', marginTop: spacing[4],
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
})
