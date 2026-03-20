import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { b2cApi } from '../../api/b2c'
import { colors } from '../../theme/colors'
import { spacing, radius, shadows } from '../../theme/spacing'

export default function EditProfileScreen() {
  const navigation = useNavigation()
  const queryClient = useQueryClient()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['b2c-profile'],
    queryFn: b2cApi.getProfile,
  })

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name)
      setLastName(profile.last_name)
    }
  }, [profile])

  const updateMutation = useMutation({
    mutationFn: () =>
      b2cApi.updateProfile({
        first_name: firstName,
        last_name: lastName,
        password: currentPassword,
        education_level: profile!.education_level,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['b2c-profile'] })
      Alert.alert('Updated', 'Your profile has been updated.')
      navigation.goBack()
    },
    onError: (err: any) => {
      Alert.alert(
        'Update failed',
        err?.response?.data?.detail || 'Please check your password and try again.',
      )
    },
  })

  const fadeAnim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start()
  }, [fadeAnim])

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    )
  }

  const hPad = width < 380 ? spacing[4] : spacing[5]
  const inputStyle = (field: string) => [
    styles.inputWrap,
    focusedField === field && styles.inputWrapFocused,
  ]

  return (
    <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.content, { paddingHorizontal: hPad, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Info banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={16} color={colors.info} />
          <Text style={styles.infoText}>
            Your current password is required to save any changes.
          </Text>
        </View>

        {/* Name card */}
        <View style={styles.sectionTitle}>
          <Text style={styles.sectionLabel}>Personal Info</Text>
        </View>
        <View style={[styles.card, shadows.xs]}>
          <View style={styles.field}>
            <Text style={styles.label}>First Name</Text>
            <View style={inputStyle('firstName')}>
              <Ionicons name="person-outline" size={16} color={focusedField === 'firstName' ? colors.accent : colors.subtle} style={styles.fieldIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                placeholder="First name"
                placeholderTextColor={colors.placeholder}
                onFocus={() => setFocusedField('firstName')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Last Name</Text>
            <View style={inputStyle('lastName')}>
              <Ionicons name="person-outline" size={16} color={focusedField === 'lastName' ? colors.accent : colors.subtle} style={styles.fieldIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                placeholder="Last name"
                placeholderTextColor={colors.placeholder}
                onFocus={() => setFocusedField('lastName')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>
        </View>

        {/* Security card */}
        <View style={styles.sectionTitle}>
          <Text style={styles.sectionLabel}>Verification</Text>
        </View>
        <View style={[styles.card, shadows.xs]}>
          <View style={styles.field}>
            <Text style={styles.label}>Current Password <Text style={styles.required}>*</Text></Text>
            <View style={inputStyle('password')}>
              <Ionicons name="lock-closed-outline" size={16} color={focusedField === 'password' ? colors.accent : colors.subtle} style={styles.fieldIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showPassword}
                placeholder="Enter current password"
                placeholderTextColor={colors.placeholder}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={16} color={colors.subtle} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveBtn, shadows.sm, updateMutation.isPending && styles.saveBtnDisabled]}
          onPress={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          activeOpacity={0.82}
        >
          {updateMutation.isPending ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <View style={styles.saveBtnInner}>
              <Ionicons name="checkmark" size={18} color={colors.white} />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface1 },
  content: { paddingTop: spacing[4], gap: spacing[4] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    backgroundColor: colors.infoBg,
    borderRadius: radius.lg,
    padding: spacing[3],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.infoBorder,
  },
  infoText: {
    fontSize: 13,
    color: colors.infoText,
    flex: 1,
    lineHeight: 19,
  },

  sectionTitle: { paddingHorizontal: 2 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.subtle,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing[4],
  },

  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: '600', color: colors.ink, letterSpacing: 0.1 },
  required: { color: colors.accent },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    paddingHorizontal: spacing[3],
  },
  inputWrapFocused: {
    borderColor: colors.accent,
    backgroundColor: colors.card,
  },
  fieldIcon: { marginRight: spacing[2] },
  input: {
    fontSize: 15,
    color: colors.ink,
    paddingVertical: 0,
  },

  saveBtn: {
    height: 54,
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[2],
  },
  saveBtnDisabled: { opacity: 0.65 },
  saveBtnInner: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  saveBtnText: { color: colors.white, fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
})
