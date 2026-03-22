/**
 * Verify Email Screen — OTP confirmation after registration
 */

import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Animated,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import type { AuthStackParamList } from '../../navigation'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../stores/authStore'
import { colors } from '../../theme/colors'
import { radius, spacing, shadows } from '../../theme/spacing'
import { fonts } from '../../theme/fonts'

type Nav = NativeStackNavigationProp<AuthStackParamList, 'VerifyEmail'>
type Route = RouteProp<AuthStackParamList, 'VerifyEmail'>

export default function VerifyEmailScreen() {
  const navigation = useNavigation<Nav>()
  const route = useRoute<Route>()
  const { setAuth } = useAuthStore()
  const insets = useSafeAreaInsets()

  const { email, devOtp } = route.params

  const [otp, setOtp] = useState(devOtp ?? '')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [focusedField, setFocusedField] = useState(false)

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(16)).current
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start()
  }, [fadeAnim, slideAnim])

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [])

  const startCountdown = () => {
    setCountdown(60)
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleVerify = async () => {
    if (!otp.trim() || otp.trim().length < 4) {
      Alert.alert('Enter OTP', 'Please enter the verification code.')
      return
    }
    setLoading(true)
    try {
      const authToken = await authApi.verifyEmailOtp(email, otp.trim())
      await setAuth(authToken)
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      Alert.alert(
        'Verification failed',
        typeof detail === 'string' ? detail : 'Invalid or expired code. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0) return
    setResending(true)
    try {
      const challenge = await authApi.resendEmailOtp(email)
      if (challenge.dev_otp) {
        setOtp(challenge.dev_otp)
      }
      startCountdown()
      Alert.alert('Code sent', 'A new verification code has been sent.')
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      Alert.alert('Failed', typeof detail === 'string' ? detail : 'Could not resend code.')
    } finally {
      setResending(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: spacing[5], paddingTop: insets.top + 16 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color={colors.ink} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Verify your email</Text>
              <Text style={styles.subtitle} numberOfLines={2}>
                We sent a code to{'\n'}<Text style={styles.emailHighlight}>{email}</Text>
              </Text>
            </View>
          </View>

          {/* Card */}
          <View style={[styles.card, shadows.sm]}>

            {/* Dev OTP notice */}
            {devOtp ? (
              <View style={styles.devBanner}>
                <Ionicons name="code-slash-outline" size={14} color={colors.warning} />
                <Text style={styles.devBannerText}>
                  Dev mode — code pre-filled: <Text style={{ fontWeight: '700' }}>{devOtp}</Text>
                </Text>
              </View>
            ) : (
              <View style={styles.infoBanner}>
                <Ionicons name="mail-outline" size={14} color={colors.info} />
                <Text style={styles.infoBannerText}>Check your inbox and spam folder.</Text>
              </View>
            )}

            {/* OTP Input */}
            <View style={styles.field}>
              <Text style={styles.label}>Verification code</Text>
              <View style={[styles.inputWrap, focusedField && styles.inputWrapFocused]}>
                <Ionicons
                  name="key-outline"
                  size={16}
                  color={focusedField ? colors.accent : colors.subtle}
                  style={styles.fieldIcon}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Enter code"
                  placeholderTextColor={colors.placeholder}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  autoFocus={!devOtp}
                  onFocus={() => setFocusedField(true)}
                  onBlur={() => setFocusedField(false)}
                  onSubmitEditing={handleVerify}
                />
              </View>
            </View>

            {/* Verify button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleVerify}
              disabled={loading}
              activeOpacity={0.82}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.buttonText}>Verify & Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Resend */}
            <TouchableOpacity
              style={styles.resendRow}
              onPress={handleResend}
              disabled={resending || countdown > 0}
              activeOpacity={0.7}
            >
              {resending ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Text style={styles.resendText}>
                  {countdown > 0
                    ? `Resend code in ${countdown}s`
                    : "Didn't receive a code? "}
                  {countdown === 0 && (
                    <Text style={styles.resendAccent}>Resend</Text>
                  )}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface1 },
  scroll: { flexGrow: 1, paddingBottom: 32 },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    marginBottom: spacing[5],
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: fonts.displayBold,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.muted,
    marginTop: 4,
    lineHeight: 18,
  },
  emailHighlight: {
    color: colors.ink,
    fontWeight: '600',
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius['2xl'],
    padding: spacing[5],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing[4],
  },

  devBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.warningBg,
    borderRadius: radius.lg,
    padding: spacing[3],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.warningBorder,
  },
  devBannerText: {
    fontSize: 12,
    color: colors.warningText,
    flex: 1,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.infoBg,
    borderRadius: radius.lg,
    padding: spacing[3],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.infoBorder,
  },
  infoBannerText: {
    fontSize: 12,
    color: colors.infoText,
    flex: 1,
  },

  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: '600', fontFamily: fonts.semibold, color: colors.ink, letterSpacing: 0.1 },
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
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.ink,
    paddingVertical: 0,
    letterSpacing: 4,
  },

  button: {
    height: 52,
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.65 },
  buttonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: fonts.bold,
    letterSpacing: 0.2,
  },

  resendRow: {
    alignItems: 'center',
    paddingVertical: spacing[1],
  },
  resendText: { fontSize: 13, color: colors.muted },
  resendAccent: { color: colors.accent, fontWeight: '700' },
})
