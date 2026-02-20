/**
 * Login Screen
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

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>

export default function LoginScreen() {
  const navigation = useNavigation<Nav>()
  const { setAuth } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and password.')
      return
    }

    setLoading(true)
    try {
      const authToken = await authApi.login({ username: email.trim(), password })
      await setAuth(authToken)
    } catch (err: any) {
      const message = err?.response?.data?.detail || 'Login failed. Please check your credentials.'
      Alert.alert('Login failed', message)
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
        {/* Brand Header */}
        <View style={styles.brand}>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>E</Text>
          </View>
          <Text style={styles.brandName}>Eduraa</Text>
          <Text style={styles.brandTagline}>AI-powered exam prep for Grade 11 & 12</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue your prep</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.subtle}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Your password"
              placeholderTextColor={colors.subtle}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerLinkText}>
              New to Eduraa?{' '}
              <Text style={styles.registerLinkAccent}>Create account</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing[6],
  },
  brand: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  brandMark: {
    width: 56,
    height: 56,
    borderRadius: radius.xl,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  brandMarkText: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '800',
  },
  brandName: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius['2xl'],
    padding: spacing[6],
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: spacing[5],
  },
  field: {
    marginBottom: spacing[4],
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink,
    textTransform: 'uppercase',
    letterSpacing: 0.08,
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
  button: {
    height: 50,
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[2],
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  registerLink: {
    marginTop: spacing[4],
    alignItems: 'center',
  },
  registerLinkText: {
    fontSize: 14,
    color: colors.muted,
  },
  registerLinkAccent: {
    color: colors.accent,
    fontWeight: '700',
  },
})
