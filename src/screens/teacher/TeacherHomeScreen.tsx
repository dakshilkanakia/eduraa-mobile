import React, { useRef, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../stores/authStore'
import { papersApi } from '../../api/papers'
import { examsApi } from '../../api/exams'
import { scanApi } from '../../api/scan'
import { rosterApi } from '../../api/roster'
import { colors } from '../../theme/colors'
import { spacing, radius, shadows } from '../../theme/spacing'
import StatusBadge from '../../components/StatusBadge'

export default function TeacherHomeScreen() {
  const { user } = useAuthStore()
  const navigation = useNavigation<any>()
  const insets = useSafeAreaInsets()

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(16)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start()
  }, [])

  const { data: papersData, isRefetching: papersRefetching, refetch: refetchPapers } = useQuery({
    queryKey: ['teacherPapers'],
    queryFn: () => papersApi.list({ limit: 100 }),
  })

  const { data: exams, refetch: refetchExams } = useQuery({
    queryKey: ['teacherExams'],
    queryFn: examsApi.getTeacherExams,
  })

  const { data: checkedPapers, refetch: refetchChecked } = useQuery({
    queryKey: ['teacherCheckedPapers'],
    queryFn: () => scanApi.list(),
  })

  const { data: masterProfile, refetch: refetchProfile } = useQuery({
    queryKey: ['teacherMasterProfile'],
    queryFn: rosterApi.getTeacherMasterProfile,
  })

  const isRefetching = papersRefetching
  const onRefresh = async () => {
    await Promise.all([refetchPapers(), refetchExams(), refetchChecked(), refetchProfile()])
  }

  const firstName =
    masterProfile?.profile?.first_name ||
    user?.display_name?.split(' ')[0] ||
    'Teacher'

  const totalPapers = papersData?.items?.length ?? 0
  const totalExams = exams?.length ?? 0
  const totalStudents = masterProfile?.students_total_count ?? 0
  const pendingReviews = (checkedPapers ?? []).filter(
    (p) => p.needs_review || p.status === 'pending_manual_review'
  ).length

  const recentChecked = (checkedPapers ?? [])
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  const STATS = [
    { label: 'Papers', value: totalPapers, icon: 'document-text-outline' as const, color: '#0284C7', bg: '#F0F9FF' },
    { label: 'Exams', value: totalExams, icon: 'calendar-outline' as const, color: colors.accent, bg: colors.accentLight },
    { label: 'Students', value: totalStudents, icon: 'people-outline' as const, color: '#7C3AED', bg: '#F5F3FF' },
    { label: 'Pending Reviews', value: pendingReviews, icon: 'flag-outline' as const, color: pendingReviews > 0 ? colors.warning : colors.success, bg: pendingReviews > 0 ? colors.warningBg : colors.successBg },
  ]

  const QUICK_ACTIONS = [
    { label: 'Generate Paper', icon: 'add-circle-outline' as const, color: colors.accent, bg: colors.accentLight, onPress: () => navigation.navigate('TeacherPapers', { screen: 'GenerateTeacherPaper' }) },
    { label: 'New Exam', icon: 'calendar-outline' as const, color: '#0284C7', bg: '#F0F9FF', onPress: () => navigation.navigate('TeacherExams', { screen: 'CreateExam' }) },
    { label: 'Scan Paper', icon: 'camera-outline' as const, color: '#7C3AED', bg: '#F5F3FF', onPress: () => navigation.navigate('TeacherScan') },
  ]

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing[4], paddingBottom: insets.bottom + 32 },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={onRefresh}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Hello, {firstName}</Text>
            <View style={styles.rolePill}>
              <Ionicons name="school-outline" size={11} color={colors.accent} />
              <Text style={styles.roleText}>Teacher</Text>
            </View>
          </View>
          <View style={styles.brandMark}>
            <Ionicons name="sparkles" size={20} color={colors.white} />
          </View>
        </View>

        {/* Stats grid */}
        <Text style={styles.sectionLabel}>Overview</Text>
        <View style={styles.statsGrid}>
          {STATS.map((s) => (
            <View key={s.label} style={[styles.statCard, shadows.xs]}>
              <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
                <Ionicons name={s.icon} size={18} color={s.color} />
              </View>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick actions */}
        <Text style={styles.sectionLabel}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          {QUICK_ACTIONS.map((a) => (
            <TouchableOpacity
              key={a.label}
              style={[styles.actionCard, shadows.xs]}
              onPress={a.onPress}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: a.bg }]}>
                <Ionicons name={a.icon} size={22} color={a.color} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent activity */}
        {recentChecked.length > 0 ? (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>Recent Grading</Text>
              <TouchableOpacity onPress={() => navigation.navigate('TeacherScan')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <View style={{ gap: spacing[2] }}>
              {recentChecked.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.recentCard, shadows.xs]}
                  onPress={() => navigation.navigate('TeacherScan', { screen: 'TeacherGradingDetail', params: { checkedPaperId: item.id } })}
                  activeOpacity={0.78}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recentName} numberOfLines={1}>
                      {item.student_name ?? 'Unknown Student'}
                    </Text>
                    <Text style={styles.recentSub} numberOfLines={1}>
                      {item.exam_name ?? '—'} · {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                  <StatusBadge status={item.status} size="sm" />
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : null}

      </Animated.View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface1 },
  content: { paddingHorizontal: spacing[5] },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[5],
  },
  greeting: { fontSize: 22, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.accentLight,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.accentMid,
    marginTop: 4,
  },
  roleText: { fontSize: 11, fontWeight: '700', color: colors.accent },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.subtle,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing[3],
    marginTop: spacing[4],
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing[4],
    marginBottom: spacing[3],
  },
  seeAll: { fontSize: 12, fontWeight: '600', color: colors.accent },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  statCard: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing[2],
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 12, color: colors.muted, fontWeight: '600' },

  actionsRow: { flexDirection: 'row', gap: spacing[3] },
  actionCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing[4],
    alignItems: 'center',
    gap: spacing[2],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontSize: 11, fontWeight: '700', color: colors.ink, textAlign: 'center' },

  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing[3],
  },
  recentName: { fontSize: 14, fontWeight: '700', color: colors.ink },
  recentSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
})
