import React, { useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, SectionList, TouchableOpacity,
  ActivityIndicator, TextInput, RefreshControl, ScrollView, Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { rosterApi } from '../../api/roster'
import { colors } from '../../theme/colors'
import { spacing, radius, shadows } from '../../theme/spacing'
import type { StudentRosterEntry } from '../../types'
import BottomSheet from '../../components/BottomSheet'
import EmptyState from '../../components/EmptyState'

const TABS = ['Students', 'Details'] as const
type TabType = typeof TABS[number]

function StudentCard({ student, onPress }: { student: StudentRosterEntry; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.studentCard, shadows.xs]} onPress={onPress} activeOpacity={0.78}>
      <View style={styles.studentAvatar}>
        <Text style={styles.studentAvatarText}>
          {student.student_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.studentName}>{student.student_name}</Text>
        <Text style={styles.studentMeta}>
          {student.student_code} · Std {student.standard}{student.division ? `-${student.division}` : ''}
        </Text>
        {student.matched_subjects.length > 0 ? (
          <Text style={styles.studentSubjects} numberOfLines={1}>
            {student.matched_subjects.join(', ')}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.subtle} />
    </TouchableOpacity>
  )
}

export default function StudentsScreen() {
  const insets = useSafeAreaInsets()
  const [activeTab, setActiveTab] = useState<TabType>('Students')
  const [search, setSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<StudentRosterEntry | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const { data: masterProfile, isLoading, isError, refetch } = useQuery({
    queryKey: ['teacherMasterProfile'],
    queryFn: rosterApi.getTeacherMasterProfile,
  })

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const allStudents = masterProfile?.students ?? []
  const filteredStudents = allStudents.filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.student_name.toLowerCase().includes(q) ||
      s.student_code.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q)
    )
  })

  // Group by division
  const groupMap: Record<string, StudentRosterEntry[]> = {}
  filteredStudents.forEach(s => {
    const key = s.division ? `${s.standard}-${s.division}` : s.standard
    if (!groupMap[key]) groupMap[key] = []
    groupMap[key].push(s)
  })
  const sections = Object.entries(groupMap).map(([title, data]) => ({ title, data }))

  const profile = masterProfile?.profile
  const subjectMappings = masterProfile?.subject_mappings ?? []

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator color={colors.accent} size="large" /></View>
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.subtle} />
        <Text style={styles.errorText}>Failed to load</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[3] }]}>
        <Text style={styles.headerTitle}>Students</Text>
        <View style={styles.tabRow}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {activeTab === 'Students' ? (
        <>
          <View style={styles.searchRow}>
            <View style={styles.searchWrap}>
              <Ionicons name="search-outline" size={16} color={colors.subtle} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or ID..."
                placeholderTextColor={colors.placeholder}
                value={search}
                onChangeText={setSearch}
              />
              {search ? <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={16} color={colors.subtle} /></TouchableOpacity> : null}
            </View>
          </View>

          {masterProfile?.students_truncated ? (
            <View style={styles.truncatedBanner}>
              <Ionicons name="information-circle-outline" size={14} color={colors.warningText} />
              <Text style={styles.truncatedText}>
                Showing {masterProfile.students_returned_count} of {masterProfile.students_total_count} students
              </Text>
            </View>
          ) : null}

          <SectionList
            sections={sections}
            keyExtractor={item => item.student_id}
            renderSectionHeader={({ section }) => (
              <Text style={styles.sectionHeader}>{section.title}</Text>
            )}
            renderItem={({ item }) => (
              <StudentCard student={item} onPress={() => setSelectedStudent(item)} />
            )}
            contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
            ItemSeparatorComponent={() => <View style={{ height: spacing[2] }} />}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />
            }
            ListEmptyComponent={
              <EmptyState icon="people-outline" title="No students found" subtitle={search ? 'Try a different search.' : 'No students in your classes.'} />
            }
            showsVerticalScrollIndicator={false}
          />
        </>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile */}
          {profile ? (
            <>
              <Text style={styles.sectionLabel}>Your Profile</Text>
              <View style={[styles.card, shadows.xs]}>
                {[
                  { label: 'Name', value: `${profile.first_name} ${profile.last_name}` },
                  { label: 'Email', value: profile.email },
                  { label: 'School', value: profile.school_name },
                  { label: 'Board', value: profile.board },
                  { label: 'Standards', value: profile.standards_taught?.join(', ') },
                  { label: 'Divisions', value: profile.divisions_taught?.join(', ') },
                  { label: 'Subjects', value: profile.subjects_taught?.join(', ') },
                  {
                    label: 'Class Teacher',
                    value: profile.class_teacher_opt_in
                      ? `Yes — ${profile.class_teacher_standard ?? ''}${profile.class_teacher_division ? `-${profile.class_teacher_division}` : ''}`
                      : 'No',
                  },
                ].filter(r => r.value).map((row, i, arr) => (
                  <View key={row.label} style={[styles.profileRow, i < arr.length - 1 && styles.profileRowBorder]}>
                    <Text style={styles.profileLabel}>{row.label}</Text>
                    <Text style={styles.profileValue} numberOfLines={2}>{row.value}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {/* Subject mappings */}
          {subjectMappings.length > 0 ? (
            <>
              <Text style={[styles.sectionLabel, { marginTop: spacing[4] }]}>Subject Mappings</Text>
              <View style={[styles.tableCard, shadows.xs]}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  {['Subject', 'Std', 'Div', 'Type'].map(h => (
                    <Text key={h} style={[styles.tableCell, styles.tableCellHeader, h === 'Subject' && { flex: 2 }]}>{h}</Text>
                  ))}
                </View>
                {subjectMappings.map((m, i) => (
                  <View key={i} style={[styles.tableRow, i < subjectMappings.length - 1 && styles.tableRowBorder]}>
                    <Text style={[styles.tableCell, { flex: 2 }]}>{m.subject_name}</Text>
                    <Text style={styles.tableCell}>{m.standard}</Text>
                    <Text style={styles.tableCell}>{m.division ?? '–'}</Text>
                    <Text style={[styles.tableCell, styles.tableCellMuted]}>{m.assignment_type}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}
        </ScrollView>
      )}

      {/* Student detail bottom sheet */}
      <BottomSheet
        visible={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        title={selectedStudent?.student_name ?? ''}
      >
        {selectedStudent ? (
          <View style={styles.sheetContent}>
            {[
              { label: 'Student ID', value: selectedStudent.student_code },
              { label: 'Email', value: selectedStudent.email },
              { label: 'Board', value: selectedStudent.board },
              { label: 'Standard', value: `${selectedStudent.standard}${selectedStudent.division ? `-${selectedStudent.division}` : ''}` },
              { label: 'Shared Subjects', value: selectedStudent.matched_subjects.join(', ') || '—' },
              { label: 'Source', value: selectedStudent.source ?? '—' },
            ].map((row, i, arr) => (
              <View key={row.label} style={[styles.profileRow, i < arr.length - 1 && styles.profileRowBorder]}>
                <Text style={styles.profileLabel}>{row.label}</Text>
                <Text style={styles.profileValue}>{row.value}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </BottomSheet>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3] },
  errorText: { fontSize: 14, color: colors.muted },
  retryBtn: { paddingHorizontal: spacing[5], paddingVertical: spacing[2], backgroundColor: colors.accent, borderRadius: radius.full },
  retryText: { color: colors.white, fontWeight: '700' },
  header: { backgroundColor: colors.card, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, paddingHorizontal: spacing[5], paddingBottom: 0 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.ink, letterSpacing: -0.3, marginBottom: spacing[3] },
  tabRow: { flexDirection: 'row', gap: spacing[1] },
  tab: { paddingHorizontal: spacing[4], paddingVertical: spacing[2], borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  tabActive: { borderBottomColor: colors.accent },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.muted },
  tabTextActive: { color: colors.accent },
  searchRow: { paddingHorizontal: spacing[5], paddingVertical: spacing[3], backgroundColor: colors.card, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], backgroundColor: colors.surface1, borderRadius: radius.lg, paddingHorizontal: spacing[3], height: 36, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  searchInput: { flex: 1, fontSize: 14, color: colors.ink },
  truncatedBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], backgroundColor: colors.warningBg, paddingHorizontal: spacing[5], paddingVertical: spacing[2] },
  truncatedText: { fontSize: 12, color: colors.warningText },
  list: { paddingHorizontal: spacing[5], paddingTop: spacing[3] },
  sectionHeader: { fontSize: 11, fontWeight: '700', color: colors.subtle, textTransform: 'uppercase', letterSpacing: 0.8, paddingTop: spacing[3], paddingBottom: spacing[1] },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.subtle, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing[2] },
  studentCard: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing[4], borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  studentAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  studentAvatarText: { fontSize: 14, fontWeight: '800', color: colors.white },
  studentName: { fontSize: 14, fontWeight: '700', color: colors.ink },
  studentMeta: { fontSize: 11, color: colors.muted, marginTop: 1 },
  studentSubjects: { fontSize: 11, color: colors.accent, marginTop: 2 },
  card: { backgroundColor: colors.card, borderRadius: radius.xl, paddingHorizontal: spacing[4], borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  profileRow: { flexDirection: 'row', paddingVertical: spacing[3] },
  profileRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  profileLabel: { width: 110, fontSize: 13, color: colors.muted },
  profileValue: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.ink },
  tableCard: { backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', paddingHorizontal: spacing[3], paddingVertical: spacing[2] },
  tableRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  tableHeader: { backgroundColor: colors.surface1 },
  tableCell: { flex: 1, fontSize: 12, color: colors.ink },
  tableCellHeader: { fontWeight: '700', color: colors.muted, fontSize: 10, textTransform: 'uppercase' },
  tableCellMuted: { color: colors.muted },
  sheetContent: { gap: 0 },
})
