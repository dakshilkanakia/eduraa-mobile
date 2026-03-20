import React, { useRef, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useQuery } from '@tanstack/react-query'
import type { ProfileStackParamList } from '../../navigation'
import { b2cApi } from '../../api/b2c'
import { useAuthStore } from '../../stores/authStore'
import { colors } from '../../theme/colors'
import { spacing, radius, shadows } from '../../theme/spacing'

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'ProfileMain'>

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
  last = false,
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  value: string
  last?: boolean
}) {
  return (
    <View style={[row.wrap, !last && row.border]}>
      <View style={row.iconWrap}>
        <Ionicons name={icon} size={16} color={colors.muted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={row.label}>{label}</Text>
        <Text style={row.value} numberOfLines={2}>{value}</Text>
      </View>
    </View>
  )
}

const row = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  border: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  label: { fontSize: 11, color: colors.subtle, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  value: { fontSize: 14, color: colors.ink, fontWeight: '500', marginTop: 1 },
})

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>()
  const { logout, user } = useAuthStore()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['b2c-profile'],
    queryFn: b2cApi.getProfile,
  })

  const fadeAnim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start()
  }, [fadeAnim])

  const fullName = profile ? `${profile.first_name} ${profile.last_name}` : (user?.display_name || 'Student')
  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const educationLabel = profile?.education_level.replace(/_/g, ' ') ?? ''

  const hPad = width < 380 ? spacing[4] : spacing[5]

  const infoRows = profile ? [
    { icon: 'mail-outline' as const,    label: 'Email',          value: profile.email },
    { icon: 'school-outline' as const,  label: 'Education',      value: educationLabel },
    { icon: 'layers-outline' as const,  label: 'Standard',       value: profile.standard || '—' },
    { icon: 'ribbon-outline' as const,  label: 'Board',          value: profile.board || '—' },
    { icon: 'book-outline' as const,    label: 'Subjects',       value: profile.subjects?.join(', ') || '—' },
  ] : []

  return (
    <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.content, { paddingHorizontal: hPad, paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar block */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarRing, shadows.md]}>
            <View style={styles.avatar}>
              <Text style={styles.initials}>{initials}</Text>
            </View>
          </View>
          <Text style={styles.name}>{fullName}</Text>
          <View style={styles.rolePill}>
            <Ionicons name="person-outline" size={12} color={colors.muted} />
            <Text style={styles.roleText}>B2C Learner</Text>
          </View>
        </View>

        {/* Edit button */}
        <TouchableOpacity
          style={[styles.editBtn, shadows.xs]}
          onPress={() => navigation.navigate('EditProfile')}
          activeOpacity={0.8}
        >
          <Ionicons name="pencil-outline" size={16} color={colors.ink} />
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>

        {/* Profile info */}
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.accent} size="small" />
          </View>
        ) : (
          <View style={[styles.infoCard, shadows.xs]}>
            <Text style={styles.infoCardTitle}>Profile Info</Text>
            {infoRows.map((r, i) => (
              <InfoRow
                key={r.label}
                icon={r.icon}
                label={r.label}
                value={r.value}
                last={i === infoRows.length - 1}
              />
            ))}
          </View>
        )}

        {/* Menu items */}
        <View style={[styles.menuCard, shadows.xs]}>
          <TouchableOpacity style={[styles.menuRow, styles.menuRowBorder]} activeOpacity={0.7}>
            <View style={[styles.menuIconWrap, { backgroundColor: colors.infoBg }]}>
              <Ionicons name="help-circle-outline" size={16} color={colors.info} />
            </View>
            <Text style={styles.menuText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.subtle} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7}>
            <View style={[styles.menuIconWrap, { backgroundColor: colors.warningBg }]}>
              <Ionicons name="shield-outline" size={16} color={colors.warning} />
            </View>
            <Text style={styles.menuText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.subtle} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={[styles.logoutBtn, shadows.xs]} onPress={logout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Eduraa v1.0.0</Text>
      </ScrollView>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface1 },
  content: { paddingTop: spacing[5], gap: spacing[4] },

  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing[4],
    gap: spacing[2],
  },
  avatarRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.card,
    padding: 4,
    marginBottom: spacing[1],
  },
  avatar: {
    flex: 1,
    borderRadius: 45,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontSize: 30, fontWeight: '800', color: colors.white },
  name: { fontSize: 22, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.surface2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  roleText: { fontSize: 12, color: colors.muted, fontWeight: '600' },

  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    height: 46,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  editBtnText: { fontSize: 14, fontWeight: '700', color: colors.ink },

  loadingWrap: { height: 80, alignItems: 'center', justifyContent: 'center' },

  infoCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[2],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  infoCardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.subtle,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
  },

  menuCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    paddingHorizontal: spacing[4],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
  },
  menuRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  menuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.ink },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    height: 50,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.dangerBorder,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: colors.danger },

  version: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.subtle,
    marginTop: -spacing[2],
    marginBottom: spacing[2],
  },
})
