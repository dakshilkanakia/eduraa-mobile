/**
 * Eduraa Mobile — Root Navigation
 * Bottom tabs + stacks for B2C student
 */

import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { ActivityIndicator, View } from 'react-native'

import { useAuthStore } from '../stores/authStore'
import { colors } from '../theme/colors'

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen'
import RegisterScreen from '../screens/auth/RegisterScreen'

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

// ─── Auth Navigator ───────────────────────────────────────────────────────────

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{ headerShown: false }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  )
}

// ─── Papers Stack ─────────────────────────────────────────────────────────────

function PapersNavigator() {
  return (
    <PapersStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface1 },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontFamily: 'Manrope', fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
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
    <ResultsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface1 },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontFamily: 'Manrope', fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <ResultsStack.Screen name="ResultsList" component={ResultsScreen} options={{ title: 'Results' }} />
      <ResultsStack.Screen name="ResultDetail" component={ResultDetailScreen} options={{ title: 'Result Detail' }} />
    </ResultsStack.Navigator>
  )
}

// ─── Profile Stack ────────────────────────────────────────────────────────────

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface1 },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontFamily: 'Manrope', fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: 'Profile' }} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
    </ProfileStack.Navigator>
  )
}

// ─── Main Tab Navigator ───────────────────────────────────────────────────────

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontFamily: 'Manrope',
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline'
              break
            case 'Papers':
              iconName = focused ? 'document-text' : 'document-text-outline'
              break
            case 'Results':
              iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline'
              break
            case 'AIStudio':
              iconName = focused ? 'sparkles' : 'sparkles-outline'
              break
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline'
              break
            default:
              iconName = 'ellipse-outline'
          }

          return <Ionicons name={iconName} size={22} color={color} />
        },
      })}
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

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface1 }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    )
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthNavigator />}
    </NavigationContainer>
  )
}
