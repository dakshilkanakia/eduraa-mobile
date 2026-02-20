/**
 * Register Screen — B2C Individual Learner
 * Supports the full B2C registration flow (science_high_school, etc.)
 */

import React, { useState } from 'react'
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
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { AuthStackParamList } from '../../navigation'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../stores/authStore'
import { colors } from '../../theme/colors'
import { radius, spacing } from '../../theme/spacing'
import type { EducationLevel } from '../../types'

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Register'>

const EDUCATION_OPTIONS: { label: string; value: EducationLevel }[] = [
  { label: 'School (Grades 11–12)', value: 'science_high_school' },
  { label: 'Competitive Exams (JEE / NEET)', value: 'competitive_exams' },
  { label: 'Commerce (Grade 11–12)', value: 'commerce_high_school' },
  { label: 'Post Graduation', value: 'post_graduation' },
]

export default function RegisterScreen() {
  const navigation = useNavigation<Nav>()
  const { setAuth } = useAuthStore()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [educationLevel, setEducationLevel] = useState<EducationLevel>('science_high_school')
  const [standard, setStandard] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please fill in all required fields including last name.')
      return
    }
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const authToken = await authApi.registerIndividual({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        password,
        confirm_password: confirmPassword,
        education_level: educationLevel,
        standard: standard.trim() || undefined,
      })
      await setAuth(authToken)
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      const message = typeof detail === 'string' ? detail : 'Registration failed. Please try again.'
      Alert.alert('Registration failed', message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Join Eduraa and start practising</Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.field, { flex: 1, marginRight: spacing[2] }]}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="First"
                placeholderTextColor={colors.subtle}
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Last"
                placeholderTextColor={colors.subtle}
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.subtle}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password * (min 8 characters)</Text>
            <TextInput
              style={styles.input}
              placeholder="Create a password"
              placeholderTextColor={colors.subtle}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Confirm Password *</Text>
            <TextInput
              style={styles.input}
              placeholder="Repeat your password"
              placeholderTextColor={colors.subtle}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          {/* Education Level */}
          <View style={styles.field}>
            <Text style={styles.label}>I am preparing for</Text>
            <View style={styles.optionGrid}>
              {EDUCATION_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.optionPill,
                    educationLevel === opt.value && styles.optionPillActive,
                  ]}
                  onPress={() => setEducationLevel(opt.value)}
                >
                  <Text
                    style={[
                      styles.optionPillText,
                      educationLevel === opt.value && styles.optionPillTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Class / Standard</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 11 or 12"
              placeholderTextColor={colors.subtle}
              value={standard}
              onChangeText={setStandard}
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.goBack()}>
            <Text style={styles.loginLinkText}>
              Already have an account?{' '}
              <Text style={styles.loginLinkAccent}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface1 },
  scroll: { flexGrow: 1, padding: spacing[6] },
  header: { marginBottom: spacing[6] },
  backBtn: { marginBottom: spacing[4] },
  backText: { color: colors.accent, fontWeight: '600', fontSize: 14 },
  title: { fontSize: 26, fontWeight: '800', color: colors.ink, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.muted },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius['2xl'],
    padding: spacing[6],
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row' },
  field: { marginBottom: spacing[4] },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.ink,
    textTransform: 'uppercase',
    letterSpacing: 0.1,
    marginBottom: spacing[1],
  },
  input: {
    height: 48,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    paddingHorizontal: spacing[4],
    fontSize: 15,
    color: colors.ink,
  },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  optionPill: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
  },
  optionPillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  optionPillText: { fontSize: 12, fontWeight: '600', color: colors.muted },
  optionPillTextActive: { color: colors.white },
  button: {
    height: 50,
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[2],
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  loginLink: { marginTop: spacing[4], alignItems: 'center' },
  loginLinkText: { fontSize: 14, color: colors.muted },
  loginLinkAccent: { color: colors.accent, fontWeight: '700' },
})
