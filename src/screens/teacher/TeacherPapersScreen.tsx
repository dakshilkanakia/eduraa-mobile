import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { TeacherPapersStackParamList } from '../../navigation/TeacherPapersNavigator'
import { papersApi } from '../../api/papers'
import { colors } from '../../theme/colors'
import { spacing, radius, shadows } from '../../theme/spacing'
import type { PaperListItem } from '../../types'
import StatusBadge from '../../components/StatusBadge'
import FilterChip from '../../components/FilterChip'
import EmptyState from '../../components/EmptyState'

type Nav = NativeStackNavigationProp<TeacherPapersStackParamList, 'TeacherPapersList'>

const FILTER_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Published', value: 'published' },
]

function PaperCard({
  paper,
  onPress,
  onPublish,
  publishing,
}: {
  paper: PaperListItem
  onPress: () => void
  onPublish: () => void
  publishing: boolean
}) {
  return (
    <TouchableOpacity style={[styles.card, shadows.xs]} onPress={onPress} activeOpacity={0.78}>
      <View style={styles.cardTop}>
        <StatusBadge status={paper.status} size="sm" />
        <Text style={styles.dateText}>
          {new Date(paper.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>
      </View>

      <Text style={styles.paperTitle} numberOfLines={2}>{paper.title}</Text>

      <View style={styles.chipRow}>
        {paper.subject_name ? (
          <View style={styles.chip}>
            <Ionicons name="book-outline" size={11} color={colors.accent} />
            <Text style={styles.chipText}>{paper.subject_name}</Text>
          </View>
        ) : null}
        <View style={styles.chip}>
          <Ionicons name="star-outline" size={11} color={colors.muted} />
          <Text style={styles.chipText}>{paper.total_marks} marks</Text>
        </View>
        {paper.question_count ? (
          <View style={styles.chip}>
            <Ionicons name="help-circle-outline" size={11} color={colors.muted} />
            <Text style={styles.chipText}>{paper.question_count} questions</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.cardFooter}>
        {paper.status === 'draft' ? (
          <TouchableOpacity
            style={[styles.publishBtn, publishing && styles.publishBtnDisabled]}
            onPress={(e) => { e.stopPropagation(); onPublish() }}
            disabled={publishing}
          >
            {publishing ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.publishBtnText}>Publish</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.publishedChip}>
            <Ionicons name="checkmark-circle" size={12} color={colors.success} />
            <Text style={styles.publishedText}>Published</Text>
          </View>
        )}
        <View style={styles.viewLink}>
          <Text style={styles.viewLinkText}>View</Text>
          <Ionicons name="arrow-forward" size={13} color={colors.accent} />
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default function TeacherPapersScreen() {
  const navigation = useNavigation<Nav>()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('all')
  const [refreshing, setRefreshing] = useState(false)
  const [publishingId, setPublishingId] = useState<string | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['teacherPapers'],
    queryFn: () => papersApi.list({ limit: 100 }),
  })

  const publishMutation = useMutation({
    mutationFn: (paperId: string) => papersApi.publish(paperId),
    onMutate: (id) => setPublishingId(id),
    onSettled: () => {
      setPublishingId(null)
      queryClient.invalidateQueries({ queryKey: ['teacherPapers'] })
    },
  })

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const papers = data?.items ?? []
  const filtered = papers.filter((p) => statusFilter === 'all' || p.status === statusFilter)

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    )
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.subtle} />
        <Text style={styles.errorText}>Failed to load papers</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <View style={styles.filterRow}>
        <FilterChip
          options={FILTER_OPTIONS}
          selected={[statusFilter]}
          onChange={([v]) => setStatusFilter(v ?? 'all')}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <PaperCard
            paper={item}
            onPress={() => navigation.navigate('TeacherPaperDetail', { paperId: item.id })}
            onPublish={() => publishMutation.mutate(item.id)}
            publishing={publishingId === item.id}
          />
        )}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            title="No papers yet"
            subtitle="Generate your first paper."
            action={{ label: 'Generate Paper', onPress: () => navigation.navigate('GenerateTeacherPaper') }}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        onPress={() => navigation.navigate('GenerateTeacherPaper')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={26} color={colors.white} />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3] },
  errorText: { fontSize: 14, color: colors.muted },
  retryBtn: { paddingHorizontal: spacing[5], paddingVertical: spacing[2], backgroundColor: colors.accent, borderRadius: radius.full },
  retryText: { color: colors.white, fontWeight: '700' },
  filterRow: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  list: { paddingHorizontal: spacing[5], paddingTop: spacing[4] },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing[2],
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateText: { fontSize: 11, color: colors.subtle },
  paperTitle: { fontSize: 15, fontWeight: '700', color: colors.ink, lineHeight: 21 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.surface1,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
  },
  chipText: { fontSize: 11, fontWeight: '600', color: colors.muted },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing[1] },
  publishBtn: {
    backgroundColor: colors.accent, borderRadius: radius.full,
    paddingHorizontal: spacing[4], paddingVertical: spacing[2],
    minWidth: 72, alignItems: 'center',
  },
  publishBtnDisabled: { opacity: 0.5 },
  publishBtnText: { fontSize: 12, fontWeight: '700', color: colors.white },
  publishedChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  publishedText: { fontSize: 12, color: colors.success, fontWeight: '600' },
  viewLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewLinkText: { fontSize: 12, color: colors.accent, fontWeight: '700' },
  fab: {
    position: 'absolute',
    right: spacing[5],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
})
