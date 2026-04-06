import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Linking,
  RefreshControl,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { rosterApi } from '../../api/roster'
import { colors } from '../../theme/colors'
import { spacing, radius, shadows } from '../../theme/spacing'
import type { TeacherRosterEntry, SubjectAssignment } from '../../types'
import BottomSheet from '../../components/BottomSheet'
import EmptyState from '../../components/EmptyState'

const TABS = ['Teachers', 'Subjects', 'Details'] as const
type TabType = typeof TABS[number]

// ─── Teacher Card ──────────────────────────────────────────────────────────────

function TeacherCard({
  teacher,
  isClassTeacher,
  onPress,
}: {
  teacher: TeacherRosterEntry
  isClassTeacher: boolean
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      style={[styles.card, shadows.xs]}
      onPress={onPress}
      activeOpacity={0.78}
    >
      <View style={styles.teacherAvatarRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(teacher.first_name[0] ?? '') + (teacher.last_name[0] ?? '')}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.teacherName}>
              {teacher.first_name} {teacher.last_name}
            </Text>
            {isClassTeacher ? (
              <View style={styles.classTeacherBadge}>
                <Text style={styles.classTeacherText}>Class Teacher</Text>
              </View>
            ) : null}
          </View>
          <TouchableOpacity
            onPress={() => teacher.email && Linking.openURL(`mailto:${teacher.email}`)}
          >
            <Text style={styles.teacherEmail}>{teacher.email}</Text>
          </TouchableOpacity>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.subtle} />
      </View>

      {teacher.subjects_taught.length > 0 ? (
        <View style={styles.subjectChips}>
          {teacher.subjects_taught.map((s) => (
            <View key={s} style={styles.chip}>
              <Text style={styles.chipText}>{s}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </TouchableOpacity>
  )
}

// ─── Subject Row ───────────────────────────────────────────────────────────────

function SubjectRow({ subject }: { subject: SubjectAssignment }) {
  return (
    <View style={styles.subjectRow}>
      <View style={styles.subjectIconWrap}>
        <Ionicons name="book-outline" size={16} color={colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.subjectName}>{subject.subject}</Text>
        <Text style={styles.subjectTeacher}>{subject.teacher_name}</Text>
      </View>
      {subject.is_class_teacher ? (
        <View style={styles.classTeacherBadge}>
          <Text style={styles.classTeacherText}>Class Teacher</Text>
        </View>
      ) : null}
    </View>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function StudentTeachersScreen() {
  const insets = useSafeAreaInsets()
  const [activeTab, setActiveTab] = useState<TabType>('Teachers')
  const [search, setSearch] = useState('')
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherRosterEntry | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const {
    data: teachersData,
    isLoading: teachersLoading,
    isError: teachersError,
    refetch: refetchTeachers,
  } = useQuery({
    queryKey: ['studentTeachers'],
    queryFn: rosterApi.getStudentTeachers,
  })

  const {
    data: masterProfile,
    isLoading: profileLoading,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ['studentMasterProfile'],
    queryFn: rosterApi.getStudentMasterProfile,
    enabled: activeTab === 'Details',
  })

  const onRefresh = async () => {
    setRefreshing(true)
    await Promise.all([refetchTeachers(), refetchProfile()])
    setRefreshing(false)
  }

  const isLoading = activeTab === 'Details' ? profileLoading : teachersLoading
  const isError = activeTab === 'Teachers' ? teachersError : false

  const teachers = teachersData?.teachers ?? []
  const subjects = teachersData?.subjects ?? []
  const classTeacherId = teachersData?.class_teacher_id

  const filteredTeachers = teachers.filter((t) => {
    const q = search.toLowerCase()
    if (!q) return true
    return (
      t.first_name.toLowerCase().includes(q) ||
      t.last_name.toLowerCase().includes(q) ||
      t.email?.toLowerCase().includes(q)
    )
  })

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[3] }]}>
        <Text style={styles.headerTitle}>My Teachers</Text>
        <View style={styles.tabRow}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.subtle} />
          <Text style={styles.errorText}>Failed to load</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : activeTab === 'Teachers' ? (
        <>
          <View style={styles.searchRow}>
            <View style={styles.searchWrap}>
              <Ionicons name="search-outline" size={16} color={colors.subtle} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search teachers..."
                placeholderTextColor={colors.placeholder}
                value={search}
                onChangeText={setSearch}
              />
              {search ? (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={16} color={colors.subtle} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          <FlatList
            data={filteredTeachers}
            keyExtractor={(t) => t.id}
            renderItem={({ item }) => (
              <TeacherCard
                teacher={item}
                isClassTeacher={item.id === classTeacherId}
                onPress={() => setSelectedTeacher(item)}
              />
            )}
            contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
            ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.accent}
                colors={[colors.accent]}
              />
            }
            ListEmptyComponent={
              <EmptyState
                icon="person-outline"
                title="No teachers found"
                subtitle={search ? 'Try a different search.' : 'No teachers assigned yet.'}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        </>
      ) : activeTab === 'Subjects' ? (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {subjects.length === 0 ? (
            <EmptyState
              icon="book-outline"
              title="No subjects"
              subtitle="No subject assignments found."
            />
          ) : (
            <View style={[styles.subjectCard, shadows.xs]}>
              {subjects.map((s, i) => (
                <View
                  key={`${s.subject}-${i}`}
                  style={[
                    i < subjects.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                  ]}
                >
                  <SubjectRow subject={s} />
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        // Details tab
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {profileLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : masterProfile ? (
            <>
              {/* Subject Mappings */}
              <Text style={styles.sectionLabel}>Subject Mappings</Text>
              {masterProfile.subject_mappings.length === 0 ? (
                <Text style={styles.emptyText}>No subject mappings.</Text>
              ) : (
                <View style={[styles.tableCard, shadows.xs]}>
                  <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 2 }]}>Subject</Text>
                    <Text style={[styles.tableCell, styles.tableCellHeader]}>Std</Text>
                    <Text style={[styles.tableCell, styles.tableCellHeader]}>Div</Text>
                    <Text style={[styles.tableCell, styles.tableCellHeader]}>Type</Text>
                  </View>
                  {masterProfile.subject_mappings.map((m, i) => (
                    <View
                      key={i}
                      style={[
                        styles.tableRow,
                        i < masterProfile.subject_mappings.length - 1 && styles.tableRowBorder,
                      ]}
                    >
                      <Text style={[styles.tableCell, { flex: 2 }]}>{m.subject_name}</Text>
                      <Text style={styles.tableCell}>{m.standard}</Text>
                      <Text style={styles.tableCell}>{m.division ?? '–'}</Text>
                      <Text style={[styles.tableCell, styles.tableCellMuted]}>{m.assignment_type}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Profile basics */}
              <Text style={[styles.sectionLabel, { marginTop: spacing[4] }]}>Your Profile</Text>
              <View style={[styles.card, shadows.xs]}>
                {[
                  { label: 'Board', value: masterProfile.profile.board },
                  { label: 'School', value: masterProfile.profile.school_name },
                  { label: 'Standard', value: masterProfile.profile.class_teacher_standard },
                  { label: 'Division', value: masterProfile.profile.class_teacher_division },
                ].filter((r) => r.value).map((row) => (
                  <View key={row.label} style={styles.profileRow}>
                    <Text style={styles.profileLabel}>{row.label}</Text>
                    <Text style={styles.profileValue}>{row.value}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}
        </ScrollView>
      )}

      {/* Teacher Detail BottomSheet */}
      <BottomSheet
        visible={!!selectedTeacher}
        onClose={() => setSelectedTeacher(null)}
        title={selectedTeacher ? `${selectedTeacher.first_name} ${selectedTeacher.last_name}` : ''}
      >
        {selectedTeacher ? (
          <View style={styles.sheetContent}>
            <View style={styles.sheetAvatarRow}>
              <View style={[styles.avatar, styles.avatarLarge]}>
                <Text style={[styles.avatarText, { fontSize: 22 }]}>
                  {(selectedTeacher.first_name[0] ?? '') + (selectedTeacher.last_name[0] ?? '')}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetName}>
                  {selectedTeacher.first_name} {selectedTeacher.last_name}
                </Text>
                {selectedTeacher.id === classTeacherId ? (
                  <View style={[styles.classTeacherBadge, { alignSelf: 'flex-start', marginTop: 4 }]}>
                    <Text style={styles.classTeacherText}>Class Teacher</Text>
                  </View>
                ) : null}
              </View>
            </View>

            <TouchableOpacity
              style={styles.emailRow}
              onPress={() => selectedTeacher.email && Linking.openURL(`mailto:${selectedTeacher.email}`)}
            >
              <Ionicons name="mail-outline" size={16} color={colors.accent} />
              <Text style={styles.emailText}>{selectedTeacher.email}</Text>
            </TouchableOpacity>

            {selectedTeacher.subjects_taught.length > 0 ? (
              <View style={styles.sheetSubjects}>
                <Text style={styles.sheetSectionLabel}>Subjects</Text>
                <View style={styles.subjectChips}>
                  {selectedTeacher.subjects_taught.map((s) => (
                    <View key={s} style={styles.chip}>
                      <Text style={styles.chipText}>{s}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        ) : null}
      </BottomSheet>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3], padding: spacing[5] },
  errorText: { fontSize: 14, color: colors.muted },
  retryBtn: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2],
    backgroundColor: colors.accent,
    borderRadius: radius.full,
  },
  retryText: { color: colors.white, fontWeight: '700' },

  header: {
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
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
  tabRow: { flexDirection: 'row', gap: spacing[1] },
  tab: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  tabActive: { borderBottomColor: colors.accent },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.muted },
  tabTextActive: { color: colors.accent },

  searchRow: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.surface1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing[3],
    height: 36,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.ink,
    paddingVertical: 0,
  },

  list: { paddingHorizontal: spacing[5], paddingTop: spacing[4] },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.subtle,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing[2],
  },
  emptyText: { fontSize: 14, color: colors.muted, textAlign: 'center', padding: spacing[4] },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing[2],
  },
  teacherAvatarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLarge: { width: 56, height: 56, borderRadius: 28 },
  avatarText: { fontSize: 15, fontWeight: '800', color: colors.white },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], flexWrap: 'wrap' },
  teacherName: { fontSize: 15, fontWeight: '700', color: colors.ink },
  teacherEmail: { fontSize: 12, color: colors.accent, marginTop: 2 },
  classTeacherBadge: {
    backgroundColor: colors.successBg,
    borderRadius: radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.successBorder,
  },
  classTeacherText: { fontSize: 10, fontWeight: '700', color: colors.successText },
  subjectChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.surface1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipText: { fontSize: 11, fontWeight: '600', color: colors.muted },

  subjectCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
  },
  subjectIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectName: { fontSize: 15, fontWeight: '700', color: colors.ink },
  subjectTeacher: { fontSize: 12, color: colors.muted, marginTop: 2 },

  tableCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tableRow: { flexDirection: 'row', paddingHorizontal: spacing[3], paddingVertical: spacing[2] },
  tableRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  tableHeader: { backgroundColor: colors.surface1 },
  tableCell: { flex: 1, fontSize: 12, color: colors.ink },
  tableCellHeader: { fontWeight: '700', color: colors.muted, fontSize: 10, textTransform: 'uppercase' },
  tableCellMuted: { color: colors.muted },

  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  profileLabel: { fontSize: 13, color: colors.muted },
  profileValue: { fontSize: 13, fontWeight: '600', color: colors.ink },

  // BottomSheet content
  sheetContent: { gap: spacing[4] },
  sheetAvatarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  sheetName: { fontSize: 18, fontWeight: '800', color: colors.ink },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  emailText: { fontSize: 14, color: colors.accent, fontWeight: '600' },
  sheetSubjects: { gap: spacing[2] },
  sheetSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.subtle,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
})
