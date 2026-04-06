import React from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Linking,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { rosterApi } from '../../api/roster'
import { useAuthStore } from '../../stores/authStore'
import { colors } from '../../theme/colors'
import { spacing, radius, shadows } from '../../theme/spacing'

type InfoRowProps = {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  value?: string | null
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  if (!value) return null
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={16} color={colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  )
}

export default function TeacherProfileScreen() {
  const insets = useSafeAreaInsets()
  const logout = useAuthStore(s => s.logout)

  const { data: masterProfile, isLoading } = useQuery({
    queryKey: ['teacherMasterProfile'],
    queryFn: rosterApi.getTeacherMasterProfile,
  })

  const profile = masterProfile?.profile

  const initials = profile
    ? `${profile.first_name?.[0] ?? ''}${profile.last_name?.[0] ?? ''}`.toUpperCase()
    : '?'

  const fullName = profile ? `${profile.first_name} ${profile.last_name}` : '—'

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => logout(),
      },
    ])
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header with safe area */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[3] }]}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      {/* Avatar + Name */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        {isLoading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: spacing[2] }} />
        ) : (
          <>
            <Text style={styles.nameText}>{fullName}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>Teacher</Text>
            </View>
          </>
        )}
      </View>

      {/* Info card */}
      {profile ? (
        <View style={[styles.card, shadows.xs]}>
          <InfoRow icon="mail-outline" label="Email" value={profile.email} />
          <InfoRow icon="business-outline" label="School" value={profile.school_name} />
          <InfoRow icon="library-outline" label="Board" value={profile.board} />
          <InfoRow
            icon="school-outline"
            label="Standards"
            value={profile.standards_taught?.join(', ')}
          />
          <InfoRow
            icon="grid-outline"
            label="Divisions"
            value={profile.divisions_taught?.join(', ')}
          />
          <InfoRow
            icon="book-outline"
            label="Subjects"
            value={profile.subjects_taught?.join(', ')}
          />
        </View>
      ) : !isLoading ? (
        <View style={[styles.card, shadows.xs]}>
          <Text style={styles.noProfileText}>Profile data unavailable</Text>
        </View>
      ) : null}

      {/* Class Teacher status */}
      {profile ? (
        <View style={[styles.card, shadows.xs, { marginTop: 0 }]}>
          <Text style={styles.sectionLabel}>Class Teacher</Text>
          <View style={styles.classTeacherRow}>
            {profile.class_teacher_opt_in ? (
              <>
                <View style={styles.greenBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                  <Text style={styles.greenBadgeText}>Active</Text>
                </View>
                <Text style={styles.classTeacherInfo}>
                  Standard {profile.class_teacher_standard ?? ''}
                  {profile.class_teacher_division ? `-${profile.class_teacher_division}` : ''}
                </Text>
              </>
            ) : (
              <View style={styles.grayBadge}>
                <Text style={styles.grayBadgeText}>Not a class teacher</Text>
              </View>
            )}
          </View>
        </View>
      ) : null}

      {/* Settings / Links */}
      <View style={[styles.card, shadows.xs, { gap: 0 }]}>
        <Text style={styles.sectionLabel}>Support</Text>
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => Linking.openURL('mailto:support@eduraa.com')}
          activeOpacity={0.7}
        >
          <Ionicons name="help-circle-outline" size={20} color={colors.accent} />
          <Text style={styles.menuLabel}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.subtle} />
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => Linking.openURL('https://eduraa.com/privacy')}
          activeOpacity={0.7}
        >
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.accent} />
          <Text style={styles.menuLabel}>Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.subtle} />
        </TouchableOpacity>
      </View>

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface1 },
  content: { gap: spacing[3] },
  header: {
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[3],
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  avatarSection: { alignItems: 'center', paddingVertical: spacing[5], backgroundColor: colors.card, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 26, fontWeight: '800', color: colors.white },
  nameText: { fontSize: 20, fontWeight: '700', color: colors.ink, marginTop: spacing[2] },
  roleBadge: { marginTop: spacing[1], backgroundColor: colors.accentLight, borderRadius: radius.full, paddingHorizontal: spacing[3], paddingVertical: 3 },
  roleBadgeText: { fontSize: 12, fontWeight: '700', color: colors.accent },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    marginHorizontal: spacing[5],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing[1],
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3], paddingVertical: spacing[2], borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  infoIconWrap: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  infoLabel: { fontSize: 11, color: colors.muted, marginBottom: 1 },
  infoValue: { fontSize: 13, fontWeight: '600', color: colors.ink },
  noProfileText: { fontSize: 13, color: colors.muted, paddingVertical: spacing[3], textAlign: 'center' },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.subtle, textTransform: 'uppercase', letterSpacing: 0.8, paddingTop: spacing[2], paddingBottom: spacing[1] },
  classTeacherRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], paddingVertical: spacing[2] },
  greenBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.successBg, borderRadius: radius.full, paddingHorizontal: spacing[2], paddingVertical: 3 },
  greenBadgeText: { fontSize: 12, fontWeight: '700', color: colors.successText },
  classTeacherInfo: { fontSize: 13, fontWeight: '600', color: colors.ink },
  grayBadge: { backgroundColor: colors.surface2, borderRadius: radius.full, paddingHorizontal: spacing[3], paddingVertical: 3 },
  grayBadgeText: { fontSize: 12, fontWeight: '600', color: colors.muted },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[3] },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.ink },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: spacing[3] + 20 + spacing[3] },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    marginHorizontal: spacing[5],
    paddingVertical: spacing[4],
    backgroundColor: colors.dangerBg,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.dangerBorder,
  },
  signOutText: { fontSize: 15, fontWeight: '700', color: colors.danger },
})
