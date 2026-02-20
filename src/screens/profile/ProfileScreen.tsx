import React from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useQuery } from '@tanstack/react-query'
import type { ProfileStackParamList } from '../../navigation'
import { b2cApi } from '../../api/b2c'
import { useAuthStore } from '../../stores/authStore'
import { colors } from '../../theme/colors'
import { spacing, radius } from '../../theme/spacing'

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'ProfileMain'>

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>()
  const { logout, user } = useAuthStore()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['b2c-profile'],
    queryFn: b2cApi.getProfile,
  })

  const infoRows = profile ? [
    { label: 'Email', value: profile.email },
    { label: 'Education Level', value: profile.education_level.replace('_', ' ') },
    { label: 'Standard', value: profile.standard || '—' },
    { label: 'Board', value: profile.board || '—' },
    { label: 'Subjects', value: profile.subjects?.join(', ') || '—' },
  ] : []

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* Avatar block */}
      <View style={styles.avatarBlock}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(profile?.first_name?.[0] || user?.display_name?.[0] || 'S').toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>
          {profile ? `${profile.first_name} ${profile.last_name}` : user?.display_name || 'Student'}
        </Text>
        <Text style={styles.role}>B2C Learner</Text>
      </View>

      {/* Edit button */}
      <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditProfile')}>
        <Text style={styles.editBtnText}>Edit Profile</Text>
      </TouchableOpacity>

      {/* Info */}
      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 20 }} />
      ) : (
        <View style={styles.infoCard}>
          {infoRows.map((row, i) => (
            <View key={row.label} style={[styles.infoRow, i < infoRows.length - 1 && styles.infoRowBorder]}>
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={styles.infoValue}>{row.value}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface1 },
  content: { padding: spacing[5], paddingBottom: 40, alignItems: 'center' },
  avatarBlock: { alignItems: 'center', marginTop: spacing[4], marginBottom: spacing[5] },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing[3],
  },
  avatarText: { fontSize: 34, fontWeight: '800', color: colors.white },
  name: { fontSize: 22, fontWeight: '800', color: colors.ink },
  role: { fontSize: 13, color: colors.muted, marginTop: 4 },
  editBtn: {
    height: 44, paddingHorizontal: spacing[8], borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing[5],
  },
  editBtnText: { color: colors.accent, fontWeight: '700', fontSize: 14 },
  infoCard: {
    width: '100%', backgroundColor: colors.card, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: spacing[5],
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing[4] },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  infoValue: { fontSize: 13, color: colors.ink, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  logoutBtn: {
    width: '100%', height: 50, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.borderStrong,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: colors.muted },
})
