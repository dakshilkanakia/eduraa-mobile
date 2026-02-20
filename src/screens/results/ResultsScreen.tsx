import React from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useQuery } from '@tanstack/react-query'
import type { ResultsStackParamList } from '../../navigation'
import { checkedPapersApi } from '../../api/checkedPapers'
import { colors } from '../../theme/colors'
import { spacing, radius } from '../../theme/spacing'
import type { CheckedPaper } from '../../types'

type Nav = NativeStackNavigationProp<ResultsStackParamList, 'ResultsList'>

const STATUS_COLORS: Record<string, string> = {
  completed: '#059669',
  processing: '#d97706',
  uploaded: '#3b82f6',
  needs_review: colors.accent,
}

export default function ResultsScreen() {
  const navigation = useNavigation<Nav>()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['checked-papers'],
    queryFn: () => checkedPapersApi.list({ page: 1, size: 20 }),
  })

  const renderItem = ({ item }: { item: CheckedPaper }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ResultDetail', { checkedPaperId: item.id })}
      activeOpacity={0.8}
    >
      <View style={styles.cardTop}>
        <Text style={styles.cardId}>Paper #{item.id.slice(0, 8)}</Text>
        <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] + '20', borderColor: STATUS_COLORS[item.status] }]}>
          <Text style={[styles.badgeText, { color: STATUS_COLORS[item.status] }]}>{item.status.replace('_', ' ')}</Text>
        </View>
      </View>
      {item.total_score !== undefined && item.max_score !== undefined ? (
        <Text style={styles.score}>{item.total_score} / {item.max_score}</Text>
      ) : (
        <Text style={styles.scorePending}>Score pending</Text>
      )}
      {item.grading_feedback && (
        <Text style={styles.feedback} numberOfLines={2}>{item.grading_feedback}</Text>
      )}
    </TouchableOpacity>
  )

  return (
    <View style={styles.root}>
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.accent} />
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Failed to load results.</Text>
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
              <Text style={styles.emptyText}>No results yet. Submit a paper to see results.</Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface1 },
  list: { padding: spacing[4], gap: spacing[3] },
  card: {
    backgroundColor: colors.card, borderRadius: radius.xl,
    padding: spacing[4], borderWidth: 1, borderColor: colors.border,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[2] },
  cardId: { fontSize: 13, fontWeight: '700', color: colors.ink },
  badge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radius.full, borderWidth: 1,
  },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  score: { fontSize: 22, fontWeight: '800', color: colors.accent },
  scorePending: { fontSize: 14, color: colors.muted },
  feedback: { fontSize: 12, color: colors.muted, marginTop: spacing[1] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[8] },
  errorText: { fontSize: 14, color: colors.muted, marginBottom: spacing[2] },
  retryText: { color: colors.accent, fontWeight: '700' },
  emptyText: { fontSize: 14, color: colors.muted, textAlign: 'center' },
})
