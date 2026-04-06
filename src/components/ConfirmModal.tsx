import React from 'react'
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import colors from '../theme/colors'
import { spacing, radius, shadows } from '../theme/spacing'

interface ConfirmModalProps {
  visible: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  destructive?: boolean
}

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  destructive = false,
}: ConfirmModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, destructive && styles.confirmBtnDestructive]}
              onPress={onConfirm}
              activeOpacity={0.7}
            >
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing[6],
    width: '100%',
    maxWidth: 360,
    ...shadows.lg,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: spacing[2],
  },
  message: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
    marginBottom: spacing[6],
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.muted,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  confirmBtnDestructive: {
    backgroundColor: colors.danger,
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
})
