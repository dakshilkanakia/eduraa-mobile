import React from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useQuery } from '@tanstack/react-query'
import type { PapersStackParamList } from '../../navigation'
import { papersApi } from '../../api/papers'
import { colors } from '../../theme/colors'
import { spacing, radius } from '../../theme/spacing'
import type { PaperListItem } from '../../types'

type Nav = NativeStackNavigationProp<PapersStackParamList, 'PapersList'>

export default function PapersScreen() {
  const navigation = useNavigation<Nav>()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['papers'],
    queryFn: () => papersApi.list({ skip: 0, limit: 50 }),
  })

  const renderItem = ({ item }: { item: PaperListItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('PaperDetail', { paperId: item.id })}
      activeOpacity={0.8}
    >
      <View style={styles.cardTop}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <View style={[styles.badge, item.status === 'published' && styles.badgePublished]}>
          <Text style={[styles.badgeText, item.status === 'published' && styles.badgeTextPublished]}>
            {item.status}
          </Text>
        </View>
      </View>
      <Text style={styles.cardMeta}>
        {item.total_marks} marks
        {item.duration_minutes ? ` · ${item.duration_minutes} min` : ''}
        {item.subject_name ? ` · ${item.subject_name}` : ''}
      </Text>
    </TouchableOpacity>
  )

  return (
    <View style={styles.root}>
      {/* Generate CTA */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.generateBtn}
          onPress={() => navigation.navigate('GeneratePaper')}
          activeOpacity={0.85}
        >
          <Text style={styles.generateBtnText}>+ Generate New Paper</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.accent} />
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Failed to load papers.</Text>
          <TouchableOpacity onPress={() => refetch()}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={data?.items || []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No papers yet. Generate your first one!</Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface1 },
  topBar: { padding: spacing[4], paddingBottom: spacing[2] },
  generateBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    paddingVertical: 12,
    alignItems: 'center',
  },
  generateBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  list: { padding: spacing[4], gap: spacing[3] },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing[2] },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.ink, marginRight: spacing[2] },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgePublished: { backgroundColor: '#d1fae5', borderColor: '#34d399' },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', color: colors.muted },
  badgeTextPublished: { color: '#059669' },
  cardMeta: { fontSize: 12, color: colors.muted },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[8] },
  errorText: { fontSize: 14, color: colors.muted, marginBottom: spacing[2] },
  retryText: { color: colors.accent, fontWeight: '700' },
  emptyText: { fontSize: 14, color: colors.muted, textAlign: 'center' },
})
