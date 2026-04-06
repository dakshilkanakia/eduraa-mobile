import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActionSheetIOS, Platform, Alert } from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import colors from '../theme/colors'
import { spacing, radius } from '../theme/spacing'

export interface PickedFile {
  uri: string
  name: string
  size?: number
  mimeType?: string
}

interface FileUploadButtonProps {
  onFilePicked: (files: PickedFile[]) => void
  accept?: 'pdf' | 'image' | 'any'
  label?: string
  multiple?: boolean
  files?: PickedFile[]
  onRemove?: (index: number) => void
}

export default function FileUploadButton({
  onFilePicked,
  accept = 'any',
  label = 'Add File',
  multiple = false,
  files = [],
  onRemove,
}: FileUploadButtonProps) {
  const [loading, setLoading] = useState(false)

  const pickDocument = async () => {
    setLoading(true)
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type:
          accept === 'pdf'
            ? 'application/pdf'
            : accept === 'image'
            ? 'image/*'
            : '*/*',
        multiple,
        copyToCacheDirectory: true,
      })
      if (!result.canceled && result.assets.length > 0) {
        const picked: PickedFile[] = result.assets.map((a) => ({
          uri: a.uri,
          name: a.name,
          size: a.size,
          mimeType: a.mimeType ?? undefined,
        }))
        onFilePicked(picked)
      }
    } finally {
      setLoading(false)
    }
  }

  const pickCamera = async () => {
    setLoading(true)
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Camera access is needed to take a photo.')
        return
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
      })
      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0]
        const name = asset.fileName ?? `photo_${Date.now()}.jpg`
        onFilePicked([{ uri: asset.uri, name, mimeType: asset.mimeType ?? 'image/jpeg' }])
      }
    } finally {
      setLoading(false)
    }
  }

  const showPicker = () => {
    if (accept === 'pdf') {
      pickDocument()
      return
    }
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Take Photo', 'Choose File', 'Cancel'], cancelButtonIndex: 2 },
        (idx) => {
          if (idx === 0) pickCamera()
          else if (idx === 1) pickDocument()
        }
      )
    } else {
      Alert.alert('Add File', 'Choose a source', [
        { text: 'Take Photo', onPress: pickCamera },
        { text: 'Choose File', onPress: pickDocument },
        { text: 'Cancel', style: 'cancel' },
      ])
    }
  }

  return (
    <View style={styles.container}>
      {files.length > 0 ? (
        <View style={styles.fileList}>
          {files.map((f, i) => (
            <View key={i} style={styles.fileRow}>
              <Ionicons name="document-outline" size={16} color={colors.accent} />
              <Text style={styles.fileName} numberOfLines={1}>
                {f.name}
              </Text>
              {f.size ? (
                <Text style={styles.fileSize}>{(f.size / 1024).toFixed(1)}KB</Text>
              ) : null}
              {onRemove ? (
                <TouchableOpacity onPress={() => onRemove(i)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={18} color={colors.muted} />
                </TouchableOpacity>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={showPicker}
        disabled={loading}
        activeOpacity={0.7}
      >
        <Ionicons name="cloud-upload-outline" size={20} color={colors.accent} />
        <Text style={styles.btnText}>{loading ? 'Loading...' : label}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[3],
  },
  fileList: {
    gap: spacing[2],
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[3],
    backgroundColor: colors.accentLight,
    borderRadius: radius.md,
  },
  fileName: {
    flex: 1,
    fontSize: 13,
    color: colors.ink,
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 11,
    color: colors.muted,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    padding: spacing[4],
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.accent,
    borderStyle: 'dashed',
    backgroundColor: colors.accentLight,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
})
