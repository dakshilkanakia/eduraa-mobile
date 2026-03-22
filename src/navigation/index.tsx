/**
 * Eduraa Mobile — Root Navigation
 * Bottom tabs + stacks for B2C student
 */

import React, { useRef, useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import {
  ActivityIndicator, View, Platform, Animated, StyleSheet,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuthStore } from '../stores/authStore'
import { colors } from '../theme/colors'
import { shadows } from '../theme/spacing'

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen'
import RegisterScreen from '../screens/auth/RegisterScreen'
import VerifyEmailScreen from '../screens/auth/VerifyEmailScreen'

// Main Screens
import HomeScreen from '../screens/home/HomeScreen'
import PapersScreen from '../screens/papers/PapersScreen'
import GeneratePaperScreen from '../screens/papers/GeneratePaperScreen'
import PaperDetailScreen from '../screens/papers/PaperDetailScreen'
import AttemptPaperScreen from '../screens/papers/AttemptPaperScreen'
import ResultsScreen from '../screens/results/ResultsScreen'
import ResultDetailScreen from '../screens/results/ResultDetailScreen'
import QuizScreen from '../screens/papers/QuizScreen'
import AIStudioScreen from '../screens/studio/AIStudioScreen'
import ProfileScreen from '../screens/profile/ProfileScreen'
import EditProfileScreen from '../screens/profile/EditProfileScreen'

// ─── Stack Param Lists ────────────────────────────────────────────────────────

export type AuthStackParamList = {
  Login: undefined
  Register: undefined
  VerifyEmail: { email: string; devOtp?: string }
}

export type PapersStackParamList = {
  PapersList: undefined
  GeneratePaper: undefined
  PaperDetail: { paperId: string }
  AttemptPaper: { paperId: string; examId?: string }
  Quiz: { paperId: string }
}

export type ResultsStackParamList = {
  ResultsList: undefined
  ResultDetail: { submissionId?: string; checkedPaperId?: string }
}

export type ProfileStackParamList = {
  ProfileMain: undefined
  EditProfile: undefined
}

export type TabParamList = {
  Home: undefined
  Papers: undefined
  Results: undefined
  AIStudio: undefined
  Profile: undefined
}

// ─── Navigators ───────────────────────────────────────────────────────────────

const AuthStack = createNativeStackNavigator<AuthStackParamList>()
const PapersStack = createNativeStackNavigator<PapersStackParamList>()
const ResultsStack = createNativeStackNavigator<ResultsStackParamList>()
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>()
const Tab = createBottomTabNavigator<TabParamList>()

// Shared stack screen options
const stackScreenOptions = {
  headerStyle: {
    backgroundColor: colors.card,
  },
  headerTintColor: colors.ink,
  headerTitleStyle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.ink,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  headerShadowVisible: false,
  headerBackTitleVisible: false,
  // Smooth native transitions
  animation: 'slide_from_right' as const,
  contentStyle: { backgroundColor: colors.surface1 },
}

// ─── Auth Navigator ───────────────────────────────────────────────────────────

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
    </AuthStack.Navigator>
  )
}

// ─── Papers Stack ─────────────────────────────────────────────────────────────

function PapersNavigator() {
  return (
    <PapersStack.Navigator screenOptions={stackScreenOptions}>
      <PapersStack.Screen name="PapersList" component={PapersScreen} options={{ title: 'My Papers' }} />
      <PapersStack.Screen name="GeneratePaper" component={GeneratePaperScreen} options={{ title: 'Generate Paper' }} />
      <PapersStack.Screen name="PaperDetail" component={PaperDetailScreen} options={{ title: 'Paper Details' }} />
      <PapersStack.Screen name="AttemptPaper" component={AttemptPaperScreen} options={{ headerShown: false }} />
      <PapersStack.Screen name="Quiz" component={QuizScreen} options={{ headerShown: false }} />
    </PapersStack.Navigator>
  )
}

// ─── Results Stack ────────────────────────────────────────────────────────────

function ResultsNavigator() {
  return (
    <ResultsStack.Navigator screenOptions={stackScreenOptions}>
      <ResultsStack.Screen name="ResultsList" component={ResultsScreen} options={{ title: 'Results' }} />
      <ResultsStack.Screen name="ResultDetail" component={ResultDetailScreen} options={{ title: 'Result Detail' }} />
    </ResultsStack.Navigator>
  )
}

// ─── Profile Stack ────────────────────────────────────────────────────────────

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={stackScreenOptions}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: 'Profile' }} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
    </ProfileStack.Navigator>
  )
}

// ─── Tab Icon ─────────────────────────────────────────────────────────────────

type TabIconName = keyof typeof Ionicons.glyphMap

const TAB_ICONS: Record<string, [TabIconName, TabIconName]> = {
  Home:     ['home',              'home-outline'],
  Papers:   ['document-text',     'document-text-outline'],
  Results:  ['checkmark-circle',  'checkmark-circle-outline'],
  AIStudio: ['sparkles',          'sparkles-outline'],
  Profile:  ['person',            'person-outline'],
}

// ─── Main Tab Navigator ───────────────────────────────────────────────────────

function MainTabs() {
  const insets = useSafeAreaInsets()

  // Tab bar height: 49px content + bottom safe area
  const tabBarHeight = 52 + Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0)

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const icons = TAB_ICONS[route.name] ?? ['ellipse', 'ellipse-outline']
        return {
          headerShown: false,
          tabBarActiveTintColor: '#ffffff',
          tabBarInactiveTintColor: colors.sidebarText,
          tabBarStyle: {
            backgroundColor: colors.sidebar,
            borderTopWidth: 0,
            height: tabBarHeight,
            paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 6),
            paddingTop: 6,
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.2,
                shadowRadius: 12,
              },
              android: { elevation: 12 },
            }),
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
            marginTop: -2,
            fontFamily: 'Manrope_600SemiBold',
          },
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? icons[0] : icons[1]}
              size={22}
              color={color}
            />
          ),
        }
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Papers" component={PapersNavigator} />
      <Tab.Screen name="Results" component={ResultsNavigator} />
      <Tab.Screen name="AIStudio" component={AIStudioScreen} options={{ title: 'AI Studio' }} />
      <Tab.Screen name="Profile" component={ProfileNavigator} />
    </Tab.Navigator>
  )
}

// ─── Root Navigator ───────────────────────────────────────────────────────────

export default function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuthStore()
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!isLoading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start()
    }
  }, [isLoading, fadeAnim])

  if (isLoading) {
    return (
      <View style={loadingStyles.root}>
        <View style={loadingStyles.mark}>
          <Ionicons name="sparkles" size={28} color={colors.white} />
        </View>
        <ActivityIndicator
          size="small"
          color={colors.subtle}
          style={{ marginTop: 32 }}
        />
      </View>
    )
  }

  return (
    <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
      <NavigationContainer>
        {isAuthenticated ? <MainTabs /> : <AuthNavigator />}
      </NavigationContainer>
    </Animated.View>
  )
}

const loadingStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
