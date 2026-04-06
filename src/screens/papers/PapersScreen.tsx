import React, { useRef, useEffect } from 'react'
import {
  View,
  Text,
  FlatList,
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
import type { StudentPapersStackParamList } from '../../navigation/StudentTabs'
import { papersApi } from '../../api/papers'
import { colors } from '../../theme/colors'
import { spacing, radius, shadows } from '../../theme/spacing'
import { fonts } from '../../theme/fonts'
import type { PaperListItem } from '../../types'

type Nav = NativeStackNavigationProp<StudentPapersStackParamList, 'PapersList'>

function PaperCard({ item, onPress }: { item: PaperListItem; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.card, shadows.xs]} onPress={onPress} activeOpacity={0.78}>
      <View style={styles.cardTop}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
      </View>
      <View style={styles.cardMeta}>
        {item.subject_name ? (
          <View style={styles.metaChip}>
            <Ionicons name="book-outline" size={11} color={colors.muted} />
            <Text style={styles.metaText}>{item.subject_name}</Text>
          </View>
        ) : null}
        <View style={styles.metaChip}>
          <Ionicons name="star-outline" size={11} color={colors.muted} />
          <Text style={styles.metaText}>{item.total_marks} marks</Text>
        </View>
        {item.duration_minutes ? (
          <View style={styles.metaChip}>
            <Ionicons name="time-outline" size={11} color={colors.muted} />
            <Text style={styles.metaText}>{item.duration_minutes} min</Text>
          </View>
        ) : null}
        {item.question_count ? (
          <View style={styles.metaChip}>
            <Ionicons name="help-circle-outline" size={11} color={colors.muted} />
            <Text style={styles.metaText}>{item.question_count} Qs</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.cardArrow}>
        <Ionicons name="arrow-forward" size={14} color={colors.subtle} />
      </View>
    </TouchableOpacity>
  )
}

export default function PapersScreen() {
  const navigation = useNavigation<Nav>()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['papers'],
    queryFn: () => papersApi.list({ skip: 0, limit: 50 }),
  })

  // Entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start()
  }, [fadeAnim])

  const isSmall = width < 380
  const hPad = isSmall ? spacing[4] : spacing[5]

  return (
    <Animated.View style={[styles.root, { opacity: fadeAnim }]}>
      {/* Generate CTA banner */}
      <View style={[styles.topBanner, { paddingHorizontal: hPad }]}>
        <TouchableOpacity
          style={[styles.generateBtn, shadows.sm]}
          onPress={() => navigation.navigate('GeneratePaper')}
          activeOpacity={0.82}
        >
          <View style={styles.generateBtnLeft}>
            <View style={styles.generateIcon}>
              <Ionicons name="add" size={20} color={colors.white} />
            </View>
            <View>
              <Text style={styles.generateBtnTitle}>Generate New Paper</Text>
              <Text style={styles.generateBtnSub}>AI-powered, customised for you</Text>
            </View>
          </View>
          <Ionicons name="arrow-forward-circle" size={24} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.subtle} />
          <Text style={styles.errorText}>Failed to load papers</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={data?.items || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PaperCard
              item={item}
              onPress={() => navigation.navigate('PaperDetail', { paperId: item.id })}
            />
          )}
          contentContainerStyle={[
            styles.list,
            { paddingHorizontal: hPad, paddingBottom: insets.bottom + 24 },
          ]}
          ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="document-text-outline" size={32} color={colors.subtle} />
              </View>
              <Text style={styles.emptyTitle}>No papers yet</Text>
              <Text style={styles.emptyBody}>Generate your first paper to get started.</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface1 },

  topBanner: {
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
  },
  generateBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.xl,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  generateBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
  },
  generateIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateBtnTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.bold,
    color: colors.white,
  },
  generateBtnSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 1,
  },

  list: { paddingTop: spacing[2] },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: fonts.bold,
    color: colors.ink,
    flex: 1,
    lineHeight: 21,
  },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.muted,
  },
  cardArrow: {
    alignItems: 'flex-end',
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3] },
  errorText: { fontSize: 14, color: colors.muted },
  retryBtn: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2],
    backgroundColor: colors.accent,
    borderRadius: radius.full,
  },
  retryText: { color: colors.white, fontWeight: '700', fontSize: 14 },

  empty: {
    alignItems: 'center',
    paddingTop: spacing[10],
    gap: spacing[3],
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: radius['2xl'],
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', fontFamily: fonts.displaySemibold, color: colors.ink },
  emptyBody: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.muted,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 20,
  },
})
