import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { scanApi } from '../api/scan'
import colors from '../theme/colors'
import { spacing, radius, shadows } from '../theme/spacing'

interface PageImageViewerProps {
  checkedPaperId: string
  pageCount: number
}

export default function PageImageViewer({ checkedPaperId, pageCount }: PageImageViewerProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPage(currentPage)
  }, [currentPage])

  const loadPage = async (page: number) => {
    setLoading(true)
    setError(null)
    try {
      const uri = await scanApi.getPage(checkedPaperId, page)
      setImageUri(uri)
    } catch {
      setError('Failed to load page')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      {/* Image area */}
      <ScrollView
        style={styles.imageScroll}
        contentContainerStyle={styles.imageContent}
        maximumZoomScale={4}
        minimumZoomScale={1}
        bouncesZoom
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />
        ) : error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={32} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => loadPage(currentPage)}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="contain"
          />
        ) : null}
      </ScrollView>

      {/* Pagination controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.navBtn, currentPage <= 1 && styles.navBtnDisabled]}
          onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage <= 1 || loading}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color={currentPage <= 1 ? colors.subtle : colors.accent} />
        </TouchableOpacity>

        <Text style={styles.pageIndicator}>
          Page {currentPage} of {pageCount}
        </Text>

        <TouchableOpacity
          style={[styles.navBtn, currentPage >= pageCount && styles.navBtnDisabled]}
          onPress={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
          disabled={currentPage >= pageCount || loading}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-forward" size={20} color={currentPage >= pageCount ? colors.subtle : colors.accent} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  imageScroll: {
    flex: 1,
  },
  imageContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
  },
  image: {
    width: '100%',
    aspectRatio: 0.707, // A4 ratio
  },
  loader: {
    paddingVertical: spacing[16],
  },
  errorBox: {
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[12],
  },
  errorText: {
    fontSize: 14,
    color: colors.danger,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  navBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  pageIndicator: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
  },
})
