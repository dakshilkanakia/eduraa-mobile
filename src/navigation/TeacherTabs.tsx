/**
 * Eduraa Mobile — Teacher Tab Navigator
 * Used for roles: teacher, principal, admin, school_super_admin
 *
 * NOTE: Teacher screens are being built progressively.
 * Stub screens are placeholders until each phase is complete.
 */

import React from 'react'
import { Platform } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { colors } from '../theme/colors'
import TeacherHomeScreen from '../screens/teacher/TeacherHomeScreen'
import TeacherPapersNavigator from './TeacherPapersNavigator'
import TeacherExamsNavigator from './TeacherExamsNavigator'
import TeacherScanNavigator from './TeacherScanNavigator'
import StudentsScreen from '../screens/teacher/StudentsScreen'
import TeacherProfileScreen from '../screens/teacher/TeacherProfileScreen'

// ─── Param list ───────────────────────────────────────────────────────────────

export type TeacherTabParamList = {
  TeacherHome: undefined
  TeacherPapers: undefined
  TeacherExams: undefined
  TeacherScan: undefined
  TeacherStudents: undefined
  TeacherProfile: undefined
}

const Tab = createBottomTabNavigator<TeacherTabParamList>()

// ─── Tab Icons ────────────────────────────────────────────────────────────────

type TabIconName = keyof typeof Ionicons.glyphMap
const TAB_ICONS: Record<string, [TabIconName, TabIconName]> = {
  TeacherHome:     ['home',             'home-outline'],
  TeacherPapers:   ['document-text',    'document-text-outline'],
  TeacherExams:    ['calendar',         'calendar-outline'],
  TeacherScan:     ['camera',           'camera-outline'],
  TeacherStudents: ['people',           'people-outline'],
  TeacherProfile:  ['person',           'person-outline'],
}

const TAB_LABELS: Record<string, string> = {
  TeacherHome:     'Home',
  TeacherPapers:   'Papers',
  TeacherExams:    'Exams',
  TeacherScan:     'Scan',
  TeacherStudents: 'Students',
  TeacherProfile:  'Profile',
}

// ─── TeacherTabs ──────────────────────────────────────────────────────────────

export default function TeacherTabs() {
  const insets = useSafeAreaInsets()
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
          tabBarLabel: TAB_LABELS[route.name] ?? route.name,
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? icons[0] : icons[1]} size={22} color={color} />
          ),
        }
      }}
    >
      <Tab.Screen name="TeacherHome" component={TeacherHomeScreen} />
      <Tab.Screen name="TeacherPapers" component={TeacherPapersNavigator} />
      <Tab.Screen name="TeacherExams" component={TeacherExamsNavigator} />
      <Tab.Screen name="TeacherScan" component={TeacherScanNavigator} />
      <Tab.Screen name="TeacherStudents" component={StudentsScreen} />
      <Tab.Screen name="TeacherProfile" component={TeacherProfileScreen} />
    </Tab.Navigator>
  )
}
